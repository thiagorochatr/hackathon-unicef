import "server-only";
import SEAL from "node-seal";

/**
 * Parâmetros públicos do esquema. Não são segredo: todo mundo precisa deles
 * para conseguir cifrar e para conseguir somar. O que é segredo é só a chave
 * do comitê, que vive em `comite.ts` e não sai de lá.
 *
 * Usamos BFV, que faz contas com números inteiros. Precisamos apenas somar
 * zeros e uns e comparar com um limite, então é o suficiente.
 *
 * Sobre memória: o node-seal guarda tudo dentro do WebAssembly, e lá não existe
 * coletor de lixo. Cada objeto criado precisa ser liberado à mão com `delete()`,
 * e os caros (contexto, avaliador, codificador) são criados uma única vez por
 * processo. Sem isso o servidor de desenvolvimento estoura a memória em poucos
 * minutos, porque cada recarga de código refazia tudo do zero.
 */

export type Biblioteca = Awaited<ReturnType<typeof SEAL>>;
export type Contexto = ReturnType<Biblioteca["Context"]>;
export type Cifra = ReturnType<Biblioteca["CipherText"]>;

const GRAU = 4096;
const BITS_TEXTO_ABERTO = 20;

export interface Nucleo {
  seal: Biblioteca;
  contexto: Contexto;
  codificador: ReturnType<Biblioteca["BatchEncoder"]>;
  avaliador: ReturnType<Biblioteca["Evaluator"]>;
}

/**
 * Guardado no escopo global de propósito: em desenvolvimento o Next recarrega
 * os módulos a cada alteração, e sem isto uma nova cópia de tudo seria criada
 * a cada recarga, sem que a anterior fosse liberada.
 */
const global_ = globalThis as unknown as { __fheNucleo?: Promise<Nucleo> };

async function montar(): Promise<Nucleo> {
  const seal = await SEAL();

  const parametros = seal.EncryptionParameters(seal.SchemeType.bfv);
  parametros.setPolyModulusDegree(GRAU);
  parametros.setCoeffModulus(
    seal.CoeffModulus.BFVDefault(GRAU, seal.SecurityLevel.tc128),
  );
  parametros.setPlainModulus(seal.PlainModulus.Batching(GRAU, BITS_TEXTO_ABERTO));

  const contexto = seal.Context(parametros, true, seal.SecurityLevel.tc128);
  parametros.delete();

  if (!contexto.parametersSet()) {
    throw new Error("parâmetros de criptografia inválidos");
  }

  return {
    seal,
    contexto,
    codificador: seal.BatchEncoder(contexto),
    avaliador: seal.Evaluator(contexto),
  };
}

export function nucleo(): Promise<Nucleo> {
  global_.__fheNucleo ??= montar();
  return global_.__fheNucleo;
}

/**
 * Carrega um texto cifrado. Quem chama é responsável por liberar com
 * `.delete()` quando terminar.
 */
export async function carregarCifra(base64: string): Promise<Cifra> {
  const { seal, contexto } = await nucleo();
  const c = seal.CipherText();
  c.load(contexto, base64);
  return c;
}
