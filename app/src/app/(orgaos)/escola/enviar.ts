"use client";

/**
 * O envio do registro de ocorrência, em nome da unidade.
 *
 * ## Por que o caminho protegido **não** está aqui
 *
 * Ele já esteve, e era errado. A escolha aparecer no formulário é bom de
 * narrativa — o medo acontece ali —, mas o modelo de ameaça não fecha: de quem
 * o professor tem medo, muitas vezes, é da própria direção. Gerar a prova dentro
 * do software da escola põe o segredo dele na máquina de quem ele teme.
 *
 * A criptografia protege contra a rede e contra quem recebe. **Não protege
 * contra o dono do software onde ela roda.** Por isso o canal protegido é uma
 * aplicação separada, e este portal apenas avisa que ela existe.
 */


export interface Passo {
  texto: string;
  detalhe?: string;
}

/**
 * Caminho institucional: a escola assina.
 *
 * O sinal sai em nome da unidade, como já sai hoje por ofício — a diferença é
 * que agora ele vira envelope cifrado em vez de papel.
 */
export async function enviarComoEscola(
  peso: 1 | 2,
  avisar: (p: Passo) => void,
): Promise<void> {
  avisar({
    texto: "Lacrando o envelope na unidade",
    detalhe:
      peso === 2
        ? "Suspeita de violência é afirmação: o sinal pesa 2 e basta sozinho."
        : "Apontamento pesa 1: só vira caso se outro setor também tiver visto algo.",
  });
  const r = await fetch("/api/cruzamento", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ acao: "emitir", instituicao: "escola", peso }),
  });
  const d = await r.json();
  if (d.erro) throw new Error(d.erro);
  avisar({
    texto: "Enviado",
    detalhe: "O que saiu da escola foi um envelope fechado, não o registro.",
  });
}

/** Número de protocolo, como qualquer sistema de governo devolve. */
export function protocolo(): string {
  const agora = new Date();
  const dia = `${agora.getFullYear()}${String(agora.getMonth() + 1).padStart(2, "0")}${String(agora.getDate()).padStart(2, "0")}`;
  const seq = String(Math.floor(Math.random() * 900000) + 100000);
  return `${dia}.${seq}`;
}
