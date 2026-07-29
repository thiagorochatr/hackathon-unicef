import "server-only";
import { carregarCifra, nucleo } from "./parametros";
import type { Papel } from "../tipos";

/**
 * O nó de cruzamento.
 *
 * Repare no que este arquivo **não** importa: nada de `comite`, nada de chave
 * secreta. Ele guarda envelopes fechados e sabe somá-los — só isso. Não
 * consegue abrir nenhum, nem o resultado da própria soma.
 *
 * Também não sabe de que criança se trata: recebe apelidos, não identificadores.
 */

interface Envelope {
  papel: Papel;
  cifraB64: string;
  recebidoEm: number;
}

/** apelido da criança -> envelopes recebidos */
const global_ = globalThis as unknown as {
  __fheRecebidos?: Map<string, Envelope[]>;
};
global_.__fheRecebidos ??= new Map();
const recebidos = global_.__fheRecebidos;

export function receber(apelido: string, papel: Papel, cifraB64: string): void {
  const atuais = recebidos.get(apelido) ?? [];
  if (atuais.some((e) => e.papel === papel)) return;
  atuais.push({ papel, cifraB64, recebidoEm: Date.now() });
  recebidos.set(apelido, atuais);
}

export function listar(apelido: string): Envelope[] {
  return recebidos.get(apelido) ?? [];
}

export function limpar(apelido?: string): void {
  if (apelido) recebidos.delete(apelido);
  else recebidos.clear();
}

/**
 * Soma os envelopes sem abrir nenhum. O resultado continua fechado — quem
 * chamar esta função recebe outro envelope, não um número.
 */
export async function somar(apelido: string): Promise<string | null> {
  const envelopes = listar(apelido);
  if (envelopes.length === 0) return null;

  const { avaliador } = await nucleo();

  const soma = await carregarCifra(envelopes[0].cifraB64);
  for (const e of envelopes.slice(1)) {
    const parcela = await carregarCifra(e.cifraB64);
    avaliador.add(soma, parcela, soma);
    parcela.delete();
  }
  const b64 = soma.save();
  soma.delete();
  return b64;
}
