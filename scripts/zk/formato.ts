/**
 * Tradução entre o formato que o Semaphore/snarkJS produz e o formato de bytes
 * que o verificador on-chain espera.
 *
 * São duas convenções diferentes para a mesma matemática, e a conversão errada
 * falha de um jeito que não diz onde: a prova simplesmente não confere. Por isso
 * cada passo aqui está explicado.
 */

import { keccak_256 } from "@noble/hashes/sha3.js";

/** Módulo do corpo base da curva BN254. Necessário para negar um ponto. */
export const P_BN254 =
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
 * Nega um ponto de G1: (x, y) vira (x, p − y).
 *
 * O verificador on-chain confere um único emparelhamento, e para isso um dos
 * termos precisa entrar com o sinal trocado. A biblioteca espera receber o
 * ponto A **já negado** — é a pegadinha clássica desta integração, e a causa
 * mais comum de "prova válida que não confere".
 */
export function negarG1(x: bigint, y: bigint): [bigint, bigint] {
  return [x, y === 0n ? 0n : (P_BN254 - (y % P_BN254)) % P_BN254];
}

/**
 * Os 8 elementos que o Semaphore entrega já vêm na ordem certa:
 *
 *   [0..1]  A.x, A.y
 *   [2..5]  B.x.c1, B.x.c0, B.y.c1, B.y.c0   (G2 com as partes invertidas)
 *   [6..7]  C.x, C.y
 *
 * O resultado são 256 bytes: 64 de A (negado), 128 de B, 64 de C.
 */
export function provaParaBytes(pontos: readonly string[]): Buffer {
  if (pontos.length !== 8) {
    throw new Error(`a prova tem ${pontos.length} elementos; o esperado são 8`);
  }
  const [ax, ay] = negarG1(BigInt(pontos[0]), BigInt(pontos[1]));
  return Buffer.concat([
    paraBytes32(ax),
    paraBytes32(ay),
    ...pontos.slice(2, 6).map(paraBytes32),
    ...pontos.slice(6, 8).map(paraBytes32),
  ]);
}

/**
 * As 4 entradas públicas, na ordem em que o circuito as declara. As duas
 * primeiras são saídas do circuito, as duas últimas são entradas — em Circom as
 * saídas vêm antes.
 *
 * Repare que `mensagem` e `escopo` entram **embaralhados**, não crus: o
 * Semaphore aplica keccak256 e descarta o último byte para caber no corpo.
 */
export function entradasPublicas(prova: {
  merkleTreeRoot: string;
  nullifier: string;
  message: string;
  scope: string;
}): Buffer[] {
  return [
    paraBytes32(prova.merkleTreeRoot),
    paraBytes32(prova.nullifier),
    paraBytes32(embaralhar(prova.message)),
    paraBytes32(embaralhar(prova.scope)),
  ];
}

/**
 * O mesmo embaralhamento que o Semaphore aplica antes de alimentar o circuito:
 * keccak256 sobre os 32 bytes do valor, jogando fora o último byte para o
 * resultado caber no corpo da curva.
 *
 * O programa on-chain refaz exatamente esta conta para conferir que a prova
 * fala do caso que está sendo aberto, e não de outro.
 */
export function embaralhar(valor: string | bigint): bigint {
  const digest = keccak_256(paraBytes32(valor));
  return BigInt("0x" + Buffer.from(digest).toString("hex")) >> 8n;
}

/**
 * Monta o escopo do sinal. Precisa dar exatamente o mesmo valor que
 * `zk::valor_do_escopo` no programa — é a definição de quantos sinais
 * protegidos cada credenciado pode emitir, e se os dois lados divergirem a
 * prova simplesmente não confere, sem dizer por quê.
 */
export function valorDoEscopo(
  municipioIbge: number,
  setorByte: number,
  periodo: number,
): bigint {
  return (
    (BigInt(municipioIbge) << 40n) | (BigInt(setorByte) << 32n) | BigInt(periodo)
  );
}

// ---------------------------------------------------------------------------
// Chave de verificação
// ---------------------------------------------------------------------------

type PontoG1 = string[];
type PontoG2 = string[][];

/** G1 do snarkJS: [x, y, z] com z = 1. Viram 64 bytes. */
function g1ParaBytes(p: PontoG1): Buffer {
  return Buffer.concat([paraBytes32(p[0]), paraBytes32(p[1])]);
}

/**
 * G2 do snarkJS: [[x.c0, x.c1], [y.c0, y.c1], [1, 0]].
 *
 * A cadeia espera as partes **invertidas** — c1 antes de c0 — que é a mesma
 * convenção usada nos verificadores em Solidity. Trocar a ordem aqui é o
 * segundo jeito clássico de a prova não conferir.
 */
function g2ParaBytes(p: PontoG2): Buffer {
  return Buffer.concat([
    paraBytes32(p[0][1]),
    paraBytes32(p[0][0]),
    paraBytes32(p[1][1]),
    paraBytes32(p[1][0]),
  ]);
}

export interface ChaveVerificacao {
  nrEntradas: number;
  alphaG1: Buffer;
  betaG2: Buffer;
  gammaG2: Buffer;
  deltaG2: Buffer;
  ic: Buffer[];
}

/**
 * O Semaphore publica um circuito por profundidade de árvore (1 a 32). Alpha,
 * beta e gamma são comuns a todos; delta e IC mudam a cada profundidade — por
 * isso é preciso dizer qual.
 */
export function chaveDeVerificacao(
  vk: Record<string, unknown>,
  profundidade: number,
): ChaveVerificacao {
  if (profundidade < 1 || profundidade > 32) {
    throw new Error(`profundidade ${profundidade} fora da faixa 1–32`);
  }
  const i = profundidade - 1;
  const delta = (vk.vk_delta_2 as PontoG2[])[i];
  const ic = (vk.IC as PontoG1[][])[i];
  if (!delta || !ic) {
    throw new Error(`a chave não tem entrada para profundidade ${profundidade}`);
  }
  return {
    nrEntradas: vk.nPublic as number,
    alphaG1: g1ParaBytes(vk.vk_alpha_1 as PontoG1),
    betaG2: g2ParaBytes(vk.vk_beta_2 as PontoG2),
    gammaG2: g2ParaBytes(vk.vk_gamma_2 as PontoG2),
    deltaG2: g2ParaBytes(delta),
    ic: ic.map(g1ParaBytes),
  };
}

/** Despeja a chave como código Rust, para virar constante dentro do programa. */
export function chaveComoRust(c: ChaveVerificacao, profundidade: number): string {
  const arr = (b: Buffer) => `[${Array.from(b).join(",")}]`;
  return `//! Chave de verificação do circuito Semaphore v4, profundidade ${profundidade}.
//!
//! GERADO POR \`scripts/zk/spike.ts\` — não editar à mão.
//!
//! Vem da cerimônia pública do Semaphore, não de uma cerimônia nossa. É o que
//! nos tira do problema político de trusted setup: ninguém precisa confiar em
//! quem gerou estes números, porque não fomos nós.

use groth16_solana::groth16::Groth16Verifyingkey;

/// Profundidade da árvore de credenciados. Fixa: a chave de verificação muda a
/// cada profundidade, e embutir as 32 não caberia no programa.
pub const PROFUNDIDADE_ARVORE: u8 = ${profundidade};

/// Quantidade de entradas públicas: raiz, anulador, mensagem e escopo.
pub const NR_ENTRADAS: usize = ${c.nrEntradas};

pub const CHAVE_VERIFICACAO: Groth16Verifyingkey = Groth16Verifyingkey {
    nr_pubinputs: ${c.nrEntradas},
    vk_alpha_g1: ${arr(c.alphaG1)},
    vk_beta_g2: ${arr(c.betaG2)},
    vk_gamme_g2: ${arr(c.gammaG2)},
    vk_delta_g2: ${arr(c.deltaG2)},
    vk_ic: &[
${c.ic.map((p) => `        ${arr(p)},`).join("\n")}
    ],
};
`;
}
