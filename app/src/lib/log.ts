import "server-only";

/**
 * O log do sistema: o que aconteceu, camada por camada.
 *
 * Existe para uma coisa só — deixar visível que a criptografia está mesmo
 * rodando. É fácil desenhar um slide dizendo "somamos sem abrir"; é outra coisa
 * ver o envelope de 576 mil letras sendo lacrado, a soma feita sem chave
 * nenhuma e o comitê recebendo um único bit, ao vivo, na ordem em que
 * acontecem.
 *
 * ## A trava
 *
 * Um log que vazasse o identificador da criança, o apelido ou o segredo de
 * quem denuncia seria pior do que não ter log nenhum: derrubaria justamente
 * o que ele deveria demonstrar. Por isso o valor de qualquer detalhe é
 * **limitado a poucos caracteres**. Não é disciplina de quem escreve o código,
 * é impedimento: um envelope, uma chave ou um apelido inteiro não cabem aqui
 * nem por acidente.
 *
 * O que entra são tamanhos, tempos, contagens, assinaturas de transação e
 * pedaços curtos de resumo. Nada que permita voltar a uma pessoa.
 */

/** Tamanho máximo de qualquer valor registrado. Ver a trava, acima. */
const LIMITE_VALOR = 88;

/**
 * Qualquer sequência longa sem espaço é recusada por inteiro.
 *
 * Só limitar o tamanho não bastava: um segredo de identidade tem 44 caracteres
 * e passaria inteirinho por um corte de 88. O que separa um valor legítimo de um
 * segredo aqui não é o comprimento — é a **forma**. O que este log registra é
 * frase e número: "576.684 letras", "não tem chave secreta", "1 bit". Um trecho
 * de 24 caracteres seguidos sem espaço, de letras e números, não é isso. É
 * envelope, chave, apelido ou resumo.
 */
const SUSPEITO = /[A-Za-z0-9+/=_-]{24,}/;

/** Quantos eventos ficam guardados. O suficiente para uma apresentação inteira. */
const CAPACIDADE = 500;

export type Camada = "fhe" | "zk" | "oprf" | "cadeia" | "app";

export interface Evento {
  id: number;
  ts: number;
  camada: Camada;
  /** O que aconteceu, em uma linha curta e legível de longe. */
  acao: string;
  /** Pares curtos que sustentam a afirmação. */
  detalhes?: Record<string, string | number>;
  /** Assinatura da transação, quando o evento tocou a rede. */
  assinatura?: string;
}

const global_ = globalThis as unknown as {
  __log?: { eventos: Evento[]; proximo: number };
};
global_.__log ??= { eventos: [], proximo: 1 };
const registro = global_.__log;

/**
 * Corta qualquer valor comprido.
 *
 * É aqui que a trava mora. Se alguém, um dia, tentar registrar um envelope ou
 * uma chave, o que vai para o log é o começo e o aviso de que foi cortado —
 * nunca a coisa inteira.
 */
function encurtar(valor: string | number): string | number {
  if (typeof valor === "number") return valor;
  if (SUSPEITO.test(valor)) {
    return "[recusado: parece segredo, chave, apelido ou envelope]";
  }
  if (valor.length <= LIMITE_VALOR) return valor;
  return `${valor.slice(0, LIMITE_VALOR)}… (${valor.length} caracteres, cortado)`;
}

export function registrar(
  camada: Camada,
  acao: string,
  detalhes?: Record<string, string | number>,
  assinatura?: string,
): void {
  const seguros: Record<string, string | number> = {};
  for (const [chave, valor] of Object.entries(detalhes ?? {})) {
    seguros[chave] = encurtar(valor);
  }

  registro.eventos.push({
    id: registro.proximo++,
    ts: Date.now(),
    camada,
    acao: String(encurtar(String(acao))).slice(0, 120),
    detalhes: Object.keys(seguros).length ? seguros : undefined,
    assinatura,
  });

  if (registro.eventos.length > CAPACIDADE) {
    registro.eventos.splice(0, registro.eventos.length - CAPACIDADE);
  }
}

/** Devolve o que aconteceu depois de um certo ponto. */
export function ler(desde = 0): { eventos: Evento[]; ultimo: number } {
  const eventos = desde ? registro.eventos.filter((e) => e.id > desde) : registro.eventos;
  return {
    eventos,
    ultimo: registro.eventos.length ? registro.eventos[registro.eventos.length - 1].id : 0,
  };
}

export function limparLog(): void {
  registro.eventos.length = 0;
}

/** Marca o tempo de uma operação e registra quanto levou. */
export async function cronometrar<T>(
  camada: Camada,
  acao: string,
  operacao: () => Promise<T>,
  detalhes?: (resultado: T) => Record<string, string | number>,
): Promise<T> {
  const t0 = Date.now();
  const resultado = await operacao();
  registrar(camada, acao, {
    ...(detalhes ? detalhes(resultado) : {}),
    duração: `${Date.now() - t0} ms`,
  });
  return resultado;
}
