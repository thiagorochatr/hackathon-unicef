"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { Relogio, useAgora } from "@/components/Relogio";
import { acoes } from "@/lib/store";
import { useCaso } from "@/lib/useCaso";
import { ESTADO_ROTULO, PAPEIS, PAPEL, type Papel } from "@/lib/tipos";
import { SeletorPrazo } from "@/components/SeletorPrazo";
import { ContaNaRede } from "@/components/ContaNaRede";

const LINK_TX = (a: string) => `https://explorer.solana.com/tx/${a}?cluster=devnet`;

export default function TelaCaso() {
  const agora = useAgora();
  const { caso, recarregar, alertaId } = useCaso();
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [comoQuem, setComoQuem] = useState<Papel>("creas");

  async function executar(nome: string, fn: () => Promise<unknown>) {
    setOcupado(nome);
    setErro(null);
    try {
      await fn();
      await recarregar();
    } catch (e) {
      setErro(String(e instanceof Error ? e.message : e));
    } finally {
      setOcupado(null);
    }
  }

  const aoVencer = useCallback(() => {
    // Vencido o prazo, qualquer um pode mandar o caso ao MP. Aqui a própria
    // tela faz isso sozinha, para mostrar que não depende de boa vontade.
    if (!caso || caso.estado === "Escalado" || caso.estado === "Encerrado") return;
    if (ocupado) return;
    executar("auto", () => acoes.levarAoMp());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caso?.estado, ocupado]);

  if (!alertaId || !caso) {
    return (
      <div className="cartao p-6 text-sm text-[var(--texto-2)]">
        {alertaId ? (
          <>Lendo o caso na rede…</>
        ) : (
          <>
            Nenhum caso aberto.{" "}
            <Link href="/cruzamento" className="underline">
              Faça o cruzamento
            </Link>{" "}
            para que um alerta crie o caso na Solana.
          </>
        )}
      </div>
    );
  }

  const encerrado = caso.estado === "Encerrado";
  const responsavel = caso.responsavel;
  const podeTransferir =
    responsavel === comoQuem &&
    (caso.estado === "Aberto" || caso.estado === "EmAtendimento");
  const podeAceitar = caso.estado === "PendenteAceite" && caso.pendentePara === comoQuem;
  const podeEncerrar = responsavel === comoQuem && !encerrado;
  const venceu = agora !== null && agora > caso.prazo;

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="rotulo">
          Registro do caso · Solana devnet ·{" "}
          <a href={caso.linkConta} target="_blank" rel="noreferrer" className="underline">
            ver a conta na rede
          </a>
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          O caso nunca fica sem responsável.
        </h1>
        <p className="max-w-2xl text-sm text-[var(--texto-2)]">
          Passar o caso adiante tem dois passos. Enquanto o outro órgão não
          confirma que recebeu, o caso continua sendo de quem passou — e o prazo
          continua correndo contra ele. Tudo abaixo é lido da rede, não da tela.
        </p>
      </header>

      <div className="cartao p-4">
        <SeletorPrazo compacto />
        <p className="mt-1.5 text-xs text-[var(--texto-3)]">
          Muda o prazo que passa a valer quando um órgão confirmar que recebeu. Não
          altera o prazo que já está correndo.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="rotulo">Você é</span>
        {PAPEIS.map((p) => (
          <button
            key={p}
            onClick={() => setComoQuem(p)}
            className={`botao !px-3 !py-1.5 text-xs ${comoQuem === p ? "botao-forte" : ""}`}
          >
            {PAPEL[p].sigla}
          </button>
        ))}
      </div>

      <section
        className="cartao space-y-5 p-6"
        style={{
          borderColor:
            caso.estado === "Escalado"
              ? "var(--perigo)"
              : caso.estado === "PendenteAceite"
                ? "var(--alerta)"
                : "var(--borda)",
        }}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="rotulo">Responsável agora</p>
            <div className="mt-1 flex items-center gap-2">
              <span
                className="h-3 w-3 rounded-full"
                style={{ background: responsavel ? PAPEL[responsavel].cor : "#666" }}
              />
              <span className="text-xl font-semibold">
                {responsavel ? PAPEL[responsavel].sigla : "chave desconhecida"}
              </span>
            </div>
            <p className="mt-1 text-xs text-[var(--texto-2)]">
              {caso.agenteIdentificacao ?? ""}
            </p>
            <p className="cifra mt-1">{caso.responsavelChave}</p>
          </div>

          <div className="text-right">
            <p className="rotulo">Prazo</p>
            <div className="mt-1">
              <Relogio prazo={caso.prazo} pausado={encerrado} aoVencer={aoVencer} />
            </div>
            <p className="mt-1 text-xs text-[var(--texto-2)]">
              {ESTADO_ROTULO[caso.estado]}
            </p>
          </div>
        </div>

        {caso.estado === "PendenteAceite" && caso.pendentePara && (
          <div className="rounded-lg border border-[var(--alerta)] bg-[color-mix(in_srgb,var(--alerta)_8%,transparent)] p-4">
            <p className="text-sm font-medium text-[var(--alerta)]">
              Passado para {PAPEL[caso.pendentePara].sigla}, mas ainda não aceito
            </p>
            <p className="mt-1 text-xs text-[var(--texto-2)]">
              O responsável <strong>não</strong> mudou. O caso ainda é do{" "}
              {responsavel ? PAPEL[responsavel].sigla : "órgão anterior"} e o prazo
              corre contra ele. Se ninguém aceitar, o caso não some — ele vai para o
              Ministério Público.
            </p>
          </div>
        )}

        {caso.estado === "Escalado" && (
          <div className="rounded-lg border border-[var(--perigo)] bg-[color-mix(in_srgb,var(--perigo)_10%,transparent)] p-4">
            <p className="text-sm font-medium text-[var(--perigo)]">
              O prazo venceu sem ninguém aceitar — o caso foi para o Ministério Público
            </p>
            <p className="mt-1 text-xs text-[var(--texto-2)]">
              Qualquer pessoa pode acionar isso depois que o prazo vence. Nenhum dos
              órgãos envolvidos consegue impedir.
            </p>
          </div>
        )}

        <dl className="grid gap-3 border-t border-[var(--borda)] pt-4 text-xs sm:grid-cols-4">
          <div>
            <dt className="rotulo">Número do alerta</dt>
            <dd className="cifra mt-1">{caso.alertaId.slice(0, 24)}…</dd>
          </div>
          <div>
            <dt className="rotulo">Selo da trilha</dt>
            <dd className="cifra mt-1">{caso.trilhaHash.slice(0, 24)}…</dd>
          </div>
          <div>
            <dt className="rotulo">Passos gravados</dt>
            <dd className="mt-1 font-mono text-sm">{caso.eventos}</dd>
          </div>
          <div>
            <dt className="rotulo">Dado de criança na rede</dt>
            <dd className="mt-1 font-medium text-[var(--ok)]">nenhum, nem cifrado</dd>
          </div>
        </dl>
      </section>

      <section className="space-y-3">
        <h2 className="rotulo">O que {PAPEL[comoQuem].sigla} pode fazer agora</h2>
        {erro && (
          <p className="cartao border-[var(--perigo)] p-3 text-xs text-[var(--perigo)]">
            {erro}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          {podeTransferir &&
            PAPEIS.filter((p) => p !== responsavel).map((p) => (
              <button
                key={p}
                className="botao"
                disabled={Boolean(ocupado)}
                onClick={() => executar(`t-${p}`, () => acoes.transferir(p))}
              >
                {ocupado === `t-${p}` ? "assinando…" : `Passar para ${PAPEL[p].sigla}`}
              </button>
            ))}
          {podeAceitar && (
            <button
              className="botao botao-forte"
              disabled={Boolean(ocupado)}
              onClick={() => executar("aceitar", () => acoes.aceitar(comoQuem))}
            >
              {ocupado === "aceitar" ? "assinando…" : "Confirmar que recebi e assumir"}
            </button>
          )}
          {podeEncerrar && (
            <button
              className="botao"
              disabled={Boolean(ocupado)}
              onClick={() => executar("encerrar", () => acoes.encerrar())}
            >
              {ocupado === "encerrar" ? "assinando…" : "Registrar o desfecho"}
            </button>
          )}
          {!podeTransferir && !podeAceitar && !podeEncerrar && (
            <p className="text-sm text-[var(--texto-2)]">
              {encerrado
                ? "Caso encerrado."
                : `${PAPEL[comoQuem].sigla} não tem o que fazer agora — o caso está com ${responsavel ? PAPEL[responsavel].sigla : "outro órgão"}.`}
            </p>
          )}
        </div>

        {!encerrado && caso.estado !== "Escalado" && (
          <div className="cartao p-4">
            <p className="text-xs text-[var(--texto-2)]">
              <strong className="text-[var(--texto)]">
                Depois do prazo, qualquer pessoa pode agir.
              </strong>{" "}
              Não precisa ser nenhum dos órgãos envolvidos. É isso que impede que o
              caso fique parado por conveniência de quem deveria agir.
            </p>
            <button
              className="botao mt-2 !px-3 !py-1.5 text-xs"
              disabled={Boolean(ocupado) || !venceu}
              onClick={() => executar("mp", () => acoes.levarAoMp())}
            >
              {ocupado === "mp"
                ? "assinando…"
                : venceu
                  ? "Mandar ao Ministério Público"
                  : "Só depois que o prazo vencer"}
            </button>
          </div>
        )}
      </section>

      <ContaNaRede caso={caso} />

      <section className="space-y-3">
        <h2 className="rotulo">
          Trilha na rede — {caso.registros.length} transação(ões)
        </h2>
        <ol className="space-y-2">
          {caso.registros.map((r, i) => (
            <li key={r.assinatura} className="cartao flex flex-wrap gap-3 p-4">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[var(--borda)] text-xs text-[var(--texto-3)]">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <a
                  href={LINK_TX(r.assinatura)}
                  target="_blank"
                  rel="noreferrer"
                  className="cifra !text-[var(--texto-2)] underline"
                >
                  {r.assinatura}
                </a>
                <p className="mt-0.5 text-xs text-[var(--texto-3)]">
                  {r.ts ? new Date(r.ts).toLocaleString("pt-BR") : "confirmando…"}
                  {r.erro && " · falhou"}
                </p>
              </div>
            </li>
          ))}
        </ol>
        <p className="text-xs text-[var(--texto-3)]">
          Cada linha é uma transação real na Solana devnet. Clique para conferir no
          explorador — não é preciso confiar nesta tela.
        </p>
      </section>
    </div>
  );
}
