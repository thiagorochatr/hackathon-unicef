/**
 * Aquece a lista de credenciados quando o servidor sobe.
 *
 * ## Por que isto existe
 *
 * A árvore de credenciados é reconstruída lendo os eventos da cadeia, um por
 * um. É o que sustenta a frase "qualquer pessoa refaz esta lista sem pedir
 * acesso a sistema nenhum" — e é honesto que custe: ler a história é o preço de
 * não depender de nós.
 *
 * O problema é quando esse preço cai no colo de quem está usando. A leitura fria
 * leva dezenas de segundos, porque a rede pública de testes limita requisições e
 * cada recusa vira uma espera. Se ela acontecesse no clique de "enviar", o
 * professor ficaria olhando para um botão parado justamente no momento em que
 * ele já hesita.
 *
 * Fazendo aqui, o custo cai no arranque do servidor, quando não há ninguém
 * esperando. Depois disso o resultado fica guardado e a resposta é imediata.
 *
 * **Num sistema de verdade isto seria um indexador**, não um aquecimento: um
 * serviço que acompanha os eventos conforme acontecem e mantém a árvore pronta.
 * Fica declarado como simplificação de protótipo.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { SETORES } = await import("./lib/tipos");
  const { lerGrupo } = await import("./lib/zk/grupo");

  // Em segundo plano, e sem derrubar o servidor se a rede estiver fora.
  void (async () => {
    for (const setor of SETORES) {
      try {
        const inicio = Date.now();
        const grupo = await lerGrupo(setor);
        if (grupo) {
          // Grupo vazio não tem raiz para refazer, e isso não é divergência.
          const divergiu =
            grupo.membros > 0 && grupo.raiz !== grupo.raizRefeita;
          console.log(
            `[credenciados] ${setor}: ${grupo.membros} folhas em ${Date.now() - inicio} ms` +
              (divergiu ? " — RAIZ NÃO CONFERE" : ""),
          );
        }
      } catch (e) {
        console.log(`[credenciados] ${setor}: não deu para ler agora (${String(e).slice(0, 80)})`);
      }
    }
  })();
}
