import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sistema de Acompanhamento de Procedimentos — MP",
  description: "Sistema de demonstração. Nenhuma criança real.",
};

export default function LayoutMp({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
