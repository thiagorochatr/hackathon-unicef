import { CRIANCA_FICTICIA } from "@/lib/fixtures";

/**
 * A fila de atendimento fictícia da UBS.
 *
 * Todos os pacientes são inventados. A criança do roteiro está no meio da fila
 * como qualquer outra — e é esse o ponto: a enfermeira não abriu o sistema para
 * procurar um caso, abriu para atender vinte pessoas antes do almoço.
 *
 * Nomes de sistema, sigla e número de cadastro são genéricos de propósito. O
 * projeto simula software de governo; imitar um sistema real existente seria
 * outra coisa.
 */

export const UBS = {
  rede: "Prefeitura Municipal de Sorocaba",
  secretaria: "Secretaria Municipal de Saúde",
  sistema: "Prontuário Eletrônico da Atenção Básica",
  sigla: "SMS-AB",
  unidade: "UBS Vila dos Ipês",
  cnes: "2077431",
  equipe: "eSF 04 — área 12",
  profissional: "Enfermeira responsável — COREN 118.442",
};

/** Classificação de risco, como toda tela de acolhimento mostra. */
export type Risco = "vermelho" | "laranja" | "amarelo" | "verde" | "azul";

export const CORES_RISCO: Record<Risco, string> = {
  vermelho: "#c0362c",
  laranja: "#c96a12",
  amarelo: "#b58900",
  verde: "#1f7a43",
  azul: "#1f6f9a",
};

export interface Paciente {
  hora: string;
  nome: string;
  idade: string;
  prontuario: string;
  queixa: string;
  risco: Risco;
  /** Já atendido hoje — sai esmaecido na fila, como de verdade. */
  concluido?: boolean;
  /** Marca a criança do roteiro, a única cujo atendimento abre por inteiro. */
  doRoteiro?: boolean;
}

export const FILA: Paciente[] = [
  { hora: "07:20", nome: "Antônio Ferreira Bastos", idade: "61 a", prontuario: "118.204", queixa: "Renovação de receita — hipertensão", risco: "azul", concluido: true },
  { hora: "07:45", nome: "Cleide Ramos Pinheiro", idade: "34 a", prontuario: "204.771", queixa: "Pré-natal — 2ª consulta", risco: "verde", concluido: true },
  { hora: "08:10", nome: "Rafael Souza Marinho", idade: "5 a", prontuario: "331.940", queixa: "Tosse e febre há 2 dias", risco: "verde", concluido: true },
  {
    hora: "08:35",
    nome: `${CRIANCA_FICTICIA.iniciais} — ${CRIANCA_FICTICIA.idade} anos`,
    idade: `${CRIANCA_FICTICIA.idade} a`,
    prontuario: "412.658",
    queixa: "Dor ao movimentar o braço · equimoses em região dorsal",
    risco: "amarelo",
    doRoteiro: true,
  },
  { hora: "08:50", nome: "Marlene Tavares de Sá", idade: "72 a", prontuario: "099.312", queixa: "Tontura e pressão alta", risco: "laranja" },
  { hora: "09:05", nome: "Douglas Prado Vasques", idade: "28 a", prontuario: "287.115", queixa: "Curativo — ferida em pé diabético", risco: "verde" },
  { hora: "09:20", nome: "Silvana Nogueira Reis", idade: "45 a", prontuario: "150.883", queixa: "Resultado de exames", risco: "azul" },
  { hora: "09:35", nome: "Pedro Henrique Alencar", idade: "11 a", prontuario: "376.021", queixa: "Vacinação de rotina", risco: "azul" },
];

/** O que o prontuário já mostra sobre a criança do roteiro, sem sair da UBS. */
export const HISTORICO = [
  {
    data: "há 58 dias",
    texto: "Atendimento por queda referida. Escoriação em joelho e cotovelo. Alta no mesmo dia.",
  },
  {
    data: "há 34 dias",
    texto: "Falta em consulta de puericultura agendada. Sem remarcação pelo responsável.",
  },
];

/**
 * Códigos da CID-10 oferecidos na conduta.
 *
 * A lista é ilustrativa e curta — de verdade o campo é uma busca sobre a
 * classificação inteira.
 */
export const CID = [
  "S30.0 — Contusão do dorso e da pelve",
  "T74.1 — Sevícia física",
  "R52.9 — Dor não especificada",
  "Z00.1 — Exame de rotina de saúde da criança",
];

/**
 * O bloco de notificação compulsória.
 *
 * Este é o coração do portal da UBS, e o motivo de a saúde ser um caso forte: a
 * comunicação **já é obrigação legal**. O ECA (Lei 8.069/1990), no art. 13 — com a
 * redação dada pela Lei 13.010/2014 —, manda comunicar ao Conselho Tutelar os
 * casos de suspeita ou confirmação de castigo físico, tratamento cruel ou
 * degradante e maus-tratos. A Lei 13.431/2017 organiza o resto do percurso.
 *
 * O que a lei **não** faz é dizer à UBS se mais alguém viu alguma coisa. Ela
 * manda avisar, e o aviso cai num vazio. É essa lacuna que o projeto ocupa.
 *
 * Repare que "não se aplica" **não emite sinal nenhum**. A imensa maioria dos
 * atendimentos é isso, e um portal que emitisse sempre seria mentira.
 */
export const NOTIFICACAO = [
  { valor: "nao", rotulo: "Não se aplica a este atendimento", peso: 0 },
  {
    valor: "alerta",
    rotulo: "Sinais de alerta — sem suspeita firmada",
    peso: 1,
    ajuda: "Registro de acompanhamento. Não é notificação compulsória.",
  },
  {
    valor: "violencia",
    rotulo: "Violência interpessoal — suspeita (notificação compulsória)",
    peso: 2,
    ajuda: "ECA, art. 13: suspeita já basta. A comunicação não é opcional.",
  },
] as const;

export const TIPOS_VIOLENCIA = [
  "Física",
  "Negligência ou abandono",
  "Psicológica ou moral",
  "Sexual",
  "Outra",
];

export const LOCAL_OCORRENCIA = ["Residência", "Via pública", "Escola", "Ignorado"];

export const PROVAVEL_AUTOR = [
  "Pai ou mãe",
  "Padrasto ou madrasta",
  "Outro familiar",
  "Cuidador",
  "Desconhecido",
];
