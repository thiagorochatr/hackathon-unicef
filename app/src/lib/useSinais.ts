"use client";

import { useCallback, useEffect, useState } from "react";
import type { Setor } from "./tipos";

export interface SinalNoNo {
  /** O cruzamento conta setores, não instituições. */
  setor: Setor;
  /** Se veio de um profissional que provou credencial sem se identificar. */
  protegido: boolean;
  apelido: string;
  pedacoDoEnvelope: string;
  tamanhoTotal: number;
  recebidoEm: number;
}

/**
 * Os envelopes cifrados ficam no nó de cruzamento, não no navegador. Cada um
 * tem mais de cem mil letras — e, mais importante, é lá que eles teriam que
 * estar de verdade. A tela só pergunta o que existe.
 */
export function useSinais() {
  const [sinais, setSinais] = useState<SinalNoNo[]>([]);

  const recarregar = useCallback(async () => {
    try {
      const r = await fetch("/api/cruzamento");
      const d = await r.json();
      setSinais(d.sinais ?? []);
    } catch {
      // sem rede: a próxima tentativa resolve
    }
  }, []);

  useEffect(() => {
    let vivo = true;
    const buscar = async () => {
      try {
        const r = await fetch("/api/cruzamento");
        const d = await r.json();
        if (vivo) setSinais(d.sinais ?? []);
      } catch {
        // idem
      }
    };
    void buscar();
    return () => {
      vivo = false;
    };
  }, []);

  return { sinais, recarregar };
}

/*
 * O emissor que existia aqui foi removido junto com a tela `/sinal/[papel]`.
 *
 * Ele mandava o sinal **sem peso** — é anterior à distinção entre apontamento e
 * denúncia. Deixá-lo por perto seria uma armadilha: qualquer chamada nova cairia
 * no caminho velho e emitiria sinal sem a força declarada, silenciosamente.
 *
 * Quem emite agora é `app/(orgaos)/_lib/emitir.ts`, de dentro dos portais.
 */

export interface Auditoria {
  assinatura: string;
  link: string;
  total: number;
  alertas: number;
}

export interface ResultadoCruzamento {
  alerta: boolean;
  /** O registro público desta abertura. */
  auditoria: Auditoria;
  /** O que o comitê abriu. Não é a contagem: é ruído mascarado. */
  aberto: number;
  limiar: number;
  pedacoDaSoma: string;
  tamanhoDaSoma: number;
  comChaveErrada: number;
}

export async function cruzarSinais(): Promise<ResultadoCruzamento> {
  const r = await fetch("/api/cruzamento", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ acao: "cruzar" }),
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d.erro ?? "falha no cruzamento");
  return d;
}

export async function limparSinais(): Promise<void> {
  await fetch("/api/cruzamento", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ acao: "limpar" }),
  });
}
