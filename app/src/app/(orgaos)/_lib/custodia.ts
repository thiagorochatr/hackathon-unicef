"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { acoes } from "@/lib/store";
import { useCaso, useCasosDoOrgao, type ResumoDeCaso } from "@/lib/useCaso";
import type { Papel } from "@/lib/tipos";

export type { ResumoDeCaso };

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
 * ## Como o portal descobre o que é dele
 *
 * Perguntando à rede: "quais casos estão sob a minha chave, ou pendentes para
 * mim?". Nada vem do navegador.
 *
 * Isto já foi diferente, e estava errado. O número do caso ficava guardado no
 * `localStorage` de quem tinha percorrido o roteiro — então o portal só mostrava
 * o caso para aquela pessoa, naquela janela. Quem abrisse `/creas` em outro
 * aparelho via a tela vazia, embora o caso existisse na rede e fosse conferível
 * por qualquer um. O sistema de um órgão de verdade não é avisado por um
 * navegador sobre qual caso é dele.
 */
export function usePainelDoOrgao(eu: Papel) {
  const { casos, recarregar: recarregarLista } = useCasosDoOrgao(eu);
  const [escolhido, setEscolhido] = useState<string | null>(null);

  // Sem escolha feita, o mais recente — que é o que o profissional quer ver ao
  // abrir a tela de manhã.
  const alertaAtivo = escolhido ?? casos?.[0]?.alertaId ?? null;
  const { caso, recarregar: recarregarCaso } = useCaso(3000, alertaAtivo);

  const [ocupado, setOcupado] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [ultimaAssinatura, setUltimaAssinatura] = useState<string | null>(null);

  const recarregar = useCallback(async () => {
    await Promise.all([recarregarCaso(), recarregarLista()]);
  }, [recarregarCaso, recarregarLista]);

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
    /** Todos os casos deste órgão, os mais recentes primeiro. */
    casos,
    /** Qual deles está aberto na tela. */
    alertaId: alertaAtivo,
    escolher: setEscolhido,
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
 *
 * ## Só o que a tela viu vencer
 *
 * A tela empurra apenas casos cujo prazo **acabou enquanto ela estava aberta**.
 * Um caso que já chegou vencido fica quieto.
 *
 * O motivo é concreto, e apareceu ao passar a ler a lista da rede: a chave do
 * CREAS acumulou 40 casos de semanas de teste, quase todos abertos e com prazo
 * vencido havia dias. Sem esta trava, abrir o portal disparava uma escalada,
 * depois outra, depois outra — o caso subia, saía da lista, o seguinte virava o
 * selecionado e a coisa recomeçava, gastando SOL para levar lixo de teste ao
 * Ministério Público.
 *
 * Isso não afeta a demonstração, que é justamente ficar olhando o relógio zerar.
 * E é coerente com o que a `/caso` já diz: quem varre o atrasado seria um serviço
 * separado, não a tela de quem está trabalhando.
 */
export function useEscaladaAutomatica(
  caso: { alertaId: string; estado: string; prazo: number } | null,
  agora: number | null,
  ocupado: string | null,
  executar: (nome: string, fn: () => Promise<unknown>) => Promise<void>,
) {
  const jaTentou = useRef(false);
  /** Casos que esta tela viu com prazo ainda correndo. */
  const acompanhados = useRef(new Set<string>());

  useEffect(() => {
    if (!caso || agora === null || ocupado) return;
    if (caso.estado === "Escalado" || caso.estado === "Encerrado") {
      jaTentou.current = false;
      return;
    }
    if (agora <= caso.prazo) {
      acompanhados.current.add(caso.alertaId);
      jaTentou.current = false;
      return;
    }
    // Venceu. Só empurra se tiver visto o relógio correndo antes.
    if (!acompanhados.current.has(caso.alertaId) || jaTentou.current) return;
    jaTentou.current = true;
    void executar("escalar", () => acoes.levarAoMp(caso.alertaId));
  }, [caso, agora, ocupado, executar]);
}

/**
 * Quantos casos a tabela mostra.
 *
 * A rede devolve tudo o que está sob a chave do órgão, e depois de semanas de
 * testes isso são dezenas — a chave do CREAS tinha 42 casos quando medi. Um
 * sistema de verdade pagina; aqui a tela mostra os mais recentes e diz quantos
 * existem ao todo, em vez de esconder o número.
 */
export const CASOS_NA_TELA = 6;

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
