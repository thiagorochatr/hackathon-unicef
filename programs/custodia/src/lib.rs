//! Trilha de custódia e prazos da rede de proteção à infância.
//!
//! Princípio inegociável do projeto: **nenhum dado sigiloso de criança entra
//! nesta cadeia, nem cifrado**. O ledger é permanente e a criança de hoje ainda
//! será adulta por ~80 anos; ciphertext publicado hoje é dado vazado no dia em
//! que a cifra ceder. O que sobe aqui é apenas:
//!
//! - `alerta_id`: commitment opaco, que não deriva de identificador da criança;
//! - chaves públicas de instituição;
//! - hashes de agente responsável;
//! - timestamps e estados de custódia.
//!
//! A invariante central do programa é que **não existe estado sem dono**:
//! `Caso::custodiante` nunca é `Pubkey::default()`, e o repasse tem duas fases —
//! transferir não move a custódia, só o aceite assinado pelo destino move.

use anchor_lang::prelude::*;
use solana_sha256_hasher::hashv;

mod chave_verificacao;
pub mod zk;

declare_id!("EasKv552hhhCGZEV6KS9VUENEVGEgwhMxV59W9xoRc7h");

#[program]
pub mod custodia {
    use super::*;

    pub fn inicializar(ctx: Context<Inicializar>, mp: Pubkey) -> Result<()> {
        require!(mp != Pubkey::default(), ErroCustodia::DestinoInvalido);
        let config = &mut ctx.accounts.config;
        config.admin = ctx.accounts.admin.key();
        config.mp = mp;
        config.bump = ctx.bumps.config;
        Ok(())
    }

    /// Troca o endereço do Ministério Público que recebe os casos vencidos.
    /// Existe porque na vida real esse endereço muda — nova promotoria, nova
    /// chave, reorganização de comarca.
    pub fn definir_mp(ctx: Context<DefinirMp>, mp: Pubkey) -> Result<()> {
        require!(mp != Pubkey::default(), ErroCustodia::DestinoInvalido);
        ctx.accounts.config.mp = mp;
        Ok(())
    }

    pub fn registrar_instituicao(
        ctx: Context<RegistrarInstituicao>,
        tipo: TipoInstituicao,
        municipio_ibge: u32,
        nome_hash: [u8; 32],
    ) -> Result<()> {
        let inst = &mut ctx.accounts.instituicao;
        inst.authority = ctx.accounts.authority.key();
        inst.tipo = tipo;
        inst.municipio_ibge = municipio_ibge;
        inst.nome_hash = nome_hash;
        inst.ultimo_periodo_ancorado = 0;
        inst.bump = ctx.bumps.instituicao;
        Ok(())
    }

    /// Abre o caso a partir do cruzamento dos sinais.
    ///
    /// Quem assina é **quem fez o cruzamento**, não quem vai atender. O órgão
    /// responsável entra como parâmetro e não precisa concordar: o caso nasce
    /// com o relógio já correndo contra ele. Se fosse o próprio responsável a
    /// assinar a abertura, bastaria não assinar para o caso nunca existir — e
    /// aí não haveria o que cobrar depois.
    pub fn abrir_caso(
        ctx: Context<AbrirCaso>,
        alerta_id: [u8; 32],
        responsavel: Pubkey,
        agente_hash: [u8; 32],
        prazo_seg: i64,
    ) -> Result<()> {
        let emissor = ctx.accounts.autoridade.key();
        ctx.accounts.caso.nascer(
            alerta_id,
            responsavel,
            agente_hash,
            prazo_seg,
            ctx.bumps.caso,
            &emissor,
        )
    }

    /// Registra um **sinal credenciado**: um profissional prova que pertence ao
    /// setor sem dizer qual deles é, e com isso ganha o direito de emitir um
    /// sinal sobre uma criança.
    ///
    /// Repare no que esta instrução **não** faz: ela não abre caso. O caso
    /// continua nascendo só do cruzamento, quando setores diferentes convergem.
    /// O que a prova compra é o direito de entrar no cruzamento sem se
    /// identificar — a proteção é da pessoa, não do dado.
    ///
    /// E repare em quem assina: ninguém. Só quem paga a taxa, que não é órgão
    /// nenhum nem o denunciante. Quem autoriza é a prova, conferida aqui.
    ///
    /// O peso separa observação de denúncia:
    /// - **1, apontamento** — vi algo que sozinho não conclui nada;
    /// - **2, denúncia** — estou afirmando que há risco, e assumo isso.
    ///
    /// Com limiar 2, uma denúncia sozinha basta para o caso nascer, enquanto um
    /// apontamento precisa de convergência. É a diferença entre observar e
    /// afirmar, e ela existe porque quem vence o medo de denunciar não pode
    /// depender da sorte de outro setor ter registrado algo.
    pub fn registrar_sinal_credenciado(
        ctx: Context<RegistrarSinalCredenciado>,
        prova: [u8; zk::TAMANHO_PROVA],
        anulador: [u8; 32],
        periodo: u32,
        peso: u8,
        compromisso_sinal: [u8; 32],
    ) -> Result<()> {
        require!(peso >= 1 && peso <= 2, ErroCustodia::PesoInvalido);
        let grupo = &ctx.accounts.grupo;

        // O escopo é recalculado aqui, não aceito como parâmetro: é ele que dá
        // sentido ao anulador. Se viesse de fora, bastaria inventar um escopo
        // novo a cada vez para o limite de uma emissão por período não valer.
        //
        // Ele **não** inclui a criança, e isso é deliberado: incluir colocaria na
        // rede um valor estável por criança, permitindo correlacionar todos os
        // sinais sobre a mesma. O custo é o limite ser por período, e não por
        // criança. É a troca que o princípio de não pôr nada de criança na rede
        // nos impõe, e ela vai declarada.
        let entradas = zk::EntradasPublicas {
            raiz: grupo.raiz,
            anulador,
            // O compromisso amarra a prova a este sinal específico — a esta
            // criança e a este peso. Quem repassa a transação não consegue
            // trocar nem um nem outro.
            mensagem: zk::embaralhar(&compromisso_sinal),
            escopo: zk::embaralhar(&zk::valor_do_escopo(
                grupo.municipio_ibge,
                grupo.setor.como_byte(),
                periodo,
            )),
        };
        zk::conferir_prova(&prova, &entradas)?;

        // O anulador vira conta. Se já existir, a criação falha sozinha e a
        // segunda emissão do mesmo profissional no período não passa — sem lista
        // para percorrer e sem descobrir quem ele é.
        let agora = Clock::get()?.unix_timestamp;
        let marca = &mut ctx.accounts.nulificador;
        marca.usado_em = agora;
        marca.bump = ctx.bumps.nulificador;

        emit!(EventoSinalCredenciado {
            municipio_ibge: grupo.municipio_ibge,
            setor: grupo.setor,
            peso,
            compromisso_sinal,
            anulador,
            ts: agora,
        });
        Ok(())
    }

    /// Cria o grupo de profissionais credenciados de um município, vazio.
    ///
    /// Nasce sem ninguém dentro de propósito: todo credenciado entra por
    /// `adicionar_credenciados`, e é lá que a folha dele fica registrada em
    /// evento. Se o grupo pudesse nascer já cheio, haveria um conjunto inicial
    /// que ninguém conseguiria conferir.
    pub fn registrar_grupo(
        ctx: Context<RegistrarGrupo>,
        municipio_ibge: u32,
        setor: Setor,
        responsavel_padrao: Pubkey,
    ) -> Result<()> {
        require!(
            responsavel_padrao != Pubkey::default(),
            ErroCustodia::DestinoInvalido
        );
        let grupo = &mut ctx.accounts.grupo;
        grupo.municipio_ibge = municipio_ibge;
        grupo.setor = setor;
        grupo.raiz = [0u8; 32];
        grupo.responsavel_padrao = responsavel_padrao;
        grupo.membros = 0;
        grupo.bump = ctx.bumps.grupo;
        Ok(())
    }

    /// Credencia profissionais e move a raiz da árvore.
    ///
    /// **O evento carrega as folhas inseridas, uma a uma.** É isso que permite
    /// a qualquer pessoa refazer a árvore inteira lendo só a cadeia e conferir
    /// que a raiz publicada bate com as folhas — ou seja, que ninguém foi
    /// enfiado no grupo às escondidas para poder denunciar sem ser da rede.
    ///
    /// Limitação declarada: o programa **não** recalcula a árvore, porque isso
    /// custaria uma travessia de Poseidon por inserção. Ele registra raiz e
    /// folhas, e a conferência é de quem quiser fazer. Recalcular on-chain está
    /// no roteiro.
    /// Uma lista de folhas **vazia** é legítima e quer dizer "republicar a raiz
    /// sobre quem já está credenciado". Serve para consertar o caso em que um
    /// cliente publicou uma raiz que não correspondia às folhas. Não abre
    /// brecha nova: quem administra já escolhe a raiz de qualquer jeito, e a
    /// conferência de quem audita continua a mesma — refazer a árvore a partir
    /// de todos os eventos e comparar com a raiz publicada.
    pub fn adicionar_credenciados(
        ctx: Context<AtualizarGrupo>,
        folhas: Vec<[u8; 32]>,
        nova_raiz: [u8; 32],
    ) -> Result<()> {
        require!(folhas.len() <= 32, ErroCustodia::CredenciamentoLongoDemais);

        // Quem credencia é o órgão responsável do município — o CREAS, que é o
        // ponto técnico da rede local — ou quem administra o sistema. Não é o
        // comitê que faz o cruzamento: manter os dois papéis separados é de
        // propósito, para que quem cruza os sinais não escolha também quem pode
        // denunciar.
        let quem = ctx.accounts.credenciador.key();
        require!(
            quem == ctx.accounts.config.admin
                || quem == ctx.accounts.grupo.responsavel_padrao,
            ErroCustodia::NaoEhCredenciador
        );

        let grupo = &mut ctx.accounts.grupo;
        grupo.raiz = nova_raiz;
        grupo.membros = grupo
            .membros
            .checked_add(folhas.len() as u32)
            .ok_or(ErroCustodia::TrilhaCheia)?;

        emit!(EventoCredenciados {
            municipio_ibge: grupo.municipio_ibge,
            folhas,
            raiz: nova_raiz,
            membros: grupo.membros,
            ts: Clock::get()?.unix_timestamp,
        });
        Ok(())
    }

    /// Registra que um órgão emitiu um sinal.
    ///
    /// Existe para fechar o modo de falha número um da nossa própria lista: *o
    /// encaminhamento não deixa rastro; sai de A e ninguém prova depois*. Sem
    /// isto, o aviso protegido era demonstrável e o institucional não — o
    /// contrário do razoável, já que a instituição tem **dever legal** de
    /// notificar e precisa poder provar que cumpriu. Ou ser cobrada por não ter.
    ///
    /// Não cria conta: o registro é o próprio evento, assinado pelo órgão. Custa
    /// uma taxa de assinatura e nada de aluguel.
    ///
    /// O compromisso leva sal, como o do sinal protegido, e pela mesma razão:
    /// sem ele o valor se repetiria para a mesma criança e viraria um
    /// identificador dela gravado para sempre.
    pub fn registrar_sinal_institucional(
        ctx: Context<RegistrarSinalInstitucional>,
        compromisso: [u8; 32],
        peso: u8,
    ) -> Result<()> {
        require!(peso >= 1 && peso <= 2, ErroCustodia::PesoInvalido);
        let inst = &ctx.accounts.instituicao;
        require!(
            matches!(
                inst.tipo,
                TipoInstituicao::Ubs | TipoInstituicao::Escola | TipoInstituicao::Cras
            ),
            ErroCustodia::NaoEmiteSinal
        );

        emit!(EventoSinalInstitucional {
            instituicao: inst.key(),
            tipo: inst.tipo,
            peso,
            compromisso,
            ts: Clock::get()?.unix_timestamp,
        });
        Ok(())
    }

    /// Registra que o comitê abriu um veredito.
    ///
    /// O comitê tem a chave, e por isso é a parte em que mais se pede confiança.
    /// Esta instrução troca parte dessa confiança por contagem: **toda abertura
    /// que passa por aqui deixa rastro assinado**, e qualquer pessoa lê a conta
    /// sem pedir acesso a sistema nenhum — quantas vezes ele abriu, quantas
    /// viraram alerta, e quando foi a última.
    ///
    /// O que o compromisso é: um resumo do próprio envelope de veredito. Ele não
    /// serve para identificar criança nenhuma, e nem conseguiria: o veredito
    /// carrega um fator sorteado a cada avaliação, então o mesmo conjunto de
    /// sinais produz um envelope diferente — e um resumo diferente — toda vez.
    ///
    /// O que isto **não** faz, dito na cara: não impede uma abertura fora deste
    /// caminho. Para isso, comitê e nó de cruzamento precisam ser operadores
    /// diferentes, e aí o comitê pode recusar abrir o que não tiver pedido
    /// público. Aqui os dois são o mesmo processo, então o que se ganha é a
    /// contagem, não a barreira.
    pub fn registrar_abertura(
        ctx: Context<RegistrarAbertura>,
        compromisso: [u8; 32],
        alerta: bool,
    ) -> Result<()> {
        let agora = Clock::get()?.unix_timestamp;
        let quem = ctx.accounts.autoridade.key();

        let registro = &mut ctx.accounts.registro;
        registro.comite = quem;
        registro.total = registro.total.checked_add(1).ok_or(ErroCustodia::TrilhaCheia)?;
        if alerta {
            registro.alertas = registro
                .alertas
                .checked_add(1)
                .ok_or(ErroCustodia::TrilhaCheia)?;
        }
        registro.ultima = agora;
        registro.bump = ctx.bumps.registro;

        emit!(EventoAbertura {
            comite: quem,
            compromisso,
            alerta,
            total: registro.total,
            ts: agora,
        });
        Ok(())
    }

    /// Primeira fase do repasse. **Não move a custódia**: o caso continua sendo
    /// de quem transferiu e o prazo segue correndo contra ele. É o que impede a
    /// responsabilidade de evaporar no encaminhamento.
    pub fn transferir_para(ctx: Context<AtoDoCustodiante>, destino: Pubkey) -> Result<()> {
        require!(destino != Pubkey::default(), ErroCustodia::DestinoInvalido);
        let ator = ctx.accounts.custodiante.key();
        require!(destino != ator, ErroCustodia::DestinoInvalido);

        let caso = &mut ctx.accounts.caso;
        require!(
            matches!(caso.estado, Estado::Aberto | Estado::EmAtendimento),
            ErroCustodia::EstadoIncompativel
        );

        let agora = Clock::get()?.unix_timestamp;
        caso.estado = Estado::PendenteAceite;
        caso.pendente_para = Some(destino);
        // custodiante e prazo permanecem intactos — de propósito.
        caso.avancar_trilha(DISC_TRANSFERENCIA, &ator, agora)?;
        caso.checar_invariante()?;

        emit!(EventoCustodia {
            alerta_id: caso.alerta_id,
            tipo: DISC_TRANSFERENCIA,
            ator,
            destino: Some(destino),
            estado: caso.estado,
            prazo: caso.prazo,
            trilha_hash: caso.trilha_hash,
            ts: agora,
        });
        Ok(())
    }

    /// Segunda fase do repasse. Só o destino nomeado pode aceitar, e é o aceite
    /// assinado que efetivamente move a custódia.
    pub fn aceitar(ctx: Context<Aceitar>, novo_prazo_seg: i64, agente_hash: [u8; 32]) -> Result<()> {
        require!(novo_prazo_seg > 0, ErroCustodia::PrazoInvalido);
        let ator = ctx.accounts.destino.key();

        let caso = &mut ctx.accounts.caso;
        require!(
            caso.estado == Estado::PendenteAceite,
            ErroCustodia::EstadoIncompativel
        );
        require!(
            caso.pendente_para == Some(ator),
            ErroCustodia::NaoEhDestinoDoRepasse
        );

        let agora = Clock::get()?.unix_timestamp;
        caso.custodiante = ator;
        caso.pendente_para = None;
        caso.agente_hash = agente_hash;
        caso.estado = Estado::EmAtendimento;
        caso.prazo = agora
            .checked_add(novo_prazo_seg)
            .ok_or(ErroCustodia::PrazoInvalido)?;
        caso.avancar_trilha(DISC_ACEITE, &ator, agora)?;
        caso.checar_invariante()?;

        emit!(EventoCustodia {
            alerta_id: caso.alerta_id,
            tipo: DISC_ACEITE,
            ator,
            destino: None,
            estado: caso.estado,
            prazo: caso.prazo,
            trilha_hash: caso.trilha_hash,
            ts: agora,
        });
        Ok(())
    }

    /// Recusa tácita e escalonamento ao MP.
    ///
    /// **Permissionless por desenho:** não há signatário privilegiado — qualquer
    /// chave pode acionar depois de vencido o prazo. É isso que impede as partes
    /// interessadas de suprimirem a escalada simplesmente não a acionando.
    pub fn escalar(ctx: Context<Escalar>, novo_prazo_seg: i64) -> Result<()> {
        require!(novo_prazo_seg > 0, ErroCustodia::PrazoInvalido);
        let agora = Clock::get()?.unix_timestamp;
        let mp = ctx.accounts.config.mp;

        let caso = &mut ctx.accounts.caso;
        require!(
            matches!(
                caso.estado,
                Estado::Aberto | Estado::PendenteAceite | Estado::EmAtendimento
            ),
            ErroCustodia::EstadoIncompativel
        );
        require!(agora > caso.prazo, ErroCustodia::PrazoAindaVigente);

        caso.custodiante = mp;
        caso.pendente_para = None;
        caso.estado = Estado::Escalado;
        caso.prazo = agora
            .checked_add(novo_prazo_seg)
            .ok_or(ErroCustodia::PrazoInvalido)?;
        caso.avancar_trilha(DISC_ESCALONAMENTO, &mp, agora)?;
        caso.checar_invariante()?;

        emit!(EventoCustodia {
            alerta_id: caso.alerta_id,
            tipo: DISC_ESCALONAMENTO,
            ator: mp,
            destino: None,
            estado: caso.estado,
            prazo: caso.prazo,
            trilha_hash: caso.trilha_hash,
            ts: agora,
        });
        Ok(())
    }

    pub fn registrar_desfecho(
        ctx: Context<AtoDoCustodiante>,
        desfecho_hash: [u8; 32],
    ) -> Result<()> {
        let ator = ctx.accounts.custodiante.key();
        let caso = &mut ctx.accounts.caso;
        require!(
            caso.estado != Estado::Encerrado,
            ErroCustodia::EstadoIncompativel
        );

        let agora = Clock::get()?.unix_timestamp;
        caso.estado = Estado::Encerrado;
        caso.pendente_para = None;
        caso.avancar_trilha(DISC_DESFECHO, &ator, agora)?;
        let anterior = caso.trilha_hash;
        caso.trilha_hash = hashv(&[anterior.as_ref(), desfecho_hash.as_ref()]).to_bytes();
        caso.checar_invariante()?;

        emit!(EventoCustodia {
            alerta_id: caso.alerta_id,
            tipo: DISC_DESFECHO,
            ator,
            destino: None,
            estado: caso.estado,
            prazo: caso.prazo,
            trilha_hash: caso.trilha_hash,
            ts: agora,
        });
        Ok(())
    }

    /// Ancoragem periódica obrigatória. A instituição ancora mesmo sem nenhum
    /// caso — é a **ausência** da âncora que vira alarme, porque o modo de falha
    /// dominante na rede não é falsificar registro, é não registrar.
    pub fn ancorar_periodo(
        ctx: Context<AncorarPeriodo>,
        periodo: u32,
        commitment: [u8; 32],
    ) -> Result<()> {
        let agora = Clock::get()?.unix_timestamp;
        let inst = &mut ctx.accounts.instituicao;
        require!(
            periodo > inst.ultimo_periodo_ancorado,
            ErroCustodia::PeriodoJaAncorado
        );
        inst.ultimo_periodo_ancorado = periodo;

        let ancora = &mut ctx.accounts.ancora;
        ancora.instituicao = inst.key();
        ancora.periodo = periodo;
        ancora.commitment = commitment;
        ancora.ts = agora;
        ancora.bump = ctx.bumps.ancora;

        emit!(EventoAncoragem {
            instituicao: inst.key(),
            periodo,
            commitment,
            ts: agora,
        });
        Ok(())
    }
}

// ---------------------------------------------------------------------------
// Estado
// ---------------------------------------------------------------------------

pub const DISC_ABERTURA: u8 = 1;
pub const DISC_TRANSFERENCIA: u8 = 2;
pub const DISC_ACEITE: u8 = 3;
pub const DISC_ESCALONAMENTO: u8 = 4;
pub const DISC_DESFECHO: u8 = 5;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug, InitSpace)]
pub enum Estado {
    Aberto,
    PendenteAceite,
    EmAtendimento,
    Escalado,
    Encerrado,
}

/// Os setores da rede de proteção que emitem sinal.
///
/// A árvore de credenciados é **uma por setor, por município**. É o ponto de
/// equilíbrio: fina o bastante para o cruzamento saber que setores diferentes
/// convergiram, e larga o bastante para a pessoa se esconder entre todos os
/// profissionais de saúde, de educação ou de assistência do município.
///
/// Uma árvore por instituição diria de qual escola veio — e numa escola com
/// trinta professores isso não é anonimato nenhum.
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug, InitSpace)]
pub enum Setor {
    Saude,
    Educacao,
    Assistencia,
}

impl Setor {
    pub fn como_byte(&self) -> u8 {
        match self {
            Setor::Saude => 1,
            Setor::Educacao => 2,
            Setor::Assistencia => 3,
        }
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug, InitSpace)]
pub enum TipoInstituicao {
    Ubs,
    Escola,
    Cras,
    Creas,
    ConselhoTutelar,
    Mp,
    /// Quem roda o cruzamento dos sinais e emite os alertas.
    Comite,
}

#[account]
#[derive(InitSpace)]
pub struct Config {
    pub admin: Pubkey,
    pub mp: Pubkey,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Instituicao {
    pub authority: Pubkey,
    pub tipo: TipoInstituicao,
    pub municipio_ibge: u32,
    pub nome_hash: [u8; 32],
    pub ultimo_periodo_ancorado: u32,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Caso {
    /// Commitment opaco do alerta. Não deriva de identificador da criança.
    pub alerta_id: [u8; 32],
    /// Invariante: nunca `Pubkey::default()`.
    pub custodiante: Pubkey,
    pub pendente_para: Option<Pubkey>,
    pub agente_hash: [u8; 32],
    pub estado: Estado,
    pub prazo: i64,
    pub criado_em: i64,
    /// Elo corrente da hash chain da trilha, verificável fora da cadeia.
    pub trilha_hash: [u8; 32],
    pub eventos: u16,
    pub bump: u8,
}

impl Caso {
    fn nascer(
        &mut self,
        alerta_id: [u8; 32],
        custodiante: Pubkey,
        agente_hash: [u8; 32],
        prazo_seg: i64,
        bump: u8,
        ator: &Pubkey,
    ) -> Result<()> {
        require!(prazo_seg > 0, ErroCustodia::PrazoInvalido);
        require!(custodiante != Pubkey::default(), ErroCustodia::DestinoInvalido);
        let agora = Clock::get()?.unix_timestamp;

        self.alerta_id = alerta_id;
        self.custodiante = custodiante;
        self.pendente_para = None;
        self.agente_hash = agente_hash;
        self.estado = Estado::Aberto;
        self.prazo = agora
            .checked_add(prazo_seg)
            .ok_or(ErroCustodia::PrazoInvalido)?;
        self.criado_em = agora;
        self.trilha_hash = [0u8; 32];
        self.eventos = 0;
        self.bump = bump;

        self.avancar_trilha(DISC_ABERTURA, ator, agora)?;
        self.checar_invariante()?;

        emit!(EventoCustodia {
            alerta_id,
            tipo: DISC_ABERTURA,
            ator: *ator,
            destino: Some(custodiante),
            estado: self.estado,
            prazo: self.prazo,
            trilha_hash: self.trilha_hash,
            ts: agora,
        });
        Ok(())
    }

    fn avancar_trilha(&mut self, disc: u8, ator: &Pubkey, ts: i64) -> Result<()> {
        let anterior = self.trilha_hash;
        let disc_bytes = [disc];
        let ts_bytes = ts.to_le_bytes();
        self.trilha_hash = hashv(&[
            anterior.as_ref(),
            disc_bytes.as_ref(),
            ator.as_ref(),
            ts_bytes.as_ref(),
        ])
        .to_bytes();
        self.eventos = self
            .eventos
            .checked_add(1)
            .ok_or(ErroCustodia::TrilhaCheia)?;
        Ok(())
    }

    /// Não existe estado sem dono.
    fn checar_invariante(&self) -> Result<()> {
        require!(
            self.custodiante != Pubkey::default(),
            ErroCustodia::CasoSemDono
        );
        Ok(())
    }
}

/// O grupo de profissionais credenciados de um município.
///
/// Não guarda nome de ninguém: só a raiz da árvore. Saber a raiz não permite
/// descobrir quem está dentro, e é contra ela que a prova é conferida.
#[account]
#[derive(InitSpace)]
pub struct GrupoCredenciados {
    pub municipio_ibge: u32,
    pub setor: Setor,
    pub raiz: [u8; 32],
    /// Para quem vai o caso aberto por denúncia — CREAS ou Conselho Tutelar.
    pub responsavel_padrao: Pubkey,
    /// Quantos credenciados, só para o painel. Quanto maior, melhor o anonimato.
    pub membros: u32,
    pub bump: u8,
}

/// Quantas vezes o comitê abriu um veredito, e quantas viraram alerta.
///
/// Existe para ser lido por quem quiser conferir. Uma conta só, um `fetch`, sem
/// precisar percorrer a história inteira da rede.
#[account]
#[derive(InitSpace)]
pub struct RegistroAberturas {
    pub comite: Pubkey,
    pub total: u64,
    pub alertas: u64,
    pub ultima: i64,
    pub bump: u8,
}

/// Marca que um anulador já foi usado.
///
/// A conta em si não guarda nada de útil — o que importa é ela **existir**. O
/// endereço dela é derivado do anulador, então criar duas vezes é impossível, e
/// é isso que impede a mesma pessoa de denunciar repetidamente no mesmo período
/// sem que ninguém descubra quem ela é.
#[account]
#[derive(InitSpace)]
pub struct Nullificador {
    pub usado_em: i64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct AncoraPeriodo {
    pub instituicao: Pubkey,
    pub periodo: u32,
    pub commitment: [u8; 32],
    pub ts: i64,
    pub bump: u8,
}

// ---------------------------------------------------------------------------
// Contextos
// ---------------------------------------------------------------------------

#[derive(Accounts)]
pub struct Inicializar<'info> {
    #[account(
        init,
        payer = admin,
        space = 8 + Config::INIT_SPACE,
        seeds = [b"config"],
        bump
    )]
    pub config: Account<'info, Config>,
    #[account(mut)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DefinirMp<'info> {
    #[account(mut, seeds = [b"config"], bump = config.bump, has_one = admin)]
    pub config: Account<'info, Config>,
    pub admin: Signer<'info>,
}

#[derive(Accounts)]
pub struct RegistrarInstituicao<'info> {
    #[account(seeds = [b"config"], bump = config.bump, has_one = admin)]
    pub config: Account<'info, Config>,
    #[account(
        init,
        payer = admin,
        space = 8 + Instituicao::INIT_SPACE,
        seeds = [b"inst", authority.key().as_ref()],
        bump
    )]
    pub instituicao: Account<'info, Instituicao>,
    /// CHECK: chave da instituição sendo registrada; só é armazenada.
    pub authority: UncheckedAccount<'info>,
    #[account(mut)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(alerta_id: [u8; 32])]
pub struct AbrirCaso<'info> {
    #[account(
        init,
        payer = autoridade,
        space = 8 + Caso::INIT_SPACE,
        seeds = [b"caso", alerta_id.as_ref()],
        bump
    )]
    pub caso: Account<'info, Caso>,
    /// Só quem está cadastrado como responsável pelo cruzamento pode abrir caso.
    /// A derivação do endereço a partir de `autoridade` já garante que uma
    /// instituição não consegue usar o cadastro de outra.
    #[account(
        seeds = [b"inst", autoridade.key().as_ref()],
        bump = emissor.bump,
        constraint = emissor.tipo == TipoInstituicao::Comite @ ErroCustodia::NaoEhComite
    )]
    pub emissor: Account<'info, Instituicao>,
    #[account(mut)]
    pub autoridade: Signer<'info>,
    pub system_program: Program<'info, System>,
}

/// Registro de sinal credenciado.
///
/// **Não existe `Signer` de instituição aqui.** Só o pagador da taxa, que pode
/// ser qualquer chave e que não tem relação nenhuma com quem emitiu o sinal.
/// Quem autoriza é a prova, e quem confere é o programa.
#[derive(Accounts)]
#[instruction(prova: [u8; 256], anulador: [u8; 32])]
pub struct RegistrarSinalCredenciado<'info> {
    #[account(
        seeds = [b"grupo".as_ref(), &grupo.municipio_ibge.to_le_bytes(), &[grupo.setor.como_byte()]],
        bump = grupo.bump
    )]
    pub grupo: Account<'info, GrupoCredenciados>,
    /// Falha na criação se o anulador já tiver sido usado. É a proteção contra
    /// emissão repetida, e ela não precisa saber quem é ninguém.
    #[account(
        init,
        payer = pagador,
        space = 8 + Nullificador::INIT_SPACE,
        seeds = [b"nulificador", anulador.as_ref()],
        bump
    )]
    pub nulificador: Account<'info, Nullificador>,
    #[account(mut)]
    pub pagador: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(municipio_ibge: u32, setor: Setor)]
pub struct RegistrarGrupo<'info> {
    #[account(seeds = [b"config"], bump = config.bump, has_one = admin)]
    pub config: Account<'info, Config>,
    #[account(
        init,
        payer = admin,
        space = 8 + GrupoCredenciados::INIT_SPACE,
        seeds = [b"grupo".as_ref(), &municipio_ibge.to_le_bytes(), &[setor.como_byte()]],
        bump
    )]
    pub grupo: Account<'info, GrupoCredenciados>,
    #[account(mut)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AtualizarGrupo<'info> {
    #[account(seeds = [b"config"], bump = config.bump)]
    pub config: Account<'info, Config>,
    #[account(
        mut,
        seeds = [b"grupo".as_ref(), &grupo.municipio_ibge.to_le_bytes(), &[grupo.setor.como_byte()]],
        bump = grupo.bump
    )]
    pub grupo: Account<'info, GrupoCredenciados>,
    /// Conferido dentro da instrução: ou quem administra, ou o órgão
    /// responsável do município.
    pub credenciador: Signer<'info>,
}

#[derive(Accounts)]
pub struct RegistrarSinalInstitucional<'info> {
    /// A derivação a partir de `autoridade` impede um órgão de usar o cadastro
    /// de outro. Quem assina é o próprio órgão, e é isso que dá valor ao rastro.
    #[account(
        seeds = [b"inst", autoridade.key().as_ref()],
        bump = instituicao.bump
    )]
    pub instituicao: Account<'info, Instituicao>,
    #[account(mut)]
    pub autoridade: Signer<'info>,
}

#[derive(Accounts)]
pub struct RegistrarAbertura<'info> {
    #[account(
        init_if_needed,
        payer = autoridade,
        space = 8 + RegistroAberturas::INIT_SPACE,
        seeds = [b"aberturas", autoridade.key().as_ref()],
        bump
    )]
    pub registro: Account<'info, RegistroAberturas>,
    /// Só quem está cadastrado para fazer o cruzamento registra abertura. A
    /// derivação a partir de `autoridade` impede um órgão de usar o cadastro
    /// de outro.
    #[account(
        seeds = [b"inst", autoridade.key().as_ref()],
        bump = emissor.bump,
        constraint = emissor.tipo == TipoInstituicao::Comite @ ErroCustodia::NaoEhComite
    )]
    pub emissor: Account<'info, Instituicao>,
    #[account(mut)]
    pub autoridade: Signer<'info>,
    pub system_program: Program<'info, System>,
}

/// Ato que só o custodiante corrente pode praticar.
#[derive(Accounts)]
pub struct AtoDoCustodiante<'info> {
    #[account(
        mut,
        seeds = [b"caso", caso.alerta_id.as_ref()],
        bump = caso.bump,
        has_one = custodiante @ ErroCustodia::NaoEhCustodiante
    )]
    pub caso: Account<'info, Caso>,
    pub custodiante: Signer<'info>,
}

#[derive(Accounts)]
pub struct Aceitar<'info> {
    #[account(
        mut,
        seeds = [b"caso", caso.alerta_id.as_ref()],
        bump = caso.bump
    )]
    pub caso: Account<'info, Caso>,
    /// Precisa assinar: é o aceite que move a custódia.
    pub destino: Signer<'info>,
}

/// Escalonamento. Repare que não há `Signer` de instituição aqui — apenas o
/// pagador da taxa, que pode ser qualquer chave. Isso é intencional.
#[derive(Accounts)]
pub struct Escalar<'info> {
    #[account(seeds = [b"config"], bump = config.bump)]
    pub config: Account<'info, Config>,
    #[account(
        mut,
        seeds = [b"caso", caso.alerta_id.as_ref()],
        bump = caso.bump
    )]
    pub caso: Account<'info, Caso>,
    #[account(mut)]
    pub pagador: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(periodo: u32)]
pub struct AncorarPeriodo<'info> {
    #[account(
        mut,
        seeds = [b"inst", authority.key().as_ref()],
        bump = instituicao.bump,
        has_one = authority
    )]
    pub instituicao: Account<'info, Instituicao>,
    #[account(
        init,
        payer = authority,
        space = 8 + AncoraPeriodo::INIT_SPACE,
        seeds = [b"ancora", instituicao.key().as_ref(), &periodo.to_le_bytes()],
        bump
    )]
    pub ancora: Account<'info, AncoraPeriodo>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

// ---------------------------------------------------------------------------
// Eventos e erros
// ---------------------------------------------------------------------------

#[event]
pub struct EventoCustodia {
    pub alerta_id: [u8; 32],
    pub tipo: u8,
    pub ator: Pubkey,
    pub destino: Option<Pubkey>,
    pub estado: Estado,
    pub prazo: i64,
    pub trilha_hash: [u8; 32],
    pub ts: i64,
}

/// Toda entrada na árvore de credenciados vira evento **com as folhas**. É o
/// que permite refazer a árvore do zero, só lendo a cadeia, e conferir que a
/// raiz publicada corresponde exatamente a quem foi credenciado.
#[event]
pub struct EventoCredenciados {
    pub municipio_ibge: u32,
    pub folhas: Vec<[u8; 32]>,
    pub raiz: [u8; 32],
    pub membros: u32,
    pub ts: i64,
}

/// Cada sinal credenciado deixa registro público: de que setor veio, com que
/// peso e quando. Não diz quem emitiu nem sobre qual criança — o compromisso
/// leva um sal aleatório justamente para não virar um identificador estável de
/// criança na rede.
///
/// Serve para duas coisas: o nó de cruzamento só aceita envelope que tenha
/// registro aqui, o que o impede de inventar sinais; e qualquer pessoa consegue
/// contar quantas denúncias protegidas houve por setor e período.
#[event]
pub struct EventoSinalCredenciado {
    pub municipio_ibge: u32,
    pub setor: Setor,
    pub peso: u8,
    pub compromisso_sinal: [u8; 32],
    pub anulador: [u8; 32],
    pub ts: i64,
}

/// Cada sinal emitido por um órgão vira evento assinado por ele. É o que permite
/// provar depois que a unidade avisou — e ver quando ela não avisou.
///
/// Não diz sobre qual criança: o compromisso leva sal e muda a cada sinal.
#[event]
pub struct EventoSinalInstitucional {
    pub instituicao: Pubkey,
    pub tipo: TipoInstituicao,
    pub peso: u8,
    pub compromisso: [u8; 32],
    pub ts: i64,
}

/// Cada abertura de veredito vira evento. Somado ao contador, permite conferir
/// que o número na conta corresponde ao que de fato aconteceu.
#[event]
pub struct EventoAbertura {
    pub comite: Pubkey,
    pub compromisso: [u8; 32],
    pub alerta: bool,
    pub total: u64,
    pub ts: i64,
}

#[event]
pub struct EventoAncoragem {
    pub instituicao: Pubkey,
    pub periodo: u32,
    pub commitment: [u8; 32],
    pub ts: i64,
}

#[error_code]
pub enum ErroCustodia {
    #[msg("Quem assina não é o custodiante atual do caso")]
    NaoEhCustodiante,
    #[msg("Quem assina não é o destino nomeado do repasse")]
    NaoEhDestinoDoRepasse,
    #[msg("O estado atual do caso não permite esta transição")]
    EstadoIncompativel,
    #[msg("O prazo ainda está vigente; não há recusa tácita")]
    PrazoAindaVigente,
    #[msg("Prazo inválido")]
    PrazoInvalido,
    #[msg("Destino inválido")]
    DestinoInvalido,
    #[msg("Período já ancorado por esta instituição")]
    PeriodoJaAncorado,
    #[msg("Um caso não pode ficar sem custodiante")]
    CasoSemDono,
    #[msg("Quem assina não está cadastrado para emitir alertas")]
    NaoEhComite,
    #[msg("Trilha de eventos cheia")]
    TrilhaCheia,
    #[msg("A prova não tem o formato esperado")]
    ProvaMalFormada,
    #[msg("A prova não confere")]
    ProvaInvalida,
    #[msg("Credenciamento com folhas demais para uma transação")]
    CredenciamentoLongoDemais,
    #[msg("Quem assina não pode credenciar neste município")]
    NaoEhCredenciador,
    #[msg("Peso inválido: 1 para apontamento, 2 para denúncia")]
    PesoInvalido,
    #[msg("Este órgão não emite sinal de risco")]
    NaoEmiteSinal,
}
