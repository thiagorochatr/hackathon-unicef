"use client";

import { useState } from "react";
import { ESTADO_ROTULO } from "@/lib/tipos";
import { LINK_TX, usePainelDoOrgao } from "../_lib/custodia";
import { CLASSES, MP, PROCEDIMENTOS } from "./dados";

export default function Promotoria() {
  const p = usePainelDoOrgao("mp");
  const { caso } = p;
  const [classe, setClasse] = useState(CLASSES[1]);

  /** O caso subiu sozinho: é o estado que este portal existe para mostrar. */
  const subiuSozinho = caso?.estado === "Escalado";

  /** A última transação da trilha é a que trouxe o caso até aqui. */
  const entrada = subiuSozinho ? caso.registros?.at(-1) : undefined;

  return (
    <div data-orgao="mp">
      <div className="barra-gov">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-white/70 text-[0.625rem] font-bold">
            MP
          </div>
          <div className="leading-tight">
            <p className="text-[0.6875rem] opacity-80">{MP.instituicao}</p>
            <p className="text-sm font-bold">{MP.promotoria}</p>
          </div>
          <span className="ml-auto text-[0.6875rem] opacity-80">
            {MP.sistema} · {MP.sigla}
          </span>
        </div>
      </div>

      <div className="border-b border-[var(--borda)] bg-[var(--fundo-2)]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-1 px-4 py-1.5 text-[0.6875rem] text-[var(--texto-2)]">
          <span>{MP.vara}</span>
          <span>
            Usuário: <strong className="text-[var(--texto)]">{MP.promotor}</strong>
          </span>
          <span className="ml-auto">Sair</span>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 py-5">
        <p className="mb-3 text-[0.6875rem] text-[var(--texto-2)]">
          Início › Procedimentos › Entradas
        </p>

        {/* A entrada sem remetente */}
        {subiuSozinho && (
          <div
            className="caixa-gov mb-4"
            style={{ borderColor: "var(--acento)", borderWidth: 2 }}
          >
            <p className="titulo-secao">Entrada automática — sem remetente</p>
            <div className="space-y-2 p-3">
              <p className="text-[0.875rem] font-bold">
                Ninguém encaminhou este caso ao Ministério Público.
              </p>
              <p className="text-[0.8125rem] text-[var(--texto-2)]">
                Não houve ofício, representação nem denúncia. O prazo do órgão
                responsável venceu, e a regra que faz o caso subir está no programa da
                rede — não na decisão de um servidor, não na lembrança de uma chefia.{" "}
                <strong className="text-[var(--texto)]">
                  Ficar parado foi o que trouxe o caso até aqui.
                </strong>
              </p>
              <p className="text-[0.75rem] text-[var(--texto-2)]">
                É a inversão que interessa: hoje esta promotoria só sabe do que lhe
                contam, e o caso que ninguém conta é o caso que não existe. O silêncio
                deixou de ser uma saída.
              </p>
              {/* A afirmação forte precisa ser conferível, e é: a instrução que
                  escala não tem conta de instituição nenhuma entre as que assina —
                  só quem paga a taxa. Por isso o link abre a transação em si. */}
              {entrada && (
                <p className="text-[0.75rem] text-[var(--texto-2)]">
                  Nenhum órgão assinou a transação que trouxe o caso até aqui: ela tem um
                  signatário só, que é quem pagou a taxa da rede.{" "}
                  <a
                    href={LINK_TX(entrada.assinatura)}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono underline"
                  >
                    {entrada.assinatura.slice(0, 24)}…
                  </a>
                </p>
              )}
              <a
                href={caso.linkConta}
                target="_blank"
                rel="noreferrer"
                className="inline-block text-[0.75rem] underline"
              >
                Conferir a conta na rede pública, sem pedir acesso a sistema nenhum
              </a>
            </div>
          </div>
        )}

        <div className="caixa-gov mb-4">
          <p className="titulo-secao">Procedimentos — {MP.vara}</p>
          <div className="overflow-x-auto p-3">
            <table className="tabela-gov">
              <thead>
                <tr>
                  <th className="w-40">Número</th>
                  <th className="w-52">Classe</th>
                  <th className="min-w-[16rem]">Origem</th>
                  <th className="w-28">Autuação</th>
                  <th className="min-w-[12rem]">Situação</th>
                </tr>
              </thead>
              <tbody>
                {caso && (
                  <tr
                    style={{
                      background: "color-mix(in srgb, var(--acento) 10%, transparent)",
                    }}
                  >
                    <td className="font-mono text-[0.75rem]">
                      {caso.alertaId.slice(0, 16)}…
                    </td>
                    <td className="text-[0.75rem]">
                      {subiuSozinho ? "Entrada automática" : "Acompanhamento da rede"}
                    </td>
                    <td>
                      {subiuSozinho ? (
                        <>
                          Prazo vencido —{" "}
                          <strong className="text-[var(--acento)]">sem remetente</strong>
                          <span className="block text-[0.6875rem] text-[var(--texto-2)]">
                            {caso.eventos} transações na trilha até aqui
                          </span>
                        </>
                      ) : (
                        "Rede de proteção — caso em custódia de outro órgão"
                      )}
                    </td>
                    <td className="font-mono text-[0.75rem]">
                      {new Date(caso.criadoEm).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="text-[0.75rem]">{ESTADO_ROTULO[caso.estado]}</td>
                  </tr>
                )}
                {PROCEDIMENTOS.map((x) => (
                  <tr key={x.numero}>
                    <td className="font-mono text-[0.75rem]">{x.numero}</td>
                    <td className="text-[0.75rem]">{x.classe}</td>
                    <td>{x.origem}</td>
                    <td className="font-mono text-[0.75rem]">{x.autuacao}</td>
                    <td className="text-[0.75rem]">{x.situacao}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="border-t border-[var(--borda)] px-3 py-2 text-[0.6875rem] text-[var(--texto-2)]">
            Todos os procedimentos de baixo têm remetente: alguém decidiu contar. É essa
            dependência que a entrada automática quebra.
          </p>
        </div>

        {!caso ? (
          <div className="caixa-gov">
            <p className="titulo-secao">Nenhuma entrada da rede de proteção</p>
            <p className="p-3 text-[0.8125rem] text-[var(--texto-2)]">
              Um caso chega aqui de duas formas: representado por um órgão, como sempre
              foi, ou sozinho, quando o prazo do responsável vence. A segunda é a que não
              existia.
            </p>
          </div>
        ) : (
          <div className="caixa-gov">
            <p className="titulo-secao">
              Autuação — {caso.alertaId.slice(0, 16)}… · {ESTADO_ROTULO[caso.estado]}
            </p>
            <div className="space-y-3 p-3">
              <div className="rounded border border-[var(--borda)] bg-[var(--fundo-3)] p-2">
                <p className="mb-1 text-[0.6875rem] font-bold text-[var(--texto-2)]">
                  O que a promotoria recebeu
                </p>
                <ul className="space-y-0.5 text-[0.75rem]">
                  <li>Que houve convergência de sinais de setores diferentes.</li>
                  <li>
                    Quem era o responsável e quando o prazo venceu — com a transação que
                    prova cada passo.
                  </li>
                  <li>Que ninguém precisou decidir mandar isto para cá.</li>
                </ul>
                <p className="mt-1.5 text-[0.6875rem] text-[var(--texto-2)]">
                  <strong className="text-[var(--texto)]">
                    Não recebeu nome, endereço, documento nem o que cada setor viu.
                  </strong>{" "}
                  A apuração é a de sempre, com os poderes de sempre. O que mudou foi o
                  que chega à mesa, não o que a promotoria pode fazer.
                </p>
              </div>

              <label className="block">
                <span className="mb-1 block text-[0.6875rem] font-semibold text-[var(--texto-2)]">
                  Classe a instaurar
                </span>
                <select
                  value={classe}
                  onChange={(e) => setClasse(e.target.value)}
                  className="campo-gov"
                >
                  {CLASSES.map((c) => (
                    <option key={c}>{c}</option>
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
                      onClick={() => p.executar("aceitar", () => p.acoes.aceitar("mp"))}
                    >
                      {p.ocupado === "aceitar" ? "confirmando…" : "Receber e autuar"}
                    </button>
                  )}
                  {(p.podeEncerrar || subiuSozinho) && !p.encerrado && (
                    <button
                      className="botao-gov"
                      disabled={p.ocupado !== null}
                      onClick={() => p.executar("desfecho", () => p.acoes.encerrar())}
                    >
                      {p.ocupado === "desfecho"
                        ? "assinando…"
                        : "Instaurar e registrar desfecho"}
                    </button>
                  )}
                  {p.encerrado && (
                    <p className="text-[0.75rem] text-[var(--texto-2)]">
                      Caso encerrado. O desfecho ficou registrado na rede — e é isso que
                      permite ao painel público contar quantos casos terminaram sem
                      ninguém precisar abrir procedimento nenhum.
                    </p>
                  )}
                  {!p.esperandoMeuAceite && !p.podeEncerrar && !subiuSozinho && !p.encerrado && (
                    <p className="text-[0.75rem] text-[var(--texto-2)]">
                      O caso está em custódia de outro órgão. A promotoria enxerga o
                      estado dele — de quem é a bola e até quando — e nada além disso.
                    </p>
                  )}
                </div>
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
        {MP.sistema} {MP.sigla} · sistema de demonstração · nenhuma criança real
      </footer>
    </div>
  );
}
