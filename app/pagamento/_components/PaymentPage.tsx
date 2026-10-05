import Image from "next/image";
import Link from "next/link";
import { CheckoutPreview } from "./CheckoutPreview";
import styles from "./payment.module.css";

export type PaymentAudience = "participant" | "team";

const paymentPages = {
  participant: {
    label: "Participantes",
    title: "Pagamento de inscrição",
    description: "Um passo a mais na sua jornada FORJADOS. O pagamento acontece separadamente da sua ficha de inscrição.",
    item: "Inscrição no retiro",
    detail: "Participante FORJADOS",
    note: "Preencha sua ficha de inscrição antes de realizar o pagamento. Seus dados serão usados para identificar a sua participação.",
    amountEnvironment: "MERCADO_PAGO_PARTICIPANT_AMOUNT",
  },
  team: {
    label: "Equipe",
    title: "Pagamento da equipe",
    description: "Para quem faz essa jornada acontecer. Uma área dedicada ao pagamento dos integrantes da equipe FORJADOS.",
    item: "Participação da equipe",
    detail: "Equipe FORJADOS",
    note: "Esta página é destinada aos integrantes da equipe. Confirme sua participação com a organização antes de realizar o pagamento.",
    amountEnvironment: "MERCADO_PAGO_TEAM_AMOUNT",
  },
} as const;

function configuredAmount(environmentName: string): number | null {
  const value = process.env[environmentName]?.trim();
  if (!value || !/^\d+(\.\d{1,2})?$/.test(value)) return null;
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z" />
      <path d="m8 12 3 3 5-6" />
    </svg>
  );
}

export function PaymentPage({ audience }: { audience: PaymentAudience }) {
  const page = paymentPages[audience];
  const amount = configuredAmount(page.amountEnvironment);
  const formattedAmount = amount === null ? null : new Intl.NumberFormat("pt-BR", {
    style: "currency", currency: "BRL",
  }).format(amount);

  return (
    <div className={styles.page} data-audience={audience}>
      <a className={styles.skipLink} href="#payment-content">Ir para o pagamento</a>
      <header className={styles.header}>
        <Link href="/" className={styles.brand} aria-label="FORJADOS, página inicial">
          <Image src="/logo-forjados.png" alt="" width={84} height={52} className={styles.logo} priority />
          <span>FORJADOS<span className={styles.brandCaption}>Curados para curar</span></span>
        </Link>
        <Link href="/" className={styles.backLink}>Voltar ao site</Link>
      </header>

      <main id="payment-content" className={styles.main}>
        <div className={styles.intro}>
          <span className={styles.audience}>{page.label}</span>
          <h1>{page.title}</h1>
          <p>{page.description}</p>
        </div>

        <div className={styles.grid}>
          <aside className={styles.summary} aria-labelledby="payment-summary-title">
            <div className={styles.summaryTop}>
              <span className={styles.eyebrow}>Sua jornada</span>
              <h2 id="payment-summary-title">Resumo do pagamento</h2>
            </div>
            <div className={styles.item}>
              <span className={styles.itemIcon} aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="4" y="5" width="16" height="15" rx="3" /><path d="M8 3v4m8-4v4M4 10h16m-12 5 2 2 5-4" /></svg>
              </span>
              <div><h3>{page.item}</h3><p>{page.detail}</p></div>
            </div>
            <dl className={styles.details}>
              <div><dt>Categoria</dt><dd>{page.label}</dd></div>
              <div><dt>Quantidade</dt><dd>1 pessoa</dd></div>
              <div><dt>Moeda</dt><dd>Real brasileiro</dd></div>
            </dl>
            <div className={styles.total}>
              <span>Valor do pagamento</span>
              <strong className={!formattedAmount ? styles.pendingAmount : undefined}>{formattedAmount || "A confirmar"}</strong>
              <p>{formattedAmount ? "O valor será apresentado novamente antes da confirmação." : "O valor será divulgado pela organização antes da abertura dos pagamentos."}</p>
            </div>
            <div className={styles.registrationNote}>
              <p>{page.note}</p>
              {audience === "participant" && <Link href="/inscricao">Preencher ficha de inscrição</Link>}
            </div>
          </aside>

          <section className={styles.checkout} aria-labelledby="checkout-title">
            <div className={styles.checkoutHeader}>
              <div><span className={styles.eyebrow}>Pagamento online</span><h2 id="checkout-title">Como você prefere pagar?</h2></div>
              <span className={styles.provider}>Mercado Pago</span>
            </div>
            <CheckoutPreview audience={audience} />
          </section>
        </div>

        <section className={styles.reassurance} aria-label="Informações sobre o pagamento">
          <div><ShieldIcon /><p><strong>Pagamento pelo Mercado Pago</strong><span>Os dados de cartão serão preenchidos no formulário seguro do provedor.</span></p></div>
          <div><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m4 7 8 6 8-6" /></svg><p><strong>Confirmação do pagamento</strong><span>Após a ativação, você poderá acompanhar o resultado na própria página.</span></p></div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div><strong>Precisa de ajuda?</strong><a href="mailto:forjados.ofc@gmail.com">Fale com a organização</a></div>
        <nav aria-label="Informações legais"><Link href="/politica-de-privacidade">Privacidade</Link><Link href="/termo-de-ciencia">Termos de participação</Link></nav>
        <p>FORJADOS · Igreja Evangélica Sal da Terra</p>
      </footer>
    </div>
  );
}
