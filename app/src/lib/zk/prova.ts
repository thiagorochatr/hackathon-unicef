"use client";

/**
 * Geração da prova, **no navegador de quem denuncia**.
 *
 * Isto não é uma escolha de desempenho: é a camada inteira. Quem gera a prova
 * precisa do segredo da identidade. Se a geração acontecesse num servidor —
 * nosso ou de terceiro — esse servidor saberia quem denunciou, e não haveria
 * mais denúncia protegida nenhuma.
 *
 * Os artefatos do circuito são servidos por nós, de `/zk`, e não por uma rede
 * externa. Um pedido a um CDN de fora contaria a esse CDN que alguém daquele
 * endereço está prestes a denunciar.
 */

const PROFUNDIDADE = 16;

const ARTEFATOS = {
  wasm: `/zk/semaphore-${PROFUNDIDADE}.wasm`,
  zkey: `/zk/semaphore-${PROFUNDIDADE}.zkey`,
};

export interface ProvaGerada {
  /** Os 8 elementos do Groth16. O servidor os converte para bytes. */
  pontos: string[];
  anulador: string;
  raiz: string;
  /** Quanto tempo levou aqui, no aparelho. Vale mostrar na tela. */
  ms: number;
}

/**
 * Prova que o dono do segredo está na árvore, sem dizer qual folha é.
 *
 * `mensagem` é o identificador do caso: ele entra na prova, e por isso quem
 * repassa a transação não consegue reaproveitá-la para abrir outro caso.
 * `escopo` é município e período: é ele que faz o anulador se repetir se a mesma
 * pessoa tentar denunciar duas vezes no mesmo mês.
 */
export async function gerarProva(
  segredo: string,
  folhas: string[],
  alertaIdHex: string,
  municipioIbge: number,
  periodo: number,
): Promise<ProvaGerada> {
  const [{ Identity }, { Group }, { generateProof }] = await Promise.all([
    import("@semaphore-protocol/identity"),
    import("@semaphore-protocol/group"),
    import("@semaphore-protocol/proof"),
  ]);

  const identidade = Identity.import(segredo);
  const grupo = new Group(folhas.map((f) => BigInt(f)));
  const escopo = (BigInt(municipioIbge) << 32n) | BigInt(periodo);

  const t0 = performance.now();
  const prova = await generateProof(
    identidade,
    grupo,
    BigInt("0x" + alertaIdHex).toString(),
    escopo.toString(),
    PROFUNDIDADE,
    ARTEFATOS,
  );
  const ms = Math.round(performance.now() - t0);

  return {
    pontos: prova.points as unknown as string[],
    anulador: prova.nullifier.toString(),
    raiz: prova.merkleTreeRoot.toString(),
    ms,
  };
}

/** Um identificador de caso sorteado aqui, sem relação com criança nenhuma. */
export function novoAlertaId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
