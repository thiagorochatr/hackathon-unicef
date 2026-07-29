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

declare_id!("FsvcQn5BsZuC1CrqMtxNGFhohWFVxJq4jDnzwKgw493E");

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
        require!(prazo_seg > 0, ErroCustodia::PrazoInvalido);
        require!(responsavel != Pubkey::default(), ErroCustodia::DestinoInvalido);
        let agora = Clock::get()?.unix_timestamp;
        let emissor = ctx.accounts.autoridade.key();
        let custodiante = responsavel;

        let caso = &mut ctx.accounts.caso;
        caso.alerta_id = alerta_id;
        caso.custodiante = custodiante;
        caso.pendente_para = None;
        caso.agente_hash = agente_hash;
        caso.estado = Estado::Aberto;
        caso.prazo = agora
            .checked_add(prazo_seg)
            .ok_or(ErroCustodia::PrazoInvalido)?;
        caso.criado_em = agora;
        caso.trilha_hash = [0u8; 32];
        caso.eventos = 0;
        caso.bump = ctx.bumps.caso;

        caso.avancar_trilha(DISC_ABERTURA, &emissor, agora)?;
        caso.checar_invariante()?;

        emit!(EventoCustodia {
            alerta_id,
            tipo: DISC_ABERTURA,
            ator: emissor,
            destino: Some(custodiante),
            estado: caso.estado,
            prazo: caso.prazo,
            trilha_hash: caso.trilha_hash,
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
}
