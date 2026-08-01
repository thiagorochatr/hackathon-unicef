import "server-only";
import { carregarCifra, fatorDeMascaramento, nucleo } from "./parametros";
import type { Setor } from "../tipos";
import { registrar } from "../diario";

/**
 * O nó de cruzamento.
 *
 * Repare no que este arquivo **não** importa: nada de `comite`, nada de chave
 * secreta. Ele guarda envelopes fechados e sabe somá-los — só isso. Não
 * consegue abrir nenhum, nem o resultado da própria soma.
 *
 * Também não sabe de que criança se trata: recebe apelidos, não identificadores.
 */

interface Envelope {
  /** De que setor veio. O cruzamento conta setores, não instituições. */
  setor: Setor;
  cifraB64: string;
  recebidoEm: number;
  /** Se veio de um profissional que provou credencial sem se identificar. */
  protegido: boolean;
}

/** apelido da criança -> envelopes recebidos */
const global_ = globalThis as unknown as {
  __fheRecebidos?: Map<string, Envelope[]>;
};
global_.__fheRecebidos ??= new Map();
const recebidos = global_.__fheRecebidos;

/**
 * Guarda o envelope de um setor.
 *
 * Um envelope por setor: se três professores da mesma escola emitissem, seriam
 * três sinais de educação, e somá-los fingiria uma convergência que não houve.
 * O último sinal do setor prevalece — na demonstração isso permite substituir um
 * apontamento por uma denúncia sem reiniciar tudo.
 */
export function receber(
  apelido: string,
  setor: Setor,
  cifraB64: string,
  protegido = false,
): void {
  const atuais = (recebidos.get(apelido) ?? []).filter((e) => e.setor !== setor);
  atuais.push({ setor, cifraB64, recebidoEm: Date.now(), protegido });
  recebidos.set(apelido, atuais);

  registrar("fha", "envelope recebido pelo nó", {
    setor,
    origem: protegido ? "profissional protegido" : "sistema do órgão",
    "envelopes agora": atuais.length,
    "o nó consegue abrir": "não — não tem chave secreta",
  });
}

export function listar(apelido: string): Envelope[] {
  return recebidos.get(apelido) ?? [];
}

export function limpar(apelido?: string): void {
  if (apelido) recebidos.delete(apelido);
  else recebidos.clear();
}

/**
 * Soma os envelopes sem abrir nenhum. O resultado continua fechado — quem
 * chamar esta função recebe outro envelope, não um número.
 */
async function somar(apelido: string) {
  const envelopes = listar(apelido);
  if (envelopes.length === 0) return null;

  const { avaliador } = await nucleo();
  const soma = await carregarCifra(envelopes[0].cifraB64);
  for (const e of envelopes.slice(1)) {
    const parcela = await carregarCifra(e.cifraB64);
    avaliador.add(soma, parcela, soma);
    parcela.delete();
  }

  registrar("fha", "soma feita às cegas", {
    parcelas: envelopes.length,
    setores: envelopes.map((e) => e.setor).join(" + "),
    "chave secreta usada": "nenhuma",
    "parcelas abertas": "nenhuma",
  });
  return soma;
}

/**
 * Compara a soma com o limite **sem abrir nada**, e devolve o resultado ainda
 * fechado.
 *
 * ## Como comparar sem enxergar
 *
 * A conta é `r · s · (s − 1)`, tudo dentro do envelope:
 *
 * - se a soma é 0 ou 1, um dos fatores é zero e o resultado é **zero**;
 * - se a soma é 2 ou mais, nenhum fator é zero e o resultado é `r` vezes algo,
 *   ou seja, um número sorteado.
 *
 * Quem abrir isso descobre se é zero ou não, e mais nada. Sem o fator `r`, um
 * resultado 2 significaria soma 2 e um resultado 6 significaria soma 3 — a
 * contagem vazaria pelo próprio valor. Com ele, 2 e 3 e 4 produzem números sem
 * relação nenhuma entre si.
 *
 * Para um limite diferente de 2 seriam mais fatores, `s · (s−1) · (s−2)…`, e
 * cada multiplicação a mais gasta orçamento de ruído. O parâmetro escolhido
 * comporta o limite 2 com folga larga.
 *
 * As chaves de relinearização vêm por parâmetro, e não de um `import` do
 * comitê. Elas são públicas — servem para arrumar o envelope depois de
 * multiplicar, e não abrem nada — mas mesmo assim entram por fora, para que a
 * frase do topo deste arquivo continue conferível de relance.
 */
export async function avaliarLimiar(
  apelido: string,
  limiar: number,
  relinearizacaoB64: string,
): Promise<string | null> {
  const soma = await somar(apelido);
  if (!soma) return null;

  const { seal, contexto, codificador, avaliador, moduloAberto } = await nucleo();

  const relin = seal.RelinKeys();
  relin.load(contexto, relinearizacaoB64);

  // s · (s−1) · … · (s − limiar + 1), começando por uma cópia da soma.
  const produto = await carregarCifra(soma.save());
  for (let i = 1; i < limiar; i += 1) {
    const constante = codificador.encode(Int32Array.from([i]));
    if (!constante) throw new Error("falha ao preparar a comparação");
    const deslocado = seal.CipherText();
    avaliador.subPlain(soma, constante, deslocado);
    constante.delete();

    avaliador.multiply(produto, deslocado, produto);
    avaliador.relinearize(produto, relin, produto);
    deslocado.delete();
  }

  // O mascaramento: sem ele, o valor aberto entregaria a contagem.
  const fator = codificador.encode(
    Int32Array.from([fatorDeMascaramento(moduloAberto)]),
  );
  if (!fator) throw new Error("falha ao mascarar a comparação");
  avaliador.multiplyPlain(produto, fator, produto);
  fator.delete();

  const b64 = produto.save();
  produto.delete();
  soma.delete();
  relin.delete();

  registrar("fha", "comparação com o limite, dentro do envelope", {
    conta: `r · s · (s−1), limite ${limiar}`,
    "fator de máscara": "sorteado agora",
    resultado: `${b64.length.toLocaleString("pt-BR")} letras, ainda fechado`,
    "o nó soube o resultado": "não",
  });
  return b64;
}
