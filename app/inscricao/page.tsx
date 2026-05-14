"use client";

import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function InscricaoPage() {
  const [carregando, setCarregando] = useState(false);
  const [idade, setIdade] = useState("");
  const [congrega, setCongrega] = useState("");
  const [mensagem, setMensagem] = useState("");

  function pegarExtensao(arquivo: File) {
    if (arquivo.type === "image/png") return "png";
    if (arquivo.type === "image/jpeg") return "jpg";
    if (arquivo.type === "image/webp") return "webp";
    if (arquivo.type === "application/pdf") return "pdf";

    return "jpg";
  }

  async function enviarArquivo(
    bucket: string,
    arquivo: File,
    mensagemErro: string
  ) {
    const extensao = pegarExtensao(arquivo);

    const nomeArquivo = `arquivo-${Date.now()}-${Math.floor(
      Math.random() * 999999
    )}.${extensao}`;

    const { error } = await supabase.storage
      .from(bucket)
      .upload(nomeArquivo, arquivo, {
        cacheControl: "3600",
        upsert: false,
        contentType: arquivo.type,
      });

    if (error) {
      console.error("Erro completo do upload:", error);
      throw new Error(`${mensagemErro}: ${error.message}`);
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(nomeArquivo);

    return data.publicUrl;
  }

  async function enviarFormulario(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMensagem("");
    setCarregando(true);

    try {
      const form = event.currentTarget;
      const dados = new FormData(form);

      const idadeNumero = Number(dados.get("idade"));

      const camposObrigatorios = [
        { nome: "nome", label: "Nome completo" },
        { nome: "cpf", label: "CPF" },
        { nome: "telefone", label: "WhatsApp" },
        { nome: "email", label: "E-mail" },
        { nome: "endereco", label: "Endereço" },
        { nome: "idade", label: "Idade" },
        { nome: "congrega", label: "Congrega em alguma igreja?" },
        { nome: "camisa", label: "Tamanho da camisa" },
        { nome: "alergias", label: "Alergias" },
        { nome: "medicamentos", label: "Medicamentos" },
        { nome: "condicao_saude", label: "Condição de saúde" },
        { nome: "restricao_alimentar", label: "Restrição alimentar" },
        {
          nome: "contato_emergencia_nome",
          label: "Nome do contato de emergência",
        },
        {
          nome: "contato_emergencia_telefone",
          label: "Telefone do contato de emergência",
        },
      ];

      for (const campo of camposObrigatorios) {
        const valor = String(dados.get(campo.nome) || "").trim();

        if (!valor) {
          alert(`Preencha o campo obrigatório: ${campo.label}`);
          setCarregando(false);
          return;
        }
      }

      if (!idadeNumero || idadeNumero <= 0) {
        alert("Informe uma idade válida.");
        setCarregando(false);
        return;
      }

      if (String(dados.get("congrega")) === "sim") {
        const igrejaInformada = String(dados.get("igreja") || "").trim();

        if (!igrejaInformada) {
          alert("Informe qual igreja você congrega.");
          setCarregando(false);
          return;
        }
      }

      const foto = dados.get("foto") as File;
      const comprovante = dados.get("comprovante") as File;
      const autorizacaoMenor = dados.get("autorizacao_menor") as File;

      let fotoUrl = "";
      let comprovanteUrl = "";
      let autorizacaoMenorUrl = "";

      if (!foto || foto.size === 0) {
        alert("É obrigatório anexar a foto de rosto.");
        setCarregando(false);
        return;
      }

      fotoUrl = await enviarArquivo(
        "fotos",
        foto,
        "Erro ao enviar foto de rosto"
      );

      if (!comprovante || comprovante.size === 0) {
        alert("É obrigatório anexar o comprovante de pagamento.");
        setCarregando(false);
        return;
      }

      comprovanteUrl = await enviarArquivo(
        "comprovantes",
        comprovante,
        "Erro ao enviar comprovante"
      );

      if (idadeNumero > 0 && idadeNumero < 18) {
        if (!autorizacaoMenor || autorizacaoMenor.size === 0) {
          alert("É obrigatório anexar a autorização para menor de idade.");
          setCarregando(false);
          return;
        }

        autorizacaoMenorUrl = await enviarArquivo(
          "autorizacoes",
          autorizacaoMenor,
          "Erro ao enviar autorização do menor"
        );
      }

      const inscrito = {
        nome: String(dados.get("nome")),
        cpf: String(dados.get("cpf")),
        telefone: String(dados.get("telefone")),
        email: String(dados.get("email")),
        endereco: String(dados.get("endereco")),
        idade: String(dados.get("idade")),

        igreja:
          String(dados.get("congrega")) === "sim"
            ? String(dados.get("igreja"))
            : "Não congrega",

        camisa: String(dados.get("camisa")),

        alergias: String(dados.get("alergias")),
        medicamentos: String(dados.get("medicamentos")),
        condicao_saude: String(dados.get("condicao_saude")),
        restricao_alimentar: String(dados.get("restricao_alimentar")),
        contato_emergencia_nome: String(
          dados.get("contato_emergencia_nome")
        ),
        contato_emergencia_telefone: String(
          dados.get("contato_emergencia_telefone")
        ),

        foto_url: fotoUrl,
        comprovante_url: comprovanteUrl,
        autorizacao_menor_url: autorizacaoMenorUrl,

        pagamento_status: "pendente",
      };

      const { error } = await supabase.from("inscritos").insert(inscrito);

      setCarregando(false);

      if (error) {
        console.error("Erro ao salvar inscrição:", error);
        setMensagem("Erro ao salvar inscrição: " + error.message);
        alert("Erro ao salvar inscrição: " + error.message);
        return;
      }

      setMensagem("Inscrição enviada com sucesso!");
      alert("Inscrição enviada com sucesso!");

      form.reset();
      setIdade("");
      setCongrega("");
    } catch (error) {
      console.error(error);
      setCarregando(false);

      if (error instanceof Error) {
        alert(error.message);
        setMensagem(error.message);
      } else {
        alert("Erro inesperado ao enviar inscrição.");
        setMensagem("Erro inesperado ao enviar inscrição.");
      }
    }
  }

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
  </div>
</div>

        {mensagem && (
          <div className="mb-6 bg-[#181818] border border-[#C79A4A] rounded-2xl p-4 text-center text-[#C79A4A] font-bold">
            {mensagem}
          </div>
        )}

        <form
          onSubmit={enviarFormulario}
          className="bg-[#181818] border border-[#2A2A2A] rounded-[32px] p-5 sm:p-8 space-y-8"
        >
          <div className="space-y-4">
            <h2 className="text-2xl font-black text-[#C79A4A]">
              Foto de rosto
            </h2>

            <p className="text-gray-500 text-sm">
              Comece anexando uma foto nítida em que apareça seu rosto.
            </p>

            <input
              name="foto"
              required
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="w-full bg-[#0F0F10] border border-dashed border-[#C79A4A] rounded-2xl px-5 py-4 outline-none text-gray-300"
            />
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-black text-[#C79A4A]">
              Dados pessoais
            </h2>

            <input
              name="nome"
              required
              type="text"
              placeholder="Nome completo"
              className="w-full bg-[#0F0F10] border border-[#2A2A2A] rounded-2xl px-5 py-4 outline-none focus:border-[#C79A4A]"
            />

            <input
              name="cpf"
              required
              type="text"
              placeholder="CPF"
              className="w-full bg-[#0F0F10] border border-[#2A2A2A] rounded-2xl px-5 py-4 outline-none focus:border-[#C79A4A]"
            />

            <input
              name="telefone"
              required
              type="text"
              placeholder="WhatsApp"
              className="w-full bg-[#0F0F10] border border-[#2A2A2A] rounded-2xl px-5 py-4 outline-none focus:border-[#C79A4A]"
            />

            <input
              name="email"
              required
              type="email"
              placeholder="E-mail"
              className="w-full bg-[#0F0F10] border border-[#2A2A2A] rounded-2xl px-5 py-4 outline-none focus:border-[#C79A4A]"
            />

            <input
              name="endereco"
              required
              type="text"
              placeholder="Endereço"
              className="w-full bg-[#0F0F10] border border-[#2A2A2A] rounded-2xl px-5 py-4 outline-none focus:border-[#C79A4A]"
            />

            <input
              name="idade"
              required
              type="number"
              placeholder="Idade"
              value={idade}
              onChange={(e) => setIdade(e.target.value)}
              className="w-full bg-[#0F0F10] border border-[#2A2A2A] rounded-2xl px-5 py-4 outline-none focus:border-[#C79A4A]"
            />

            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 mb-2">
                  Congrega em alguma igreja?
                </label>

                <select
                  name="congrega"
                  required
                  value={congrega}
                  onChange={(e) => setCongrega(e.target.value)}
                  className="w-full bg-[#0F0F10] border border-[#2A2A2A] rounded-2xl px-5 py-4 outline-none focus:border-[#C79A4A]"
                >
                  <option value="">Selecione uma opção</option>
                  <option value="sim">Sim</option>
                  <option value="nao">Não</option>
                </select>
              </div>

              {congrega === "sim" && (
                <div>
                  <label className="block text-gray-400 mb-2">
                    Qual igreja?
                  </label>

                  <input
                    name="igreja"
                    required
                    type="text"
                    placeholder="Digite o nome da igreja"
                    className="w-full bg-[#0F0F10] border border-[#2A2A2A] rounded-2xl px-5 py-4 outline-none focus:border-[#C79A4A]"
                  />
                </div>
              )}
            </div>

            {Number(idade) > 0 && Number(idade) < 18 && (
              <div className="bg-[#0F0F10] border border-[#C79A4A] rounded-2xl p-5">
                <h3 className="text-xl font-black text-[#C79A4A] mb-2">
                  Autorização para menor de idade
                </h3>

                <p className="text-gray-400 mb-4">
                  Como o participante é menor de 18 anos, é obrigatório baixar o
                  modelo, preencher, assinar e anexar a autorização.
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
                  className="w-full bg-[#0F0F10] border border-dashed border-[#C79A4A] rounded-2xl px-5 py-4 outline-none text-gray-300"
                />

                <p className="text-gray-500 text-sm mt-2">
                  Envie a autorização preenchida e assinada pelo responsável.
                </p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-black text-[#C79A4A]">Camisa</h2>

            <select
              name="camisa"
              required
              className="w-full bg-[#0F0F10] border border-[#2A2A2A] rounded-2xl px-5 py-4 outline-none focus:border-[#C79A4A]"
            >
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
              <h2 className="text-2xl font-black text-[#C79A4A] mb-2">
                Informações de saúde
              </h2>

              <p className="text-gray-500 text-sm">
                Essas informações ajudam a organização a cuidar melhor dos
                participantes durante o retiro.
              </p>
            </div>

            <textarea
              name="alergias"
              required
              placeholder="Possui alguma alergia? Se sim, informe qual."
              className="w-full min-h-[100px] bg-[#0F0F10] border border-[#2A2A2A] rounded-2xl px-5 py-4 outline-none focus:border-[#C79A4A]"
            />

            <textarea
              name="medicamentos"
              required
              placeholder="Toma algum medicamento contínuo? Se sim, informe qual."
              className="w-full min-h-[100px] bg-[#0F0F10] border border-[#2A2A2A] rounded-2xl px-5 py-4 outline-none focus:border-[#C79A4A]"
            />

            <textarea
              name="condicao_saude"
              required
              placeholder="Possui alguma condição de saúde que a organização precisa saber?"
              className="w-full min-h-[100px] bg-[#0F0F10] border border-[#2A2A2A] rounded-2xl px-5 py-4 outline-none focus:border-[#C79A4A]"
            />

            <textarea
              name="restricao_alimentar"
              required
              placeholder="Possui alguma restrição alimentar?"
              className="w-full min-h-[100px] bg-[#0F0F10] border border-[#2A2A2A] rounded-2xl px-5 py-4 outline-none focus:border-[#C79A4A]"
            />

            <div className="grid md:grid-cols-2 gap-4">
              <input
                name="contato_emergencia_nome"
                required
                type="text"
                placeholder="Nome do contato de emergência"
                className="w-full bg-[#0F0F10] border border-[#2A2A2A] rounded-2xl px-5 py-5 text-sm sm:text-base outline-none focus:border-[#C79A4A]"
              />

              <input
                name="contato_emergencia_telefone"
                required
                type="text"
                placeholder="Telefone do contato de emergência"
                className="w-full bg-[#0F0F10] border border-[#2A2A2A] rounded-2xl px-5 py-5 text-sm sm:text-base outline-none focus:border-[#C79A4A]"
              />
            </div>
          </div>

          <div className="bg-black/40 border border-[#2A2A2A] rounded-2xl p-6">
            <div className="flex items-center justify-between gap-3 mb-3">
              <p className="text-gray-400">Valor da pré-venda</p>

              <span className="bg-[#B71C1C] text-white text-xs font-black px-3 py-1 rounded-full">
                25% OFF
              </span>
            </div>

            <div className="flex items-end gap-3">
              <span className="text-gray-500 text-2xl font-black line-through">
                R$180
              </span>

              <h3 className="text-5xl font-black text-[#C79A4A] leading-none">
                R$135
              </h3>
            </div>

            <p className="text-gray-500 mt-3">
              Valor de pré-venda com 25% de desconto. Pagamento via Pix. Anexe o comprovante abaixo.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-black text-[#C79A4A]">
              Comprovante de pagamento
            </h2>

            <input
              name="comprovante"
              required
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="w-full bg-[#0F0F10] border border-dashed border-[#C79A4A] rounded-2xl px-5 py-4 outline-none text-gray-300"
            />

            <p className="text-gray-500 text-sm">
              Envie o comprovante do Pix ou pagamento. Pode ser imagem ou PDF.
            </p>
          </div>

          <button
            type="submit"
            disabled={carregando}
            className="w-full bg-[#B71C1C] hover:bg-red-800 transition-all py-5 rounded-2xl font-black text-xl disabled:opacity-60"
          >
            {carregando ? "ENVIANDO..." : "FINALIZAR INSCRIÇÃO"}
          </button>
        </form>
      </section>
    </main>
  );
}