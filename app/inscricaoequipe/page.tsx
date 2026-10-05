import type { Metadata } from "next";
import { RegistrationForm } from "../inscricao/_components/RegistrationForm";

export const metadata: Metadata = { title: "Inscrição da equipe | FORJADOS", robots: { index: false, follow: false } };
export default function InscricaoEquipePage() { return <RegistrationForm categoria="equipe" />; }
