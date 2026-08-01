import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import BN from "bn.js";
import { readFileSync } from "fs";
import { join } from "path";
import { ComputeBudgetProgram, Keypair, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { assert } from "chai";
import type { Custodia } from "../target/types/custodia";
import {
  entradasPublicas,
  provaParaBytes,
  paraBytes32,
  valorDoEscopo,
} from "../scripts/zk/formato";

const enc = new TextEncoder();

/** Profundidade da árvore, fixa: é a que a chave de verificação embutida cobre. */
const PROFUNDIDADE = 16;
const MUNICIPIO = 3552205; // Sorocaba/SP — mesmo cenário fictício do resto da demonstração

/**
 * O período muda a cada execução. O anulador é derivado do escopo, e o escopo
 * inclui o período — sem isto, a segunda execução do teste esbarraria nos
 * anuladores gastos pela primeira, que ficam na devnet para sempre.
 */
const PERIODO = Math.floor(Date.now() / 1000) % 1_000_000;

const ARTEFATOS = {
  wasm: join(process.cwd(), "app", "public", "zk", `semaphore-${PROFUNDIDADE}.wasm`),
  zkey: join(process.cwd(), "app", "public", "zk", `semaphore-${PROFUNDIDADE}.zkey`),
};

function pdaConfig(pid: PublicKey) {
  return PublicKey.findProgramAddressSync([enc.encode("config")], pid)[0];
}
function pdaGrupo(pid: PublicKey, municipio: number) {
  const m = Buffer.alloc(4);
  m.writeUInt32LE(municipio);
  return PublicKey.findProgramAddressSync([enc.encode("grupo"), m], pid)[0];
}
function pdaCaso(pid: PublicKey, alertaId: Buffer) {
  return PublicKey.findProgramAddressSync([enc.encode("caso"), alertaId], pid)[0];
}
function pdaNulificador(pid: PublicKey, anulador: Buffer) {
  return PublicKey.findProgramAddressSync(
    [enc.encode("nulificador"), anulador],
    pid,
  )[0];
}

const alerta = () => Buffer.from(Keypair.generate().publicKey.toBytes());
const hash32 = () => Array.from(Keypair.generate().publicKey.toBytes());
const dormir = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe("denúncia protegida", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const provider = anchor.getProvider() as anchor.AnchorProvider;
  const program = anchor.workspace.custodia as Program<Custodia>;
  const pid = program.programId;

  /**
   * Quem responde pelos casos abertos por denúncia neste município. Usa a chave
   * fixa do projeto, e não uma descartável: o grupo fica cadastrado na devnet
   * entre execuções, e o responsável dele precisa continuar batendo.
   */
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

  /** Gera a prova como o navegador do profissional geraria. */
  async function provar(quem: any, alertaId: Buffer, periodo = PERIODO) {
    return gerarProva(
      quem,
      grupo,
      BigInt("0x" + alertaId.toString("hex")).toString(),
      valorDoEscopo(MUNICIPIO, periodo).toString(),
      PROFUNDIDADE,
      ARTEFATOS,
    );
  }

  /**
   * Envia a abertura por denúncia com o relayer como **único** signatário.
   *
   * Montada à mão de propósito: o atalho do Anchor faria a carteira do provider
   * assinar como pagadora, e aí a transação teria dois signatários. Aqui o
   * ponto inteiro é que exista um só, e que ele não seja ninguém da rede de
   * proteção — nem o denunciante.
   */
  async function enviar(prova: any, alertaId: Buffer, periodo = PERIODO) {
    const anulador = paraBytes32(prova.nullifier);
    const instrucao = await program.methods
      .abrirCasoPorDenuncia(
        Array.from(alertaId),
        Array.from(provaParaBytes(prova.points)),
        Array.from(anulador),
        periodo,
        hash32(),
        new BN(120),
      )
      .accountsPartial({
        caso: pdaCaso(pid, alertaId),
        grupo: pdaGrupo(pid, MUNICIPIO),
        nulificador: pdaNulificador(pid, anulador),
        pagador: relayer.publicKey,
      })
      .instruction();

    const tx = new anchor.web3.Transaction()
      // A conferência da prova não cabe no teto padrão de 200 mil.
      .add(ComputeBudgetProgram.setComputeUnitLimit({ units: 400_000 }))
      .add(instrucao);
    tx.feePayer = relayer.publicKey;
    tx.recentBlockhash = (await provider.connection.getLatestBlockhash()).blockhash;

    return anchor.web3.sendAndConfirmTransaction(provider.connection, tx, [relayer], {
      commitment: "confirmed",
    });
  }

  before(async function () {
    this.timeout(180_000);

    const { Identity } = await import("@semaphore-protocol/identity");
    const { Group } = await import("@semaphore-protocol/group");
    const proof = await import("@semaphore-protocol/proof");
    gerarProva = proof.generateProof;

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
    if (!(await program.account.config.fetchNullable(config))) {
      await program.methods
        .inicializar(Keypair.generate().publicKey)
        .accountsPartial({ config, admin: provider.wallet.publicKey })
        .rpc();
    }

    // O grupo de credenciados do município. São 8 profissionais fictícios —
    // num sistema real seriam milhares, e é o tamanho do grupo, não a
    // criptografia, que define a força do anonimato.
    identidades = Array.from(
      { length: 8 },
      (_, i) => new Identity(`profissional-ficticio-${i}`),
    );
    grupo = new Group(identidades.map((i) => i.commitment));
    const raiz = Array.from(paraBytes32(grupo.root.toString()));

    const enderecoGrupo = pdaGrupo(pid, MUNICIPIO);
    const jaExiste = await program.account.grupoCredenciados.fetchNullable(enderecoGrupo);
    if (!jaExiste) {
      await program.methods
        .registrarGrupo(MUNICIPIO, raiz, creas.publicKey, identidades.length)
        .accountsPartial({
          config,
          grupo: enderecoGrupo,
          admin: provider.wallet.publicKey,
        })
        .rpc();
    } else {
      await program.methods
        .atualizarRaizGrupo(raiz, identidades.length)
        .accountsPartial({
          config,
          grupo: enderecoGrupo,
          admin: provider.wallet.publicKey,
        })
        .rpc();
      // A chave do responsável muda a cada execução do teste; releitura abaixo.
    }
  });

  it("uma prova válida abre o caso — e ninguém assinou por instituição", async function () {
    this.timeout(180_000);
    const alertaId = alerta();
    const prova = await provar(identidades[0], alertaId);

    const assinatura = await enviar(prova, alertaId);

    const caso = await program.account.caso.fetch(pdaCaso(pid, alertaId));
    assert.deepEqual(caso.origem, { denunciaProtegida: {} });
    assert.notEqual(
      caso.custodiante.toBase58(),
      PublicKey.default.toBase58(),
      "o caso nasceu sem dono",
    );
    assert.deepEqual(caso.estado, { aberto: {} });

    // A prova de que ninguém precisou autorizar: um único signatário, e ele é
    // só quem pagou a taxa.
    const tx = await provider.connection.getTransaction(assinatura, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    });
    const assinantes = tx!.transaction.message
      .getAccountKeys()
      .staticAccountKeys.slice(0, tx!.transaction.message.header.numRequiredSignatures);
    assert.equal(assinantes.length, 1, "deveria haver um único signatário");
    assert.equal(assinantes[0].toBase58(), relayer.publicKey.toBase58());

    // O consumo do **nosso** programa, e não o da instrução de orçamento que
    // vai junto na transação.
    const linha = (tx!.meta?.logMessages ?? []).find(
      (l) => l.includes(pid.toBase58()) && l.includes("consumed"),
    );
    const consumo = Number(linha?.match(/consumed (\d+) of/)?.[1] ?? 0);
    console.log(`      → conferir a prova e abrir o caso: ${consumo.toLocaleString("pt-BR")} unidades`);
    console.log(`      → teto por transação: 1.400.000 · padrão por instrução: 200.000`);
    assert.isBelow(consumo, 1_400_000, "não cabe no teto de uma transação");
  });

  it("a mesma pessoa não denuncia duas vezes no mesmo período", async function () {
    this.timeout(180_000);
    // Mesma identidade e mesmo escopo do teste anterior: o anulador se repete,
    // e a conta que o marca já existe.
    const alertaId = alerta();
    const prova = await provar(identidades[0], alertaId);
    try {
      await enviar(prova, alertaId);
      assert.fail("a segunda denúncia deveria ter sido barrada");
    } catch (e) {
      assert.match(String(e), /already in use|custom program error/i);
    }
  });

  it("prova adulterada não passa", async function () {
    this.timeout(180_000);
    const alertaId = alerta();
    const prova = await provar(identidades[1], alertaId);
    const pontos = [...prova.points];
    pontos[0] = (BigInt(pontos[0]) + 1n).toString();
    try {
      await enviar({ ...prova, points: pontos }, alertaId);
      assert.fail("prova adulterada deveria falhar");
    } catch (e) {
      assert.match(String(e), /ProvaInvalida|ProvaMalFormada|custom program error/i);
    }
  });

  it("a prova de um caso não serve para abrir outro", async function () {
    this.timeout(180_000);
    const alertaId = alerta();
    const prova = await provar(identidades[2], alertaId);
    // Mesma prova, outro caso: a mensagem embutida não bate com o novo alerta.
    const outro = alerta();
    try {
      await enviar(prova, outro);
      assert.fail("a prova não deveria valer para outro caso");
    } catch (e) {
      assert.match(String(e), /ProvaInvalida|custom program error/i);
    }
  });

  it("a prova de um período não serve para outro", async function () {
    this.timeout(180_000);
    const alertaId = alerta();
    const prova = await provar(identidades[3], alertaId, PERIODO);
    try {
      await enviar(prova, alertaId, PERIODO + 1);
      assert.fail("a prova não deveria valer para outro período");
    } catch (e) {
      assert.match(String(e), /ProvaInvalida|custom program error/i);
    }
  });

  it("quem não está no grupo não consegue denunciar", async function () {
    this.timeout(180_000);
    const { Identity } = await import("@semaphore-protocol/identity");
    const { Group } = await import("@semaphore-protocol/group");

    // Alguém monta a própria árvore, com a própria identidade dentro, e tenta
    // provar contra ela. A raiz que o programa usa é a cadastrada, não a dele.
    const intruso = new Identity("nao-credenciado");
    const arvoreFalsa = new Group([intruso.commitment]);
    const alertaId = alerta();
    const prova = await gerarProva(
      intruso,
      arvoreFalsa,
      BigInt("0x" + alertaId.toString("hex")).toString(),
      valorDoEscopo(MUNICIPIO, PERIODO).toString(),
      PROFUNDIDADE,
      ARTEFATOS,
    );
    try {
      await enviar(prova, alertaId);
      assert.fail("um intruso não deveria conseguir abrir caso");
    } catch (e) {
      assert.match(String(e), /ProvaInvalida|custom program error/i);
    }
  });

  it("o caso nascido de denúncia anda como qualquer outro", async function () {
    this.timeout(240_000);
    const alertaId = alerta();
    const prova = await provar(identidades[4], alertaId);
    await enviar(prova, alertaId);

    const endereco = pdaCaso(pid, alertaId);
    const antes = await program.account.caso.fetch(endereco);
    const responsavel = antes.custodiante;

    // O responsável é o que o grupo definiu, e ele não assinou nada até aqui.
    assert.equal(responsavel.toBase58(), creas.publicKey.toBase58());

    const ct = Keypair.generate();
    await program.methods
      .transferirPara(ct.publicKey)
      .accountsPartial({ caso: endereco, custodiante: responsavel })
      .signers([creas])
      .rpc();

    const meio = await program.account.caso.fetch(endereco);
    assert.equal(
      meio.custodiante.toBase58(),
      responsavel.toBase58(),
      "passar adiante não pode trocar o responsável",
    );
    assert.deepEqual(meio.estado, { pendenteAceite: {} });
    assert.deepEqual(meio.origem, { denunciaProtegida: {} });
  });

  after(async () => {
    await dormir(500);
  });
});
