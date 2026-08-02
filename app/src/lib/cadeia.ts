import "server-only";

import * as anchor from "@coral-xyz/anchor";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  VersionedTransaction,
} from "@solana/web3.js";
import { readFileSync } from "fs";
import { join } from "path";
import idl from "@/idl/custodia.json";
import type { Custodia } from "@/idl/custodia-tipos";
import type { Papel } from "./tipos";

/**
 * Acesso ao programa na devnet. Roda só no servidor: as chaves das instituições
 * ficam aqui e nunca chegam ao navegador. Isso também espelha a arquitetura
 * real, em que quem assina é o sistema da instituição, não o computador de
 * quem atende.
 */

/**
 * O endereço da rede, num lugar só.
 *
 * O padrão é a devnet pública, que é compartilhada por todo mundo que testa em
 * Solana e recusa requisições com frequência — foram 3.400 recusas num dia de
 * desenvolvimento, e com duas telas abertas a demonstração travou. Defina
 * `RPC_URL` com um endereço dedicado (Helius, QuickNode e outros têm faixa
 * gratuita) e tudo passa a usá-lo: aplicação, scripts e testes.
 *
 * O endereço costuma trazer uma chave de API dentro dele. Por isso ele é
 * variável de ambiente e não constante no código — e por isso `.env.local` está
 * fora do versionamento.
 */
export const RPC = process.env.RPC_URL ?? "https://api.devnet.solana.com";

/** Se ainda estamos na rede compartilhada, onde a recusa é rotina. */
export const RPC_COMPARTILHADO = RPC.includes("api.devnet.solana.com");

/**
 * Uma recusa por excesso não é erro: é para tentar de novo daqui a pouco.
 *
 * A biblioteca já repete algumas vezes sozinha, mas desiste rápido demais para o
 * ritmo da devnet pública. Aqui a espera cresce a cada tentativa, e respeita o
 * `Retry-After` quando o servidor manda um.
 *
 * Vale para qualquer endereço: um RPC dedicado também tem limite, só que muito
 * mais alto. Isto é o que faz a diferença entre a tela recarregar sozinha e a
 * tela mostrar erro.
 */
const ESPERAS_MS = [400, 1200, 3000, 6000];

const buscarComPaciencia: typeof fetch = async (entrada, opcoes) => {
  let ultima: Response | undefined;
  for (let tentativa = 0; tentativa <= ESPERAS_MS.length; tentativa += 1) {
    const r = await fetch(entrada, opcoes);
    if (r.status !== 429) return r;
    ultima = r;
    if (tentativa === ESPERAS_MS.length) break;
    const pedido = Number(r.headers.get("retry-after")) * 1000;
    const espera = Number.isFinite(pedido) && pedido > 0 ? pedido : ESPERAS_MS[tentativa];
    await new Promise((r) => setTimeout(r, espera));
  }
  return ultima!;
};

const opcoesDaConexao = {
  commitment: "confirmed" as const,
  fetch: buscarComPaciencia,
};
const DIR_CHAVES = process.env.KEYS_DIR ?? join(process.cwd(), "..", "keys");

const enc = new TextEncoder();
const cache = new Map<string, Keypair>();

/**
 * As chaves vêm de dois lugares, nesta ordem:
 *
 * 1. variável de ambiente `CHAVE_<NOME>` — usada quando hospedado, onde não
 *    existe a pasta `keys/` (ela fica fora do versionamento de propósito);
 * 2. arquivo `keys/<nome>.json` — usado na máquina de quem desenvolve.
 *
 * São chaves de devnet, com saldo sem valor, criadas só para a demonstração e
 * que nunca serão usadas em mainnet. Guardá-las como variável de ambiente é uma
 * escolha consciente para este protótipo, não descuido: num sistema de verdade
 * cada órgão assinaria com a própria chave, dentro da própria infraestrutura.
 */
function carregarChave(nome: string): Uint8Array {
  const daVariavel = process.env[`CHAVE_${nome.toUpperCase()}`];
  const bruto = daVariavel ?? lerDoArquivo(nome);

  let bytes: number[];
  try {
    bytes = JSON.parse(bruto);
  } catch {
    throw new Error(
      `chave "${nome}" mal formada: era esperado um vetor de bytes em JSON, como [12,34,...]`,
    );
  }
  if (!Array.isArray(bytes) || bytes.length !== 64) {
    throw new Error(
      `chave "${nome}" tem ${Array.isArray(bytes) ? bytes.length : "?"} bytes; o esperado são 64`,
    );
  }
  return Uint8Array.from(bytes);
}

function lerDoArquivo(nome: string): string {
  try {
    return readFileSync(join(DIR_CHAVES, `${nome}.json`), "utf8");
  } catch {
    throw new Error(
      `chave "${nome}" não encontrada. Defina a variável de ambiente CHAVE_${nome.toUpperCase()} ` +
        `ou deixe o arquivo em ${DIR_CHAVES}/${nome}.json. ` +
        `Para gerar as variáveis a partir dos arquivos: bash scripts/chaves-para-env.sh`,
    );
  }
}

function chave(nome: string): Keypair {
  const existente = cache.get(nome);
  if (existente) return existente;
  const kp = Keypair.fromSecretKey(carregarChave(nome));
  cache.set(nome, kp);
  return kp;
}

/** O comitê é quem abre o caso depois que o cruzamento acusa convergência. */
export const comite = () => chave("comite");
export const instituicao = (papel: Papel) => chave(papel);

/**
 * Carteira mínima em cima de uma Keypair. O `Wallet` do Anchor não é exportado
 * no build ESM da 0.32, e a interface exigida pelo provider é só esta.
 */
class CarteiraLocal {
  constructor(readonly payer: Keypair) {}

  get publicKey(): PublicKey {
    return this.payer.publicKey;
  }

  async signTransaction<T extends Transaction | VersionedTransaction>(tx: T): Promise<T> {
    if (tx instanceof VersionedTransaction) tx.sign([this.payer]);
    else tx.partialSign(this.payer);
    return tx;
  }

  async signAllTransactions<T extends Transaction | VersionedTransaction>(
    txs: T[],
  ): Promise<T[]> {
    return Promise.all(txs.map((t) => this.signTransaction(t)));
  }
}

export function programa(assinante: Keypair): Program<Custodia> {
  const conexao = new Connection(RPC, opcoesDaConexao);
  const provider = new AnchorProvider(conexao, new CarteiraLocal(assinante), {
    commitment: "confirmed",
  });
  return new Program(idl as anchor.Idl, provider) as unknown as Program<Custodia>;
}

export const conexao = () => new Connection(RPC, opcoesDaConexao);

// --- endereços derivados -----------------------------------------------------

export const ID_PROGRAMA = new PublicKey(idl.address);

export const pdaConfig = () =>
  PublicKey.findProgramAddressSync([enc.encode("config")], ID_PROGRAMA)[0];

export const pdaInstituicao = (autoridade: PublicKey) =>
  PublicKey.findProgramAddressSync(
    [enc.encode("inst"), autoridade.toBuffer()],
    ID_PROGRAMA,
  )[0];

export const pdaCaso = (alertaId: Buffer) =>
  PublicKey.findProgramAddressSync([enc.encode("caso"), alertaId], ID_PROGRAMA)[0];

export const pdaAberturas = (comite: PublicKey) =>
  PublicKey.findProgramAddressSync(
    [enc.encode("aberturas"), comite.toBuffer()],
    ID_PROGRAMA,
  )[0];

export const pdaAncora = (inst: PublicKey, periodo: number) => {
  const p = Buffer.alloc(4);
  p.writeUInt32LE(periodo);
  return PublicKey.findProgramAddressSync(
    [enc.encode("ancora"), inst.toBuffer(), p],
    ID_PROGRAMA,
  )[0];
};

// --- tradução entre chave pública e papel -----------------------------------

const PAPEIS_COM_CHAVE: Papel[] = ["ubs", "escola", "cras", "creas", "ct", "mp"];

export function papelDe(chavePublica: PublicKey): Papel | null {
  const alvo = chavePublica.toBase58();
  for (const p of PAPEIS_COM_CHAVE) {
    if (instituicao(p).publicKey.toBase58() === alvo) return p;
  }
  return null;
}

export const explorador = (assinatura: string) =>
  `https://explorer.solana.com/tx/${assinatura}?cluster=devnet`;

export const exploradorConta = (endereco: string) =>
  `https://explorer.solana.com/address/${endereco}?cluster=devnet`;
