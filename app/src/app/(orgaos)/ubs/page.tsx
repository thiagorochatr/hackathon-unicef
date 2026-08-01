"use client";

import { useState } from "react";
import { AvisoCanalExterno } from "../_componentes/AvisoCanalExterno";
import {
  CID,
  CORES_RISCO,
  FILA,
  HISTORICO,
  LOCAL_OCORRENCIA,
  NOTIFICACAO,
  PROVAVEL_AUTOR,
  TIPOS_VIOLENCIA,
  UBS,
  type Paciente,
} from "./dados";
import { notificar, numeroDaFicha, type Passo } from "./enviar";

export default function AtencaoBasica() {
  const [aberto, setAberto] = useState<Paciente | null>(null);
  const [notif, setNotif] = useState<string>("nao");
  const [cid, setCid] = useState<string>(CID[0]);
  const [anamnese, setAnamnese] = useState(
    "Criança trazida por responsável, queixa de dor ao movimentar o braço direito. " +
      "Ao exame: equimoses em região dorsal em estágios diferentes de evolução. " +
      "Responsável relata queda da cama; achado não compatível com o mecanismo referido.",
  );
  const [passos, setPassos] = useState<Passo[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [ficha, setFicha] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const escolha = NOTIFICACAO.find((n) => n.valor === notif)!;

  function atender(p: Paciente) {
    setAberto(p);
    setNotif("nao");
    setPassos([]);
    setFicha(null);
    setErro(null);
  }

  async function registrar() {
    if (escolha.peso === 0) return;
    setEnviando(true);
    setPassos([]);
    setErro(null);
    try {
      await notificar(escolha.peso as 1 | 2, (p) => setPassos((a) => [...a, p]));
      setFicha(numeroDaFicha());
    } catch (e) {
      setErro(String(e instanceof Error ? e.message : e));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div data-orgao="ubs">
      <div className="barra-gov">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-white/70 text-[0.625rem] font-bold">
            SMS
          </div>
          <div className="leading-tight">
            <p className="text-[0.6875rem] opacity-80">{UBS.rede}</p>
            <p className="text-sm font-bold">{UBS.secretaria}</p>
          </div>
          <span className="ml-auto text-[0.6875rem] opacity-80">
            {UBS.sistema} · {UBS.sigla}
          </span>
        </div>
      </div>

      <div className="border-b border-[var(--borda)] bg-[var(--fundo-2)]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-1 px-4 py-1.5 text-[0.6875rem] text-[var(--texto-2)]">
          <span>
            Unidade: <strong className="text-[var(--texto)]">{UBS.unidade}</strong>
          </span>
          <span>CNES {UBS.cnes}</span>
          <span>{UBS.equipe}</span>
          <span>
            Usuário: <strong className="text-[var(--texto)]">{UBS.profissional}</strong>
          </span>
          <span className="ml-auto">Sair</span>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 py-5">
        <p className="mb-3 text-[0.6875rem] text-[var(--texto-2)]">
          Início › Atendimento › Fila do dia
        </p>

        {/* A tarefa: a fila */}
        <div className="caixa-gov mb-4">
          <p className="titulo-secao">
            Fila de atendimento — {new Date().toLocaleDateString("pt-BR")} — {UBS.equipe}
          </p>
          <div className="overflow-x-auto p-3">
            <table className="tabela-gov">
              <thead>
                <tr>
                  <th className="w-16">Hora</th>
                  <th className="min-w-[14rem]">Paciente</th>
                  <th className="w-16 text-center">Idade</th>
                  <th className="w-24">Prontuário</th>
                  <th className="min-w-[16rem]">Queixa referida</th>
                  <th className="w-24 text-center">Risco</th>
                  <th className="w-24" />
                </tr>
              </thead>
              <tbody>
                {FILA.map((p) => (
                  <tr key={p.prontuario} style={p.concluido ? { opacity: 0.5 } : undefined}>
                    <td className="font-mono text-[0.75rem]">{p.hora}</td>
                    <td>{p.nome}</td>
                    <td className="text-center">{p.idade}</td>
                    <td className="font-mono text-[0.75rem]">{p.prontuario}</td>
                    <td>{p.queixa}</td>
                    <td className="text-center">
                      <span
                        className="inline-block h-3 w-3 rounded-full align-middle"
                        style={{ background: CORES_RISCO[p.risco] }}
                        title={p.risco}
                      />
                    </td>
                    <td>
                      {p.concluido ? (
                        <span className="text-[0.6875rem] text-[var(--texto-3)]">
                          concluído
                        </span>
                      ) : (
                        <button
                          onClick={() => atender(p)}
                          className="botao-gov w-full !py-1 !text-[0.6875rem]"
                        >
                          Atender
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* O atendimento */}
        {aberto && (
          <div className="caixa-gov">
            <p className="titulo-secao">
              Atendimento — prontuário {aberto.prontuario} · {aberto.nome}
            </p>
            <div className="space-y-3 p-3">
              {/* O que a UBS já sabe sozinha */}
              <div className="rounded border border-[var(--borda)] bg-[var(--fundo-3)] p-2">
                <p className="mb-1 text-[0.6875rem] font-bold text-[var(--texto-2)]">
                  Histórico nesta unidade
                </p>
                {HISTORICO.map((h, i) => (
                  <p key={i} className="text-[0.75rem]">
                    <span className="mr-2 font-mono text-[var(--texto-3)]">{h.data}</span>
                    {h.texto}
                  </p>
                ))}
                <p className="mt-1.5 text-[0.6875rem] text-[var(--texto-2)]">
                  A UBS enxerga só o que aconteceu dentro da UBS. O que a escola e o CRAS
                  viram sobre esta mesma criança não aparece aqui — e não pode aparecer,
                  porque isso seria um banco único com a vida dela dentro.
                </p>
              </div>

              <label className="block">
                <span className="mb-1 block text-[0.6875rem] font-semibold text-[var(--texto-2)]">
                  Anamnese e exame físico
                </span>
                <textarea
                  value={anamnese}
                  onChange={(e) => setAnamnese(e.target.value)}
                  rows={4}
                  className="campo-gov"
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-[0.6875rem] font-semibold text-[var(--texto-2)]">
                    Hipótese diagnóstica (CID-10)
                  </span>
                  <select
                    value={cid}
                    onChange={(e) => setCid(e.target.value)}
                    className="campo-gov"
                  >
                    {CID.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-[0.6875rem] font-semibold text-[var(--texto-2)]">
                    Desfecho do atendimento
                  </span>
                  <select className="campo-gov" defaultValue="Alta com retorno agendado">
                    <option>Alta com retorno agendado</option>
                    <option>Encaminhamento à especialidade</option>
                    <option>Observação na unidade</option>
                  </select>
                </label>
              </div>

              {/* Onde o sinal nasce: a obrigação que já existe */}
              <div className="rounded border border-[var(--borda)] p-3">
                <p className="mb-2 text-[0.8125rem] font-bold">Notificação compulsória</p>
                <div className="space-y-1.5">
                  {NOTIFICACAO.map((n) => (
                    <label key={n.valor} className="flex gap-2 text-[0.8125rem]">
                      <input
                        type="radio"
                        name="notif"
                        checked={notif === n.valor}
                        onChange={() => setNotif(n.valor)}
                        className="mt-0.5"
                      />
                      <span>
                        {n.rotulo}
                        {"ajuda" in n && n.ajuda && (
                          <span className="block text-[0.6875rem] text-[var(--texto-2)]">
                            {n.ajuda}
                          </span>
                        )}
                      </span>
                    </label>
                  ))}
                </div>

                {/* A ficha, só quando a suspeita é declarada */}
                {notif === "violencia" && (
                  <div className="mt-3 border-t border-[var(--borda)] pt-3">
                    <p className="mb-2 text-[0.6875rem] font-bold text-[var(--texto-2)]">
                      Ficha de notificação individual — violência interpessoal
                    </p>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <label className="block">
                        <span className="mb-1 block text-[0.6875rem] text-[var(--texto-2)]">
                          Tipo
                        </span>
                        <select className="campo-gov" defaultValue={TIPOS_VIOLENCIA[0]}>
                          {TIPOS_VIOLENCIA.map((t) => (
                            <option key={t}>{t}</option>
                          ))}
                        </select>
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-[0.6875rem] text-[var(--texto-2)]">
                          Local provável
                        </span>
                        <select className="campo-gov" defaultValue={LOCAL_OCORRENCIA[0]}>
                          {LOCAL_OCORRENCIA.map((t) => (
                            <option key={t}>{t}</option>
                          ))}
                        </select>
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-[0.6875rem] text-[var(--texto-2)]">
                          Provável autor
                        </span>
                        <select className="campo-gov" defaultValue={PROVAVEL_AUTOR[4]}>
                          {PROVAVEL_AUTOR.map((t) => (
                            <option key={t}>{t}</option>
                          ))}
                        </select>
                      </label>
                    </div>
                  </div>
                )}

                <p className="mt-3 border-t border-[var(--borda)] pt-2 text-[0.6875rem] text-[var(--texto-2)]">
                  A comunicação de suspeita de maus-tratos ao Conselho Tutelar já é
                  obrigação: ECA (Lei 8.069/1990), art. 13, com a redação da Lei
                  13.010/2014.{" "}
                  <strong className="text-[var(--texto)]">
                    O que a lei não faz é dizer a esta UBS se mais alguém viu alguma coisa.
                  </strong>{" "}
                  Ela manda avisar, e o aviso cai num vazio. É essa lacuna que a rede ocupa.
                </p>
              </div>

              {/* O envio */}
              {!ficha && (
                <div className="border-t border-[var(--borda)] pt-3">
                  <button
                    onClick={registrar}
                    disabled={enviando || escolha.peso === 0}
                    className="botao-gov"
                  >
                    {enviando
                      ? "registrando…"
                      : escolha.peso === 2
                        ? "Registrar notificação compulsória"
                        : "Registrar sinal de alerta"}
                  </button>
                  <p className="mt-2 text-[0.6875rem] text-[var(--texto-2)]">
                    {escolha.peso === 0
                      ? "Sem enquadramento, o atendimento é encerrado sem qualquer aviso à rede — que é o que acontece na esmagadora maioria das consultas."
                      : "Sai assinado pela unidade, como a lei já obriga. Fica registrado quem notificou, e fica provado que a UBS avisou."}
                  </p>
                </div>
              )}

              <AvisoCanalExterno
                motivo={
                  "Aqui a ficha vai assinada por quem notificou, e chega a quem pode ser " +
                  "a própria família. É por isso que quem teme retaliação precisa de uma " +
                  "saída que não passe pelo sistema da unidade."
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

              {ficha && (
                <div
                  className="rounded border p-3"
                  style={{
                    borderColor: "var(--ok)",
                    background: "color-mix(in srgb, var(--ok) 7%, transparent)",
                  }}
                >
                  <p className="text-sm font-bold" style={{ color: "var(--ok)" }}>
                    Notificação registrada · ficha {ficha}
                  </p>
                  <p className="mt-1 text-[0.75rem] text-[var(--texto-2)]">
                    O que deixou a unidade foi um envelope cifrado — nem o prontuário, nem o
                    nome, nem a queixa.
                  </p>
                  <p className="mt-2 text-[0.6875rem] text-[var(--texto-2)]">
                    A partir daqui a UBS não acompanha mais. Se outro setor tiver visto algo
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
        {UBS.sistema} {UBS.sigla} · sistema de demonstração · nenhum paciente real
      </footer>
    </div>
  );
}
