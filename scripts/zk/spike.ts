/**
 * Fase 0 — spike de viabilidade da camada ZK.
 *
 * Gera uma prova Semaphore de verdade, confere fora da cadeia, converte para o
 * formato de bytes do verificador on-chain e despeja tudo em disco, para que o
 * teste em Rust possa conferir a mesma prova sem depender de rede.
 *
 * Uso:  pnpm exec ts-node scripts/zk/spike.ts [profundidade]
 */

import { writeFileSync, mkdirSync, readFileSync } from "fs";
import { join } from "path";
import {
  chaveComoRust,
  chaveDeVerificacao,
  entradasPublicas,
  provaParaBytes,
  valorDoEscopo,
} from "./formato";

const PROFUNDIDADE = Number(process.argv[2] ?? 16);
const MEMBROS = 8;
const MUNICIPIO = 3552205; // Sorocaba/SP — cenário fictício da demonstração
const PERIODO = 202607;
const SAIDA = join(__dirname, "..", "..", "programs", "custodia", "src");
const SAIDA_DADOS = join(__dirname, "..", "..", "target", "spike-zk.json");

async function main() {
  const { Identity } = await import("@semaphore-protocol/identity");
  const { Group } = await import("@semaphore-protocol/group");
  const { generateProof, verifyProof } = await import("@semaphore-protocol/proof");

  // O pacote não exporta este arquivo, então é lido do disco. Só acontece aqui,
  // em tempo de geração — o programa on-chain carrega a chave já embutida.
  const vkJson = JSON.parse(
    readFileSync(
      join(
        __dirname,
        "..",
        "..",
        "node_modules",
        "@semaphore-protocol",
        "proof",
        "src",
        "verification-keys.json",
      ),
      "utf8",
    ),
  );

  console.log(`\n── spike da camada ZK · profundidade ${PROFUNDIDADE} ──\n`);

  // 1. O grupo de profissionais credenciados do município.
  const identidades = Array.from(
    { length: MEMBROS },
    (_, i) => new Identity(`profissional-ficticio-${i}`),
  );
  const grupo = new Group(identidades.map((i) => i.commitment));
  const denunciante = identidades[3];

  console.log(`grupo montado: ${MEMBROS} credenciados`);
  console.log(`raiz da árvore: ${grupo.root}`);

  // 2. A denúncia. A mensagem amarra a prova a este caso; o escopo define que
  //    cada profissional denuncia uma vez por município por período.
  const alertaId = "0x" + "a7".repeat(32);
  const mensagem = BigInt(alertaId).toString();
  const escopoNum = valorDoEscopo(MUNICIPIO, PERIODO).toString();

  // 3. A prova. É este passo que rodaria no navegador do professor.
  const t0 = Date.now();
  const prova = await generateProof(
    denunciante,
    grupo,
    mensagem,
    escopoNum,
    PROFUNDIDADE,
  );
  const ms = Date.now() - t0;
  console.log(`\nprova gerada em ${ms} ms`);
  console.log(`anulador: ${prova.nullifier}`);

  // 4. Conferência fora da cadeia — se falhar aqui, o problema não é a conversão.
  const valeOffChain = await verifyProof(prova);
  console.log(`confere fora da cadeia: ${valeOffChain ? "sim" : "NÃO"}`);
  if (!valeOffChain) throw new Error("a prova não confere nem fora da cadeia");

  // 5. Conversão para o formato da cadeia.
  const bytes = provaParaBytes(prova.points);
  const entradas = entradasPublicas(prova);
  console.log(`\nprova em bytes: ${bytes.length} (esperado 256)`);
  console.log(`entradas públicas: ${entradas.length} × ${entradas[0].length} bytes`);

  const chave = chaveDeVerificacao(vkJson, PROFUNDIDADE);
  if (chave.ic.length !== chave.nrEntradas + 1) {
    throw new Error(
      `IC tem ${chave.ic.length} pontos; o esperado são ${chave.nrEntradas + 1}`,
    );
  }

  // 6. Despejo.
  mkdirSync(SAIDA, { recursive: true });
  writeFileSync(
    join(SAIDA, "chave_verificacao.rs"),
    chaveComoRust(chave, PROFUNDIDADE),
  );
  console.log(`\nescrito: programs/custodia/src/chave_verificacao.rs`);

  const dados = {
    profundidade: PROFUNDIDADE,
    msGeracao: ms,
    raiz: prova.merkleTreeRoot,
    anulador: prova.nullifier,
    mensagem: prova.message,
    escopo: prova.scope,
    provaHex: bytes.toString("hex"),
    entradasHex: entradas.map((e) => e.toString("hex")),
  };
  mkdirSync(join(__dirname, "..", "..", "target"), { recursive: true });
  writeFileSync(SAIDA_DADOS, JSON.stringify(dados, null, 2));
  console.log(`escrito: target/spike-zk.json`);

  // 7. O mesmo em Rust, para o teste nativo rodar sem rede.
  const arr = (b: Buffer) => `[${Array.from(b).join(",")}]`;
  // Comentários comuns, e não de módulo: este arquivo é incluído no meio de
  // outro, onde `//!` não é aceito.
  const testeRust = `// Dados de uma prova Semaphore real, para o teste do verificador.
//
// GERADO POR \`scripts/zk/spike.ts\` — não editar à mão.

pub const PROVA: [u8; 256] = ${arr(bytes)};

pub const ENTRADAS: [[u8; 32]; ${entradas.length}] = [
${entradas.map((e) => `    ${arr(e)},`).join("\n")}
];
`;
  writeFileSync(join(SAIDA, "chave_verificacao_teste.rs"), testeRust);
  console.log(`escrito: programs/custodia/src/chave_verificacao_teste.rs\n`);
}

main()
  .then(() => {
    // O snarkjs deixa um worker vivo depois de provar, e sem isto o processo
    // fica pendurado mesmo tendo terminado tudo.
    process.exit(0);
  })
  .catch((e) => {
    console.error("\nfalhou:", e);
    process.exit(1);
  });
