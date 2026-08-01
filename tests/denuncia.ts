import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { createHash } from "crypto";
import { readFileSync } from "fs";
import { join } from "path";
import { ComputeBudgetProgram, Keypair, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { assert } from "chai";
import type { Custodia } from "../target/types/custodia";
import { provaParaBytes, paraBytes32, valorDoEscopo } from "../scripts/zk/formato";

const enc = new TextEncoder();

/** Profundidade da árvore, fixa: é a que a chave de verificação embutida cobre. */
const PROFUNDIDADE = 16;
const MUNICIPIO = 3552205; // Sorocaba/SP — cenário fictício da demonstração

/** Educação. O mesmo byte que o programa usa para compor o escopo. */
const SETOR = { educacao: {} } as never;
const SETOR_BYTE = 2;

/**
 * O período muda a cada execução. O anulador é derivado do escopo, e o escopo
 * inclui o período — sem isto, a segunda execução esbarraria nos anuladores
 * gastos pela primeira, que ficam na devnet para sempre.
 */
const PERIODO = Math.floor(Date.now() / 1000) % 1_000_000;

const ARTEFATOS = {
  wasm: join(process.cwd(), "app", "public", "zk", `semaphore-${PROFUNDIDADE}.wasm`),
  zkey: join(process.cwd(), "app", "public", "zk", `semaphore-${PROFUNDIDADE}.zkey`),
};

/** Um apelido fictício qualquer: aqui ele nunca sai deste arquivo. */
const APELIDO = "a".repeat(64);

function pdaConfig(pid: PublicKey) {
  return PublicKey.findProgramAddressSync([enc.encode("config")], pid)[0];
}
function pdaGrupo(pid: PublicKey, municipio: number, setorByte: number) {
  const m = Buffer.alloc(4);
  m.writeUInt32LE(municipio);
  return PublicKey.findProgramAddressSync(
    [enc.encode("grupo"), m, Buffer.from([setorByte])],
    pid,
  )[0];
}
function pdaNulificador(pid: PublicKey, anulador: Buffer) {
  return PublicKey.findProgramAddressSync(
    [enc.encode("nulificador"), anulador],
    pid,
  )[0];
}

/** `sha256(apelido ‖ peso ‖ sal)` — a mesma conta que o servidor faz. */
function compromissoDoSinal(apelido: string, peso: number, salHex: string): Buffer {
  return createHash("sha256")
    .update(
      Buffer.concat([
        Buffer.from(apelido, "utf8"),
        Buffer.from([peso]),
        Buffer.from(salHex, "hex"),
      ]),
    )
    .digest();
}

const salAleatorio = () =>
  Buffer.from(Keypair.generate().publicKey.toBytes().slice(0, 16)).toString("hex");
const dormir = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe("sinal credenciado", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const provider = anchor.getProvider() as anchor.AnchorProvider;
  const program = anchor.workspace.custodia as Program<Custodia>;
  const pid = program.programId;

  /** Quem credencia no município. Chave fixa: o grupo persiste entre execuções. */
  const creas = Keypair.fromSecretKey(
    Uint8Array.from(
      JSON.parse(readFileSync(join(process.cwd(), "keys", "creas.json"), "utf8")),
    ),
  );
  /** Quem paga a taxa. Qualquer chave serve — é justamente esse o ponto. */
  const relayer = Keypair.generate();

  let identidades: any[] = [];
  let grupo: any;
  let gerarProva: any;
  let todasAsFolhas: string[] = [];

  /** Lê as folhas credenciadas direto dos eventos, na ordem em que entraram. */
  async function lerFolhas(endereco: PublicKey): Promise<string[]> {
    const assinaturas = await provider.connection.getSignaturesForAddress(
      endereco,
      { limit: 200 },
      "confirmed",
    );
    const emOrdem = assinaturas
      .slice()
      .reverse()
      .filter((s) => !s.err)
      .map((s) => s.signature);

    const folhas: string[] = [];
    for (const assinatura of emOrdem) {
      let tx = null;
      for (let tentativa = 0; tentativa < 4 && !tx; tentativa += 1) {
        try {
          tx = await provider.connection.getTransaction(assinatura, {
            commitment: "confirmed",
            maxSupportedTransactionVersion: 0,
          });
        } catch {
          // a devnet limita requisições; a espera abaixo resolve
        }
        if (!tx) await dormir(500 * (tentativa + 1));
      }
      if (!tx) throw new Error(`a rede não devolveu a transação ${assinatura}`);
      for (const linha of tx.meta?.logMessages ?? []) {
        const dado = linha.match(/^Program data: (.+)$/)?.[1];
        if (!dado) continue;
        let evento;
        try {
          evento = program.coder.events.decode(dado);
        } catch {
          continue;
        }
        if (evento?.name !== "eventoCredenciados") continue;
        for (const f of evento.data.folhas as number[][]) {
          folhas.push(BigInt("0x" + Buffer.from(f).toString("hex")).toString());
        }
      }
      await dormir(120);
    }
    return folhas;
  }

  /** Gera a prova como o navegador do profissional geraria. */
  async function provar(quem: any, peso: number, sal: string, periodo = PERIODO) {
    const compromisso = compromissoDoSinal(APELIDO, peso, sal);
    return gerarProva(
      quem,
      grupo,
      BigInt("0x" + compromisso.toString("hex")).toString(),
      valorDoEscopo(MUNICIPIO, SETOR_BYTE, periodo).toString(),
      PROFUNDIDADE,
      ARTEFATOS,
    );
  }

  /**
   * Envia o registro do sinal com o relayer como **único** signatário.
   *
   * Montado à mão de propósito: o atalho do Anchor faria a carteira do provider
   * assinar como pagadora, e aí a transação teria dois signatários. Aqui o ponto
   * inteiro é que exista um só, e que ele não seja ninguém da rede de proteção —
   * nem quem emitiu o sinal.
   */
  async function registrar(prova: any, peso: number, sal: string, periodo = PERIODO) {
    const anulador = paraBytes32(prova.nullifier);
    const instrucao = await program.methods
      .registrarSinalCredenciado(
        Array.from(provaParaBytes(prova.points)),
        Array.from(anulador),
        periodo,
        peso,
        Array.from(compromissoDoSinal(APELIDO, peso, sal)),
      )
      .accountsPartial({
        grupo: pdaGrupo(pid, MUNICIPIO, SETOR_BYTE),
        nulificador: pdaNulificador(pid, anulador),
        pagador: relayer.publicKey,
      })
      .instruction();

    const tx = new anchor.web3.Transaction()
      .add(ComputeBudgetProgram.setComputeUnitLimit({ units: 400_000 }))
      .add(instrucao);
    tx.feePayer = relayer.publicKey;
    tx.recentBlockhash = (await provider.connection.getLatestBlockhash()).blockhash;

    return anchor.web3.sendAndConfirmTransaction(provider.connection, tx, [relayer], {
      commitment: "confirmed",
    });
  }

  before(async function () {
    this.timeout(240_000);

    const { Identity } = await import("@semaphore-protocol/identity");
    const { Group } = await import("@semaphore-protocol/group");
    gerarProva = (await import("@semaphore-protocol/proof")).generateProof;

    const tx = new anchor.web3.Transaction();
    for (const k of [creas, relayer]) {
      tx.add(
        anchor.web3.SystemProgram.transfer({
          fromPubkey: provider.wallet.publicKey,
          toPubkey: k.publicKey,
          lamports: 0.1 * LAMPORTS_PER_SOL,
        }),
      );
    }
    await provider.sendAndConfirm(tx);

    const config = pdaConfig(pid);
    const enderecoGrupo = pdaGrupo(pid, MUNICIPIO, SETOR_BYTE);
    if (!(await program.account.grupoCredenciados.fetchNullable(enderecoGrupo))) {
      await program.methods
        .registrarGrupo(MUNICIPIO, SETOR, creas.publicKey)
        .accountsPartial({ config, grupo: enderecoGrupo, admin: provider.wallet.publicKey })
        .rpc();
    }

    // A árvore é acumulativa e a devnet guarda estado entre execuções: só entram
    // os que ainda não estão, e a raiz precisa cobrir **todas** as folhas.
    identidades = Array.from(
      { length: 8 },
      (_, i) => new Identity(`profissional-educacao-${i}`),
    );
    const jaNaRede = await lerFolhas(enderecoGrupo);
    const novas = identidades
      .map((i) => i.commitment.toString())
      .filter((c) => !jaNaRede.includes(c));

    todasAsFolhas = [...jaNaRede, ...novas];
    grupo = new Group(todasAsFolhas.map((f) => BigInt(f)));

    const naRede = await program.account.grupoCredenciados.fetch(enderecoGrupo);
    const raizCerta = paraBytes32(grupo.root.toString());
    const desencontrada =
      Buffer.from(naRede.raiz as number[]).toString("hex") !== raizCerta.toString("hex");

    if (novas.length || desencontrada) {
      await program.methods
        .adicionarCredenciados(
          novas.map((c) => Array.from(paraBytes32(c))),
          Array.from(raizCerta),
        )
        .accountsPartial({ config, grupo: enderecoGrupo, credenciador: creas.publicKey })
        .signers([creas])
        .rpc();
    }
  });

  it("as folhas credenciadas vão para a cadeia, e a árvore se refaz a partir delas", async function () {
    this.timeout(180_000);
    const { Group } = await import("@semaphore-protocol/group");
    const endereco = pdaGrupo(pid, MUNICIPIO, SETOR_BYTE);

    const folhas = await lerFolhas(endereco);
    assert.deepEqual(folhas, todasAsFolhas, "as folhas lidas não são as credenciadas");

    const refeita = new Group(folhas.map((f) => BigInt(f)));
    const naRede = await program.account.grupoCredenciados.fetch(endereco);
    assert.equal(
      Buffer.from(naRede.raiz as number[]).toString("hex"),
      paraBytes32(refeita.root.toString()).toString("hex"),
      "a raiz publicada não corresponde às folhas credenciadas",
    );
    console.log(`      → árvore refeita a partir de ${folhas.length} folhas da rede`);
  });

  it("um sinal credenciado é registrado — e ninguém assinou por instituição", async function () {
    this.timeout(180_000);
    const sal = salAleatorio();
    const prova = await provar(identidades[0], 2, sal);
    const assinatura = await registrar(prova, 2, sal);

    const tx = await provider.connection.getTransaction(assinatura, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    });
    const assinantes = tx!.transaction.message
      .getAccountKeys()
      .staticAccountKeys.slice(0, tx!.transaction.message.header.numRequiredSignatures);
    assert.equal(assinantes.length, 1, "deveria haver um único signatário");
    assert.equal(assinantes[0].toBase58(), relayer.publicKey.toBase58());

    const linha = (tx!.meta?.logMessages ?? []).find(
      (l) => l.includes(pid.toBase58()) && l.includes("consumed"),
    );
    const consumo = Number(linha?.match(/consumed (\d+) of/)?.[1] ?? 0);
    console.log(
      `      → conferir a prova e registrar: ${consumo.toLocaleString("pt-BR")} unidades`,
    );
    assert.isBelow(consumo, 1_400_000, "não cabe no teto de uma transação");
  });

  it("o registro não abre caso nenhum — quem abre é o cruzamento", async function () {
    // A instrução não toca sequer a conta do caso. Este teste existe para que a
    // separação fique escrita, e não só entendida.
    const instrucao = program.idl.instructions.find(
      (i) => i.name.replace(/_/g, "").toLowerCase() === "registrarsinalcredenciado",
    );
    assert.isDefined(instrucao, "a instrução não está no IDL");
    const nomes = instrucao!.accounts.map((a) => a.name.replace(/_/g, "").toLowerCase());
    assert.notInclude(nomes, "caso");
    assert.deepEqual(nomes.slice().sort(), [
      "grupo",
      "nulificador",
      "pagador",
      "systemprogram",
    ]);
  });

  it("a mesma pessoa não emite dois sinais no mesmo setor e período", async function () {
    this.timeout(180_000);
    const sal = salAleatorio();
    const prova = await provar(identidades[0], 1, sal);
    try {
      await registrar(prova, 1, sal);
      assert.fail("o segundo sinal deveria ter sido barrado");
    } catch (e) {
      assert.match(String(e), /already in use|custom program error/i);
    }
  });

  it("prova adulterada não passa", async function () {
    this.timeout(180_000);
    const sal = salAleatorio();
    const prova = await provar(identidades[1], 2, sal);
    const pontos = [...prova.points];
    pontos[0] = (BigInt(pontos[0]) + 1n).toString();
    try {
      await registrar({ ...prova, points: pontos }, 2, sal);
      assert.fail("prova adulterada deveria falhar");
    } catch (e) {
      assert.match(String(e), /ProvaInvalida|ProvaMalFormada|custom program error/i);
    }
  });

  it("não dá para trocar o peso de um sinal já provado", async function () {
    this.timeout(180_000);
    // Prova feita para um apontamento, apresentada como denúncia: o compromisso
    // embutido na prova não bate mais. É o que impede quem repassa a transação
    // de transformar uma observação em acusação.
    const sal = salAleatorio();
    const prova = await provar(identidades[2], 1, sal);
    try {
      await registrar(prova, 2, sal);
      assert.fail("trocar o peso deveria falhar");
    } catch (e) {
      assert.match(String(e), /ProvaInvalida|custom program error/i);
    }
  });

  it("a prova de um período não serve para outro", async function () {
    this.timeout(180_000);
    const sal = salAleatorio();
    const prova = await provar(identidades[3], 2, sal, PERIODO);
    try {
      await registrar(prova, 2, sal, PERIODO + 1);
      assert.fail("a prova não deveria valer para outro período");
    } catch (e) {
      assert.match(String(e), /ProvaInvalida|custom program error/i);
    }
  });

  it("quem não está na lista do setor não consegue emitir", async function () {
    this.timeout(180_000);
    const { Identity } = await import("@semaphore-protocol/identity");
    const { Group } = await import("@semaphore-protocol/group");

    // Alguém monta a própria árvore, com a própria identidade dentro, e tenta
    // provar contra ela. A raiz que o programa usa é a cadastrada, não a dele.
    const intruso = new Identity("nao-credenciado");
    const arvoreFalsa = new Group([intruso.commitment]);
    const sal = salAleatorio();
    const prova = await gerarProva(
      intruso,
      arvoreFalsa,
      BigInt("0x" + compromissoDoSinal(APELIDO, 2, sal).toString("hex")).toString(),
      valorDoEscopo(MUNICIPIO, SETOR_BYTE, PERIODO).toString(),
      PROFUNDIDADE,
      ARTEFATOS,
    );
    try {
      await registrar(prova, 2, sal);
      assert.fail("um intruso não deveria conseguir emitir sinal");
    } catch (e) {
      assert.match(String(e), /ProvaInvalida|custom program error/i);
    }
  });

  it("toda abertura do comitê fica contada na rede", async function () {
    this.timeout(180_000);
    const comite = Keypair.fromSecretKey(
      Uint8Array.from(
        JSON.parse(readFileSync(join(process.cwd(), "keys", "comite.json"), "utf8")),
      ),
    );
    const registro = PublicKey.findProgramAddressSync(
      [enc.encode("aberturas"), comite.publicKey.toBuffer()],
      pid,
    )[0];
    const antes = await program.account.registroAberturas.fetchNullable(registro);
    const totalAntes = antes ? Number(antes.total) : 0;
    const alertasAntes = antes ? Number(antes.alertas) : 0;

    const compromisso = Array.from(
      Buffer.from(Keypair.generate().publicKey.toBytes()),
    );
    await program.methods
      .registrarAbertura(compromisso, true)
      .accountsPartial({
        registro,
        emissor: PublicKey.findProgramAddressSync(
          [enc.encode("inst"), comite.publicKey.toBuffer()],
          pid,
        )[0],
        autoridade: comite.publicKey,
      })
      .signers([comite])
      .rpc();

    const depois = await program.account.registroAberturas.fetch(registro);
    assert.equal(Number(depois.total), totalAntes + 1, "o total não subiu");
    assert.equal(Number(depois.alertas), alertasAntes + 1, "os alertas não subiram");
    console.log(
      `      → o comitê já abriu ${Number(depois.total)} vereditos, ${Number(depois.alertas)} viraram alerta`,
    );
  });

  it("um órgão comum não consegue registrar abertura", async function () {
    this.timeout(180_000);
    // Só quem faz o cruzamento registra abertura. Sem isso, qualquer um poderia
    // inflar a contagem e sujar a auditoria.
    const registro = PublicKey.findProgramAddressSync(
      [enc.encode("aberturas"), creas.publicKey.toBuffer()],
      pid,
    )[0];
    try {
      await program.methods
        .registrarAbertura(Array.from(Buffer.alloc(32)), false)
        .accountsPartial({
          registro,
          emissor: PublicKey.findProgramAddressSync(
            [enc.encode("inst"), creas.publicKey.toBuffer()],
            pid,
          )[0],
          autoridade: creas.publicKey,
        })
        .signers([creas])
        .rpc();
      assert.fail("o CREAS não deveria registrar abertura");
    } catch (e) {
      assert.match(String(e), /NaoEhComite|custom program error/i);
    }
  });

  it("peso fora de 1 e 2 é recusado", async function () {
    this.timeout(180_000);
    const sal = salAleatorio();
    const prova = await provar(identidades[4], 2, sal);
    try {
      await registrar(prova, 5, sal);
      assert.fail("peso 5 deveria falhar");
    } catch (e) {
      assert.match(String(e), /PesoInvalido|custom program error/i);
    }
  });
});
