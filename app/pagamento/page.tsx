import type { Metadata } from "next";
import { PaymentPage } from "./_components/PaymentPage";

export const metadata: Metadata = {
  title: "Pagamento de inscrição | FORJADOS",
  description: "Área de pagamento dos participantes do retiro FORJADOS.",
  alternates: { canonical: "/pagamento" },
  robots: { index: false, follow: true },
};

export default function ParticipantPaymentPage() {
  return <PaymentPage audience="participant" />;
}
