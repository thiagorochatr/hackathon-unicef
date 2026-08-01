/**
 * A Promotoria de Justiça da Infância e Juventude.
 *
 * ## O que este portal existe para mostrar
 *
 * Um procedimento que entrou **sem remetente**. Nenhum órgão o encaminhou;
 * nenhum servidor apertou nada. O prazo venceu e o caso subiu sozinho, porque a
 * regra que o faz subir está no programa da rede e não na boa vontade de
 * ninguém.
 *
 * Isso inverte quem depende de quem. Hoje o Ministério Público só sabe do que
 * lhe contam, e o caso que ninguém conta é o caso que não existe. Aqui o
 * silêncio deixa de ser uma opção: ficar parado é o que faz o caso chegar.
 *
 * ## O que continua igual
 *
 * Tudo o mais. O promotor não recebe dado de criança nenhuma — recebe que houve
 * convergência, quem era o responsável e que o prazo venceu. A apuração é a de
 * sempre, com os poderes de sempre.
 *
 * Nome de sistema e sigla são genéricos de propósito.
 */

export const MP = {
  instituicao: "Ministério Público do Estado de São Paulo",
  promotoria: "Promotoria de Justiça da Infância e Juventude — Comarca de Sorocaba",
  sistema: "Sistema de Acompanhamento de Procedimentos",
  sigla: "MP-SAP",
  vara: "2ª Promotoria",
  promotor: "Promotoria da Infância e Juventude — 2ª vara",
};

/** O que já estava na mesa da promotoria. */
export const PROCEDIMENTOS = [
  {
    numero: "PA.2026.000.441",
    classe: "Procedimento administrativo",
    origem: "Representação — Conselho Tutelar",
    autuacao: "21/07/2026",
    situacao: "Em instrução",
  },
  {
    numero: "NF.2026.000.512",
    classe: "Notícia de fato",
    origem: "Ofício — Secretaria de Educação",
    autuacao: "15/07/2026",
    situacao: "Aguardando diligência",
  },
  {
    numero: "IC.2026.000.087",
    classe: "Inquérito civil",
    origem: "Representação — demanda espontânea",
    autuacao: "03/06/2026",
    situacao: "Em instrução",
  },
];

/** O que a promotoria pode instaurar a partir de uma entrada. */
export const CLASSES = [
  "Notícia de fato",
  "Procedimento administrativo de acompanhamento",
  "Inquérito civil",
];
