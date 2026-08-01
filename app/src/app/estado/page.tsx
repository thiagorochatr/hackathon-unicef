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
              d: "Criptografia homomórfica (Microsoft SEAL, esquema BFV). Cada envelope tem centenas de milhares de letras; a soma é feita sem nenhuma chave secreta. A tela mostra o mesmo resultado aberto com a chave certa e com uma chave errada — a errada devolve um número sem sentido.",
              ok: true,
            },
            {
              t: "Apelido da criança calculado com chave",
              e: "funciona de verdade",
              d: "Não é um resumo simples do CPF — senão qualquer um testaria os cem bilhões possíveis até descobrir de quem é cada apelido. Entra uma chave de serviço no meio, e sem ela esse teste não é possível.",
              ok: true,
            },
            {
              t: "Apontar a criança sem contar a ninguém qual é",
              e: "funciona de verdade",
              d: "Quem emite um sinal protegido calcula o apelido no próprio navegador, por consulta embaralhada (OPRF, RFC 9497). O identificador da criança não sai do aparelho: quem tem a chave faz a conta pedida sem descobrir sobre quem, e como o embaralhamento muda a cada vez, duas perguntas sobre a mesma criança chegam como valores sem relação. O resultado é idêntico ao que o sistema do órgão calcularia direto — é essa igualdade que faz os dois tipos de sinal se encontrarem no cruzamento.",
              ok: true,
            },
            {
              t: "Toda abertura do comitê fica contada na rede",
              e: "funciona de verdade",
              d: "O comitê é a parte em que mais se pede confiança, porque é ele que tem a chave. Cada vez que ele abre um veredito, isso vira registro assinado na rede, e um contador público diz quantas aberturas houve e quantas viraram alerta. Em vez de acreditar que ele só abre o veredito, dá para conferir quantas vezes ele abriu.",
              ok: true,
            },
            {
              t: "Chave repartida entre vários órgãos",
              e: "no plano",
              d: "A chave do comitê está inteira em um lugar só. Repartir de verdade exige abertura parcial — cada guardião calcula um pedaço com o seu naco, e a chave nunca existe inteira — e a biblioteca que usamos só expõe abertura completa; seria preciso trocá-la. Repartir com o método simples (juntar os pedaços na hora de abrir) daria uma garantia bem mais fraca do que o nome sugere: quem junta poderia guardar. E, acima de tudo, isso só passa a valer com operadores de verdade: repartir a chave entre instituições que são todas o mesmo servidor não protegeria nada.",
              ok: false,
            },
            {
              t: "Comparação feita dentro do envelope",
              e: "funciona de verdade",
              d: "A comparação com o limite acontece sem abrir nada, e o resultado sai mascarado por um fator sorteado. O comitê aprende exatamente um bit: passou ou não passou. Não sabe se foram dois apontamentos ou uma denúncia sozinha, nem quantos setores participaram. Dá para ver na tela: o mesmo conjunto de sinais, cruzado duas vezes, devolve números diferentes e o mesmo veredito.",
              ok: true,
            },
            {
              t: "Cada órgão marca presença na rede",
              e: "funciona de verdade",
              d: "Um selo por período gravado na Solana, mesmo sem nenhum caso. Quem não grava aparece como alerta no painel público — e qualquer pessoa confere sem pedir acesso a sistema nenhum.",
              ok: true,
            },
            {
              t: "Sinal protegido por prova que não revela quem emitiu",
              e: "funciona de verdade",
              d: "Um profissional prova que está na lista do setor no município, sem revelar qual deles é, e com isso ganha o direito de emitir um sinal. A prova nasce no navegador dele em menos de um segundo, e quem confere é o programa na rede — não um servidor nosso. A transação tem um signatário só, que é quem pagou a taxa: nenhum órgão assinou, e quem emitiu também não.",
              ok: true,
            },
            {
              t: "Observar e afirmar valem diferente",
              e: "funciona de verdade",
              d: "Um apontamento pesa 1 e só vira caso se outro setor também tiver visto algo; uma denúncia pesa 2 e basta sozinha. O peso vai cifrado dentro do envelope: quem soma não distingue um do outro. Existe porque quem vence o medo de denunciar não pode depender da sorte de outro setor ter registrado alguma coisa.",
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
              d: "Na demonstração são poucas pessoas. Anonimato de verdade precisa de milhares: criptografia não conserta grupo pequeno. E quem repassa o sinal enxerga o endereço de rede de quem enviou — proteger isso exige uma camada a mais.",
              ok: false,
            },
            {
              t: "Chave do apelido repartida entre instituições",
              e: "no plano",
              d: "A chave não vaza nas consultas, mas continua inteira em um lugar só: quem a detém consegue calcular o apelido de um identificador que já conheça. Na versão completa ela é repartida, e é preciso um número mínimo de instituições para qualquer cálculo acontecer.",
              ok: false,
            },
            {
              t: "Limite de sinal protegido por criança, e não por mês",
              e: "no plano",
              d: "Hoje cada credenciado emite um sinal protegido por setor por mês. Ligar o limite à criança poria na rede um valor estável dela, permitindo juntar todos os sinais sobre a mesma pessoa ao longo dos anos — e é justamente isso que este projeto não faz. Resolver exige um caminho que ainda não construímos.",
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
