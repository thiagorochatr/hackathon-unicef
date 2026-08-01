/**
 * As invariantes de criptografia que quebram em silêncio.
 *
 * Estes testes existem por causa de duas falhas reais do desenvolvimento, as
 * duas do mesmo tipo: aconteceram sem nenhum erro aparecer.
 *
 * 1. A comparação dentro do envelope, com o parâmetro antigo, dava **alerta
 *    para soma zero**. Um sinal só disparava o caso. Ninguém repararia até
 *    alguém perguntar por que um sinal isolado abriu caso.
 * 2. O escopo divergiu entre o programa em Rust e o cliente em TypeScript, e o
 *    único sintoma foi "a prova não confere" — sem dizer onde nem por quê.
 *
 * A OPRF é da mesma família e ainda não falhou: se a normalização ou a chave
 * divergirem entre o caminho do navegador e o do servidor, os sinais
 * simplesmente nunca se cruzam. O sistema fica quieto e não protege ninguém.
 *
 * Tudo aqui roda sem rede, em segundos.
 */

// `server-only` existe para quebrar quando um módulo de servidor é importado no
// cliente. Em Node não há cliente, e ele atrapalharia sem proteger nada.
const Modulo = require("module");
const resolverOriginal = Modulo._resolveFilename;
Modulo._resolveFilename = function (pedido: string, ...resto: unknown[]) {
  if (pedido === "server-only") return require.resolve("./vazio.js");
  return resolverOriginal.call(this, pedido, ...resto);
};

import { assert } from "chai";
import { valorDoEscopo } from "../scripts/zk/formato";

const LIMIAR = 2;

/** Setores, com o mesmo byte que o programa usa. */
const EDUCACAO = "educacao" as const;
const SAUDE = "saude" as const;
const ASSISTENCIA = "assistencia" as const;

describe("invariantes de criptografia", () => {
  describe("comparação dentro do envelope", () => {
    let no: typeof import("../app/src/lib/fhe/noDeCruzamento");
    let comite: typeof import("../app/src/lib/fhe/comite");
    let orgao: typeof import("../app/src/lib/fhe/orgao");

    before(async function () {
      this.timeout(120_000);
      no = await import("../app/src/lib/fhe/noDeCruzamento");
      comite = await import("../app/src/lib/fhe/comite");
      orgao = await import("../app/src/lib/fhe/orgao");
    });

    /** Monta um conjunto de sinais e devolve o que o comitê aprende. */
    async function avaliar(pesos: number[]) {
      const apelido = "criancaficticia" + Math.random().toString(36).slice(2);
      const setores = [SAUDE, EDUCACAO, ASSISTENCIA];
      for (let i = 0; i < pesos.length; i += 1) {
        no.receber(apelido, setores[i], await orgao.cifrarComoOrgao(pesos[i]));
      }
      const veredito = await no.avaliarLimiar(
        apelido,
        LIMIAR,
        await comite.chavesDeRelinearizacao(),
      );
      if (!veredito) throw new Error("o nó não devolveu veredito");
      const { alerta, aberto } = await comite.avaliarVeredito(veredito);
      return { alerta, aberto, veredito };
    }

    it("abaixo do limite não vira alerta", async function () {
      this.timeout(120_000);
      for (const pesos of [[1], [0], [0, 0], [1, 0]]) {
        const { alerta, aberto } = await avaliar(pesos);
        assert.equal(aberto, 0, `soma ${pesos} deveria abrir como zero`);
        assert.isFalse(alerta, `soma ${pesos} não deveria alertar`);
      }
    });

    it("no limite ou acima vira alerta", async function () {
      this.timeout(120_000);
      for (const pesos of [[2], [1, 1], [1, 2], [1, 1, 1], [2, 2]]) {
        const { alerta, aberto } = await avaliar(pesos);
        assert.notEqual(aberto, 0, `soma ${pesos} não deveria abrir como zero`);
        assert.isTrue(alerta, `soma ${pesos} deveria alertar`);
      }
    });

    it("o número aberto não entrega a contagem", async function () {
      this.timeout(120_000);
      // Duas somas diferentes, e depois a mesma soma duas vezes. Em nenhum dos
      // casos o número pode servir para adivinhar quantos sinais houve.
      const dois = await avaliar([1, 1]);
      const tres = await avaliar([1, 1, 1]);
      assert.notEqual(dois.aberto, tres.aberto, "somas diferentes deram o mesmo número");
      assert.notEqual(dois.aberto, 2, "o número é a própria contagem");
      assert.notEqual(tres.aberto, 6, "o número é o produto sem máscara");

      const outraVez = await avaliar([1, 1]);
      assert.notEqual(
        dois.aberto,
        outraVez.aberto,
        "a mesma soma deu o mesmo número duas vezes — a máscara não está funcionando",
      );
      assert.equal(dois.alerta, outraVez.alerta, "o veredito mudou sem motivo");
    });

    it("sem a chave certa não se obtém o veredito", async function () {
      this.timeout(120_000);
      // Uma soma abaixo do limite: quem tem a chave vê zero. Com outra chave,
      // sai um número qualquer — e responder por ele daria a resposta errada.
      const { veredito, aberto } = await avaliar([1]);
      assert.equal(aberto, 0);
      const errado = await comite.abrirComChaveErrada(veredito);
      assert.notEqual(errado, 0, "a chave errada não deveria acertar o veredito");
    });
  });

  describe("apelido por consulta embaralhada", () => {
    it("o caminho do navegador e o do servidor chegam ao mesmo apelido", async function () {
      this.timeout(60_000);
      const { apelidoDaCrianca, avaliarApelidoCego } = await import(
        "../app/src/lib/pseudonimo"
      );
      const { normalizarIdentificador, apelidoEmHex } = await import(
        "../app/src/lib/apelido"
      );
      const { ristretto255_oprf } = await import("@noble/curves/ed25519.js");
      const { oprf } = ristretto255_oprf;

      for (const cpf of ["000.000.000-00", "12345678901", "987.654.321-99"]) {
        const direto = apelidoDaCrianca(cpf);

        // O caminho do navegador, passo a passo.
        const entrada = new TextEncoder().encode(normalizarIdentificador(cpf));
        const { blind, blinded } = oprf.blind(entrada);
        const avaliado = avaliarApelidoCego(blinded);
        const cego = apelidoEmHex(oprf.finalize(entrada, blind, avaliado));

        assert.equal(
          cego,
          direto,
          `os dois caminhos divergiram para ${cpf} — os sinais nunca se cruzariam`,
        );
      }
    });

    it("a pontuação do identificador não muda o apelido", async function () {
      this.timeout(60_000);
      const { apelidoDaCrianca } = await import("../app/src/lib/pseudonimo");
      assert.equal(
        apelidoDaCrianca("000.000.000-00"),
        apelidoDaCrianca("00000000000"),
        "normalização divergente entre chamadas",
      );
    });

    it("identificadores diferentes dão apelidos diferentes", async function () {
      this.timeout(60_000);
      const { apelidoDaCrianca } = await import("../app/src/lib/pseudonimo");
      assert.notEqual(
        apelidoDaCrianca("11111111111"),
        apelidoDaCrianca("22222222222"),
      );
    });

    it("a consulta embaralhada muda a cada vez", async function () {
      this.timeout(60_000);
      const { ristretto255_oprf } = await import("@noble/curves/ed25519.js");
      const entrada = new TextEncoder().encode("00000000000");
      const a = ristretto255_oprf.oprf.blind(entrada).blinded;
      const b = ristretto255_oprf.oprf.blind(entrada).blinded;
      assert.notDeepEqual(
        Array.from(a),
        Array.from(b),
        "o mesmo identificador saiu igual duas vezes — dá para correlacionar consultas",
      );
    });
  });

  describe("escopo do anulador", () => {
    /**
     * Estes bytes estão fixados aqui **e** no teste equivalente em Rust
     * (`programs/custodia/src/zk.rs`). Os dois lados calculam por conta
     * própria e batem no mesmo valor: se um mudar sem o outro, um dos dois
     * testes cai. É o que a divergência silenciosa do escopo custou para ser
     * descoberta na primeira vez.
     */
    it("bate com o valor fixado do lado do programa", () => {
      const casos: [number, number, number, string][] = [
        [3552205, 2, 202608, "3633cd0200031770"],
        [0, 0, 0, "0000000000000000"],
        [1, 1, 1, "0000010100000001"],
      ];
      for (const [municipio, setor, periodo, esperado] of casos) {
        const v = valorDoEscopo(municipio, setor, periodo);
        assert.equal(
          v.toString(16).padStart(16, "0"),
          esperado,
          `escopo divergente para ${municipio}/${setor}/${periodo}`,
        );
      }
    });

    it("município, setor e período mudam o escopo de forma independente", () => {
      const base = valorDoEscopo(3552205, 2, 202608);
      assert.notEqual(base, valorDoEscopo(3552206, 2, 202608), "município não separa");
      assert.notEqual(base, valorDoEscopo(3552205, 3, 202608), "setor não separa");
      assert.notEqual(base, valorDoEscopo(3552205, 2, 202609), "período não separa");
    });
  });
});
