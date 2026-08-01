"use client";

/**
 * A identidade do profissional que denuncia.
 *
 * Ela nasce e vive **no aparelho dele**. Nunca é enviada para lugar nenhum —
 * nem para o nosso servidor, nem para a rede. O que sai daqui é o compromisso,
 * que é público e não permite voltar ao segredo, e depois a prova, que não
 * permite descobrir de quem é.
 *
 * Guardar no navegador é a simplificação de protótipo: num sistema de verdade a
 * chave ficaria no aplicativo do profissional ou num cartão, com recuperação
 * pensada — perder o navegador aqui significa perder a credencial.
 */

const CHAVE = "elo.denuncia.identidade.v1";

export interface IdentidadeLocal {
  /** Só existe na memória desta aba. Não vai para o servidor. */
  segredo: string;
  /** Público: é isto que entra na árvore de credenciados. */
  compromisso: string;
}

/** Carrega a identidade guardada, ou cria uma nova e guarda. */
export async function obterIdentidade(): Promise<IdentidadeLocal> {
  const { Identity } = await import("@semaphore-protocol/identity");

  const guardado = ler();
  if (guardado) {
    const id = Identity.import(guardado);
    return { segredo: guardado, compromisso: id.commitment.toString() };
  }

  const id = new Identity();
  const segredo = id.export();
  gravar(segredo);
  return { segredo, compromisso: id.commitment.toString() };
}

/** Descarta a identidade. Serve para reencenar a demonstração do zero. */
export function esquecerIdentidade(): void {
  try {
    localStorage.removeItem(CHAVE);
  } catch {
    // modo privado: não havia nada guardado mesmo
  }
}

function ler(): string | null {
  try {
    return localStorage.getItem(CHAVE);
  } catch {
    return null;
  }
}

function gravar(valor: string): void {
  try {
    localStorage.setItem(CHAVE, valor);
  } catch {
    // modo privado ou armazenamento cheio: a demonstração segue em memória
  }
}
