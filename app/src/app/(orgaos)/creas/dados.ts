/**
 * O CREAS — proteção social especial de média complexidade.
 *
 * A diferença para o CRAS não é de grau, é de natureza: o CRAS acompanha
 * famílias em vulnerabilidade, o CREAS entra quando o direito **já foi violado**.
 * São serviços diferentes (PAIF e PAEFI), equipes diferentes e — no município de
 * verdade — sistemas diferentes, mesmo estando sob a mesma secretaria.
 *
 * Nome de sistema e sigla são genéricos de propósito.
 */

export const CREAS = {
  rede: "Prefeitura Municipal de Sorocaba",
  secretaria: "Secretaria Municipal de Assistência e Desenvolvimento Social",
  sistema: "Sistema de Proteção Social Especial",
  sigla: "SMADS-PSE",
  unidade: "CREAS Centro",
  servico: "PAEFI — Proteção e Atendimento Especializado a Famílias e Indivíduos",
  tecnica: "Técnica de referência PAEFI — matrícula 4471",
};

/** A carga de trabalho que já estava na mesa antes do caso do roteiro chegar. */
export const CASOS_ANTERIORES = [
  {
    protocolo: "PAEFI.2026.0412",
    origem: "Conselho Tutelar — requisição",
    situacao: "Em acompanhamento",
    entrada: "14/07/2026",
    prazo: "no prazo",
  },
  {
    protocolo: "PAEFI.2026.0398",
    origem: "Demanda espontânea",
    situacao: "Em acompanhamento",
    entrada: "02/07/2026",
    prazo: "no prazo",
  },
  {
    protocolo: "PAEFI.2026.0355",
    origem: "Ofício — Ministério Público",
    situacao: "Aguardando parecer técnico",
    entrada: "19/06/2026",
    prazo: "atrasado",
  },
];

/**
 * As opções de encaminhamento.
 *
 * Repare no que **não** está aqui: não existe "arquivar" nem "devolver à
 * origem". Encerrar exige registrar desfecho, e o desfecho fica na rede. É de
 * propósito — o buraco que o projeto ataca é o caso que some sem ninguém dizer
 * o que houve.
 */
export const DESTINOS = [
  {
    papel: "ct" as const,
    rotulo: "Conselho Tutelar",
    ajuda: "Para aplicação de medida de proteção (ECA, art. 101).",
  },
  {
    papel: "mp" as const,
    rotulo: "Ministério Público",
    ajuda: "Quando o caso exige providência judicial ou requisição.",
  },
];
