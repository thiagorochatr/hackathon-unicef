/**
 * Teste de fumaça do sinal protegido, pela mesma porta que o navegador usa.
 *
 * Faz o caminho inteiro sem interface: calcula o apelido por consulta
 * embaralhada, credencia uma identidade nova, gera a prova, registra na rede e
 * entrega o envelope ao nó. No fim, cruza e confere o resultado.
 *
 * Uso:  pnpm exec ts-node scripts/zk/fumaca.ts [peso]
 */
import { join } from "path";
import { valorDoEscopo } from "./formato";

const BASE = "http://localhost:3000";
const MUNICIPIO = 3552205;
const SETOR = "educacao";
const SETOR_BYTE = 2;
const PROFUNDIDADE = 16;
const PESO = Number(process.argv[2] ?? 1);
const CPF = "000.000.000-00";

const hex = (b: Uint8Array) =>
  Array.from(b).map((x) => x.toString(16).padStart(2, "0")).join("");
const desHex = (h: string) =>
  new Uint8Array(h.match(/../g)!.map((x) => parseInt(x, 16)));

async function post(rota: string, corpo: unknown): Promise<any> {
  const r = await fetch(`${BASE}${rota}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(corpo),
  });
  const d = (await r.json()) as { erro?: string };
  if (d.erro) throw new Error(`${rota}: ${d.erro}`);
  return d;
}

async function main() {
  const { ristretto255_oprf } = await import("@noble/curves/ed25519.js");
  const { oprf } = ristretto255_oprf;
  const { sha256 } = await import("@noble/hashes/sha2.js");
  const { Identity } = await import("@semaphore-protocol/identity");
  const { Group } = await import("@semaphore-protocol/group");
  const { generateProof } = await import("@semaphore-protocol/proof");

  console.log(`\n── sinal protegido · peso ${PESO} ──\n`);

  // 1. O apelido, sem contar a ninguém de qual criança se trata.
  const entrada = new TextEncoder().encode(CPF.replace(/\D/g, ""));
  const { blind, blinded } = oprf.blind(entrada);
  const { avaliado } = (await post("/api/apelido", {
    embaralhado: hex(blinded),
  })) as { avaliado: string };
  const apelido = hex(oprf.finalize(entrada, blind, desHex(avaliado)));
  console.log("apelido calculado no cliente:", apelido.slice(0, 24), "…");

  // 2. Identidade nova e credenciamento.
  const identidade = new Identity();
  await post("/api/denuncia", {
    acao: "credenciar",
    setor: SETOR,
    compromisso: identidade.commitment.toString(),
  });
  const r = await fetch(`${BASE}/api/denuncia?setor=${SETOR}`);
  const { grupo, periodo } = (await r.json()) as {
    grupo: { membros: number; raiz: string; raizRefeita: string; folhas: string[] };
    periodo: number;
  };
  console.log("credenciado. lista do setor:", grupo.membros, "pessoas");
  if (grupo.raiz !== grupo.raizRefeita) throw new Error("raiz não confere");

  // 3. A prova.
  const sal = hex(crypto.getRandomValues(new Uint8Array(16)));
  const compromisso = hex(
    sha256(new Uint8Array([...new TextEncoder().encode(apelido), PESO, ...desHex(sal)])),
  );
  const t0 = Date.now();
  const prova = await generateProof(
    identidade,
    new Group(grupo.folhas.map((f: string) => BigInt(f))),
    BigInt("0x" + compromisso).toString(),
    valorDoEscopo(MUNICIPIO, SETOR_BYTE, periodo).toString(),
    PROFUNDIDADE,
    {
      wasm: join(process.cwd(), "app", "public", "zk", `semaphore-${PROFUNDIDADE}.wasm`),
      zkey: join(process.cwd(), "app", "public", "zk", `semaphore-${PROFUNDIDADE}.zkey`),
    },
  );
  console.log(`prova gerada em ${Date.now() - t0} ms`);

  // 4. Registro na rede e entrega do envelope.
  const reg = await post("/api/denuncia", {
    acao: "registrar",
    setor: SETOR,
    peso: PESO,
    sal,
    anulador: prova.nullifier.toString(),
    pontos: prova.points,
  });
  console.log("registrado na rede. único signatário:", reg.relayer.slice(0, 8), "…");

  const { sinais } = (await post("/api/cruzamento", {
    acao: "emitirCredenciado",
    setor: SETOR,
    peso: PESO,
    sal,
    assinatura: reg.assinatura,
  })) as { sinais: { setor: string; protegido: boolean }[] };
  console.log(
    "envelopes no nó:",
    sinais.map((s) =>
      `${s.setor}${s.protegido ? " (protegido)" : ""}`,
    ).join(" + "),
  );

  // 5. O cruzamento.
  const cruz = await post("/api/cruzamento", { acao: "cruzar" });
  console.log(`\nabriu pelo comitê: ${cruz.aberto} (limiar ${cruz.limiar})`);
  console.log(`com a chave errada: ${cruz.comChaveErrada}`);
  console.log(`veredito: ${cruz.alerta ? "SIM" : "não"}\n`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("\nfalhou:", e.message ?? e);
    process.exit(1);
  });
