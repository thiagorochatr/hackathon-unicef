"use client";

import { useCallback, useEffect, useState } from "react";
import { useAgora } from "@/components/Relogio";
import { acoes, useEstado } from "@/lib/store";
import { useCaso } from "@/lib/useCaso";
import { CRIANCA_FICTICIA } from "@/lib/fixtures";
import { PAPEL, type Papel } from "@/lib/tipos";

interface OrgaoNoPainel {
  papel: Papel;
  chave: string;
  cadastrado: boolean;
  marcou: boolean;
  ultimoPeriodo: number;
  endereco: string;
  link: string | null;
  marcadoEm: number | null;
}

export default function TelaPainel() {
  const { ciclo } = useEstado();
  const agora = useAgora();
  const { caso } = useCaso(5000);

  const [orgaos, setOrgaos] = useState<OrgaoNoPainel[]>([]);
  const [ocupado, setOcupado] = useState<Papel | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const buscar = useCallback(async () => {
    try {
      const r = await fetch(`/api/painel?periodo=${ciclo}`);
      const d = await r.json();
      setOrgaos(d.orgaos ?? []);
    } catch {
      // sem rede: a próxima tentativa resolve
    }
  }, [ciclo]);

  useEffect(() => {
    let vivo = true;
    const carregar = async () => {
      try {
        const r = await fetch(`/api/painel?periodo=${ciclo}`);
        const d = await r.json();
        if (vivo) setOrgaos(d.orgaos ?? []);
      } catch {
        // idem
      }
    };
    void carregar();
    return () => {
      vivo = false;
    };
  }, [ciclo]);

  async function marcar(papel: Papel) {
    setOcupado(papel);
    setErro(null);
    try {
      const r = await fetch("/api/painel", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ acao: "marcar", instituicao: papel, periodo: ciclo }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.erro ?? "falha ao marcar presença");
      setOrgaos(d.orgaos ?? []);
    } catch (e) {
      setErro(String(e instanceof Error ? e.message : e));
    } finally {
      setOcupado(null);
    }
  }

  const faltantes = orgaos.filter((o) => !o.marcou);
  const vencidos =
    caso && caso.estado !== "Encerrado" && agora !== null && agora > caso.prazo ? 1 : 0;

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="rotulo">
          Painel público · município {CRIANCA_FICTICIA.codigoIbge} · Solana devnet
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Serve para cobrar. Não serve para vigiar.
        </h1>
        <p className="max-w-2xl text-sm text-[var(--texto-2)]">
          Não há uma única criança identificável nesta tela — nem apelido, nem contagem
          por pessoa. O que é público é o comportamento dos órgãos, e isso qualquer um
          pode conferir na rede sem pedir autorização a ninguém.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="cartao p-5">
          <p className="rotulo">Período</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums">{ciclo}</p>
          <div className="mt-3 flex gap-2">
            <button
              className="botao !px-3 !py-1.5 text-xs"
              disabled={ciclo <= 1}
              onClick={() => acoes.voltarCiclo()}
            >
              ← anterior
            </button>
            <button
              className="botao !px-3 !py-1.5 text-xs"
              onClick={() => acoes.avancarCiclo()}
            >
              próximo →
            </button>
          </div>
        </div>
        <div className="cartao p-5">
          <p className="rotulo">Não marcaram presença</p>
          <p
            className="mt-1 text-3xl font-semibold tabular-nums"
            style={{ color: faltantes.length ? "var(--alerta)" : "var(--ok)" }}
          >
            {faltantes.length}
          </p>
          <p className="mt-3 text-xs text-[var(--texto-2)]">
            de {orgaos.length} órgãos que deveriam marcar
          </p>
        </div>
        <div className="cartao p-5">
          <p className="rotulo">Prazos vencidos</p>
          <p
            className="mt-1 text-3xl font-semibold tabular-nums"
            style={{ color: vencidos ? "var(--perigo)" : "var(--ok)" }}
          >
            {vencidos}
          </p>
          <p className="mt-3 text-xs text-[var(--texto-2)]">em casos não encerrados</p>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="rotulo">Cada órgão precisa dar sinal de vida</h2>
        <p className="max-w-2xl text-sm text-[var(--texto-2)]">
          Todo órgão grava um selo a cada período, mesmo quando não teve nenhum caso. É
          a <strong className="text-[var(--texto)]">falta</strong> desse selo que acende
          o alerta — porque o problema mais comum não é alguém mentir no registro, é
          ninguém registrar nada.
        </p>

        {erro && (
          <p className="cartao border-[var(--perigo)] p-3 text-xs text-[var(--perigo)]">
            {erro}
          </p>
        )}

        <div className="space-y-2">
          {orgaos.length === 0 && (
            <div className="cartao p-6 text-sm text-[var(--texto-2)]">
              Lendo a rede…
            </div>
          )}
          {orgaos.map((o) => (
            <div key={o.papel} className="cartao flex flex-wrap items-center gap-3 p-4">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ background: PAPEL[o.papel].cor }}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{PAPEL[o.papel].sigla}</p>
                {o.marcou && o.link ? (
                  <a
                    href={o.link}
                    target="_blank"
                    rel="noreferrer"
                    className="cifra underline"
                  >
                    selo do período {ciclo} na rede: {o.endereco.slice(0, 24)}…
                  </a>
                ) : (
                  <p className="cifra">
                    último período marcado: {o.ultimoPeriodo || "nenhum"}
                  </p>
                )}
              </div>
              <span
                className="text-xs font-medium"
                style={{ color: o.marcou ? "var(--ok)" : "var(--alerta)" }}
              >
                {o.marcou ? "marcou presença" : "não marcou — alerta"}
              </span>
              {!o.marcou && (
                <button
                  className="botao !px-3 !py-1.5 text-xs"
                  disabled={ocupado !== null || o.ultimoPeriodo >= ciclo}
                  onClick={() => marcar(o.papel)}
                  title={
                    o.ultimoPeriodo >= ciclo
                      ? "este órgão já marcou um período igual ou posterior"
                      : undefined
                  }
                >
                  {ocupado === o.papel ? "assinando…" : "Marcar presença"}
                </button>
              )}
            </div>
          ))}
        </div>

        <button className="botao !px-3 !py-1.5 text-xs" onClick={buscar}>
          Reler da rede
        </button>
      </section>

      <p className="max-w-3xl text-xs text-[var(--texto-3)]">
        Hoje, silêncio e tranquilidade se parecem: um Conselho Tutelar que não registra
        nada fica igual a um que não teve caso nenhum. O selo separa os dois. E como ele
        vive na Solana, quem quer cobrar não precisa pedir acesso a nenhum sistema, nem
        confiar em quem seria cobrado. Avance o período acima para ver todo mundo voltar
        a aparecer como &ldquo;não marcou&rdquo;.
      </p>
    </div>
  );
}
