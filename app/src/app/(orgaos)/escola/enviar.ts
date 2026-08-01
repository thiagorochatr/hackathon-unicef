"use client";

import { obterApelido } from "@/lib/zk/apelidoCego";
import { obterIdentidade } from "@/lib/zk/identidade";
import { gerarProva } from "@/lib/zk/prova";
import { CRIANCA_FICTICIA } from "@/lib/fixtures";

/**
 * As duas saídas do registro de ocorrência.
 *
 * A escolha aparece aqui, no sistema da escola, na hora de enviar — e não numa
 * página à parte. É onde o medo de retaliação de fato acontece: quem lança a
 * frequência é o professor, e é ele que decide se assina.
 */

const MUNICIPIO = 3552205;
const SETOR = "educacao";
const BYTE_DO_SETOR = 2;

/**
 * A lista de credenciados, buscada uma vez e reaproveitada.
 *
 * Ela é reconstruída lendo a cadeia, o que leva tempo na primeira vez. Deixar
 * isso para a hora do envio fazia o professor esperar olhando para um botão —
 * justamente no momento em que ele já hesita. Agora a busca começa quando o
 * portal abre, enquanto ele olha a chamada.
 */
interface Lista {
  grupo: { folhas: string[] } | null;
  periodo: number;
  erro?: string;
}

let listaEmCurso: Promise<Lista> | null = null;

export function prepararLista(): void {
  listaEmCurso ??= fetch(`/api/denuncia?setor=${SETOR}`).then(
    (r) => r.json() as Promise<Lista>,
  );
}

async function lista(): Promise<Lista> {
  prepararLista();
  const d = (await listaEmCurso) as Lista;
  if (d?.erro) {
    listaEmCurso = null;
    throw new Error(d.erro);
  }
  return d;
}

/** Depois de credenciar alguém a lista mudou, então a guardada não serve mais. */
function esquecerLista(): void {
  listaEmCurso = null;
}

export interface Passo {
  texto: string;
  detalhe?: string;
}

/**
 * Caminho institucional: a escola assina.
 *
 * O sinal sai em nome da unidade, como já sai hoje por ofício — a diferença é
 * que agora ele vira envelope cifrado em vez de papel.
 */
export async function enviarComoEscola(
  avisar: (p: Passo) => void,
): Promise<void> {
  avisar({ texto: "Lacrando o envelope na unidade" });
  const r = await fetch("/api/cruzamento", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ acao: "emitir", instituicao: "escola" }),
  });
  const d = await r.json();
  if (d.erro) throw new Error(d.erro);
  avisar({
    texto: "Enviado",
    detalhe: "O que saiu da escola foi um envelope fechado, não o registro.",
  });
}

/**
 * Caminho protegido: a pessoa prova que pode avisar, sem dizer quem é.
 *
 * O credenciamento acontece na hora porque isto é demonstração. Num sistema de
 * verdade quem credencia é o setor de pessoal da instituição, e a tela diz isso.
 */
export async function enviarProtegido(
  peso: 1 | 2,
  avisar: (p: Passo) => void,
): Promise<void> {
  avisar({ texto: "Preparando sua credencial neste aparelho" });
  const identidade = await obterIdentidade();

  const estado = await lista();
  let grupo = estado.grupo;
  if (!grupo?.folhas?.includes(identidade.compromisso)) {
    avisar({
      texto: "Credenciando você na lista do setor",
      detalhe: "Nesta demonstração é automático; no sistema real quem credencia é o RH.",
    });
    const r = await fetch("/api/denuncia", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        acao: "credenciar",
        setor: SETOR,
        compromisso: identidade.compromisso,
      }),
    });
    const d = await r.json();
    if (d.erro) throw new Error(d.erro);
    grupo = d.grupo;
    esquecerLista();
  }

  avisar({
    texto: "Descobrindo o apelido da criança sem dizer qual é",
    detalhe: "O identificador não sai deste aparelho.",
  });
  const apelido = await obterApelido(CRIANCA_FICTICIA.identificador);

  if (!grupo) throw new Error("a lista de credenciados do setor não está disponível");

  avisar({ texto: "Gerando a prova aqui, neste computador" });
  const prova = await gerarProva(
    identidade.segredo,
    grupo.folhas,
    apelido,
    peso,
    MUNICIPIO,
    BYTE_DO_SETOR,
    estado.periodo,
  );
  avisar({
    texto: `Prova pronta em ${prova.ms} ms`,
    detalhe: "Ela não guarda nada sobre quem a produziu. Nem hoje, nem daqui a 50 anos.",
  });

  avisar({ texto: "Registrando na rede, por outra pessoa" });
  const reg = await fetch("/api/denuncia", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      acao: "registrar",
      setor: SETOR,
      peso,
      sal: prova.sal,
      anulador: prova.anulador,
      pontos: prova.pontos,
    }),
  });
  const dReg = await reg.json();
  if (dReg.erro) throw new Error(dReg.erro);

  const cruz = await fetch("/api/cruzamento", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      acao: "emitirCredenciado",
      setor: SETOR,
      peso,
      sal: prova.sal,
      assinatura: dReg.assinatura,
    }),
  });
  const dCruz = await cruz.json();
  if (dCruz.erro) throw new Error(dCruz.erro);

  avisar({
    texto: "Enviado sem sua identificação",
    detalhe: "Quem pagou a taxa foi outra pessoa. Nenhum órgão assinou, e você também não.",
  });
}

/** Número de protocolo, como qualquer sistema de governo devolve. */
export function protocolo(): string {
  const agora = new Date();
  const dia = `${agora.getFullYear()}${String(agora.getMonth() + 1).padStart(2, "0")}${String(agora.getDate()).padStart(2, "0")}`;
  const seq = String(Math.floor(Math.random() * 900000) + 100000);
  return `${dia}.${seq}`;
}
