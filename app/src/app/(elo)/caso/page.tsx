"use client";

import Link from "next/link";
import { Relogio, useAgora } from "@/components/Relogio";
import { useCaso } from "@/lib/useCaso";
import { ESTADO_ROTULO, PAPEL } from "@/lib/tipos";
import { ContaNaRede } from "@/components/ContaNaRede";

const LINK_TX = (a: string) => `https://explorer.solana.com/tx/${a}?cluster=devnet`;

/**
 * O caso, ao vivo — e **só** ao vivo.
 *
 * ## O que esta tela deixou de ser
 *
 * Ela já teve uma fileira de botões onde se escolhia "você é UBS, escola, CREAS,
 * Conselho, MP" e se agia como cada um. Aquilo era a encenação inteira num lugar
 * só, e tinha o problema de ser exatamente a imagem que o projeto critica: um
 * sistema central com abas.
 *
 * Agir agora é dos portais — cada órgão no software dele, em `/creas`,
 * `/conselho`, `/mp`. Aqui não há nenhum botão que escreva na rede.
 *
 * ## O que ela passou a ser
 *
 * A prova crua. Nenhum sistema de governo mostraria o conteúdo bruto da própria
 * conta, o selo da trilha ou a lista de transações — e é justamente isso que
 * precisa estar visível em algum lugar, porque é o que sustenta a frase de que
 * ninguém precisa acreditar em nós.
 *
 * Ela lê da rede a cada poucos segundos. Abra num monitor ao lado dos portais e
 * o estado muda sozinho conforme os órgãos agem: quem responde, o prazo, a
 * trilha crescendo. Nada aqui é guardado nesta tela — se a rede disser outra
 * coisa, a rede ganha.
 */
export default function TelaCaso() {
  const agora = useAgora();
  const { caso, alertaId } = useCaso();

  if (!alertaId || !caso) {
    return (
      <div className="space-y-6">
        <header className="max-w-3xl space-y-2">
          <p className="rotulo">A conta na rede · ao vivo</p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Nada aqui é escrito por esta tela.
          </h1>
        </header>
        <div className="cartao p-6 text-sm text-[var(--texto-2)]">
          {alertaId ? (
            <>Lendo o caso na rede…</>
          ) : (
            <>
              Nenhum caso aberto ainda.{" "}
              <Link href="/cruzamento" className="underline">
                Faça o cruzamento
              </Link>{" "}
              para que um alerta crie o caso na Solana, ou emita um sinal protegido em{" "}
              <Link href="/denuncia" className="underline">
                /denuncia
              </Link>
              .
            </>
          )}
        </div>
      </div>
    );
  }

  const encerrado = caso.estado === "Encerrado";
  const responsavel = caso.responsavel;
  const venceu = agora !== null && agora > caso.prazo;

  return (
    <div className="space-y-8">
      <header className="max-w-3xl space-y-2">
        <p className="rotulo">
          A conta na rede · ao vivo ·{" "}
          <a href={caso.linkConta} target="_blank" rel="noreferrer" className="underline">
            abrir no explorador
          </a>
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Nada aqui é escrito por esta tela.
        </h1>
        <p className="max-w-2xl text-sm text-[var(--texto-2)]">
          Quem age são os órgãos, cada um no{" "}
          <Link href="/orgaos" className="underline">
            sistema dele
          </Link>
          . Esta página só lê, de poucos em poucos segundos, e mostra o que está
          gravado. Deixe-a aberta ao lado: o responsável, o prazo e a trilha mudam
          sozinhos conforme alguém assina do outro lado.
        </p>
      </header>

      <section
        className="cartao space-y-5 p-6"
        style={{
          borderColor:
            caso.estado === "Escalado"
              ? "var(--perigo)"
              : caso.estado === "PendenteAceite"
                ? "var(--alerta)"
                : "var(--borda)",
        }}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="rotulo">Responsável agora</p>
            <div className="mt-1 flex items-center gap-2">
              <span
                className="h-3 w-3 rounded-full"
                style={{ background: responsavel ? PAPEL[responsavel].cor : "#666" }}
              />
              <span className="text-xl font-semibold">
                {responsavel ? PAPEL[responsavel].sigla : "chave desconhecida"}
              </span>
            </div>
            <p className="mt-1 text-xs text-[var(--texto-2)]">
              {caso.agenteIdentificacao ?? ""}
            </p>
            <p className="cifra mt-1">{caso.responsavelChave}</p>
          </div>

          <div className="text-right">
            <p className="rotulo">Prazo</p>
            <div className="mt-1">
              {/* Sem `aoVencer`: quando o prazo zera esta tela não faz nada, ela
                  só mostra. Quem chama a escalada são os portais dos órgãos que
                  estão segurando o caso. */}
              <Relogio prazo={caso.prazo} pausado={encerrado} />
            </div>
            <p className="mt-1 text-xs text-[var(--texto-2)]">
              {ESTADO_ROTULO[caso.estado]}
            </p>
          </div>
        </div>

        {caso.estado === "PendenteAceite" && caso.pendentePara && (
          <div className="rounded-lg border border-[var(--alerta)] bg-[color-mix(in_srgb,var(--alerta)_8%,transparent)] p-4">
            <p className="text-sm font-medium text-[var(--alerta)]">
              Passado para {PAPEL[caso.pendentePara].sigla}, mas ainda não aceito
            </p>
            <p className="mt-1 text-xs text-[var(--texto-2)]">
              O responsável <strong>não</strong> mudou. O caso ainda é do{" "}
              {responsavel ? PAPEL[responsavel].sigla : "órgão anterior"} e o prazo
              corre contra ele. Se ninguém aceitar, o caso não some — ele vai para o
              Ministério Público.
            </p>
          </div>
        )}

        {venceu && !encerrado && caso.estado !== "Escalado" && (
          <div className="rounded-lg border border-[var(--alerta)] bg-[color-mix(in_srgb,var(--alerta)_8%,transparent)] p-4">
            <p className="text-sm font-medium text-[var(--alerta)]">
              O prazo venceu e a rede já aceita a escalada
            </p>
            <p className="mt-1 text-xs text-[var(--texto-2)]">
              O programa passou a aceitar a chamada de{" "}
              <strong className="text-[var(--texto)]">qualquer chave</strong> — e a
              recusaria de todas antes deste instante. Esta tela não vai chamar: ela só
              lê. Quem chama é o portal do órgão que está com o caso, e o resultado
              aparece aqui em segundos.
            </p>
          </div>
        )}

        {caso.estado === "Escalado" && (
          <div className="rounded-lg border border-[var(--perigo)] bg-[color-mix(in_srgb,var(--perigo)_10%,transparent)] p-4">
            <p className="text-sm font-medium text-[var(--perigo)]">
              O prazo venceu sem ninguém aceitar — o caso foi para o Ministério Público
            </p>
            <p className="mt-1 text-xs text-[var(--texto-2)]">
              Nenhum dos órgãos envolvidos conseguiu impedir, porque não havia nada a
              impedir: a regra está no programa.{" "}
              <a href="/mp" target="_blank" rel="noreferrer" className="underline">
                No sistema da promotoria
              </a>{" "}
              isso aparece como entrada sem remetente.
            </p>
          </div>
        )}

        <dl className="grid gap-3 border-t border-[var(--borda)] pt-4 text-xs sm:grid-cols-4">
          <div>
            <dt className="rotulo">Número do alerta</dt>
            <dd className="cifra mt-1">{caso.alertaId.slice(0, 24)}…</dd>
          </div>
          <div>
            <dt className="rotulo">Selo da trilha</dt>
            <dd className="cifra mt-1">{caso.trilhaHash.slice(0, 24)}…</dd>
          </div>
          <div>
            <dt className="rotulo">Passos gravados</dt>
            <dd className="mt-1 font-mono text-sm">{caso.eventos}</dd>
          </div>
          <div>
            <dt className="rotulo">Dado de criança na rede</dt>
            <dd className="mt-1 font-medium text-[var(--ok)]">nenhum, nem cifrado</dd>
          </div>
        </dl>
      </section>

      <ContaNaRede caso={caso} />

      <section className="space-y-3">
        <h2 className="rotulo">
          Trilha na rede — {caso.registros.length} transação(ões)
        </h2>
        <ol className="space-y-2">
          {caso.registros.map((r, i) => (
            <li key={r.assinatura} className="cartao flex flex-wrap gap-3 p-4">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[var(--borda)] text-xs text-[var(--texto-3)]">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                {/* O nome do passo vem do log da própria transação, não daqui:
                    é o Anchor que escreve "Instruction: Escalar" na rede. */}
                {r.passo && (
                  <p className="text-sm font-medium">
                    {r.passo}
                    <span className="ml-2 font-mono text-xs text-[var(--texto-3)]">
                      {r.instrucao}
                    </span>
                  </p>
                )}
                <a
                  href={LINK_TX(r.assinatura)}
                  target="_blank"
                  rel="noreferrer"
                  className="cifra !text-[var(--texto-2)] underline"
                >
                  {r.assinatura}
                </a>
                <p className="mt-0.5 text-xs text-[var(--texto-3)]">
                  {r.ts ? new Date(r.ts).toLocaleString("pt-BR") : "confirmando…"}
                  {r.erro && " · falhou"}
                </p>
              </div>
            </li>
          ))}
        </ol>
        <p className="text-xs text-[var(--texto-3)]">
          Cada linha é uma transação real na Solana devnet. Clique para conferir no
          explorador — não é preciso confiar nesta tela, e é esse o ponto de ela existir.
        </p>
      </section>
    </div>
  );
}
