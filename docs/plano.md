# Plano de execução

## Calendário

| Data | Marco |
|---|---|
| **29/07, 23:59** | **Submissão inicial** — formulário + vídeo + imagem (+ protótipo, formalmente opcional) |
| 03/08 | Divulgação do Top 10 |
| 04–05/08 | Mentorias |
| 06/08 | Pitch Day |
| 07/08 | Vencedores |
| 12–13/08 | Blockchain Rio |

Duas sprints, não uma: **Sprint 1** até 29/07 (entrar no Top 10) e **Sprint 2** de 03 a 06/08
(ganhar). O que não couber na primeira vai para a segunda — desde que a primeira deixe o potencial
evidente.

---

## Frente 1 — MVP funcional

### O que o MVP precisa provar (não o que precisa fazer)

Três afirmações. Se o jurado sair acreditando nas três, o MVP cumpriu o papel:

1. **Duas instituições cruzam sinais sem que nenhuma veja o dado da outra.** — resolve "unificada e sigilosa"
2. **O caso nunca fica sem dono, e o prazo corre contra alguém com nome.** — resolve a diluição de responsabilidade
3. **Quem não age fica visível, sem expor nenhuma criança.** — resolve o modo de falha dominante

### Roteiro do demo (o produto é o roteiro)

Um app único com **seletor de papel** — é isso que faz a ideia caber em 3 minutos.

| # | Tela | O que o jurado vê |
|---|---|---|
| 1 | **UBS** | Registra um sinal de risco. Ao enviar, mostra o que sai: pseudônimo + ciphertext. |
| 2 | **Escola** | Registra sinal independente sobre a mesma criança. Não sabe que a UBS existe. |
| 3 | **Nó de cruzamento** | Mostra os dois ciphertexts **crus na tela** e a soma homomórfica. Limiar 2 atingido → alerta. Nada foi descriptografado. |
| 4 | **CREAS** | Recebe o alerta. Relógio começa. Agente nomeado. **Link clicável para a tx no explorer da devnet.** |
| 5 | **Repasse** | CREAS transfere ao Conselho Tutelar. O caso **continua com o CREAS** até o aceite assinado. |
| 6 | **Estouro** | O CT não aceita. Prazo vence → `RECUSA_TÁCITA` → escala ao MP, automático. **Este é o momento decisivo do demo.** |
| 7 | **Painel público** | Zero dado de criança. Só: quais instituições ancoraram no ciclo, quais não, e quantos prazos estourados por município. |

### O que é real e o que é encenado (declarar, sempre)

**Real e verificável:**
- Programa Anchor em **Solana devnet** com a máquina de estados de custódia. Instruções: `abrir_caso`,
  `transferir_para`, `aceitar`, `escalar`, `registrar_desfecho`, `ancorar_periodo`.
- `escalar` é **permissionless** — qualquer um pode acionar depois do prazo. Ninguém consegue
  suprimir o escalonamento. Detalhe forte de pitch.
- Cruzamento homomórfico real (soma sobre ciphertexts, limiar). Mostrar o ciphertext na tela.

**Simplificado no MVP, declarado como roadmap:**
- OPRF com **chave única** no MVP → chave distribuída na Sprint 2.
- Decriptação do resultado por chave única → comitê de limiar na Sprint 2.
- Notificação protegida por ZK → Sprint 2.
- Relayer contra vazamento de metadado → Sprint 2.

**Fora de escopo, por decisão:** integração real com SIPIA/SINAN/Prontuário SUAS, contas de usuário,
gestão de caso. Não somos prontuário.

**Dados 100% fictícios, com aviso visível na interface.** Coerente com a nossa própria tese.

### Stack sugerida

Next.js + Tailwind · Anchor/Rust na devnet · biblioteca FHE em WASM para a soma homomórfica ·
deploy Vercel + repo público no GitHub (seção 15 do formulário).

---

## Frente 2 — Formulário

16 seções; as dissertativas são **2, 3, 6, 7, 9, 10, 11**. Já temos base pronta em `docs/ideia.md`
para quase todas:

| Seção | Fonte da resposta |
|---|---|
| 2. Sua solução (≤500 palavras) | "Em uma frase" + problema + três camadas. Pilar: **Proteção à Infância** |
| 3. Tecnologia — por que blockchain importa | "Por que blockchain (e não um app comum)" + prints do MVP |
| 4. Estágio | **Protótipo/MVP** — sobe de patamar se a Frente 1 entregar |
| 5. Validação | Opcional agora, **obrigatório para finalistas** — ver alerta abaixo |
| 6. Modelo de negócio | FIA/FDCA + CMDCA + Lei 14.133/2021 |
| 7. Escalabilidade | 5.570 municípios · Busca Ativa Escolar como parceiro · transversalidade aos 4 pilares |
| 9. Desafios não financeiros | Adoção (lição do SIPIA), articulação intersetorial, trusted setup |
| 10. Uso do apoio | Sprint 2 do roadmap: chave distribuída, ZK, piloto municipal |
| 11. Motivação | Pessoal, curto, **sem nomes** |

> ⚠️ **Lead time:** a seção 5 (Validação) é obrigatória para finalistas e não dá para improvisar
> entre 03 e 06/08. Conversar com **um conselheiro tutelar ou técnico de CREAS de verdade** é a
> única parte do plano que depende da agenda de terceiros. Começar a articular cedo vale mais do que
> qualquer linha de código.

---

## Frente 3 — Vídeo (≤3 min)

Apresentação em **HTML** → roteiro falado → Thiago grava → YouTube não listado.
Slides com **pouco texto e muito impacto**.

As 6 perguntas obrigatórias, com o tempo sugerido:

| # | Pergunta | Tempo | Âncora |
|---|---|---|---|
| 1 | Qual problema? | 0:00–0:35 | Abrir com a expressão do TCE: *"base eletrônica unificada e sigilosa"* |
| 2 | Quem é afetado? | 0:35–0:55 | 289,4 mil denúncias no Disque 100 (2024); 5.570 municípios |
| 3 | Como funciona? | 0:55–1:40 | Demo: dois sinais → cruzamento cifrado → alerta → relógio com dono |
| 4 | Por que blockchain? | 1:40–2:15 | As duas palavras se contradizem; e o custodiante do registro é a parte interessada |
| 5 | Próximos passos | 2:15–2:40 | Chave distribuída, ZK, piloto municipal |
| 6 | Uso do apoio | 2:40–3:00 | Piloto em município com CMDCA/FIA |

Regra do roteiro: **o movimento 2 da venda** (as duas palavras se contradizem) é o único momento em
que o vídeo pode parar e respirar. É ele que impede a pergunta "não dava com um app comum?".

---

## Ordem sugerida

Frente 1 primeiro, porque as Frentes 2 e 3 consomem prints e links dela — e porque "Estágio da
solução" muda de resposta conforme o que existir. As três podem avançar em paralelo depois que o
roteiro do demo estiver fechado.

Único item verdadeiramente obrigatório em 29/07 é o formulário. O protótipo é formalmente opcional
(ainda que decisivo na prática), então ele é o que se corta se algo tiver que ser cortado.
