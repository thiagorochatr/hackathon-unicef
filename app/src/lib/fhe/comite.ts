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
  /**
   * Chaves de relinearização. São **públicas**: servem só para arrumar o
   * envelope depois de uma multiplicação, e não abrem nada. O nó de cruzamento
   * precisa delas para conseguir comparar sem ter a chave secreta.
   */
  relinearizacaoB64: string;
  abrir: (cifraB64: string) => Promise<number>;
  abrirComOutraChave: (cifraB64: string) => Promise<number>;
}

const global_ = globalThis as unknown as { __fheComite?: Promise<Chaves> };

async function gerar(): Promise<Chaves> {
  const { seal, contexto, codificador } = await nucleo();

  const gerador = seal.KeyGenerator(contexto);
  const secreta = gerador.secretKey();
  const publica = gerador.createPublicKey();
  const relinearizacao = gerador.createRelinKeys();
  const decifrador = seal.Decryptor(contexto, secreta);

  // Uma segunda chave, sem nenhuma relação com a primeira, usada só para
  // demonstrar que sem a chave certa não se obtém nada de útil. Criada uma vez
  // porque gerar chaves é caro.
  const geradorIntruso = seal.KeyGenerator(contexto);
  const decifradorIntruso = seal.Decryptor(contexto, geradorIntruso.secretKey());

  const publicaB64 = publica.save();
  const relinearizacaoB64 = relinearizacao.save();
  publica.delete();
  relinearizacao.delete();
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
    relinearizacaoB64,
    abrir: (cifraB64) => abrirCom(decifrador, cifraB64),
    abrirComOutraChave: (cifraB64) => abrirCom(decifradorIntruso, cifraB64),
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
 * Isto sai para o nó de cruzamento. Não é segredo: com estas chaves dá para
 * multiplicar envelopes, e não para abrir nenhum.
 */
export async function chavesDeRelinearizacao(): Promise<string> {
  return (await chaves()).relinearizacaoB64;
}

/**
 * Abre o resultado da comparação e responde apenas **sim** ou **não**.
 *
 * O que chega aqui não é a soma: é a soma já comparada com o limite, dentro do
 * envelope, e mascarada com um fator sorteado pelo nó. Por isso o número que sai
 * da abertura não diz nada além de ser zero ou não ser.
 *
 * O comitê aprende exatamente um bit. Não sabe se foram dois sinais fracos ou
 * uma denúncia sozinha, nem quantos setores participaram. Antes ele sabia a
 * contagem; era a última coisa que ele aprendia além do necessário.
 *
 * O número aberto vai junto só para a tela poder mostrá-lo — é ruído com
 * significado nenhum, e mostrá-lo é a forma de deixar isso evidente.
 */
export async function avaliarVeredito(
  vereditoB64: string,
): Promise<{ alerta: boolean; aberto: number }> {
  const aberto = await (await chaves()).abrir(vereditoB64);
  return { alerta: aberto !== 0, aberto };
}

/**
 * Demonstração de que o texto cifrado é cifrado mesmo: a mesma soma, aberta com
 * uma chave diferente, devolve um número sem sentido.
 */
export async function abrirComChaveErrada(cifraB64: string): Promise<number> {
  return (await chaves()).abrirComOutraChave(cifraB64);
}
