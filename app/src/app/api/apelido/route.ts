import { NextResponse } from "next/server";
import { avaliarApelidoCego } from "@/lib/pseudonimo";
import { apelidoEmHex, hexParaBytes } from "@/lib/apelido";
import { LimiteExcedido, limitarChamador } from "@/lib/guarda";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Responde à consulta embaralhada do apelido.
 *
 * O que chega aqui é um ponto que não diz nada: o navegador embaralhou o
 * identificador da criança com um fator que só ele conhece, sorteado de novo a
 * cada consulta. Esta rota faz a conta com a chave de serviço e devolve — sem
 * ter como saber sobre quem foi perguntado, e sem conseguir ligar duas
 * consultas sobre a mesma criança uma à outra.
 *
 * O que **não** está resolvido, e está declarado: a chave continua inteira em um
 * lugar só. Ela não vaza por aqui, mas quem a detém consegue calcular o apelido
 * de um identificador que já conheça. Reparti-la entre instituições é o passo
 * seguinte.
 *
 * E uma consequência de ser aberta: esta rota é um **oráculo**. Quem chama
 * escolhe a entrada, então ela permite calcular o apelido de identificadores
 * que já se conheça — não offline, como seria com um resumo simples, mas uma
 * consulta por vez. O limite de ritmo abaixo é o que torna varredura inviável;
 * num sistema real o acesso seria de instituição credenciada, não de qualquer um.
 */
export async function POST(req: Request) {
  let corpo: { embaralhado?: string };
  try {
    corpo = await req.json();
  } catch {
    return NextResponse.json({ erro: "corpo inválido" }, { status: 400 });
  }

  const hex = corpo.embaralhado;
  if (!hex || !/^[0-9a-f]{64}$/i.test(hex)) {
    return NextResponse.json(
      { erro: "o valor embaralhado precisa ter 32 bytes em hexadecimal" },
      { status: 400 },
    );
  }

  try {
    limitarChamador(req, "consultar apelido", true);
    return NextResponse.json({
      avaliado: apelidoEmHex(avaliarApelidoCego(hexParaBytes(hex))),
    });
  } catch (e) {
    if (e instanceof LimiteExcedido) {
      return NextResponse.json({ erro: e.message }, { status: 429 });
    }
    // Ponto fora da curva, por exemplo. Não dizemos mais do que o necessário.
    return NextResponse.json({ erro: String(e) }, { status: 400 });
  }
}
