export type Papel = "ubs" | "escola" | "cras" | "creas" | "ct" | "mp";

export const PAPEIS: Papel[] = ["ubs", "escola", "cras", "creas", "ct", "mp"];

/** Papéis que emitem sinal de risco (proteção básica e universal). */
export const EMISSORES: Papel[] = ["ubs", "escola", "cras"];

export interface DadosPapel {
  sigla: string;
  nome: string;
  descricao: string;
  cor: string;
}

export const PAPEL: Record<Papel, DadosPapel> = {
  ubs: {
    sigla: "UBS",
    nome: "Unidade Básica de Saúde",
    descricao: "Vê a lesão. Notificação compulsória em saúde.",
    cor: "var(--c-saude)",
  },
  escola: {
    sigla: "Escola",
    nome: "Escola municipal",
    descricao: "Vê a falta reiterada e a mudança de comportamento.",
    cor: "var(--c-educacao)",
  },
  cras: {
    sigla: "CRAS",
    nome: "Centro de Referência de Assistência Social",
    descricao: "Vê a vulnerabilidade da família. Proteção básica.",
    cor: "var(--c-assistencia)",
  },
  creas: {
    sigla: "CREAS",
    nome: "Centro de Referência Especializado de Assistência Social",
    descricao: "Destino técnico do alerta. Equipe permanente, não eletiva.",
    cor: "var(--c-creas)",
  },
  ct: {
    sigla: "Conselho Tutelar",
    nome: "Conselho Tutelar",
    descricao: "Hub legal obrigatório. Mandato eletivo de 4 anos.",
    cor: "var(--c-ct)",
  },
  mp: {
    sigla: "MP",
    nome: "Ministério Público — Promotoria da Infância",
    descricao: "Destino de escalonamento. Cobra os demais.",
    cor: "var(--c-mp)",
  },
};

/** Estados possíveis do caso. Espelha o enum do programa on-chain. */
export type Estado =
  | "Aberto"
  | "PendenteAceite"
  | "EmAtendimento"
  | "Escalado"
  | "Encerrado";

export const ESTADO_ROTULO: Record<Estado, string> = {
  Aberto: "Aberto",
  PendenteAceite: "Esperando o outro órgão aceitar",
  EmAtendimento: "Em atendimento",
  Escalado: "Foi para o Ministério Público",
  Encerrado: "Encerrado",
};

/** Uma transação do caso, lida de volta da rede. */
export interface Registro {
  assinatura: string;
  ts: number;
  erro: boolean;
}

/**
 * O caso como está gravado na Solana. Nada aqui identifica a criança: só um
 * identificador opaco, chaves de instituição, hashes e horários.
 */
export interface CasoNaCadeia {
  alertaId: string;
  /** Endereço da conta do caso na rede. */
  endereco: string;
  linkConta: string;
  responsavel: Papel | null;
  responsavelChave: string;
  pendentePara: Papel | null;
  agenteHash: string;
  /** Identificação de quem responde — vive fora da rede. */
  agenteIdentificacao: string | null;
  /** Se o resumo gravado na rede corresponde a essa identificação. */
  agenteConfere: boolean;
  /** Tamanho da conta na rede, em bytes. */
  bytesNaRede: number;
  /** Conteúdo bruto da conta, para mostrar que não há mais nada dentro. */
  brutoHex: string;
  estado: Estado;
  /** Vencimento do prazo, em ms. */
  prazo: number;
  criadoEm: number;
  trilhaHash: string;
  eventos: number;
  registros: Registro[];
}

export interface EstadoApp {
  /** Prazo escolhido para a demonstração, em segundos. */
  prazoSeg: number;
  /** Identificador do caso aberto. Os dados dele vivem na rede, não aqui. */
  alertaId: string | null;
  /** Período que o painel está mostrando. Quem guarda as presenças é a rede. */
  ciclo: number;
}
