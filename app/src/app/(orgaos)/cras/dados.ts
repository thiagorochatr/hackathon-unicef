/**
 * As famílias referenciadas fictícias do CRAS.
 *
 * Todas são inventadas. A do roteiro está no meio da lista como qualquer outra —
 * e é esse o ponto: a técnica de referência não abriu o sistema para procurar um
 * caso, abriu para tocar o acompanhamento de setenta famílias.
 *
 * Repare que aqui não se fala em "paciente" nem em "aluno". A assistência social
 * conta por **família**, e é a família que é referenciada, não a criança. Essa
 * diferença de unidade de contagem é real, e é uma das razões pelas quais os três
 * sistemas nunca conversaram: eles nem contam a mesma coisa.
 *
 * Nome de sistema e sigla são genéricos de propósito.
 */

export const CRAS = {
  rede: "Prefeitura Municipal de Sorocaba",
  secretaria: "Secretaria Municipal de Assistência e Desenvolvimento Social",
  sistema: "Registro de Acompanhamento Familiar",
  sigla: "SMADS-RAF",
  unidade: "CRAS Zona Norte",
  territorio: "Território 04 — Vila dos Ipês e adjacências",
  tecnica: "Técnica de referência PAIF — matrícula 3305",
};

export interface Familia {
  codigo: string;
  responsavel: string;
  composicao: string;
  /** Quantas crianças e adolescentes moram na casa. */
  criancas: number;
  territorio: string;
  ultimoAtendimento: string;
  /** Dias desde o último atendimento — o que faz a linha acender. */
  diasSemContato: number;
  situacao: string;
  doRoteiro?: boolean;
}

/** Acima disto o acompanhamento está em atraso e a linha acende. */
export const LIMITE_DIAS = 90;

export const FAMILIAS: Familia[] = [
  { codigo: "2.104", responsavel: "R. C. Almeida", composicao: "4 pessoas", criancas: 2, territorio: "Q. 12", ultimoAtendimento: "12/07/2026", diasSemContato: 20, situacao: "PAIF — acompanhamento regular" },
  { codigo: "2.187", responsavel: "J. P. Ferreira", composicao: "3 pessoas", criancas: 1, territorio: "Q. 08", ultimoAtendimento: "28/06/2026", diasSemContato: 34, situacao: "PAIF — acompanhamento regular" },
  {
    codigo: "2.281",
    responsavel: "A. M. O.",
    composicao: "5 pessoas",
    criancas: 3,
    territorio: "Q. 12",
    ultimoAtendimento: "17/04/2026",
    diasSemContato: 106,
    situacao: "PAIF — acompanhamento em atraso",
    doRoteiro: true,
  },
  { codigo: "2.310", responsavel: "S. B. Nascimento", composicao: "2 pessoas", criancas: 0, territorio: "Q. 03", ultimoAtendimento: "22/07/2026", diasSemContato: 10, situacao: "Benefício eventual — concluído" },
  { codigo: "2.355", responsavel: "M. L. Duarte", composicao: "6 pessoas", criancas: 4, territorio: "Q. 15", ultimoAtendimento: "02/07/2026", diasSemContato: 30, situacao: "PAIF — acompanhamento regular" },
  { codigo: "2.402", responsavel: "T. R. Siqueira", composicao: "3 pessoas", criancas: 1, territorio: "Q. 08", ultimoAtendimento: "19/03/2026", diasSemContato: 135, situacao: "PAIF — acompanhamento em atraso" },
];

/** O que o CRAS já sabe sozinho sobre a família do roteiro. */
export const EVOLUCAO = [
  {
    data: "17/04/2026",
    tipo: "Atendimento particularizado",
    texto:
      "Responsável relata perda de renda após desligamento. Solicitado benefício eventual. Orientada sobre atualização do CadÚnico.",
  },
  {
    data: "05/06/2026",
    tipo: "Registro do sistema",
    texto:
      "Averiguação de condicionalidade — frequência escolar abaixo do mínimo para uma das crianças do grupo familiar.",
  },
  {
    data: "11/07/2026",
    tipo: "Visita domiciliar",
    texto: "Sem sucesso. Ninguém atendeu. Segunda tentativa sem contato.",
  },
];

export const TIPOS_ATENDIMENTO = [
  "Visita domiciliar",
  "Atendimento particularizado",
  "Atendimento coletivo — oficina PAIF",
  "Encaminhamento para a rede",
  "Busca ativa",
];

/**
 * As situações que a técnica marca no registro de evolução.
 *
 * É daqui que o peso do sinal sai — e não de um botão dedicado. Repare que a
 * maioria das marcações **não emite nada**: elas são o trabalho comum do PAIF.
 * Só duas atravessam a fronteira do CRAS, e uma delas basta sozinha.
 */
export const SITUACOES = [
  { id: "renda", rotulo: "Insegurança de renda ou alimentar", peso: 0 },
  { id: "documento", rotulo: "Ausência de documentação civil", peso: 0 },
  { id: "moradia", rotulo: "Inadequação de moradia", peso: 0 },
  {
    id: "agravamento",
    rotulo: "Agravamento da vulnerabilidade com criança no grupo familiar",
    peso: 1,
    ajuda: "Observação. Só vira caso se outro setor também tiver visto algo.",
  },
  {
    id: "violencia",
    rotulo: "Suspeita de violência intrafamiliar ou negligência",
    peso: 2,
    ajuda: "Afirmação. Basta sozinha, e obriga comunicação ao Conselho Tutelar.",
  },
] as const;
