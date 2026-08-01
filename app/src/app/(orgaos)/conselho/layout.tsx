import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Registro de Medidas de Proteção — Conselho Tutelar",
  description: "Sistema de demonstração. Nenhuma criança real.",
};

export default function LayoutConselho({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
