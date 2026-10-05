"use client";

import { useState } from "react";
import type { PaymentAudience } from "./PaymentPage";
import styles from "./payment.module.css";

export function CheckoutPreview({ audience }: { audience: PaymentAudience }) {
  const [method, setMethod] = useState<"pix" | "card">("pix");

  return (
    <>
      <p className={styles.methodIntro}>Conheça as formas de pagamento previstas para esta página.</p>
      <div className={styles.methods} role="group" aria-label="Prévia das formas de pagamento">
        <button type="button" id={`${audience}-pix-tab`} aria-pressed={method === "pix"} aria-controls={`${audience}-payment-panel`} onClick={() => setMethod("pix")} className={method === "pix" ? styles.methodSelected : styles.method}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="m12 3 9 9-9 9-9-9 9-9Z" /><path d="m6 9 3 3 3-3 3 3 3-3M6 15l3-3 3 3 3-3 3 3" /></svg>
          <span><strong>Pix</strong><small>QR Code ou Copia e Cola</small></span>
        </button>
        <button type="button" id={`${audience}-card-tab`} aria-pressed={method === "card"} aria-controls={`${audience}-payment-panel`} onClick={() => setMethod("card")} className={method === "card" ? styles.methodSelected : styles.method}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="3" /><path d="M3 10h18M7 15h4" /></svg>
          <span><strong>Cartão de crédito</strong><small>Opções no checkout</small></span>
        </button>
      </div>

      <div id={`${audience}-payment-panel`} role="region" aria-label="Como funciona a forma de pagamento selecionada" className={styles.methodPanel}>
        <div className={styles.methodDescription}>
          <span className={styles.stepNumber}>01</span>
          <div><h3>Identifique seu pagamento</h3><p>{audience === "participant" ? "Quando o pagamento estiver disponível, informe os mesmos dados da sua inscrição." : "Quando o pagamento estiver disponível, informe os dados do integrante da equipe."}</p></div>
        </div>
        <div className={styles.methodDescription}>
          <span className={styles.stepNumber}>02</span>
          <div><h3>{method === "pix" ? "Pague pelo app do seu banco" : "Preencha os dados no checkout"}</h3><p>{method === "pix" ? "Você poderá escanear o QR Code ou copiar o código Pix. A confirmação dependerá do processamento do pagamento." : "O Mercado Pago exibirá o formulário de cartão e as opções disponíveis antes de você confirmar."}</p></div>
        </div>
      </div>

      {/* Replace this slot with the official Payment Brick once server-side payment
          creation, notification verification, prices and credentials are configured.
          Public pages must never accept card numbers through a custom form. */}
      <div id={`mercado-pago-checkout-${audience}`} data-payment-audience={audience} className={styles.integrationSlot}>
        <span className={styles.lockIcon} aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="5" y="10" width="14" height="11" rx="3" /><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 4v3" /></svg></span>
        <h3>Pagamentos em breve</h3>
        <p>A organização está preparando esta etapa. Aguarde a liberação para realizar seu pagamento.</p>
        <button type="button" disabled className={styles.payButton}>Pagamento ainda indisponível</button>
        <span className={styles.noCharge}>Nenhuma cobrança é realizada nesta página no momento.</span>
      </div>
    </>
  );
}
