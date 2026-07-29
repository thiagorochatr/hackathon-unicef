import "server-only";
import { createHmac } from "crypto";

/**
 * Apelido da criança.
 *
 * Não usamos um resumo simples do CPF: como existem só cem bilhões de CPFs
 * possíveis, qualquer um poderia testar todos e descobrir de quem é cada
 * apelido. Com uma chave de serviço no meio, quem não tem a chave não consegue
 * fazer esse teste.
 *
 * O que ainda falta nesta versão: a chave está inteira em um lugar só. Na
 * versão completa ela é repartida entre instituições, e o apelido é calculado
 * em conjunto — de um jeito em que nem quem calcula fica sabendo qual foi o
 * identificador consultado.
 */

const CHAVE_DEMO = "demonstracao-unicef-2026-nao-usar-em-producao";

export function apelidoDaCrianca(identificador: string): string {
  const chave = process.env.CHAVE_APELIDO ?? CHAVE_DEMO;
  const limpo = identificador.replace(/\D/g, "");
  return createHmac("sha256", chave).update(limpo).digest("hex");
}
