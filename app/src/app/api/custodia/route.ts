import { NextResponse } from "next/server";
import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import {
  comite,
  conexao,
  exploradorConta,
  instituicao,
  pdaCaso,
  pdaConfig,
  pdaInstituicao,
  papelDe,
  programa,
} from "@/lib/cadeia";
import type { Estado, Papel } from "@/lib/tipos";
import { confereAgente, hashDoAgente, identificacaoDoAgente } from "@/lib/agente";
import { registrar } from "@/lib/log";
import { CUSTO, LimiteExcedido, permitirEscrita } from "@/lib/guarda";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PRAZO_PADRAO = 120;
const PRAZO_MIN = 10;
const PRAZO_MAX = 3600;

/** Não confia no que vem da tela: prazo fora da faixa vira o padrão. */
function prazoValido(bruto: unknown): number {
  const n = Number(bruto);
  if (!Number.isFinite(n)) return PRAZO_PADRAO;
  return Math.min(PRAZO_MAX, Math.max(PRAZO_MIN, Math.round(n)));
}

/**
 * Que passo foi cada transação da trilha.
 *
 * ## De onde sai
 *
 * A conta do caso guarda só o estado **de agora**. Ela não diz que já houve uma
 * escalada, e não pode dizer: caber em 189 bytes fixos é o que permite afirmar
 * que não há mais nada lá dentro. O histórico vive nas transações, e o Anchor
 * escreve o nome da instrução no log de cada uma — `Instruction: Escalar`.
 *
 * ## Por que tem cache
 *
 * Transação confirmada não muda nunca, e a tela do caso relê a cada poucos
 * segundos. Sem cache, cada leitura buscaria a trilha inteira de novo e a rede
 * pública de testes devolveria 429 — que foi exatamente o que aconteceu ao medir.
 * Guardando por assinatura, só as transações novas custam alguma coisa.
 */
const tipoPorAssinatura = new Map<string, string>();

const PASSO: Record<string, string> = {
  AbrirCaso: "caso aberto",
  AbrirCasoPorDenuncia: "caso aberto por denúncia protegida",
  TransferirPara: "passado adiante",
  Aceitar: "recebimento confirmado",
  Escalar: "prazo venceu — foi ao Ministério Público",
  RegistrarDesfecho: "desfecho registrado",
};

const MARCA = "Program log: Instruction: ";

/**
 * Uma por vez, e não em lote.
 *
 * `getParsedTransactions` manda tudo num pedido só, o que parecia melhor — mas a
 * rede pública de testes recusa esse método com "too many requests for a
 * specific RPC call" mesmo quando aceita os outros. Medido: o lote falhava e a
 * trilha ficava sem rótulo, enquanto `getTransaction` avulso passava.
 *
 * Sai barato porque o cache já filtrou: numa providência assinada, isto é uma
 * chamada só, para a transação nova.
 */
async function tiposDaTrilha(assinaturas: string[]): Promise<Map<string, string>> {
  const faltando = assinaturas.filter((s) => !tipoPorAssinatura.has(s)).slice(0, 8);
  const rede = conexao();
  for (const assinatura of faltando) {
    try {
      const tx = await rede.getTransaction(assinatura, {
        maxSupportedTransactionVersion: 0,
      });
      const linha = tx?.meta?.logMessages?.find((l) => l.includes(MARCA));
      const nome = linha?.split(MARCA)[1]?.trim();
      if (nome) tipoPorAssinatura.set(assinatura, nome);
    } catch {
      // Rede recusando: esta transação fica sem rótulo e a próxima leitura tenta
      // de novo, porque nada foi guardado. A trilha continua aparecendo — é
      // melhor uma linha sem nome do que a tela do caso inteira falhando.
    }
  }
  return tipoPorAssinatura;
}

/** O enum vem do Anchor como { aberto: {} }; aqui vira string. */
function lerEstado(bruto: Record<string, unknown>): Estado {
  const chave = Object.keys(bruto)[0];
  const mapa: Record<string, Estado> = {
    aberto: "Aberto",
    pendenteAceite: "PendenteAceite",
    emAtendimento: "EmAtendimento",
    escalado: "Escalado",
    encerrado: "Encerrado",
  };
  return mapa[chave] ?? "Aberto";
}

const hex = (bytes: number[]) =>
  bytes.map((b) => b.toString(16).padStart(2, "0")).join("");

function bytesAleatorios(): Buffer {
  return Buffer.from(crypto.getRandomValues(new Uint8Array(32)));
}

/**
 * Uma leitura só, dividida por todas as telas abertas.
 *
 * Cada leitura de caso custa três chamadas à rede, e agora existem sete telas
 * que releem sozinhas de três em três segundos — os seis portais e o
 * visualizador. Com três abas abertas ao mesmo tempo isso vira uma chamada por
 * segundo contra a rede pública de testes, que responde 429 e derruba a tela
 * inteira. Foi medido, não suposto.
 *
 * Com esta janela curta, N abas custam o mesmo que uma. O atraso é menor que o
 * intervalo com que as telas já releem, então nada fica visivelmente parado — e
 * uma providência assinada aparece na volta seguinte, como já aparecia.
 *
 * Uma chamada em voo é reaproveitada em vez de duplicada: sem isso, três abas
 * chegando juntas ainda disparariam três leituras, porque nenhuma teria
 * terminado a tempo de preencher o cache.
 */
const JANELA_MS = 1500;
const leituras = new Map<
  string,
  { quando: number; promessa: Promise<Awaited<ReturnType<typeof buscarCaso>>> }
>();

function lerCaso(alertaIdHex: string) {
  const agora = Date.now();
  const guardada = leituras.get(alertaIdHex);
  if (guardada && agora - guardada.quando < JANELA_MS) return guardada.promessa;
  return lerCasoAgora(alertaIdHex);
}

/**
 * Leitura sem janela, para quem vai **escrever**.
 *
 * As instruções de passar adiante, aceitar e encerrar escolhem qual chave assina
 * a partir de quem é o responsável agora. Uma leitura de um segundo e meio atrás
 * escolheria a chave anterior, o programa recusaria a transação com razão, e a
 * tela mostraria um erro que não é erro de ninguém. Quem escreve pergunta à rede.
 */
function lerCasoAgora(alertaIdHex: string) {
  const promessa = buscarCaso(alertaIdHex).catch((e) => {
    // Falha não fica guardada: a próxima tentativa tem que ir à rede de novo.
    leituras.delete(alertaIdHex);
    throw e;
  });
  leituras.set(alertaIdHex, { quando: Date.now(), promessa });
  return promessa;
}

async function buscarCaso(alertaIdHex: string) {
  const id = Buffer.from(alertaIdHex, "hex");
  const endereco = pdaCaso(id);
  const prog = programa(comite());

  const conta = await prog.account.caso.fetchNullable(endereco);
  if (!conta) return null;

  const responsavel = papelDe(conta.custodiante);
  const pendentePara = conta.pendentePara ? papelDe(conta.pendentePara) : null;

  const conexaoRede = conexao();
  const [assinaturas, contaBruta] = await Promise.all([
    conexaoRede.getSignaturesForAddress(endereco, { limit: 25 }),
    conexaoRede.getAccountInfo(endereco),
  ]);

  const agenteHex = hex(conta.agenteHash as number[]);
  const tipos = await tiposDaTrilha(assinaturas.map((s) => s.signature));

  return {
    alertaId: hex(conta.alertaId as number[]),
    endereco: endereco.toBase58(),
    linkConta: exploradorConta(endereco.toBase58()),
    responsavel,
    responsavelChave: conta.custodiante.toBase58(),
    pendentePara,
    agenteHash: agenteHex,
    // Refazemos a conta do resumo aqui e dizemos se bate. É o que permite
    // provar depois quem respondia, sem que o nome esteja na rede.
    agenteIdentificacao: responsavel ? identificacaoDoAgente(responsavel) : null,
    agenteConfere: responsavel ? confereAgente(responsavel, agenteHex) : false,
    bytesNaRede: contaBruta?.data.length ?? 0,
    brutoHex: contaBruta ? contaBruta.data.toString("hex") : "",
    estado: lerEstado(conta.estado as Record<string, unknown>),
    // Instantes on-chain vêm em segundos; a interface trabalha em milissegundos.
    prazo: conta.prazo.toNumber() * 1000,
    criadoEm: conta.criadoEm.toNumber() * 1000,
    trilhaHash: hex(conta.trilhaHash as number[]),
    eventos: conta.eventos,
    registros: assinaturas
      .slice()
      .reverse()
      .map((s) => {
        const nome = tipos.get(s.signature);
        return {
          assinatura: s.signature,
          ts: (s.blockTime ?? 0) * 1000,
          erro: Boolean(s.err),
          /** Nome cru da instrução, como o Anchor o escreveu no log. */
          instrucao: nome ?? null,
          /** O mesmo passo em português, quando é um que a gente conhece. */
          passo: nome ? (PASSO[nome] ?? nome) : null,
        };
      }),
  };
}

/**
 * Os casos de um órgão, perguntados à rede.
 *
 * ## O que isto substitui
 *
 * Antes, qual caso olhar vinha do navegador: um número guardado no `localStorage`
 * quando o cruzamento abria o caso. Funcionava para quem percorria o roteiro
 * inteiro na mesma janela, e só para essa pessoa — quem abrisse `/creas` em outro
 * aparelho via um portal vazio, embora o caso existisse na rede. O sistema de um
 * órgão de verdade não é avisado por um navegador sobre qual caso é dele.
 *
 * ## Como a rede responde isso
 *
 * A conta do caso guarda quem responde por ele num lugar fixo: depois dos 8 bytes
 * que dizem o tipo da conta e dos 32 do número do alerta, os 32 seguintes são a
 * chave do custodiante. Então dá para pedir à rede todas as contas deste programa
 * em que aqueles bytes são a chave deste órgão.
 *
 * São duas perguntas, porque um caso pode interessar ao órgão de dois jeitos:
 *
 * - **custodiante** — ele responde pelo caso agora;
 * - **pendente para ele** — outro órgão passou e ele ainda não confirmou. Repare
 *   que aqui o custodiante ainda é o outro, de propósito: passar adiante não tira
 *   a responsabilidade de quem passou. Sem esta segunda pergunta, um caso passado
 *   ao Conselho Tutelar não apareceria na tela do Conselho.
 */
const DESLOCAMENTO_CUSTODIANTE = 8 + 32;
const DESLOCAMENTO_PENDENTE = DESLOCAMENTO_CUSTODIANTE + 32;
/** `Option` em Borsh começa com um byte: 0 é vazio, 1 é preenchido. */
const MARCA_PREENCHIDO = anchor.utils.bytes.bs58.encode(Buffer.from([1]));

async function casosDoOrgao(papel: Papel) {
  const chave = instituicao(papel).publicKey.toBase58();
  const prog = programa(comite());

  const [respondePor, passadosParaEle] = await Promise.all([
    prog.account.caso.all([
      { memcmp: { offset: DESLOCAMENTO_CUSTODIANTE, bytes: chave } },
    ]),
    prog.account.caso.all([
      { memcmp: { offset: DESLOCAMENTO_PENDENTE, bytes: MARCA_PREENCHIDO } },
      { memcmp: { offset: DESLOCAMENTO_PENDENTE + 1, bytes: chave } },
    ]),
  ]);

  const porEndereco = new Map<string, (typeof respondePor)[number]>();
  for (const c of [...respondePor, ...passadosParaEle]) {
    porEndereco.set(c.publicKey.toBase58(), c);
  }

  return [...porEndereco.values()]
    .map(({ account: a }) => ({
      alertaId: hex(a.alertaId as number[]),
      responsavel: papelDe(a.custodiante),
      pendentePara: a.pendentePara ? papelDe(a.pendentePara) : null,
      estado: lerEstado(a.estado as Record<string, unknown>),
      prazo: a.prazo.toNumber() * 1000,
      criadoEm: a.criadoEm.toNumber() * 1000,
      eventos: a.eventos,
    }))
    // Mais recente primeiro: é o que o profissional quer ver ao abrir a tela.
    .sort((x, y) => y.criadoEm - x.criadoEm);
}

/** Mesma janela curta da leitura de caso, e pelo mesmo motivo. */
const listas = new Map<
  string,
  { quando: number; promessa: ReturnType<typeof casosDoOrgao> }
>();

function listarCasos(papel: Papel) {
  const agora = Date.now();
  const guardada = listas.get(papel);
  if (guardada && agora - guardada.quando < JANELA_MS) return guardada.promessa;
  const promessa = casosDoOrgao(papel).catch((e) => {
    listas.delete(papel);
    throw e;
  });
  listas.set(papel, { quando: agora, promessa });
  return promessa;
}

const PAPEIS_VALIDOS = new Set<string>(["ubs", "escola", "cras", "creas", "ct", "mp"]);

export async function GET(req: Request) {
  const busca = new URL(req.url).searchParams;
  const papel = busca.get("papel");

  if (papel) {
    if (!PAPEIS_VALIDOS.has(papel)) {
      return NextResponse.json({ erro: "papel desconhecido" }, { status: 400 });
    }
    try {
      return NextResponse.json({ casos: await listarCasos(papel as Papel) });
    } catch (e) {
      return NextResponse.json({ erro: String(e) }, { status: 500 });
    }
  }

  const alertaId = busca.get("alertaId");
  if (!alertaId) {
    return NextResponse.json({ erro: "alertaId ou papel ausente" }, { status: 400 });
  }
  try {
    const caso = await lerCaso(alertaId);
    return NextResponse.json({ caso });
  } catch (e) {
    return NextResponse.json({ erro: String(e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  let corpo: {
    acao: string;
    alertaId?: string;
    destino?: Papel;
    quem?: Papel;
    prazoSeg?: number;
  };
  try {
    corpo = await req.json();
  } catch {
    return NextResponse.json({ erro: "corpo inválido" }, { status: 400 });
  }

  try {
    switch (corpo.acao) {
      // Quem assina é o comitê que fez o cruzamento. O CREAS entra como
      // responsável sem participar da transação: o caso nasce com o relógio
      // correndo contra ele, quer ele queira ou não.
      case "abrir": {
        const emissor = comite();
        await permitirEscrita(req, "abrir caso", emissor, CUSTO.abrir_caso);
        const prog = programa(emissor);
        const id = bytesAleatorios();
        const assinatura = await prog.methods
          .abrirCaso(
            Array.from(id),
            instituicao("creas").publicKey,
            hashDoAgente("creas"),
            new (await import("@coral-xyz/anchor")).BN(prazoValido(corpo.prazoSeg)),
          )
          .accountsPartial({
            caso: pdaCaso(id),
            emissor: pdaInstituicao(emissor.publicKey),
            autoridade: emissor.publicKey,
          })
          .rpc();
        registrar(
          "cadeia",
          "caso aberto na rede",
          {
            responsável: "CREAS",
            "o responsável assinou": "não — o caso nasce contra ele",
            "dado de criança na transação": "nenhum",
          },
          assinatura,
        );
        return NextResponse.json({
          alertaId: id.toString("hex"),
          assinatura,
        });
      }

      case "transferir": {
        const { alertaId, destino } = corpo;
        if (!alertaId || !destino) throw new Error("faltam dados");
        const id = Buffer.from(alertaId, "hex");
        const atual = await lerCasoAgora(alertaId);
        if (!atual?.responsavel) throw new Error("caso sem responsável conhecido");
        const quemAssina = instituicao(atual.responsavel);
        await permitirEscrita(req, "passar adiante", quemAssina);
        const prog = programa(quemAssina);
        const assinatura = await prog.methods
          .transferirPara(instituicao(destino).publicKey)
          .accountsPartial({
            caso: pdaCaso(id),
            custodiante: quemAssina.publicKey,
          })
          .rpc();
        return NextResponse.json({ assinatura });
      }

      case "aceitar": {
        const { alertaId, quem } = corpo;
        if (!alertaId || !quem) throw new Error("faltam dados");
        const id = Buffer.from(alertaId, "hex");
        const destino = instituicao(quem);
        await permitirEscrita(req, "aceitar", destino);
        const prog = programa(destino);
        const assinatura = await prog.methods
          .aceitar(
            new (await import("@coral-xyz/anchor")).BN(prazoValido(corpo.prazoSeg)),
            hashDoAgente(quem),
          )
          .accountsPartial({ caso: pdaCaso(id), destino: destino.publicKey })
          .rpc();
        return NextResponse.json({ assinatura });
      }

      // Qualquer chave pode fazer isto depois do prazo. Usamos a do comitê só
      // porque ela já está à mão — o programa não exige nenhuma em especial.
      case "escalar": {
        const { alertaId } = corpo;
        if (!alertaId) throw new Error("faltam dados");
        const id = Buffer.from(alertaId, "hex");
        const pagador = comite();
        await permitirEscrita(req, "levar ao MP", pagador);
        const prog = programa(pagador);
        const assinatura = await prog.methods
          .escalar(new (await import("@coral-xyz/anchor")).BN(prazoValido(corpo.prazoSeg) * 4))
          .accountsPartial({
            config: pdaConfig(),
            caso: pdaCaso(id),
            pagador: pagador.publicKey,
          })
          .rpc();
        return NextResponse.json({ assinatura });
      }

      case "desfecho": {
        const { alertaId } = corpo;
        if (!alertaId) throw new Error("faltam dados");
        const id = Buffer.from(alertaId, "hex");
        const atual = await lerCasoAgora(alertaId);
        if (!atual?.responsavel) throw new Error("caso sem responsável conhecido");
        const quemAssina = instituicao(atual.responsavel);
        await permitirEscrita(req, "encerrar", quemAssina);
        const prog = programa(quemAssina);
        const assinatura = await prog.methods
          .registrarDesfecho(
            Array.from(crypto.getRandomValues(new Uint8Array(32))),
          )
          .accountsPartial({
            caso: pdaCaso(id),
            custodiante: quemAssina.publicKey,
          })
          .rpc();
        return NextResponse.json({ assinatura });
      }

      default:
        return NextResponse.json({ erro: "ação desconhecida" }, { status: 400 });
    }
  } catch (e) {
    if (e instanceof LimiteExcedido) {
      return NextResponse.json({ erro: e.message }, { status: 429 });
    }
    return NextResponse.json({ erro: String(e) }, { status: 400 });
  }
}

export type { PublicKey };
