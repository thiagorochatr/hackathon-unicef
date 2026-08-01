"use client";

import { useState } from "react";
import { AvisoCanalExterno } from "../_componentes/AvisoCanalExterno";
import {
  CRAS,
  EVOLUCAO,
  FAMILIAS,
  LIMITE_DIAS,
  SITUACOES,
  TIPOS_ATENDIMENTO,
  type Familia,
} from "./dados";
import { numeroDoRegistro, registrarEvolucao, type Passo } from "./enviar";

export default function AcompanhamentoFamiliar() {
  const [aberta, setAberta] = useState<Familia | null>(null);
  const [marcadas, setMarcadas] = useState<string[]>([]);
  const [tipo, setTipo] = useState<string>(TIPOS_ATENDIMENTO[0]);
  const [texto, setTexto] = useState(
    "Visita realizada com contato. Responsável relata sobrecarga e ausência de rede de apoio. " +
      "Criança de 8 anos presente, retraída, com marcas em braço direito atribuídas a queda. " +
      "Recusa de encaminhamento para a UBS no momento da visita.",
  );
  const [passos, setPassos] = useState<Passo[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [registro, setRegistro] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  // O peso é o maior entre as situações marcadas: uma afirmação não é diluída
  // por observações ao lado dela.
  const peso = Math.max(
    0,
    ...SITUACOES.filter((s) => marcadas.includes(s.id)).map((s) => s.peso),
  );

  function abrir(f: Familia) {
    setAberta(f);
    setMarcadas([]);
    setPassos([]);
    setRegistro(null);
    setErro(null);
  }

  function alternar(id: string) {
    setMarcadas((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]));
  }

  async function salvar() {
    if (peso === 0) return;
    setEnviando(true);
    setPassos([]);
    setErro(null);
    try {
      await registrarEvolucao(peso as 1 | 2, (p) => setPassos((a) => [...a, p]));
      setRegistro(numeroDoRegistro());
    } catch (e) {
      setErro(String(e instanceof Error ? e.message : e));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div data-orgao="cras">
      <div className="barra-gov">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-white/70 text-[0.625rem] font-bold">
            SUAS
          </div>
          <div className="leading-tight">
            <p className="text-[0.6875rem] opacity-80">{CRAS.rede}</p>
            <p className="text-sm font-bold">{CRAS.secretaria}</p>
          </div>
          <span className="ml-auto text-[0.6875rem] opacity-80">
            {CRAS.sistema} · {CRAS.sigla}
          </span>
        </div>
      </div>

      <div className="border-b border-[var(--borda)] bg-[var(--fundo-2)]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-1 px-4 py-1.5 text-[0.6875rem] text-[var(--texto-2)]">
          <span>
            Unidade: <strong className="text-[var(--texto)]">{CRAS.unidade}</strong>
          </span>
          <span>{CRAS.territorio}</span>
          <span>
            Usuário: <strong className="text-[var(--texto)]">{CRAS.tecnica}</strong>
          </span>
          <span className="ml-auto">Sair</span>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 py-5">
        <p className="mb-3 text-[0.6875rem] text-[var(--texto-2)]">
          Início › PAIF › Famílias referenciadas
        </p>

        {/* A tarefa: as famílias em acompanhamento */}
        <div className="caixa-gov mb-4">
          <p className="titulo-secao">
            Famílias referenciadas em acompanhamento — {CRAS.territorio}
          </p>
          <div className="overflow-x-auto p-3">
            <table className="tabela-gov">
              <thead>
                <tr>
                  <th className="w-20">Código</th>
                  <th className="min-w-[12rem]">Responsável familiar</th>
                  <th className="w-24">Composição</th>
                  <th className="w-24 text-center">Crianças</th>
                  <th className="w-16">Quadra</th>
                  <th className="w-28">Último atend.</th>
                  <th className="w-20 text-center">Dias</th>
                  <th className="min-w-[14rem]">Situação</th>
                  <th className="w-32" />
                </tr>
              </thead>
              <tbody>
                {FAMILIAS.map((f) => {
                  const atraso = f.diasSemContato >= LIMITE_DIAS;
                  return (
                    <tr
                      key={f.codigo}
                      style={
                        atraso
                          ? {
                              background:
                                "color-mix(in srgb, var(--perigo) 8%, transparent)",
                            }
                          : undefined
                      }
                    >
                      <td className="font-mono text-[0.75rem]">{f.codigo}</td>
                      <td>{f.responsavel}</td>
                      <td>{f.composicao}</td>
                      <td className="text-center">{f.criancas}</td>
                      <td>{f.territorio}</td>
                      <td className="font-mono text-[0.75rem]">{f.ultimoAtendimento}</td>
                      <td
                        className="text-center font-bold"
                        style={atraso ? { color: "var(--perigo)" } : undefined}
                      >
                        {f.diasSemContato}
                      </td>
                      <td className="text-[0.75rem]">{f.situacao}</td>
                      <td>
                        {atraso && (
                          <button
                            onClick={() => abrir(f)}
                            className="botao-gov w-full !py-1 !text-[0.6875rem]"
                          >
                            Registrar evolução
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
            Acompanhamento sem contato há {LIMITE_DIAS} dias ou mais exige busca ativa. O
            CRAS já vê isso hoje — o que ele não sabe é o que os outros setores viram sobre
            as crianças destas famílias.
          </p>
        </div>

        {/* O registro de evolução */}
        {aberta && (
          <div className="caixa-gov">
            <p className="titulo-secao">
              Registro de evolução — família {aberta.codigo} · {aberta.responsavel}
            </p>
            <div className="space-y-3 p-3">
              {/* O que o CRAS já sabe sozinho */}
              <div className="rounded border border-[var(--borda)] bg-[var(--fundo-3)] p-2">
                <p className="mb-1 text-[0.6875rem] font-bold text-[var(--texto-2)]">
                  Evolução anterior do acompanhamento
                </p>
                {EVOLUCAO.map((e, i) => (
                  <p key={i} className="text-[0.75rem]">
                    <span className="mr-2 font-mono text-[var(--texto-3)]">{e.data}</span>
                    <span className="mr-1 font-semibold">{e.tipo}:</span>
                    {e.texto}
                  </p>
                ))}
                <p className="mt-1.5 text-[0.6875rem] text-[var(--texto-2)]">
                  O CRAS enxerga só o que passou pelo CRAS. Que a mesma criança faltou à
                  puericultura e foi atendida com lesão na UBS não aparece aqui — e não pode
                  aparecer, porque isso seria um banco único com a vida dela dentro.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-[0.6875rem] font-semibold text-[var(--texto-2)]">
                    Tipo de atendimento
                  </span>
                  <select
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value)}
                    className="campo-gov"
                  >
                    {TIPOS_ATENDIMENTO.map((t) => (
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
                  Evolução
                </span>
                <textarea
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  rows={4}
                  className="campo-gov"
                />
              </label>

              {/* Onde o sinal nasce */}
              <div className="rounded border border-[var(--borda)] p-3">
                <p className="mb-2 text-[0.8125rem] font-bold">Situações identificadas</p>
                <div className="space-y-1.5">
                  {SITUACOES.map((s) => (
                    <label key={s.id} className="flex gap-2 text-[0.8125rem]">
                      <input
                        type="checkbox"
                        checked={marcadas.includes(s.id)}
                        onChange={() => alternar(s.id)}
                        className="mt-0.5"
                      />
                      <span>
                        {s.rotulo}
                        {"ajuda" in s && s.ajuda && (
                          <span className="block text-[0.6875rem] text-[var(--texto-2)]">
                            {s.ajuda}
                          </span>
                        )}
                      </span>
                    </label>
                  ))}
                </div>
                <p className="mt-3 border-t border-[var(--borda)] pt-2 text-[0.6875rem] text-[var(--texto-2)]">
                  A maioria destas marcações fica dentro do CRAS: é o trabalho comum do
                  PAIF, e não é assunto de mais ninguém.{" "}
                  <strong className="text-[var(--texto)]">
                    Só as duas últimas atravessam a fronteira da unidade
                  </strong>{" "}
                  — e mesmo elas atravessam como envelope fechado.
                </p>
              </div>

              {/* O envio */}
              {!registro && (
                <div className="border-t border-[var(--borda)] pt-3">
                  <button
                    onClick={salvar}
                    disabled={enviando || peso === 0}
                    className="botao-gov"
                  >
                    {enviando
                      ? "registrando…"
                      : "Salvar evolução e comunicar em nome da unidade"}
                  </button>
                  <p className="mt-2 text-[0.6875rem] text-[var(--texto-2)]">
                    {peso === 0
                      ? "Sem situação que atravesse a fronteira, a evolução é salva e fica só no prontuário do SUAS — que é o que acontece na maioria dos atendimentos."
                      : "A comunicação sai assinada pelo CRAS. Fica registrado quem lançou, e fica provado que a unidade avisou."}
                  </p>
                </div>
              )}

              <AvisoCanalExterno
                motivo={
                  "Aqui é mais agudo que em qualquer outro lugar: a técnica de referência " +
                  "conhece a família pelo nome, entra na casa e trabalha no mesmo território. " +
                  "Se o aviso sai do sistema onde só ela toca aquela família, não existe " +
                  "aviso anônimo nenhum."
                }
              />

              {passos.length > 0 && (
                <div className="space-y-1 rounded border border-[var(--borda)] bg-[var(--fundo-3)] p-3">
                  {passos.map((p, i) => (
                    <p key={i} className="text-[0.75rem]">
                      <span className="mr-1.5 font-mono text-[var(--texto-3)]">{i + 1}.</span>
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
                <p
                  className="rounded border p-3 text-[0.75rem]"
                  style={{ borderColor: "var(--perigo)", color: "var(--perigo)" }}
                >
                  {erro}
                </p>
              )}

              {registro && (
                <div
                  className="rounded border p-3"
                  style={{
                    borderColor: "var(--ok)",
                    background: "color-mix(in srgb, var(--ok) 7%, transparent)",
                  }}
                >
                  <p className="text-sm font-bold" style={{ color: "var(--ok)" }}>
                    Evolução registrada · {registro}
                  </p>
                  <p className="mt-1 text-[0.75rem] text-[var(--texto-2)]">
                    O que deixou o CRAS foi um envelope cifrado — nem o código familiar, nem
                    o território, nem a evolução.
                  </p>
                  <p className="mt-2 text-[0.6875rem] text-[var(--texto-2)]">
                    A partir daqui o CRAS não acompanha mais. Se outro setor tiver visto algo
                    sobre a mesma criança, um caso nasce sozinho, com responsável e prazo — e
                    ninguém precisou consultar o prontuário de ninguém para isso.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="mx-auto max-w-6xl px-4 pb-10 pt-2 text-[0.625rem] text-[var(--texto-3)]">
        {CRAS.sistema} {CRAS.sigla} · sistema de demonstração · nenhuma família real
      </footer>
    </div>
  );
}
