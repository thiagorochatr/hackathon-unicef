import "server-only";

/**
 * Tradução entre o formato que o Semaphore produz e o formato de bytes que o
 * verificador on-chain espera.
 *
 * Roda no servidor de propósito: a conversão é pura e pública, não tem nada de
 * secreto nela, e deixar isto fora do navegador poupa peso na máquina de quem
 * denuncia. O que **não** pode sair do navegador é a geração da prova.
 */

/** Módulo do corpo base da curva BN254. Necessário para negar um ponto. */
const P_BN254 =
  21888242871839275222246405745257275088696311157297823662689037894645226208583n;

/** Um elemento de corpo vira 32 bytes, do mais significativo para o menos. */
export function paraBytes32(valor: string | bigint): Buffer {
  const n = typeof valor === "bigint" ? valor : BigInt(valor);
  if (n < 0n) throw new Error("valor negativo não cabe em 32 bytes");
  const hex = n.toString(16).padStart(64, "0");
  if (hex.length > 64) throw new Error("valor maior que 32 bytes");
  return Buffer.from(hex, "hex");
}

/**
 * Os 8 elementos que o Semaphore entrega já vêm na ordem certa:
 *
 *   [0..1]  A.x, A.y
 *   [2..5]  B.x.c1, B.x.c0, B.y.c1, B.y.c0   (G2 com as partes invertidas)
 *   [6..7]  C.x, C.y
 *
 * O ponto A sai **negado**: o verificador confere um único emparelhamento, e
 * para isso um dos termos precisa entrar com o sinal trocado. É a pegadinha
 * clássica desta integração — errar aqui faz uma prova válida não conferir, sem
 * dizer por quê.
 */
export function provaParaBytes(pontos: readonly string[]): Buffer {
  if (pontos.length !== 8) {
    throw new Error(`a prova tem ${pontos.length} elementos; o esperado são 8`);
  }
  const ay = BigInt(pontos[1]);
  const negado = ay === 0n ? 0n : (P_BN254 - (ay % P_BN254)) % P_BN254;
  return Buffer.concat([
    paraBytes32(pontos[0]),
    paraBytes32(negado),
    ...pontos.slice(2, 8).map(paraBytes32),
  ]);
}
