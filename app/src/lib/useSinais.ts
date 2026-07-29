"use client";

import { useCallback, useEffect, useState } from "react";
import type { Papel } from "./tipos";

export interface SinalNoNo {
  instituicao: Papel;
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

export async function emitirSinal(instituicao: Papel): Promise<SinalNoNo[]> {
  const r = await fetch("/api/cruzamento", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ acao: "emitir", instituicao }),
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d.erro ?? "falha ao registrar o sinal");
  return d.sinais;
}

export interface ResultadoCruzamento {
  contagem: number;
  alerta: boolean;
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
