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

/** O que cada instituição observa isoladamente — e que sozinho não vira caso. */
export const SINAIS_FICTICIOS: Record<
  Extract<Papel, "ubs" | "escola" | "cras">,
  { rotulo: string; detalhe: string }
> = {
  ubs: {
    rotulo: "Atendimento com lesão sem explicação compatível",
    detalhe:
      "Segundo atendimento em 60 dias. Responsável deu versões divergentes sobre a origem.",
  },
  escola: {
    rotulo: "Faltas reiteradas e mudança abrupta de comportamento",
    detalhe:
      "14 faltas em 30 dias. Professora relata retraimento e recusa a atividades em grupo.",
  },
  cras: {
    rotulo: "Família em acompanhamento com agravamento de vulnerabilidade",
    detalhe: "Perda de renda e histórico anterior de descumprimento de condicionalidade.",
  },
};

export const AGENTES: Partial<Record<Papel, string>> = {
  creas: "Técnica de referência — matrícula 4471",
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
