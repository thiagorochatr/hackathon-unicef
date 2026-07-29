import "server-only";
import { createHash } from "crypto";
import { AGENTES } from "./fixtures";
import type { Papel } from "./tipos";

/**
 * Quem responde pelo caso dentro do órgão.
 *
 * O nome da pessoa **não** vai para a rede — nem deveria. O que vai é um
 * resumo dele. Serve para duas coisas:
 *
 * - a responsabilidade deixa de ser "o CREAS" e passa a ser uma pessoa
 *   determinada, o que muda o comportamento de quem responde;
 * - depois, em uma apuração, dá para provar quem era: basta apresentar a
 *   identificação e conferir que o resumo bate. Quem só olha a rede não
 *   descobre nada.
 *
 * A identificação usada aqui é o cargo mais a matrícula ou o mandato, não o
 * nome civil — já é suficiente para responsabilizar e evita expor a pessoa.
 */

export function identificacaoDoAgente(papel: Papel): string {
  return AGENTES[papel] ?? `${papel}: agente não informado`;
}

export function hashDoAgente(papel: Papel): number[] {
  const digest = createHash("sha256")
    .update(`${papel}|${identificacaoDoAgente(papel)}`)
    .digest();
  return Array.from(digest);
}

/** Refaz a conta e diz se o valor gravado na rede corresponde ao agente. */
export function confereAgente(papel: Papel, hashNaRede: string): boolean {
  const esperado = Buffer.from(hashDoAgente(papel)).toString("hex");
  return esperado === hashNaRede;
}
