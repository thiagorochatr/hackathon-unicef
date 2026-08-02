"use client";

import { useState } from "react";
import { useAgora } from "@/components/Relogio";
import { ESTADO_ROTULO } from "@/lib/tipos";
import {
  CASOS_NA_TELA,
  faltaPara,
  LINK_TX,
  useEscaladaAutomatica,
  usePainelDoOrgao,
} from "../_lib/custodia";
import { CT, FILA, MEDIDAS } from "./dados";

export default function ConselhoTutelar() {
  const agora = useAgora();
  const p = usePainelDoOrgao("ct");
  const { caso } = p;
  const [medida, setMedida] = useState(MEDIDAS[3]);

  const venceu = caso !== null && agora !== null && agora > caso.prazo;

  // O prazo vence aqui, então é aqui que a escalada precisa acontecer para ser
  // vista. Que seja a própria tela do Conselho a chamar não é contradição: o
  // programa aceita de qualquer chave depois do vencimento, e recusaria de todas
  // antes dele.
  useEscaladaAutomatica(caso, agora, p.ocupado, p.executar);

  return (
    <div data-orgao="ct">
      <div className="barra-gov">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-white/70 text-[0.625rem] font-bold">
            CT
          </div>
          <div className="leading-tight">
            <p className="text-[0.6875rem] opacity-80">{CT.municipio}</p>
            <p className="text-sm font-bold">{CT.orgao}</p>
          </div>
          <span className="ml-auto text-[0.6875rem] opacity-80">
            {CT.sistema} · {CT.sigla}
          </span>
        </div>
      </div>

      <div className="border-b border-[var(--borda)] bg-[var(--fundo-2)]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-1 px-4 py-1.5 text-[0.6875rem] text-[var(--texto-2)]">
          <span>{CT.mandato}</span>
          <span>{CT.plantao}</span>
          <span>
            Usuário: <strong className="text-[var(--texto)]">{CT.conselheiro}</strong>
          </span>
          <span className="ml-auto">Sair</span>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 py-5">
        <p className="mb-3 text-[0.6875rem] text-[var(--texto-2)]">
          Início › Atendimentos › Fila do plantão
        </p>

        {/* O relógio no topo. É a única coisa que a rede muda aqui, e precisa
            ser a primeira coisa que o conselheiro vê. */}
        {caso && !p.encerrado && caso.estado !== "Escalado" && (
          <div
            className="caixa-gov mb-4"
            style={{
              borderColor: venceu ? "var(--perigo)" : "var(--alerta)",
              borderWidth: 2,
            }}
          >
            <div className="flex flex-wrap items-center gap-4 p-3">
              <div>
                <p className="text-[0.6875rem] font-bold text-[var(--texto-2)]">
                  Prazo do caso {caso.alertaId.slice(0, 12)}…
                </p>
                <p
                  className="font-mono text-3xl font-bold"
                  style={{ color: venceu ? "var(--perigo)" : "var(--texto)" }}
                >
                  {faltaPara(caso.prazo, agora)}
                </p>
              </div>
              <p className="flex-1 text-[0.75rem] text-[var(--texto-2)]">
                {venceu ? (
                  <>
                    O prazo venceu.{" "}
                    <strong className="text-[var(--texto)]">
                      O caso vai ao Ministério Público sozinho
                    </strong>{" "}
                    — não depende de o Conselho concordar, nem de alguém lembrar.
                  </>
                ) : (
                  <>
                    Se ninguém assumir até o fim da contagem, este caso vai ao Ministério
                    Público{" "}
                    <strong className="text-[var(--texto)]">sem que ninguém precise agir</strong>
                    . É a única coisa que muda aqui: caso parado deixou de ser caso
                    esquecido.
                  </>
                )}
              </p>
            </div>
          </div>
        )}

        <div className="caixa-gov mb-4">
          <p className="titulo-secao">Fila do plantão — {CT.orgao}</p>
          <div className="overflow-x-auto p-3">
            <table className="tabela-gov">
              <thead>
                <tr>
                  <th className="w-40">Registro</th>
                  <th className="min-w-[18rem]">Origem</th>
                  <th className="w-28">Entrada</th>
                  <th className="min-w-[14rem]">Situação</th>
                </tr>
              </thead>
              <tbody>
                {/* Os casos do Conselho, perguntados à rede. */}
                {(p.casos ?? []).slice(0, CASOS_NA_TELA).map((c) => {
                  const aberto = c.alertaId === p.alertaId;
                  const parado = c.estado === "Encerrado" || c.estado === "Escalado";
                  return (
                    <tr
                      key={c.alertaId}
                      onClick={() => p.escolher(c.alertaId)}
                      style={{
                        cursor: "pointer",
                        background: aberto
                          ? "color-mix(in srgb, var(--acento) 12%, transparent)"
                          : "color-mix(in srgb, var(--acento) 4%, transparent)",
                      }}
                    >
                      <td className="font-mono text-[0.75rem]">
                        {c.alertaId.slice(0, 16)}…
                      </td>
                      <td>
                        Rede de proteção — convergência de setores
                        <span className="block text-[0.6875rem] font-bold text-[var(--acento)]">
                          {parado ? "encerrado" : "com prazo em contagem"}
                        </span>
                      </td>
                      <td className="font-mono text-[0.75rem]">
                        {new Date(c.criadoEm).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="text-[0.75rem]">{ESTADO_ROTULO[c.estado]}</td>
                    </tr>
                  );
                })}
                {FILA.map((f) => (
                  <tr key={f.registro}>
                    <td className="font-mono text-[0.75rem]">{f.registro}</td>
                    <td>{f.origem}</td>
                    <td className="font-mono text-[0.75rem]">{f.entrada}</td>
                    <td className="text-[0.75rem]">{f.situacao}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="border-t border-[var(--borda)] px-3 py-2 text-[0.6875rem] text-[var(--texto-2)]">
            Os quatro registros de baixo não têm prazo, e é assim hoje: entram, ficam
            &ldquo;aguardando atendimento&rdquo; e nada acontece se continuarem
            aguardando. Os de cima têm — e a lista deles não veio deste computador,
            veio da rede, que respondeu quais casos são do Conselho.
          </p>
        </div>

        {!caso ? (
          <div className="caixa-gov">
            <p className="titulo-secao">Nenhuma entrada da rede de proteção</p>
            <p className="p-3 text-[0.8125rem] text-[var(--texto-2)]">
              Quando um caso chega pela rede, ele chega com responsável e com relógio. O
              Conselho continua recebendo tudo o mais como sempre recebeu — escola, UBS,
              vizinho, demanda espontânea —, e nada disso muda.
            </p>
          </div>
        ) : (
          <div className="caixa-gov">
            <p className="titulo-secao">
              Atendimento — {caso.alertaId.slice(0, 16)}… ·{" "}
              {ESTADO_ROTULO[caso.estado]}
            </p>
            <div className="space-y-3 p-3">
              <div className="rounded border border-[var(--borda)] bg-[var(--fundo-3)] p-2">
                <p className="text-[0.75rem]">
                  Chegou que houve convergência de setores diferentes sobre a mesma
                  criança.{" "}
                  <strong>Não chegou nome, endereço, nem o que cada setor viu.</strong> O
                  Conselho apura como sempre apurou; o que a rede fez foi dizer que é hora
                  de olhar.
                </p>
              </div>

              {/* A tarefa do CT: aplicar medida. O registro na rede acontece
                  dentro dela, e não num botão separado. */}
              <label className="block">
                <span className="mb-1 block text-[0.6875rem] font-semibold text-[var(--texto-2)]">
                  Medida de proteção a aplicar (ECA, art. 101)
                </span>
                <select
                  value={medida}
                  onChange={(e) => setMedida(e.target.value)}
                  className="campo-gov"
                >
                  {MEDIDAS.map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </label>

              <div className="border-t border-[var(--borda)] pt-3">
                <p className="mb-2 text-[0.6875rem] font-bold text-[var(--texto-2)]">
                  Providências
                </p>
                <div className="flex flex-wrap gap-2">
                  {p.esperandoMeuAceite && (
                    <button
                      className="botao-gov"
                      disabled={p.ocupado !== null}
                      onClick={() => p.executar("aceitar", () => p.acoes.aceitar("ct", caso.alertaId))}
                    >
                      {p.ocupado === "aceitar"
                        ? "confirmando…"
                        : "Confirmar recebimento e assumir o caso"}
                    </button>
                  )}
                  {p.podeTransferir && (
                    <button
                      className="botao-gov-vazado"
                      disabled={p.ocupado !== null}
                      onClick={() => p.executar("t-mp", () => p.acoes.transferir("mp", caso.alertaId))}
                    >
                      {p.ocupado === "t-mp"
                        ? "assinando…"
                        : "Representar ao Ministério Público"}
                    </button>
                  )}
                  {p.podeEncerrar && (
                    <button
                      className="botao-gov"
                      disabled={p.ocupado !== null}
                      onClick={() => p.executar("desfecho", () => p.acoes.encerrar(caso.alertaId))}
                    >
                      {p.ocupado === "desfecho"
                        ? "assinando…"
                        : "Aplicar medida e registrar desfecho"}
                    </button>
                  )}
                  {!p.esperandoMeuAceite && !p.podeTransferir && !p.podeEncerrar && (
                    <p className="text-[0.75rem] text-[var(--texto-2)]">
                      Nada a fazer agora: o caso está com outro órgão, ou já foi
                      encerrado.
                    </p>
                  )}
                </div>
                <p className="mt-2 text-[0.6875rem] text-[var(--texto-2)]">
                  Não existe botão de arquivar, e não existe deixar parado sem
                  consequência. Enquanto o Conselho não confirmar o recebimento, o caso
                  continua sendo de quem passou — e o prazo corre contra quem passou, não
                  contra a criança.
                </p>
              </div>

              {p.erro && (
                <p
                  className="rounded border p-3 text-[0.75rem]"
                  style={{ borderColor: "var(--perigo)", color: "var(--perigo)" }}
                >
                  {p.erro}
                </p>
              )}

              {p.ultimaAssinatura && (
                <p className="text-[0.6875rem] text-[var(--texto-2)]">
                  Última providência registrada na rede:{" "}
                  <a
                    href={LINK_TX(p.ultimaAssinatura)}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono underline"
                  >
                    {p.ultimaAssinatura.slice(0, 20)}…
                  </a>
                </p>
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="mx-auto max-w-6xl px-4 pb-10 pt-2 text-[0.625rem] text-[var(--texto-3)]">
        {CT.sistema} {CT.sigla} · sistema de demonstração · nenhuma criança real
      </footer>
    </div>
  );
}
