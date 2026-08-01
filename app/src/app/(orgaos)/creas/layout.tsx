import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sistema de Proteção Social Especial — SMADS",
  description: "Sistema de demonstração. Nenhuma família real.",
};

export default function LayoutCreas({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
