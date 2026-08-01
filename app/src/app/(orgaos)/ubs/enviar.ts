"use client";

import { emitirSinal, protocolo, type Passo, type Peso } from "../_lib/emitir";

export type { Passo };

/**
 * O envio da UBS, na língua da saúde.
 *
 * O canal protegido **não** está aqui, e o motivo está escrito em
 * `_componentes/AvisoCanalExterno.tsx`. Vale igual para a saúde: quem assina a
 * ficha de notificação é identificado nela, e o profissional que teme a família —
 * ou a chefia da unidade — precisa de uma saída que não passe pelo software da
 * própria unidade.
 */
export async function notificar(peso: Peso, avisar: (p: Passo) => void): Promise<void> {
  avisar({
    texto: "Lacrando o envelope na unidade",
    detalhe:
      peso === 2
        ? "Suspeita de violência é afirmação: o sinal pesa 2 e basta sozinho para abrir um caso."
        : "Sinal de alerta pesa 1: só vira caso se outro setor também tiver visto algo.",
  });
  await emitirSinal("ubs", peso);
  avisar({
    texto: "Enviado à rede de proteção",
    detalhe:
      "O que saiu da UBS foi um envelope cifrado. Não saiu o prontuário, não saiu o nome, " +
      "não saiu a queixa — e quem recebeu não consegue abrir nenhum dos dois.",
  });
}

/** Número da ficha, no formato que a vigilância epidemiológica usa. */
export function numeroDaFicha(): string {
  return protocolo("NOT-");
}
