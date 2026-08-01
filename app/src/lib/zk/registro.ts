import "server-only";
import { sha256 } from "@noble/hashes/sha2.js";
import { comite, conexao, programa } from "../cadeia";
import type { Setor } from "../tipos";

/**
 * O compromisso do sinal, e a conferência do registro que a rede guarda.
 *
 * ## Por que o compromisso leva um sal
 *
 * O compromisso vai para a rede, e a rede é permanente. Sem o sal ele seria
 * `hash(apelido, peso)` — sempre o mesmo valor para a mesma criança, ou seja, um
 * identificador estável de criança gravado para sempre. Qualquer pessoa poderia
 * juntar todos os sinais sobre a mesma criança ao longo dos anos.
 *
 * Com um sal sorteado a cada sinal, o que sobe é indistinguível de ruído. Quem
 * conhece o apelido, o peso e o sal confere que bate; quem não conhece não
 * aprende nada — nem que dois sinais falam da mesma criança.
 */

/** `sha256(apelido ‖ peso ‖ sal)`. Os dois lados precisam calcular igual. */
export function compromissoDoSinal(
  apelido: string,
  peso: number,
  salHex: string,
): string {
  const entrada = new Uint8Array([
    ...Buffer.from(apelido, "utf8"),
    peso,
    ...Buffer.from(salHex, "hex"),
  ]);
  return Buffer.from(sha256(entrada)).toString("hex");
}

const dormir = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface Registro {
  assinatura: string;
  setor: Setor;
  peso: number;
  apelido: string;
  sal: string;
}

const SETOR_DO_EVENTO: Record<string, Setor> = {
  saude: "saude",
  educacao: "educacao",
  assistencia: "assistencia",
};

/**
 * Confere que o sinal tem registro na rede antes de aceitar o envelope.
 *
 * Sem esta conferência a prova seria decorativa: o nó de cruzamento tem a chave
 * pública e conseguiria fechar envelopes sozinho, inventando sinais que ninguém
 * emitiu. Exigir o registro tira essa possibilidade — ele não consegue produzir
 * uma prova de credencial.
 *
 * Falha alto de propósito. Um envelope aceito sem registro seria pior do que
 * não ter registro nenhum, porque a tela diria que houve conferência.
 */
export async function conferirRegistro(r: Registro): Promise<void> {
  const prog = programa(comite());
  const rede = conexao();

  let tx = null;
  for (let tentativa = 0; tentativa < 5 && !tx; tentativa += 1) {
    try {
      tx = await rede.getTransaction(r.assinatura, {
        commitment: "confirmed",
        maxSupportedTransactionVersion: 0,
      });
    } catch {
      // a rede pública limita requisições; a espera abaixo resolve
    }
    if (!tx) await dormir(500 * (tentativa + 1));
  }
  if (!tx) {
    throw new Error(
      "não foi possível ler o registro do sinal na rede; o envelope não foi aceito",
    );
  }
  if (tx.meta?.err) {
    throw new Error("a transação do sinal falhou na rede");
  }

  const esperado = compromissoDoSinal(r.apelido, r.peso, r.sal);

  for (const linha of tx.meta?.logMessages ?? []) {
    const dado = linha.match(/^Program data: (.+)$/)?.[1];
    if (!dado) continue;
    let evento;
    try {
      evento = prog.coder.events.decode(dado);
    } catch {
      continue;
    }
    if (evento?.name !== "eventoSinalCredenciado") continue;

    const d = evento.data as {
      setor: Record<string, unknown>;
      peso: number;
      compromissoSinal: number[];
    };
    const setorDoEvento = SETOR_DO_EVENTO[Object.keys(d.setor)[0]];
    const compromisso = Buffer.from(d.compromissoSinal).toString("hex");

    if (setorDoEvento !== r.setor) {
      throw new Error("o setor do registro não é o do sinal");
    }
    if (d.peso !== r.peso) {
      throw new Error("o peso do registro não é o do sinal");
    }
    if (compromisso !== esperado) {
      throw new Error(
        "o compromisso registrado na rede não corresponde a este sinal",
      );
    }
    return;
  }

  throw new Error("a transação não registra nenhum sinal credenciado");
}
