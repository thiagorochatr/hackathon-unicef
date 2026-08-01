"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { CRIANCA_FICTICIA, SINAIS_FICTICIOS } from "@/lib/fixtures";
import { EMISSORES, PAPEL, SETOR_DO_PAPEL, type PapelEmissor } from "@/lib/tipos";
import { emitirSinal, useSinais } from "@/lib/useSinais";

export default function TelaSinal() {
  const params = useParams<{ papel: string }>();
  const { sinais, recarregar } = useSinais();
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aberto, setAberto] = useState(false);

  const papel = params.papel as PapelEmissor;
  if (!EMISSORES.includes(papel)) {
    return (
      <p className="text-sm text-[var(--texto-2)]">
        Este órgão não emite sinal. Escolha UBS, Escola ou CRAS.
      </p>
    );
  }

  const emissor = papel as "ubs" | "escola" | "cras";
  const dados = PAPEL[emissor];
  const conteudo = SINAIS_FICTICIOS[emissor];
  const enviado = sinais.find((s) => s.setor === SETOR_DO_PAPEL[emissor]);

  async function registrar() {
    setOcupado(true);
    setErro(null);
    try {
      await emitirSinal(emissor);
      await recarregar();
    } catch (e) {
      setErro(String(e instanceof Error ? e.message : e));
    } finally {
      setOcupado(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2">
        {EMISSORES.map((p) => (
          <Link
            key={p}
            href={`/sinal/${p}`}
            className={`botao !px-3 !py-1.5 text-xs ${p === emissor ? "botao-forte" : ""}`}
          >
            {PAPEL[p].sigla}
            {sinais.some((s) => s.setor === SETOR_DO_PAPEL[p]) && " ✓"}
          </Link>
        ))}
      </div>

      <header className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: dados.cor }} />
          <p className="rotulo !text-[var(--texto-2)]">{dados.nome}</p>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Registro de sinal de risco
        </h1>
        <p className="max-w-2xl text-sm text-[var(--texto-2)]">{dados.descricao}</p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="cartao space-y-4 p-5">
          <div className="flex items-center justify-between">
            <h2 className="rotulo">Dentro do órgão</h2>
            <span className="rounded bg-[var(--fundo-3)] px-2 py-0.5 text-[0.625rem] font-medium text-[var(--texto-2)]">
              nunca sai daqui
            </span>
          </div>

          <dl className="space-y-2.5 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--texto-3)]">Identificador</dt>
              <dd className="font-mono">{CRIANCA_FICTICIA.identificador}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--texto-3)]">Criança</dt>
              <dd>
                {CRIANCA_FICTICIA.iniciais}, {CRIANCA_FICTICIA.idade} anos
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--texto-3)]">Município</dt>
              <dd>{CRIANCA_FICTICIA.municipio}</dd>
            </div>
          </dl>

          <div className="rounded-lg border border-[var(--borda)] bg-[var(--fundo)] p-3">
            <p className="text-sm font-medium">{conteudo.rotulo}</p>
            <p className="mt-1 text-xs text-[var(--texto-2)]">{conteudo.detalhe}</p>
          </div>

          <p className="text-xs text-[var(--texto-3)]">
            Sozinho, este sinal não vira caso. É esse o problema: três sinais fracos e
            separados, que juntos seriam graves, continuam sendo três sinais fracos.
          </p>
        </section>

        <section className="cartao space-y-4 p-5">
          <div className="flex items-center justify-between">
            <h2 className="rotulo">O que sai do órgão</h2>
            <span className="rounded bg-[color-mix(in_srgb,var(--ok)_15%,transparent)] px-2 py-0.5 text-[0.625rem] font-medium text-[var(--ok)]">
              sem dado pessoal
            </span>
          </div>

          {enviado ? (
            <>
              <div>
                <p className="rotulo mb-1">Apelido da criança</p>
                <p className="cifra !text-[var(--texto-2)]">{enviado.apelido}</p>
                <p className="mt-1 text-[0.6875rem] text-[var(--texto-3)]">
                  Calculado com uma chave de serviço. Sem a chave ninguém consegue
                  testar CPFs até achar de quem é.
                </p>
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <p className="rotulo">Envelope lacrado</p>
                  <span className="text-[0.625rem] text-[var(--texto-3)]">
                    {enviado.tamanhoTotal.toLocaleString("pt-BR")} letras no total
                  </span>
                </div>
                <p
                  className={`cifra overflow-y-auto ${aberto ? "max-h-72" : "max-h-24"}`}
                >
                  {enviado.pedacoDoEnvelope}
                  {!aberto && "…"}
                </p>
                <button
                  className="mt-1 text-[0.6875rem] text-[var(--texto-3)] underline"
                  onClick={() => setAberto(!aberto)}
                >
                  {aberto ? "mostrar menos" : "mostrar mais"}
                </button>
                <p className="mt-1 text-[0.6875rem] text-[var(--texto-3)]">
                  Isto é criptografia de verdade, não enfeite. Quem recebe consegue
                  somar sem abrir — e não consegue abrir.
                </p>
              </div>
              <Link href="/cruzamento" className="botao botao-forte w-full">
                Ver o cruzamento →
              </Link>
            </>
          ) : (
            <>
              <p className="text-sm text-[var(--texto-2)]">
                Ao registrar, o órgão fecha um envelope com a chave pública do comitê e
                envia. O prontuário, o relato e o nome continuam onde sempre estiveram.
              </p>
              {erro && (
                <p className="cartao border-[var(--perigo)] p-3 text-xs text-[var(--perigo)]">
                  {erro}
                </p>
              )}
              <button
                className="botao botao-forte w-full"
                disabled={ocupado}
                onClick={registrar}
              >
                {ocupado ? "cifrando…" : "Registrar sinal cifrado"}
              </button>
              <p className="text-xs text-[var(--texto-3)]">
                Sinais já recebidos pelo nó: {sinais.length}
              </p>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
