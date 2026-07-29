# A ideia — estado atual

> Versão consolidada em 28/07/2026, com o feedback sobre diluição de responsabilidade e a
> pesquisa de mercado (`docs/pesquisa-de-mercado.md`) absorvidos.
> Pilar declarado: **Proteção à Infância**. Blockchain: **Solana**.

## Em uma frase

Uma infraestrutura que cruza sinais de risco entre instituições **sem que nenhuma veja o dado da
outra**, e que transforma cada repasse do caso em um registro assinado, com dono nomeado e prazo
correndo — para que a omissão deixe de ser invisível.

## O problema

A rede de proteção à infância no Brasil é fragmentada por desenho. A UBS vê a lesão, a escola vê a
falta reiterada, o CRAS vê a vulnerabilidade da família, o Conselho Tutelar vê a denúncia — e
ninguém cruza nada.

**Como funciona hoje, na prática:** a escola comunica o Conselho Tutelar por ofício em papel,
telefone, e-mail ou WhatsApp — **sem protocolo com valor probatório padronizado** (TCE-RN constatou
"ausência de protocolos claros"). Cada órgão tem seu sistema e eles não conversam: SIPIA-CT, SINAN /
e-SUS / RNDS, Prontuário SUAS, Educacenso, Disque 100.

Seis modos de falha:

1. **O encaminhamento não deixa rastro.** Sai de A e ninguém prova depois se chegou em B.
2. **Cada órgão vê um fragmento.** Três sinais fracos e independentes que juntos seriam um caso
   grave permanecem três sinais fracos.
3. **A responsabilidade evapora no repasse.** "Encaminhei, não é mais comigo."
4. **O custodiante local do registro é parte interessada.** O conselheiro tutelar é eleito
   localmente, mandato de 4 anos; quem guarda o histórico de omissão é quem responderia por ela.
5. **Quem notifica se expõe e nunca sabe o desfecho** — e por isso deixa de notificar.
6. **Troca de mandato zera o histórico.**

O modo de falha dominante **não é falsificar registro — é não registrar.** Todo o desenho parte disso.

### A frase que sustenta tudo — usar como abertura de pitch

Auditorias de tribunais de contas afirmam **textualmente** a ausência de uma *"base eletrônica
unificada e sigilosa"* no Sistema de Garantia de Direitos (TCE-RN / Atricon, 2026; TCE-MT, 2025-26;
TCU, 2025 — fontes na seção de evidências).

Essas duas palavras são o produto inteiro:

| | "unificada" | "sigilosa" |
|---|---|---|
| **Sistemas de hoje** (SIPIA, SINAN, Prontuário SUAS, Educacenso) | ❌ isolados | ✅ |
| **Banco central único** (a "solução óbvia") | ✅ | ❌ cria um operador com o dossiê de risco de toda criança do país |
| **Nossa arquitetura** | ✅ cruzamento sob FHE | ✅ nenhum operador enxerga |

**Roteiro de venda em 4 movimentos:**

1. *"Um tribunal de contas escreveu o requisito para a gente."* — ler a expressão exata, em voz alta.
2. *"Essas duas palavras se contradizem."* — unificar exige centralizar; centralizar destrói o sigilo.
   É por isso que o problema segue aberto há décadas, e não por falta de vontade ou de orçamento.
3. *"Existe uma tecnologia que quebra essa contradição."* — cruzar dado cifrado sem descriptografar;
   provar sem revelar. Não é blockchain por blockchain: é a única classe de solução que satisfaz o
   enunciado do próprio órgão de controle.
4. *"E o registro de quem foi avisado precisa ser inviolável por quem seria cobrado."* — entra a
   trilha de custódia.

O movimento 2 é o mais importante: ele transforma nossa criptografia de *ornamento técnico* em
**condição necessária**. É a defesa contra a pergunta "não dava para fazer com um app comum?".

## A solução — três camadas

### Camada 1 — Cruzamento inter-institucional privado (off-chain)

Cada instituição contribui um sinal cifrado sobre um **pseudônimo da criança**, gerado por **OPRF
com chave distribuída** (hash simples de CPF seria enumerável). A computação roda sob **FHE**, e a
escolha por FHE em vez de MPC é por **assincronia**: uma UBS, uma escola e um CRAS nunca estarão
online ao mesmo tempo, e MPC exige rodadas interativas.

Se **dois ou mais sinais independentes** convergem sobre o mesmo pseudônimo, dispara um alerta.
Nenhuma instituição vê o dado da outra. Só o alerta sai.

### Camada 2 — Trilha de custódia e prazos (on-chain, Solana)

Cada evento do ciclo de vida do alerta — gerado, recebido, aceito, prazo aberto, encaminhado,
desfecho — vira **atestação assinada + compromisso público**.

E o mecanismo que ataca o modo de falha dominante: **commitment periódico obrigatório**. Cada
instituição ancora periodicamente, mesmo sem caso. A **ausência da âncora** é que vira o alarme.
Silêncio deixa de ser indistinguível de tranquilidade.

> Precedente que valida o mecanismo: a Resolução CONANDA 231/2022 já tornou o uso do SIPIA
> **obrigatório**. Em Santa Catarina, 64% dos Conselhos usavam em 2023 (era 39% em 2020). Ou seja:
> **a norma existe, o descumprimento é de mais de um terço, e nada acontece — porque ninguém vê.**

### Camada 3 — Notificação protegida (ZK) — *novo*

A pesquisa identificou que **nenhuma solução existente protege o notificante**, e que a
subnotificação está "fortemente associada ao receio dos profissionais quanto às implicações legais e
ao desconhecimento do fluxo" (revisão integrativa, BJHR 2024).

O profissional prova em zero-knowledge que **é um notificante habilitado de instituição credenciada**
— pertencimento a uma árvore de Merkle + nullifier, estilo Semaphore — sem revelar quem é. A
notificação tem valor probatório e o notificante é irrastreável. Um nullifier por caso impede spam e
duplicação sem quebrar o anonimato.

Isso ataca a **causa raiz documentada** da subnotificação, não um sintoma.

## O coração: a invariante de custódia unitária

> **Não existe estado sem dono.**

A cada instante o caso tem exatamente um custodiante, com órgão, agente nomeado e relógio. O repasse
é em **duas fases**:

- A emite `TRANSFERIDO_PARA(B)` — e o caso **continua sendo de A**, com prazo correndo contra A.
- Só o `ACEITE` assinado por B move a custódia.
- Se B não aceita no prazo: `RECUSA_TÁCITA` → escala para instância **nomeada** (MP), não para limbo.

Não há transição que deixe o caso órfão. Isso é regra do programa on-chain, não promessa de processo.

**É a resposta à crítica de que unificar dilui responsabilidade:** a gente não unifica a
responsabilidade, **nomeia** ela. Hoje a responsabilidade já se dilui — exatamente no repasse. A
diferença é que hoje ela se dilui sem registro.

## Onde entra cada ator

| Ator | Papel |
|---|---|
| **CRAS / PAIF** | Porta de entrada preventiva, capilaridade, vínculo com CadÚnico. Fonte de sinal. |
| **UBS / escola** | Fontes de sinal. Já legalmente obrigadas a notificar. |
| **CREAS / PAEFI** | **Destino técnico do alerta.** Equipe permanente e concursada, não eletiva. Hoje recebe caso sem histórico — problema-espelho do nosso. |
| **Conselho Tutelar** | Hub legal obrigatório no fluxo. Permanece — com relógio público. |
| **MP / Promotoria da Infância** | Destino de escalonamento. Sua função institucional é cobrar os outros e já tem poder de agir sobre nosso output. |
| **Busca Ativa Escolar** (UNICEF/Undime/Congemas) | **Parceiro natural e precedente.** Já tem fluxo intersetorial de alertas com papéis definidos em municípios — só que restrito à evasão. Complementar, não concorrente. |
| **CMDCA / FIA-FDCA** | Canal legal de financiamento municipal. |

## Escopo — o que somos e o que não somos

**Não é** prontuário, não é sistema de gestão de caso, não substitui SIPIA nem Prontuário SUAS.
**É cartório de prazos e responsabilidades.**

Quem resolve o caso já existe e já é obrigado por lei. O que não existe é o mecanismo que torna a
**não-ação visível**. Construir mais um sistema de gestão significaria competir com sistemas
existentes, guardar dado sigiloso de criança e não precisar de blockchain.

Teoria de mudança: **prazo público muda o comportamento de quem tem o prazo.**

## Por que blockchain (e não um app comum)

O filtro: *existe alguma parte com incentivo para apagar, atrasar ou reescrever o registro — e é
justamente ela que hoje guarda o banco de dados?* Aqui, sim.

**A objeção mais forte contra nós**, levantada na própria pesquisa: *"o problema-núcleo é resolvível
com registro centralizado com log imutável e assinatura, sem necessidade obrigatória de blockchain."*
Revisões acadêmicas alertam que a adoção governamental de blockchain é "cautelosa e fragmentada" e
que "em muitos casos um banco de dados tradicional bem gerido bastaria". **Precisamos responder isso
de frente.** Nossa resposta, em três pontos:

1. **Log imutável centralizado exige um operador confiável — e não existe candidato.** Quem hospeda?
   Se for o ente federal, ele é o mesmo que o TCU está auditando pela mesma falha; se for o
   município, é a parte cujo prazo está sendo medido. Imutabilidade concedida por quem tem incentivo
   em apagar não é imutabilidade, é promessa.
2. **"Sigilosa" quebra a solução centralizada.** Um operador central que cruza sinais das quatro
   áreas passa a deter o dossiê de risco de todas as crianças do país. É o pior desfecho de LGPD
   possível. Só criptografia resolve — o cruzamento sob FHE não tem operador que enxergue.
3. **Volume e economia.** 6+ eventos assinados por caso × 5.570 municípios e 6.100 Conselhos
   Tutelares, mais commitments periódicos por instituição por ciclo, mais verificações de prova ⇒
   milhões a dezenas de milhões de transações/ano. Escrita pequena e de alta frequência — inviável
   em L1 Ethereum, natural em Solana.

## Por que nenhum dado sigiloso vai on-chain

Nem cifrado. O ledger é permanente e a criança de hoje ainda será adulta por ~80 anos. Ciphertext
publicado hoje é dado vazado no dia em que a cifra ceder. Publicar segredo cifrado em registro
imutável é *harvest now, decrypt later* aplicado à população mais vulnerável que existe.

A assimetria que sustenta o desenho: **publicar prova é seguro contra o futuro; publicar segredo
cifrado não é.** Groth16 tem zero-knowledge perfeito — um adversário quântico ilimitado lendo provas
históricas não extrai a testemunha; o que ele quebra é a *soundness*, problema prospectivo e
migrável. Em ciphertext, a confidencialidade é justamente o que quebra, e retroativamente.

## Evidências e números — com fonte

> **Regra do projeto: nenhum número entra sem link, ano e órgão.** `1ª` = fonte primária
> (relatório/base oficial). `2ª` = fonte secundária (imprensa noticiando o documento primário) —
> usável, mas idealmente rastrear até o documento original antes do formulário.

### Validação institucional da hipótese

| Achado | Órgão / ano | Fonte |
|---|---|---|
| Ausência de "base eletrônica unificada e sigilosa"; "ausência de protocolos claros" na educação | TCE-RN / Atricon, Projeto Infância Segura (2026) | `2ª` [conjur](https://www.conjur.com.br/2026-jul-03/tce-rn-identifica-falhas-na-rede-de-protecao-a-crianca-no-estado/) |
| Fragilidades de planejamento, orçamento e articulação intersetorial | TCE-MT (2025/26) | `2ª` [A Tribuna MT](https://www.atribunamt.com.br/sem-categoria/estado/2026/04/auditoria-tce-aponta-falhas-no-combate-a-violencia-infantil-em-mato-grosso/) |
| Falta de integração entre órgãos federais e estaduais; sem normas para guarda de provas digitais | TCU (2025) | `1ª` [portal TCU](https://portal.tcu.gov.br/imprensa/noticias/auditoria-revela-falhas-no-combate-ao-abuso-sexual-infantil-na-internet) |
| "Falhas importantes na sistematização dos registros de atendimentos" dos conselhos tutelares | Ciência & Saúde Coletiva (2018) | `1ª` [SciELO](https://www.scielosp.org/article/csc/2018.v23n1/83-92/) |

### Escala

| Métrica | Valor | Ano | Fonte |
|---|---|---|---|
| Municípios | 5.570 | 2024 | `1ª` [IBGE](https://agenciadenoticias.ibge.gov.br/agencia-noticias/2012-agencia-de-noticias/noticias/41111) |
| Conselhos Tutelares | 6.100 | 2023 | `2ª` [Agência Brasil](https://agenciabrasil.ebc.com.br/direitos-humanos/noticia/2023-09/brasileiros-elegerao-30500-conselheiros-tutelares-em-1o-de-outubro) |
| Conselheiros tutelares titulares | 30.500 | 2023 | `2ª` (idem acima) |
| Disque 100 — denúncias crianças/adolescentes (+26,7%; 33/hora) | 289,4 mil | 2024 | `1ª` [gov.br/Secom](https://www.gov.br/secom/pt-br/acompanhe-a-secom/noticias/2025/janeiro/disque-100-registra-657-2-mil-denuncias-em-2024-e-crescimento-de-22-6-em-relacao-a-2023) |
| SINAN — violência sexual 0–19 (422.994 acumuladas em 11 anos, +183,5%) | 60.805 | 2024 | `2ª` [FADC](https://www.fadc.org.br/noticias/violencia-sexual-dados-2026) |
| SINAN — violência física, notificações por dia | 196/dia | 2023 | `2ª` [SBP](https://www.sbp.com.br/imprensa/detalhe/news/quase-200-casos-de-violencia-contra-criancas-e-adolescentes-sao-notificados-todos-os-dias-no-brasil/) |
| Homicídios de crianças/adolescentes na ALC | 53.318 | 2015–2022 | `1ª` [UNICEF/OPAS](https://www.unicef.org/brazil/comunicados-de-imprensa/violencia-contra-criancas-e-adolescentes-persiste-na-america-latina-e-no-caribe) |

### Falha do sistema-âncora atual

| Achado | Ano | Fonte |
|---|---|---|
| SIPIA obrigatório pela Resolução CONANDA 231/2022; uso em SC 39% (2020) → 64% (2023) | 2024 | `1ª` [MPSC/CIJE, Panorama dos CTs de SC](https://www.mpsc.mp.br/noticias/mpsc-divulga-panorama-dos-conselhos-tutelares-de-santa-catarina-em-2023) |
| Subutilização do SIPIA; municípios sem nenhum registro no ano | 2023 | `2ª` [ALMG, fala da ex-secretária adjunta SNDCA](https://www.almg.gov.br/comunicacao/noticias/arquivos/Conselho-Tutelar-e-a-primeira-linha-de-defesa-de-criancas-e-adolescentes/) |
| Bebê Miguel (Sorocaba): "a rede de proteção tinha conhecimento da situação da família meses antes da morte"; MP instaurou inquérito por omissão | 2026 | `2ª` [Cruzeiro do Sul](https://www.jornalcruzeiro.com.br/sorocaba/noticias/2026/06/761466-conselheiro-tutelar-e-afastado-no-caso-do-bebe-miguel-conselho-apoia-medida-preventiva.html) |
| Conselheiro tutelar afastado por falsificação e omissão diante de denúncia | 2025 | `1ª` [MPSC](https://mpsc.mp.br/noticias/conselheiro-tutelar-e-afastado-de-suas-funcoes-em-itajai-apos-acao-ajuizada-pelo-mpsc-) |
| Dados abertos SIPIA-CT (base para calcular municípios ativos) | mensal | `1ª` [dados.gov.br](https://dados.gov.br/dados/conjuntos-dados/sistema-de-informacao-para-a-infancia-e-adolescencia---modulo-conselho-tutelar---sipiact) |

### Causa raiz da subnotificação

| Achado | Ano | Fonte |
|---|---|---|
| Subnotificação "fortemente associada ao receio dos profissionais quanto às implicações legais e ao desconhecimento do fluxo correto" | 2024 | `1ª` [Brazilian Journal of Health Review](https://ojs.brazilianjournals.com.br/ojs/index.php/BJHR/article/view/86569) |

### O número que não existe — e isso é o argumento

Não há métrica nacional de casos perdidos no repasse, nem % nacional consolidado de uso do SIPIA
(ambos `[NÃO ENCONTRADO]` na pesquisa). **Porque não existe registro do repasse.** A ausência do
indicador é a prova do problema — e é o primeiro indicador que passamos a produzir.

> ⚠️ Números descartados por falta de fonte: **34,7%** (notificações SINAN com encaminhamento ao CT)
> e **26,66%** (uso nacional do SIPIA CT). Não confirmados. Não usar.

## Modelo de negócio

Não depende de novo aporte orçamentário: existe **dinheiro público endereçável já parado**.

| Dado | Valor | Ano | Fonte |
|---|---|---|---|
| FDCA-DF — recurso acumulado com menos de 30% executado | R$ 496 mi | 2021–2024 | `2ª` [Brasil de Fato](https://www.brasildefato.com.br/2026/07/16/fundo-da-crianca-do-df-mantem-ritmo-lento-de-execucao-de-recursos-mesmo-apos-cobrancas/) |
| Fundos da criança — arrecadação via destinação de IR | ~R$ 400 mi | 2025 | `2ª` [Ramacrisna](https://ramacrisna.org.br/noticias/o-que-e-fdca-saiba-tudo-sobre-o-fundo-dos-direitos-da-crianca-e-adolescente/) |
| Govtech — ACV típico e ciclo de venda a município | R$ 50 mil–5 mi / 4–12 meses | 2026 | `2ª` [Baita](https://baita.ac/insights/como-vender-para-o-setor-publico-mm5nn24k) |
| Custo direto do crime/violência na ALC (BID) | 3,44% do PIB regional | 2022 | `2ª` [Gazeta do Povo](https://www.gazetadopovo.com.br/economia/violencia-crimes-crescimento-economico-brasil/) |

- Canal legal correto: deliberação do **CMDCA** sobre o FIA municipal.
- Lei 14.133/2021, com dispensa até ~R$ 50 mil como porta de entrada rápida para piloto.
- Não existe cifra brasileira isolada do custo econômico da violência **contra a infância** — só
  proxies regionais. Declarar como lacuna em vez de extrapolar.

## Precedentes internacionais (conhecer o terreno)

UNICEF Office of Innovation investiu em **Tilli** (Sri Lanka, com Save the Children — 90+ case
workers treinados, 4.700 crianças) e avaliou **Rahat/Rumsan** (Nepal, 2023). **Zuidhorn** (Holanda,
2017) usou blockchain no "Child Package". Resultados mistos, maioria em prova de conceito. **Não há
aplicação madura de DLT/ZK/MPC à coordenação da rede de proteção à infância no Brasil.**

## Riscos declarados

- **Efeito "o sistema vai avisar"** — profissional relaxa a própria vigilância. Mitigação: o sistema
  nunca notifica "o sistema", notifica pessoa nomeada; e o alerta só existe se houver sinal humano.
- **Over-engineering** — risco reconhecido pela literatura. Resposta nos três pontos acima.
- **Fraude de conteúdo na origem** — blockchain não resolve. Conceder explicitamente.
- **Commitments também são permanentes** — mitigar com rerandomização e ancoragem de agregados.
- **Metadado vaza mesmo com ZK** — exige relayer.
- **Trusted setup do Groth16** é questão política quando o governo é parte — alternativa PLONK/Halo2
  (setup universal).
- **Adoção** — SIPIA prova que sistema obrigatório não garante uso. Por isso o vetor é acoplar a
  fluxo existente (Busca Ativa Escolar) e não criar mais um login.
- **LGPD / ECA** — usuários finais são crianças.

## Âncoras legais

- **Lei 13.431/2017** — fluxo de atendimento integrado e escuta especializada. É a lei que manda as
  instituições se comunicarem. Âncora principal.
- **Resolução CONANDA 113/2006** (SGD) e **231/2022** (SIPIA obrigatório).
- **ECA (Lei 8.069/1990)** art. 13 — dever de notificação.
- **Portaria de Consolidação nº 4/2017** — notificação compulsória em saúde.
- **Lei 14.133/2021** — contratação pública.
- **Programa de País UNICEF 2024–2028**.

## Pendências

- [x] ~~Verificar 34,7% e 26,66%~~ — **descartados.** A pesquisa não os confirmou e registra que o %
      nacional de uso do SIPIA é [NÃO ENCONTRADO]. Substituídos por SC 39%→64% (MPSC, com fonte).
- [ ] Conferir Lei 11.525/2007 → LDB antes de citar (tema transversal Direitos da Criança)
- [ ] Conferir analogia dos painéis de prazo do CNJ antes de usar como evidência
- [ ] Cálculo de custo real do volume projetado em Solana
- [ ] Formulário (16 seções) · vídeo ≤3 min · imagem 1920×1080 · protótipo de alta fidelidade
