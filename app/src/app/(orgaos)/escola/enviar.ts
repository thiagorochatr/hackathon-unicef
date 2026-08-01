"use client";

import { emitirSinal, protocolo, type Passo, type Peso } from "../_lib/emitir";

export type { Passo };
export { protocolo };

/**
 * O envio da escola, na língua da educação.
 *
 * O canal protegido **não** está aqui, e o motivo está escrito uma vez só, em
 * `_componentes/AvisoCanalExterno.tsx`: de quem o professor tem medo é, muitas
 * vezes, da própria direção — e a criptografia não protege contra o dono do
 * software onde ela roda.
 *
 * Caminho institucional: a escola assina. O sinal sai em nome da unidade, como já
 * sai hoje por ofício — a diferença é que agora ele vira envelope cifrado em vez
 * de papel.
 */
export async function enviarComoEscola(
  peso: Peso,
  avisar: (p: Passo) => void,
): Promise<void> {
  avisar({
    texto: "Lacrando o envelope na unidade",
    detalhe:
      peso === 2
        ? "Suspeita de violência é afirmação: o sinal pesa 2 e basta sozinho."
        : "Apontamento pesa 1: só vira caso se outro setor também tiver visto algo.",
  });
  await emitirSinal("escola", peso);
  avisar({
    texto: "Enviado",
    detalhe: "O que saiu da escola foi um envelope fechado, não o registro.",
  });
}
