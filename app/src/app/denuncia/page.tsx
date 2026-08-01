"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { acoes } from "@/lib/store";
import {
  esquecerIdentidade,
  obterIdentidade,
  type IdentidadeLocal,
} from "@/lib/zk/identidade";
import { gerarProva, novoAlertaId, type ProvaGerada } from "@/lib/zk/prova";

interface Grupo {
  endereco: string;
  municipioIbge: number;
  raiz: string;
  membros: number;
  folhas: string[];
  raizRefeita: string | null;
  responsavel: string;
}

interface Envio {
  alertaId: string;
  assinatura: string;
  link: string;
  relayer: string;
}

const curto = (s: string, n = 10) =>
  s.length > n * 2 ? `${s.slice(0, n)}…${s.slice(-n)}` : s;

export default function TelaDenuncia() {
  const [identidade, setIdentidade] = useState<IdentidadeLocal | null>(null);
  const [grupo, setGrupo] = useState<Grupo | null>(null);
  const [periodo, setPeriodo] = useState<number | null>(null);
  const [prova, setProva] = useState<(ProvaGerada & { alertaId: string }) | null>(null);
  const [envio, setEnvio] = useState<Envio | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    // Só busca aqui; quem escreve o estado é o callback. Escrever direto no
    // corpo do efeito faz a tela renderizar em cascata.
    let vivo = true;
    (async () => {
      try {
        const [id, r] = await Promise.all([
          obterIdentidade(),
          fetch("/api/denuncia").then((x) => x.json()),
        ]);
        if (!vivo) return;
        if (r.erro) throw new Error(r.erro);
        setIdentidade(id);
        setGrupo(r.grupo);
        setPeriodo(r.periodo);
      } catch (e) {
        if (vivo) setErro(String(e instanceof Error ? e.message : e));
      }
    })();
    return () => {
      vivo = false;
    };
  }, []);

  const credenciado =
    identidade && grupo ? grupo.folhas.includes(identidade.compromisso) : false;

  const raizConfere =
    grupo?.raizRefeita != null && grupo.raizRefeita === grupo.raiz;

  async function credenciar() {
    if (!identidade) return;
    setOcupado("credenciar");
    setErro(null);
    try {
      const r = await fetch("/api/denuncia", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          acao: "credenciar",
          compromisso: identidade.compromisso,
        }),
      });
      const d = await r.json();
      if (d.erro) throw new Error(d.erro);
      setGrupo(d.grupo);
    } catch (e) {
      setErro(String(e instanceof Error ? e.message : e));
    } finally {
      setOcupado(null);
    }
  }

  async function provar() {
    if (!identidade || !grupo || periodo == null) return;
    setOcupado("provar");
    setErro(null);
    setEnvio(null);
    try {
      // O identificador do caso é sorteado antes de provar, porque ele entra
      // dentro da prova — é o que impede reaproveitá-la para abrir outro caso.
      const alertaId = novoAlertaId();
      const p = await gerarProva(
        identidade.segredo,
        grupo.folhas,
        alertaId,
        grupo.municipioIbge,
        periodo,
      );
      setProva({ ...p, alertaId });
    } catch (e) {
      setErro(String(e instanceof Error ? e.message : e));
    } finally {
      setOcupado(null);
    }
  }

  async function enviar() {
    const p = prova;
    if (!p) return;
    setOcupado("enviar");
    setErro(null);
    try {
      const r = await fetch("/api/denuncia", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          acao: "denunciar",
          alertaId: p.alertaId,
          anulador: p.anulador,
          pontos: p.pontos,
        }),
      });
      const d = await r.json();
      if (d.erro) throw new Error(d.erro);
      setEnvio(d);
      acoes.definirAlerta(d.alertaId);
    } catch (e) {
      setErro(String(e instanceof Error ? e.message : e));
    } finally {
      setOcupado(null);
    }
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="rotulo">Denúncia protegida</p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Provar que pode denunciar, sem dizer quem é.
        </h1>
        <p className="max-w-2xl text-sm text-[var(--texto-2)]">
          A causa mais citada para o professor não denunciar não é falta de lei nem
          desatenção: é medo de retaliação. Aqui ele prova que{" "}
          <strong className="text-[var(--texto)]">
            é um profissional credenciado deste município
          </strong>{" "}
          — o que faz a denúncia valer — sem que ninguém descubra{" "}
          <strong className="text-[var(--texto)]">qual</strong> deles é.
        </p>
      </header>

      {erro && (
        <div className="cartao border-[var(--perigo)] p-4 text-sm text-[var(--perigo)]">
          {erro}
        </div>
      )}

      {/* 1 — a identidade */}
      <section className="space-y-3">
        <h2 className="rotulo">1 · Sua identidade — só existe neste aparelho</h2>
        <div className="cartao space-y-3 p-5">
          {identidade ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-[var(--texto-3)]">
                    Segredo — nunca sai daqui
                  </p>
                  <p className="mt-1 break-all font-mono text-xs text-[var(--perigo)]">
                    {curto(identidade.segredo, 8)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[var(--texto-3)]">
                    Compromisso — público, entra na lista
                  </p>
                  <p className="mt-1 break-all font-mono text-xs text-[var(--texto-2)]">
                    {curto(identidade.compromisso, 12)}
                  </p>
                </div>
              </div>
              <p className="rounded-lg bg-[var(--fundo-3)] p-3 text-xs text-[var(--texto-2)]">
                O compromisso não permite voltar ao segredo. É por isso que dá para
                publicar a lista de credenciados sem expor ninguém.
              </p>
              <button
                onClick={() => {
                  esquecerIdentidade();
                  setProva(null);
                  setEnvio(null);
                  obterIdentidade().then(setIdentidade);
                }}
                className="text-xs text-[var(--texto-3)] underline"
              >
                Gerar outra identidade
              </button>
            </>
          ) : (
            <p className="text-sm text-[var(--texto-2)]">Criando identidade…</p>
          )}
        </div>
      </section>

      {/* 2 — o grupo */}
      <section className="space-y-3">
        <h2 className="rotulo">
          2 · A lista de credenciados — {grupo?.membros ?? "…"} no município
        </h2>
        <div className="cartao space-y-3 p-5">
          {grupo ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-[var(--texto-3)]">Raiz publicada na rede</p>
                  <p className="mt-1 break-all font-mono text-xs text-[var(--texto-2)]">
                    {curto(grupo.raiz, 12)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[var(--texto-3)]">
                    Raiz refeita a partir das folhas da cadeia
                  </p>
                  <p
                    className="mt-1 break-all font-mono text-xs"
                    style={{ color: raizConfere ? "var(--ok)" : "var(--alerta)" }}
                  >
                    {grupo.raizRefeita ? curto(grupo.raizRefeita, 12) : "—"}
                    {raizConfere && " ✓"}
                  </p>
                </div>
              </div>
              <p className="rounded-lg bg-[var(--fundo-3)] p-3 text-xs text-[var(--texto-2)]">
                As duas raízes acima foram calculadas de formas diferentes: uma está
                gravada na rede, a outra foi refeita agora lendo as folhas dos eventos
                de credenciamento. Baterem significa que ninguém foi enfiado na lista
                às escondidas — e{" "}
                <strong className="text-[var(--texto)]">
                  qualquer pessoa faz essa conferência
                </strong>
                , sem pedir acesso a sistema nenhum.
              </p>

              {credenciado ? (
                <p className="text-sm" style={{ color: "var(--ok)" }}>
                  Você está na lista.
                </p>
              ) : (
                <div className="space-y-2">
                  <button
                    onClick={credenciar}
                    disabled={ocupado != null}
                    className="botao"
                  >
                    {ocupado === "credenciar" ? "credenciando…" : "Entrar na lista"}
                  </button>
                  <p className="text-xs text-[var(--texto-3)]">
                    Nesta demonstração basta pedir. Num sistema de verdade quem
                    credencia é o setor de pessoal da instituição — criptografia nenhuma
                    tem como saber se alguém é mesmo professor.
                  </p>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-[var(--texto-2)]">Lendo a lista da rede…</p>
          )}
        </div>
      </section>

      {/* 3 — a prova */}
      <section className="space-y-3">
        <h2 className="rotulo">3 · A prova — gerada aqui, no seu navegador</h2>
        <div className="cartao space-y-3 p-5">
          <button
            onClick={provar}
            disabled={!credenciado || ocupado != null}
            className="botao"
          >
            {ocupado === "provar" ? "gerando a prova…" : "Gerar a prova"}
          </button>
          {!credenciado && (
            <p className="text-xs text-[var(--texto-3)]">
              Entre na lista primeiro. Sem estar nela, não há o que provar.
            </p>
          )}

          {prova && (
            <>
              <p className="text-sm">
                Prova gerada em{" "}
                <strong className="text-[var(--ok)]">{prova.ms} ms</strong>, nesta
                máquina. O segredo não saiu daqui.
              </p>
              <div>
                <p className="text-xs text-[var(--texto-3)]">
                  A prova — 8 números, 256 bytes ao todo
                </p>
                <pre className="mt-1 max-h-40 overflow-auto rounded-lg bg-[var(--fundo-3)] p-3 font-mono text-[0.625rem] leading-relaxed text-[var(--texto-2)]">
                  {prova.pontos.join("\n")}
                </pre>
              </div>
              <div>
                <p className="text-xs text-[var(--texto-3)]">
                  Anulador — impede a mesma pessoa de denunciar duas vezes no mês, sem
                  revelar quem ela é
                </p>
                <p className="mt-1 break-all font-mono text-xs text-[var(--texto-2)]">
                  {curto(prova.anulador, 16)}
                </p>
              </div>
            </>
          )}
        </div>
      </section>

      {/* 4 — o envio */}
      <section className="space-y-3">
        <h2 className="rotulo">4 · O envio — e quem assinou</h2>
        <div className="cartao space-y-3 p-5">
          <button
            onClick={enviar}
            disabled={!prova || ocupado != null}
            className="botao"
          >
            {ocupado === "enviar" ? "enviando…" : "Enviar a denúncia"}
          </button>
          <p className="text-xs text-[var(--texto-3)]">
            A rede exige que alguém pague a taxa. Se fosse você, sua carteira ficaria
            ligada à denúncia para sempre. Por isso quem paga é outra pessoa — e ela
            não faz ideia de quem gerou a prova que está repassando.
          </p>

          {envio && (
            <div className="space-y-2 border-t border-[var(--borda)] pt-3">
              <p className="text-sm" style={{ color: "var(--ok)" }}>
                O caso existe, com responsável e prazo correndo.
              </p>
              <p className="text-xs text-[var(--texto-2)]">
                Único signatário da transação:{" "}
                <span className="font-mono">{curto(envio.relayer, 8)}</span> — quem
                pagou a taxa.{" "}
                <strong className="text-[var(--texto)]">
                  Nenhum órgão assinou, e você também não.
                </strong>{" "}
                Quem autorizou a abertura foi a prova.
              </p>
              <div className="flex flex-wrap gap-3 text-sm">
                <a
                  href={envio.link}
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  ver a transação no explorador
                </a>
                <Link href="/caso" className="underline">
                  acompanhar o caso
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      <p className="border-t border-[var(--borda)] pt-6 text-xs text-[var(--texto-3)]">
        O que esta tela ainda não resolve, e está dito por inteiro em{" "}
        <Link href="/estado" className="underline">
          estado do protótipo
        </Link>
        : o grupo aqui é pequeno, e anonimato real precisa de milhares de pessoas —
        criptografia não conserta conjunto pequeno. E quem repassa a denúncia enxerga
        o endereço de rede de quem chamou.
      </p>
    </div>
  );
}
