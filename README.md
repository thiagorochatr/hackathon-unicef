# Custódia verificável — rede de proteção à infância

Protótipo para o **UNICEF Youth Challenge Blockchain 2026**, pilar Proteção à Infância.

Duas ideias em uma:

1. **Cruzar sinais entre setores sem que nenhum veja o dado do outro.** Saúde, educação e
   assistência mandam um sinal cifrado sobre a mesma criança. Se a soma atinge 2, sai um alerta.
   Nenhum setor enxerga o registro do outro. O sinal pode vir do sistema do órgão ou de um
   profissional que **provou ser credenciado sem se identificar** — e nesse caso ele escolhe entre
   apontamento, que pesa 1, e denúncia, que pesa 2 e basta sozinha.
2. **Fazer o repasse do caso deixar rastro.** Cada passo — quem recebeu, quem assumiu, qual o prazo,
   para quem passou — vira uma transação assinada na Solana. Se o prazo vence e ninguém aceita, o
   caso vai sozinho para o Ministério Público.

**Nenhum dado de criança vai para a rede, nem cifrado.** O registro é permanente e a criança de hoje
ainda vai ser adulta por uns 80 anos. O que sobe é só um número opaco, chaves de órgãos, hashes e
horários.

## O que já funciona de verdade e o que ainda é encenação

| Parte | Situação |
|---|---|
| Programa na Solana devnet (abrir, passar adiante, aceitar, ir ao MP, encerrar, marcar presença) | **real e verificável no explorer** |
| Telas de custódia lendo o caso da rede | **real** — a tela pergunta à rede a cada 3 s |
| Cruzamento cifrado dos sinais | **real** — Microsoft SEAL (BFV), soma feita sem nenhuma chave secreta |
| Apelido da criança | **real** — com chave de serviço, não um resumo simples do CPF |
| Apontar a criança sem contar qual é | **real** — OPRF (RFC 9497) sobre ristretto255; o identificador não sai do navegador de quem emite |
| Chave repartida entre órgãos | ainda não — a chave do comitê existe inteira em um lugar só |
| Comparação dentro do envelope | **real** — o comitê aprende só "passou" ou "não passou", nunca a contagem |
| Marcar presença de cada órgão | **real** — um selo por período gravado na Solana; a falta dele vira alerta |
| Sinal protegido (ZK) | **real** — prova Semaphore gerada no navegador em ~0,6 s e conferida on-chain por ~110 mil unidades de computação |
| Apontamento (peso 1) × denúncia (peso 2) | **real** — o peso vai cifrado no envelope; uma denúncia sozinha atinge o limiar |
| Lista de credenciados conferível | **real** — cada credenciamento vai a evento; qualquer pessoa refaz a árvore lendo a cadeia |
| Grupo grande o bastante para esconder alguém | ainda não — na demonstração são poucas pessoas |

Programa na devnet: [`FsvcQn5BsZuC1CrqMtxNGFhohWFVxJq4jDnzwKgw493E`](https://explorer.solana.com/address/FsvcQn5BsZuC1CrqMtxNGFhohWFVxJq4jDnzwKgw493E?cluster=devnet)

## A criptografia, em uma olhada

Os arquivos estão separados de propósito, para que "o nó não tem a chave" seja
verdade no código e não promessa em slide:

```
src/lib/fhe/parametros.ts     parâmetros públicos do esquema (BFV, grau 4096)
src/lib/fhe/comite.ts         única parte com a chave — ela NÃO é exportada daqui
src/lib/fhe/orgao.ts          fecha envelopes usando só a chave pública
src/lib/fhe/noDeCruzamento.ts soma envelopes; não importa `comite` em lugar nenhum
src/lib/pseudonimo.ts         apelido da criança via OPRF, com chave de serviço
```

E, do lado da denúncia protegida:

```
programs/custodia/src/zk.rs                 confere a prova dentro da rede
programs/custodia/src/chave_verificacao.rs  chave da cerimônia pública do Semaphore
app/src/lib/zk/prova.ts                     gera a prova no navegador de quem denuncia
scripts/zk/formato.ts                       converte a prova para o formato da cadeia
```

A prova tem zero-knowledge perfeito: é estatisticamente independente de quem a produziu.
Um computador quântico daqui a cinquenta anos olhando uma prova de hoje não aprende nada
sobre o denunciante — isso não é "difícil de quebrar", é impossível. O que o quântico
quebraria é a solidez, ou seja, forjar provas novas. Problema para frente, não para trás.

A chave de verificação vem da **cerimônia pública do Semaphore**, e não de uma cerimônia
nossa. Ninguém precisa confiar em quem gerou aqueles parâmetros, porque não fomos nós.

Cada envelope tem centenas de milhares de letras. A comparação com o limite também
acontece dentro do envelope: o nó calcula `r · s · (s−1)` sobre os envelopes fechados,
com `r` sorteado. Dá zero quando a soma é 0 ou 1, e um número aleatório quando é 2 ou
mais. **O comitê aprende exatamente um bit** — passou ou não passou — e não a contagem.

Dá para conferir isso na tela: o mesmo conjunto de sinais, cruzado duas vezes, devolve
números diferentes e o mesmo veredito.

## Como rodar

Precisa de: Node 20+, pnpm, Rust, Solana CLI e Anchor 1.1.2.

```bash
# 1. dependências
pnpm install
cd app && pnpm install && cd ..

# 2. chaves dos órgãos (ficam fora do Git) e saldo na devnet
mkdir -p keys
for n in comite ubs escola cras creas ct mp; do
  solana-keygen new --no-bip39-passphrase --silent -o keys/$n.json
  solana transfer "$(solana address -k keys/$n.json)" 0.5 --allow-unfunded-recipient -u devnet
done

# 3. compilar e publicar
anchor build
solana program deploy target/deploy/custodia.so \
  --program-id target/deploy/custodia-keypair.json -u devnet

# 4. cadastrar os órgãos e apontar o Ministério Público
ANCHOR_PROVIDER_URL=${RPC_URL:-https://api.devnet.solana.com} \
ANCHOR_WALLET=$HOME/.config/solana/id.json \
pnpm exec ts-node scripts/preparar-devnet.ts

# 5. testes (rodam contra a devnet; podem ser repetidos)
anchor test --skip-local-validator --skip-deploy --skip-build

# 6. a aplicação — funciona da raiz ou de dentro de app/
pnpm dev
```

Atalhos disponíveis na raiz, todos delegando para `app/` quando é o caso:

| Comando | O que faz |
|---|---|
| `pnpm dev` | sobe a aplicação em http://localhost:3000 |
| `pnpm build` | compila a aplicação |
| `pnpm lint` | confere o código da aplicação |
| `pnpm test` | roda os 8 testes do programa contra a devnet |
| `pnpm preparar:devnet` | cadastra os órgãos e aponta o Ministério Público |
| `pnpm deploy:devnet` | publica o programa na devnet |

As chaves dos órgãos ficam **no servidor** e nunca chegam ao navegador. Isso não é só cuidado de
protótipo: é como funcionaria de verdade, com o sistema do órgão assinando, não o computador de quem
atende.

## Endereço da rede (RPC)

Por padrão tudo aponta para `https://api.devnet.solana.com`, que é o endereço público da devnet.
Ele funciona, e é compartilhado por todo mundo que testa em Solana — o que significa que recusa
requisições com frequência. Num dia de desenvolvimento foram **3.400 recusas**, e com duas telas
abertas ao mesmo tempo a demonstração travou: a tela do caso relê a rede sozinha, cada leitura custa
três chamadas, e seis portais fazem isso em paralelo.

Para uma apresentação, use um endereço dedicado. Helius, QuickNode, Alchemy e outros dão uma faixa
gratuita que sobra para isto. Definida a variável, **tudo passa a usá-la** — aplicação, scripts e o
gerador de variáveis de ambiente:

```bash
export RPC_URL='https://devnet.helius-rpc.com/?api-key=SUA-CHAVE'
```

Para a aplicação, a variável entra no mesmo arquivo das chaves:

```bash
echo "RPC_URL=$RPC_URL" >> app/.env.local     # local
```

Na Vercel, é mais uma variável de ambiente do projeto, ao lado das `CHAVE_*`.

O `Anchor.toml` é a única exceção: ele não lê variável de ambiente, então nos testes e no deploy o
endereço vai na linha de comando.

```bash
ANCHOR_PROVIDER_URL=$RPC_URL anchor test --skip-local-validator --skip-deploy --skip-build
anchor deploy --provider.cluster $RPC_URL
```

**O endereço costuma trazer a chave de API dentro dele** — por isso ele é variável de ambiente e
não constante no código, e por isso `.env.local` está fora do versionamento.

Independentemente do endereço escolhido, a aplicação repete sozinha quando leva uma recusa por
excesso, com espera crescente e respeitando o `Retry-After` que o servidor mandar. Um RPC dedicado
também tem limite, só que muito mais alto.

## Publicar na Vercel

O projeto Next fica em `app/`, não na raiz do repositório. Ao importar na Vercel, mude o campo
**Root Directory** para `app` — sem isso o build falha, porque ela procura o `package.json` do Next
na raiz e encontra o do Anchor.

A pasta `keys/` fica fora do versionamento, então em produção as chaves vêm de variáveis de
ambiente. Para gerar todas de uma vez, no formato que a Vercel aceita colar:

```bash
bash scripts/chaves-para-env.sh
```

Isso imprime `CHAVE_COMITE`, `CHAVE_UBS`, `CHAVE_ESCOLA`, `CHAVE_CRAS`, `CHAVE_CREAS`, `CHAVE_CT`,
`CHAVE_MP`, mais `CHAVE_APELIDO` e `RPC_URL`. O mesmo arquivo serve para rodar local sem a pasta
`keys/`: `bash scripts/chaves-para-env.sh > app/.env.local`.

### Por que guardar chave privada em variável de ambiente aqui é aceitável

Normalmente não seria. Neste caso são chaves de **devnet**, com saldo sem valor, criadas só para a
demonstração e que nunca serão usadas em mainnet — o pior que alguém faz com elas é gastar SOL de
teste. Num sistema de verdade cada órgão assinaria com a própria chave, dentro da própria
infraestrutura, e nenhuma delas passaria por aqui. É uma escolha consciente de protótipo, e está
registrada como tal.

## Três armadilhas de ambiente (custaram tempo)

1. **O `avm` não consegue baixar o Anchor.** O download do binário pronto estoura o tempo limite
   interno dele. A saída foi compilar da fonte:
   `cargo install --git https://github.com/coral-xyz/anchor --tag v1.1.2 anchor-cli --locked`

2. **O `anchor build` pede platform-tools v1.52 e o download também falha.** Se a v1.54 já estiver
   em `~/.cache/solana`, dá para apontar uma para a outra:
   `ln -s ~/.cache/solana/v1.54 ~/.cache/solana/v1.52`

3. **Por isso os testes rodam na devnet, não em rede local.** O binário gerado com a v1.54 usa uma
   versão de SBPF que o `solana-test-validator` 4.1.1 não aceita, mas a devnet aceita. Efeito
   colateral bom: os testes produzem transações reais, conferíveis no explorer.

O Rust precisa ser 1.85 ou mais novo (algumas dependências usam edition 2024). Se o padrão da
máquina for mais antigo: `rustup override set 1.97.1` dentro do projeto.

## Organização

```
programs/custodia/src/lib.rs   programa da Solana
tests/custodia.ts              8 testes, rodam contra a devnet
scripts/preparar-devnet.ts     cadastra os órgãos e define o MP
app/                           aplicação Next.js
  src/lib/cadeia.ts            acesso ao programa (só servidor)
  src/lib/fhe/                 criptografia do cruzamento (só servidor)
  src/app/api/custodia/        rota que assina as transações
  src/app/api/cruzamento/      rota que cifra, soma e avalia
  src/app/api/painel/          rota que grava e lê a presença dos órgãos
  src/app/api/denuncia/        credencia profissionais e repassa a denúncia protegida
  src/lib/zk/                  identidade, prova no navegador e leitura da lista
  public/zk/                   artefatos do circuito Semaphore, servidos por nós
  src/app/solucao/             a solução completa explicada
keys/                          chaves dos órgãos — FORA DO GIT
```

Os dados da demonstração são todos inventados. Nenhuma criança real aparece em lugar nenhum.
