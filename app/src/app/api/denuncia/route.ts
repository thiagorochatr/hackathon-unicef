import { NextResponse } from "next/server";
import { ComputeBudgetProgram, PublicKey, Transaction } from "@solana/web3.js";
import {
  comite,
  conexao,
  explorador,
  instituicao,
  pdaCaso,
  pdaConfig,
  programa,
} from "@/lib/cadeia";
import { hashDoAgente } from "@/lib/agente";
import {
  MUNICIPIO_IBGE,
  lerGrupo,
  pdaGrupo,
  raizDe,
} from "@/lib/zk/grupo";
import { paraBytes32, provaParaBytes } from "@/lib/zk/formato";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * O relayer da denúncia protegida.
 *
 * Ele existe por uma razão estrutural, não por conveniência: a rede exige que
 * alguém assine e pague a taxa. Se fosse o próprio profissional a pagar, a
 * carteira dele apareceria ligada à denúncia e o anonimato acabaria antes de
 * começar. O relayer é quem quebra esse elo.
 *
 * O que ele vê: a prova, o caso e o anulador. O que ele não consegue saber:
 * de quem é a prova. Nem hoje, nem com computador quântico — a prova é
 * estatisticamente independente de quem a produziu.
 *
 * O que ele **vê e não deveria**: o endereço de IP de quem chamou. Proteger
 * isso exige rede de anonimato, e está declarado como limitação em /estado.
 */

const PRAZO_PADRAO = 120;

function pdaNulificador(anulador: Buffer) {
  return PublicKey.findProgramAddressSync(
    [new TextEncoder().encode("nulificador"), anulador],
    programa(comite()).programId,
  )[0];
}

/** O período que define o escopo: um credenciado denuncia uma vez por mês. */
function periodoAtual(): number {
  const agora = new Date();
  return agora.getFullYear() * 100 + (agora.getMonth() + 1);
}

export async function GET() {
  try {
    const grupo = await lerGrupo();
    return NextResponse.json({
      grupo,
      municipioIbge: MUNICIPIO_IBGE,
      periodo: periodoAtual(),
    });
  } catch (e) {
    return NextResponse.json({ erro: String(e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  let corpo: {
    acao: string;
    compromisso?: string;
    alertaId?: string;
    anulador?: string;
    pontos?: string[];
    prazoSeg?: number;
  };
  try {
    corpo = await req.json();
  } catch {
    return NextResponse.json({ erro: "corpo inválido" }, { status: 400 });
  }

  try {
    switch (corpo.acao) {
      /**
       * Credencia um profissional.
       *
       * Nesta demonstração basta pedir. Num sistema de verdade quem credencia é
       * o setor de pessoal da instituição, e isso está declarado — a
       * criptografia não tem como saber se alguém é mesmo professor.
       */
      case "credenciar": {
        if (!corpo.compromisso) throw new Error("falta o compromisso");
        const atual = await lerGrupo();
        if (!atual) throw new Error("o grupo do município não está cadastrado");
        if (atual.folhas.includes(corpo.compromisso)) {
          return NextResponse.json({ jaCredenciado: true, grupo: atual });
        }

        const folhas = [...atual.folhas, corpo.compromisso];
        const novaRaiz = await raizDe(folhas);

        // Quem credencia é o órgão responsável do município, e não o comitê que
        // faz o cruzamento. Separar os dois papéis evita que quem cruza os
        // sinais escolha também quem tem direito de denunciar.
        const credenciador = instituicao("creas");
        const prog = programa(credenciador);
        const assinatura = await prog.methods
          .adicionarCredenciados(
            [Array.from(paraBytes32(corpo.compromisso))],
            Array.from(Buffer.from(novaRaiz, "hex")),
          )
          .accountsPartial({
            config: pdaConfig(),
            grupo: pdaGrupo(),
            credenciador: credenciador.publicKey,
          })
          .rpc();

        return NextResponse.json({
          assinatura,
          link: explorador(assinatura),
          grupo: await lerGrupo(),
        });
      }

      /**
       * Repassa a denúncia para a rede.
       *
       * Repare que a transação é montada à mão, com o relayer como **único**
       * signatário. O atalho do Anchor faria a carteira do provider assinar
       * junto, e aí haveria dois — o que enfraqueceria justamente o que esta
       * tela quer mostrar.
       */
      case "denunciar": {
        const { alertaId, anulador, pontos } = corpo;
        if (!alertaId || !anulador || !pontos) throw new Error("faltam dados da prova");

        const id = Buffer.from(alertaId, "hex");
        if (id.length !== 32) throw new Error("alertaId precisa ter 32 bytes");
        const anuladorBytes = paraBytes32(anulador);
        const relayer = comite();
        const prog = programa(relayer);

        const instrucao = await prog.methods
          .abrirCasoPorDenuncia(
            Array.from(id),
            Array.from(provaParaBytes(pontos)),
            Array.from(anuladorBytes),
            periodoAtual(),
            hashDoAgente("creas"),
            new (await import("@coral-xyz/anchor")).BN(corpo.prazoSeg ?? PRAZO_PADRAO),
          )
          .accountsPartial({
            caso: pdaCaso(id),
            grupo: pdaGrupo(),
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

        return NextResponse.json({
          alertaId,
          assinatura,
          link: explorador(assinatura),
          relayer: relayer.publicKey.toBase58(),
          responsavel: instituicao("creas").publicKey.toBase58(),
        });
      }

      default:
        return NextResponse.json({ erro: "ação desconhecida" }, { status: 400 });
    }
  } catch (e) {
    return NextResponse.json({ erro: String(e) }, { status: 400 });
  }
}
