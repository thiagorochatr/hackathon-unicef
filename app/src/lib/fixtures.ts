import type { Papel } from "./tipos";

/**
 * Todos os dados abaixo são FICTÍCIOS e existem só para o roteiro de demonstração.
 * Nenhum dado real de criança é usado, exibido ou armazenado em lugar nenhum
 * deste projeto — em especial, jamais on-chain.
 */

export const CRIANCA_FICTICIA = {
  /**
   * Identificador fictício. Só existe dentro da instituição que atende.
   * O que sai da instituição é o pseudônimo, nunca isto.
   */
  identificador: "000.000.000-00",
  iniciais: "M. S. O.",
  idade: 8,
  municipio: "Sorocaba/SP",
  codigoIbge: 3552205,
};

/**
 * Pseudônimo derivado do identificador. Na Fatia 2 passa a ser
 * HMAC-SHA256(chave_de_serviço, identificador); aqui é constante para o roteiro.
 */
export const PSEUDONIMO_DEMO =
  "7c1f4a9e2b8d5063af71e94c2d0b6835e4a7f1c9d82b30465a9e7c1f4a9e2b8d";

/*
 * O que cada instituição observa isoladamente vivia aqui, em três frases.
 *
 * Saiu junto com a tela `/sinal/[papel]`, que era quem lia. Agora esse conteúdo
 * mora dentro de cada portal — `(orgaos)/ubs/dados.ts`, `escola/dados.ts`,
 * `cras/dados.ts` — em fila de atendimento, chamada e acompanhamento familiar,
 * porque é assim que ele aparece de verdade: no meio do trabalho, e não como
 * resumo de si mesmo.
 */

/**
 * Quem responde pelo caso dentro de cada órgão. É esta identificação que vira
 * resumo na rede — cargo e matrícula, nunca o nome civil.
 */
export const AGENTES: Partial<Record<Papel, string>> = {
  ubs: "Enfermeira responsável — COREN 118.442",
  escola: "Coordenação pedagógica — matrícula 2210",
  cras: "Técnica de referência PAIF — matrícula 3305",
  creas: "Técnica de referência PAEFI — matrícula 4471",
  ct: "Conselheiro tutelar — mandato 2024/2028",
  mp: "Promotoria da Infância e Juventude — 2ª vara",
};

/** Limiar de convergência: quantos sinais independentes disparam o alerta. */
export const LIMIAR = 2;

/**
 * Prazos que a demonstração oferece. O curto existe porque o momento mais forte
 * é o prazo vencer sozinho na frente de quem assiste; os longos existem porque
 * 45 segundos não dão tempo de explicar nada no meio.
 */
export const PRAZO_OPCOES = [
  { seg: 45, rotulo: "45 s", ajuda: "para mostrar o prazo vencer ao vivo" },
  { seg: 120, rotulo: "2 min", ajuda: "dá tempo de narrar o repasse" },
  { seg: 300, rotulo: "5 min", ajuda: "apresentação com calma" },
  { seg: 900, rotulo: "15 min", ajuda: "deixa o caso parado para explorar" },
] as const;

export const PRAZO_PADRAO_SEG = 120;

/** Instituições que deveriam ancorar em cada ciclo (todas). */
export const INSTITUICOES_ANCORAM: Papel[] = ["ubs", "escola", "cras", "creas", "ct"];
