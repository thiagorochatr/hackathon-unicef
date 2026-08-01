"use client";

import {
  apelidoEmHex,
  hexParaBytes,
  normalizarIdentificador,
} from "../apelido";

/**
 * O lado do navegador do cálculo do apelido.
 *
 * O identificador da criança **não sai daqui**. O que viaja é ele embaralhado
 * por um fator sorteado agora, que só existe nesta aba e é jogado fora em
 * seguida. Quem responde consegue fazer a conta pedida sem descobrir sobre quem
 * ela é — e como o fator muda a cada consulta, duas perguntas sobre a mesma
 * criança chegam do outro lado como valores sem relação nenhuma.
 *
 * É o que fecha o último elo do sinal protegido: antes, para dizer de qual
 * criança se tratava, o profissional tinha que contar isso a alguém.
 */
export async function obterApelido(identificador: string): Promise<string> {
  const { ristretto255_oprf } = await import("@noble/curves/ed25519.js");
  const { oprf } = ristretto255_oprf;

  const entrada = new TextEncoder().encode(
    normalizarIdentificador(identificador),
  );
  const { blind, blinded } = oprf.blind(entrada);

  const r = await fetch("/api/apelido", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ embaralhado: apelidoEmHex(blinded) }),
  });
  const d = await r.json();
  if (d.erro) throw new Error(d.erro);

  // Desembaralha. O resultado é idêntico ao que o sistema do órgão calcularia
  // direto — é isso que faz os dois caminhos se encontrarem no cruzamento.
  return apelidoEmHex(oprf.finalize(entrada, blind, hexParaBytes(d.avaliado)));
}
