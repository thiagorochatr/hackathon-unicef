import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Estado do protótipo — custódia verificável",
  description:
    "O que já funciona de verdade neste protótipo e o que ainda é encenação, item a item.",
};

export default function TelaEstado() {
  return (
    <div className="space-y-10">
      <header className="max-w-3xl space-y-3">
        <p className="rotulo">Estado do protótipo</p>
        <h1 className="text-3xl font-semibold leading-tight tracking-tight">
          O que já funciona, e o que ainda não.
        </h1>
        <p className="text-[var(--texto-2)]">
          A{" "}
          <Link href="/solucao" className="underline">
            página da solução
          </Link>{" "}
          descreve como o sistema deve ser. Esta aqui separa o que deste protótipo já
          roda de verdade do que ainda é encenação. Preferimos dizer do que deixar
          alguém descobrir sozinho.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="rotulo">Onde estamos hoje</h2>
        <p className="max-w-2xl text-sm text-[var(--texto-2)]">
          Esta é a visão inteira. O protótipo que você navega aqui já tem parte dela
          funcionando de verdade, e parte ainda encenada. A separação está abaixo,
          porque achamos que dizer isso vale mais do que esconder.
        </p>
        <div className="space-y-2">
          {[
            {
              t: "Trilha de responsáveis e prazos na Solana",
              e: "funciona de verdade",
              d: "Abrir, passar adiante, aceitar, ir ao Ministério Público e encerrar são transações reais, conferíveis no explorador público.",
              ok: true,
            },
            {
              t: "O caso nasce sem o responsável assinar",
              e: "funciona de verdade",
              d: "Verificado na rede: a transação que abre o caso tem um único signatário, e não é o órgão responsável.",
              ok: true,
            },
            {
              t: "Cruzar sinais sem abrir os envelopes",
              e: "funciona de verdade",
              d: "Criptografia homomórfica (Microsoft SEAL, esquema BFV). Cada envelope tem cerca de 118 mil letras; a soma é feita sem nenhuma chave secreta. A tela mostra a mesma soma aberta com a chave certa e com uma chave errada — a errada devolve um número sem sentido.",
              ok: true,
            },
            {
              t: "Apelido da criança calculado com chave",
              e: "funciona de verdade",
              d: "HMAC-SHA256 com uma chave de serviço, e não um resumo simples do CPF — senão qualquer um testaria os cem bilhões de CPFs possíveis até descobrir de quem é cada apelido.",
              ok: true,
            },
            {
              t: "Chave repartida entre vários órgãos",
              e: "no plano",
              d: "Hoje a chave do comitê existe inteira em um lugar só. Na versão completa é preciso um número mínimo de instituições concordando para abrir qualquer coisa.",
              ok: false,
            },
            {
              t: "Comparação feita dentro do envelope",
              e: "no plano",
              d: "Hoje o comitê descobre quantos sinais coincidiram. Na versão completa só sai um \u201csim\u201d ou \u201cnão\u201d.",
              ok: false,
            },
            {
              t: "Cada órgão marca presença na rede",
              e: "funciona de verdade",
              d: "Um selo por período gravado na Solana, mesmo sem nenhum caso. Quem não grava aparece como alerta no painel público — e qualquer pessoa confere sem pedir acesso a sistema nenhum.",
              ok: true,
            },
            {
              t: "Denúncia protegida por prova que não revela",
              e: "funciona de verdade",
              d: "Um profissional credenciado abre um caso provando que está na lista do município, sem revelar qual deles é. A prova nasce no navegador dele, em menos de um segundo, e quem confere é o programa na rede — não um servidor nosso. A transação que abre o caso tem um signatário só, que é quem pagou a taxa: nenhum órgão assinou, e o denunciante também não.",
              ok: true,
            },
            {
              t: "Lista de credenciados conferível por qualquer pessoa",
              e: "funciona de verdade",
              d: "Cada credenciamento grava na rede quem entrou. Dá para refazer a lista inteira lendo só a cadeia e conferir que ela corresponde ao resumo publicado — ou seja, que ninguém foi incluído às escondidas para poder denunciar sem ser da rede.",
              ok: true,
            },
            {
              t: "Grupo grande o bastante para esconder alguém",
              e: "no plano",
              d: "Na demonstração são poucas pessoas. Anonimato de verdade precisa de milhares: criptografia não conserta grupo pequeno. E quem repassa a denúncia enxerga o endereço de rede de quem enviou — proteger isso exige uma camada a mais.",
              ok: false,
            },
          ].map((i) => (
            <div key={i.t} className="cartao flex flex-wrap gap-3 p-4">
              <span
                className="mt-1 h-2 w-2 shrink-0 rounded-full"
                style={{ background: i.ok ? "var(--ok)" : "var(--alerta)" }}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">
                  {i.t}{" "}
                  <span
                    className="ml-1 text-xs font-normal"
                    style={{ color: i.ok ? "var(--ok)" : "var(--alerta)" }}
                  >
                    · {i.e}
                  </span>
                </p>
                <p className="mt-0.5 text-xs text-[var(--texto-2)]">{i.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
