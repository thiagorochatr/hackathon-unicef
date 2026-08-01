/**
 * O que os dois lados do cálculo do apelido precisam combinar.
 *
 * Sem `server-only`: roda também no navegador de quem emite um sinal protegido,
 * porque é lá que a parte do cliente do protocolo acontece.
 */

/**
 * Normaliza o identificador antes de qualquer conta.
 *
 * Precisa dar exatamente o mesmo resultado nos dois lados: se um lado
 * considerasse a pontuação e o outro não, a mesma criança geraria apelidos
 * diferentes e os sinais nunca se cruzariam.
 */
export function normalizarIdentificador(identificador: string): string {
  return identificador.replace(/\D/g, "");
}

/** O apelido é o resultado do protocolo, em hexadecimal. */
export function apelidoEmHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function hexParaBytes(hex: string): Uint8Array {
  const saida = new Uint8Array(hex.length / 2);
  for (let i = 0; i < saida.length; i += 1) {
    saida[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return saida;
}
