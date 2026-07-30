"use client";

import { useCallback, useEffect, useState } from "react";

/* Palco fixo: tudo é desenhado em 1280×720 e escalado para caber na tela.
   Assim a gravação sai idêntica em qualquer monitor. */
const LARGURA = 1280;
const ALTURA = 720;

/* ---------------------------------------------------------------- peças */

function Slide({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`flex h-full w-full flex-col justify-center px-20 py-14 ${className}`}
    >
      {children}
    </section>
  );
}

function Rotulo({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[0.8125rem] font-semibold uppercase tracking-[0.18em] text-[var(--texto-3)]">
      {children}
    </p>
  );
}

function Titulo({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[2.75rem] font-semibold leading-[1.1] tracking-tight">
      {children}
    </h2>
  );
}

function Punch({ children }: { children: React.ReactNode }) {
  return (
    <p className="border-l-2 border-[var(--texto)] pl-5 text-[1.375rem] leading-snug">
      {children}
    </p>
  );
}

const F = ({ children }: { children: React.ReactNode }) => (
  <strong className="font-semibold text-[var(--texto)]">{children}</strong>
);

/* --------------------------------------------------------------- slides */

const SLIDES: React.ReactNode[] = [
  /* 1 — capa */
  <Slide key="capa">
    <Rotulo>UNICEF Youth Challenge Blockchain 2026 · Proteção à Infância</Rotulo>
    <div className="mt-8 flex items-end gap-6">
      <h1 className="text-[7rem] font-semibold leading-none tracking-tight">Elo</h1>
      <p className="mb-4 max-w-xs text-[1.0625rem] leading-snug text-[var(--texto-2)]">
        Custódia verificável para a rede de proteção à infância.
        <span className="block text-[var(--texto-3)]">Solana · devnet</span>
      </p>
    </div>
    <div className="mt-10 border-t border-[var(--borda)] pt-8">
      <p className="text-[2rem] font-medium leading-tight">
        &ldquo;A rede já sabia.&rdquo;
      </p>
      <p className="mt-3 max-w-2xl text-[1.0625rem] text-[var(--texto-2)]">
        É a frase que se repete toda vez que uma criança morre depois de meses de
        sinais. Todos os órgãos tinham visto alguma coisa. Nenhum deles era o
        responsável.
      </p>
    </div>
  </Slide>,

  /* 2 — o problema */
  <Slide key="problema">
    <Rotulo>O problema</Rotulo>
    <Titulo>
      Cada órgão vê um pedaço.
      <br />
      Ninguém junta os pedaços.
    </Titulo>

    <div className="mt-8 grid grid-cols-4 gap-3">
      {[
        { s: "UBS", v: "vê a lesão", c: "var(--c-saude)" },
        { s: "Escola", v: "vê a falta repetida", c: "var(--c-educacao)" },
        { s: "CRAS", v: "vê a família em dificuldade", c: "var(--c-assistencia)" },
        { s: "Conselho Tutelar", v: "recebe a denúncia", c: "var(--c-ct)" },
      ].map((o) => (
        <div
          key={o.s}
          className="rounded-lg border bg-[var(--fundo-2)] p-4"
          style={{ borderColor: o.c }}
        >
          <p className="text-[0.9375rem] font-semibold" style={{ color: o.c }}>
            {o.s}
          </p>
          <p className="mt-1 text-[0.875rem] text-[var(--texto-2)]">{o.v}</p>
        </div>
      ))}
    </div>

    <p className="mt-7 max-w-4xl text-[1.0625rem] leading-relaxed text-[var(--texto-2)]">
      Quando um avisa o outro, o aviso sai por ofício em papel, telefone, e-mail ou
      WhatsApp. <F>Não fica registro de que chegou</F>, de quem passou a ser o
      responsável, nem de até quando.
    </p>

    <div className="mt-6">
      <Punch>
        A falha mais comum não é alguém adulterar um registro.
        <br />É o registro <F>nunca ter existido</F>.
      </Punch>
    </div>
  </Slide>,

  /* 3 — a frase da auditoria */
  <Slide key="auditoria" className="items-start">
    <Rotulo>O requisito não foi escrito por nós</Rotulo>
    <p className="mt-8 max-w-5xl text-[2.125rem] font-medium leading-[1.25] tracking-tight">
      <span className="text-[var(--texto-3)]">&ldquo;</span>os sistemas de informação
      não são integrados nem há uma{" "}
      <span className="text-[var(--c-saude)]">base eletrônica unificada e sigilosa</span>{" "}
      que permita o compartilhamento de dados
      <span className="text-[var(--texto-3)]">&rdquo;</span>
    </p>
    <p className="mt-6 text-[0.9375rem] text-[var(--texto-2)]">
      Tribunal de Contas do Rio Grande do Norte · Projeto Infância Segura (Atricon),
      2026
    </p>
    <p className="mt-10 max-w-3xl text-[1.0625rem] leading-relaxed text-[var(--texto-2)]">
      A auditoria está sendo replicada estado a estado. <F>Unificada</F> e{" "}
      <F>sigilosa</F>: são essas duas palavras que definem o produto.
    </p>
  </Slide>,

  /* 4 — quem é afetado */
  <Slide key="afetados">
    <Rotulo>Quem é afetado</Rotulo>
    <Titulo>Crianças cujo caso se perde no caminho entre um órgão e outro.</Titulo>

    <div className="mt-9 grid grid-cols-3 gap-4">
      {[
        {
          n: "289,4 mil",
          d: "denúncias sobre crianças e adolescentes no Disque 100 em 2024 — 33 por hora",
          f: "MDHC, 2025",
        },
        {
          n: "59.887",
          d: "notificações de violência sexual contra crianças e adolescentes no SINAN em 2025 — 422.994 em onze anos",
          f: "Ministério da Saúde, 2026",
        },
        {
          n: "5.570",
          d: "municípios e cerca de 6.100 Conselhos Tutelares: a escala que qualquer solução precisa alcançar",
          f: "IBGE · Agência Brasil, 2023",
        },
      ].map((c) => (
        <div key={c.n} className="cartao flex flex-col p-5">
          <p className="text-[2.5rem] font-semibold leading-none tracking-tight">
            {c.n}
          </p>
          <p className="mt-3 flex-1 text-[0.9375rem] leading-snug text-[var(--texto-2)]">
            {c.d}
          </p>
          <p className="mt-3 text-[0.75rem] text-[var(--texto-3)]">{c.f}</p>
        </div>
      ))}
    </div>

    <p className="mt-8 max-w-4xl text-[1.0625rem] leading-relaxed text-[var(--texto-2)]">
      Junto com elas, <F>os profissionais da rede</F> — conselheiros tutelares,
      técnicos de CREAS, professores, agentes de saúde. Hoje eles avisam sem poder
      provar que avisaram, e nunca ficam sabendo o desfecho.
    </p>
  </Slide>,

  /* 5 — a contradição */
  <Slide key="contradicao">
    <Rotulo>Por que ninguém resolveu isso ainda</Rotulo>
    <Titulo>Duas palavras que não cabem no mesmo banco de dados.</Titulo>

    <table className="mt-8 w-full border-collapse text-[1rem]">
      <thead>
        <tr className="border-b border-[var(--borda)] text-left text-[var(--texto-3)]">
          <th className="w-[42%] py-2 font-medium"> </th>
          <th className="py-2 font-medium">Unificada</th>
          <th className="py-2 font-medium">Sigilosa</th>
        </tr>
      </thead>
      <tbody className="text-[var(--texto-2)]">
        <tr className="border-b border-[var(--borda)]">
          <td className="py-3.5 pr-6 text-[var(--texto)]">
            Os sistemas de hoje
            <span className="block text-[0.8125rem] text-[var(--texto-3)]">
              SIPIA, SINAN, Prontuário SUAS, Educacenso
            </span>
          </td>
          <td className="py-3.5 pr-6 text-[var(--perigo)]">
            não — cada um vê um pedaço
          </td>
          <td className="py-3.5 text-[var(--ok)]">sim</td>
        </tr>
        <tr className="border-b border-[var(--borda)]">
          <td className="py-3.5 pr-6 text-[var(--texto)]">
            Um banco central único
            <span className="block text-[0.8125rem] text-[var(--texto-3)]">
              a saída &ldquo;óbvia&rdquo;
            </span>
          </td>
          <td className="py-3.5 pr-6 text-[var(--ok)]">sim</td>
          <td className="py-3.5 text-[var(--perigo)]">
            não — alguém passa a ver o risco de toda criança do país
          </td>
        </tr>
        <tr>
          <td className="py-3.5 pr-6 font-semibold text-[var(--texto)]">Elo</td>
          <td className="py-3.5 pr-6 text-[var(--ok)]">sim — os sinais se cruzam</td>
          <td className="py-3.5 text-[var(--ok)]">
            sim — ninguém precisa ver nada
          </td>
        </tr>
      </tbody>
    </table>

    <div className="mt-8">
      <Punch>
        Unificar exige centralizar. Centralizar destrói o sigilo. Só existe uma saída:{" "}
        <F>fazer a conta sem abrir os dados</F>.
      </Punch>
    </div>
  </Slide>,

  /* 6 — como funciona */
  <Slide key="como">
    <Rotulo>Como funciona</Rotulo>
    <Titulo>Quatro movimentos.</Titulo>

    <div className="mt-8 grid grid-cols-4 gap-3">
      {[
        {
          n: "1",
          t: "Avisar sem se expor",
          d: "Quem suspeita prova que é profissional habilitado de um órgão credenciado — sem revelar quem é. O medo de retaliação deixa de pesar.",
        },
        {
          n: "2",
          t: "Cruzar sem revelar",
          d: "Cada órgão manda um envelope lacrado. A soma é feita sem abrir nenhum. Dois sinais independentes sobre a mesma criança viram um alerta.",
        },
        {
          n: "3",
          t: "Trilha com dono e prazo",
          d: "O alerta vira um caso na Solana, com órgão responsável e relógio correndo. Passar adiante só transfere a responsabilidade quando o outro lado assina o aceite.",
        },
        {
          n: "4",
          t: "Presença periódica",
          d: "Cada órgão marca presença de tempos em tempos, mesmo sem caso algum. A ausência da marca é que vira alarme.",
        },
      ].map((p) => (
        <div key={p.n} className="cartao flex flex-col p-5">
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--borda)] text-[0.9375rem] font-semibold text-[var(--texto-3)]">
            {p.n}
          </span>
          <p className="mt-3 text-[1.0625rem] font-semibold leading-snug">{p.t}</p>
          <p className="mt-2 text-[0.875rem] leading-snug text-[var(--texto-2)]">
            {p.d}
          </p>
        </div>
      ))}
    </div>

    <p className="mt-8 max-w-4xl text-[1.0625rem] leading-relaxed text-[var(--texto-2)]">
      Vencido o prazo sem ninguém aceitar, <F>qualquer pessoa</F> envia o caso ao
      Ministério Público. Não é rotina agendada que alguém desliga: é regra do
      programa, e nenhum dos envolvidos consegue segurar.
    </p>
  </Slide>,

  /* 7 — a linha */
  <Slide key="linha">
    <Rotulo>A linha que não se atravessa</Rotulo>
    <Titulo>Nenhum dado de criança vai para a blockchain.</Titulo>

    <div className="mt-8 grid grid-cols-2 gap-4">
      <div className="cartao p-6">
        <p className="text-[0.8125rem] font-semibold uppercase tracking-wider text-[var(--ok)]">
          Vai para a rede
        </p>
        <ul className="mt-4 space-y-2 text-[0.9375rem] text-[var(--texto-2)]">
          <li>Qual órgão é o responsável agora</li>
          <li>Um resumo de quem responde dentro dele — o nome fica fora</li>
          <li>Desde quando e até quando</li>
          <li>O encadeamento dos passos, um selando o anterior</li>
          <li>Quem marcou presença no período, e quem não marcou</li>
        </ul>
        <p className="mt-4 rounded-lg bg-[var(--fundo-3)] p-3 text-[0.8125rem] text-[var(--texto-2)]">
          156 bytes por caso, em espaço de tamanho fixo. Não cabe mais nada nem se
          alguém quisesse colocar.
        </p>
      </div>

      <div className="cartao p-6">
        <p className="text-[0.8125rem] font-semibold uppercase tracking-wider text-[var(--perigo)]">
          Nunca vai, nem cifrado
        </p>
        <ul className="mt-4 space-y-2 text-[0.9375rem] text-[var(--texto-2)]">
          <li>Nome, CPF ou endereço</li>
          <li>O que foi observado</li>
          <li>Laudo, relato ou diagnóstico</li>
          <li>Quem avisou</li>
          <li>O apelido usado no cruzamento</li>
        </ul>
        <p className="mt-4 rounded-lg bg-[var(--fundo-3)] p-3 text-[0.8125rem] text-[var(--texto-2)]">
          O registro é permanente, e a criança de hoje será adulta por décadas.
          Guardar prova é seguro para sempre; guardar segredo cifrado, não.
        </p>
      </div>
    </div>

    <div className="mt-7">
      <Punch>
        A blockchain guarda <F>quem devia agir e até quando</F>. A criptografia guarda{" "}
        <F>tudo o que diz respeito à criança</F>. Nenhuma das duas guarda as duas
        coisas.
      </Punch>
    </div>
  </Slide>,

  /* 8 — por que blockchain */
  <Slide key="porque">
    <Rotulo>Por que blockchain, e não um banco de dados com histórico</Rotulo>
    <Titulo>
      O registro é contra quem guardaria o banco.
    </Titulo>

    <div className="mt-8 grid grid-cols-3 gap-4">
      {[
        {
          n: "1",
          t: "Não existe operador confiável",
          d: "No governo federal, é quem o TCU audita. No município, é a parte cujo prazo está sendo medido. No Conselho Tutelar, é quem responderia pela omissão. Inviolabilidade concedida por quem tem interesse em apagar é promessa, não garantia.",
        },
        {
          n: "2",
          t: "“Sigilosa” derruba o banco central",
          d: "Um operador único que cruza saúde, educação e assistência passa a deter o histórico de risco de todas as crianças do país. É o pior desfecho possível em termos de LGPD.",
        },
        {
          n: "3",
          t: "Volume e custo",
          d: "5.570 municípios, seis registros assinados por caso e uma marca de presença por ciclo: milhões de gravações pequenas por ano. Solana entrega isso por fração de centavo, com confirmação em menos de um segundo.",
        },
      ].map((p) => (
        <div key={p.n} className="cartao flex flex-col p-5">
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--borda)] text-[0.9375rem] font-semibold text-[var(--texto-3)]">
            {p.n}
          </span>
          <p className="mt-3 text-[1.0625rem] font-semibold leading-snug">{p.t}</p>
          <p className="mt-2 text-[0.875rem] leading-snug text-[var(--texto-2)]">
            {p.d}
          </p>
        </div>
      ))}
    </div>

    <p className="mt-8 max-w-4xl text-[1.0625rem] leading-relaxed text-[var(--texto-2)]">
      O efeito prático: um promotor, um vereador ou um jornalista confere sozinho —{" "}
      <F>sem pedir acesso a sistema nenhum</F>, e sem precisar confiar em quem seria
      cobrado.
    </p>
  </Slide>,

  /* 9 — demo */
  <Slide key="demo" className="justify-center">
    <Rotulo>Está funcionando</Rotulo>
    <h2 className="mt-6 text-[3.25rem] font-semibold leading-tight tracking-tight">
      O protótipo, ao vivo.
    </h2>
    <p className="mt-6 max-w-3xl text-[1.25rem] leading-relaxed text-[var(--texto-2)]">
      O programa está publicado e rodando na rede de testes da Solana. Cada passo da
      demonstração gera uma <F>transação real</F>, com link para conferência pública
      no explorador da rede.
    </p>
    <div className="mt-8 flex gap-3 text-[0.9375rem] text-[var(--texto-2)]">
      {["Cruzamento cifrado", "Caso com dono e prazo", "Escalonamento", "Painel público"].map(
        (t) => (
          <span
            key={t}
            className="rounded-full border border-[var(--borda)] bg-[var(--fundo-2)] px-4 py-1.5"
          >
            {t}
          </span>
        ),
      )}
    </div>
  </Slide>,

  /* 10 — próximos passos e apoio */
  <Slide key="futuro">
    <Rotulo>O caminho</Rotulo>
    <Titulo>Próximos passos e o uso do apoio.</Titulo>

    <div className="mt-8 grid grid-cols-2 gap-5">
      <div>
        <p className="text-[0.8125rem] font-semibold uppercase tracking-wider text-[var(--c-educacao)]">
          Próximos passos
        </p>
        <ul className="mt-4 space-y-3 text-[0.9375rem] leading-snug text-[var(--texto-2)]">
          <li>
            <F>Completar a camada de prova de conhecimento zero</F> — a prova é gerada
            no aparelho do profissional e verificada dentro do programa na Solana.
          </li>
          <li>
            <F>Validação em campo</F> com conselheiros tutelares e técnicos de CREAS,
            para ajustar o fluxo à rotina real.
          </li>
          <li>
            <F>Conformidade formal</F> com LGPD e ECA, com parecer de quem entende do
            assunto.
          </li>
        </ul>
      </div>

      <div>
        <p className="text-[0.8125rem] font-semibold uppercase tracking-wider text-[var(--c-creas)]">
          Como usaríamos o apoio
        </p>
        <ol className="mt-4 space-y-3 text-[0.9375rem] leading-snug text-[var(--texto-2)]">
          <li>
            <F>Ouvir antes de construir</F> — pesquisa com quem opera a rede, antes de
            escrever mais código.
          </li>
          <li>
            <F>Consultoria regulatória</F> — LGPD, ECA e Lei 13.431/2017 desenhadas
            junto com especialistas.
          </li>
          <li>
            <F>Um piloto municipal</F> — um município, uma rede completa, métricas
            públicas.
          </li>
          <li>
            <F>Integração com o que já existe</F> — SIPIA, SINAN, Prontuário SUAS,
            Educacenso. O Elo não substitui nenhum deles.
          </li>
        </ol>
      </div>
    </div>
  </Slide>,

  /* 11 — fecho */
  <Slide key="fecho" className="justify-center">
    <p className="max-w-4xl text-[2.5rem] font-medium leading-tight tracking-tight">
      O Elo não resolve o caso.
      <br />
      Ele torna impossível o caso sumir{" "}
      <span className="text-[var(--c-saude)]">sem que alguém responda por isso</span>.
    </p>
    <div className="mt-11 flex items-end justify-between gap-12 border-t border-[var(--borda)] pt-7">
      <div>
        <p className="text-[3.5rem] font-semibold leading-none tracking-tight">Elo</p>
        <p className="mt-3 text-[0.875rem] text-[var(--texto-3)]">
          UNICEF Youth Challenge Blockchain 2026 · Proteção à Infância
        </p>
      </div>
      <div className="text-right">
        <p className="text-[0.75rem] font-semibold uppercase tracking-[0.18em] text-[var(--texto-3)]">
          Equipe
        </p>
        <div className="mt-3 space-y-2.5">
          {[
            {
              nome: "Thiago Rocha Duarte",
              papel: "Engenheiro de Criptografia e Desenvolvedor",
            },
            {
              nome: "Laís Peres Pereira",
              papel: "Design, Marketing e Comunicação",
            },
          ].map((p) => (
            <div key={p.nome}>
              <p className="text-[1.0625rem] font-medium leading-tight">{p.nome}</p>
              <p className="text-[0.875rem] leading-tight text-[var(--texto-2)]">
                {p.papel}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  </Slide>,
];

/* ----------------------------------------------------------------- tela */

export default function Deck() {
  const [i, setI] = useState(0);
  const [escala, setEscala] = useState(1);
  const [chrome, setChrome] = useState(true);

  useEffect(() => {
    const calcular = () =>
      setEscala(
        Math.min(window.innerWidth / LARGURA, window.innerHeight / ALTURA),
      );
    calcular();
    window.addEventListener("resize", calcular);
    return () => window.removeEventListener("resize", calcular);
  }, []);

  const ir = useCallback(
    (passo: number) =>
      setI((v) => Math.min(SLIDES.length - 1, Math.max(0, v + passo))),
    [],
  );

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (["ArrowRight", "ArrowDown", " ", "PageDown", "Enter"].includes(e.key)) {
        e.preventDefault();
        ir(1);
      } else if (["ArrowLeft", "ArrowUp", "PageUp"].includes(e.key)) {
        e.preventDefault();
        ir(-1);
      } else if (e.key === "Home") setI(0);
      else if (e.key === "End") setI(SLIDES.length - 1);
      else if (e.key.toLowerCase() === "c") setChrome((v) => !v);
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [ir]);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden bg-[var(--fundo)]"
      onClick={(e) => ir(e.clientX < window.innerWidth * 0.15 ? -1 : 1)}
    >
      <div
        style={{
          width: LARGURA,
          height: ALTURA,
          transform: `scale(${escala})`,
          flex: "none",
        }}
      >
        {SLIDES[i]}
      </div>

      {chrome && (
        <>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[3px] bg-[var(--fundo-3)]">
            <div
              className="h-full bg-[var(--texto-2)] transition-[width] duration-300"
              style={{ width: `${((i + 1) / SLIDES.length) * 100}%` }}
            />
          </div>
          <p className="pointer-events-none absolute bottom-4 right-5 font-mono text-xs text-[var(--texto-3)]">
            {i + 1}/{SLIDES.length}
          </p>
        </>
      )}
    </div>
  );
}
