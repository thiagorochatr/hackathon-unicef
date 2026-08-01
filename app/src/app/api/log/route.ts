import { NextResponse } from "next/server";
import { ler, limparLog, registrar } from "@/lib/log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * O log do sistema.
 *
 * `GET` devolve o que aconteceu desde um ponto, para a tela acompanhar ao vivo
 * sem repetir o que já mostrou.
 *
 * `POST` existe porque parte da criptografia acontece **no navegador de quem
 * denuncia**, e não aqui — a prova nasce lá, e o tempo dela é dos números mais
 * importantes de mostrar. O que o navegador manda são grandezas: quanto levou,
 * quantos bytes. Nada que identifique ninguém, e mesmo assim o log corta
 * qualquer valor comprido antes de guardar.
 */

export async function GET(req: Request) {
  const desde = Number(new URL(req.url).searchParams.get("desde") ?? 0);
  return NextResponse.json(ler(Number.isFinite(desde) ? desde : 0));
}

export async function POST(req: Request) {
  let corpo: {
    acao?: string;
    detalhes?: Record<string, string | number>;
    limpar?: boolean;
  };
  try {
    corpo = await req.json();
  } catch {
    return NextResponse.json({ erro: "corpo inválido" }, { status: 400 });
  }

  if (corpo.limpar) {
    limparLog();
    registrar("app", "log zerado para a demonstração");
    return NextResponse.json({ ok: true });
  }

  if (!corpo.acao) {
    return NextResponse.json({ erro: "falta a ação" }, { status: 400 });
  }
  registrar("zk", corpo.acao, corpo.detalhes);
  return NextResponse.json({ ok: true });
}
