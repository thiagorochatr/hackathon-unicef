"use client";

import type { PapelEmissor } from "@/lib/tipos";

/**
 * O envio institucional, comum aos três portais.
 *
 * O que é compartilhado aqui é só o encanamento: a chamada, o erro, o protocolo.
 * **As palavras não são compartilhadas** — cada portal escreve as suas, porque um
 * sistema de saúde e um de assistência social não falam a mesma língua, e é
 * justamente essa diferença que faz os três parecerem softwares de instituições
 * diferentes.
 *
 * ## O que sai da unidade
 *
 * Um envelope cifrado e um peso. Não sai o nome, não sai o prontuário, não sai o
 * relato. O nó que recebe não consegue abrir nenhum dos dois.
 */

export interface Passo {
  texto: string;
  detalhe?: string;
}

/**
 * Peso do sinal.
 *
 * 1 é observação — só vira caso se outro setor também tiver visto algo.
 * 2 é afirmação — suspeita declarada de violência basta sozinha.
 *
 * O peso vem **do que está sendo dito**, nunca do canal por onde foi dito: um
 * aviso protegido não vale menos que um assinado pela unidade.
 */
export type Peso = 1 | 2;

export async function emitirSinal(instituicao: PapelEmissor, peso: Peso): Promise<void> {
  const r = await fetch("/api/cruzamento", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ acao: "emitir", instituicao, peso }),
  });
  const d = await r.json();
  if (d.erro) throw new Error(d.erro);
}

/** Número de protocolo, como qualquer sistema de governo devolve. */
export function protocolo(prefixo?: string): string {
  const agora = new Date();
  const dia = `${agora.getFullYear()}${String(agora.getMonth() + 1).padStart(2, "0")}${String(agora.getDate()).padStart(2, "0")}`;
  const seq = String(Math.floor(Math.random() * 900000) + 100000);
  return `${prefixo ?? ""}${dia}.${seq}`;
}
