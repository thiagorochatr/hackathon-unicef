import { CRIANCA_FICTICIA } from "@/lib/fixtures";

/**
 * A turma fictícia do diário de classe.
 *
 * Todos os nomes são inventados. A criança do roteiro aparece aqui como
 * qualquer outra — e é esse o ponto: quem lança a frequência não está
 * procurando um caso, está fazendo a chamada. O padrão de faltas é que salta.
 */

export const ESCOLA = {
  rede: "Prefeitura Municipal de Sorocaba",
  secretaria: "Secretaria Municipal de Educação",
  sistema: "Diário de Classe Digital",
  sigla: "SEDUC-SIS",
  unidade: "EMEF Prof.ª Aparecida Nunes",
  inep: "35123456",
  turma: "3º ano B — matutino",
  professora: "Coordenação pedagógica — matrícula 2210",
};

export interface Aluno {
  n: number;
  nome: string;
  /** Presenças e faltas dos últimos 20 dias letivos. `f` é falta. */
  chamada: ("p" | "f")[];
  /** Só a criança do roteiro carrega observação anterior. */
  observacao?: string;
  /** Marca quem é a criança fictícia do roteiro, para o sinal poder sair. */
  doRoteiro?: boolean;
}

const p = (n: number): ("p" | "f")[] => Array(n).fill("p");

/** Espalha faltas num padrão que a coordenação reconhece: seguidas, no fim. */
function comFaltas(padrao: string): ("p" | "f")[] {
  return padrao.split("").map((c) => (c === "f" ? "f" : "p"));
}

export const TURMA: Aluno[] = [
  { n: 1, nome: "Ana Beatriz Correia", chamada: comFaltas("pppppppppppfppppppp") },
  { n: 2, nome: "Bruno Tavares Lima", chamada: p(20) },
  { n: 3, nome: "Caio Menezes da Silva", chamada: comFaltas("ppppfpppppppppppppp") },
  { n: 4, nome: "Daniela Rocha Prado", chamada: p(20) },
  { n: 5, nome: "Eduardo Nunes Ferraz", chamada: comFaltas("ppppppppppppppffpppp") },
  {
    n: 6,
    nome: `${CRIANCA_FICTICIA.iniciais} — 8 anos`,
    chamada: comFaltas("ppfffppffffppffffffff".slice(0, 20)),
    observacao:
      "Retraimento em atividades de grupo. Responsável não compareceu às duas últimas convocações.",
    doRoteiro: true,
  },
  { n: 7, nome: "Gabriel Antunes Reis", chamada: p(20) },
  { n: 8, nome: "Helena Vasques Moreira", chamada: comFaltas("pppppppppppppppppfpp") },
  { n: 9, nome: "Igor Salgado Bastos", chamada: p(20) },
  { n: 10, nome: "Júlia Peçanha Cordeiro", chamada: comFaltas("ppppppfppppppppppppp") },
  { n: 11, nome: "Lucas Andrade Vilela", chamada: p(20) },
  { n: 12, nome: "Mariana Freitas Gomes", chamada: comFaltas("pppppppppppppppppppf") },
];

export const faltas = (a: Aluno) => a.chamada.filter((c) => c === "f").length;

/** O que a rede considera acúmulo que exige providência. */
export const LIMITE_FALTAS = 10;

/**
 * Os tipos de ocorrência que o diário oferece.
 *
 * Repare que "suspeita de violência ou negligência" é **um item de lista**, e não
 * o assunto da tela. É assim no sistema de verdade, e é assim que precisa ser
 * aqui: o sinal nasce de dentro do trabalho, não de um botão dedicado.
 */
export const TIPOS_OCORRENCIA = [
  "Infrequência — acúmulo de faltas",
  "Suspeita de violência ou negligência",
  "Dificuldade de aprendizagem",
  "Conflito entre pares",
  "Outro",
] as const;
