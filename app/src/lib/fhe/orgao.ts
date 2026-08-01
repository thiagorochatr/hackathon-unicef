import "server-only";
import { chavePublica } from "./comite";
import { nucleo } from "./parametros";
import { registrar } from "../diario";

/**
 * O lado do órgão que emite o sinal.
 *
 * Ele recebe do comitê apenas a chave pública, que só serve para fechar
 * envelopes. Com ela não dá para abrir nada — nem o que ele mesmo fechou.
 *
 * Na vida real este código rodaria dentro do sistema da UBS, da escola ou do
 * CRAS. Aqui roda no mesmo servidor por ser uma demonstração, mas usando só o
 * que uma instituição de fato teria em mãos.
 */

type Cifrador = ReturnType<
  Awaited<ReturnType<typeof nucleo>>["seal"]["Encryptor"]
>;

const global_ = globalThis as unknown as { __fheOrgao?: Promise<Cifrador> };

async function cifrador(): Promise<Cifrador> {
  global_.__fheOrgao ??= (async () => {
    const { seal, contexto } = await nucleo();
    const publica = seal.PublicKey();
    publica.load(contexto, await chavePublica());
    const c = seal.Encryptor(contexto, publica);
    publica.delete();
    return c;
  })();
  return global_.__fheOrgao;
}

/**
 * Fecha o envelope com o peso do sinal dentro.
 *
 * O nó que soma não vê diferença nenhuma entre um apontamento e uma denúncia:
 * os dois são envelope fechado do mesmo tamanho. É a soma que decide, e ela
 * acontece sem ninguém abrir nada.
 */
export async function cifrarComoOrgao(valor: number): Promise<string> {
  const { codificador } = await nucleo();
  const cifra = await cifrador();

  const aberto = codificador.encode(Int32Array.from([valor]));
  if (!aberto) throw new Error("falha ao preparar o sinal");

  const fechado = cifra.encrypt(aberto);
  aberto.delete();
  if (!fechado) throw new Error("falha ao fechar o envelope");

  const b64 = fechado.save();
  fechado.delete();

  registrar("fha", "envelope lacrado", {
    tamanho: `${b64.length.toLocaleString("pt-BR")} letras`,
    "chave usada": "pública — não abre nada",
    "peso dentro": "cifrado, invisível de fora",
  });
  return b64;
}
