import "server-only";
import { createHash } from "crypto";
import { ristretto255_oprf } from "@noble/curves/ed25519.js";
import { apelidoEmHex, normalizarIdentificador } from "./apelido";

/**
 * Apelido da criança.
 *
 * ## Por que não é um resumo do identificador
 *
 * Existem cem bilhões de CPFs possíveis. Qualquer pessoa que pegasse um apelido
 * poderia testar todos até achar de quem é. Por isso entra uma chave de serviço
 * no meio: sem ela, o teste não é possível.
 *
 * ## Por que não é mais um HMAC
 *
 * Com HMAC, quem quisesse o apelido precisava **entregar o identificador** a
 * quem tem a chave. Isso era aceitável quando o cálculo acontecia dentro do
 * órgão que já atende a criança, e deixou de ser quando um profissional passou a
 * emitir sinal sem se identificar: ele não pode contar a ninguém de qual criança
 * está falando, senão o anonimato dele protege a pessoa errada.
 *
 * A função virou uma **OPRF** (RFC 9497, sobre ristretto255). O navegador embaralha
 * o identificador com um fator sorteado, manda o valor embaralhado, recebe a
 * resposta e desembaralha. O resultado é idêntico ao que sairia do cálculo
 * direto, e no meio do caminho:
 *
 * - quem tem a chave **não descobre** qual identificador foi consultado;
 * - quem consulta **não aprende** a chave, nem consegue calcular outro apelido
 *   sozinho.
 *
 * ## O que ainda falta, e está declarado
 *
 * A chave continua inteira num lugar só. Ela não vaza nas consultas, mas quem a
 * detém consegue calcular o apelido de um identificador que já conheça. A versão
 * completa reparte a chave entre instituições, e aí é preciso um número mínimo
 * delas para qualquer cálculo acontecer.
 */

const { oprf } = ristretto255_oprf;

const CHAVE_DEMO = "demonstracao-unicef-2026-nao-usar-em-producao";
const CONTEXTO = new TextEncoder().encode("elo/apelido/v1");

const global_ = globalThis as unknown as { __chaveApelido?: Uint8Array };

/**
 * A chave da OPRF, derivada da mesma variável de ambiente de antes.
 *
 * Fica em `globalThis` porque derivar a cada chamada seria desperdício, e porque
 * assim sobrevive à recarga de módulo em desenvolvimento.
 */
function chave(): Uint8Array {
  if (global_.__chaveApelido) return global_.__chaveApelido;
  const semente = new TextEncoder().encode(
    process.env.CHAVE_APELIDO ?? CHAVE_DEMO,
  );
  // A semente precisa ter 32 bytes; um resumo resolve qualquer tamanho de entrada.
  const trinta_e_dois = new Uint8Array(
    createHash("sha256").update(Buffer.from(semente)).digest(),
  );
  global_.__chaveApelido = oprf.deriveKeyPair(trinta_e_dois, CONTEXTO).secretKey;
  return global_.__chaveApelido;
}

/**
 * Calcula o apelido direto, sem embaralhamento.
 *
 * É o caminho do **sistema do órgão**, que já conhece a criança porque ela é
 * atendida ali. Esconder o identificador de quem já o tem não protegeria nada.
 */
export function apelidoDaCrianca(identificador: string): string {
  const entrada = new TextEncoder().encode(
    normalizarIdentificador(identificador),
  );
  // Roda o protocolo inteiro aqui mesmo, embaralhando e desembaralhando no
  // mesmo lugar. O fator de embaralhamento se cancela, então o resultado é o
  // mesmo que sairia do caminho do navegador — e é justamente essa igualdade que
  // faz os dois tipos de sinal se encontrarem no cruzamento.
  const { blind, blinded } = oprf.blind(entrada);
  return apelidoEmHex(oprf.finalize(entrada, blind, oprf.blindEvaluate(chave(), blinded)));
}

/**
 * Responde à consulta embaralhada.
 *
 * Este é o caminho de quem emite sinal protegido. O que chega aqui é um ponto
 * embaralhado por um fator que só o navegador conhece — diferente a cada
 * consulta, mesmo para a mesma criança. Não dá para saber qual identificador
 * está por trás, nem se duas consultas falam da mesma pessoa.
 */
export function avaliarApelidoCego(embaralhado: Uint8Array): Uint8Array {
  return oprf.blindEvaluate(chave(), embaralhado);
}
