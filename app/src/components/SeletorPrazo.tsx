"use client";

import { acoes, useEstado } from "@/lib/store";
import { PRAZO_OPCOES } from "@/lib/fixtures";

/**
 * Escolha do prazo antes de abrir o caso. Existe por um motivo prático de
 * apresentação: com 45 segundos não dá tempo de explicar o repasse antes de o
 * caso ir sozinho para o Ministério Público.
 */
export function SeletorPrazo({ compacto = false }: { compacto?: boolean }) {
  const { prazoSeg } = useEstado();
  const escolhida = PRAZO_OPCOES.find((o) => o.seg === prazoSeg);

  return (
    <div className={compacto ? "space-y-1.5" : "space-y-2"}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="rotulo">Prazo do caso</span>
        {PRAZO_OPCOES.map((o) => (
          <button
            key={o.seg}
            onClick={() => acoes.definirPrazo(o.seg)}
            className={`botao !px-3 !py-1.5 text-xs ${prazoSeg === o.seg ? "botao-forte" : ""}`}
            title={o.ajuda}
          >
            {o.rotulo}
          </button>
        ))}
      </div>
      {!compacto && (
        <p className="text-xs text-[var(--texto-3)]">
          {escolhida
            ? `${escolhida.ajuda}. `
            : ""}
          Vale para o caso que for aberto agora e para cada vez que um órgão
          confirmar que recebeu.
        </p>
      )}
    </div>
  );
}
