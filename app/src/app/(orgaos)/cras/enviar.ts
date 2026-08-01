"use client";

import { emitirSinal, protocolo, type Passo, type Peso } from "../_lib/emitir";

export type { Passo };

/**
 * O envio do CRAS, na língua da assistência social.
 *
 * O canal protegido **não** está aqui, e o motivo está escrito em
 * `_componentes/AvisoCanalExterno.tsx`. Na assistência ele é ainda mais agudo que
 * na escola: a técnica de referência conhece a família pelo nome, entra na casa e
 * mora no mesmo território. Não existe aviso anônimo se o aviso sai do sistema
 * onde só ela trabalha aquela família.
 */
export async function registrarEvolucao(
  peso: Peso,
  avisar: (p: Passo) => void,
): Promise<void> {
  avisar({
    texto: "Lacrando o envelope no CRAS",
    detalhe:
      peso === 2
        ? "Suspeita de violência é afirmação: o sinal pesa 2 e basta sozinho para abrir um caso."
        : "Agravamento pesa 1: só vira caso se outro setor também tiver visto algo.",
  });
  await emitirSinal("cras", peso);
  avisar({
    texto: "Enviado à rede de proteção",
    detalhe:
      "O que saiu do CRAS foi um envelope cifrado. Não saiu o código familiar, não saiu " +
      "o território, não saiu a evolução — e quem recebeu não consegue abrir nenhum dos dois.",
  });
}

/** Número do registro, no formato que o prontuário do SUAS devolve. */
export function numeroDoRegistro(): string {
  return protocolo("PAIF-");
}
