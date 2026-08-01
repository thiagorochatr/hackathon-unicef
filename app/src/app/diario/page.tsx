"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

interface Evento {
  id: number;
  ts: number;
  camada: "fha" | "zk" | "oprf" | "cadeia" | "app";
  acao: string;
  detalhes?: Record<string, string | number>;
  assinatura?: string;
}

const CAMADA: Record<
  Evento["camada"],
  { nome: string; cor: string; oQueProva: string }
> = {
  fha: {
    nome: "FHA",
    cor: "var(--c-saude)",
    oQueProva: "contas feitas sobre envelopes fechados",
  },
  zk: {
    nome: "ZK",
    cor: "var(--c-educacao)",
    oQueProva: "prova de credencial sem revelar quem",
  },
  oprf: {
    nome: "APELIDO",
    cor: "var(--c-assistencia)",
    oQueProva: "consulta sem dizer sobre quem",
  },
  cadeia: {
    nome: "REDE",
    cor: "var(--c-creas)",
    oQueProva: "registro que ninguém consegue apagar",
  },
  app: { nome: "SISTEMA", cor: "var(--texto-3)", oQueProva: "" },
};

const hora = (ts: number) =>
  new Date(ts).toLocaleTimeString("pt-BR", { hour12: false }) +
  "." +
  String(ts % 1000).padStart(3, "0");

export default function TelaDiario() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [filtro, setFiltro] = useState<Evento["camada"] | null>(null);
  const [seguindo, setSeguindo] = useState(true);
  const ultimo = useRef(0);
  const fim = useRef<HTMLDivElement>(null);

  const buscar = useCallback(async () => {
    const r = await fetch(`/api/diario?desde=${ultimo.current}`);
    const d = await r.json();
    if (!d.eventos?.length) return;
    ultimo.current = d.ultimo;
    setEventos((atuais) => [...atuais, ...d.eventos].slice(-400));
  }, []);

  useEffect(() => {
    let vivo = true;
    const laco = async () => {
      while (vivo) {
        try {
          await buscar();
        } catch {
          // servidor reiniciando; a próxima volta resolve
        }
        await new Promise((r) => setTimeout(r, 700));
      }
    };
    void laco();
    return () => {
      vivo = false;
    };
  }, [buscar]);

  useEffect(() => {
    if (seguindo) fim.current?.scrollIntoView({ behavior: "smooth" });
  }, [eventos, seguindo]);

  const mostrados = filtro ? eventos.filter((e) => e.camada === filtro) : eventos;

  async function zerar() {
    await fetch("/api/diario", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ limpar: true }),
    });
    ultimo.current = 0;
    setEventos([]);
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="rotulo">Diário do sistema</p>
        <h1 className="text-2xl font-semibold tracking-tight">
          O que a criptografia está fazendo, agora.
        </h1>
        <p className="max-w-3xl text-sm text-[var(--texto-2)]">
          É fácil escrever num slide que somamos sem abrir. Esta tela mostra
          acontecendo: o envelope sendo lacrado, a soma feita sem chave nenhuma, a
          comparação dentro do envelope e o comitê recebendo{" "}
          <strong className="text-[var(--texto)]">um único bit</strong>. Deixe aberta
          em outra janela enquanto usa o sistema.
        </p>
      </header>

      {/* O que este diário nunca mostra */}
      <section className="cartao space-y-2 border-[color-mix(in_srgb,var(--perigo)_35%,transparent)] p-4">
        <p className="text-xs font-semibold text-[var(--perigo)]">
          O QUE ESTE DIÁRIO NUNCA MOSTRA
        </p>
        <p className="text-sm text-[var(--texto-2)]">
          Identificador de criança · apelido · segredo de quem denuncia · conteúdo de
          envelope · chave secreta.
        </p>
        <p className="rounded-lg bg-[var(--fundo-3)] p-3 text-xs text-[var(--texto-2)]">
          E não é promessa de quem escreveu o código, é impedimento: o diário{" "}
          <strong className="text-[var(--texto)]">
            recusa qualquer sequência longa sem espaço
          </strong>{" "}
          antes de guardar. O que ele registra é frase e número — &ldquo;576.684
          letras&rdquo;, &ldquo;não tem chave secreta&rdquo;, &ldquo;1 bit&rdquo;. Um
          segredo, um apelido ou um envelope não têm essa forma, e são barrados
          inteiros, mesmo os curtos. Um registro que vazasse essas coisas derrubaria
          justamente o que ele existe para demonstrar.
        </p>
      </section>

      {/* Controles */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setFiltro(null)}
          className="botao !px-3 !py-1.5 text-xs"
          style={{ borderColor: filtro === null ? "var(--texto)" : undefined }}
        >
          tudo ({eventos.length})
        </button>
        {(Object.keys(CAMADA) as Evento["camada"][]).map((c) => {
          const n = eventos.filter((e) => e.camada === c).length;
          return (
            <button
              key={c}
              onClick={() => setFiltro(filtro === c ? null : c)}
              className="botao !px-3 !py-1.5 text-xs"
              style={{ borderColor: filtro === c ? CAMADA[c].cor : undefined }}
            >
              <span style={{ color: CAMADA[c].cor }}>{CAMADA[c].nome}</span> ({n})
            </button>
          );
        })}
        <span className="flex-1" />
        <label className="flex items-center gap-2 text-xs text-[var(--texto-2)]">
          <input
            type="checkbox"
            checked={seguindo}
            onChange={(e) => setSeguindo(e.target.checked)}
          />
          acompanhar o fim
        </label>
        <button onClick={zerar} className="botao !px-3 !py-1.5 text-xs">
          zerar
        </button>
      </div>

      {/* O diário */}
      <section className="space-y-1.5">
        {mostrados.length === 0 ? (
          <div className="cartao p-6 text-sm text-[var(--texto-2)]">
            Nada ainda. Abra o{" "}
            <Link href="/denuncia" className="underline">
              sinal protegido
            </Link>{" "}
            ou o{" "}
            <Link href="/cruzamento" className="underline">
              cruzamento
            </Link>{" "}
            em outra janela — o que acontecer lá aparece aqui.
          </div>
        ) : (
          mostrados.map((e) => (
            <div
              key={e.id}
              className="cartao p-3"
              style={{ borderLeft: `3px solid ${CAMADA[e.camada].cor}` }}
            >
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="font-mono text-[0.6875rem] text-[var(--texto-3)]">
                  {hora(e.ts)}
                </span>
                <span
                  className="text-[0.625rem] font-semibold tracking-wide"
                  style={{ color: CAMADA[e.camada].cor }}
                >
                  {CAMADA[e.camada].nome}
                </span>
                <span className="text-sm font-medium">{e.acao}</span>
              </div>

              {e.detalhes && (
                <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5">
                  {Object.entries(e.detalhes).map(([k, v]) => (
                    <span key={k} className="text-xs text-[var(--texto-2)]">
                      <span className="text-[var(--texto-3)]">{k}:</span>{" "}
                      <span className="font-mono">{String(v)}</span>
                    </span>
                  ))}
                </div>
              )}

              {e.assinatura && (
                <a
                  href={`https://explorer.solana.com/tx/${e.assinatura}?cluster=devnet`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1.5 inline-block font-mono text-[0.6875rem] underline"
                  style={{ color: CAMADA.cadeia.cor }}
                >
                  {e.assinatura.slice(0, 20)}… ver na rede
                </a>
              )}
            </div>
          ))
        )}
        <div ref={fim} />
      </section>

      <p className="border-t border-[var(--borda)] pt-6 text-xs text-[var(--texto-3)]">
        O diário vive na memória do servidor e some quando ele reinicia — é para
        acompanhar, não para guardar. O que precisa durar já está na rede, e cada
        linha marcada com assinatura leva direto para lá.
      </p>
    </div>
  );
}
