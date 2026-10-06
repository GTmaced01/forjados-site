"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Script from "next/script";
import type { PaymentAudience } from "./PaymentPage";
import styles from "./payment.module.css";

type Person = { cpf: string; email: string };
type Order = { id: string; categoria: string; quantity: number; total: number; status: string; paymentId: string | null; pixCode: string | null; pixQr: string | null };
type Session = { id: string; token: string };
type Config = { ready: boolean; publicKey: string | null; mode: string };
type Brick = { unmount: () => Promise<void> };
type PaymentMethod = "card" | "pix";
type BrickSettings = {
  initialization: { amount: number; payer?: { email?: string; identification?: { type: string; number: string } } };
  customization: {
    visual: {
      hideFormTitle: boolean;
      style: { theme: string; customVariables: Record<string, string> };
      texts: Record<string, unknown>;
      defaultPaymentOption: { creditCardForm?: boolean; bankTransferForm?: boolean };
    };
    paymentMethods: { creditCard?: string; bankTransfer?: string; minInstallments: number; maxInstallments: number };
  };
  callbacks: { onReady: () => void; onError: (error: unknown) => void; onSubmit: (input: { formData: Record<string, unknown> }) => Promise<void> };
};
declare global {
  interface Window {
    MercadoPago: new (key: string, options: { locale: string }) => { bricks: () => { create: (type: string, id: string, settings: BrickSettings) => Promise<Brick> } };
  }
}
const endpoint = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/site-payment`;
const money = (amount: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(amount);
const emptyPerson = () => ({ cpf: "", email: "" });
async function api(body: Record<string, unknown>) {
  const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(25000) });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data) throw new Error(data?.error || "Não foi possível consultar o pagamento. Tente novamente.");
  return data;
}
function newSession(): Session {
  return { id: crypto.randomUUID(), token: Array.from(crypto.getRandomValues(new Uint8Array(32)), byte => byte.toString(16).padStart(2, "0")).join("") };
}
const statusText: Record<string, [string, string]> = {
  prepared: ["Inscrições identificadas", "Confira o total e escolha Pix ou cartão de crédito abaixo."],
  submitting: ["Confirmando a tentativa", "Use Retomar confirmação para verificar a mesma tentativa, sem criar outro pedido. Você não precisa preencher o cartão novamente."],
  pending: ["Aguardando pagamento", "No Pix, use o código abaixo. A confirmação aparecerá nesta página após o processamento."],
  in_process: ["Pagamento em análise", "Aguarde a análise do Mercado Pago. Você pode voltar a esta página para acompanhar."],
  authorized: ["Pagamento em processamento", "O pagamento ainda precisa ser confirmado pelo Mercado Pago."],
  approved: ["Pagamento aprovado!", "As inscrições deste pedido foram marcadas como pagas no painel da organização."],
  rejected: ["Pagamento não aprovado", "O Mercado Pago recusou a tentativa. Você pode iniciar um novo pagamento."],
  cancelled: ["Pagamento cancelado", "As inscrições continuam sem pagamento confirmado. Você pode tentar novamente."],
  refunded: ["Pagamento estornado", "O status das inscrições foi atualizado. Fale com a organização para mais informações."],
  charged_back: ["Pagamento contestado", "Fale com a organização para verificar a situação das inscrições."],
  failed: ["Tentativa não concluída", "Você pode iniciar um novo pagamento e conferir os dados do pagador."],
  expired: ["Sessão expirada", "Identifique novamente as inscrições para continuar."],
};
const terminal = ["approved", "rejected", "cancelled", "refunded", "charged_back", "failed", "expired"];

export function PaymentFlow({ audience }: { audience: PaymentAudience }) {
  const category = audience === "team" ? "equipe" : "participante";
  const label = audience === "team" ? "Equipe" : "Participantes";
  const unit = audience === "team" ? 90 : 180;
  const storageKey = `forjados-payment-${category}`;
  const [persons, setPersons] = useState<Person[]>([emptyPerson()]);
  const [config, setConfig] = useState<Config | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sdkReady, setSdkReady] = useState(false);
  const [brickReady, setBrickReady] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [cardInstallments, setCardInstallments] = useState<1 | 2 | 3>(1);
  const [copied, setCopied] = useState(false);
  const attempt = useRef<Session | null>(null);
  const activeRequest = useRef(false);
  const brickQueue = useRef<Promise<void>>(Promise.resolve());
  const cardInstallmentsRef = useRef<1 | 2 | 3>(1);
  const orderId = order?.id;
  const orderStatus = order?.status;
  const orderTotal = order?.total;
  const payerEmail = persons[0]?.email.trim().toLowerCase() || "";
  const payerDocument = persons[0]?.cpf.replace(/\D/g, "") || "";

  useEffect(() => {
    let alive = true;
    async function initialize() {
      try {
        const identified = sessionStorage.getItem(`forjados-registration-${category}`);
        if (identified) {
          const person = JSON.parse(identified);
          if (typeof person.cpf === "string" && typeof person.email === "string") setPersons([person]);
          sessionStorage.removeItem(`forjados-registration-${category}`);
        }
      } catch { /* Identification is available even when browser storage is blocked. */ }
      try {
        const data = await api({ action: "config" });
        if (!alive) return;
        setConfig(data);
        let stored: string | null = null;
        try { stored = localStorage.getItem(storageKey); } catch { /* Optional persistence. */ }
        if (stored && data.ready) {
          const previous = JSON.parse(stored) as Session;
          const result = await api({ action: "status", ...previous });
          if (alive && result.order.categoria === category) { setSession(previous); setOrder(result.order); }
        }
      } catch (err) {
        if (alive) setError(err instanceof Error ? err.message : "Não foi possível carregar o pagamento.");
      }
    }
    void initialize();
    return () => { alive = false; };
  }, [category, storageKey]);

  // Serialized mount/unmount handles React Strict Mode and navigation safely.
  useEffect(() => {
    if (!session || !orderId || !orderTotal || orderStatus !== "prepared" || !sdkReady || !config?.publicKey || !paymentMethod) return;
    let cancelled = false;
    let controller: Brick | undefined;
    brickQueue.current = brickQueue.current.catch(() => {}).then(async () => {
      if (cancelled) return;
      setBrickReady(false);
      const provider = new window.MercadoPago(config.publicKey!, { locale: "pt-BR" });
      controller = await provider.bricks().create("payment", `mercado-pago-${audience}-${paymentMethod}`, {
        initialization: {
          amount: orderTotal,
          ...(config.mode === "test" && paymentMethod === "card"
            ? { payer: { email: "test@testuser.com" } }
            : payerEmail && payerDocument
              ? { payer: { email: payerEmail, identification: { type: "CPF", number: payerDocument } } }
              : {}),
        },
        customization: {
          visual: {
            hideFormTitle: true,
            style: {
              theme: "dark",
              customVariables: {
                textPrimaryColor: "#f6f3ec", textSecondaryColor: "#aaa49a",
                inputBackgroundColor: "#1b1b1d", formBackgroundColor: "#151516",
                baseColor: "#d4a657", baseColorFirstVariant: "#e4bc78", baseColorSecondVariant: "#a97835",
                errorColor: "#ff9a7d", successColor: "#79c994", secondarySuccessColor: "#173d27",
                outlinePrimaryColor: "#6f5a39", outlineSecondaryColor: "#343438", buttonTextColor: "#171109",
                borderRadiusSmall: "8px", borderRadiusMedium: "12px", borderRadiusLarge: "16px", formPadding: "0px",
              },
            },
            texts: {
              emailSectionTitle: "Dados para confirmação",
              installmentsSectionTitle: "Parcelamento",
              selectInstallments: "Escolha de 1 a 3 parcelas",
              formSubmit: "Confirmar pagamento",
            },
            defaultPaymentOption: paymentMethod === "card" ? { creditCardForm: true } : { bankTransferForm: true },
          },
          paymentMethods: paymentMethod === "card"
            ? { creditCard: "all", minInstallments: 1, maxInstallments: 3 }
            : { bankTransfer: "pix", minInstallments: 1, maxInstallments: 1 },
        },
        callbacks: {
          onReady: () => { if (!cancelled) setBrickReady(true); },
          onError: brickError => {
            const detail = brickError instanceof Error ? brickError.message : JSON.stringify(brickError);
            console.error(`Mercado Pago Brick: ${detail}`);
            if (!cancelled) setError("Não foi possível carregar o formulário do Mercado Pago. Recarregue esta página.");
          },
          onSubmit: async ({ formData }) => {
            if (activeRequest.current) throw new Error("Aguarde a confirmação da tentativa em andamento.");
            activeRequest.current = true;
            setBusy(true); setError("");
            try {
              const submittedForm = paymentMethod === "card"
                ? { ...formData, installments: cardInstallmentsRef.current }
                : { ...formData, installments: 1 };
              const result = await api({ action: "create", ...session, formData: submittedForm });
              setOrder(result.order);
            } catch (err) {
              const message = err instanceof Error ? err.message : "Não foi possível confirmar o pagamento.";
              setError(message);
              // Retrieve the persisted state even when the creation response was lost.
              try { setOrder((await api({ action: "status", ...session })).order); } catch { /* Same session remains available for retry. */ }
              throw new Error(message);
            } finally { activeRequest.current = false; setBusy(false); }
          },
        },
      });
      if (cancelled) { await controller.unmount(); controller = undefined; }
    }).catch(() => { if (!cancelled) setError("O formulário do Mercado Pago não carregou. Tente recarregar a página."); });
    return () => {
      cancelled = true;
      brickQueue.current = brickQueue.current.catch(() => {}).then(async () => { if (controller) await controller.unmount(); });
    };
  }, [session, orderId, orderStatus, orderTotal, sdkReady, config?.publicKey, config?.mode, audience, payerEmail, payerDocument, paymentMethod]);

  useEffect(() => {
    if (!session || !orderStatus || terminal.includes(orderStatus) || orderStatus === "prepared") return;
    let alive = true;
    const timer = setInterval(async () => {
      if (document.hidden || activeRequest.current) return;
      activeRequest.current = true;
      try {
        const data = await api({ action: "status", ...session });
        if (alive) { setOrder(data.order); setError(""); }
      } catch (err) { if (alive) setError(err instanceof Error ? err.message : "Resultado ainda indisponível."); }
      finally { activeRequest.current = false; }
    }, 15000);
    return () => { alive = false; clearInterval(timer); };
  }, [session, orderStatus]);

  function quantity(value: number) {
    const safe = Math.max(1, Math.min(20, Math.trunc(value) || 1));
    setPersons(current => Array.from({ length: safe }, (_, i) => current[i] || emptyPerson()));
    attempt.current = null;
  }
  function edit(index: number, name: keyof Person, value: string) {
    setPersons(current => current.map((person, i) => i === index ? { ...person, [name]: value } : person));
    attempt.current = null;
  }
  function chooseInstallments(value: 1 | 2 | 3) {
    cardInstallmentsRef.current = value;
    setCardInstallments(value);
  }
  async function prepare(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (activeRequest.current || !config?.ready) return;
    activeRequest.current = true; setBusy(true); setError("");
    try {
      const next = attempt.current || newSession();
      attempt.current = next;
      // Save the capability before network I/O so a lost response is recoverable.
      try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* This tab still retains the session. */ }
      const result = await api({ action: "prepare", ...next, categoria: category, people: persons });
      setSession(next); setOrder(result.order);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível identificar as inscrições.");
      if (attempt.current) {
        try { const result = await api({ action: "status", ...attempt.current }); setSession(attempt.current); setOrder(result.order); }
        catch { /* Invalid details create no order; a lost response remains retryable. */ }
      }
    }
    finally { activeRequest.current = false; setBusy(false); }
  }
  async function consult() {
    if (!session || activeRequest.current) return;
    activeRequest.current = true; setBusy(true); setError("");
    try { setOrder((await api({ action: orderStatus === "submitting" ? "create" : "status", ...session })).order); }
    catch (err) { setError(err instanceof Error ? err.message : "Resultado ainda indisponível."); }
    finally { activeRequest.current = false; setBusy(false); }
  }
  async function restart() {
    if (activeRequest.current) return;
    if (order?.status === "prepared" && session) {
      activeRequest.current = true; setBusy(true);
      try { await api({ action: "abandon", ...session }); }
      catch (err) { setError(err instanceof Error ? err.message : "Não foi possível alterar o pedido."); return; }
      finally { activeRequest.current = false; setBusy(false); }
    }
    cardInstallmentsRef.current = 1;
    setOrder(null); setSession(null); setBrickReady(false); setPaymentMethod(null); setCardInstallments(1); setError(""); attempt.current = null;
    try { localStorage.removeItem(storageKey); } catch { /* Optional persistence. */ }
  }
  const qty = order?.quantity || persons.length;
  const total = order?.total || unit * qty;
  const status = order ? statusText[order.status] || ["Consultando pagamento", "Aguarde a confirmação do Mercado Pago."] : null;

  return (
    <div className={styles.grid}>
      <aside className={styles.summary} aria-labelledby="payment-summary-title">
        <div className={styles.summaryTop}><span className={styles.eyebrow}>Sua jornada</span><h2 id="payment-summary-title">Resumo do pagamento</h2></div>
        <div className={styles.item}><span className={styles.itemIcon} aria-hidden="true">✓</span><div><h3>{audience === "team" ? "Participação da equipe" : "Inscrição no retiro"}</h3><p>{label} FORJADOS</p></div></div>
        <dl className={styles.details}>
          <div><dt>Categoria</dt><dd>{label}</dd></div>
          <div><dt>Valor por pessoa</dt><dd>{money(unit)}</dd></div>
          <div><dt>Quantidade</dt><dd>{qty} {qty === 1 ? "pessoa" : "pessoas"}</dd></div>
          <div><dt>Crédito</dt><dd>Em até 3x</dd></div>
        </dl>
        {!order && <div className={styles.quantity}>
          <label htmlFor="payment-quantity">Quantas pessoas deseja pagar?</label>
          <div><button type="button" aria-label="Diminuir quantidade" disabled={busy || persons.length <= 1} onClick={() => quantity(persons.length - 1)}>−</button>
            <input id="payment-quantity" type="number" min="1" max="20" step="1" value={persons.length} disabled={busy} onChange={e => quantity(Number(e.target.value))} />
            <button type="button" aria-label="Aumentar quantidade" disabled={busy || persons.length >= 20} onClick={() => quantity(persons.length + 1)}>+</button></div>
          <small>Até 20 pessoas da mesma categoria por pagamento.</small>
        </div>}
        <div className={styles.total}><span>Total do pedido</span><strong>{money(total)}</strong><p>Pix à vista ou cartão de crédito em até 3x. Confira o valor das parcelas e eventuais juros no Mercado Pago antes de confirmar.</p></div>
        <div className={styles.registrationNote}><p>Cada pessoa precisa preencher sua ficha antes do pagamento. Use o mesmo CPF e e-mail da inscrição.</p><Link href={audience === "team" ? "/inscricaoequipe" : "/inscricao"}>Preencher ficha {audience === "team" ? "da equipe" : "de inscrição"}</Link></div>
      </aside>
      <section className={styles.checkout} aria-labelledby="checkout-title">
        <div className={styles.checkoutHeader}><div><span className={styles.eyebrow}>Pagamento online</span><h2 id="checkout-title">{order ? "Acompanhe seu pagamento" : "Identifique as inscrições"}</h2></div><span className={styles.provider}>Mercado Pago</span></div>
        <div className={styles.methodsInfo}><span>Pix · QR Code e Copia e Cola</span><span>Cartão de crédito · até 3x</span></div>
        {error && <p className={styles.error} role="alert">{error}</p>}
        {!order ? <>
          <p className={styles.methodIntro}>Informe os dados de cada pessoa para vincular o pagamento às fichas corretas.</p>
          <form onSubmit={prepare} className={styles.identification}>
            {persons.map((person, i) => <fieldset key={i} disabled={busy}>
              <legend>{audience === "team" ? "Integrante" : "Participante"} {i + 1}</legend>
              <label htmlFor={`cpf-${i}`}>CPF da inscrição<input id={`cpf-${i}`} name={`cpf-${i}`} inputMode="numeric" autoComplete="off" required maxLength={14} pattern="[0-9.\-]{11,14}" value={person.cpf} onChange={e => edit(i, "cpf", e.target.value.replace(/[^0-9.\-]/g, ""))} placeholder="000.000.000-00" /></label>
              <label htmlFor={`email-${i}`}>E-mail da inscrição<input id={`email-${i}`} name={`email-${i}`} type="email" autoComplete="off" required maxLength={254} value={person.email} onChange={e => edit(i, "email", e.target.value)} placeholder="E-mail cadastrado na ficha" /></label>
            </fieldset>)}
            {config?.ready ? <button className={styles.primaryButton} disabled={busy} type="submit">{busy ? "Verificando inscrições…" : `Continuar para pagar ${money(total)}`}</button> : <div className={styles.integrationSlot}><h3>{config ? "Pagamentos em breve" : "Verificando disponibilidade…"}</h3><p>{config ? "A organização está concluindo a ativação do Mercado Pago. Sua ficha pode ser enviada normalmente." : "Aguarde enquanto verificamos o pagamento."}</p><button className={styles.payButton} type="button" disabled>Pagamento ainda indisponível</button></div>}
          </form>
        </> : <>
          <div className={`${styles.result} ${order.status === "approved" ? styles.approved : ""}`} role="status"><h3>{status?.[0]}</h3><p>{status?.[1]}</p><small>Pedido: {order.id}{order.paymentId && ` · Mercado Pago: ${order.paymentId}`}</small></div>
          {config?.mode === "test" && <p className={styles.error}>Ambiente de testes: utilize somente os dados de teste do Mercado Pago.</p>}
          {order.status === "prepared" && config?.publicKey && <>
            <Script src="https://sdk.mercadopago.com/js/v2" strategy="afterInteractive" onReady={() => setSdkReady(true)} onError={() => setError("Não foi possível carregar o Mercado Pago. Verifique sua conexão.")} />
            <div className={styles.brickShell}>
              <div className={styles.brickHeading}>
                <div><span className={styles.eyebrow}>Pagamento seguro</span><h3>Meios de pagamento</h3></div>
                <span className={styles.secureBadge}>Mercado Pago</span>
              </div>
              <p className={styles.brickDescription}>Selecione uma opção para abrir somente os campos necessários.</p>
              <div className={styles.paymentChoiceList} role="radiogroup" aria-label="Meios de pagamento">
                <label className={paymentMethod === "card" ? styles.paymentChoiceSelected : styles.paymentChoice}>
                  <input type="radio" name={`payment-method-${audience}`} value="card" checked={paymentMethod === "card"} disabled={busy} onChange={() => { setBrickReady(false); setError(""); setPaymentMethod("card"); }} />
                  <span className={styles.choiceRadio} aria-hidden="true" />
                  <span className={styles.choiceIcon} aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><rect x="2.5" y="5" width="19" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.7"/><path d="M3 9h18" stroke="currentColor" strokeWidth="1.7"/><path d="M6 15h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg></span>
                  <span className={styles.choiceCopy}><strong>Cartão de crédito</strong><small>Escolha 1x, 2x ou 3x no formulário</small></span>
                  <span className={styles.choiceTag}>até 3x</span>
                </label>
                <label className={paymentMethod === "pix" ? styles.paymentChoiceSelected : styles.paymentChoice}>
                  <input type="radio" name={`payment-method-${audience}`} value="pix" checked={paymentMethod === "pix"} disabled={busy} onChange={() => { setBrickReady(false); setError(""); setPaymentMethod("pix"); }} />
                  <span className={styles.choiceRadio} aria-hidden="true" />
                  <span className={`${styles.choiceIcon} ${styles.pixChoiceIcon}`} aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="m12 3 5.2 5.2a2.55 2.55 0 0 0 3.6 0M12 3 6.8 8.2a2.55 2.55 0 0 1-3.6 0M12 21l5.2-5.2a2.55 2.55 0 0 1 3.6 0M12 21l-5.2-5.2a2.55 2.55 0 0 0-3.6 0M8.3 12h7.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
                  <span className={styles.choiceCopy}><strong>Pix</strong><small>QR Code e código Copia e Cola</small></span>
                  <span className={styles.choiceTag}>à vista</span>
                </label>
              </div>
              {!paymentMethod && <p className={styles.methodPrompt}>Escolha Pix ou cartão de crédito para continuar.</p>}
              {paymentMethod && <div className={styles.selectedMethodForm}>
                <div className={styles.selectedMethodHeader}>
                  <strong>{paymentMethod === "card" ? "Pagamento com cartão" : "Pagamento com Pix"}</strong>
                  {paymentMethod === "card" && <span>Escolha as parcelas antes de confirmar.</span>}
                </div>
                {paymentMethod === "card" && <fieldset className={styles.installmentPicker}>
                  <legend>Escolha o número de parcelas</legend>
                  <div className={styles.installmentOptions}>
                    {([1, 2, 3] as const).map(value => <label key={value} className={cardInstallments === value ? styles.installmentSelected : styles.installmentOption}>
                      <input type="radio" name={`card-installments-${audience}`} value={value} checked={cardInstallments === value} disabled={busy} onChange={() => chooseInstallments(value)} />
                      <strong>{value}x</strong>
                      <span>{money(total / value)}</span>
                    </label>)}
                  </div>
                  <small>Total de {money(total)}. A opção escolhida será enviada ao Mercado Pago.</small>
                </fieldset>}
                {paymentMethod === "card" && config.mode === "test" && <p className={styles.testCardNote}>Teste do cartão: use o nome <strong>APRO</strong> e o CPF <strong>123.456.789-09</strong>. O CPF da inscrição não é preenchido aqui no modo de teste.</p>}
                {!brickReady && <p className={styles.methodIntro}>Carregando formulário seguro…</p>}
                <div id={`mercado-pago-${audience}-${paymentMethod}`} aria-busy={busy} />
              </div>}
            </div>
          </>}
          {order.pixCode && <div className={styles.pix}>
            {order.pixQr && <img src={`data:image/png;base64,${order.pixQr}`} width="220" height="220" alt="QR Code para pagar com Pix" />}
            <label htmlFor="pix-code">Pix Copia e Cola<textarea id="pix-code" readOnly value={order.pixCode} /></label>
            <button type="button" className={styles.primaryButton} onClick={async () => { try { await navigator.clipboard.writeText(order.pixCode!); setCopied(true); } catch { setError("Selecione o código acima e copie manualmente."); } }}>{copied ? "Código copiado" : "Copiar código Pix"}</button>
            <p>Pague em até 1 hora após a geração do Pix. A geração do código ainda não confirma o pagamento.</p>
          </div>}
          <div className={styles.resultActions}>
            <button type="button" className={styles.secondaryButton} disabled={busy} onClick={consult}>{busy ? "Consultando…" : order.status === "submitting" ? "Retomar confirmação" : "Consultar pagamento"}</button>
            {terminal.includes(order.status) && order.status !== "approved" && <button type="button" className={styles.primaryButton} disabled={busy} onClick={restart}>Iniciar novo pagamento</button>}
            {order.status === "prepared" && <button type="button" className={styles.secondaryButton} disabled={busy} onClick={restart}>Alterar inscrições</button>}
            <Link className={styles.secondaryButton} href="/">Voltar ao site</Link>
          </div>
        </>}
      </section>
    </div>
  );
}
