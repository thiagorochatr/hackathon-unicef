import Link from "next/link";

/**
 * A casca do Elo: navegação, largura e rodapé.
 *
 * Vive aqui, e não na raiz, para que os portais dos órgãos não a herdem. Grupo
 * de rota não muda URL — `/cruzamento` continua `/cruzamento`.
 */
export default function LayoutElo({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <div className="sticky top-[26px] z-40 border-b border-[var(--borda)] bg-[var(--fundo)]/95 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-1 px-4 py-2 text-sm">
          <Link href="/" className="mr-3 font-semibold tracking-tight">
            custódia<span className="text-[var(--texto-3)]">.verificável</span>
          </Link>
          <div className="flex flex-wrap gap-1 text-[var(--texto-2)]">
            <Link href="/solucao" className="rounded px-2 py-1 hover:bg-[var(--fundo-3)]">
              A solução
            </Link>
            <Link href="/orgaos" className="rounded px-2 py-1 hover:bg-[var(--fundo-3)]">
              Os sistemas
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
            <Link href="/painel" className="rounded px-2 py-1 hover:bg-[var(--fundo-3)]">
              Painel público
            </Link>
            <Link href="/log" className="rounded px-2 py-1 hover:bg-[var(--fundo-3)]">
              Log
            </Link>
          </div>
        </nav>
      </div>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      <footer className="mx-auto max-w-6xl px-4 pb-12 pt-4 text-xs text-[var(--texto-3)]">
        UNICEF Youth Challenge Blockchain 2026 · pilar Proteção à Infância · protótipo
      </footer>
    </>
  );
}
