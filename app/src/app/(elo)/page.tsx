"use client";

import Link from "next/link";
import { useEstado, acoes } from "@/lib/store";
import { useCaso } from "@/lib/useCaso";
import { useSinais } from "@/lib/useSinais";
import { LIMIAR } from "@/lib/fixtures";
import { PAPEIS, PAPEL } from "@/lib/tipos";

interface Passo {
  n: number;
  titulo: string;
  descricao: string;
  href: string;
  feito: boolean;
}

export default function Inicio() {
  const estado = useEstado();
  const { caso } = useCaso(5000);
  const { sinais } = useSinais();

  const passos: Passo[] = [
    {
      n: 1,
      titulo: "A UBS atende, e notifica",
      descricao:
        "No meio da fila do dia, no bloco de notificação compulsória. O que sai da unidade é um apelido e um envelope lacrado — nunca o dado.",
      href: "/ubs",
      feito: sinais.some((s) => s.setor === "saude"),
    },
    {
      n: 2,
      titulo: "A escola faz a chamada, e registra",
      descricao:
        "Outro sistema, outra secretaria, outro login. A escola não sabe que a UBS existe.",
      href: "/escola",
      feito: sinais.some((s) => s.setor === "educacao"),
    },
    {
      n: 3,
      titulo: "Cruzamento cifrado",
      descricao: `${LIMIAR} sinais coincidem sobre a mesma criança e sai um alerta.`,
      href: "/cruzamento",
      feito: Boolean(caso),
    },
    {
      n: 4,
      titulo: "CREAS assume, com prazo",
      descricao: "O alerta cai em um órgão com nome e um relógio começa a correr.",
      href: "/caso",
      feito: Boolean(caso),
    },
    {
      n: 5,
      titulo: "Passa para o Conselho Tutelar",
      descricao: "O caso continua sendo do CREAS até o Conselho confirmar.",
      href: "/caso",
      feito: caso ? caso.eventos > 1 : false,
    },
    {
      n: 6,
      titulo: "O prazo vence e ninguém aceitou",
      descricao: "O caso vai sozinho para o Ministério Público. Ninguém segura.",
      href: "/caso",
      feito: caso?.estado === "Escalado",
    },
    {
      n: 7,
      titulo: "Painel público",
      descricao: "Quem marcou presença, quem não marcou, quantos prazos venceram.",
      href: "/painel",
      feito: estado.ciclo > 1,
    },
  ];

  return (
    <div className="space-y-10">
      <header className="max-w-3xl space-y-4">
        <p className="rotulo">
          UNICEF Youth Challenge Blockchain 2026 · Proteção à Infância
        </p>
        <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
          Cruzar sinais entre instituições sem que nenhuma veja o dado da outra — e
          fazer o repasse deixar rastro.
        </h1>
        <p className="text-[var(--texto-2)]">
          Auditorias de tribunais de contas apontam a ausência de uma{" "}
          <strong className="text-[var(--texto)]">
            &ldquo;base eletrônica unificada e sigilosa&rdquo;
          </strong>{" "}
          na rede de proteção. As duas palavras se contradizem para um banco de dados
          comum: unificar exige centralizar, e centralizar destrói o sigilo. Este
          protótipo entrega as duas.
        </p>
      </header>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="rotulo">Roteiro da demonstração</h2>
          <button className="botao !px-3 !py-1.5 text-xs" onClick={() => void acoes.reiniciar()}>
            Reiniciar demo
          </button>
        </div>

        <ol className="grid gap-2 sm:grid-cols-2">
          {passos.map((p) => (
            <li key={p.n}>
              <Link
                href={p.href}
                className="cartao flex h-full gap-3 p-4 transition hover:border-[#35455a]"
              >
                <span
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
                    p.feito
                      ? "border-[var(--ok)] bg-[var(--ok)] text-[var(--fundo)]"
                      : "border-[var(--borda)] text-[var(--texto-3)]"
                  }`}
                >
                  {p.feito ? "✓" : p.n}
                </span>
                <span className="space-y-1">
                  <span className="block text-sm font-medium">{p.titulo}</span>
                  <span className="block text-xs text-[var(--texto-2)]">{p.descricao}</span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section className="space-y-3">
        <h2 className="rotulo">Atores</h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {PAPEIS.map((p) => (
            <div key={p} className="cartao p-4">
              <div className="flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: PAPEL[p].cor }}
                />
                <span className="text-sm font-medium">{PAPEL[p].sigla}</span>
              </div>
              <p className="mt-1.5 text-xs text-[var(--texto-2)]">{PAPEL[p].descricao}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
