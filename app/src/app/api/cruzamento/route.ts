import { NextResponse } from "next/server";
import {
  avaliarVeredito,
  abrirComChaveErrada,
  chavePublica,
  chavesDeRelinearizacao,
} from "@/lib/fhe/comite";
import * as no from "@/lib/fhe/noDeCruzamento";
import {
  comite,
  explorador,
  instituicao,
  pdaInstituicao,
  programa,
} from "@/lib/cadeia";
import { LimiteExcedido, limitarChamador, permitirEscrita } from "@/lib/guarda";
import { apelidoDaCrianca } from "@/lib/pseudonimo";
import { lerAberturas, registrarAbertura } from "@/lib/fhe/auditoria";
import { registrar } from "@/lib/log";
import { CRIANCA_FICTICIA, LIMIAR } from "@/lib/fixtures";
import {
  EMISSORES,
  SETOR_DO_PAPEL,
  type PapelEmissor,
  type Setor,
} from "@/lib/tipos";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Só um pedaço do envelope vai para a tela — inteiro tem mais de 100 mil letras. */
const PEDACO = 1400;

function apelido() {
  return apelidoDaCrianca(CRIANCA_FICTICIA.identificador);
}

function resumo() {
  const a = apelido();
  return no.listar(a).map((e) => ({
    setor: e.setor,
    protegido: e.protegido,
    apelido: a,
    pedacoDoEnvelope: e.cifraB64.slice(0, PEDACO),
    tamanhoTotal: e.cifraB64.length,
    recebidoEm: e.recebidoEm,
  }));
}

export async function GET() {
  return NextResponse.json({
    sinais: resumo(),
    limiar: LIMIAR,
    aberturas: await lerAberturas(),
  });
}

export async function POST(req: Request) {
  let corpo: {
    acao: string;
    instituicao?: string;
    setor?: string;
    peso?: number;
    sal?: string;
    assinatura?: string;
  };
  try {
    corpo = await req.json();
  } catch {
    return NextResponse.json({ erro: "corpo inválido" }, { status: 400 });
  }

  try {
    switch (corpo.acao) {
      /**
       * O órgão fecha o envelope com a chave pública do comitê e manda. O
       * conteúdo real do atendimento não sai da instituição: o que viaja é só
       * um "1" cifrado, dizendo que há sinal de risco.
       */
      case "emitir": {
        // Não escreve na rede, mas cifra — e cifrar custa CPU.
        limitarChamador(req, "emitir sinal", true);
        const papel = corpo.instituicao as PapelEmissor | undefined;
        if (!papel || !EMISSORES.includes(papel)) {
          return NextResponse.json({ erro: "órgão inválido" }, { status: 400 });
        }
        // Buscar a chave pública prova que o órgão não precisa da chave secreta.
        /**
         * O peso vem do que está sendo dito, e **não do canal**.
         *
         * Antes o institucional pesava 1 sempre, e só o protegido podia pesar 2.
         * Isso fazia o mesmo relato sobre a mesma criança valer menos quando a
         * instituição punha o nome — o contrário do razoável.
         *
         * Limitação declarada: esta rota não autentica o órgão, porque neste
         * protótipo a chave dele está no nosso servidor. Num sistema real quem
         * assina é o sistema da instituição, e aí o peso vem com assinatura.
         */
        const peso = corpo.peso === 2 ? 2 : 1;

        /**
         * O órgão assina o próprio aviso.
         *
         * Sem isto o rastro do sinal institucional não existia: ficava só um
         * envelope na memória. O aviso protegido era demonstrável e o da
         * instituição não — o contrário do razoável, já que ela tem dever legal
         * de notificar e precisa poder provar que cumpriu.
         *
         * Não cria conta: custa uma taxa de assinatura e nada de aluguel. O
         * compromisso leva sal, então o que sobe não identifica criança nenhuma.
         */
        const chave = instituicao(papel);
        await permitirEscrita(req, "registrar sinal do órgão", chave);
        const { compromissoDoSinal } = await import("@/lib/zk/registro");
        const sal = Buffer.from(
          crypto.getRandomValues(new Uint8Array(16)),
        ).toString("hex");
        const assinatura = await programa(chave)
          .methods.registrarSinalInstitucional(
            Array.from(Buffer.from(compromissoDoSinal(apelido(), peso, sal), "hex")),
            peso,
          )
          .accountsPartial({
            instituicao: pdaInstituicao(chave.publicKey),
            autoridade: chave.publicKey,
          })
          .rpc();

        registrar(
          "cadeia",
          "órgão assinou o próprio aviso",
          {
            órgão: papel,
            peso,
            "prova que a unidade avisou": "sim, com assinatura dela",
            "diz de qual criança": "não — o compromisso leva sal",
          },
          assinatura,
        );

        await chavePublica();
        const { cifrarComoOrgao } = await import("@/lib/fhe/orgao");
        const cifra = await cifrarComoOrgao(peso);
        no.receber(apelido(), SETOR_DO_PAPEL[papel], cifra);
        return NextResponse.json({
          sinais: resumo(),
          assinatura,
          link: explorador(assinatura),
        });
      }

      /**
       * Sinal de um profissional que provou credencial sem se identificar.
       *
       * O nó **exige** que exista o registro na rede: sem ele o envelope é
       * recusado. É isso que impede o próprio nó de inventar sinais — ele tem a
       * chave pública e conseguiria fechar envelopes sozinho, mas não consegue
       * produzir uma prova de credencial.
       */
      case "emitirCredenciado": {
        limitarChamador(req, "emitir sinal protegido", true);
        const { setor, peso, sal, assinatura } = corpo;
        if (!setor || !peso || !sal || !assinatura) {
          return NextResponse.json({ erro: "faltam dados do sinal" }, { status: 400 });
        }
        const { conferirRegistro } = await import("@/lib/zk/registro");
        await conferirRegistro({
          assinatura,
          setor: setor as Setor,
          peso: Number(peso),
          apelido: apelido(),
          sal,
        });

        await chavePublica();
        const { cifrarComoOrgao } = await import("@/lib/fhe/orgao");
        const cifra = await cifrarComoOrgao(Number(peso));
        no.receber(apelido(), setor as Setor, cifra, true);
        return NextResponse.json({ sinais: resumo() });
      }

      /**
       * O nó soma os envelopes sem abrir nenhum e entrega a soma — ainda
       * fechada — ao comitê, que é quem tem a chave.
       */
      /**
       * O nó compara a soma com o limite **dentro do envelope** e entrega ao
       * comitê um resultado que só pode ser zero ou não-zero. O comitê abre e
       * aprende exatamente um bit: passou ou não passou.
       *
       * Ele não descobre quantos setores participaram, nem se foi uma denúncia
       * sozinha ou dois apontamentos. Antes descobria a contagem — era a última
       * coisa que ele aprendia além do necessário.
       */
      case "cruzar": {
        // Cruzar soma, compara e depois **escreve** o registro da abertura.
        // A cerca vem antes de tudo: o trabalho de FHE já é caro sozinho.
        await permitirEscrita(req, "cruzar", comite());
        const veredito = await no.avaliarLimiar(
          apelido(),
          LIMIAR,
          await chavesDeRelinearizacao(),
        );
        if (!veredito) {
          return NextResponse.json({ erro: "nenhum sinal recebido" }, { status: 400 });
        }
        const { alerta, aberto } = await avaliarVeredito(veredito);
        const comChaveErrada = await abrirComChaveErrada(veredito);

        // Toda abertura deixa rastro assinado na rede. É o que troca parte da
        // confiança no comitê por uma contagem que qualquer pessoa confere.
        const auditoria = await registrarAbertura(veredito, alerta);

        return NextResponse.json({
          alerta,
          auditoria: { ...auditoria, link: explorador(auditoria.assinatura) },
          // Vai para a tela só para se ver que não significa nada: é o produto
          // mascarado por um fator sorteado, e não a contagem.
          aberto,
          limiar: LIMIAR,
          pedacoDaSoma: veredito.slice(0, PEDACO),
          tamanhoDaSoma: veredito.length,
          // O mesmo envelope, aberto com outra chave, devolve outro número sem
          // sentido. É a prova de que o sigilo não depende de boa vontade.
          comChaveErrada,
        });
      }

      case "limpar": {
        no.limpar();
        return NextResponse.json({ sinais: [] });
      }

      default:
        return NextResponse.json({ erro: "ação desconhecida" }, { status: 400 });
    }
  } catch (e) {
    if (e instanceof LimiteExcedido) {
      return NextResponse.json({ erro: e.message }, { status: 429 });
    }
    return NextResponse.json({ erro: String(e) }, { status: 500 });
  }
}
