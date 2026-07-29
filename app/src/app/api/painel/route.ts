import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import {
  comite,
  exploradorConta,
  instituicao,
  pdaAncora,
  pdaInstituicao,
  programa,
} from "@/lib/cadeia";
import { INSTITUICOES_ANCORAM } from "@/lib/fixtures";
import type { Papel } from "@/lib/tipos";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Marcar presença.
 *
 * Cada órgão grava na rede, a cada período, um selo dizendo "eu estive aqui" —
 * mesmo quando não teve nenhum caso. O selo não conta nada sobre ninguém: é só
 * um valor embaralhado. O que interessa não é o que ele diz, é o fato de ele
 * existir. **A falta dele é que acende o alerta.**
 *
 * Isso ataca o problema mais comum da rede, que não é alguém mentir no
 * registro: é ninguém registrar nada, e silêncio ficar igual a tranquilidade.
 */

async function situacao(periodo: number) {
  const prog = programa(comite());

  const linhas = await Promise.all(
    INSTITUICOES_ANCORAM.map(async (papel: Papel) => {
      const chave = instituicao(papel).publicKey;
      const contaInst = pdaInstituicao(chave);
      const contaAncora = pdaAncora(contaInst, periodo);

      const [inst, ancora] = await Promise.all([
        prog.account.instituicao.fetchNullable(contaInst),
        prog.account.ancoraPeriodo.fetchNullable(contaAncora),
      ]);

      return {
        papel,
        chave: chave.toBase58(),
        cadastrado: Boolean(inst),
        marcou: Boolean(ancora),
        ultimoPeriodo: inst?.ultimoPeriodoAncorado ?? 0,
        endereco: contaAncora.toBase58(),
        link: ancora ? exploradorConta(contaAncora.toBase58()) : null,
        marcadoEm: ancora ? ancora.ts.toNumber() * 1000 : null,
      };
    }),
  );

  return linhas;
}

export async function GET(req: Request) {
  const periodo = Number(new URL(req.url).searchParams.get("periodo") ?? "1");
  if (!Number.isInteger(periodo) || periodo < 1) {
    return NextResponse.json({ erro: "período inválido" }, { status: 400 });
  }
  try {
    return NextResponse.json({ periodo, orgaos: await situacao(periodo) });
  } catch (e) {
    return NextResponse.json({ erro: String(e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  let corpo: { acao: string; instituicao?: Papel; periodo?: number };
  try {
    corpo = await req.json();
  } catch {
    return NextResponse.json({ erro: "corpo inválido" }, { status: 400 });
  }

  if (corpo.acao !== "marcar") {
    return NextResponse.json({ erro: "ação desconhecida" }, { status: 400 });
  }

  const papel = corpo.instituicao;
  const periodo = Number(corpo.periodo);
  if (!papel || !INSTITUICOES_ANCORAM.includes(papel)) {
    return NextResponse.json({ erro: "órgão inválido" }, { status: 400 });
  }
  if (!Number.isInteger(periodo) || periodo < 1) {
    return NextResponse.json({ erro: "período inválido" }, { status: 400 });
  }

  try {
    const chave = instituicao(papel);
    const prog = programa(chave);

    /**
     * O selo. Aqui é um valor aleatório, porque a demonstração não tem uma
     * carteira de casos de verdade para resumir. Na versão completa ele fecha a
     * lista de casos que o órgão tratou no período: dá para provar depois que a
     * lista não mudou, sem revelar nada dela agora.
     */
    const selo = Array.from(randomBytes(32));

    const assinatura = await prog.methods
      .ancorarPeriodo(periodo, selo)
      .accountsPartial({
        instituicao: pdaInstituicao(chave.publicKey),
        ancora: pdaAncora(pdaInstituicao(chave.publicKey), periodo),
        authority: chave.publicKey,
      })
      .rpc();

    return NextResponse.json({ assinatura, orgaos: await situacao(periodo) });
  } catch (e) {
    return NextResponse.json({ erro: String(e) }, { status: 400 });
  }
}
