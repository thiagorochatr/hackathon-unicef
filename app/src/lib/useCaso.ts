"use client";

import { useCallback, useEffect, useState } from "react";
import { useEstado } from "./store";
import type { CasoNaCadeia, Estado, Papel } from "./tipos";

/**
 * Lê o caso direto da Solana devnet, recarregando de tempos em tempos. A tela
 * nunca guarda o estado do caso: se a rede disser outra coisa, a rede ganha.
 *
 * `alertaIdExplicito` diz qual caso ler. Sem ele, cai no número guardado neste
 * navegador — que é como as telas do Elo funcionam, porque foi este navegador que
 * percorreu o roteiro. **Os portais dos órgãos não usam esse atalho:** eles
 * perguntam à rede quais casos são deles e passam o número aqui.
 */
export function useCaso(intervaloMs = 3000, alertaIdExplicito?: string | null) {
  const { alertaId: doNavegador } = useEstado();
  const alertaId = alertaIdExplicito ?? doNavegador;
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
    // Sem limpar o estado aqui: quem decide o que sai na tela é o retorno lá
    // embaixo, que só entrega o caso quando o número dele bate com o pedido.
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

  // Enquanto o caso pedido não chegou, não devolvemos o anterior: seria mostrar
  // os dados de um caso ao lado do número de outro.
  return {
    caso: alertaId && caso?.alertaId === alertaId ? caso : null,
    recarregar,
    alertaId,
  };
}

/** Resumo de um caso na lista de um órgão. Vem da rede, não do navegador. */
export interface ResumoDeCaso {
  alertaId: string;
  responsavel: Papel | null;
  pendentePara: Papel | null;
  estado: Estado;
  prazo: number;
  criadoEm: number;
  eventos: number;
}

/**
 * Os casos deste órgão, perguntados à rede.
 *
 * É o que substitui o número guardado no navegador. O sistema do órgão descobre
 * sozinho o que é dele, como descobriria de verdade — e por isso a tela funciona
 * em qualquer aparelho, para qualquer pessoa que a abra.
 */
export function useCasosDoOrgao(papel: Papel, intervaloMs = 5000) {
  const [casos, setCasos] = useState<ResumoDeCaso[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const buscar = useCallback(async () => {
    try {
      const r = await fetch(`/api/custodia?papel=${papel}`);
      const d = await r.json();
      if (d.casos) {
        setCasos(d.casos);
        setErro(null);
      } else if (d.erro) {
        setErro(String(d.erro));
      }
      return true;
    } catch (e) {
      setErro(String(e));
      return false;
    }
  }, [papel]);

  useEffect(() => {
    let vivo = true;
    const rodar = () => {
      if (vivo) void buscar();
    };
    rodar();
    const id = setInterval(rodar, intervaloMs);
    return () => {
      vivo = false;
      clearInterval(id);
    };
  }, [buscar, intervaloMs]);

  return { casos, erro, recarregar: buscar };
}
