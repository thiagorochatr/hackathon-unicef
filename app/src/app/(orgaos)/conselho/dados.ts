/**
 * O Conselho Tutelar.
 *
 * ## Por que este portal é o mais importante dos três que recebem
 *
 * O CT não é de secretaria nenhuma: é órgão autônomo, de conselheiros **eleitos**,
 * com mandato. Não tem chefe na prefeitura. E é o ponto onde os casos
 * historicamente somem — não por má-fé, mas porque cinco conselheiros de plantão
 * recebem mais do que conseguem responder, e nada acontece quando um caso fica
 * parado.
 *
 * É exatamente isso que a rede muda, e é a única coisa que ela muda aqui: o caso
 * parado **não fica parado**. Ou alguém assume, ou ele vai sozinho ao Ministério
 * Público quando o prazo vence. Por isso a tela põe o relógio no topo, grande, e
 * não esconde o que acontece quando ele zera.
 *
 * Nome de sistema e sigla são genéricos de propósito.
 */

export const CT = {
  municipio: "Município de Sorocaba",
  orgao: "Conselho Tutelar — 2ª Região",
  sistema: "Registro de Medidas de Proteção",
  sigla: "CT-RMP",
  mandato: "Mandato 2024/2028",
  conselheiro: "Conselheiro tutelar de plantão — mandato 2024/2028",
  plantao: "Plantão 08h–17h · sobreaviso 17h–08h",
};

/** O que já está na fila do plantão. */
export const FILA = [
  {
    registro: "CT.2026.1188",
    origem: "Escola — comunicação de infrequência",
    entrada: "29/07/2026",
    situacao: "Aguardando atendimento",
  },
  {
    registro: "CT.2026.1184",
    origem: "Demanda espontânea — vizinho",
    entrada: "28/07/2026",
    situacao: "Em análise",
  },
  {
    registro: "CT.2026.1179",
    origem: "UBS — notificação compulsória",
    entrada: "26/07/2026",
    situacao: "Medida aplicada — em acompanhamento",
  },
  {
    registro: "CT.2026.1152",
    origem: "Demanda espontânea",
    entrada: "11/07/2026",
    situacao: "Aguardando atendimento",
  },
];

/**
 * As medidas de proteção do art. 101 do ECA.
 *
 * A lista é curta e ilustrativa; o artigo tem nove incisos. Elas aparecem aqui
 * porque é isto que o Conselho Tutelar faz — aplicar medida —, e é dentro dessa
 * tarefa que o registro na rede acontece, e não num botão à parte.
 */
export const MEDIDAS = [
  "Encaminhamento aos pais ou responsável, mediante termo de responsabilidade",
  "Orientação, apoio e acompanhamento temporários",
  "Requisição de tratamento médico, psicológico ou psiquiátrico",
  "Inclusão em serviço de proteção e atendimento à família",
  "Matrícula e frequência obrigatórias em estabelecimento oficial de ensino",
];
