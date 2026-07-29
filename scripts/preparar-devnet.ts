/**
 * Deixa a devnet pronta para a demonstração:
 *  - aponta o endereço do Ministério Público para a chave de keys/mp.json
 *  - cadastra as instituições que participam do fluxo
 *
 * Rodar com:  pnpm exec ts-node scripts/preparar-devnet.ts
 */
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";
import { readFileSync } from "fs";
import { join } from "path";
import type { Custodia } from "../target/types/custodia";

const RAIZ = join(__dirname, "..");
const enc = new TextEncoder();

function carregar(nome: string): Keypair {
  const bruto = JSON.parse(readFileSync(join(RAIZ, "keys", `${nome}.json`), "utf8"));
  return Keypair.fromSecretKey(Uint8Array.from(bruto));
}

const INSTITUICOES = [
  // Quem roda o cruzamento e emite os alertas. Precisa estar cadastrado, senão
  // ninguém consegue abrir caso.
  { nome: "comite", tipo: { comite: {} } },
  { nome: "ubs", tipo: { ubs: {} } },
  { nome: "escola", tipo: { escola: {} } },
  { nome: "cras", tipo: { cras: {} } },
  { nome: "creas", tipo: { creas: {} } },
  { nome: "ct", tipo: { conselhoTutelar: {} } },
] as const;

const MUNICIPIO_IBGE = 3552205; // Sorocaba/SP — cenário fictício da demonstração

async function main() {
  process.env.ANCHOR_PROVIDER_URL ??= "https://api.devnet.solana.com";
  process.env.ANCHOR_WALLET ??= join(
    process.env.HOME ?? "",
    ".config/solana/id.json",
  );
  anchor.setProvider(anchor.AnchorProvider.env());
  const provider = anchor.getProvider() as anchor.AnchorProvider;
  const program = anchor.workspace.custodia as Program<Custodia>;

  const config = PublicKey.findProgramAddressSync(
    [enc.encode("config")],
    program.programId,
  )[0];

  const mp = carregar("mp");
  console.log("programa :", program.programId.toBase58());
  console.log("admin    :", provider.wallet.publicKey.toBase58());

  // 1. Ministério Público
  const antes = await program.account.config.fetch(config);
  if (antes.mp.toBase58() === mp.publicKey.toBase58()) {
    console.log("MP       : já configurado");
  } else {
    const sig = await program.methods
      .definirMp(mp.publicKey)
      .accountsPartial({ config, admin: provider.wallet.publicKey })
      .rpc();
    console.log("MP       :", mp.publicKey.toBase58(), "→", sig);
  }

  // 2. Instituições
  for (const { nome, tipo } of INSTITUICOES) {
    const kp = carregar(nome);
    const pda = PublicKey.findProgramAddressSync(
      [enc.encode("inst"), kp.publicKey.toBuffer()],
      program.programId,
    )[0];

    const existente = await program.account.instituicao.fetchNullable(pda);
    if (existente) {
      console.log(`${nome.padEnd(9)}: já cadastrada`);
      continue;
    }

    const nomeHash = Array.from(
      new Uint8Array(
        require("crypto").createHash("sha256").update(`demo:${nome}`).digest(),
      ),
    );

    const sig = await program.methods
      .registrarInstituicao(tipo as never, MUNICIPIO_IBGE, nomeHash)
      .accountsPartial({
        config,
        authority: kp.publicKey,
        admin: provider.wallet.publicKey,
      })
      .rpc();
    console.log(`${nome.padEnd(9)}: ${kp.publicKey.toBase58()} → ${sig}`);
  }

  console.log("\npronto.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
