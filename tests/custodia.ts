import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import BN from "bn.js";
import { readFileSync } from "fs";
import { join } from "path";
import { Keypair, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { assert } from "chai";
import type { Custodia } from "../target/types/custodia";

const enc = new TextEncoder();

function pdaConfig(programId: PublicKey) {
  return PublicKey.findProgramAddressSync([enc.encode("config")], programId)[0];
}
function pdaInstituicao(programId: PublicKey, authority: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [enc.encode("inst"), authority.toBuffer()],
    programId,
  )[0];
}
function pdaCaso(programId: PublicKey, alertaId: Buffer) {
  return PublicKey.findProgramAddressSync(
    [enc.encode("caso"), alertaId],
    programId,
  )[0];
}
function pdaAncora(programId: PublicKey, instituicao: PublicKey, periodo: number) {
  const p = Buffer.alloc(4);
  p.writeUInt32LE(periodo);
  return PublicKey.findProgramAddressSync(
    [enc.encode("ancora"), instituicao.toBuffer(), p],
    programId,
  )[0];
}

const alerta = () => Buffer.from(Keypair.generate().publicKey.toBytes());
const hash32 = () => Array.from(Keypair.generate().publicKey.toBytes());
const dormir = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe("custodia", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const provider = anchor.getProvider() as anchor.AnchorProvider;
  const program = anchor.workspace.custodia as Program<Custodia>;
  const pid = program.programId;

  const creas = Keypair.generate();
  const ct = Keypair.generate();

  /**
   * Usa a mesma chave de Ministério Público da demonstração. Assim o teste não
   * deixa a rede apontando para uma chave descartável quando termina.
   */
  function chaveDoProjeto(nome: string): Keypair {
    const bruto = JSON.parse(
      readFileSync(join(process.cwd(), "keys", `${nome}.json`), "utf8"),
    );
    return Keypair.fromSecretKey(Uint8Array.from(bruto));
  }

  const mp = chaveDoProjeto("mp");
  /** Quem faz o cruzamento e emite os alertas. */
  const comite = chaveDoProjeto("comite");

  /**
   * Financia por transferência da carteira do provider em vez de airdrop:
   * a devnet limita airdrop com agressividade e o teste roda contra ela.
   */
  async function bancar(...quem: Keypair[]) {
    const tx = new anchor.web3.Transaction();
    for (const k of quem) {
      tx.add(
        anchor.web3.SystemProgram.transfer({
          fromPubkey: provider.wallet.publicKey,
          toPubkey: k.publicKey,
          lamports: 0.05 * LAMPORTS_PER_SOL,
        }),
      );
    }
    await provider.sendAndConfirm(tx);
  }

  before(async () => {
    await bancar(creas, ct, comite);

    // A devnet guarda estado entre execuções: a configuração pode já existir de
    // uma rodada anterior. Se existir, só apontamos o MP para a chave deste teste.
    const config = pdaConfig(pid);
    const existente = await program.account.config.fetchNullable(config);
    if (!existente) {
      await program.methods
        .inicializar(mp.publicKey)
        .accountsPartial({ config, admin: provider.wallet.publicKey })
        .rpc();
    } else {
      await program.methods
        .definirMp(mp.publicKey)
        .accountsPartial({ config, admin: provider.wallet.publicKey })
        .rpc();
    }
  });

  it("o caso nasce sem o órgão responsável precisar assinar", async () => {
    const id = alerta();
    const caso = pdaCaso(pid, id);

    // Repare nos signatários: só o comitê. O CREAS não participa desta transação.
    await program.methods
      .abrirCaso(Array.from(id), creas.publicKey, hash32(), new BN(120))
      .accountsPartial({
        caso,
        emissor: pdaInstituicao(pid, comite.publicKey),
        autoridade: comite.publicKey,
      })
      .signers([comite])
      .rpc();

    const c = await program.account.caso.fetch(caso);
    // Mesmo assim ele já é o responsável, com o prazo correndo contra ele.
    assert.equal(c.custodiante.toBase58(), creas.publicKey.toBase58());
    assert.deepEqual(c.estado, { aberto: {} });
    assert.isAbove(c.prazo.toNumber(), c.criadoEm.toNumber());
  });

  it("um órgão comum não consegue abrir caso — só quem faz o cruzamento", async () => {
    const id = alerta();
    const creasReal = chaveDoProjeto("creas");

    try {
      await program.methods
        .abrirCaso(Array.from(id), creas.publicKey, hash32(), new BN(120))
        .accountsPartial({
          caso: pdaCaso(pid, id),
          emissor: pdaInstituicao(pid, creasReal.publicKey),
          autoridade: creasReal.publicKey,
        })
        .signers([creasReal])
        .rpc();
      assert.fail("órgão comum não deveria conseguir abrir caso");
    } catch (e) {
      assert.include(String(e), "NaoEhComite");
    }
  });

  it("o caso anda do começo ao fim: abre, passa adiante, é aceito e encerra", async () => {
    const id = alerta();
    const caso = pdaCaso(pid, id);

    await program.methods
      .abrirCaso(Array.from(id), creas.publicKey, hash32(), new BN(120))
      .accountsPartial({
        caso,
        emissor: pdaInstituicao(pid, comite.publicKey),
        autoridade: comite.publicKey,
      })
      .signers([comite])
      .rpc();

    let c = await program.account.caso.fetch(caso);
    assert.equal(c.custodiante.toBase58(), creas.publicKey.toBase58());
    assert.deepEqual(c.estado, { aberto: {} });
    assert.equal(c.eventos, 1);

    await program.methods
      .transferirPara(ct.publicKey)
      .accounts({ caso, custodiante: creas.publicKey })
      .signers([creas])
      .rpc();

    await program.methods
      .aceitar(new BN(120), hash32())
      .accounts({ caso, destino: ct.publicKey })
      .signers([ct])
      .rpc();

    c = await program.account.caso.fetch(caso);
    assert.equal(c.custodiante.toBase58(), ct.publicKey.toBase58());
    assert.isNull(c.pendentePara);
    assert.deepEqual(c.estado, { emAtendimento: {} });

    await program.methods
      .registrarDesfecho(hash32())
      .accounts({ caso, custodiante: ct.publicKey })
      .signers([ct])
      .rpc();

    c = await program.account.caso.fetch(caso);
    assert.deepEqual(c.estado, { encerrado: {} });
    assert.equal(c.eventos, 4);
  });

  it("REGRA PRINCIPAL: passar o caso adiante não troca o responsável nem reinicia o prazo", async () => {
    const id = alerta();
    const caso = pdaCaso(pid, id);

    await program.methods
      .abrirCaso(Array.from(id), creas.publicKey, hash32(), new BN(120))
      .accountsPartial({
        caso,
        emissor: pdaInstituicao(pid, comite.publicKey),
        autoridade: comite.publicKey,
      })
      .signers([comite])
      .rpc();

    const antes = await program.account.caso.fetch(caso);

    await program.methods
      .transferirPara(ct.publicKey)
      .accounts({ caso, custodiante: creas.publicKey })
      .signers([creas])
      .rpc();

    const depois = await program.account.caso.fetch(caso);

    // O caso continua sendo do CREAS. É esta asserção que prova a tese
    // "não existe estado sem dono" e que a responsabilidade não evapora no repasse.
    assert.equal(depois.custodiante.toBase58(), creas.publicKey.toBase58());
    assert.equal(depois.pendentePara?.toBase58(), ct.publicKey.toBase58());
    assert.deepEqual(depois.estado, { pendenteAceite: {} });
    // O prazo segue correndo contra quem transferiu.
    assert.equal(depois.prazo.toString(), antes.prazo.toString());
    assert.notEqual(depois.custodiante.toBase58(), PublicKey.default.toBase58());
  });

  it("só o órgão que recebeu o caso consegue aceitá-lo", async () => {
    const id = alerta();
    const caso = pdaCaso(pid, id);
    const intruso = Keypair.generate();
    await bancar(intruso);

    await program.methods
      .abrirCaso(Array.from(id), creas.publicKey, hash32(), new BN(120))
      .accountsPartial({
        caso,
        emissor: pdaInstituicao(pid, comite.publicKey),
        autoridade: comite.publicKey,
      })
      .signers([comite])
      .rpc();
    await program.methods
      .transferirPara(ct.publicKey)
      .accounts({ caso, custodiante: creas.publicKey })
      .signers([creas])
      .rpc();

    try {
      await program.methods
        .aceitar(new BN(120), hash32())
        .accounts({ caso, destino: intruso.publicKey })
        .signers([intruso])
        .rpc();
      assert.fail("aceite de terceiro deveria falhar");
    } catch (e) {
      assert.include(String(e), "NaoEhDestinoDoRepasse");
    }
  });

  it("não deixa mandar ao Ministério Público antes do prazo vencer", async () => {
    const id = alerta();
    const caso = pdaCaso(pid, id);

    await program.methods
      .abrirCaso(Array.from(id), creas.publicKey, hash32(), new BN(600))
      .accountsPartial({
        caso,
        emissor: pdaInstituicao(pid, comite.publicKey),
        autoridade: comite.publicKey,
      })
      .signers([comite])
      .rpc();

    try {
      await program.methods
        .escalar(new BN(600))
        .accounts({
          config: pdaConfig(pid),
          caso,
          pagador: provider.wallet.publicKey,
        })
        .rpc();
      assert.fail("mandar ao MP antes do prazo deveria falhar");
    } catch (e) {
      assert.include(String(e), "PrazoAindaVigente");
    }
  });

  it("depois do prazo, qualquer pessoa consegue mandar o caso ao Ministério Público", async () => {
    const id = alerta();
    const caso = pdaCaso(pid, id);

    await program.methods
      .abrirCaso(Array.from(id), creas.publicKey, hash32(), new BN(2))
      .accountsPartial({
        caso,
        emissor: pdaInstituicao(pid, comite.publicKey),
        autoridade: comite.publicKey,
      })
      .signers([comite])
      .rpc();
    await program.methods
      .transferirPara(ct.publicKey)
      .accounts({ caso, custodiante: creas.publicKey })
      .signers([creas])
      .rpc();

    await dormir(4000);

    // Uma chave sem nenhuma ligação com o caso: não é CREAS, nem CT, nem MP.
    const qualquer = Keypair.generate();
    await bancar(qualquer);

    await program.methods
      .escalar(new BN(600))
      .accounts({ config: pdaConfig(pid), caso, pagador: qualquer.publicKey })
      .signers([qualquer])
      .rpc();

    const c = await program.account.caso.fetch(caso);
    assert.equal(c.custodiante.toBase58(), mp.publicKey.toBase58());
    assert.deepEqual(c.estado, { escalado: {} });
    assert.isNull(c.pendentePara);
  });

  it("cada órgão marca presença uma vez por período", async () => {
    const inst = pdaInstituicao(pid, creas.publicKey);

    await program.methods
      .registrarInstituicao({ creas: {} }, 3552205, hash32())
      .accounts({
        config: pdaConfig(pid),
        authority: creas.publicKey,
        admin: provider.wallet.publicKey,
      })
      .rpc();

    await program.methods
      .ancorarPeriodo(1, hash32())
      .accounts({
        instituicao: inst,
        ancora: pdaAncora(pid, inst, 1),
        authority: creas.publicKey,
      })
      .signers([creas])
      .rpc();

    const a = await program.account.ancoraPeriodo.fetch(pdaAncora(pid, inst, 1));
    assert.equal(a.periodo, 1);

    try {
      await program.methods
        .ancorarPeriodo(1, hash32())
        .accounts({
          instituicao: inst,
          ancora: pdaAncora(pid, inst, 1),
          authority: creas.publicKey,
        })
        .signers([creas])
        .rpc();
      assert.fail("período repetido deveria falhar");
    } catch (e) {
      assert.isOk(e);
    }
  });
});
