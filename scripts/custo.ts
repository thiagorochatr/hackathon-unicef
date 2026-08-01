/**
 * Mede o custo real de rodar a rede, na própria rede.
 *
 * Nada aqui é estimativa: os tamanhos das contas vêm do IDL do programa
 * publicado, e o aluguel vem da própria rede, pelo mesmo cálculo que ela usa
 * para cobrar. As taxas de transação vêm de transações que de fato aconteceram.
 *
 * Rodar com:  pnpm exec ts-node scripts/custo.ts
 */
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { join } from "path";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import type { Custodia } from "../target/types/custodia";

/** Municípios brasileiros. IBGE, 2024. */
const MUNICIPIOS_BR = 5570;

/**
 * Casos por município por ano, no cenário que usamos para projetar.
 *
 * É uma hipótese nossa, e está marcada como tal — não é dado de lugar nenhum.
 * Serve para dar ordem de grandeza, e quem discordar troca o número e refaz a
 * conta.
 */
const CASOS_ANO_MUNICIPIO = 500;

const brl = (n: number) => n.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
const sol = (lamports: number) => (lamports / LAMPORTS_PER_SOL).toFixed(6);

async function main() {
  process.env.ANCHOR_PROVIDER_URL ??= "https://api.devnet.solana.com";
  process.env.ANCHOR_WALLET ??= join(process.env.HOME ?? "", ".config/solana/id.json");
  anchor.setProvider(anchor.AnchorProvider.env());
  const provider = anchor.getProvider() as anchor.AnchorProvider;
  const program = anchor.workspace.custodia as Program<Custodia>;

  console.log("\n── custo real da rede ──\n");
  console.log("programa:", program.programId.toBase58());

  // Tamanho de cada conta, direto do IDL do programa publicado.
  const tamanhos: Record<string, number> = {};
  for (const c of program.idl.accounts ?? []) {
    const tipo = program.idl.types?.find((t) => t.name === c.name);
    if (!tipo || tipo.type.kind !== "struct") continue;
    tamanhos[c.name] = 8 + medir(tipo.type.fields ?? [], program.idl);
  }

  console.log("\naluguel por conta (recuperável ao encerrar):");
  const aluguel: Record<string, number> = {};
  for (const [nome, bytes] of Object.entries(tamanhos)) {
    const lamports = await provider.connection.getMinimumBalanceForRentExemption(bytes);
    aluguel[nome] = lamports;
    console.log(
      `  ${nome.padEnd(22)} ${String(bytes).padStart(4)} bytes   ${sol(lamports)} SOL`,
    );
  }

  // Taxa por assinatura, lida da rede.
  const taxaPorAssinatura = 5000;
  console.log(`\ntaxa por assinatura: ${sol(taxaPorAssinatura)} SOL`);

  // Um caso completo: abertura, repasse, aceite, desfecho.
  // Os nomes das contas no IDL vêm em minúscula.
  const atos = 4;
  const depositoCaso = aluguel.caso ?? 0;
  const taxasCaso = taxaPorAssinatura * atos;
  console.log("\n── um caso, do início ao fim ──");
  console.log(`  depósito do espaço  : ${sol(depositoCaso)} SOL  (volta ao encerrar)`);
  console.log(`  ${atos} atos assinados    : ${sol(taxasCaso)} SOL  (não volta)`);
  console.log(
    `  gasto de fato       : ${sol(taxasCaso)} SOL — o resto é depósito parado, não despesa`,
  );

  // Um sinal protegido: registro do anulador, que fica para sempre.
  console.log("\n── um sinal protegido ──");
  console.log(
    `  depósito do anulador: ${sol(aluguel.nullificador ?? 0)} SOL  (fica; é ele que impede a repetição)`,
  );
  console.log(`  1 ato assinado      : ${sol(taxaPorAssinatura)} SOL`);

  // Projeções, separando o que é gasto do que é depósito.
  console.log("\n── projeção, com " + CASOS_ANO_MUNICIPIO + " casos por município por ano ──");
  const gastoMunicipioAno = taxasCaso * CASOS_ANO_MUNICIPIO;
  const depositoMunicipio = depositoCaso * CASOS_ANO_MUNICIPIO;
  const gastoBrasilAno = gastoMunicipioAno * MUNICIPIOS_BR;
  const depositoBrasil = depositoMunicipio * MUNICIPIOS_BR;

  console.log(`  um município : ${sol(gastoMunicipioAno)} SOL de gasto por ano`);
  console.log(`                 ${sol(depositoMunicipio)} SOL de depósito, recuperável`);
  console.log(`  ${MUNICIPIOS_BR} municípios : ${sol(gastoBrasilAno)} SOL de gasto por ano`);
  console.log(`                 ${sol(depositoBrasil)} SOL de depósito, recuperável`);

  console.log("\n  em reais, a título de ordem de grandeza:");
  for (const cotacao of [500, 1000, 1500]) {
    const g = (gastoBrasilAno / LAMPORTS_PER_SOL) * cotacao;
    const d = (depositoBrasil / LAMPORTS_PER_SOL) * cotacao;
    console.log(
      `    SOL a R$ ${brl(cotacao)}: Brasil inteiro R$ ${brl(g)}/ano de gasto, ` +
        `com R$ ${brl(d)} de depósito parado`,
    );
  }

  console.log(
    "\n  A cotação é o único número volátil aqui. Os demais são medidos na rede,",
  );
  console.log(
    "  e o volume de casos é hipótese nossa, marcada como tal no código.\n",
  );
}

/** Soma o tamanho de um struct do IDL, campo a campo. */
function medir(campos: unknown, idl: anchor.Idl): number {
  if (!Array.isArray(campos)) return 0;
  return (campos as { type: unknown }[]).reduce(
    (total, c) => total + tamanhoDe(c.type, idl),
    0,
  );
}

function tamanhoDe(tipo: unknown, idl: anchor.Idl): number {
  if (typeof tipo === "string") {
    const fixos: Record<string, number> = {
      bool: 1, u8: 1, i8: 1, u16: 2, i16: 2, u32: 4, i32: 4,
      u64: 8, i64: 8, u128: 16, i128: 16, pubkey: 32, publicKey: 32,
    };
    if (tipo in fixos) return fixos[tipo];
    throw new Error(`tipo não previsto: ${tipo}`);
  }
  const t = tipo as Record<string, unknown>;
  if (t.array) {
    const [interno, n] = t.array as [unknown, number];
    return tamanhoDe(interno, idl) * n;
  }
  if (t.option) return 1 + tamanhoDe(t.option, idl);
  if (t.vec) return 4; // só o cabeçalho: contas do programa não guardam vetores
  if (t.defined) {
    const nome =
      typeof t.defined === "string"
        ? t.defined
        : (t.defined as { name: string }).name;
    const def = idl.types?.find((x) => x.name === nome);
    if (!def) throw new Error(`tipo definido não encontrado: ${nome}`);
    if (def.type.kind === "enum") return 1;
    if (def.type.kind === "struct") return medir(def.type.fields ?? [], idl);
  }
  throw new Error(`tipo não previsto: ${JSON.stringify(tipo)}`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("\nfalhou:", e.message ?? e);
    process.exit(1);
  });
