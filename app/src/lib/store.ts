"use client";

import { useSyncExternalStore } from "react";
import type { EstadoApp, Papel } from "./tipos";
import { PRAZO_PADRAO_SEG } from "./fixtures";
import { limparSinais } from "./useSinais";

/**
 * Guarda só o que é local ao navegador durante a demonstração: os sinais que
 * cada instituição emitiu e qual caso está aberto. O caso em si vive na Solana
 * e é lido de lá pela API — este arquivo nunca é a fonte da verdade sobre ele.
 */

const CHAVE = "custodia.demo.v2";

const ESTADO_INICIAL: EstadoApp = {
  prazoSeg: PRAZO_PADRAO_SEG,
  alertaId: null,
  ciclo: 1,
};

let estado: EstadoApp = ESTADO_INICIAL;
let carregado = false;
const ouvintes = new Set<() => void>();

function persistir() {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(estado));
  } catch {
    // modo privado ou armazenamento cheio: a demonstração segue em memória
  }
}

function carregar() {
  if (carregado) return;
  carregado = true;
  try {
    const bruto = localStorage.getItem(CHAVE);
    if (bruto) estado = { ...ESTADO_INICIAL, ...JSON.parse(bruto) };
  } catch {
    estado = ESTADO_INICIAL;
  }
}

function definir(proximo: EstadoApp) {
  estado = proximo;
  persistir();
  ouvintes.forEach((o) => o());
}

function inscrever(ouvinte: () => void) {
  carregar();
  ouvintes.add(ouvinte);
  return () => {
    ouvintes.delete(ouvinte);
  };
}

function ler(): EstadoApp {
  carregar();
  return estado;
}

/** No servidor não há estado — evita divergência na hidratação. */
function lerServidor(): EstadoApp {
  return ESTADO_INICIAL;
}

export function useEstado(): EstadoApp {
  return useSyncExternalStore(inscrever, ler, lerServidor);
}

// ---------------------------------------------------------------------------
// Ações
// ---------------------------------------------------------------------------

async function chamar(corpo: Record<string, unknown>) {
  const r = await fetch("/api/custodia", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(corpo),
  });
  const dados = await r.json();
  if (!r.ok) throw new Error(dados.erro ?? "falha na chamada");
  return dados as { alertaId?: string; assinatura: string };
}

export const acoes = {
  /**
   * Grava na Solana o caso gerado pelo cruzamento. O cruzamento em si acontece
   * no servidor, em `/api/cruzamento` — aqui só guardamos qual caso está aberto.
   */
  async abrirCaso(): Promise<{ assinatura: string }> {
    const atual = ler();
    if (atual.alertaId) return { assinatura: "" };
    const { alertaId, assinatura } = await chamar({
      acao: "abrir",
      prazoSeg: atual.prazoSeg,
    });
    definir({ ...ler(), alertaId: alertaId ?? null });
    return { assinatura };
  },

  transferir(destino: Papel) {
    return chamar({ acao: "transferir", alertaId: ler().alertaId, destino });
  },

  aceitar(quem: Papel) {
    const atual = ler();
    return chamar({
      acao: "aceitar",
      alertaId: atual.alertaId,
      quem,
      prazoSeg: atual.prazoSeg,
    });
  },

  definirPrazo(seg: number) {
    definir({ ...ler(), prazoSeg: seg });
  },

  /**
   * Aponta a demonstração para um caso já aberto. Usado pela denúncia
   * protegida, onde quem abre o caso é a prova e não o cruzamento — as telas de
   * custódia daqui para a frente funcionam igual.
   */
  definirAlerta(alertaId: string) {
    definir({ ...ler(), alertaId });
  },

  /** Pode ser acionado por qualquer chave depois do prazo. */
  levarAoMp() {
    return chamar({ acao: "escalar", alertaId: ler().alertaId });
  },

  encerrar() {
    return chamar({ acao: "desfecho", alertaId: ler().alertaId });
  },

  avancarCiclo() {
    definir({ ...ler(), ciclo: ler().ciclo + 1 });
  },

  voltarCiclo() {
    const atual = ler();
    definir({ ...atual, ciclo: Math.max(1, atual.ciclo - 1) });
  },

  /**
   * Volta tudo ao começo: esquece o caso aberto e manda o nó de cruzamento
   * descartar os envelopes que já recebeu. Sem a segunda parte não dá para
   * repetir a demonstração, porque os sinais ficariam guardados no servidor.
   */
  async reiniciar() {
    definir(ESTADO_INICIAL);
    try {
      await limparSinais();
    } catch {
      // se o servidor não responder, ao menos o navegador já voltou ao início
    }
  },
};
