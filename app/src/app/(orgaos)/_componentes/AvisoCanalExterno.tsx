/**
 * O aviso de que existe um canal protegido — e de que ele **não é deste sistema**.
 *
 * ## Por que este bloco é igual nos três portais
 *
 * Tudo o mais foi feito para parecer software de instituições diferentes. Este
 * bloco não: é a mesma rede falando, pela mesma boca, dentro de três sistemas que
 * não se conhecem. Se ele mudasse de cara em cada portal, pareceria funcionalidade
 * da instituição — e ele é exatamente o contrário disso.
 *
 * ## Por que o canal fica fora
 *
 * Ele já esteve dentro do formulário da escola, e era errado. Aparecer no momento
 * do medo é bom de narrativa, mas o modelo de ameaça não fecha: de quem o
 * profissional tem medo é, muitas vezes, de quem manda no software.
 *
 * **A criptografia protege contra a rede e contra quem recebe. Não protege contra
 * o dono da máquina onde ela roda.** Gerar a prova aqui dentro colocaria o segredo
 * do profissional no sistema de quem ele teme. Por isso o canal é uma aplicação
 * separada, e estes portais apenas avisam que ela existe.
 *
 * O endereço aparece como texto e não como link pelo mesmo motivo: um clique
 * daqui viraria registro **deste** sistema — e seria o sistema da instituição
 * sabendo que o profissional pensou em avisar por fora. O único link é o de
 * demonstração, e ele está declarado como tal.
 */
export function AvisoCanalExterno({ motivo }: { motivo: string }) {
  return (
    <div
      className="rounded border p-3"
      style={{
        borderColor: "var(--alerta)",
        background: "color-mix(in srgb, var(--alerta) 7%, transparent)",
      }}
    >
      <p className="text-[0.8125rem] font-bold">
        Você não precisa passar por aqui para avisar.
      </p>
      <p className="mt-1 text-[0.75rem] text-[var(--texto-2)]">
        Existe um canal em que o profissional prova que é da rede deste município —
        o aviso vale igual, com o mesmo peso — sem que ninguém descubra qual
        profissional foi.{" "}
        <strong className="text-[var(--texto)]">
          Ele não é deste sistema, e roda fora dele.
        </strong>{" "}
        {motivo}
      </p>
      <p className="mt-2 font-mono text-[0.8125rem]">{"{endereço do canal}"}/denuncia</p>
      <p className="mt-1 text-[0.6875rem] text-[var(--texto-3)]">
        O endereço está escrito, e não como link, de propósito: um clique daqui
        seria registrado por este sistema — e seria o próprio sistema da
        instituição sabendo que você pensou em avisar por fora.
      </p>
      <a
        href="/denuncia"
        className="mt-2 inline-block text-[0.6875rem] underline"
        style={{ color: "var(--texto-3)" }}
      >
        abrir mesmo assim, só nesta demonstração
      </a>
    </div>
  );
}
