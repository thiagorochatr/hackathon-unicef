/**
 * A casca dos portais dos órgãos.
 *
 * O que ela **não** tem é o que importa: nenhuma navegação do Elo, nenhum
 * vestígio do nosso produto. Quem abre `/escola` precisa ter a impressão de
 * estar no sistema da secretaria de educação — porque na vida real é isso que
 * ele é, e porque um menu do Elo por cima faria o site voltar a parecer o banco
 * central único que a `/solucao` passa uma tabela inteira criticando.
 *
 * O aviso de dados fictícios vem do layout raiz e continua em toda tela. Simular
 * sistema de governo sem esse aviso seria pior do que não simular.
 */
export default function LayoutOrgaos({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
