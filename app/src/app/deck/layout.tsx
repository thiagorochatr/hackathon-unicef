import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Elo — pitch",
  description:
    "Pitch deck do Elo: custódia verificável para a rede de proteção à infância, em Solana.",
};

export default function LayoutDeck({ children }: { children: React.ReactNode }) {
  return children;
}
