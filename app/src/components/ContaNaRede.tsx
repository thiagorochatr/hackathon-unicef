"use client";

import { useState } from "react";
import { PAPEL, type CasoNaCadeia } from "@/lib/tipos";

/**
 * Mostra o conteúdo da conta do caso na Solana, campo a campo, lido da rede.
 *
 * Existe por um motivo de comunicação: sem isto, quem assiste vê links de
 * transação e precisa acreditar. Aqui dá para ver que o que está gravado são
 * quatro coisas — quem responde, desde quando, até quando, e o encadeamento
 * dos passos — e que não há espaço para mais nada.
 */
export function ContaNaRede({ caso }: { caso: CasoNaCadeia }) {
  const [aberto, setAberto] = useState(false);

  const campos = [
    {
      rotulo: "Número do caso",
      valor: caso.alertaId,
      nota: "Sorteado. Não é derivado do CPF, do nome nem de nada da criança — então ele não leva a ninguém.",
    },
    {
      rotulo: "Órgão responsável agora",
      valor: caso.responsavelChave,
      nota: caso.responsavel
        ? `Chave pública do ${PAPEL[caso.responsavel].sigla}. É este campo que responde "de quem é a bola".`
        : "Chave não reconhecida.",
    },
    {
      rotulo: "Passado para",
      valor: caso.pendentePara ? PAPEL[caso.pendentePara].sigla : "(ninguém)",
      nota: "Enquanto houver alguém aqui, a responsabilidade ainda é de quem passou.",
    },
    {
      rotulo: "Resumo de quem responde",
      valor: caso.agenteHash,
      nota: caso.agenteConfere
        ? `Confere com “${caso.agenteIdentificacao}”, que fica fora da rede. Refizemos a conta agora e bateu.`
        : "Não foi possível conferir com nenhuma identificação conhecida.",
      confere: caso.agenteConfere,
    },
    {
      rotulo: "Prazo",
      valor: new Date(caso.prazo).toLocaleString("pt-BR"),
      nota: "Vencido este instante, qualquer pessoa pode mandar o caso ao Ministério Público.",
    },
    {
      rotulo: "Elo da trilha",
      valor: caso.trilhaHash,
      nota: "Cada passo embaralha o anterior junto. Mexer em um passo antigo quebraria todos os seguintes.",
    },
    {
      rotulo: "Passos gravados",
      valor: String(caso.eventos),
      nota: "Contador que não volta atrás.",
    },
  ];

  return (
    <section className="cartao space-y-4 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">
            Tudo o que existe na Solana sobre este caso
          </h2>
          <p className="mt-1 text-sm text-[var(--texto-2)]">
            Lido da rede agora, não da memória desta tela. São{" "}
            <strong className="text-[var(--texto)]">{caso.bytesNaRede} bytes</strong> —
            e o tamanho é fixo, então não cabe mais nada mesmo que alguém quisesse.
          </p>
        </div>
        <a
          href={caso.linkConta}
          target="_blank"
          rel="noreferrer"
          className="botao !px-3 !py-1.5 text-xs"
        >
          conferir no explorador
        </a>
      </div>

      <dl className="space-y-2">
        {campos.map((c) => (
          <div
            key={c.rotulo}
            className="rounded-lg border border-[var(--borda)] bg-[var(--fundo)] p-3"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <dt className="text-sm font-medium">{c.rotulo}</dt>
              {c.confere !== undefined && (
                <span
                  className="text-[0.625rem] font-semibold"
                  style={{ color: c.confere ? "var(--ok)" : "var(--alerta)" }}
                >
                  {c.confere ? "✓ CONFERE" : "não confere"}
                </span>
              )}
            </div>
            <dd className="cifra mt-1 break-all">{c.valor}</dd>
            <p className="mt-1 text-xs text-[var(--texto-2)]">{c.nota}</p>
          </div>
        ))}
      </dl>

      <div className="rounded-lg border border-[color-mix(in_srgb,var(--perigo)_35%,transparent)] bg-[color-mix(in_srgb,var(--perigo)_6%,transparent)] p-4">
        <p className="text-xs font-semibold text-[var(--perigo)]">
          O QUE NÃO ESTÁ AQUI, E NUNCA VAI ESTAR
        </p>
        <p className="mt-1 text-xs text-[var(--texto-2)]">
          Nome, CPF ou endereço da criança. O que foi observado. Diagnóstico, relato ou
          laudo. Quem denunciou. O apelido usado no cruzamento. Nem mesmo os envelopes
          cifrados — eles ficam fora da rede. O registro é para sempre, e a criança de
          hoje ainda vai ser adulta por décadas.
        </p>
      </div>

      <div>
        <button
          className="text-xs text-[var(--texto-3)] underline"
          onClick={() => setAberto(!aberto)}
        >
          {aberto ? "esconder" : "ver os bytes crus da conta"}
        </button>
        {aberto && (
          <p className="cifra mt-2 max-h-40 overflow-y-auto break-all">
            {caso.brutoHex}
          </p>
        )}
      </div>
    </section>
  );
}
