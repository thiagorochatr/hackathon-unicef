"use client";

import Link from "next/link";
import { useState } from "react";
import { SeletorPrazo } from "@/components/SeletorPrazo";
import { acoes, useEstado } from "@/lib/store";
import { LIMIAR } from "@/lib/fixtures";
import { SETOR } from "@/lib/tipos";
import { cruzarSinais, useSinais, type ResultadoCruzamento } from "@/lib/useSinais";

export default function TelaCruzamento() {
  const estado = useEstado();
  const { sinais } = useSinais();
  const [resultado, setResultado] = useState<ResultadoCruzamento | null>(null);
  const [expandido, setExpandido] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const jaAberto = Boolean(estado.alertaId);

  async function executar() {
    setOcupado(true);
    setErro(null);
    try {
      const r = await cruzarSinais();
      setResultado(r);
      if (r.alerta && !jaAberto) await acoes.abrirCaso();
    } catch (e) {
      setErro(String(e instanceof Error ? e.message : e));
    } finally {
      setOcupado(false);
    }
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="rotulo">Nó de cruzamento</p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Soma os envelopes sem abrir nenhum.
        </h1>
        <p className="max-w-2xl text-sm text-[var(--texto-2)]">
          Este é o pedaço que um banco de dados central não consegue ser. Ele junta os
          sinais sem enxergar um só, e nem sabe de que criança se trata — recebe
          apelidos, não nomes.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="rotulo">Recebidos — {sinais.length} envelope(s)</h2>
        {sinais.length === 0 ? (
          <div className="cartao p-6 text-sm text-[var(--texto-2)]">
            Nenhum sinal chegou ainda.{" "}
            <Link href="/sinal/ubs" className="underline">
              Registre um sinal
            </Link>{" "}
            na UBS ou na escola.
          </div>
        ) : (
          <div className="space-y-2">
            {sinais.map((s) => (
              <div key={s.setor} className="cartao p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: SETOR[s.setor].cor }}
                    />
                    <span className="text-sm font-medium">
                      {SETOR[s.setor].nome}{s.protegido ? " · protegido" : ""}
                    </span>
                    <span className="cifra !text-[var(--texto-3)]">
                      apelido {s.apelido.slice(0, 12)}…
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[0.625rem] text-[var(--texto-3)]">
                      {s.tamanhoTotal.toLocaleString("pt-BR")} letras
                    </span>
                    <button
                      className="text-xs text-[var(--texto-3)] underline"
                      onClick={() =>
                        setExpandido(expandido === s.setor ? null : s.setor)
                      }
                    >
                      {expandido === s.setor ? "recolher" : "ver um pedaço maior"}
                    </button>
                  </div>
                </div>
                <p
                  className={`cifra mt-2 overflow-y-auto ${
                    expandido === s.setor ? "max-h-64" : "max-h-10"
                  }`}
                >
                  {s.pedacoDoEnvelope}…
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="cartao space-y-4 p-5">
        <h2 className="rotulo">Quem faz o quê</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-[var(--borda)] bg-[var(--fundo)] p-3">
            <p className="rotulo">1 · Nó de cruzamento</p>
            <p className="mt-1 text-xs text-[var(--texto-2)]">
              Soma os envelopes fechados. <strong>Não tem a chave.</strong>
            </p>
          </div>
          <div className="rounded-lg border border-[var(--borda)] bg-[var(--fundo)] p-3">
            <p className="rotulo">2 · Comitê</p>
            <p className="mt-1 text-xs text-[var(--texto-2)]">
              Tem a chave. Abre <strong>só a soma</strong> e vê se chegou a {LIMIAR}.
            </p>
          </div>
          <div className="rounded-lg border border-[var(--borda)] bg-[var(--fundo)] p-3">
            <p className="rotulo">3 · Solana</p>
            <p className="mt-1 text-xs text-[var(--texto-2)]">
              Havendo alerta, grava o caso com um responsável e um prazo.
            </p>
          </div>
        </div>

        {!jaAberto && (
          <div className="rounded-lg border border-[var(--borda)] bg-[var(--fundo)] p-4">
            <SeletorPrazo />
          </div>
        )}

        <button
          className="botao botao-forte w-full"
          disabled={sinais.length === 0 || jaAberto || ocupado}
          onClick={executar}
        >
          {jaAberto
            ? "Caso já aberto"
            : ocupado
              ? "somando os envelopes…"
              : "Cruzar os sinais"}
        </button>

        {erro && (
          <p className="cartao border-[var(--perigo)] p-3 text-xs text-[var(--perigo)]">
            {erro}
          </p>
        )}

        {resultado && (
          <div
            className="space-y-3 rounded-lg border p-4"
            style={{
              borderColor: resultado.alerta ? "var(--alerta)" : "var(--borda)",
              background: resultado.alerta
                ? "color-mix(in srgb, var(--alerta) 8%, transparent)"
                : "var(--fundo)",
            }}
          >
            <div>
              <p className="rotulo mb-1">
                A soma, ainda fechada ·{" "}
                {resultado.tamanhoDaSoma.toLocaleString("pt-BR")} letras
              </p>
              <p className="cifra max-h-16 overflow-y-auto">{resultado.pedacoDaSoma}…</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-[color-mix(in_srgb,var(--ok)_40%,transparent)] bg-[var(--fundo-2)] p-3">
                <p className="text-[0.625rem] font-semibold text-[var(--ok)]">
                  ABERTA PELO COMITÊ, QUE TEM A CHAVE
                </p>
                <p className="mt-1 font-mono text-2xl">{resultado.contagem}</p>
                <p className="text-xs text-[var(--texto-2)]">
                  limite para virar alerta: {resultado.limiar}
                </p>
              </div>
              <div className="rounded-lg border border-[color-mix(in_srgb,var(--perigo)_40%,transparent)] bg-[var(--fundo-2)] p-3">
                <p className="text-[0.625rem] font-semibold text-[var(--perigo)]">
                  ABERTA COM OUTRA CHAVE
                </p>
                <p className="mt-1 font-mono text-2xl">
                  {Number.isFinite(resultado.comChaveErrada)
                    ? resultado.comChaveErrada.toLocaleString("pt-BR")
                    : "—"}
                </p>
                <p className="text-xs text-[var(--texto-2)]">
                  a mesma soma, sem sentido nenhum
                </p>
              </div>
            </div>

            <p
              className="text-sm font-semibold"
              style={{ color: resultado.alerta ? "var(--alerta)" : "var(--texto-2)" }}
            >
              {!resultado.alerta
                ? "Abaixo do limite → nenhum alerta, e nada fica registrado"
                : sinais.length === 1
                  ? "Uma denúncia protegida bastou → alerta enviado ao CREAS"
                  : "Os sinais coincidiram → alerta enviado ao CREAS"}
            </p>
            <p className="text-xs text-[var(--texto-3)]">
              {sinais.length === 1
                ? "Um único sinal, e ainda assim o alerta saiu: quem denuncia deliberadamente pesa 2, porque quem vence o medo de denunciar não pode depender da sorte de outro setor ter registrado algo."
                : "Nenhum setor soube o que o outro registrou. O nó somou às cegas."}{" "}
              Só a soma foi aberta — nunca as parcelas.
            </p>
          </div>
        )}

        {jaAberto && (
          <Link href="/caso" className="botao w-full">
            Ir para o caso →
          </Link>
        )}
      </section>

      <p className="text-xs text-[var(--texto-3)]">
        O que ainda falta, dito na cara: nesta versão o comitê descobre{" "}
        <strong>quantos</strong>{" "}
        sinais coincidiram. Na versão completa a comparação
        também acontece dentro do envelope, e só sai um &ldquo;sim&rdquo; ou
        &ldquo;não&rdquo;. E a chave, que hoje está inteira num lugar só, passa a ser
        repartida entre vários órgãos.
      </p>
    </div>
  );
}
