import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Os sistemas dos órgãos — custódia verificável",
  description:
    "Três sistemas de instituições diferentes, que não se conhecem e não conversam. É de dentro deles que o sinal sai.",
};

/**
 * A porta de entrada dos portais.
 *
 * ## Por que esta tela existe, e por que ela não é um menu de abas
 *
 * O argumento central do projeto é que **um banco central único é a resposta
 * errada**. Se aqui houvesse três abas com o mesmo visual, o site diria com a
 * imagem exatamente o contrário do que diz com o texto — e é a imagem que o
 * jurado processa primeiro.
 *
 * Por isso cada cartão carrega a barra do próprio sistema, na cor e com a sigla
 * dele, antes de qualquer clique. A diferença precisa ser visível daqui.
 *
 * Os links abrem em aba nova de propósito: sair do Elo faz parte da demonstração.
 * Quem clica não está navegando dentro do nosso produto, está indo para o sistema
 * de outra instituição — que na vida real é outro contrato, outro fornecedor,
 * outro login.
 */

const SISTEMAS = [
  {
    href: "/ubs",
    orgao: "ubs" as const,
    sigla: "SMS",
    secretaria: "Secretaria Municipal de Saúde",
    sistema: "Prontuário Eletrônico da Atenção Básica",
    unidade: "UBS Vila dos Ipês",
    tarefa: "A fila de atendimento do dia.",
    onde:
      "O sinal nasce no bloco de notificação compulsória — a comunicação de suspeita de maus-tratos que o ECA já obriga desde 1990.",
    conta: "pacientes",
  },
  {
    href: "/escola",
    orgao: "escola" as const,
    sigla: "PMS",
    secretaria: "Secretaria Municipal de Educação",
    sistema: "Diário de Classe Digital",
    unidade: "EMEF Prof.ª Aparecida Nunes",
    tarefa: "A chamada da turma.",
    onde:
      "O sinal nasce no registro de ocorrência de um aluno com faltas seguidas — o que a coordenação já vê hoje, e sobre o que já precisa tomar providência.",
    conta: "alunos",
  },
  {
    href: "/cras",
    orgao: "cras" as const,
    sigla: "SUAS",
    secretaria: "Secretaria Municipal de Assistência e Desenvolvimento Social",
    sistema: "Registro de Acompanhamento Familiar",
    unidade: "CRAS Zona Norte",
    tarefa: "O acompanhamento das famílias referenciadas.",
    onde:
      "O sinal nasce no registro de evolução do PAIF, entre as situações identificadas na visita.",
    conta: "famílias",
  },
];

/**
 * Os que recebem.
 *
 * Não emitem nada: recebem um caso e agem sobre ele. E o que os três
 * compartilham não é banco de dados — é a mesma cadeia pública. Cada um lê o
 * estado do caso porque ele está lá, não porque alguém sincronizou.
 */
const RECEBEM = [
  {
    href: "/creas",
    orgao: "creas" as const,
    sigla: "PSE",
    secretaria: "Secretaria Municipal de Assistência e Desenvolvimento Social",
    sistema: "Sistema de Proteção Social Especial",
    unidade: "CREAS Centro",
    tarefa: "Os casos em acompanhamento do PAEFI.",
    onde:
      "É onde o caso cai primeiro — e a técnica descobre que ele chegou sem que ninguém o tenha encaminhado.",
  },
  {
    href: "/conselho",
    orgao: "ct" as const,
    sigla: "CT",
    secretaria: "Conselho Tutelar — 2ª Região",
    sistema: "Registro de Medidas de Proteção",
    unidade: "Conselheiros eleitos, mandato 2024/2028",
    tarefa: "A fila do plantão e as medidas de proteção.",
    onde:
      "É onde os casos historicamente somem. Aqui o relógio fica no topo da tela: caso parado deixou de ser caso esquecido.",
  },
  {
    href: "/mp",
    orgao: "mp" as const,
    sigla: "MP",
    secretaria: "Ministério Público do Estado de São Paulo",
    sistema: "Sistema de Acompanhamento de Procedimentos",
    unidade: "Promotoria da Infância e Juventude — Sorocaba",
    tarefa: "Os procedimentos da promotoria.",
    onde:
      "É onde aparece a entrada sem remetente: o caso que subiu sozinho porque o prazo venceu, e que ninguém decidiu mandar.",
  },
];

interface Sistema {
  href: string;
  orgao: string;
  sigla: string;
  secretaria: string;
  sistema: string;
  unidade: string;
  tarefa: string;
  onde: string;
}

function Cartao({ s }: { s: Sistema }) {
  return (
    <a
      href={s.href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col overflow-hidden rounded border border-[var(--borda)] bg-[var(--fundo-2)] transition hover:border-[var(--texto-3)]"
    >
      {/* A barra do sistema, na cor dele — a diferença antes do clique.
          `data-barra` e não `data-orgao`: aqui se quer a cor, não a casca
          clara de página inteira que o portal liga. */}
      <div data-barra={s.orgao} className="flex items-center gap-2 px-3 py-2">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-white/70 text-[0.5rem] font-bold">
          {s.sigla}
        </div>
        <p className="text-[0.6875rem] font-bold leading-tight">{s.secretaria}</p>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <div>
          <p className="text-sm font-semibold">{s.sistema}</p>
          <p className="text-[0.6875rem] text-[var(--texto-3)]">{s.unidade}</p>
        </div>
        <p className="text-[0.8125rem] text-[var(--texto-2)]">
          <span className="text-[var(--texto)]">A tarefa:</span> {s.tarefa}
        </p>
        <p className="text-[0.75rem] text-[var(--texto-2)]">{s.onde}</p>
        <p className="mt-auto pt-2 text-[0.6875rem] text-[var(--texto-3)] underline group-hover:text-[var(--texto-2)]">
          abrir {s.href} em outra aba
        </p>
      </div>
    </a>
  );
}

export default function TelaOrgaos() {
  return (
    <div className="space-y-10">
      <header className="max-w-3xl space-y-3">
        <p className="rotulo">Os sistemas</p>
        <h1 className="text-3xl font-semibold leading-tight tracking-tight">
          Seis sistemas que não se conhecem.
        </h1>
        <p className="text-[var(--texto-2)]">
          Isto não é um menu de abas do nosso produto. São seis softwares de
          instituições diferentes, com contratos diferentes, fornecedores diferentes e
          logins diferentes — e é assim mesmo que eles são hoje, em qualquer município
          do país. Nenhum deles sabe da existência dos outros.
        </p>
        <p className="text-sm text-[var(--texto-2)]">
          Eles nem contam a mesma coisa: a saúde conta pacientes, a educação conta
          alunos, a assistência conta famílias. Uma criança é vários registros que nunca
          se olharam.{" "}
          <strong className="text-[var(--texto)]">
            Unificar isso num banco só seria a resposta errada
          </strong>{" "}
          — e é o que a{" "}
          <Link href="/solucao" className="underline">
            página da solução
          </Link>{" "}
          explica.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="rotulo">Os que emitem</h2>
        <p className="max-w-2xl text-sm text-[var(--texto-2)]">
          Mandam um envelope lacrado e vão embora. Nenhum deles fica sabendo se o
          envelope encontrou outro.
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          {SISTEMAS.map((s) => (
            <Cartao key={s.href} s={s} />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="rotulo">Os que recebem</h2>
        <p className="max-w-2xl text-sm text-[var(--texto-2)]">
          Não emitem nada: recebem um caso e agem sobre ele, e cada providência é uma
          transação assinada.{" "}
          <strong className="text-[var(--texto)]">
            O que estes três compartilham não é banco de dados — é a mesma cadeia
            pública.
          </strong>{" "}
          Cada um lê o estado do caso porque ele está lá, não porque alguém sincronizou.
          A informação comum é de quem é a bola e até quando, nunca a vida da criança.
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          {RECEBEM.map((s) => (
            <Cartao key={s.href} s={s} />
          ))}
        </div>
      </section>

      <section className="max-w-3xl space-y-3 rounded border border-[var(--borda)] bg-[var(--fundo-2)] p-4">
        <h2 className="rotulo">O que reparar ao abrir</h2>
        <ul className="space-y-2 text-sm text-[var(--texto-2)]">
          <li>
            <strong className="text-[var(--texto)]">
              Não existe botão de &ldquo;denunciar&rdquo; em lugar nenhum.
            </strong>{" "}
            Em cada portal o sinal pende de uma tarefa que o profissional já faria de
            qualquer jeito. Sistema obrigatório não garante uso — por isso o caminho é
            entrar no fluxo que já existe, e não criar mais um login.
          </li>
          <li>
            <strong className="text-[var(--texto)]">
              A maioria dos registros não emite nada.
            </strong>{" "}
            Marcar &ldquo;não se aplica&rdquo; na UBS, ou só situações de renda no CRAS,
            encerra o atendimento sem qualquer aviso à rede. Um portal que emitisse
            sempre seria mentira.
          </li>
          <li>
            <strong className="text-[var(--texto)]">Cada um enxerga só o próprio pedaço.</strong>{" "}
            O histórico que aparece na tela é o da própria unidade. O que os outros dois
            viram sobre a mesma criança não está lá — e não pode estar.
          </li>
          <li>
            <strong className="text-[var(--texto)]">
              O canal protegido é avisado, e não executado, dentro deles.
            </strong>{" "}
            A criptografia protege contra a rede e contra quem recebe; não protege
            contra o dono do software onde ela roda. Por isso ele fica{" "}
            <Link href="/denuncia" className="underline">
              fora
            </Link>
            .
          </li>
          <li>
            <strong className="text-[var(--texto)]">
              Nos três que recebem, não existe botão de arquivar.
            </strong>{" "}
            Encerrar exige registrar desfecho, e o desfecho fica na rede. Enquanto o
            prazo corre, ou alguém assume, ou o caso vai sozinho ao Ministério Público —
            e no portal do MP ele aparece como entrada{" "}
            <em>sem remetente</em>, porque de fato ninguém o mandou.
          </li>
        </ul>
      </section>

      <section className="max-w-3xl space-y-2">
        <h2 className="rotulo">Depois de emitir</h2>
        <p className="text-sm text-[var(--texto-2)]">
          Os envelopes que saem dos três chegam ao mesmo nó, que não consegue abrir
          nenhum deles. O{" "}
          <Link href="/cruzamento" className="underline">
            cruzamento
          </Link>{" "}
          mostra o que acontece ali, e o{" "}
          <Link href="/log" className="underline">
            log
          </Link>{" "}
          mostra cada passo da criptografia enquanto acontece.
        </p>
      </section>
    </div>
  );
}
