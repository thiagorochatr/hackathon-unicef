#!/usr/bin/env bash
#
# Imprime as chaves dos órgãos no formato de variáveis de ambiente, pronto para
# colar na Vercel — ela aceita várias linhas de uma vez no campo de variáveis.
#
#   bash scripts/chaves-para-env.sh
#   bash scripts/chaves-para-env.sh > app/.env.local   # rodar local sem keys/
#
# São chaves de devnet, com saldo sem valor, criadas só para a demonstração.
# Ainda assim: não cole essa saída em canal público, chat ou captura de tela —
# é com elas que a demonstração inteira assina.

set -euo pipefail
cd "$(dirname "$0")/.."

if [ ! -d keys ]; then
  echo "pasta keys/ não encontrada; rode a partir da raiz do projeto" >&2
  exit 1
fi

for nome in comite ubs escola cras creas ct mp; do
  arquivo="keys/${nome}.json"
  if [ ! -f "$arquivo" ]; then
    echo "faltando: $arquivo" >&2
    exit 1
  fi
  maiusculo=$(printf '%s' "$nome" | tr '[:lower:]' '[:upper:]')
  printf 'CHAVE_%s=%s\n' "$maiusculo" "$(tr -d '[:space:]' < "$arquivo")"
done

# Chave usada para calcular o apelido da criança. Qualquer texto longo serve,
# desde que seja o mesmo em todos os órgãos e não seja adivinhável.
printf 'CHAVE_APELIDO=%s\n' "$(head -c 32 /dev/urandom | base64 | tr -d '=+/')"
printf 'RPC_URL=%s\n' 'https://api.devnet.solana.com'
