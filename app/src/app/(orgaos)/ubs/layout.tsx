import type { Metadata } from "next";

/**
 * O título da aba também faz parte da ilusão.
 *
 * Sem isto, o navegador anuncia "Custódia verificável" enquanto a tela diz
 * Secretaria de Saúde — e é o primeiro lugar onde alguém repara.
 */
export const metadata: Metadata = {
  title: "Prontuário Eletrônico da Atenção Básica — SMS",
  description: "Sistema de demonstração. Nenhum dado real de paciente.",
};

export default function LayoutUbs({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
