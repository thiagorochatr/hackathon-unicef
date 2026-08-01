import "server-only";
import { PublicKey } from "@solana/web3.js";
import { comite, conexao, ID_PROGRAMA, programa } from "../cadeia";
import type { Setor } from "../tipos";

/**
 * A lista de profissionais credenciados de um município.
 *
 * O detalhe que importa: as folhas **não** ficam guardadas aqui. Elas são lidas
 * de volta da rede, a partir dos eventos de credenciamento. Qualquer pessoa faz
 * a mesma leitura e chega à mesma árvore — sem pedir acesso a sistema nenhum, e
 * sem precisar acreditar em nós.
 *
 * Saber quem está na árvore não revela quem denunciou: a prova diz "sou um
 * destes", e não qual.
 */

/** Sorocaba/SP — o cenário fictício da demonstração. */
export const MUNICIPIO_IBGE = 3552205;

/** Profundidade fixa, casada com a chave de verificação embutida no programa. */
export const PROFUNDIDADE = 16;

/** O mesmo byte que o programa usa para compor o escopo. */
export const BYTE_DO_SETOR: Record<Setor, number> = {
  saude: 1,
  educacao: 2,
  assistencia: 3,
};

/** Uma árvore por setor, por município. */
export const pdaGrupo = (setor: Setor, municipio = MUNICIPIO_IBGE) => {
  const m = Buffer.alloc(4);
  m.writeUInt32LE(municipio);
  return PublicKey.findProgramAddressSync(
    [
      new TextEncoder().encode("grupo"),
      m,
      Buffer.from([BYTE_DO_SETOR[setor]]),
    ],
    ID_PROGRAMA,
  )[0];
};

export interface EstadoGrupo {
  endereco: string;
  setor: Setor;
  municipioIbge: number;
  /** Raiz publicada na rede, em hexadecimal. */
  raiz: string;
  membros: number;
  /** Compromissos dos credenciados, em decimal, na ordem de inserção. */
  folhas: string[];
  /** A raiz refeita a partir das folhas — tem que bater com a publicada. */
  raizRefeita: string | null;
  responsavel: string;
}

const dormir = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Espaço entre chamadas. A rede pública de testes limita com agressividade. */
const ESPACO_MS = 120;

/**
 * Busca uma transação, insistindo quando a rede reclama.
 *
 * Uma de cada vez, espaçadas, e **não** em lote: o pedido em lote estoura o
 * limite de uma vez só e volta como erro, enquanto chamadas separadas deixam a
 * biblioteca reagir ao "requisições demais" e tentar de novo sozinha.
 *
 * E falha alto quando não vier, em vez de seguir com o que chegou: uma folha
 * faltando muda a raiz, e aí a prova gerada contra a árvore incompleta
 * simplesmente não confere, sem dizer por quê. É o tipo de erro que custa horas.
 */
async function buscarTransacao(
  rede: ReturnType<typeof conexao>,
  assinatura: string,
) {
  for (let tentativa = 0; tentativa < 4; tentativa += 1) {
    try {
      const tx = await rede.getTransaction(assinatura, {
        commitment: "confirmed",
        maxSupportedTransactionVersion: 0,
      });
      if (tx) return tx;
    } catch {
      // rede reclamando; a espera abaixo resolve
    }
    await dormir(500 * (tentativa + 1));
  }
  throw new Error(
    `a rede não devolveu a transação ${assinatura}. ` +
      "Sem ela a lista de credenciados fica incompleta e nenhuma prova conferiria.",
  );
}

/**
 * O que cada transação já lida trouxe de folhas.
 *
 * Transação confirmada não muda mais, então guardar o resultado é seguro. Sem
 * isto, cada carregamento da tela releria a história inteira do grupo, o que
 * fica mais lento a cada credenciamento e esbarra no limite de requisições da
 * rede pública. Fica em `globalThis` para sobreviver à recarga em
 * desenvolvimento.
 */
const global_ = globalThis as unknown as {
  __folhasPorTransacao?: Map<string, string[]>;
};
global_.__folhasPorTransacao ??= new Map();
const lidas = global_.__folhasPorTransacao;

/**
 * Lê as folhas dos eventos de credenciamento, na ordem em que entraram.
 *
 * `quantasEsperar` vem da conta do grupo e permite parar cedo. Faz diferença
 * grande: **todo sinal protegido também referencia o grupo**, então o histórico
 * cresce a cada envio, enquanto o número de folhas só cresce a cada
 * credenciamento. Sem isso, a leitura ficava mais lenta a cada denúncia.
 */
async function folhasDaRede(
  endereco: PublicKey,
  quantasEsperar: number,
): Promise<string[]> {
  const prog = programa(comite());
  const rede = conexao();
  const assinaturas = await rede.getSignaturesForAddress(
    endereco,
    { limit: 200 },
    "confirmed",
  );

  // Vêm da mais nova para a mais velha; a ordem de inserção importa para a
  // árvore, então percorremos ao contrário.
  const emOrdem = assinaturas
    .slice()
    .reverse()
    .filter((s) => !s.err)
    .map((s) => s.signature);

  for (const assinatura of emOrdem) {
    // Já temos todas: o que vier depois não acrescenta folha nenhuma.
    const ate_agora = emOrdem.flatMap((s) => lidas.get(s) ?? []).length;
    if (quantasEsperar > 0 && ate_agora >= quantasEsperar) break;

    if (lidas.has(assinatura)) continue;
    const tx = await buscarTransacao(rede, assinatura);

    const folhas: string[] = [];
    for (const linha of tx.meta?.logMessages ?? []) {
      const dado = linha.match(/^Program data: (.+)$/)?.[1];
      if (!dado) continue;
      let evento;
      try {
        evento = prog.coder.events.decode(dado);
      } catch {
        continue; // não é evento deste programa
      }
      if (evento?.name !== "eventoCredenciados") continue;
      for (const f of evento.data.folhas as number[][]) {
        folhas.push(BigInt("0x" + Buffer.from(f).toString("hex")).toString());
      }
    }
    lidas.set(assinatura, folhas);
    await dormir(ESPACO_MS);
  }

  return emOrdem.flatMap((s) => lidas.get(s) ?? []);
}

export async function lerGrupo(setor: Setor): Promise<EstadoGrupo | null> {
  const endereco = pdaGrupo(setor);
  const prog = programa(comite());
  const conta = await prog.account.grupoCredenciados.fetchNullable(endereco);
  if (!conta) return null;

  const folhas = await folhasDaRede(endereco, conta.membros);
  const raizRefeita = folhas.length ? await raizDe(folhas) : null;

  return {
    endereco: endereco.toBase58(),
    setor,
    municipioIbge: conta.municipioIbge,
    raiz: Buffer.from(conta.raiz as number[]).toString("hex"),
    // Contamos as folhas, e não o contador guardado na conta. O contador só
    // sobe, então ele desanda se alguém credenciar duas vezes a mesma pessoa —
    // e quem manda de verdade é a lista de folhas, que é o que forma a árvore
    // e o que qualquer auditor recontaria.
    membros: folhas.length,
    folhas,
    raizRefeita,
    responsavel: conta.responsavelPadrao.toBase58(),
  };
}

/** Calcula a raiz da árvore para um conjunto de folhas. */
export async function raizDe(folhas: string[]): Promise<string> {
  const { Group } = await import("@semaphore-protocol/group");
  const g = new Group(folhas.map((f) => BigInt(f)));
  return BigInt(g.root.toString()).toString(16).padStart(64, "0");
}
