import type { Metadata } from "next";

/**
 * O título da aba também faz parte da ilusão.
 *
 * Sem isto, o navegador anuncia "Custódia verificável" enquanto a tela diz
 * Secretaria de Educação — e é o primeiro lugar onde alguém repara.
 */
export const metadata: Metadata = {
  title: "Diário de Classe Digital — SEDUC",
  description: "Sistema de demonstração. Nenhum dado real de criança.",
};

export default function LayoutEscola({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
