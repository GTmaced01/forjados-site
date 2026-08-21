"use client";

import { useState } from "react";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const SUBMIT_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/submit-registration`;

type CheckboxProps = {
  name: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  children: React.ReactNode;
  obrigatorio?: boolean;
};

function somenteNumeros(valor: string) {
  return valor.replace(/\D/g, "");
}

function formatarCPF(valor: string) {
  const cpf = somenteNumeros(valor).slice(0, 11);
  return cpf
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

function calcularIdade(data: string) {
  if (!data) return 0;
  const nascimento = new Date(`${data}T00:00:00`);
  if (Number.isNaN(nascimento.getTime())) return 0;
  const hoje = new Date();
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  if (
    hoje.getMonth() < nascimento.getMonth() ||
    (hoje.getMonth() === nascimento.getMonth() && hoje.getDate() < nascimento.getDate())
  ) {
    idade -= 1;
  }
  return idade;
}

function validarArquivo(file: File | null, label: string) {
  if (!file || file.size === 0) throw new Error(`${label} é obrigatório.`);
  if (file.size > MAX_FILE_SIZE) throw new Error(`${label} deve ter no máximo 5 MB.`);
}

function CheckboxTermo({
  name,
  checked,
  onChange,
  children,
  obrigatorio = false,
}: CheckboxProps) {
  return (
    <label className="flex items-start gap-4 cursor-pointer bg-[#111111] border border-[#2A2A2A] rounded-2xl p-4">
      <input
        name={name}
        type="checkbox"
        value="true"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        required={obrigatorio}
        className="mt-1 w-5 h-5 accent-[#C79A4A] shrink-0"
      />
      <span className="text-gray-400 text-sm leading-relaxed">
        {children}
        {obrigatorio && <span className="text-[#C79A4A] font-bold"> *</span>}
      </span>
    </label>
  );
}

export default function InscricaoSeguraPage() {
  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [cpf, setCpf] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [congrega, setCongrega] = useState("");
  const [gestante, setGestante] = useState("");
  const [aceitouTermo, setAceitouTermo] = useState(false);
  const [aceitouPolitica, setAceitouPolitica] = useState(false);
  const [autorizaUsoImagem, setAutorizaUsoImagem] = useState(false);

  const idade = calcularIdade(dataNascimento);
  const ehMenor = Boolean(dataNascimento && idade >= 0 && idade < 18);

  async function enviarFormulario(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMensagem("");

    if (!SUBMIT_URL || SUBMIT_URL.startsWith("undefined")) {
      setMensagem("Serviço de inscrição indisponível. Tente novamente mais tarde.");
      return;
    }

    if (gestante === "sim") {
      setMensagem(
        "Mulheres grávidas não poderão participar do Projeto FORJADOS conforme o Termo de Ciência."
      );
      return;
    }

    if (!aceitouTermo || !aceitouPolitica) {
      setMensagem("Aceite o Termo de Participação e a Política de Privacidade para continuar.");
      return;
    }

    const form = event.currentTarget;
    const dados = new FormData(form);

    try {
      validarArquivo(dados.get("foto") as File, "A foto de rosto");
      validarArquivo(dados.get("comprovante") as File, "O comprovante de pagamento");
      if (ehMenor) {
        validarArquivo(dados.get("autorizacao_menor") as File, "A autorização do responsável");
      }

      setCarregando(true);

      const response = await fetch(SUBMIT_URL, {
        method: "POST",
        body: dados,
        headers: {
          Accept: "application/json",
        },
      });

      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null;

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || "Não foi possível concluir a inscrição.");
      }

      form.reset();
      setCpf("");
      setDataNascimento("");
      setCongrega("");
      setGestante("");
      setAceitouTermo(false);
      setAceitouPolitica(false);
      setAutorizaUsoImagem(false);
      setMensagem("Inscrição enviada com sucesso! Seus dados foram recebidos com segurança.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      const texto = error instanceof Error ? error.message : "Erro inesperado ao enviar inscrição.";
      setMensagem(texto);
    } finally {
      setCarregando(false);
    }
  }

  const campo =
    "w-full bg-[#0F0F10] border border-[#2A2A2A] rounded-2xl px-5 py-4 outline-none focus:border-[#C79A4A]";
  const arquivo =
    "w-full bg-[#0F0F10] border border-dashed border-[#C79A4A] rounded-2xl px-5 py-4 outline-none text-gray-300";

  return (
    <main className="min-h-screen bg-[#0F0F10] text-white px-6 py-20">
      <section className="max-w-3xl mx-auto">
        <div className="mb-12">
          <div className="text-left mb-6">
            <span className="inline-block border border-[#C79A4A] text-[#C79A4A] px-4 py-2 rounded-full uppercase tracking-widest text-sm">
              FICHA DE INSCRIÇÃO
            </span>
          </div>
          <div className="text-center">
            <img
              src="/logo-forjados.png"
              alt="Logo FORJADOS"
              className="mx-auto w-full max-w-[320px] mb-6"
            />
            <p className="text-gray-400 text-lg">
              Preencha seus dados para garantir sua inscrição.
            </p>
            <p className="text-gray-600 text-sm mt-2">
              Os documentos enviados são protegidos e não ficam disponíveis publicamente.
            </p>
          </div>
        </div>

        {mensagem && (
          <div
            role="status"
            aria-live="polite"
            className="mb-6 bg-[#181818] border border-[#C79A4A] rounded-2xl p-4 text-center text-[#C79A4A] font-bold"
          >
            {mensagem}
          </div>
        )}

        <form
          onSubmit={enviarFormulario}
          className="bg-[#181818] border border-[#2A2A2A] rounded-[32px] p-5 sm:p-8 space-y-8"
        >
          <div className="absolute -left-[10000px]" aria-hidden="true">
            <label>
              Website
              <input name="website" type="text" tabIndex={-1} autoComplete="off" />
            </label>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-black text-[#C79A4A]">Foto de rosto</h2>
            <p className="text-gray-500 text-sm">Envie uma foto nítida do seu rosto, com até 5 MB.</p>
            <input
              name="foto"
              required
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className={arquivo}
            />
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-black text-[#C79A4A]">Dados pessoais</h2>
            <input name="nome" required type="text" maxLength={160} autoComplete="name" placeholder="Nome completo" className={campo} />
            <input
              name="cpf"
              required
              type="text"
              inputMode="numeric"
              maxLength={14}
              placeholder="CPF"
              value={cpf}
              onChange={(event) => setCpf(formatarCPF(event.target.value))}
              className={campo}
            />
            <input name="telefone" required type="tel" maxLength={40} autoComplete="tel" placeholder="WhatsApp" className={campo} />
            <input name="email" required type="email" maxLength={254} autoComplete="email" placeholder="E-mail" className={campo} />
            <input name="endereco" required type="text" maxLength={240} autoComplete="street-address" placeholder="Endereço" className={campo} />
            <input name="cidade" required type="text" maxLength={120} autoComplete="address-level2" placeholder="Cidade" className={campo} />

            <div>
              <label className="block text-gray-400 mb-2">Data de nascimento</label>
              <input
                name="data_nascimento"
                required
                type="date"
                value={dataNascimento}
                onChange={(event) => setDataNascimento(event.target.value)}
                className={campo}
              />
              {dataNascimento && idade >= 0 && (
                <p className="text-gray-500 text-sm mt-2">
                  Idade identificada: <span className="text-[#C79A4A] font-bold">{idade} anos</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-gray-400 mb-2">Congrega em alguma igreja?</label>
              <select
                name="congrega"
                required
                value={congrega}
                onChange={(event) => setCongrega(event.target.value)}
                className={campo}
              >
                <option value="">Selecione uma opção</option>
                <option value="sim">Sim</option>
                <option value="nao">Não</option>
              </select>
            </div>

            {congrega === "sim" && (
              <input name="igreja" required type="text" maxLength={160} placeholder="Qual igreja?" className={campo} />
            )}

            <div>
              <label className="block text-gray-400 mb-2">Está grávida?</label>
              <select
                name="gestante"
                required
                value={gestante}
                onChange={(event) => setGestante(event.target.value)}
                className={campo}
              >
                <option value="">Selecione uma opção</option>
                <option value="nao">Não</option>
                <option value="sim">Sim</option>
              </select>
              {gestante === "sim" && (
                <div className="mt-4 bg-[#B71C1C]/10 border border-[#B71C1C]/40 rounded-2xl p-4">
                  <p className="text-red-300 font-bold">
                    Conforme o Termo de Ciência, mulheres grávidas não poderão participar do Projeto FORJADOS.
                  </p>
                </div>
              )}
            </div>

            {ehMenor && (
              <div className="bg-[#0F0F10] border border-[#C79A4A] rounded-2xl p-5">
                <h3 className="text-xl font-black text-[#C79A4A] mb-2">Autorização para menor de idade</h3>
                <p className="text-gray-400 mb-4">
                  Baixe o modelo, preencha, assine e envie a autorização do responsável.
                </p>
                <a
                  href="/modelo-autorizacao-menor.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-[#C79A4A] text-black px-5 py-3 rounded-xl font-black mb-4"
                >
                  Baixar modelo de autorização
                </a>
                <input
                  name="autorizacao_menor"
                  required
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  className={arquivo}
                />
                <p className="text-gray-500 text-sm mt-2">Imagem ou PDF, com até 5 MB.</p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-black text-[#C79A4A]">Camisa</h2>
            <select name="camisa" required className={campo}>
              <option value="">Tamanho da camisa</option>
              <option value="PP">PP</option>
              <option value="P">P</option>
              <option value="M">M</option>
              <option value="G">G</option>
              <option value="GG">GG</option>
              <option value="XG">XG</option>
              <option value="EXG">EXG</option>
            </select>
          </div>

          <div className="bg-[#111111] border border-[#2A2A2A] rounded-3xl p-6 space-y-4">
            <div>
              <h2 className="text-2xl font-black text-[#C79A4A] mb-2">Informações de saúde</h2>
              <p className="text-gray-500 text-sm">
                Essas informações são restritas à organização e ajudam no cuidado durante o retiro.
              </p>
            </div>
            <textarea name="alergias" required maxLength={1000} placeholder="Possui alguma alergia? Se sim, informe qual." className={`${campo} min-h-[100px]`} />
            <textarea name="medicamentos" required maxLength={1000} placeholder="Toma algum medicamento contínuo? Se sim, informe qual." className={`${campo} min-h-[100px]`} />
            <textarea name="condicao_saude" required maxLength={1500} placeholder="Possui alguma condição de saúde que a organização precisa saber?" className={`${campo} min-h-[100px]`} />
            <textarea name="restricao_alimentar" required maxLength={1000} placeholder="Possui alguma restrição alimentar?" className={`${campo} min-h-[100px]`} />
            <div className="grid md:grid-cols-2 gap-4">
              <input name="contato_emergencia_nome" required type="text" maxLength={160} placeholder="Nome do contato de emergência" className={campo} />
              <input name="contato_emergencia_telefone" required type="tel" maxLength={40} placeholder="Telefone do contato de emergência" className={campo} />
            </div>
          </div>

          <div className="bg-black/40 border border-[#2A2A2A] rounded-2xl p-6">
            <div className="flex items-center justify-between gap-3 mb-3">
              <p className="text-gray-400">Valor da pré-venda</p>
              <span className="bg-[#B71C1C] text-white text-xs font-black px-3 py-1 rounded-full">25% OFF</span>
            </div>
            <div className="flex items-end gap-3">
              <span className="text-gray-500 text-2xl font-black line-through">R$180</span>
              <h3 className="text-5xl font-black text-[#C79A4A] leading-none">R$135</h3>
            </div>
            <p className="text-gray-500 mt-3">
              Valor de pré-venda com 25% de desconto. Pagamento via Pix. Anexe o comprovante abaixo.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-black text-[#C79A4A]">Comprovante de pagamento</h2>
            <input
              name="comprovante"
              required
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className={arquivo}
            />
            <p className="text-gray-500 text-sm">Envie imagem ou PDF, com até 5 MB.</p>
          </div>

          <div className="bg-[#0F0F10] border border-[#2A2A2A] rounded-2xl p-5 space-y-4">
            <h2 className="text-2xl font-black text-[#C79A4A]">Termos e autorizações</h2>

            <CheckboxTermo
              name="aceitou_termo"
              checked={aceitouTermo}
              onChange={setAceitouTermo}
              obrigatorio
            >
              Declaro que li, compreendi e aceito o{" "}
              <a
                href="/termo-de-ciencia"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#C79A4A] font-bold hover:text-yellow-500"
                onClick={(event) => event.stopPropagation()}
              >
                Termo de Ciência, Responsabilidade e Participação
              </a>{" "}
              do Projeto FORJADOS.
            </CheckboxTermo>

            <CheckboxTermo
              name="aceitou_politica"
              checked={aceitouPolitica}
              onChange={setAceitouPolitica}
              obrigatorio
            >
              Declaro que li e concordo com a{" "}
              <a
                href="/politica-de-privacidade"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#C79A4A] font-bold hover:text-yellow-500"
                onClick={(event) => event.stopPropagation()}
              >
                Política de Privacidade
              </a>{" "}
              do Projeto FORJADOS.
            </CheckboxTermo>

            <CheckboxTermo
              name="autoriza_uso_imagem"
              checked={autorizaUsoImagem}
              onChange={setAutorizaUsoImagem}
            >
              Autorizo o uso da minha imagem, voz e depoimentos para divulgação institucional do
              Projeto FORJADOS. <span className="text-gray-500">Esta autorização é opcional.</span>
            </CheckboxTermo>
          </div>

          <button
            type="submit"
            disabled={carregando || gestante === "sim"}
            className="w-full bg-[#B71C1C] hover:bg-red-800 transition-all py-5 rounded-2xl font-black text-xl disabled:opacity-60 flex items-center justify-center gap-3"
          >
            {carregando && (
              <span className="w-5 h-5 border-4 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {carregando ? "ENVIANDO INSCRIÇÃO..." : "FINALIZAR INSCRIÇÃO"}
          </button>
        </form>
      </section>
    </main>
  );
}
