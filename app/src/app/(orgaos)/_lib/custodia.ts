"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { acoes } from "@/lib/store";
import { useCaso } from "@/lib/useCaso";
import type { Papel } from "@/lib/tipos";

/**
 * O que os portais que **recebem** compartilham.
 *
 * Os três que emitem mandam envelope e vão embora. Estes três — CREAS, Conselho
 * Tutelar e Ministério Público — não emitem nada: eles recebem um caso e agem
 * sobre ele, e cada ação é uma transação assinada na rede.
 *
 * ## O que estes sistemas de verdade não compartilham
 *
 * Banco de dados. Cada um lê **a mesma cadeia pública** e enxerga o mesmo estado
 * do caso porque ele está lá, não porque alguém sincronizou. É a diferença
 * inteira do projeto: a informação comum é o estado da custódia — de quem é a
 * bola e até quando —, e não a vida da criança.
 *
 * ## Simplificação declarada
 *
 * Qual caso está aberto vem do navegador, não da rede. Num sistema de verdade
 * cada órgão perguntaria à cadeia quais casos estão sob a chave dele; aqui a
 * demonstração guarda um identificador localmente para que as telas falem do
 * mesmo caso. **O estado do caso, esse sim, é lido da rede a cada poucos
 * segundos** — se a rede disser outra coisa, a rede ganha.
 */
export function usePainelDoOrgao(eu: Papel) {
  const { caso, recarregar, alertaId } = useCaso();
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [ultimaAssinatura, setUltimaAssinatura] = useState<string | null>(null);

  const executar = useCallback(
    async (nome: string, fn: () => Promise<unknown>) => {
      setOcupado(nome);
      setErro(null);
      try {
        const r = (await fn()) as { assinatura?: string } | undefined;
        if (r?.assinatura) setUltimaAssinatura(r.assinatura);
        await recarregar();
      } catch (e) {
        setErro(String(e instanceof Error ? e.message : e));
      } finally {
        setOcupado(null);
      }
    },
    [recarregar],
  );

  const meu = caso?.responsavel === eu;
  const encerrado = caso?.estado === "Encerrado";

  return {
    caso,
    alertaId,
    ocupado,
    erro,
    ultimaAssinatura,
    executar,
    acoes,
    /** O caso está sob a responsabilidade deste órgão agora. */
    meu,
    /** Alguém passou o caso para cá e este órgão ainda não confirmou. */
    esperandoMeuAceite:
      caso?.estado === "PendenteAceite" && caso?.pendentePara === eu,
    /** Dá para passar adiante: é meu, e não está pendente com outro. */
    podeTransferir:
      meu && (caso?.estado === "Aberto" || caso?.estado === "EmAtendimento"),
    podeEncerrar: meu && !encerrado,
    encerrado,
  };
}

/**
 * Quando o prazo vence e ninguém assumiu, o caso sobe sozinho ao Ministério
 * Público.
 *
 * ## Quem chama isto, e por que tanto faz
 *
 * O programa na rede só aceita a escalada **depois** do vencimento, e não olha
 * de quem é a chave que pediu. Qualquer pessoa pode chamar: outro órgão, um
 * observador, um robô. Não existe autorização a conceder, então não existe
 * autorização a negar.
 *
 * Por isso a própria tela do órgão que está segurando o caso faz a chamada, e
 * isso não é contradição: se o software do Conselho Tutelar se recusasse, o caso
 * subiria igual pela mão de qualquer outro. A tela só torna visível uma coisa
 * que já não depende dela.
 *
 * Num sistema de verdade isto seria um serviço varrendo os prazos vencidos, ou
 * simplesmente o interesse de quem quer que o caso ande. Fica declarado como
 * simplificação de protótipo.
 */
export function useEscaladaAutomatica(
  caso: { estado: string; prazo: number } | null,
  agora: number | null,
  ocupado: string | null,
  executar: (nome: string, fn: () => Promise<unknown>) => Promise<void>,
) {
  const jaTentou = useRef(false);

  useEffect(() => {
    if (!caso || agora === null || ocupado) return;
    if (caso.estado === "Escalado" || caso.estado === "Encerrado") {
      jaTentou.current = false;
      return;
    }
    if (agora <= caso.prazo || jaTentou.current) return;
    jaTentou.current = true;
    void executar("escalar", () => acoes.levarAoMp());
  }, [caso, agora, ocupado, executar]);
}

export const LINK_TX = (a: string) =>
  `https://explorer.solana.com/tx/${a}?cluster=devnet`;

/** Quanto falta do prazo, em texto de sistema de governo. */
export function faltaPara(prazo: number, agora: number | null): string {
  if (agora === null) return "—";
  const seg = Math.round((prazo - agora) / 1000);
  if (seg <= 0) return "VENCIDO";
  const m = Math.floor(seg / 60);
  const s = seg % 60;
  return m > 0 ? `${m} min ${String(s).padStart(2, "0")} s` : `${s} s`;
}
