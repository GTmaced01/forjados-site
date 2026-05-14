"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function RedefinirSenhaPage() {
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [sessaoPronta, setSessaoPronta] = useState(false);

  useEffect(() => {
    async function prepararSessao() {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          setMensagem("Link inválido ou expirado. Solicite uma nova recuperação de senha.");
          return;
        }

        setSessaoPronta(true);
        return;
      }

      const { data } = await supabase.auth.getSession();

      if (data.session) {
        setSessaoPronta(true);
      } else {
        setMensagem("Aguardando validação do link de recuperação.");
      }
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setSessaoPronta(true);
      }
    });

    prepararSessao();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function alterarSenha(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!senha || senha.length < 6) {
      setMensagem("A nova senha precisa ter pelo menos 6 caracteres.");
      return;
    }

    if (senha !== confirmarSenha) {
      setMensagem("As senhas não conferem.");
      return;
    }

    setCarregando(true);
    setMensagem("");

    const { error } = await supabase.auth.updateUser({
      password: senha,
    });

    setCarregando(false);

    if (error) {
      setMensagem("Erro ao alterar senha: " + error.message);
      return;
    }

    setMensagem("Senha alterada com sucesso! Redirecionando para o login...");

    await supabase.auth.signOut();

    setTimeout(() => {
      window.location.href = "/admin";
    }, 2000);
  }

  return (
    <main className="min-h-screen bg-[#070707] text-white flex items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(199,154,74,0.14),transparent_35%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(183,28,28,0.18),transparent_40%)]" />

      <form
        onSubmit={alterarSenha}
        className="relative z-10 w-full max-w-md bg-[#121212]/95 border border-[#2A2A2A] rounded-[32px] p-8 shadow-2xl"
      >
        <div className="text-center mb-8">
          <img
            src="/logo-forjados.png"
            alt="Logo FORJADOS"
            className="mx-auto w-full max-w-[220px] mb-6"
          />

          <h1 className="text-4xl font-black text-[#C79A4A] mb-2">
            Redefinir senha
          </h1>

          <p className="text-gray-400">
            Crie uma nova senha para acessar o painel admin.
          </p>
        </div>

        {mensagem && (
          <div className="mb-5 bg-[#0B0B0B] border border-[#2A2A2A] rounded-2xl p-4 text-center text-gray-300">
            {mensagem}
          </div>
        )}

        <div className="space-y-4">
          <input
            type="password"
            placeholder="Nova senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            disabled={!sessaoPronta}
            className="w-full bg-[#0B0B0B] border border-[#2A2A2A] rounded-2xl px-5 py-4 outline-none focus:border-[#C79A4A] disabled:opacity-50"
          />

          <input
            type="password"
            placeholder="Confirmar nova senha"
            value={confirmarSenha}
            onChange={(e) => setConfirmarSenha(e.target.value)}
            disabled={!sessaoPronta}
            className="w-full bg-[#0B0B0B] border border-[#2A2A2A] rounded-2xl px-5 py-4 outline-none focus:border-[#C79A4A] disabled:opacity-50"
          />

          <button
            disabled={carregando || !sessaoPronta}
            className="w-full bg-[#C79A4A] hover:bg-yellow-600 transition-all text-black py-4 rounded-2xl font-black disabled:opacity-60"
          >
            {carregando ? "ALTERANDO..." : "ALTERAR SENHA"}
          </button>

          <a
            href="/admin"
            className="block text-center text-gray-400 hover:text-[#C79A4A] transition-all"
          >
            Voltar para o login
          </a>
        </div>
      </form>
    </main>
  );
}