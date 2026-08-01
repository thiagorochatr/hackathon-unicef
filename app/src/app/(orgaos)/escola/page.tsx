"use client";

import { useState } from "react";
import { AvisoCanalExterno } from "../_componentes/AvisoCanalExterno";
import {
  ESCOLA,
  LIMITE_FALTAS,
  TIPOS_OCORRENCIA,
  TURMA,
  faltas,
  type Aluno,
} from "./dados";
import { enviarComoEscola, protocolo, type Passo } from "./enviar";

const DIAS = Array.from({ length: 20 }, (_, i) => i + 1);

export default function DiarioDeClasse() {
  const [aberto, setAberto] = useState<Aluno | null>(null);
  const [tipo, setTipo] = useState<string>(TIPOS_OCORRENCIA[1]);
  const [relato, setRelato] = useState(
    "Faltas seguidas sem justificativa. Retraimento em atividades de grupo e recusa a participar. Responsável não atendeu às convocações.",
  );
  const [passos, setPassos] = useState<Passo[]>([]);
  const [enviando, setEnviando] = useState<string | null>(null);
  const [recibo, setRecibo] = useState<{ protocolo: string } | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  function abrir(a: Aluno) {
    setAberto(a);
    setPassos([]);
    setRecibo(null);
    setErro(null);
  }

  async function enviar() {
    setEnviando("escola");
    setPassos([]);
    setErro(null);
    try {
      const avisar = (p: Passo) => setPassos((atuais) => [...atuais, p]);
      // O peso vem do que está sendo dito, não do canal: suspeita de violência
      // é afirmação e pesa 2; os outros tipos são observação e pesam 1.
      await enviarComoEscola(tipo === TIPOS_OCORRENCIA[1] ? 2 : 1, avisar);
      setRecibo({ protocolo: protocolo() });
    } catch (e) {
      setErro(String(e instanceof Error ? e.message : e));
    } finally {
      setEnviando(null);
    }
  }

  return (
    <div data-orgao="escola">
      {/* Cabeçalho de sistema de governo */}
      <div className="barra-gov">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-white/70 text-[0.625rem] font-bold">
            PMS
          </div>
          <div className="leading-tight">
            <p className="text-[0.6875rem] opacity-80">{ESCOLA.rede}</p>
            <p className="text-sm font-bold">{ESCOLA.secretaria}</p>
          </div>
          <span className="ml-auto text-[0.6875rem] opacity-80">
            {ESCOLA.sistema} · {ESCOLA.sigla}
          </span>
        </div>
      </div>

      <div className="border-b border-[var(--borda)] bg-[var(--fundo-2)]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-1 px-4 py-1.5 text-[0.6875rem] text-[var(--texto-2)]">
          <span>
            Unidade: <strong className="text-[var(--texto)]">{ESCOLA.unidade}</strong>
          </span>
          <span>INEP {ESCOLA.inep}</span>
          <span>
            Usuário: <strong className="text-[var(--texto)]">{ESCOLA.professora}</strong>
          </span>
          <span className="ml-auto">Sair</span>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 py-5">
        <p className="mb-3 text-[0.6875rem] text-[var(--texto-2)]">
          Início › Diário de Classe › {ESCOLA.turma} › Frequência
        </p>

        {/* A tarefa: a chamada */}
        <div className="caixa-gov mb-4">
          <p className="titulo-secao">
            Frequência — {ESCOLA.turma} — últimos 20 dias letivos
          </p>
          <div className="overflow-x-auto p-3">
            <table className="tabela-gov">
              <thead>
                <tr>
                  <th className="w-10">Nº</th>
                  <th className="min-w-[15rem]">Aluno</th>
                  {DIAS.map((d) => (
                    <th key={d} className="w-6 text-center font-normal">
                      {d}
                    </th>
                  ))}
                  <th className="w-16 text-center">Faltas</th>
                  <th className="w-32" />
                </tr>
              </thead>
              <tbody>
                {TURMA.map((a) => {
                  const total = faltas(a);
                  const acumulo = total >= LIMITE_FALTAS;
                  return (
                    <tr
                      key={a.n}
                      style={
                        acumulo
                          ? { background: "color-mix(in srgb, var(--perigo) 8%, transparent)" }
                          : undefined
                      }
                    >
                      <td className="text-center">{a.n}</td>
                      <td>
                        {a.nome}
                        {a.observacao && (
                          <span className="block text-[0.6875rem] text-[var(--texto-2)]">
                            {a.observacao}
                          </span>
                        )}
                      </td>
                      {a.chamada.map((c, i) => (
                        <td
                          key={i}
                          className="text-center font-mono text-[0.6875rem]"
                          style={c === "f" ? { color: "var(--perigo)", fontWeight: 700 } : undefined}
                        >
                          {c === "f" ? "F" : "·"}
                        </td>
                      ))}
                      <td
                        className="text-center font-bold"
                        style={acumulo ? { color: "var(--perigo)" } : undefined}
                      >
                        {total}
                      </td>
                      <td>
                        {acumulo && (
                          <button
                            onClick={() => abrir(a)}
                            className="botao-gov w-full !py-1 !text-[0.6875rem]"
                          >
                            Registrar ocorrência
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="border-t border-[var(--borda)] px-3 py-2 text-[0.6875rem] text-[var(--texto-2)]">
            Alunos com {LIMITE_FALTAS} faltas ou mais no período exigem providência da
            unidade, conforme normativa da rede. A escola já vê isso hoje — o que ela
            não sabe é o que os outros setores viram.
          </p>
        </div>

        {/* O registro de ocorrência */}
        {aberto && (
          <div className="caixa-gov">
            <p className="titulo-secao">
              Registro de ocorrência — aluno nº {aberto.n} · {aberto.nome}
            </p>
            <div className="space-y-3 p-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-[0.6875rem] font-semibold text-[var(--texto-2)]">
                    Tipo de ocorrência
                  </span>
                  <select
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value)}
                    className="campo-gov"
                  >
                    {TIPOS_OCORRENCIA.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-[0.6875rem] font-semibold text-[var(--texto-2)]">
                    Data do registro
                  </span>
                  <input
                    className="campo-gov"
                    value={new Date().toLocaleDateString("pt-BR")}
                    readOnly
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-1 block text-[0.6875rem] font-semibold text-[var(--texto-2)]">
                  Relato
                </span>
                <textarea
                  value={relato}
                  onChange={(e) => setRelato(e.target.value)}
                  rows={3}
                  className="campo-gov"
                />
              </label>

              {/* O envio em nome da unidade */}
              {!recibo && (
                <div className="border-t border-[var(--borda)] pt-3">
                  <button
                    onClick={enviar}
                    disabled={enviando != null}
                    className="botao-gov"
                  >
                    {enviando ? "enviando…" : "Registrar em nome da unidade"}
                  </button>
                  <p className="mt-2 text-[0.6875rem] text-[var(--texto-2)]">
                    O encaminhamento sai assinado pela escola, como a lei já obriga.
                    Fica registrado quem lançou, e fica provado que a unidade avisou.
                  </p>
                </div>
              )}

              <AvisoCanalExterno
                motivo={
                  "De quem o professor tem medo é, muitas vezes, da própria direção — " +
                  "e é a direção que manda neste software. É por isso que a escola não " +
                  "tem como saber que você usou o canal."
                }
              />

              {passos.length > 0 && (
                <div className="space-y-1 rounded border border-[var(--borda)] bg-[var(--fundo-3)] p-3">
                  {passos.map((p, i) => (
                    <p key={i} className="text-[0.75rem]">
                      <span className="mr-1.5 font-mono text-[var(--texto-3)]">
                        {i + 1}.
                      </span>
                      {p.texto}
                      {p.detalhe && (
                        <span className="block pl-5 text-[0.6875rem] text-[var(--texto-2)]">
                          {p.detalhe}
                        </span>
                      )}
                    </p>
                  ))}
                </div>
              )}

              {erro && (
                <p className="rounded border p-3 text-[0.75rem]" style={{ borderColor: "var(--perigo)", color: "var(--perigo)" }}>
                  {erro}
                </p>
              )}

              {recibo && (
                <div
                  className="rounded border p-3"
                  style={{ borderColor: "var(--ok)", background: "color-mix(in srgb, var(--ok) 7%, transparent)" }}
                >
                  <p className="text-sm font-bold" style={{ color: "var(--ok)" }}>
                    Ocorrência registrada · protocolo {recibo.protocolo}
                  </p>
                  <p className="mt-1 text-[0.75rem] text-[var(--texto-2)]">
                    O encaminhamento saiu em nome da unidade. O que deixou a escola foi
                    um envelope fechado — nem o conteúdo, nem o nome do aluno.
                  </p>
                  <p className="mt-2 text-[0.6875rem] text-[var(--texto-2)]">
                    A partir daqui a escola não acompanha mais. Se outro setor tiver
                    visto algo sobre a mesma criança, um caso nasce sozinho, com
                    responsável e prazo.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="mx-auto max-w-6xl px-4 pb-10 pt-2 text-[0.625rem] text-[var(--texto-3)]">
        {ESCOLA.sistema} {ESCOLA.sigla} · sistema de demonstração · nenhuma criança real
      </footer>
    </div>
  );
}
