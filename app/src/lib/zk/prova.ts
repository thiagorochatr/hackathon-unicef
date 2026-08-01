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
  /** Sal do compromisso. Sem ele o registro viraria identificador de criança. */
  sal: string;
  /** Quanto tempo levou aqui, no aparelho. Vale mostrar na tela. */
  ms: number;
}

/**
 * Prova que o dono do segredo está na árvore do setor, sem dizer qual folha é.
 *
 * A **mensagem** é o compromisso do sinal: ela amarra a prova a esta criança e a
 * este peso, então quem repassa a transação não consegue trocar nem um nem
 * outro. O compromisso leva um sal sorteado aqui — sem ele, o valor que vai para
 * a rede seria sempre o mesmo para a mesma criança, virando um identificador
 * permanente dela.
 *
 * O **escopo** é município, setor e período: é ele que faz o anulador se repetir
 * se a mesma pessoa tentar emitir dois sinais protegidos no mesmo mês.
 */
export async function gerarProva(
  segredo: string,
  folhas: string[],
  apelido: string,
  peso: 1 | 2,
  municipioIbge: number,
  setorByte: number,
  periodo: number,
): Promise<ProvaGerada> {
  const [{ Identity }, { Group }, { generateProof }] = await Promise.all([
    import("@semaphore-protocol/identity"),
    import("@semaphore-protocol/group"),
    import("@semaphore-protocol/proof"),
  ]);

  const identidade = Identity.import(segredo);
  const grupo = new Group(folhas.map((f) => BigInt(f)));

  const sal = sorteioHex(16);
  const compromisso = await compromissoDoSinal(apelido, peso, sal);
  const escopo =
    (BigInt(municipioIbge) << 40n) | (BigInt(setorByte) << 32n) | BigInt(periodo);

  const t0 = performance.now();
  const prova = await generateProof(
    identidade,
    grupo,
    BigInt("0x" + compromisso).toString(),
    escopo.toString(),
    PROFUNDIDADE,
    ARTEFATOS,
  );
  const ms = Math.round(performance.now() - t0);

  // O log fica no servidor, mas este evento nasce aqui — a prova é gerada
  // nesta máquina, e o tempo dela é dos números que mais valem mostrar. O que
  // viaja são grandezas, nunca o segredo nem o apelido.
  void fetch("/api/log", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      acao: "prova gerada no navegador de quem denuncia",
      detalhes: {
        tempo: `${ms} ms`,
        tamanho: "256 bytes",
        "o segredo saiu do aparelho": "não",
        "quem provou": "não dá para saber, nem para nós",
        "profundidade da árvore": PROFUNDIDADE,
      },
    }),
  }).catch(() => {
    // o log é acessório: se falhar, a denúncia segue
  });

  return {
    pontos: prova.points as unknown as string[],
    anulador: prova.nullifier.toString(),
    raiz: prova.merkleTreeRoot.toString(),
    sal,
    ms,
  };
}

/** `sha256(apelido ‖ peso ‖ sal)` — precisa bater com o servidor byte a byte. */
async function compromissoDoSinal(
  apelido: string,
  peso: number,
  salHex: string,
): Promise<string> {
  const { sha256 } = await import("@noble/hashes/sha2.js");
  const entrada = new Uint8Array([
    ...new TextEncoder().encode(apelido),
    peso,
    ...hexParaBytes(salHex),
  ]);
  return paraHex(sha256(entrada));
}

const paraHex = (b: Uint8Array) =>
  Array.from(b)
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");

function hexParaBytes(hex: string): Uint8Array {
  const saida = new Uint8Array(hex.length / 2);
  for (let i = 0; i < saida.length; i += 1) {
    saida[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return saida;
}

function sorteioHex(bytes: number): string {
  return paraHex(crypto.getRandomValues(new Uint8Array(bytes)));
}


