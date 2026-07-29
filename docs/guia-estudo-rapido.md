# Guia de estudo rápido — Mini-cursos do Youth Challenge Blockchain 2026

> Para Thiago e Lais. Objetivo: percorrer a trilha oficial **de verdade**, mas com eficiência — chegando em cada aula já sabendo o que procurar e saindo capazes de responder o quiz por entendimento próprio. **Este guia não contém gabaritos** e não substitui a plataforma: a conclusão dos módulos e quizzes é registrada lá, e é critério de desempate.

## Como usar

1. **Acesse a plataforma**: [youthchallengeblockchain.com/education/](https://youthchallengeblockchain.com/education/). O login é feito **apenas com o e-mail usado na inscrição** (sem senha). Cada um usa **seu próprio e-mail e seu próprio navegador** — o progresso fica salvo no navegador, e o consumo dos mini-cursos por **todos os membros da equipe** é o 2º critério de desempate.
2. **Antes de cada módulo**, leia a seção correspondente deste guia (5 min). Ela diz quem é o autor, qual o formato, quais conceitos a aula ensina e em quais pontos o quiz costuma focar.
3. **Faça o módulo na plataforma**: assista/leia de fato, marque os checkboxes de conclusão de cada aula e **responda o quiz** ao final. Os quizzes têm 10 perguntas de múltipla escolha e cobrem exatamente o conteúdo das aulas — se você prestou atenção nos pontos indicados aqui, responde sem dificuldade.
4. **Depois do módulo**, volte à seção "Serve para o nosso projeto?" e anote qualquer ideia que surgir para a solução.
5. Ordem sugerida: **1 → 2 → 4 → 3 → 5 → 6 → 7**. O módulo 1 é o mais importante (contexto UNICEF + critérios de avaliação); 2 e 4 constroem a base técnica; 5, 6 e 7 são os que mais alimentam a ideia da solução. Mas seguir 1→7 na ordem da plataforma também funciona.

**Estimativa realista de tempo por pessoa** (aula + resumo + quiz):

| Módulo | Formato | Tempo estimado |
|---|---|---|
| 01 | 2 leituras + 17 slides + vídeo da live de orientação | 60–90 min |
| 02 | 3 vídeos curtos (estilo reels, ~2 min cada) | 20–25 min |
| 03 | 1 vídeo (~10 min); aula 3.1 ainda "em breve" | 20 min |
| 04 | 2 vídeo-aulas (StreamYard) | 40–50 min |
| 05 | 2 vídeo-aulas (StreamYard) | 40–50 min |
| 06 | 3 vídeos curtos | 15–20 min |
| 07 | 1 áudio-aula (episódio de podcast no Spotify) | 50–70 min |
| **Total** | | **~4h30 a 5h30** |

Dá para fazer em dois blocos: **Bloco A** (módulos 1, 2, 3 — ~2h) e **Bloco B** (módulos 4, 5, 6, 7 — ~2h30 a 3h). O módulo 7 (podcast) pode ser ouvido em deslocamento, mas conclua o checklist e o quiz logado.

---

## Módulo 01 — Introdução: blockchain + UNICEF + regras do desafio

**Autores/formato:** 4 aulas. (1.1) leitura visual adaptada da Reuters Graphics sobre como funciona uma blockchain; (1.2) leitura institucional do UNICEF Brasil sobre o Programa de Cooperação 2024–2028; (1.3) carrossel de **17 slides** com contexto, prioridades e critérios de avaliação; (1.4) vídeo (YouTube) com a gravação da live de orientação: cronograma, entregáveis e submissão.

**É o módulo mais importante da trilha** — metade dele é o material que define como nossa solução será julgada.

### Conceitos-chave

1. **Registro → bloco → cadeia.** Um registro é qualquer informação digital (transação, contrato, certificado). Registros válidos são agrupados em blocos, e os blocos são conectados em sequência por referências criptográficas — daí "blockchain".
2. **As 4 etapas de validação de um registro:** a operação é registrada (com assinaturas digitais) → a rede verifica regras e assinaturas → os registros entram em um bloco, que recebe seu próprio hash e guarda o hash do bloco anterior → o bloco é ligado à cadeia em ordem verificável.
3. **Hash.** Função matemática que transforma qualquer dado em uma sequência de tamanho fixo. Qualquer alteração mínima no conteúdo gera um hash completamente diferente — e como o bloco seguinte aponta para o hash antigo, a alteração fica visível.
4. **Rede distribuída e consenso.** Em vez de um banco de dados mestre, vários nós mantêm cópias do histórico e verificam consistência. Redes abertas usam mecanismos de consenso (Proof of Work: esforço computacional; Proof of Stake: ativos comprometidos como garantia) para aceitar participantes desconhecidos.
5. **Usos além de criptomoedas:** serviços financeiros, cadeia de suprimentos, registros de saúde, votação auditável, registros de propriedade — sempre quando há necessidade real de compartilhamento, rastreabilidade e coordenação entre múltiplos participantes.
6. **Programa de Cooperação UNICEF–Brasil 2024–2028.** 75 anos de atuação no país (ECA, vacinação, combate ao trabalho infantil). Foco nos grupos mais vulnerabilizados e nos territórios onde estão concentrados. As desigualdades são **interligadas**: pobreza, discriminação (raça, etnia, gênero, deficiência), violência, acesso desigual a serviços públicos, pouca participação e baixo engajamento social.
7. **Públicos prioritários:** crianças e adolescentes afrodescendentes; povos indígenas; comunidades tradicionais (quilombolas, ribeirinhos); pessoas com deficiência; migrantes e populações em crises humanitárias; comunidades atingidas por desastres ambientais.
8. **Como o UNICEF atua:** (a) incidência em políticas públicas; (b) engajamento da sociedade; (c) resposta a emergências; (d) Cooperação Sul-Sul. Presença territorial via **Selo UNICEF**, **Agenda Cidade UNICEF** e escritórios regionais.
9. **Regras do desafio (aula 1.4):** equipes de 2 a 5 pessoas; entregáveis = **formulário + vídeo pitch de até 3 min + protótipo digital** (código, low-code ou no-code; deck de slides isolado NÃO substitui protótipo); 4 eixos prioritários (**Educação, Saúde, Água/Saneamento/Higiene, Proteção da Infância**); avaliação **5D** = Impacto social, Escalabilidade, Modelo de negócio, Inovação, Risco. Direção essencial repetida na aula: *blockchain não pode ser adorno — precisa ser infraestrutura para confiança, transparência, rastreabilidade, coordenação ou redução de intermediários*.

### O que cai no quiz

- Saiba dizer, em uma frase, **qual é o objetivo principal de uma blockchain** e **por que os blocos são conectados entre si** (o quiz cobra as duas coisas separadamente).
- Preste atenção na **combinação de elementos** que torna a blockchain resistente a alterações — o quiz pede o conjunto, não um fator isolado.
- Da aula 1.2, memorize **as frentes de atuação do UNICEF no Brasil** e o trio "prioridades de cooperação, públicos prioritários, territórios prioritários" — duas perguntas giram em torno disso.
- Da aula 1.3, saiba **o que a apresentação cobre como um todo** (atuação do UNICEF, desafios sociais, prioridades do Programa de País, critérios de avaliação) e **quais áreas temáticas** aparecem nos objetivos (saúde, educação, proteção, água e clima).
- Saiba listar **as 5 dimensões de avaliação de uma solução inovadora** — o quiz pergunta o que significa "avaliar" nesse contexto.
- Da aula 1.4, decore **os três entregáveis da submissão** e a **recomendação sobre o papel do blockchain na solução** (por que a tecnologia deve estar no projeto).

### Serve para o nosso projeto?

- **É o coração estratégico do hackathon.** Os públicos prioritários (afrodescendentes, indígenas, quilombolas, migrantes, atingidos por desastres) e os territórios do Programa de País 2024–2028 devem definir NOSSO público-alvo — solução alinhada a isso pontua em Impacto e Escalabilidade.
- Os **critérios 5D** são o checklist do pitch e do formulário: cada seção da submissão deve responder explicitamente a uma dimensão.
- A lista de recomendações finais da aula 1.4 ("comece pelo problema, não pela tecnologia"; "explique por que blockchain é necessária"; "revise riscos de privacidade e proteção de crianças") é praticamente o roteiro do nosso vídeo pitch.

---

## Módulo 02 — Entendendo o Bitcoin

**Autor/formato:** Bruno Liman (Chain Analyst, WeSearch). 3 vídeos curtos no estilo reels de Instagram, com linguagem bem informal, cada um acompanhado de resumo escrito na página.

### Conceitos-chave

1. **O problema do dinheiro digital copiável.** Antes do Bitcoin, o desafio era criar dinheiro digital sem que a mesma unidade pudesse ser copiada e gasta duas vezes (como uma foto reenviada no WhatsApp). A blockchain resolveu isso.
2. **Blockchain como livro digital distribuído.** Um grande livro de registros copiado e espalhado por computadores no mundo inteiro, sem depender de banco, governo ou servidor único. Cada bloco é uma "página" do livro.
3. **Hash como impressão digital.** Cada bloco guarda o hash do bloco anterior; alterar uma transação antiga muda o hash daquele bloco e quebra a corrente — para fraudar seria preciso reconstruir todos os blocos seguintes mais rápido que a rede inteira.
4. **Minerar = proteger a rede.** Mineradores verificam transações, organizam blocos e competem (resolvendo um problema matemático difícil — Proof of Work) para adicionar o próximo bloco. Não é só "criar moedas".
5. **Hashrate.** A força computacional total da rede. Quanto maior, mais caro fica atacar a rede — a segurança vem do custo econômico.
6. **Incentivos econômicos.** Quem valida um bloco recebe recompensa em bitcoins + taxas. A recompensa é cortada pela metade periodicamente (**halving**, a cada ~4 anos), o que torna a emissão previsível e escassa. Seguir as regras rende mais que fraudar.
7. **Ajuste automático de dificuldade.** A rede mira 1 bloco a cada ~10 minutos e recalcula a dificuldade da mineração **a cada 2016 blocos (~2 semanas)**: se os blocos saem rápido demais, a dificuldade sobe; se saem devagar, desce. O protocolo se ajusta sozinho, sem operador central.
8. **Ataque de 51%.** Em teoria, quem controlar mais da metade do hashrate poderia reorganizar blocos recentes e tentar gasto duplo; na prática, o custo em máquinas e energia torna o ataque economicamente inviável.

### O que cai no quiz

- Saiba formular **qual problema existia antes do Bitcoin** e **como a aula descreve a blockchain** (a analogia do livro).
- Preste atenção em **o que cada bloco guarda do bloco anterior** e **por que alterar uma transação antiga é tão difícil** — são duas perguntas diretas.
- Tenha claro **o que significa minerar** (o papel real dos mineradores) e **o que o hashrate representa**.
- O quiz pergunta **por que compensa mais jogar a favor da rede do que atacá-la** — a lógica dos incentivos.
- Saiba explicar **o que é o halving** (e sua periodicidade aproximada), **como a rede mantém a média de 10 minutos por bloco** (o número 2016 aparece) e **o que seria um ataque de 51%**.

### Serve para o nosso projeto?

- Base conceitual para justificar tecnicamente a solução no pitch: segurança que nasce de **distribuição + criptografia + incentivos**, sem autoridade central.
- O argumento "regras que não podem ser mudadas no meio do jogo" é útil para vender confiança em contextos de repasse de recursos públicos/doações.

---

## Módulo 03 — Web3: uma nova camada da internet

**Autora/formato:** Luciana Sousa (fundadora da Tokelux e do programa Delas Perifa — onboarding Web3 para mulheres negras e periferias). A aula 3.1 está marcada como "em breve"; a única aula disponível é a **3.2**, em vídeo (~10 min).

### Conceitos-chave

1. **Evolução da internet.** Web1: estática, de consulta (o Google como "biblioteca online"). Web2: interativa — salas de bate-papo, redes sociais, YouTube, criação de conteúdo. **Web2.5**: a criação passa a gerar monetização e novas profissões (influencers, youtubers, tiktokers).
2. **A limitação da Web2/2.5:** conteúdos, dados e interações passam por empresas, servidores e plataformas; quem publica perde o controle sobre quem acessa, onde o conteúdo é armazenado e como é usado.
3. **A virada de chave da Web3:** descentralizar informações, reduzir intermediários e devolver às pessoas o controle sobre dados, conteúdos e transações.
4. **Blockchain explicada pela analogia do cartório:** em vez de um caderno centralizado que uma instituição registra e valida, os dados viram códigos, organizados em blocos, distribuídos por vários servidores (**nós**), e o que foi registrado não pode mais ser alterado.
5. **Três premissas da blockchain:** **segurança** (criptografia + estrutura em blocos), **autonomia** (controle sobre os próprios dados e sobre quem os acessa) e **anonimato** (transações associadas a endereços de carteiras, não a nomes).
6. **Peer-to-peer:** transações diretas de pessoa para pessoa, sem intermediários. A blockchain foi inventada originalmente para gerenciar o **Bitcoin**, a primeira criptomoeda descentralizada.
7. **Carteira digital:** a chave de acesso para transitar pela Web3 — logar em redes, transacionar moedas, ativos e tokens (exemplo citado: MetaMask).
8. **Web3 além da blockchain:** experiências imersivas com IA, metaverso, realidade aumentada, realidade virtual e avatares; é também uma mudança **comportamental**, de novas formas de presença e relação.

### O que cai no quiz

- Saiba caracterizar **Web1, Web2 e Web2.5** separadamente — o quiz tem uma pergunta para cada fase (o que mudou em cada transição, e qual novidade define a 2.5).
- Preste atenção na **limitação da Web2/2.5** (quem controla os dados) e na **virada de chave da Web3** — perguntas espelhadas.
- O quiz pergunta **para qual moeda a blockchain foi inicialmente inventada** e **o que significa uma transação peer-to-peer**.
- Memorize as **três premissas da blockchain** citadas pela professora.
- Saiba **para que serve uma carteira digital** e **qual outra dimensão da Web3** (além da blockchain) a aula apresenta.

### Serve para o nosso projeto?

- O argumento de **autonomia sobre os próprios dados** é forte para soluções envolvendo dados de crianças/adolescentes (LGPD/ECA): a família ou o adolescente controla quem acessa o quê.
- A trajetória da autora (inclusão de periferias na Web3) lembra que **onboarding acessível** é parte da solução — nosso protótipo precisa ser usável por quem nunca viu cripto.

---

## Módulo 04 — Fundamentos e consenso

**Autor/formato:** Lucas Mucida (Doutor em Ciência da Computação, 15+ anos com IA e software; ex-Upland). 2 vídeo-aulas hospedadas no StreamYard, tom mais formal e conceitual que os módulos 2 e 3.

### Conceitos-chave

1. **Blockchain como registro compartilhado e verificável.** Um livro de registros digital em rede: em vez de uma organização controlar tudo, os participantes mantêm cópias do histórico e podem verificar informações sem depender exclusivamente de uma autoridade central. Definição mais completa: banco de dados descentralizado que registra transações de forma segura, imutável e transparente.
2. **Imutabilidade relativa.** "Imutável" não significa magia: significa que alterar registros confirmados exige reconstruir as ligações entre blocos e convencer a rede a aceitar a nova versão — cada vez mais difícil, não impossível.
3. **Bitcoin ≠ blockchain.** Bitcoin é uma **aplicação** (pagamento digital) que usa a blockchain como tecnologia de funcionamento — a aula cobra essa distinção.
4. **Crítica à Web2 e ideia da Web3.** Web2: grande centralização de dados em plataformas e empresas. Web3: descentralizar e devolver os dados aos seus donos.
5. **Blockchains públicas vs privadas.** Públicas: qualquer pessoa participa, verifica transações e ajuda no consenso (exemplos: Bitcoin, Ethereum, **Solana**, Cardano). Privadas: acesso e validação restritos a participantes autorizados — úteis para bancos, empresas, sistemas de auditoria, registros compartilhados entre participantes conhecidos.
6. **Consenso.** O processo pelo qual os participantes de uma rede distribuída concordam sobre quais transações são válidas e qual é o estado atual da cadeia.
7. **Proof of Work.** Computadores competem resolvendo cálculos criptográficos; quem realiza o trabalho propõe o próximo bloco. O custo de máquinas e energia torna fraudes caras.
8. **Proof of Stake.** Validadores bloqueiam ativos da própria rede como garantia (stake) e são escolhidos para confirmar transações — sem competição computacional, com consumo de energia muito menor.

### O que cai no quiz

- O quiz pede **duas definições de blockchain**: uma simples (a imagem da corrente de blocos) e uma completa (com os adjetivos que a aula usa). Anote as duas formulações.
- Saiba explicar **o que significa dizer que a blockchain é imutável** — a nuance importa.
- Preste atenção na **relação entre Bitcoin e blockchain** (qual é aplicação, qual é tecnologia).
- Tenha claras a **crítica à Web2** e a **ideia central da Web3** apresentadas na aula 4.1.
- Da aula 4.2: **o que caracteriza uma blockchain pública**, **para que serve uma privada**, **como funciona o Proof of Work** e **qual é a principal diferença do Proof of Stake** (incluindo a questão da energia).

### Serve para o nosso projeto?

- **Justificativa da escolha de rede**: Solana é citada como exemplo de blockchain pública; e o argumento "Proof of Stake consome muito menos energia" responde antecipadamente à crítica ambiental na dimensão **Risco**.
- A distinção pública × privada ajuda a desenhar a arquitetura: dados sensíveis de crianças nunca vão on-chain públicos — on-chain ficam provas/hashes, e o quiz deste módulo reforça exatamente quando cada modelo é adequado.

---

## Módulo 05 — Blockchain além das criptomoedas + escolhas conscientes

**Autora/formato:** Andreia Martin Br (criptoeconomia, educação Web3 e impacto social; especialista em Gestão do Desenvolvimento Local pela OIT/ONU). 2 vídeo-aulas no StreamYard.

**Junto com o módulo 6, é a maior fonte de ideias de aplicação social para o nosso projeto.**

### Conceitos-chave

1. **Blockchain como infraestrutura de confiança.** A tecnologia surgiu antes do Bitcoin; sua contribuição principal é permitir que informações digitais sejam verificadas e compartilhadas com confiança — registrado e confirmado, o dado não pode ser alterado silenciosamente.
2. **Certificados verificáveis.** Certificados acadêmicos/profissionais podem ser comprovados por hash, com dados permanentes (instituição emissora, data, curso), guardados na carteira da própria pessoa — em vez de depender de um PDF falsificável.
3. **Rastreabilidade na ajuda humanitária.** Organizações, gestores e comunidades acompanham o que foi enviado, onde chegou e o que falta — reduzindo duplicidades, perdas e desvios de doações.
4. **Identidade digital + prova de conhecimento zero (ZK).** Responder a uma verificação específica sem expor dados desnecessários — o exemplo da aula é provar que se tem idade suficiente para entrar em um show sem revelar os demais dados pessoais.
5. **Cadeias produtivas.** O exemplo do chocolate: um QR Code dá acesso ao histórico de produção, transporte e distribuição desde a origem. Atenção ao limite: a rastreabilidade só vale se **os dados forem inseridos desde o início do processo**.
6. **Educação financeira antes de investir.** Organização, registro de entradas/despesas, reserva e clareza de objetivos, prazo e riscos vêm antes de qualquer aplicação.
7. **Dinheiro digital ≠ ativo digital; tokenização.** Dinheiro digital é o saldo no app do banco/Pix; ativo digital é um token/propriedade/direito registrado digitalmente. Tokenização conecta ativos e informações a registros em blockchain.
8. **Autocustódia e riscos.** Chave privada e palavras de recuperação nunca se compartilham (guardar offline); chave pública é o endereço para receber. Riscos do ambiente Web3: variação de preço, falhas tecnológicas, perda de chaves, golpes, phishing, engenharia social, decisões emocionais. A aula também separa **investimento** (análise e planejamento), **especulação** (risco sobre variações) e **aposta** (resultado incerto).

### O que cai no quiz

- Saiba argumentar **por que é incorreto reduzir blockchain a criptomoeda** e **o que ela acrescenta às provas digitais**.
- Preste atenção nos **quatro exemplos aplicados da aula 5.1** — certificados (o que fica registrado e como se verifica), ajuda humanitária (o que a rastreabilidade evita), o exemplo do show (o que a prova de conhecimento zero permite provar sem revelar) e o exemplo do chocolate (o que dá para acompanhar na cadeia). Cada um vira uma pergunta.
- Da aula 5.2: **o que vem antes de investir**, a **diferença entre dinheiro digital e ativo digital**, o **cuidado essencial na autocustódia** e a **lista de riscos** citados (o quiz pede o conjunto).

### Serve para o nosso projeto?

- **Catálogo de padrões de solução social**: certificados/credenciais verificáveis, rastreio de doações e ajuda humanitária, identidade com privacidade (ZK). Qualquer um desses padrões se encaixa nos eixos do UNICEF — e a prova de conhecimento zero é a resposta técnica para o dilema LGPD/ECA (verificar condição de uma criança sem expor seus dados).
- O alerta "a rastreabilidade depende de dados inseridos desde a origem" é um **risco operacional** que a banca pode cobrar — bom endereçar no pitch.
- As perguntas finais da aula 5.2 ("quem será beneficiado? qual problema? como se sustenta? que resultados gera?") são um mini-teste do nosso modelo de negócio.

---

## Módulo 06 — A internet da verdade + proteção da infância + primeira carteira

**Autora/formato:** Lia Chain — uma **agente de IA** criada para a trilha (BioBots Tec). 3 vídeos curtos e diretos, com analogias do cotidiano.

**A aula 6.2 é a mais diretamente conectada ao tema do hackathon: aplicações de blockchain na proteção da infância.**

### Conceitos-chave

1. **Analogia do grupo de mensagens.** A blockchain é como um grupo gigante de WhatsApp em que todos veem o histórico: se alguém tenta apagar ou editar uma mensagem antiga, as outras cópias revelam a manipulação na hora. Transparência + distribuição + verificação.
2. **Limite honesto da tecnologia:** a blockchain **não garante que a informação inserida seja verdadeira** — ela torna muito difícil alterar silenciosamente o que já foi registrado. (Dados errados na entrada continuam errados, só que imutáveis.)
3. **Ingressos digitais únicos.** Cada ingresso pode ter identidade única e rastreável, com regras embutidas (limite de preço de revenda, bloqueio de transferências irregulares) — fim do golpe do print.
4. **Gêmeo digital de produtos.** Uma marca registra o "gêmeo" do tênis/roupa na blockchain; escaneando um chip, o comprador vê a história do item desde a fábrica. Sem registro, é falso. A mesma lógica vale para procedência de imagens (inclusive geradas por IA) e diplomas.
5. **Histórico escolar protegido.** Uma criança que fugiu de crise ou desastre e perdeu tudo pode continuar estudando em outro lugar se a escola usar blockchain: o histórico fica em rede segura, acessível de qualquer lugar do mundo.
6. **Rastreio de vacinas e insumos médicos.** Da saída da fábrica ao transporte até a aplicação na criança — inclusive condições como refrigeração ("chegar geladinho") — evitando desperdício e garantindo que recursos cheguem a comunidades isoladas.
7. **Transparência nas doações.** Cada doação rastreável até o destino final (um filtro de água, material didático), dando ao doador certeza do impacto real.
8. **Carteira digital na prática.** A carteira é como uma **chave de hotel**: não contém o quarto, mas prova a autorização e libera o acesso — os ativos ficam na rede, não no app. Exemplo da aula: **Phantom, na rede Solana**. A **frase de recuperação de 12 palavras** é a credencial principal: anotar em papel, guardar offline, nunca compartilhar (a senha do app protege só o uso cotidiano no aparelho e não a substitui).

### O que cai no quiz

- Saiba explicar **por que a blockchain é comparada a um grupo de WhatsApp gigante** — a analogia abre o quiz.
- Preste atenção em **como a blockchain resolve ingressos falsos** e **o que é o gêmeo digital** de um produto.
- Os três casos de proteção da infância da aula 6.2 viram perguntas: **o que acontece com o histórico escolar** da criança deslocada, **o que dá para rastrear** no envio de ajuda humanitária (o trajeto completo) e **como funciona a transparência nas doações**.
- Da aula 6.3: **a que objeto a carteira é comparada**, **qual carteira e qual rede** são usadas no exemplo e **qual é o passo mais importante** na criação da carteira.
- A última pergunta pede a **frase que resume o módulo** — pense em qual síntese junta registros confiáveis, autenticidade, proteção social e acesso à Web3.

### Serve para o nosso projeto?

- **Os três casos da aula 6.2 são praticamente briefs de projeto prontos, validados pela própria trilha oficial**: (a) credenciais/histórico escolar portável para crianças migrantes e deslocadas (eixos Educação + Proteção); (b) rastreio de vacinas/insumos até comunidades isoladas (Saúde); (c) transparência ponta-a-ponta em doações (transversal). Partir de um deles alinha a solução com o que o UNICEF já sinalizou como uso legítimo.
- A escolha de **Phantom + Solana** como exemplo oficial da trilha reforça nossa decisão estratégica pela Solana.
- O limite "blockchain não valida a verdade na entrada" deve virar item da nossa análise de **Risco** (quem insere os dados? como garantir a qualidade na origem?).

---

## Módulo 07 — Desmistificando a blockchain (visão de negócios)

**Autora/formato:** Sabrina Olivo (líder de estratégia da ZKsync/Prividium na América Latina; ex-Monashees e Ethereum Brasil, vencedora de 9 hackathons). 1 **áudio-aula**: episódio do podcast Sororitê Talk incorporado do Spotify. É o módulo com a visão mais "de mercado/startup".

### Conceitos-chave

1. **O caderno compartilhado.** Blockchain como um caderno de registro digital, automático e distribuído globalmente: todos verificam o que foi escrito e nenhuma alteração passa despercebida. Resolve o **problema da confiança entre partes que não se conhecem**.
2. **A estrada e os veículos.** Blockchain é a **estrada** (infraestrutura); Bitcoin, Ether e Solana são **veículos** que trafegam sobre ela. Sobre a mesma infraestrutura circulam pagamentos, ativos, identidade, registros, arte, agro, mercado financeiro.
3. **O papel histórico do Bitcoin:** colocou a blockchain no mapa como dinheiro digital escasso, sem precisar de emissor central.
4. **Por que a infraestrutura interessa a negócios:** reduz intermediários, acelera processos, diminui custos, cria **auditoria automática** e abre mercados antes restritos — processos cheios de reconciliação manual viram registros programáveis.
5. **Tokenização.** Transformar recebíveis futuros ou ativos reais em tokens amplia liquidez e permite acesso a múltiplos investidores. Rastreabilidade no agro: registrar etapas da cadeia produtiva para comprovar, por exemplo, que um produto é orgânico.
6. **Transparência precisa de privacidade.** A transparência radical da blockchain é força e risco ao mesmo tempo: para funcionar no mundo real — especialmente em finanças e instituições — precisa de **camadas de privacidade**.
7. **Criptomoedas vs stablecoins.** Criptomoedas como o Bitcoin variam livremente de preço; stablecoins buscam manter valor estável (relevante para pagamentos).
8. **IA + blockchain.** IA automatiza decisões e fluxos; blockchain viabiliza pagamentos rápidos, baratos, transparentes e com menos intermediários — juntas, criam experiências programáveis e globais. Síntese do módulo: **blockchain não serve para tudo, mas é poderosa quando resolve problemas de confiança, coordenação, liquidez, transparência ou redução de intermediários**.

### O que cai no quiz

- Saiba reproduzir **a metáfora que resume a blockchain** (o caderno) e **qual problema ela resolve** em ambientes digitais.
- A **metáfora da estrada e dos veículos** cai como pergunta de diferenciação entre blockchain e criptomoedas; o **papel histórico do Bitcoin** cai separado.
- Preste atenção nos exemplos de **rastreabilidade de produtos** (o caso do orgânico) e no significado de **tokenizar recebíveis/ativos reais**.
- O quiz cobra o **cuidado sobre transparência × privacidade** em aplicações financeiras e a **diferença entre criptomoedas e stablecoins**.
- Saiba explicar **como IA e blockchain se complementam** e qual **frase-síntese** expressa a visão do módulo (quando blockchain vale a pena e quando não).

### Serve para o nosso projeto?

- A frase-síntese do módulo é **o critério de Inovação da banca em uma linha**: usar no pitch para mostrar que sabemos quando blockchain é necessária — e provar que nosso caso resolve confiança/coordenação/transparência de verdade.
- O tema **transparência precisa de privacidade** conversa diretamente com LGPD/ECA: transparência dos fluxos (recursos, entregas) com privacidade dos titulares (as crianças). É o desenho arquitetural que a banca vai querer ver na dimensão Risco.
- Stablecoins para pagamentos com menos intermediários: mesmo mecanismo que o próprio hackathon usa para pagar os prêmios (Superteam Earn) — bom exemplo concreto de eficiência.

---

## Síntese final para o projeto

**Quando blockchain é realmente necessária — o fio condutor dos 7 módulos.** Todos os módulos, do guia da Reuters ao podcast da Sabrina, convergem na mesma tese: blockchain vale a pena quando **múltiplos participantes que não confiam plenamente uns nos outros precisam consultar o mesmo histórico e verificar informações sem permitir alterações invisíveis**. As cinco funções que se repetem em todas as aulas — e que são exatamente o que a banca avalia no critério Inovação — são: **confiança** (entre partes que não se conhecem, sem autoridade central), **transparência** (registros públicos e auditáveis automaticamente, sem reconciliação manual), **rastreabilidade** (da origem ao destino: doações, vacinas, insumos, certificados), **inclusão** (autonomia sobre dados, credenciais portáveis para quem perdeu documentos, acesso sem intermediários) e **eficiência** (menos intermediários, menos custo, pagamentos programáveis). Blockchain é **supérflua** quando: há um só ator controlando os dados e todos já confiam nele (um banco de dados comum resolve); os dados de entrada não são confiáveis (o módulo 6 avisa: a chain não valida a verdade na origem — imutabilizar dado errado é pior); ou quando a transparência radical exporia dados sensíveis sem camada de privacidade (módulo 7). O teste rápido, tirado da aula 1.4: *se você remover a blockchain da solução e nada de essencial se perder, ela era adorno — e a banca percebe*.

**As prioridades do UNICEF Brasil.** O Programa de País 2024–2028 (módulo 1) foca nos **mais vulnerabilizados**: crianças e adolescentes afrodescendentes, indígenas, quilombolas, ribeirinhos, com deficiência, migrantes e atingidos por emergências e desastres climáticos — concentrados em territórios prioritários alcançados via Selo UNICEF e Agenda Cidade. As desigualdades são **interligadas** (pobreza + discriminação + violência + serviços precários), o que explica por que a live valorizou soluções **transversais aos 4 eixos** (Educação, Saúde, Água/Saneamento, Proteção da Infância) no desempate por escalabilidade. E os módulos 5 e 6 mostram quais aplicações o próprio UNICEF já apresenta como legítimas: **credenciais e históricos escolares portáveis** (criança migrante/deslocada não perde a trajetória), **rastreio de vacinas e insumos até comunidades isoladas**, **transparência ponta-a-ponta em doações e ajuda humanitária**, e **identidade com prova de conhecimento zero** (verificar uma condição da criança sem expor seus dados — a resposta técnica ao LGPD/ECA).

**Implicação para a nossa decisão de pilar e ideia:** a interseção mais forte entre "o que a trilha valida" e "o que o UNICEF prioriza" está em soluções que combinam **Proteção da Infância como âncora** com transversalidade — por exemplo, credencial/trajetória portável (Proteção + Educação + Saúde num só registro verificável) ou rastreio transparente de recursos/insumos para territórios prioritários (Proteção + Saúde + Saneamento). Em qualquer desenho: **provas e hashes on-chain, dados pessoais off-chain**, rede pública de Proof of Stake (Solana — baixo custo, baixa energia, exemplificada na própria trilha com a carteira Phantom), e um pitch que comece pelo problema, não pela tecnologia.
