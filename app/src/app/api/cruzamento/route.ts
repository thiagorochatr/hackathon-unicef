import { NextResponse } from "next/server";
import { avaliarSoma, abrirComChaveErrada, chavePublica } from "@/lib/fhe/comite";
import * as no from "@/lib/fhe/noDeCruzamento";
import { apelidoDaCrianca } from "@/lib/pseudonimo";
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
  return NextResponse.json({ sinais: resumo(), limiar: LIMIAR });
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
        const papel = corpo.instituicao as PapelEmissor | undefined;
        if (!papel || !EMISSORES.includes(papel)) {
          return NextResponse.json({ erro: "órgão inválido" }, { status: 400 });
        }
        // Buscar a chave pública prova que o órgão não precisa da chave secreta.
        await chavePublica();
        const { cifrarComoOrgao } = await import("@/lib/fhe/orgao");
        // Sinal institucional pesa 1: é observação, não afirmação.
        const cifra = await cifrarComoOrgao(1);
        no.receber(apelido(), SETOR_DO_PAPEL[papel], cifra);
        return NextResponse.json({ sinais: resumo() });
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
      case "cruzar": {
        const soma = await no.somar(apelido());
        if (!soma) {
          return NextResponse.json({ erro: "nenhum sinal recebido" }, { status: 400 });
        }
        const { contagem, alerta } = await avaliarSoma(soma, LIMIAR);
        const comChaveErrada = await abrirComChaveErrada(soma);

        return NextResponse.json({
          contagem,
          alerta,
          limiar: LIMIAR,
          pedacoDaSoma: soma.slice(0, PEDACO),
          tamanhoDaSoma: soma.length,
          // O mesmo envelope, aberto com outra chave, devolve um número sem
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
    return NextResponse.json({ erro: String(e) }, { status: 500 });
  }
}
