import type { Metadata } from "next";
import { PaymentPage } from "../pagamento/_components/PaymentPage";

export const metadata: Metadata = {
  title: "Pagamento da equipe | FORJADOS",
  description: "Área de pagamento dos integrantes da equipe FORJADOS.",
  alternates: { canonical: "/pagamentoequipe" },
  robots: { index: false, follow: true },
};

export default function TeamPaymentPage() {
  return <PaymentPage audience="team" />;
}
