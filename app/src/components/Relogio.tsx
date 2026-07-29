"use client";

import { useEffect, useSyncExternalStore } from "react";

/**
 * Relógio compartilhado. O tempo é uma fonte externa mutável, então é lido por
 * `useSyncExternalStore` em vez de `Date.now()` durante a renderização — assim a
 * renderização segue pura e o servidor devolve `null` sem divergir na hidratação.
 */
let agoraGlobal = 0;
let intervalo: ReturnType<typeof setInterval> | null = null;
const ouvintes = new Set<() => void>();

function inscrever(ouvinte: () => void) {
  ouvintes.add(ouvinte);
  if (intervalo === null) {
    agoraGlobal = Date.now();
    intervalo = setInterval(() => {
      agoraGlobal = Date.now();
      ouvintes.forEach((o) => o());
    }, 250);
  }
  return () => {
    ouvintes.delete(ouvinte);
    if (ouvintes.size === 0 && intervalo !== null) {
      clearInterval(intervalo);
      intervalo = null;
    }
  };
}

const lerCliente = () => agoraGlobal;
const lerServidor = () => null;

export function useAgora(): number | null {
  return useSyncExternalStore(inscrever, lerCliente, lerServidor);
}

function formatar(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function Relogio({
  prazo,
  pausado = false,
  aoVencer,
}: {
  prazo: number;
  pausado?: boolean;
  aoVencer?: () => void;
}) {
  const agora = useAgora();
  const pronto = agora !== null && agora > 0;
  const restante = pronto ? prazo - agora : null;
  const venceu = restante !== null && restante <= 0;

  useEffect(() => {
    if (venceu && !pausado) aoVencer?.();
  }, [venceu, pausado, aoVencer]);

  if (pausado) {
    return <span className="font-mono text-sm text-[var(--texto-3)]">—</span>;
  }

  const cor = venceu
    ? "var(--perigo)"
    : restante !== null && restante < 15_000
      ? "var(--alerta)"
      : "var(--texto)";

  return (
    <span
      className={`font-mono text-sm tabular-nums ${venceu ? "pulsando" : ""}`}
      style={{ color: cor }}
      suppressHydrationWarning
    >
      {restante === null ? "--:--" : venceu ? "PRAZO VENCIDO" : formatar(restante)}
    </span>
  );
}
