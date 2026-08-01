import "server-only";
import { createHash } from "crypto";
import { comite, pdaAberturas, pdaInstituicao, programa } from "../cadeia";
import { registrar } from "../log";

/**
 * O registro público das aberturas do comitê.
 *
 * O comitê é a parte em que mais se pede confiança: ele tem a chave. Isto troca
 * parte dessa confiança por contagem — toda abertura que passa por aqui deixa
 * rastro assinado na rede, e qualquer pessoa lê a conta sem pedir acesso a
 * sistema nenhum.
 *
 * O que **não** resolve, e vai declarado: não impede uma abertura fora deste
 * caminho. Para isso, comitê e nó de cruzamento precisam ser operadores
 * diferentes — e aí o comitê pode recusar abrir o que não tiver pedido público.
 * Aqui os dois são o mesmo processo, então o que se ganha é a contagem, não a
 * barreira.
 */

/**
 * Resumo do envelope de veredito.
 *
 * Não precisa de sal: o veredito carrega um fator sorteado a cada avaliação,
 * então o mesmo conjunto de sinais produz um envelope diferente — e um resumo
 * diferente — toda vez. Não há como ligar duas aberturas à mesma criança.
 */
export function compromissoDoVeredito(vereditoB64: string): Buffer {
  return createHash("sha256").update(vereditoB64).digest();
}

export interface Abertura {
  assinatura: string;
  total: number;
  alertas: number;
}

/** Registra a abertura na rede. Devolve a assinatura e os totais atualizados. */
export async function registrarAbertura(
  vereditoB64: string,
  alerta: boolean,
): Promise<Abertura> {
  const quem = comite();
  const prog = programa(quem);

  const assinatura = await prog.methods
    .registrarAbertura(Array.from(compromissoDoVeredito(vereditoB64)), alerta)
    .accountsPartial({
      registro: pdaAberturas(quem.publicKey),
      emissor: pdaInstituicao(quem.publicKey),
      autoridade: quem.publicKey,
    })
    .rpc();

  const conta = await prog.account.registroAberturas.fetch(
    pdaAberturas(quem.publicKey),
  );
  registrar(
    "cadeia",
    "abertura do comitê registrada na rede",
    {
      "total de aberturas": Number(conta.total),
      "viraram alerta": Number(conta.alertas),
      "quem confere": "qualquer pessoa, lendo a conta",
    },
    assinatura,
  );

  return {
    assinatura,
    total: Number(conta.total),
    alertas: Number(conta.alertas),
  };
}

/** Lê a contagem, para a tela poder mostrá-la sem abrir nada. */
export async function lerAberturas(): Promise<{
  total: number;
  alertas: number;
  endereco: string;
} | null> {
  const quem = comite();
  const endereco = pdaAberturas(quem.publicKey);
  const conta = await programa(quem).account.registroAberturas.fetchNullable(
    endereco,
  );
  if (!conta) return null;
  return {
    total: Number(conta.total),
    alertas: Number(conta.alertas),
    endereco: endereco.toBase58(),
  };
}
