import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Custódia verificável — rede de proteção à infância",
  description:
    "Cruzamento de sinais entre instituições sem que nenhuma veja o dado da outra, com trilha de custódia e prazos verificável em Solana.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen">
        <div className="sticky top-0 z-50 border-b border-[var(--borda)] bg-[var(--fundo)]/95 backdrop-blur">
          <div className="flex items-center gap-2 bg-[color-mix(in_srgb,var(--alerta)_12%,transparent)] px-4 py-1.5 text-[0.6875rem] font-semibold tracking-wide text-[var(--alerta)]">
            <span aria-hidden>▲</span>
            DEMONSTRAÇÃO — TODOS OS DADOS SÃO FICTÍCIOS. NENHUM DADO REAL DE CRIANÇA É
            USADO, EXIBIDO OU ARMAZENADO.
          </div>
          <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-1 px-4 py-2 text-sm">
            <Link href="/" className="mr-3 font-semibold tracking-tight">
              custódia<span className="text-[var(--texto-3)]">.verificável</span>
            </Link>
            <div className="flex flex-wrap gap-1 text-[var(--texto-2)]">
              <Link
                href="/solucao"
                className="rounded px-2 py-1 hover:bg-[var(--fundo-3)]"
              >
                A solução
              </Link>
              <Link
                href="/sinal/ubs"
                className="rounded px-2 py-1 hover:bg-[var(--fundo-3)]"
              >
                Instituições
              </Link>
              <Link
                href="/cruzamento"
                className="rounded px-2 py-1 hover:bg-[var(--fundo-3)]"
              >
                Cruzamento
              </Link>
              <Link href="/caso" className="rounded px-2 py-1 hover:bg-[var(--fundo-3)]">
                Custódia
              </Link>
              <Link
                href="/painel"
                className="rounded px-2 py-1 hover:bg-[var(--fundo-3)]"
              >
                Painel público
              </Link>
            </div>
          </nav>
        </div>
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        <footer className="mx-auto max-w-6xl px-4 pb-12 pt-4 text-xs text-[var(--texto-3)]">
          UNICEF Youth Challenge Blockchain 2026 · pilar Proteção à Infância · protótipo
        </footer>
      </body>
    </html>
  );
}
