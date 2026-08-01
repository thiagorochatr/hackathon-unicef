"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PESO, SETOR, SETORES, type Peso, type Setor } from "@/lib/tipos";
import {
  esquecerIdentidade,
  obterIdentidade,
  type IdentidadeLocal,
} from "@/lib/zk/identidade";
import { gerarProva, type ProvaGerada } from "@/lib/zk/prova";
import { obterApelido } from "@/lib/zk/apelidoCego";
import { CRIANCA_FICTICIA } from "@/lib/fixtures";

interface Grupo {
  endereco: string;
  setor: Setor;
  municipioIbge: number;
  raiz: string;
  membros: number;
  folhas: string[];
  raizRefeita: string | null;
  responsavel: string;
}

interface Registro {
  assinatura: string;
  link: string;
  relayer: string;
}

const BYTE_DO_SETOR: Record<Setor, number> = {
  saude: 1,
  educacao: 2,
  assistencia: 3,
};

const curto = (s: string, n = 10) =>
  s.length > n * 2 ? `${s.slice(0, n)}…${s.slice(-n)}` : s;

export default function TelaDenuncia() {
  const [setor, setSetor] = useState<Setor>("educacao");
  const [peso, setPeso] = useState<Peso>(2);
  const [identidade, setIdentidade] = useState<IdentidadeLocal | null>(null);
  const [grupo, setGrupo] = useState<Grupo | null>(null);
  const [periodo, setPeriodo] = useState<number | null>(null);
  const [prova, setProva] = useState<ProvaGerada | null>(null);
  const [registro, setRegistro] = useState<Registro | null>(null);
  const [emitido, setEmitido] = useState(false);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    // Só busca aqui; quem escreve o estado é o callback. Escrever direto no
    // corpo do efeito faz a tela renderizar em cascata.
    let vivo = true;
    (async () => {
      // O estado entra pelo callback, e não no corpo do efeito: escrever direto
      // ali faz a tela renderizar em cascata.
      setCarregando(true);
      setErro(null);
      try {
        const [id, r] = await Promise.all([
          obterIdentidade(),
          fetch(`/api/denuncia?setor=${setor}`).then((x) => x.json()),
        ]);
        if (!vivo) return;
        if (r.erro) throw new Error(r.erro);
        setIdentidade(id);
        setGrupo(r.grupo);
        setPeriodo(r.periodo);
      } catch (e) {
        if (vivo) setErro(String(e instanceof Error ? e.message : e));
      } finally {
        if (vivo) setCarregando(false);
      }
    })();
    return () => {
      vivo = false;
    };
  }, [setor, tentativa]);

  const credenciado =
    identidade && grupo ? grupo.folhas.includes(identidade.compromisso) : false;
  const raizConfere = grupo?.raizRefeita != null && grupo.raizRefeita === grupo.raiz;

  function limpar() {
    setProva(null);
    setRegistro(null);
    setEmitido(false);
  }

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
          setor,
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
    limpar();
    try {
      // O apelido é calculado aqui, por consulta embaralhada: o identificador da
      // criança não sai deste navegador em momento nenhum.
      const apelido = await obterApelido(CRIANCA_FICTICIA.identificador);
      setProva(
        await gerarProva(
          identidade.segredo,
          grupo.folhas,
          apelido,
          peso,
          grupo.municipioIbge,
          BYTE_DO_SETOR[setor],
          periodo,
        ),
      );
    } catch (e) {
      setErro(String(e instanceof Error ? e.message : e));
    } finally {
      setOcupado(null);
    }
  }

  /** Registra na rede e, com o registro na mão, entrega o envelope ao nó. */
  async function emitir() {
    if (!prova) return;
    setOcupado("emitir");
    setErro(null);
    try {
      const r = await fetch("/api/denuncia", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          acao: "registrar",
          setor,
          peso,
          sal: prova.sal,
          anulador: prova.anulador,
          pontos: prova.pontos,
        }),
      });
      const d = await r.json();
      if (d.erro) throw new Error(d.erro);
      setRegistro(d);

      const c = await fetch("/api/cruzamento", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          acao: "emitirCredenciado",
          setor,
          peso,
          sal: prova.sal,
          assinatura: d.assinatura,
        }),
      });
      const dc = await c.json();
      if (dc.erro) throw new Error(dc.erro);
      setEmitido(true);
    } catch (e) {
      setErro(String(e instanceof Error ? e.message : e));
    } finally {
      setOcupado(null);
    }
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="rotulo">Sinal protegido</p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Emitir um sinal sem dizer quem é.
        </h1>
        <p className="max-w-2xl text-sm text-[var(--texto-2)]">
          A causa mais citada para o professor não avisar não é falta de lei nem
          desatenção: é medo de retaliação. Aqui ele prova que{" "}
          <strong className="text-[var(--texto)]">
            é um profissional credenciado do setor
          </strong>{" "}
          — o que faz o sinal valer — sem que ninguém descubra{" "}
          <strong className="text-[var(--texto)]">qual</strong> deles é. O sinal
          entra no mesmo cruzamento dos outros; o caso continua nascendo de lá.
        </p>
        <div className="max-w-2xl rounded-lg border border-[var(--borda)] bg-[var(--fundo-2)] p-4 text-sm text-[var(--texto-2)]">
          <p className="font-medium text-[var(--texto)]">
            Isto aqui roda fora do sistema do seu órgão. De propósito.
          </p>
          <p className="mt-1">
            A prova nasce no seu aparelho, e o segredo que a gera nunca sai dele.
            Se este canal ficasse dentro do sistema da escola ou da unidade de
            saúde, quem administra aquele sistema poderia registrar que você o
            usou — e é muitas vezes dele que se tem medo.
          </p>
          <p className="mt-2 text-xs text-[var(--texto-3)]">
            A criptografia protege contra a rede e contra quem recebe. Ela não
            protege contra o dono do software onde roda. Por isso o software é
            outro.
          </p>
        </div>
      </header>

      {erro && (
        <div className="cartao border-[var(--perigo)] p-4 text-sm text-[var(--perigo)]">
          {erro}
        </div>
      )}

      {/* 1 — setor */}
      <section className="space-y-3">
        <h2 className="rotulo">1 · De que setor você é</h2>
        <div className="grid gap-2 sm:grid-cols-3">
          {SETORES.map((s) => (
            <button
              key={s}
              onClick={() => {
                setSetor(s);
                limpar();
              }}
              className="cartao p-4 text-left"
              style={{
                borderColor: s === setor ? SETOR[s].cor : "var(--borda)",
              }}
            >
              <p className="text-sm font-medium" style={{ color: SETOR[s].cor }}>
                {SETOR[s].nome}
              </p>
              <p className="mt-1 text-xs text-[var(--texto-2)]">{SETOR[s].quem}</p>
            </button>
          ))}
        </div>
        <p className="rounded-lg bg-[var(--fundo-3)] p-3 text-xs text-[var(--texto-2)]">
          A lista é por setor, e não por escola ou por posto. É o ponto de
          equilíbrio: fina o bastante para o cruzamento saber que setores
          diferentes convergiram, e larga o bastante para você se esconder entre
          todos os profissionais do setor no município.{" "}
          <strong className="text-[var(--texto)]">
            Uma lista por escola diria de qual escola veio
          </strong>{" "}
          — e numa escola com trinta professores isso não seria anonimato nenhum.
        </p>
      </section>

      {/* 2 — identidade */}
      <section className="space-y-3">
        <h2 className="rotulo">2 · Sua identidade — só existe neste aparelho</h2>
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
                  limpar();
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

      {/* 3 — lista */}
      <section className="space-y-3">
        <h2 className="rotulo">
          3 · Credenciados em {SETOR[setor].nome.toLowerCase()} —{" "}
          {grupo?.membros ?? "…"} no município
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
                As duas raízes foram calculadas de formas diferentes: uma está gravada
                na rede, a outra foi refeita agora lendo as folhas dos eventos de
                credenciamento. Baterem significa que ninguém foi enfiado na lista às
                escondidas — e{" "}
                <strong className="text-[var(--texto)]">
                  qualquer pessoa faz essa conferência
                </strong>
                , sem pedir acesso a sistema nenhum.
              </p>

              {credenciado ? (
                <p className="text-sm" style={{ color: "var(--ok)" }}>
                  Você está na lista deste setor.
                </p>
              ) : (
                <div className="space-y-2">
                  <button onClick={credenciar} disabled={ocupado != null} className="botao">
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
          ) : carregando ? (
            <div className="space-y-1">
              <p className="text-sm text-[var(--texto-2)]">
                Refazendo a lista a partir da cadeia…
              </p>
              <p className="text-xs text-[var(--texto-3)]">
                Na primeira vez isto leva até um minuto: a lista não fica guardada
                em lugar nenhum, ela é reconstruída lendo os eventos da rede um a
                um. É o que permite dizer que qualquer pessoa refaz esta mesma
                lista sem pedir acesso a sistema nenhum — e é honesto que custe.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm" style={{ color: "var(--alerta)" }}>
                Não foi possível refazer a lista agora.
              </p>
              <p className="text-xs text-[var(--texto-2)]">
                A rede pública de testes recusa requisições quando há muitas
                seguidas. Não há nada errado com a sua credencial.
              </p>
              <button
                onClick={() => setTentativa((n) => n + 1)}
                className="botao !px-3 !py-1.5 text-xs"
              >
                tentar de novo
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 4 — peso */}
      <section className="space-y-3">
        <h2 className="rotulo">4 · O que você está dizendo</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {([1, 2] as Peso[]).map((p) => (
            <button
              key={p}
              onClick={() => {
                setPeso(p);
                limpar();
              }}
              className="cartao p-4 text-left"
              style={{
                borderColor:
                  p === peso
                    ? p === 2
                      ? "var(--perigo)"
                      : "var(--alerta)"
                    : "var(--borda)",
              }}
            >
              <p className="text-sm font-medium">
                {PESO[p].nome}{" "}
                <span className="text-xs font-normal text-[var(--texto-3)]">
                  · peso {p}
                </span>
              </p>
              <p className="mt-1 text-xs text-[var(--texto-2)]">{PESO[p].descricao}</p>
            </button>
          ))}
        </div>
        <p className="rounded-lg bg-[var(--fundo-3)] p-3 text-xs text-[var(--texto-2)]">
          O peso vai <strong className="text-[var(--texto)]">dentro do envelope</strong>
          , cifrado. Quem soma não vê diferença nenhuma entre os dois: são envelopes
          fechados do mesmo tamanho. É a soma que decide, e ela acontece sem ninguém
          abrir nada. Como o limiar é 2, uma denúncia sozinha basta — porque quem vence
          o medo de denunciar não pode depender da sorte de outro setor ter registrado
          algo.
        </p>
      </section>

      {/* 5 — prova */}
      <section className="space-y-3">
        <h2 className="rotulo">5 · A prova — gerada aqui, no seu navegador</h2>
        <div className="cartao space-y-3 p-5">
          <button onClick={provar} disabled={!credenciado || ocupado != null} className="botao">
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
                  Anulador — impede você de emitir dois sinais protegidos neste setor no
                  mesmo mês, sem revelar quem você é
                </p>
                <p className="mt-1 break-all font-mono text-xs text-[var(--texto-2)]">
                  {curto(prova.anulador, 16)}
                </p>
              </div>
            </>
          )}
        </div>
      </section>

      {/* 6 — emissão */}
      <section className="space-y-3">
        <h2 className="rotulo">6 · O sinal — e quem assinou</h2>
        <div className="cartao space-y-3 p-5">
          <button onClick={emitir} disabled={!prova || ocupado != null} className="botao">
            {ocupado === "emitir" ? "emitindo…" : "Emitir o sinal"}
          </button>
          <p className="text-xs text-[var(--texto-3)]">
            A rede exige que alguém pague a taxa. Se fosse você, sua carteira ficaria
            ligada ao sinal para sempre. Por isso quem paga é outra pessoa — e ela não
            faz ideia de quem gerou a prova que está repassando.
          </p>

          {registro && (
            <div className="space-y-2 border-t border-[var(--borda)] pt-3">
              <p className="text-xs text-[var(--texto-2)]">
                Único signatário da transação:{" "}
                <span className="font-mono">{curto(registro.relayer, 8)}</span> — quem
                pagou a taxa.{" "}
                <strong className="text-[var(--texto)]">
                  Nenhum órgão assinou, e você também não.
                </strong>{" "}
                Quem autorizou foi a prova.
              </p>
              {emitido && (
                <p className="text-sm" style={{ color: "var(--ok)" }}>
                  Envelope aceito pelo nó de cruzamento — o sinal está valendo, com peso{" "}
                  {peso}.
                </p>
              )}
              <div className="flex flex-wrap gap-3 text-sm">
                <a href={registro.link} target="_blank" rel="noreferrer" className="underline">
                  ver o registro no explorador
                </a>
                <Link href="/cruzamento" className="underline">
                  ir ao cruzamento
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
        : a lista aqui é pequena, e anonimato real precisa de milhares de pessoas —
        criptografia não conserta conjunto pequeno. Quem repassa o sinal enxerga o
        endereço de rede de quem chamou. E o limite de um sinal por mês existe porque
        ligá-lo à criança colocaria na rede um valor estável dela, que é justamente o que
        este projeto não faz.
      </p>
    </div>
  );
}
