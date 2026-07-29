import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "A solução completa — custódia verificável",
  description:
    "Como a proteção à infância pode ser unificada e sigilosa ao mesmo tempo: cruzar sinais sem ninguém ver o dado do outro, e fazer o repasse deixar rastro.",
};

function Caixa({
  titulo,
  children,
  cor,
}: {
  titulo: string;
  children: React.ReactNode;
  cor?: string;
}) {
  return (
    <div
      className="rounded-lg border bg-[var(--fundo-2)] p-3"
      style={{ borderColor: cor ?? "var(--borda)" }}
    >
      <p className="text-xs font-semibold" style={{ color: cor ?? "var(--texto)" }}>
        {titulo}
      </p>
      <div className="mt-1 text-[0.6875rem] leading-relaxed text-[var(--texto-2)]">
        {children}
      </div>
    </div>
  );
}

const Seta = () => (
  <div className="flex items-center justify-center py-1 text-[var(--texto-3)] sm:py-0">
    <span className="sm:hidden">↓</span>
    <span className="hidden sm:inline">→</span>
  </div>
);

export default function TelaSolucao() {
  return (
    <div className="space-y-14">
      <header className="max-w-3xl space-y-4">
        <p className="rotulo">A solução completa que imaginamos</p>
        <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
          Duas palavras que não cabem no mesmo banco de dados.
        </h1>
        <p className="text-[var(--texto-2)]">
          Auditorias de tribunais de contas dizem, com todas as letras, que falta na
          rede de proteção uma{" "}
          <strong className="text-[var(--texto)]">
            &ldquo;base eletrônica unificada e sigilosa&rdquo;
          </strong>
          . O pedido parece simples. Ele é impossível do jeito comum.
        </p>
      </header>

      {/* A contradição */}
      <section className="space-y-4">
        <h2 className="rotulo">Por que ninguém resolveu isso ainda</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[34rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-[var(--borda)] text-left">
                <th className="py-2 pr-4 font-medium text-[var(--texto-3)]"> </th>
                <th className="py-2 pr-4 font-medium">Unificada</th>
                <th className="py-2 pr-4 font-medium">Sigilosa</th>
              </tr>
            </thead>
            <tbody className="text-[var(--texto-2)]">
              <tr className="border-b border-[var(--borda)]">
                <td className="py-3 pr-4 text-[var(--texto)]">
                  Os sistemas de hoje
                  <span className="block text-xs text-[var(--texto-3)]">
                    SIPIA, SINAN, Prontuário SUAS, Educacenso
                  </span>
                </td>
                <td className="py-3 pr-4 text-[var(--perigo)]">
                  não — cada um enxerga um pedaço
                </td>
                <td className="py-3 pr-4 text-[var(--ok)]">sim</td>
              </tr>
              <tr className="border-b border-[var(--borda)]">
                <td className="py-3 pr-4 text-[var(--texto)]">
                  Um banco central único
                  <span className="block text-xs text-[var(--texto-3)]">
                    a saída &ldquo;óbvia&rdquo;
                  </span>
                </td>
                <td className="py-3 pr-4 text-[var(--ok)]">sim</td>
                <td className="py-3 pr-4 text-[var(--perigo)]">
                  não — alguém passa a ver o risco de toda criança do país
                </td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-medium text-[var(--texto)]">
                  A nossa proposta
                </td>
                <td className="py-3 pr-4 text-[var(--ok)]">
                  sim — os sinais se cruzam
                </td>
                <td className="py-3 pr-4 text-[var(--ok)]">
                  sim — ninguém precisa ver nada
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="max-w-2xl text-sm text-[var(--texto-2)]">
          Unificar exige juntar tudo em um lugar. Juntar tudo em um lugar destrói o
          sigilo. É por isso que o problema continua aberto há décadas — não por falta
          de vontade nem de dinheiro. Só existe uma saída: <strong className="text-[var(--texto)]">fazer a conta sem abrir os dados</strong>.
        </p>
      </section>

      {/* As duas tecnologias, explicadas */}
      <section className="space-y-4">
        <h2 className="rotulo">As duas ideias que tornam isso possível</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="cartao space-y-3 p-6">
            <p className="text-xs font-semibold tracking-wide text-[var(--c-saude)]">
              FHE · CRIPTOGRAFIA QUE DEIXA CALCULAR
            </p>
            <p className="text-lg font-semibold">
              Somar envelopes lacrados sem abrir nenhum.
            </p>
            <p className="text-sm text-[var(--texto-2)]">
              Imagine que cada órgão escreve um número num papel e fecha num envelope.
              Normalmente, para somar, é preciso abrir todos. Com essa criptografia dá
              para <strong className="text-[var(--texto)]">somar os envelopes fechados</strong>{" "}
              e receber um envelope com o resultado certo dentro. Quem fez a conta não
              viu nenhum número.
            </p>
            <p className="text-sm text-[var(--texto-2)]">
              É o que permite descobrir que a UBS e a escola viram sinais sobre a mesma
              criança — sem que a UBS saiba o que a escola registrou, sem que a escola
              saiba da UBS, e sem que o sistema no meio saiba de nada.
            </p>
            <p className="rounded-lg bg-[var(--fundo-3)] p-3 text-xs text-[var(--texto-2)]">
              Escolhemos essa técnica, e não outra parecida, por um motivo prático: uma
              UBS, uma escola e um CRAS nunca vão estar ligados ao mesmo tempo. As
              alternativas exigem todo mundo online conversando ao vivo. Esta funciona
              com cada um mandando seu envelope quando puder.
            </p>
          </div>

          <div className="cartao space-y-3 p-6">
            <p className="text-xs font-semibold tracking-wide text-[var(--c-educacao)]">
              ZK · PROVA QUE NÃO REVELA
            </p>
            <p className="text-lg font-semibold">
              Provar que você sabe a senha sem dizer a senha.
            </p>
            <p className="text-sm text-[var(--texto-2)]">
              Dá para provar que uma afirmação é verdadeira sem mostrar por quê. O
              verificador fica convencido e não aprende mais nada além do
              &ldquo;é verdade&rdquo;.
            </p>
            <p className="text-sm text-[var(--texto-2)]">
              Serve para o problema que mais trava a rede hoje: o professor que
              desconfia e não denuncia com medo de retaliação. Com isso ele prova que{" "}
              <strong className="text-[var(--texto)]">
                é um professor daquela escola
              </strong>{" "}
              — logo a denúncia vale — sem que ninguém descubra{" "}
              <strong className="text-[var(--texto)]">qual</strong> professor foi.
            </p>
            <p className="rounded-lg bg-[var(--fundo-3)] p-3 text-xs text-[var(--texto-2)]">
              Tem um efeito colateral importante: uma prova dessas continua sem revelar
              nada mesmo daqui a 50 anos, contra qualquer computador. Guardar prova é
              seguro para sempre. Guardar segredo trancado, não.
            </p>
          </div>
        </div>
      </section>

      {/* O caminho */}
      <section className="space-y-4">
        <h2 className="rotulo">Como funciona, do começo ao fim</h2>
        <div className="grid items-stretch gap-2 sm:grid-cols-[1fr_auto_1fr_auto_1fr]">
          <Caixa titulo="1 · Os órgãos" cor="var(--c-saude)">
            UBS, escola e CRAS mandam um sinal cifrado, ligado a um apelido da criança.
            O nome, o prontuário e o relato ficam onde sempre estiveram.
          </Caixa>
          <Seta />
          <Caixa titulo="2 · A conta às cegas">
            Um serviço soma os sinais sem abrir nenhum. Ele não tem a chave. Nem sabe de
            que criança se trata: só vê apelidos.
          </Caixa>
          <Seta />
          <Caixa titulo="3 · O alerta" cor="var(--c-creas)">
            Se dois ou mais sinais coincidem, sai um alerta. Um só sinal não vira nada —
            e nada é registrado.
          </Caixa>
        </div>

        <div className="grid items-stretch gap-2 sm:grid-cols-[1fr_auto_1fr_auto_1fr]">
          <Caixa titulo="4 · O caso nasce" cor="var(--c-creas)">
            Gravado na Solana com um órgão responsável e um prazo. Quem grava é quem fez
            a conta — o responsável <strong>não</strong> precisa concordar, senão
            bastaria ele não assinar para o caso nunca existir.
          </Caixa>
          <Seta />
          <Caixa titulo="5 · O repasse" cor="var(--c-ct)">
            Passar adiante tem dois passos. Até o outro órgão confirmar que recebeu, o
            caso continua sendo de quem passou, com o prazo correndo contra ele.
          </Caixa>
          <Seta />
          <Caixa titulo="6 · A cobrança" cor="var(--c-mp)">
            Prazo vencido sem ninguém aceitar, o caso vai para o Ministério Público.
            Qualquer pessoa pode acionar — nenhum dos envolvidos consegue segurar.
          </Caixa>
        </div>

        <div className="cartao p-4">
          <p className="text-sm">
            <strong>Em paralelo, a denúncia protegida.</strong>{" "}
            <span className="text-[var(--texto-2)]">
              Um profissional pode acionar a rede provando que tem o direito de
              denunciar, sem se identificar. A denúncia entra no mesmo fluxo e ganha
              prazo e responsável, como qualquer outra.
            </span>
          </p>
        </div>
      </section>

      {/* Por que blockchain */}
      <section className="space-y-4">
        <h2 className="rotulo">O que vai para a blockchain, e por quê</h2>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="cartao space-y-3 p-6">
            <p className="text-xs font-semibold tracking-wide text-[var(--ok)]">
              VAI PARA A REDE
            </p>
            <ul className="space-y-2 text-sm text-[var(--texto-2)]">
              <li>
                <strong className="text-[var(--texto)]">Quem é o responsável</strong> —
                a chave pública do órgão
              </li>
              <li>
                <strong className="text-[var(--texto)]">Desde quando e até quando</strong>{" "}
                — abertura e prazo
              </li>
              <li>
                <strong className="text-[var(--texto)]">Para quem foi passado</strong>, e
                se já aceitou
              </li>
              <li>
                <strong className="text-[var(--texto)]">Um resumo de quem responde</strong>{" "}
                — cargo e matrícula viram um número; o nome fica fora
              </li>
              <li>
                <strong className="text-[var(--texto)]">O encadeamento dos passos</strong>{" "}
                — cada um embaralha o anterior junto
              </li>
              <li>
                <strong className="text-[var(--texto)]">Quem deu sinal de vida</strong> no
                período, e quem não deu
              </li>
            </ul>
            <p className="rounded-lg bg-[var(--fundo-3)] p-3 text-xs text-[var(--texto-2)]">
              São 156 bytes por caso, num espaço de tamanho fixo. Não cabe mais nada nem
              se alguém quisesse colocar.
            </p>
          </div>

          <div className="cartao space-y-3 p-6">
            <p className="text-xs font-semibold tracking-wide text-[var(--perigo)]">
              NÃO VAI, EM NENHUMA HIPÓTESE
            </p>
            <ul className="space-y-2 text-sm text-[var(--texto-2)]">
              <li>Nome, CPF ou endereço de qualquer criança</li>
              <li>O que foi observado — lesão, falta, relato</li>
              <li>Diagnóstico, laudo ou parecer</li>
              <li>Quem denunciou</li>
              <li>O apelido usado no cruzamento</li>
              <li>Os envelopes cifrados — nem eles</li>
            </ul>
            <p className="rounded-lg bg-[var(--fundo-3)] p-3 text-xs text-[var(--texto-2)]">
              Nem cifrado. O registro é permanente, e uma cifra que resiste hoje pode não
              resistir daqui a trinta anos — quando a criança de hoje for adulta.
            </p>
          </div>
        </div>

        <p className="max-w-3xl text-sm text-[var(--texto-2)]">
          Reduzindo ao osso: o que vai para a rede é{" "}
          <strong className="text-[var(--texto)]">
            quem é o responsável, desde quando, até quando, e quem não apareceu
          </strong>
          . Um banco de dados comum guardaria isso sem dificuldade. O problema não é
          guardar — são estas três coisas:
        </p>

        <div className="grid gap-3 lg:grid-cols-3">
          {[
            {
              n: "1",
              t: "O registro é contra quem guardaria o banco",
              d: "A informação “o órgão deixou o prazo vencer” ficaria num sistema da mesma prefeitura que emprega esse órgão. Apagar uma linha não deixa rastro. Aqui não existe quem hospeda — logo, não existe quem apaga.",
            },
            {
              n: "2",
              t: "Cada passo é assinado, e assinatura não se desdiz",
              d: "“O CREAS assumiu às 15h59” não é afirmação do nosso sistema: é uma frase que o CREAS assinou com a chave dele. Ele não pode depois dizer que o sistema anotou errado. Num banco comum, quem fez o quê é um campo que o administrador preenche.",
            },
            {
              n: "3",
              t: "A ida ao Ministério Público é código, não rotina",
              d: "Num sistema comum, “escalar após o prazo” é uma tarefa agendada que alguém com acesso desliga. Aqui é regra do programa: vencido o prazo, qualquer pessoa aciona, e nenhum dos envolvidos consegue impedir.",
            },
          ].map((p) => (
            <div key={p.n} className="cartao space-y-2 p-5">
              <span className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--borda)] text-sm font-semibold text-[var(--texto-3)]">
                {p.n}
              </span>
              <p className="text-sm font-medium">{p.t}</p>
              <p className="text-xs text-[var(--texto-2)]">{p.d}</p>
            </div>
          ))}
        </div>

        <p className="max-w-3xl rounded-lg border border-[var(--borda)] bg-[var(--fundo-2)] p-4 text-sm text-[var(--texto-2)]">
          O efeito prático de tudo isso: um promotor, um vereador ou um jornalista
          confere sozinho — sem pedir acesso a sistema nenhum, e sem precisar confiar em
          quem seria cobrado.
        </p>
      </section>

      {/* O que não entra */}
      <section className="space-y-3">
        <h2 className="rotulo">O que nunca vai para a rede</h2>
        <div className="cartao space-y-3 p-6">
          <p className="text-lg font-semibold">
            Nenhum dado de criança. Nem cifrado.
          </p>
          <p className="max-w-3xl text-sm text-[var(--texto-2)]">
            O registro é permanente e não dá para apagar. A criança de hoje ainda vai
            ser adulta por uns 80 anos. Guardar hoje um segredo trancado é apostar que a
            fechadura vai resistir esse tempo todo — e quem quiser é só esperar. Por
            isso a decisão é não colocar, em nenhuma forma.
          </p>
          <div className="grid gap-3 pt-1 sm:grid-cols-2">
            <div className="rounded-lg border border-[color-mix(in_srgb,var(--ok)_40%,transparent)] bg-[color-mix(in_srgb,var(--ok)_7%,transparent)] p-4">
              <p className="text-xs font-semibold text-[var(--ok)]">VAI PARA A REDE</p>
              <ul className="mt-2 space-y-1 text-xs text-[var(--texto-2)]">
                <li>um número embaralhado que identifica o caso</li>
                <li>de qual órgão é a responsabilidade agora</li>
                <li>o prazo e os horários de cada passo</li>
                <li>um selo que encadeia a trilha</li>
              </ul>
            </div>
            <div className="rounded-lg border border-[color-mix(in_srgb,var(--perigo)_40%,transparent)] bg-[color-mix(in_srgb,var(--perigo)_7%,transparent)] p-4">
              <p className="text-xs font-semibold text-[var(--perigo)]">
                NUNCA VAI PARA A REDE
              </p>
              <ul className="mt-2 space-y-1 text-xs text-[var(--texto-2)]">
                <li>nome, CPF ou endereço de qualquer criança</li>
                <li>o que foi observado, mesmo cifrado</li>
                <li>diagnóstico, relato ou laudo</li>
                <li>quem denunciou</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Honestidade */}
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
              e: "no plano",
              d: "É a parte que ataca a causa mais citada da subnotificação: o medo de quem denuncia.",
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

      <section className="space-y-3">
        <h2 className="rotulo">O que assumimos que não resolvemos</h2>
        <p className="max-w-3xl text-sm text-[var(--texto-2)]">
          Se alguém escrever uma mentira no registro de origem, nada disso corrige. O
          que garantimos é outra coisa, e é a que falta hoje: que o registro exista, que
          ele tenha dono, que o prazo seja público e que ninguém consiga apagar o
          rastro depois. O problema mais comum na rede não é alguém mentir — é ninguém
          registrar nada.
        </p>
      </section>
    </div>
  );
}
