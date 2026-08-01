"use client";

import { useAgora } from "@/components/Relogio";
import { ESTADO_ROTULO } from "@/lib/tipos";
import {
  faltaPara,
  LINK_TX,
  useEscaladaAutomatica,
  usePainelDoOrgao,
} from "../_lib/custodia";
import { CASOS_ANTERIORES, CREAS, DESTINOS } from "./dados";

export default function ProtecaoEspecial() {
  const agora = useAgora();
  const p = usePainelDoOrgao("creas");
  const { caso } = p;

  // Vale igual aqui: se o prazo vencer com o caso ainda no CREAS, ele sobe.
  useEscaladaAutomatica(caso, agora, p.ocupado, p.executar);

  return (
    <div data-orgao="creas">
      <div className="barra-gov">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-white/70 text-[0.625rem] font-bold">
            PSE
          </div>
          <div className="leading-tight">
            <p className="text-[0.6875rem] opacity-80">{CREAS.rede}</p>
            <p className="text-sm font-bold">{CREAS.secretaria}</p>
          </div>
          <span className="ml-auto text-[0.6875rem] opacity-80">
            {CREAS.sistema} · {CREAS.sigla}
          </span>
        </div>
      </div>

      <div className="border-b border-[var(--borda)] bg-[var(--fundo-2)]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-1 px-4 py-1.5 text-[0.6875rem] text-[var(--texto-2)]">
          <span>
            Unidade: <strong className="text-[var(--texto)]">{CREAS.unidade}</strong>
          </span>
          <span>{CREAS.servico}</span>
          <span>
            Usuário: <strong className="text-[var(--texto)]">{CREAS.tecnica}</strong>
          </span>
          <span className="ml-auto">Sair</span>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 py-5">
        <p className="mb-3 text-[0.6875rem] text-[var(--texto-2)]">
          Início › PAEFI › Casos em acompanhamento
        </p>

        <div className="caixa-gov mb-4">
          <p className="titulo-secao">Casos em acompanhamento — {CREAS.unidade}</p>
          <div className="overflow-x-auto p-3">
            <table className="tabela-gov">
              <thead>
                <tr>
                  <th className="w-40">Protocolo</th>
                  <th className="min-w-[16rem]">Origem</th>
                  <th className="w-28">Entrada</th>
                  <th className="min-w-[12rem]">Situação</th>
                  <th className="w-28 text-center">Prazo</th>
                </tr>
              </thead>
              <tbody>
                {/* O caso do roteiro, lido da rede */}
                {caso && (
                  <tr
                    style={{
                      background: "color-mix(in srgb, var(--acento) 10%, transparent)",
                    }}
                  >
                    <td className="font-mono text-[0.75rem]">
                      {caso.alertaId.slice(0, 16)}…
                    </td>
                    <td>
                      Rede de proteção — alerta automático
                      <span className="block text-[0.6875rem] font-bold text-[var(--acento)]">
                        sem remetente
                      </span>
                    </td>
                    <td className="font-mono text-[0.75rem]">
                      {new Date(caso.criadoEm).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="text-[0.75rem]">{ESTADO_ROTULO[caso.estado]}</td>
                    <td
                      className="text-center font-mono text-[0.75rem] font-bold"
                      style={
                        agora !== null && agora > caso.prazo
                          ? { color: "var(--perigo)" }
                          : undefined
                      }
                    >
                      {p.encerrado ? "—" : faltaPara(caso.prazo, agora)}
                    </td>
                  </tr>
                )}
                {CASOS_ANTERIORES.map((c) => (
                  <tr key={c.protocolo}>
                    <td className="font-mono text-[0.75rem]">{c.protocolo}</td>
                    <td>{c.origem}</td>
                    <td className="font-mono text-[0.75rem]">{c.entrada}</td>
                    <td className="text-[0.75rem]">{c.situacao}</td>
                    <td
                      className="text-center text-[0.75rem]"
                      style={
                        c.prazo === "atrasado" ? { color: "var(--perigo)" } : undefined
                      }
                    >
                      {c.prazo}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {!caso ? (
          <div className="caixa-gov">
            <p className="titulo-secao">Aguardando entrada da rede de proteção</p>
            <p className="p-3 text-[0.8125rem] text-[var(--texto-2)]">
              Nenhum caso novo chegou. Um caso entra aqui quando sinais de setores
              diferentes convergem sobre a mesma criança, ou quando um profissional
              credenciado emite um sinal protegido — e em nenhum dos dois casos alguém
              escolhe o CREAS. O caso já nasce com responsável.
            </p>
          </div>
        ) : (
          <div className="caixa-gov">
            <p className="titulo-secao">
              Caso {caso.alertaId.slice(0, 16)}… · {ESTADO_ROTULO[caso.estado]}
            </p>
            <div className="space-y-3 p-3">
              {/* O ponto que este portal existe para mostrar */}
              <div
                className="rounded border p-3"
                style={{
                  borderColor: "var(--acento)",
                  background: "color-mix(in srgb, var(--acento) 7%, transparent)",
                }}
              >
                <p className="text-[0.8125rem] font-bold">
                  Este caso não foi encaminhado por ninguém.
                </p>
                <p className="mt-1 text-[0.75rem] text-[var(--texto-2)]">
                  Não houve ofício, não houve ligação, não houve reunião de rede. Nenhum
                  profissional decidiu mandar para cá — nem poderia, porque nenhum deles
                  sabia que os outros tinham visto algo. O caso nasceu do encontro dos
                  sinais e já veio com responsável e prazo.{" "}
                  <a
                    href={caso.linkConta}
                    target="_blank"
                    rel="noreferrer"
                    className="underline"
                  >
                    A transação que o abriu tem um signatário só
                  </a>
                  , e não é o CREAS.
                </p>
              </div>

              {/* O que o CREAS recebeu, e o que ele não recebeu */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded border border-[var(--borda)] bg-[var(--fundo-3)] p-2">
                  <p className="mb-1 text-[0.6875rem] font-bold text-[var(--texto-2)]">
                    O que chegou
                  </p>
                  <ul className="space-y-0.5 text-[0.75rem]">
                    <li>Que houve convergência de setores diferentes.</li>
                    <li>Que o CREAS é o responsável, desde já.</li>
                    <li>Até quando: o prazo está correndo.</li>
                  </ul>
                </div>
                <div className="rounded border border-[var(--borda)] bg-[var(--fundo-3)] p-2">
                  <p className="mb-1 text-[0.6875rem] font-bold text-[var(--texto-2)]">
                    O que não chegou
                  </p>
                  <ul className="space-y-0.5 text-[0.75rem]">
                    <li>Nome, endereço ou documento da criança.</li>
                    <li>O que cada setor viu.</li>
                    <li>Qual profissional avisou.</li>
                  </ul>
                  <p className="mt-1 text-[0.6875rem] text-[var(--texto-2)]">
                    Isso a técnica busca pelo caminho de sempre, com a família e a rede.
                    A rede diz que é hora de olhar, não o que olhar.
                  </p>
                </div>
              </div>

              {/* As ações — cada uma é uma transação assinada */}
              <div className="border-t border-[var(--borda)] pt-3">
                <p className="mb-2 text-[0.6875rem] font-bold text-[var(--texto-2)]">
                  Providências
                </p>
                <div className="flex flex-wrap gap-2">
                  {p.esperandoMeuAceite && (
                    <button
                      className="botao-gov"
                      disabled={p.ocupado !== null}
                      onClick={() => p.executar("aceitar", () => p.acoes.aceitar("creas"))}
                    >
                      {p.ocupado === "aceitar"
                        ? "confirmando…"
                        : "Confirmar recebimento do caso"}
                    </button>
                  )}
                  {p.podeTransferir &&
                    DESTINOS.map((d) => (
                      <button
                        key={d.papel}
                        className="botao-gov-vazado"
                        disabled={p.ocupado !== null}
                        title={d.ajuda}
                        onClick={() =>
                          p.executar(`t-${d.papel}`, () => p.acoes.transferir(d.papel))
                        }
                      >
                        {p.ocupado === `t-${d.papel}`
                          ? "assinando…"
                          : `Encaminhar ao ${d.rotulo}`}
                      </button>
                    ))}
                  {p.podeEncerrar && (
                    <button
                      className="botao-gov-vazado"
                      disabled={p.ocupado !== null}
                      onClick={() => p.executar("desfecho", () => p.acoes.encerrar())}
                    >
                      {p.ocupado === "desfecho"
                        ? "assinando…"
                        : "Registrar desfecho e encerrar"}
                    </button>
                  )}
                  {!p.esperandoMeuAceite && !p.podeTransferir && !p.podeEncerrar && (
                    <p className="text-[0.75rem] text-[var(--texto-2)]">
                      Nada a fazer agora: o caso está com outro órgão, ou já foi
                      encerrado. O CREAS continua vendo o estado dele, e é só isso que
                      ele vê.
                    </p>
                  )}
                </div>
                <p className="mt-2 text-[0.6875rem] text-[var(--texto-2)]">
                  Cada providência acima é uma transação assinada pela chave do CREAS.
                  Não existe botão de arquivar: enquanto o prazo corre, ou alguém assume,
                  ou o caso vai sozinho ao Ministério Público.
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
        {CREAS.sistema} {CREAS.sigla} · sistema de demonstração · nenhuma família real
      </footer>
    </div>
  );
}
