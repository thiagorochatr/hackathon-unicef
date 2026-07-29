"use client";

import { useCallback, useEffect, useState } from "react";
import { useEstado } from "./store";
import type { CasoNaCadeia } from "./tipos";

/**
 * Lê o caso direto da Solana devnet, recarregando de tempos em tempos. A tela
 * nunca guarda o estado do caso: se a rede disser outra coisa, a rede ganha.
 */
export function useCaso(intervaloMs = 3000) {
  const { alertaId } = useEstado();
  const [caso, setCaso] = useState<CasoNaCadeia | null>(null);

  const recarregar = useCallback(async () => {
    if (!alertaId) return;
    try {
      const r = await fetch(`/api/custodia?alertaId=${alertaId}`);
      const d = await r.json();
      if (d.caso) setCaso(d.caso);
    } catch {
      // rede instável: a próxima rodada tenta de novo
    }
  }, [alertaId]);

  useEffect(() => {
    if (!alertaId) return;
    let vivo = true;

    const buscar = async () => {
      try {
        const r = await fetch(`/api/custodia?alertaId=${alertaId}`);
        const d = await r.json();
        if (vivo && d.caso) setCaso(d.caso);
      } catch {
        // idem
      }
    };

    void buscar();
    const id = setInterval(buscar, intervaloMs);
    return () => {
      vivo = false;
      clearInterval(id);
    };
  }, [alertaId, intervaloMs]);

  return { caso: alertaId ? caso : null, recarregar, alertaId };
}
