import { NextResponse } from "next/server";
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

async function lerCaso(alertaIdHex: string) {
  const id = Buffer.from(alertaIdHex, "hex");
  const endereco = pdaCaso(id);
  const prog = programa(comite());

  const conta = await prog.account.caso.fetchNullable(endereco);
  if (!conta) return null;

  const responsavel = papelDe(conta.custodiante);
  const pendentePara = conta.pendentePara ? papelDe(conta.pendentePara) : null;

  const assinaturas = await conexao().getSignaturesForAddress(endereco, {
    limit: 25,
  });

  return {
    alertaId: hex(conta.alertaId as number[]),
    endereco: endereco.toBase58(),
    linkConta: exploradorConta(endereco.toBase58()),
    responsavel,
    responsavelChave: conta.custodiante.toBase58(),
    pendentePara,
    agenteHash: hex(conta.agenteHash as number[]),
    estado: lerEstado(conta.estado as Record<string, unknown>),
    // Instantes on-chain vêm em segundos; a interface trabalha em milissegundos.
    prazo: conta.prazo.toNumber() * 1000,
    criadoEm: conta.criadoEm.toNumber() * 1000,
    trilhaHash: hex(conta.trilhaHash as number[]),
    eventos: conta.eventos,
    registros: assinaturas
      .slice()
      .reverse()
      .map((s) => ({
        assinatura: s.signature,
        ts: (s.blockTime ?? 0) * 1000,
        erro: Boolean(s.err),
      })),
  };
}

export async function GET(req: Request) {
  const alertaId = new URL(req.url).searchParams.get("alertaId");
  if (!alertaId) {
    return NextResponse.json({ erro: "alertaId ausente" }, { status: 400 });
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
        const prog = programa(emissor);
        const id = bytesAleatorios();
        const assinatura = await prog.methods
          .abrirCaso(
            Array.from(id),
            instituicao("creas").publicKey,
            Array.from(crypto.getRandomValues(new Uint8Array(32))),
            new (await import("@coral-xyz/anchor")).BN(prazoValido(corpo.prazoSeg)),
          )
          .accountsPartial({
            caso: pdaCaso(id),
            emissor: pdaInstituicao(emissor.publicKey),
            autoridade: emissor.publicKey,
          })
          .rpc();
        return NextResponse.json({
          alertaId: id.toString("hex"),
          assinatura,
        });
      }

      case "transferir": {
        const { alertaId, destino } = corpo;
        if (!alertaId || !destino) throw new Error("faltam dados");
        const id = Buffer.from(alertaId, "hex");
        const atual = await lerCaso(alertaId);
        if (!atual?.responsavel) throw new Error("caso sem responsável conhecido");
        const quemAssina = instituicao(atual.responsavel);
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
        const prog = programa(destino);
        const assinatura = await prog.methods
          .aceitar(
            new (await import("@coral-xyz/anchor")).BN(prazoValido(corpo.prazoSeg)),
            Array.from(crypto.getRandomValues(new Uint8Array(32))),
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
        const atual = await lerCaso(alertaId);
        if (!atual?.responsavel) throw new Error("caso sem responsável conhecido");
        const quemAssina = instituicao(atual.responsavel);
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
    const msg = String(e);
    return NextResponse.json({ erro: msg }, { status: 400 });
  }
}

export type { PublicKey };
