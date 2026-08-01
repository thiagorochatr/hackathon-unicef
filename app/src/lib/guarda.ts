import "server-only";
import { Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { conexao } from "./cadeia";
import { registrar } from "./log";

/**
 * Limites para o protótipo não ser drenado por quem descobrir o endereço.
 *
 * ## O problema que isto resolve
 *
 * Neste protótipo **o servidor assina e paga por tudo**. Cada caso aberto cria
 * uma conta na rede, e conta na rede custa aluguel. Sem limite, um laço de
 * `POST /api/custodia {"acao":"abrir"}` secava a carteira do comitê em poucos
 * minutos — e com ela morria a demonstração inteira, justamente no dia em que
 * alguém fosse olhar.
 *
 * ## O que isto **não** é
 *
 * Não é a solução de arquitetura, é o curativo do protótipo. Num sistema de
 * verdade cada órgão assina com a própria chave, dentro da própria
 * infraestrutura, e paga pelo que faz. O problema de alguém gastar o dinheiro
 * alheio simplesmente não existe, porque não há dinheiro alheio: quem age,
 * paga. Isso já está declarado no README como escolha consciente de protótipo.
 *
 * O que existe aqui são três cercas, e a terceira é a que salva a apresentação.
 */

/**
 * Quantas escritas cada chamador consegue por minuto, por faixa de custo.
 *
 * A separação existe porque as ações custam coisas muito diferentes: abrir um
 * caso cria conta e paga aluguel; aceitar um repasse paga só a taxa, que é
 * quatrocentas vezes menor. Um teto único seria frouxo para uma e apertado para
 * a outra.
 */
const POR_CHAMADOR_MINUTO = { cria_conta: 4, so_taxa: 20 };

/**
 * Teto global por hora, em **dinheiro** e não em número de chamadas.
 *
 * Esta é a correção que importa. Contar chamadas trata como iguais uma que
 * gasta 0,0022 e outra que gasta 0,000005 — e com isso um teto que parecia
 * apertado ainda deixava a carteira secar em poucas horas. Limitar o gasto
 * limita o estrago diretamente.
 *
 * O valor cobre com folga qualquer demonstração: dá para abrir mais de vinte
 * casos por hora, e nenhuma apresentação abre cinco.
 */
const TETO_GASTO_HORA_SOL = 0.06;

/** O que cada tipo de escrita custa, para o teto acima saber contar. */
export const CUSTO = {
  /** Abre caso: aluguel do espaço mais a taxa. */
  abrir_caso: 0.002211,
  /** Registra sinal protegido: aluguel do anulador mais a taxa. */
  registrar_sinal: 0.001014,
  /** Marca presença do órgão no período: aluguel da âncora mais a taxa. */
  ancorar: 0.001487,
  /** Só a taxa de assinatura. */
  so_taxa: 0.000005,
} as const;

/**
 * Piso de saldo. Abaixo disto o sistema recusa gastar e diz por quê.
 *
 * Existe para a demonstração **degradar com aviso** em vez de morrer no meio
 * com um erro de rede incompreensível. Sobra o suficiente para uma
 * apresentação inteira depois que o alarme toca.
 */
const PISO_SOL = 0.05;

/** Chamadas por minuto em operações caras que não tocam a rede. */
const POR_CHAMADOR_MINUTO_CARO = 30;

type Balde = { marcas: number[] };

const global_ = globalThis as unknown as {
  __guarda?: {
    baldes: Map<string, Balde>;
    gastos: { em: number; sol: number }[];
    saldos: Map<string, { lamports: number; em: number }>;
  };
};
global_.__guarda ??= { baldes: new Map(), gastos: [], saldos: new Map() };
const g = global_.__guarda;

export class LimiteExcedido extends Error {}

/** Identifica quem chamou. Atrás de proxy, o cabeçalho padrão. */
export function chamador(req: Request): string {
  const encaminhado = req.headers.get("x-forwarded-for");
  if (encaminhado) return encaminhado.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "local";
}

function contar(chave: string, janelaMs: number, teto: number): boolean {
  const agora = Date.now();
  const balde = g.baldes.get(chave) ?? { marcas: [] };
  balde.marcas = balde.marcas.filter((m) => agora - m < janelaMs);
  if (balde.marcas.length >= teto) {
    g.baldes.set(chave, balde);
    return false;
  }
  balde.marcas.push(agora);
  g.baldes.set(chave, balde);
  return true;
}

/**
 * Cerca 1 — ritmo por chamador.
 *
 * Não impede um ataque distribuído, e não é para isso que serve: serve para que
 * um laço simples, de uma máquina só, esbarre em algo antes de fazer estrago.
 */
export function limitarChamador(req: Request, acao: string, caro = false): void {
  const teto = caro ? POR_CHAMADOR_MINUTO_CARO : POR_CHAMADOR_MINUTO.so_taxa;
  if (!contar(`${chamador(req)}:${caro ? "caro" : "rede"}`, 60_000, teto)) {
    registrar("app", "chamada barrada pelo limite de ritmo", {
      ação: acao,
      teto: `${teto} por minuto`,
    });
    throw new LimiteExcedido(
      `muitas chamadas seguidas. O protótipo aceita ${teto} por minuto para "${acao}". ` +
        "Espere um pouco e tente de novo.",
    );
  }
}

/**
 * Cerca 2 — teto global por hora.
 *
 * Segura o caso em que o ataque vem de vários lugares. O custo é que uma
 * apresentação muito movimentada poderia esbarrar nele — por isso o teto é bem
 * mais alto do que qualquer demonstração precisa.
 */
function limitarGasto(acao: string, custoSol: number): void {
  const agora = Date.now();
  g.gastos = g.gastos.filter((x) => agora - x.em < 3_600_000);
  const gastoNaHora = g.gastos.reduce((t, x) => t + x.sol, 0);

  if (gastoNaHora + custoSol > TETO_GASTO_HORA_SOL) {
    registrar("app", "escrita barrada pelo teto de gasto", {
      ação: acao,
      "gasto na última hora": `${gastoNaHora.toFixed(4)} SOL`,
      teto: `${TETO_GASTO_HORA_SOL} SOL por hora`,
    });
    throw new LimiteExcedido(
      `o protótipo já gastou ${gastoNaHora.toFixed(4)} SOL nesta hora e parou no teto de ` +
        `${TETO_GASTO_HORA_SOL} SOL. É o limite que impede alguém de esvaziar a carteira.`,
    );
  }
  g.gastos.push({ em: agora, sol: custoSol });
}

/**
 * Cerca 3 — piso de saldo. É esta que salva a apresentação.
 *
 * O saldo é consultado no máximo uma vez por minuto por chave: perguntar à rede
 * a cada transação seria lento e ainda castigaria o limite de requisições.
 */
async function exigirSaldo(pagador: Keypair, acao: string): Promise<void> {
  const chave = pagador.publicKey.toBase58();
  const guardado = g.saldos.get(chave);
  const agora = Date.now();

  let lamports = guardado?.lamports;
  if (!guardado || agora - guardado.em > 60_000) {
    lamports = await conexao().getBalance(pagador.publicKey);
    g.saldos.set(chave, { lamports, em: agora });
  }

  if ((lamports ?? 0) < PISO_SOL * LAMPORTS_PER_SOL) {
    registrar("app", "escrita recusada: saldo no piso", {
      ação: acao,
      saldo: `${((lamports ?? 0) / LAMPORTS_PER_SOL).toFixed(4)} SOL`,
      piso: `${PISO_SOL} SOL`,
    });
    throw new LimiteExcedido(
      `a carteira que paga as transações chegou ao piso de segurança (${PISO_SOL} SOL). ` +
        "O protótipo parou de gastar para não morrer no meio de uma demonstração.",
    );
  }
}

/**
 * Passa pelas três cercas antes de qualquer escrita na rede.
 *
 * Deve ser chamada **antes** de montar a transação, não depois: o objetivo é
 * não gastar, e não descobrir que gastou.
 */
export async function permitirEscrita(
  req: Request,
  acao: string,
  pagador: Keypair,
  custoSol: number = CUSTO.so_taxa,
): Promise<void> {
  // Quem cria conta tem teto de ritmo próprio: é a ação que dói.
  const criaConta = custoSol > CUSTO.so_taxa;
  const teto = criaConta
    ? POR_CHAMADOR_MINUTO.cria_conta
    : POR_CHAMADOR_MINUTO.so_taxa;
  if (!contar(`${chamador(req)}:${criaConta ? "conta" : "taxa"}`, 60_000, teto)) {
    registrar("app", "chamada barrada pelo limite de ritmo", {
      ação: acao,
      teto: `${teto} por minuto`,
    });
    throw new LimiteExcedido(
      `muitas chamadas seguidas. O protótipo aceita ${teto} por minuto para "${acao}". ` +
        "Espere um pouco e tente de novo.",
    );
  }

  limitarGasto(acao, custoSol);
  await exigirSaldo(pagador, acao);
}

/** Esquece o saldo guardado, para o próximo pedido consultar a rede de novo. */
export function esquecerSaldo(pagador: Keypair): void {
  g.saldos.delete(pagador.publicKey.toBase58());
}
