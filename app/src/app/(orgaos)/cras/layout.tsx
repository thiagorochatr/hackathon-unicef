import type { Metadata } from "next";

/**
 * O título da aba também faz parte da ilusão.
 *
 * Sem isto, o navegador anuncia "Custódia verificável" enquanto a tela diz
 * Secretaria de Assistência Social — e é o primeiro lugar onde alguém repara.
 */
export const metadata: Metadata = {
  title: "Registro de Acompanhamento Familiar — SMADS",
  description: "Sistema de demonstração. Nenhuma família real.",
};

export default function LayoutCras({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
