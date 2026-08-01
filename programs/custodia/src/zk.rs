//! Verificação da prova de denúncia protegida.
//!
//! O profissional prova que **pertence ao grupo de credenciados do município**
//! sem revelar qual deles é. Quem confere é este programa, dentro da rede — não
//! um servidor nosso. É essa diferença que permite dizer que ninguém precisa
//! ser acreditado: um promotor confere sozinho, lendo a cadeia.
//!
//! ## O que o quântico faz e o que não faz com isto
//!
//! A prova Groth16 tem *zero-knowledge perfeito*: a distribuição dela é
//! independente de quem a produziu. Não é "difícil de quebrar" — é
//! impossível, por teoria da informação. Um computador quântico em 2080 olhando
//! uma prova de 2026 não aprende nada sobre o denunciante.
//!
//! O que o quântico quebra é a **solidez**: forjar provas novas de pertencer ao
//! grupo sem pertencer. Isso é problema para frente, e a migração acompanha o
//! roteiro quântico da própria Solana. Ninguém que denunciou antes fica exposto.

use anchor_lang::prelude::*;
use groth16_solana::groth16::Groth16Verifier;
use solana_keccak_hasher::hashv;

use crate::chave_verificacao::{CHAVE_VERIFICACAO, NR_ENTRADAS};
use crate::ErroCustodia;

/// Tamanho da prova: 64 bytes do ponto A, 128 do B, 64 do C.
pub const TAMANHO_PROVA: usize = 256;

/// As quatro entradas públicas, na ordem em que o circuito as declara.
/// As duas primeiras são saídas do circuito; em Circom elas vêm antes.
pub struct EntradasPublicas {
    pub raiz: [u8; 32],
    pub anulador: [u8; 32],
    pub mensagem: [u8; 32],
    pub escopo: [u8; 32],
}

impl EntradasPublicas {
    fn como_vetor(&self) -> [[u8; 32]; NR_ENTRADAS] {
        [self.raiz, self.anulador, self.mensagem, self.escopo]
    }
}

/// Confere a prova contra a chave de verificação embutida.
///
/// A chave veio da cerimônia pública do Semaphore, não de uma cerimônia nossa.
/// É o que nos tira do problema político de trusted setup: quando o governo é
/// parte interessada, "confie em quem gerou os parâmetros" não é resposta.
pub fn conferir_prova(prova: &[u8; TAMANHO_PROVA], entradas: &EntradasPublicas) -> Result<()> {
    let ponto_a: &[u8; 64] = prova[0..64]
        .try_into()
        .map_err(|_| error!(ErroCustodia::ProvaMalFormada))?;
    let ponto_b: &[u8; 128] = prova[64..192]
        .try_into()
        .map_err(|_| error!(ErroCustodia::ProvaMalFormada))?;
    let ponto_c: &[u8; 64] = prova[192..256]
        .try_into()
        .map_err(|_| error!(ErroCustodia::ProvaMalFormada))?;

    let publicas = entradas.como_vetor();
    let mut verificador = Groth16Verifier::new(
        ponto_a,
        ponto_b,
        ponto_c,
        &publicas,
        &CHAVE_VERIFICACAO,
    )
    .map_err(|_| error!(ErroCustodia::ProvaMalFormada))?;

    // `verify` (e não `verify_unchecked`) também confere que cada entrada
    // pública cabe no corpo da curva. Sem isso, valores fora da faixa poderiam
    // ser reduzidos e colidir com entradas legítimas.
    verificador
        .verify()
        .map_err(|_| error!(ErroCustodia::ProvaInvalida))?;
    Ok(())
}

/// O mesmo embaralhamento que o Semaphore aplica antes de alimentar o circuito:
/// keccak256 sobre 32 bytes, deslocado 8 bits para a direita.
///
/// O deslocamento existe porque o resultado de 256 bits não cabe no corpo da
/// curva; jogar fora o último byte resolve. Refazemos a conta aqui para poder
/// **amarrar a prova ao caso**: sem isso, quem repassa a transação poderia usar
/// uma prova legítima para abrir um caso diferente do que o denunciante quis.
pub fn embaralhar(valor: &[u8; 32]) -> [u8; 32] {
    let digest = hashv(&[valor]).to_bytes();
    let mut saida = [0u8; 32];
    saida[1..32].copy_from_slice(&digest[0..31]);
    saida
}

/// Monta o escopo da denúncia a partir do município e do período.
///
/// O escopo decide o que o anulador impede: cada credenciado emite **um** sinal
/// protegido por setor, por município, por período. Compor os números num só,
/// em vez de formatar um texto, evita a única classe de bug que importaria
/// aqui — os dois lados chegarem a bytes diferentes para o mesmo escopo.
pub fn valor_do_escopo(municipio_ibge: u32, setor: u8, periodo: u32) -> [u8; 32] {
    let combinado = ((municipio_ibge as u64) << 40)
        | ((setor as u64) << 32)
        | (periodo as u64);
    let mut saida = [0u8; 32];
    saida[24..32].copy_from_slice(&combinado.to_be_bytes());
    saida
}

#[cfg(test)]
mod testes {
    use super::*;

    // Prova Semaphore de verdade, gerada por `scripts/zk/spike.ts`.
    include!("chave_verificacao_teste.rs");

    fn entradas() -> EntradasPublicas {
        EntradasPublicas {
            raiz: ENTRADAS[0],
            anulador: ENTRADAS[1],
            mensagem: ENTRADAS[2],
            escopo: ENTRADAS[3],
        }
    }

    #[test]
    fn confere_uma_prova_legitima() {
        assert!(conferir_prova(&PROVA, &entradas()).is_ok());
    }

    #[test]
    fn rejeita_prova_adulterada() {
        let mut adulterada = PROVA;
        adulterada[0] ^= 0x01;
        assert!(conferir_prova(&adulterada, &entradas()).is_err());
    }

    #[test]
    fn rejeita_raiz_trocada() {
        // Uma raiz de outro grupo: a prova é legítima, mas não é daquela árvore.
        let mut e = entradas();
        e.raiz[31] ^= 0x01;
        assert!(conferir_prova(&PROVA, &e).is_err());
    }

    #[test]
    fn rejeita_anulador_trocado() {
        let mut e = entradas();
        e.anulador[31] ^= 0x01;
        assert!(conferir_prova(&PROVA, &e).is_err());
    }

    /// Os mesmos bytes estão fixados no teste em TypeScript (`tests/cripto.ts`).
    /// Os dois lados calculam por conta própria e chegam ao mesmo valor: se um
    /// mudar sem o outro, um dos dois testes cai.
    ///
    /// Existe porque essa divergência já aconteceu, e o único sintoma foi "a
    /// prova não confere" — sem dizer onde nem por quê.
    #[test]
    fn escopo_bate_com_o_lado_do_cliente() {
        let casos: [(u32, u8, u32, [u8; 8]); 3] = [
            (
                3552205,
                2,
                202608,
                [0x36, 0x33, 0xcd, 0x02, 0x00, 0x03, 0x17, 0x70],
            ),
            (0, 0, 0, [0; 8]),
            (1, 1, 1, [0x00, 0x00, 0x01, 0x01, 0x00, 0x00, 0x00, 0x01]),
        ];
        for (municipio, setor, periodo, esperado) in casos {
            let v = valor_do_escopo(municipio, setor, periodo);
            // Os 24 primeiros bytes são zero: o escopo cabe em 8.
            assert_eq!(&v[0..24], &[0u8; 24], "escopo transbordou");
            assert_eq!(&v[24..32], &esperado, "escopo divergente");
        }
    }

    #[test]
    fn rejeita_mensagem_trocada() {
        // É o que impede reaproveitar a prova para abrir um caso diferente.
        let mut e = entradas();
        e.mensagem[31] ^= 0x01;
        assert!(conferir_prova(&PROVA, &e).is_err());
    }
}
