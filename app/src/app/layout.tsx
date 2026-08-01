import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Custódia verificável — rede de proteção à infância",
  description:
    "Cruzamento de sinais entre instituições sem que nenhuma veja o dado da outra, com trilha de custódia e prazos verificável em Solana.",
};

/**
 * O layout raiz ficou com o mínimo: a casca e o aviso.
 *
 * A navegação do Elo desceu para o grupo `(elo)`, porque os portais dos órgãos
 * precisam **não** tê-la — um sistema da secretaria de educação não mostra o
 * menu do nosso produto, senão volta a parecer o banco central único que a
 * `/solucao` passa uma tabela inteira criticando.
 *
 * O aviso de dados fictícios, esse fica em toda tela. Não é enfeite: é o
 * compromisso de honestidade do projeto, e um portal que simula sistema de
 * governo sem ele seria pior do que não existir.
 */
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen">
        <div className="sticky top-0 z-50 flex items-center gap-2 bg-[color-mix(in_srgb,var(--alerta)_12%,transparent)] px-4 py-1.5 text-[0.6875rem] font-semibold tracking-wide text-[var(--alerta)] backdrop-blur">
          <span aria-hidden>▲</span>
          DEMONSTRAÇÃO — TODOS OS DADOS SÃO FICTÍCIOS. NENHUM DADO REAL DE CRIANÇA É
          USADO, EXIBIDO OU ARMAZENADO.
        </div>
        {children}
      </body>
    </html>
  );
}
