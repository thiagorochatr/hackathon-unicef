import "server-only";
import { carregarCifra, nucleo } from "./parametros";

/**
 * O comitê é a única parte que tem a chave capaz de abrir os envelopes.
 *
 * A chave secreta **não é exportada deste arquivo**. O que sai daqui é apenas a
 * chave pública, que serve só para fechar envelopes, e uma resposta enxuta
 * sobre a soma. Essa separação é o que sustenta a frase "o nó de cruzamento não
 * consegue ver nada": ele nem tem como.
 *
 * Na versão completa esta chave não existe inteira em lugar nenhum — ela é
 * repartida entre várias instituições, e é preciso um número mínimo delas
 * concordando para abrir qualquer coisa.
 */

interface Chaves {
  publicaB64: string;
  abrirSoma: (somaB64: string) => Promise<number>;
  abrirComOutraChave: (somaB64: string) => Promise<number>;
}

const global_ = globalThis as unknown as { __fheComite?: Promise<Chaves> };

async function gerar(): Promise<Chaves> {
  const { seal, contexto, codificador } = await nucleo();

  const gerador = seal.KeyGenerator(contexto);
  const secreta = gerador.secretKey();
  const publica = gerador.createPublicKey();
  const decifrador = seal.Decryptor(contexto, secreta);

  // Uma segunda chave, sem nenhuma relação com a primeira, usada só para
  // demonstrar que sem a chave certa não se obtém nada de útil. Criada uma vez
  // porque gerar chaves é caro.
  const geradorIntruso = seal.KeyGenerator(contexto);
  const decifradorIntruso = seal.Decryptor(contexto, geradorIntruso.secretKey());

  const publicaB64 = publica.save();
  publica.delete();
  gerador.delete();
  geradorIntruso.delete();

  async function abrirCom(
    quem: typeof decifrador,
    somaB64: string,
  ): Promise<number> {
    const c = await carregarCifra(somaB64);
    const aberto = quem.decrypt(c);
    c.delete();
    if (!aberto) return Number.NaN;
    const valor = Number(codificador.decode(aberto)![0]);
    aberto.delete();
    return valor;
  }

  return {
    publicaB64,
    abrirSoma: (somaB64) => abrirCom(decifrador, somaB64),
    abrirComOutraChave: (somaB64) => abrirCom(decifradorIntruso, somaB64),
  };
}

function chaves(): Promise<Chaves> {
  global_.__fheComite ??= gerar();
  return global_.__fheComite;
}

/** Só isto sai do comitê para as instituições: a chave de fechar. */
export async function chavePublica(): Promise<string> {
  return (await chaves()).publicaB64;
}

/**
 * Abre **apenas a soma** e responde se o limite foi alcançado.
 *
 * Limitação desta versão, dita na cara: aqui o comitê fica sabendo quantos
 * sinais coincidiram. Na versão completa a comparação também acontece dentro do
 * envelope, e só sai um "sim" ou "não".
 */
export async function avaliarSoma(
  somaB64: string,
  limite: number,
): Promise<{ contagem: number; alerta: boolean }> {
  const contagem = await (await chaves()).abrirSoma(somaB64);
  return { contagem, alerta: contagem >= limite };
}

/**
 * Demonstração de que o texto cifrado é cifrado mesmo: a mesma soma, aberta com
 * uma chave diferente, devolve um número sem sentido.
 */
export async function abrirComChaveErrada(somaB64: string): Promise<number> {
  return (await chaves()).abrirComOutraChave(somaB64);
}
