import { NextResponse } from "next/server";
import { ComputeBudgetProgram, PublicKey, Transaction } from "@solana/web3.js";
import {
  comite,
  conexao,
  explorador,
  instituicao,
  pdaConfig,
  programa,
} from "@/lib/cadeia";
import { MUNICIPIO_IBGE, lerGrupo, pdaGrupo, raizDe } from "@/lib/zk/grupo";
import { compromissoDoSinal } from "@/lib/zk/registro";
import { paraBytes32, provaParaBytes } from "@/lib/zk/formato";
import { apelidoDaCrianca } from "@/lib/pseudonimo";
import { CRIANCA_FICTICIA } from "@/lib/fixtures";
import { SETORES, type Setor } from "@/lib/tipos";
import { registrar } from "@/lib/log";
import { CUSTO, LimiteExcedido, permitirEscrita } from "@/lib/guarda";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * O relayer do sinal credenciado.
 *
 * Ele existe por razão estrutural, não por conveniência: a rede exige que
 * alguém assine e pague a taxa. Se fosse o próprio profissional a pagar, a
 * carteira dele apareceria ligada ao sinal e o anonimato acabaria antes de
 * começar. O relayer é quem quebra esse elo.
 *
 * O que ele vê: a prova, o setor, o peso e o compromisso. O que ele não
 * consegue saber: de quem é a prova. Nem hoje, nem com computador quântico — a
 * prova é estatisticamente independente de quem a produziu.
 *
 * O que ele **vê e não deveria**: o endereço de rede de quem chamou. Proteger
 * isso exige uma camada a mais, e está declarado como limitação em /estado.
 */

function pdaNulificador(anulador: Buffer) {
  return PublicKey.findProgramAddressSync(
    [new TextEncoder().encode("nulificador"), anulador],
    programa(comite()).programId,
  )[0];
}

/**
 * O período que fecha o escopo do anulador: um sinal protegido por profissional,
 * por setor, por mês.
 *
 * O limite é por período e não por criança de propósito. Ligá-lo à criança
 * exigiria pôr na rede um valor estável por criança, e é exatamente isso que o
 * projeto não faz. A troca está declarada.
 */
function periodoAtual(): number {
  const agora = new Date();
  return agora.getFullYear() * 100 + (agora.getMonth() + 1);
}

const setorValido = (s: unknown): s is Setor =>
  typeof s === "string" && (SETORES as string[]).includes(s);

export async function GET(req: Request) {
  const setor = new URL(req.url).searchParams.get("setor") ?? "educacao";
  if (!setorValido(setor)) {
    return NextResponse.json({ erro: "setor inválido" }, { status: 400 });
  }
  try {
    return NextResponse.json({
      grupo: await lerGrupo(setor),
      municipioIbge: MUNICIPIO_IBGE,
      periodo: periodoAtual(),
      // O apelido **não** vai daqui. Quem emite o sinal protegido o calcula no
      // próprio navegador, por consulta embaralhada, para não precisar contar a
      // ninguém de qual criança se trata.
    });
  } catch (e) {
    return NextResponse.json({ erro: String(e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  let corpo: {
    acao: string;
    setor?: string;
    compromisso?: string;
    anulador?: string;
    pontos?: string[];
    peso?: number;
    sal?: string;
  };
  try {
    corpo = await req.json();
  } catch {
    return NextResponse.json({ erro: "corpo inválido" }, { status: 400 });
  }

  if (!setorValido(corpo.setor)) {
    return NextResponse.json({ erro: "setor inválido" }, { status: 400 });
  }
  const setor = corpo.setor;

  try {
    switch (corpo.acao) {
      /**
       * Credencia um profissional no setor.
       *
       * Nesta demonstração basta pedir. Num sistema de verdade quem credencia é
       * o setor de pessoal da instituição — criptografia nenhuma tem como saber
       * se alguém é mesmo professor.
       */
      case "credenciar": {
        if (!corpo.compromisso) throw new Error("falta o compromisso");
        const atual = await lerGrupo(setor);
        if (!atual) throw new Error("o grupo deste setor não está cadastrado");
        if (atual.folhas.includes(corpo.compromisso)) {
          return NextResponse.json({ jaCredenciado: true, grupo: atual });
        }

        const novaRaiz = await raizDe([...atual.folhas, corpo.compromisso]);

        // Quem credencia é o órgão responsável do município, e não o comitê que
        // faz o cruzamento. Separar os papéis evita que quem cruza os sinais
        // escolha também quem tem direito de emitir sinal.
        const credenciador = instituicao("creas");
        await permitirEscrita(req, "credenciar", credenciador);
        const prog = programa(credenciador);
        const assinatura = await prog.methods
          .adicionarCredenciados(
            [Array.from(paraBytes32(corpo.compromisso))],
            Array.from(Buffer.from(novaRaiz, "hex")),
          )
          .accountsPartial({
            config: pdaConfig(),
            grupo: pdaGrupo(setor),
            credenciador: credenciador.publicKey,
          })
          .rpc();

        const atualizado = await lerGrupo(setor);
        registrar(
          "cadeia",
          "profissional credenciado no setor",
          {
            setor,
            "credenciados agora": atualizado?.membros ?? 0,
            "quem credenciou": "órgão responsável do município",
            "a folha foi a evento": "sim — a árvore é refazível por qualquer um",
          },
          assinatura,
        );

        return NextResponse.json({
          assinatura,
          link: explorador(assinatura),
          grupo: atualizado,
        });
      }

      /**
       * Registra o sinal na rede.
       *
       * A transação é montada à mão, com o relayer como **único** signatário. O
       * atalho do Anchor faria a carteira do provider assinar junto, e aí
       * haveria dois — o que enfraqueceria justamente o que esta tela mostra.
       *
       * Não abre caso: só dá ao profissional o direito de entrar no cruzamento
       * sem se identificar. O caso continua nascendo da convergência.
       */
      case "registrar": {
        const { anulador, pontos, peso, sal } = corpo;
        if (!anulador || !pontos || !peso || !sal) {
          throw new Error("faltam dados do sinal");
        }
        if (peso !== 1 && peso !== 2) throw new Error("peso inválido");

        const apelido = apelidoDaCrianca(CRIANCA_FICTICIA.identificador);
        const compromisso = compromissoDoSinal(apelido, peso, sal);
        const anuladorBytes = paraBytes32(anulador);
        const relayer = comite();
        await permitirEscrita(req, "registrar sinal", relayer, CUSTO.registrar_sinal);
        const prog = programa(relayer);

        const instrucao = await prog.methods
          .registrarSinalCredenciado(
            Array.from(provaParaBytes(pontos)),
            Array.from(anuladorBytes),
            periodoAtual(),
            peso,
            Array.from(Buffer.from(compromisso, "hex")),
          )
          .accountsPartial({
            grupo: pdaGrupo(setor),
            nulificador: pdaNulificador(anuladorBytes),
            pagador: relayer.publicKey,
          })
          .instruction();

        const rede = conexao();
        const tx = new Transaction()
          .add(ComputeBudgetProgram.setComputeUnitLimit({ units: 400_000 }))
          .add(instrucao);
        tx.feePayer = relayer.publicKey;
        tx.recentBlockhash = (await rede.getLatestBlockhash("confirmed")).blockhash;
        tx.sign(relayer);

        const assinatura = await rede.sendRawTransaction(tx.serialize());
        await rede.confirmTransaction(assinatura, "confirmed");

        // O consumo real da conferência, lido da própria transação.
        const confirmada = await rede.getTransaction(assinatura, {
          commitment: "confirmed",
          maxSupportedTransactionVersion: 0,
        });
        const linha = (confirmada?.meta?.logMessages ?? []).find(
          (l) => l.includes(prog.programId.toBase58()) && l.includes("consumed"),
        );
        const consumo = Number(linha?.match(/consumed (\d+) of/)?.[1] ?? 0);

        registrar(
          "zk",
          "prova conferida pela rede, não por nós",
          {
            "quem conferiu": "o programa on-chain",
            custo: `${consumo.toLocaleString("pt-BR")} unidades de computação`,
            "assinaturas na transação": 1,
            "órgão assinou": "nenhum",
            "quem autorizou": "a prova",
          },
          assinatura,
        );

        return NextResponse.json({
          assinatura,
          link: explorador(assinatura),
          relayer: relayer.publicKey.toBase58(),
          compromisso,
        });
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
