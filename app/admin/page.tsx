"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type Inscrito = {
  id: string;
  nome: string;
  cpf: string;
  telefone: string;
  email: string;
  endereco: string;
  idade: string;
  igreja: string;
  camisa: string;

  alergias: string;
  medicamentos: string;
  condicao_saude: string;
  restricao_alimentar: string;
  contato_emergencia_nome: string;
  contato_emergencia_telefone: string;

  foto_url: string;
  comprovante_url: string;
  autorizacao_menor_url: string;

  pagamento_status: string;
observacao_admin: string;
created_at: string;
};

type FiltroStatus = "todos" | "pendente" | "pago" | "cancelado" | "menores";

export default function AdminPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mensagemLogin, setMensagemLogin] = useState("");
  const [logado, setLogado] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [carregandoInscritos, setCarregandoInscritos] = useState(false);
  const [inscritos, setInscritos] = useState<Inscrito[]>([]);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<FiltroStatus>("todos");
  const [selecionado, setSelecionado] = useState<Inscrito | null>(null);
  const [menuExportarAberto, setMenuExportarAberto] = useState(false);
  const [confirmarLogout, setConfirmarLogout] = useState(false);

  async function verificarSessao() {
    const { data } = await supabase.auth.getSession();

    if (data.session) {
      setLogado(true);
      carregarInscritos();
    }
  }

  useEffect(() => {
    verificarSessao();
  }, []);
  async function recuperarSenha() {
    if (!email.trim()) {
      setMensagemLogin("Digite seu e-mail no campo acima para recuperar a senha.");
      return;
    }
  
    setCarregando(true);
    setMensagemLogin("");
  
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: "https://forjados-site.vercel.app/admin/redefinir-senha",
    });
  
    setCarregando(false);
  
    if (error) {
      setMensagemLogin("Erro ao solicitar recuperação: " + error.message);
      return;
    }
  
    setMensagemLogin(
      "Se este e-mail estiver cadastrado como admin, você receberá um link para redefinir a senha."
    );
  }
  async function fazerLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCarregando(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    setCarregando(false);

    if (error) {
      alert("Erro ao entrar: " + error.message);
      return;
    }

    setLogado(true);
    carregarInscritos();
  }

  async function sair() {
    await supabase.auth.signOut();
  
    setConfirmarLogout(false);
    setLogado(false);
    setInscritos([]);
    setEmail("");
    setSenha("");
    setMensagemLogin("");
  }

  async function carregarInscritos() {
    setCarregandoInscritos(true);
  
    const { data, error } = await supabase
      .from("inscritos")
      .select("*")
      .order("created_at", { ascending: false });
  
    setCarregandoInscritos(false);
  
    if (error) {
      alert("Erro ao carregar inscritos: " + error.message);
      return;
    }
  
    setInscritos(data || []);
  }

  async function alterarStatus(id: string, novoStatus: string) {
    const { error } = await supabase
      .from("inscritos")
      .update({ pagamento_status: novoStatus })
      .eq("id", id);

    if (error) {
      alert("Erro ao alterar status: " + error.message);
      return;
    }
    async function salvarObservacaoAdmin(id: string, observacao: string) {
      const { error } = await supabase
        .from("inscritos")
        .update({ observacao_admin: observacao })
        .eq("id", id);
    
      if (error) {
        alert("Erro ao salvar observação: " + error.message);
        return false;
      }
    
      setInscritos((lista) =>
        lista.map((item) =>
          item.id === id ? { ...item, observacao_admin: observacao } : item
        )
      );
    
      if (selecionado?.id === id) {
        setSelecionado({
          ...selecionado,
          observacao_admin: observacao,
        });
      }
    
      return true;
    }

    setInscritos((lista) =>
      lista.map((item) =>
        item.id === id ? { ...item, pagamento_status: novoStatus } : item
      )
    );

    if (selecionado?.id === id) {
      setSelecionado({
        ...selecionado,
        pagamento_status: novoStatus,
      });
    }
  }
  async function salvarObservacaoAdmin(id: string, observacao: string) {
    const { error } = await supabase
      .from("inscritos")
      .update({ observacao_admin: observacao })
      .eq("id", id);
  
    if (error) {
      alert("Erro ao salvar observação: " + error.message);
      return false;
    }
  
    setInscritos((lista) =>
      lista.map((item) =>
        item.id === id ? { ...item, observacao_admin: observacao } : item
      )
    );
  
    if (selecionado?.id === id) {
      setSelecionado({
        ...selecionado,
        observacao_admin: observacao,
      });
    }
  
    return true;
  }

  function formatarData(data: string) {
    if (!data) return "-";
    return new Date(data).toLocaleString("pt-BR");
  }

  function telefoneParaWhatsApp(telefone: string) {
    const somenteNumeros = String(telefone || "").replace(/\D/g, "");

    if (!somenteNumeros) return "";

    if (somenteNumeros.startsWith("55")) {
      return somenteNumeros;
    }

    return `55${somenteNumeros}`;
  }

  function abrirWhatsApp(item: Inscrito) {
    const numero = telefoneParaWhatsApp(item.telefone);

    if (!numero) {
      alert("Este inscrito não possui WhatsApp cadastrado.");
      return;
    }

    const mensagem = `Olá, ${item.nome}! Aqui é da organização do FORJADOS. Recebemos sua inscrição e estamos acompanhando as informações pelo nosso painel.`;

    const link = `https://wa.me/${numero}?text=${encodeURIComponent(
      mensagem
    )}`;

    window.open(link, "_blank");
  }

  function classeStatus(status: string) {
    if (status === "pago" || status === "approved") {
      return "bg-green-500/10 text-green-300 border-green-500/30";
    }

    if (status === "cancelado") {
      return "bg-red-500/10 text-red-300 border-red-500/30";
    }

    return "bg-yellow-500/10 text-yellow-300 border-yellow-500/30";
  }

  function textoStatus(status: string) {
    if (status === "pago" || status === "approved") return "Pago";
    if (status === "cancelado") return "Cancelado";
    return "Pendente";
  }

  const listaPagos = inscritos.filter(
    (item) =>
      item.pagamento_status === "pago" || item.pagamento_status === "approved"
  );

  const listaPendentes = inscritos.filter((item) => {
    return (
      item.pagamento_status !== "pago" &&
      item.pagamento_status !== "approved" &&
      item.pagamento_status !== "cancelado"
    );
  });

  const listaCancelados = inscritos.filter(
    (item) => item.pagamento_status === "cancelado"
  );

  const listaMenores = inscritos.filter((item) => Number(item.idade) < 18);

  const inscritosFiltrados = inscritos.filter((item) => {
    const texto = busca.toLowerCase();

    const bateBusca =
      item.nome?.toLowerCase().includes(texto) ||
      item.cpf?.toLowerCase().includes(texto) ||
      item.telefone?.toLowerCase().includes(texto) ||
      item.email?.toLowerCase().includes(texto) ||
      item.igreja?.toLowerCase().includes(texto) ||
      item.camisa?.toLowerCase().includes(texto) ||
      item.pagamento_status?.toLowerCase().includes(texto);

    const statusNormalizado =
      item.pagamento_status === "approved" ? "pago" : item.pagamento_status;

    const bateFiltro =
      filtro === "todos" ||
      (filtro === "menores" && Number(item.idade) < 18) ||
      filtro === statusNormalizado;

    return bateBusca && bateFiltro;
  });

  const pagos = listaPagos.length;
  const pendentes = listaPendentes.length;
  const cancelados = listaCancelados.length;
  const menores = listaMenores.length;

  function exportarCSV(lista: Inscrito[], nomeArquivo: string) {
    const cabecalho = [
      "Nome",
      "CPF",
      "Telefone",
      "Email",
      "Endereco",
      "Idade",
      "Igreja",
      "Camisa",
      "Alergias",
      "Medicamentos",
      "Condicao de saude",
      "Restricao alimentar",
      "Contato emergencia nome",
      "Contato emergencia telefone",
      "Status",
"Observacao interna",
"Foto",
      "Comprovante",
      "Autorizacao menor",
      "Data",
    ];

    const linhas = lista.map((item) => [
      item.nome,
      item.cpf,
      item.telefone,
      item.email,
      item.endereco,
      item.idade,
      item.igreja,
      item.camisa,
      item.alergias,
      item.medicamentos,
      item.condicao_saude,
      item.restricao_alimentar,
      item.contato_emergencia_nome,
      item.contato_emergencia_telefone,
      textoStatus(item.pagamento_status),
item.observacao_admin,
item.foto_url,
      item.comprovante_url,
      item.autorizacao_menor_url,
      formatarData(item.created_at),
    ]);

    const conteudo = [cabecalho, ...linhas]
      .map((linha) =>
        linha
          .map((campo) => `"${String(campo || "").replaceAll('"', '""')}"`)
          .join(";")
      )
      .join("\n");

    const arquivo = new Blob([conteudo], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(arquivo);
    const link = document.createElement("a");

    link.href = url;
    link.download = nomeArquivo;
    link.click();

    URL.revokeObjectURL(url);
  }

  if (!logado) {
    return (
      <main className="min-h-screen bg-[#070707] text-white flex items-center justify-center px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(199,154,74,0.14),transparent_35%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(183,28,28,0.18),transparent_40%)]" />

        <form
          onSubmit={fazerLogin}
          className="relative z-10 w-full max-w-md bg-[#121212]/95 border border-[#2A2A2A] rounded-[32px] p-8 shadow-2xl"
        >
          <div className="text-center mb-8">
            <img
              src="/logo-forjados.png"
              alt="Logo FORJADOS"
              className="mx-auto w-full max-w-[220px] mb-6"
            />

            <h1 className="text-4xl font-black text-[#C79A4A] mb-2">
              Painel Admin
            </h1>

            <p className="text-gray-400">
              Acesso restrito à organização do FORJADOS.
              Você é um FORJADO? Então prove.
            </p>
          </div>

          <div className="space-y-4">
            <input
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="off"
              className="w-full bg-[#0B0B0B] border border-[#2A2A2A] rounded-2xl px-5 py-4 outline-none focus:border-[#C79A4A]"
            />

<input
  type="password"
  placeholder="Senha"
  value={senha}
  onChange={(e) => setSenha(e.target.value)}
  autoComplete="off"
  className="w-full bg-[#0B0B0B] border border-[#2A2A2A] rounded-2xl px-5 py-4 outline-none focus:border-[#C79A4A]"
/>

{mensagemLogin && (
  <div className="bg-[#0B0B0B] border border-[#2A2A2A] rounded-2xl p-4 text-center text-gray-300 text-sm">
    {mensagemLogin}
  </div>
)}

<button
  disabled={carregando}
  className="w-full bg-[#C79A4A] hover:bg-yellow-600 transition-all text-black py-4 rounded-2xl font-black disabled:opacity-60"
>
  {carregando ? "ENTRANDO..." : "ENTRAR NO PAINEL"}
</button>

<button
  type="button"
  onClick={recuperarSenha}
  disabled={carregando}
  className="w-full text-gray-400 hover:text-[#C79A4A] transition-all text-sm font-bold disabled:opacity-60"
>
  Esqueci minha senha
</button>
          </div>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#070707] text-white px-4 sm:px-6 py-8 overflow-x-hidden">
      <section className="max-w-7xl mx-auto">
        <div className="relative overflow-visible rounded-[36px] border border-[#2A2A2A] bg-[#121212] p-6 sm:p-8 mb-8 shadow-2xl z-40">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(199,154,74,0.16),transparent_35%)] rounded-[36px]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(183,28,28,0.14),transparent_40%)] rounded-[36px]" />

          <div className="relative z-[9999] flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-3xl bg-black/40 border border-[#C79A4A]/40 flex items-center justify-center p-3">
                <img
                  src="/logo-forjados.png"
                  alt="Logo FORJADOS"
                  className="w-full h-full object-contain"
                />
              </div>

              <div>
                <span className="inline-block text-xs uppercase tracking-[0.25em] text-[#C79A4A] mb-2">
                  Gestão de inscrições
                </span>

                <h1 className="text-4xl sm:text-5xl font-black text-white leading-tight">
                  Painel{" "}
                  <span className="text-[#C79A4A]">FORJADOS</span>
                </h1>

                <p className="text-gray-400 mt-2 max-w-2xl">
                  Gerencie inscrições, saúde, anexos, comprovantes, menores de
                  idade e status de pagamento.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 relative z-[9999]">
            <button
  onClick={carregarInscritos}
  disabled={carregandoInscritos}
  className="bg-black/40 border border-[#2A2A2A] hover:border-[#C79A4A] px-5 py-3 rounded-2xl font-bold transition-all disabled:opacity-60 flex items-center justify-center gap-2"
>
  {carregandoInscritos && (
    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
  )}

  {carregandoInscritos ? "Atualizando..." : "Atualizar"}
</button>

              <div className="relative">
                <button
                  onClick={() => setMenuExportarAberto(!menuExportarAberto)}
                  className="bg-[#C79A4A] hover:bg-yellow-600 text-black px-5 py-3 rounded-2xl font-black w-full sm:w-auto transition-all"
                >
                  Exportar
                </button>

                {menuExportarAberto && (
                  <div className="absolute right-0 mt-2 w-72 bg-[#151515] border border-[#2A2A2A] rounded-2xl shadow-2xl z-[9999] overflow-hidden">
                    <MenuExportar
                      label="Exportar todos"
                      onClick={() => {
                        exportarCSV(inscritos, "todos-inscritos-forjados.csv");
                        setMenuExportarAberto(false);
                      }}
                    />

                    <MenuExportar
                      label="Exportar pagos"
                      cor="text-green-400"
                      onClick={() => {
                        exportarCSV(listaPagos, "pagos-forjados.csv");
                        setMenuExportarAberto(false);
                      }}
                    />

                    <MenuExportar
                      label="Exportar pendentes"
                      cor="text-yellow-400"
                      onClick={() => {
                        exportarCSV(listaPendentes, "pendentes-forjados.csv");
                        setMenuExportarAberto(false);
                      }}
                    />

                    <MenuExportar
                      label="Exportar cancelados"
                      cor="text-red-400"
                      onClick={() => {
                        exportarCSV(listaCancelados, "cancelados-forjados.csv");
                        setMenuExportarAberto(false);
                      }}
                    />

                    <MenuExportar
                      label="Exportar menores"
                      cor="text-[#C79A4A]"
                      onClick={() => {
                        exportarCSV(listaMenores, "menores-forjados.csv");
                        setMenuExportarAberto(false);
                      }}
                    />

                    <div className="border-t border-[#2A2A2A]" />

                    <MenuExportar
                      label="Exportar filtro atual"
                      cor="text-gray-300"
                      onClick={() => {
                        exportarCSV(
                          inscritosFiltrados,
                          "filtro-atual-forjados.csv"
                        );
                        setMenuExportarAberto(false);
                      }}
                    />
                  </div>
                )}
              </div>

              <button
  onClick={() => setConfirmarLogout(true)}
  className="bg-[#B71C1C] hover:bg-red-800 px-5 py-3 rounded-2xl font-black transition-all"
>
  Encerrar sessão
</button>
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <CardResumo
            titulo="Total"
            valor={inscritos.length}
            detalhe="Inscrições recebidas"
          />

          <CardResumo
            titulo="Pagos"
            valor={pagos}
            detalhe="Confirmados"
            cor="text-green-400"
          />

          <CardResumo
            titulo="Pendentes"
            valor={pendentes}
            detalhe="Aguardando análise"
            cor="text-yellow-400"
          />

          <CardResumo
            titulo="Cancelados"
            valor={cancelados}
            detalhe="Não confirmados"
            cor="text-red-400"
          />

          <CardResumo
            titulo="Menores"
            valor={menores}
            detalhe="Exigem autorização"
            cor="text-[#C79A4A]"
          />
        </div>

        <div className="bg-[#121212] border border-[#2A2A2A] rounded-[28px] p-4 sm:p-5 mb-6 shadow-xl">
          <div className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="Buscar por nome, CPF, telefone, e-mail, igreja, camisa ou status..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full bg-[#090909] border border-[#2A2A2A] rounded-2xl px-5 py-4 outline-none focus:border-[#C79A4A]"
            />

            <div className="flex flex-wrap gap-2">
              <BotaoFiltro
                ativo={filtro === "todos"}
                onClick={() => setFiltro("todos")}
              >
                Todos
              </BotaoFiltro>

              <BotaoFiltro
                ativo={filtro === "pendente"}
                onClick={() => setFiltro("pendente")}
              >
                Pendentes
              </BotaoFiltro>

              <BotaoFiltro
                ativo={filtro === "pago"}
                onClick={() => setFiltro("pago")}
              >
                Pagos
              </BotaoFiltro>

              <BotaoFiltro
                ativo={filtro === "cancelado"}
                onClick={() => setFiltro("cancelado")}
              >
                Cancelados
              </BotaoFiltro>

              <BotaoFiltro
                ativo={filtro === "menores"}
                onClick={() => setFiltro("menores")}
              >
                Menores
              </BotaoFiltro>
            </div>

            <p className="text-gray-500 text-sm">
              Exibindo{" "}
              <span className="text-[#C79A4A] font-bold">
                {inscritosFiltrados.length}
              </span>{" "}
              de{" "}
              <span className="text-white font-bold">{inscritos.length}</span>{" "}
              inscritos.
            </p>
          </div>
        </div>
        {carregandoInscritos && (
  <div className="mb-6 bg-[#121212] border border-[#C79A4A]/40 rounded-2xl p-4 text-[#C79A4A] font-bold flex items-center gap-3 animate-fade-in">
    <span className="w-5 h-5 border-4 border-[#C79A4A]/30 border-t-[#C79A4A] rounded-full animate-spin" />
    Carregando inscrições...
  </div>
)}
        <div className="bg-[#121212] border border-[#2A2A2A] rounded-[28px] overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-black/60 text-[#C79A4A]">
                <tr>
                  <th className="p-4 text-left">Foto</th>
                  <th className="p-4 text-left">Nome</th>
                  <th className="p-4 text-left">Idade</th>
                  <th className="p-4 text-left">WhatsApp</th>
                  <th className="p-4 text-left">Igreja</th>
                  <th className="p-4 text-left">Camisa</th>
                  <th className="p-4 text-left">Comprovante</th>
                  <th className="p-4 text-left">Autorização</th>
                  <th className="p-4 text-left">Status</th>
                  <th className="p-4 text-left">Ações</th>
                </tr>
              </thead>

              <tbody>
                {inscritosFiltrados.map((item) => {
                  const ehMenor = Number(item.idade) < 18;

                  return (
                    <tr
                      key={item.id}
                      className="border-t border-[#2A2A2A] hover:bg-white/[0.03] transition-all"
                    >
                      <td className="p-4">
                        {item.foto_url ? (
                          <a
                            href={item.foto_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block"
                          >
                            <img
                              src={item.foto_url}
                              alt={item.nome}
                              className="w-16 h-16 rounded-2xl object-cover border border-[#C79A4A] cursor-pointer"
                            />
                          </a>
                        ) : (
                          <span className="text-gray-500">Sem foto</span>
                        )}
                      </td>

                      <td className="p-4 font-bold min-w-[200px]">
                        <div className="text-white">{item.nome}</div>
                        <div className="text-gray-500 text-xs mt-1">
                          {item.email}
                        </div>

                        {ehMenor && (
                          <span className="inline-block mt-2 text-[10px] bg-[#C79A4A] text-black px-2 py-1 rounded-full font-black">
                            MENOR DE IDADE
                          </span>
                        )}
                      </td>

                      <td className="p-4">
                        <span
                          className={
                            ehMenor ? "text-[#C79A4A] font-black" : ""
                          }
                        >
                          {item.idade || "-"}
                        </span>
                      </td>

                      <td className="p-4 min-w-[160px]">
                        <p>{item.telefone}</p>

                        <button
                          onClick={() => abrirWhatsApp(item)}
                          className="mt-2 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-xl font-black text-xs transition-all"
                        >
                          Abrir conversa
                        </button>
                      </td>

                      <td className="p-4 min-w-[140px]">
                        {item.igreja || "-"}
                      </td>

                      <td className="p-4 font-bold">{item.camisa || "-"}</td>

                      <td className="p-4">
                        {item.comprovante_url ? (
                          <a
                            href={item.comprovante_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-[#C79A4A] hover:bg-yellow-600 text-black px-4 py-2 rounded-xl font-black inline-block transition-all"
                          >
                            Abrir
                          </a>
                        ) : (
                          <span className="text-gray-500">Sem comprovante</span>
                        )}
                      </td>

                      <td className="p-4">
                        {ehMenor ? (
                          item.autorizacao_menor_url ? (
                            <a
                              href={item.autorizacao_menor_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-[#C79A4A] hover:bg-yellow-600 text-black px-4 py-2 rounded-xl font-black inline-block transition-all"
                            >
                              Abrir
                            </a>
                          ) : (
                            <span className="text-red-400 font-bold">
                              Pendente
                            </span>
                          )
                        ) : (
                          <span className="text-gray-500">Não precisa</span>
                        )}
                      </td>

                      <td className="p-4">
                        <select
                          value={item.pagamento_status || "pendente"}
                          onChange={(e) =>
                            alterarStatus(item.id, e.target.value)
                          }
                          className={`border px-3 py-2 rounded-xl text-xs font-bold uppercase bg-[#090909] ${classeStatus(
                            item.pagamento_status
                          )}`}
                        >
                          <option value="pendente">Pendente</option>
                          <option value="pago">Pago</option>
                          <option value="cancelado">Cancelado</option>
                        </select>
                      </td>

                      <td className="p-4">
                        <button
                          onClick={() => setSelecionado(item)}
                          className="bg-white text-black hover:bg-[#C79A4A] px-4 py-2 rounded-xl font-black transition-all"
                        >
                          Ver ficha
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {inscritosFiltrados.length === 0 && (
            <div className="p-12 text-center text-gray-400">
              Nenhum inscrito encontrado.
            </div>
          )}
        </div>
      </section>

      {selecionado && (
        <FichaCompleta
        item={selecionado}
        fechar={() => setSelecionado(null)}
        alterarStatus={alterarStatus}
        salvarObservacaoAdmin={salvarObservacaoAdmin}
        abrirWhatsApp={abrirWhatsApp}
        classeStatus={classeStatus}
        formatarData={formatarData}
      />
      )}
      {confirmarLogout && (
  <div className="fixed inset-0 bg-black/80 z-[99999] flex items-center justify-center px-4 backdrop-blur-sm">
    <div className="w-full max-w-md bg-[#121212] border border-[#2A2A2A] rounded-[32px] p-8 shadow-2xl text-center animate-fade-up">
      <div className="w-16 h-16 mx-auto rounded-full bg-[#B71C1C]/15 border border-[#B71C1C]/40 flex items-center justify-center mb-5">
        <span className="text-3xl">⚠️</span>
      </div>

      <h2 className="text-3xl font-black text-white mb-3">
        Encerrar sessão?
      </h2>

      <p className="text-gray-400 leading-relaxed mb-8">
        Você será desconectado do painel administrativo do FORJADOS.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={() => setConfirmarLogout(false)}
          className="bg-[#0B0B0B] border border-[#2A2A2A] hover:border-[#C79A4A] text-white px-5 py-4 rounded-2xl font-black transition-all"
        >
          Cancelar
        </button>

        <button
          onClick={sair}
          className="bg-[#B71C1C] hover:bg-red-800 text-white px-5 py-4 rounded-2xl font-black transition-all"
        >
          Encerrar
        </button>
      </div>
    </div>
  </div>
)}
    </main>
  );
}

function FichaCompleta({
  item,
  fechar,
  alterarStatus,
  salvarObservacaoAdmin,
  abrirWhatsApp,
  classeStatus,
  formatarData,
}: {
  item: Inscrito;
  fechar: () => void;
  alterarStatus: (id: string, novoStatus: string) => void;
  salvarObservacaoAdmin: (id: string, observacao: string) => Promise<boolean>;
  abrirWhatsApp: (item: Inscrito) => void;
  classeStatus: (status: string) => string;
  formatarData: (data: string) => string;
}) {
  const ehMenor = Number(item.idade) < 18;
  const [observacao, setObservacao] = useState(item.observacao_admin || "");
const [salvandoObservacao, setSalvandoObservacao] = useState(false);

async function salvarObservacao() {
  setSalvandoObservacao(true);

  const sucesso = await salvarObservacaoAdmin(item.id, observacao);

  setSalvandoObservacao(false);

  if (sucesso) {
    alert("Observação salva com sucesso!");
  }
}

  return (
    <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center px-4 sm:px-6 backdrop-blur-sm">
      <div className="bg-[#121212] border border-[#2A2A2A] rounded-[36px] p-5 sm:p-8 max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
          <div>
            <span className="text-[#C79A4A] uppercase tracking-[0.2em] text-xs">
              Ficha completa
            </span>

            <h2 className="text-3xl sm:text-5xl font-black text-white mt-2 leading-tight">
              {item.nome}
            </h2>

            <p className="text-gray-400 mt-2">
              Dados pessoais, saúde, pagamento, anexos e contato.
            </p>
          </div>

          <button
            onClick={fechar}
            className="bg-[#B71C1C] hover:bg-red-800 px-4 py-2 rounded-xl font-black h-fit transition-all"
          >
            Fechar
          </button>
        </div>

        <div className="grid lg:grid-cols-[260px_1fr] gap-8">
          <aside>
            {item.foto_url ? (
              <a
                href={item.foto_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <img
                  src={item.foto_url}
                  alt={item.nome}
                  className="w-full max-w-[260px] h-[260px] rounded-[28px] object-cover border border-[#C79A4A] cursor-pointer"
                />
              </a>
            ) : (
              <div className="w-full max-w-[260px] h-[260px] rounded-[28px] bg-[#090909] border border-[#2A2A2A] flex items-center justify-center text-gray-500">
                Sem foto
              </div>
            )}

            {ehMenor && (
              <div className="mt-4 bg-[#C79A4A]/10 border border-[#C79A4A]/40 rounded-2xl p-4">
                <p className="text-[#C79A4A] font-black">Menor de idade</p>
                <p className="text-gray-400 text-sm mt-1">
                  Verificar autorização assinada.
                </p>
              </div>
            )}

            <div className="mt-4 bg-[#090909] border border-[#2A2A2A] rounded-2xl p-4">
              <p className="text-gray-500 text-sm mb-2">Status do pagamento</p>

              <select
                value={item.pagamento_status || "pendente"}
                onChange={(e) => alterarStatus(item.id, e.target.value)}
                className={`w-full border px-3 py-3 rounded-xl text-xs font-bold uppercase bg-[#090909] ${classeStatus(
                  item.pagamento_status
                )}`}
              >
                <option value="pendente">Pendente</option>
                <option value="pago">Pago</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>

            <button
              onClick={() => abrirWhatsApp(item)}
              className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-xl font-black transition-all"
            >
              Abrir conversa
            </button>

            <div className="mt-4 space-y-3">
              {item.comprovante_url && (
                <a
                  href={item.comprovante_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-center bg-[#C79A4A] hover:bg-yellow-600 text-black px-4 py-3 rounded-xl font-black transition-all"
                >
                  Abrir comprovante
                </a>
              )}

              {item.autorizacao_menor_url && (
                <a
                  href={item.autorizacao_menor_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-center bg-[#C79A4A] hover:bg-yellow-600 text-black px-4 py-3 rounded-xl font-black transition-all"
                >
                  Abrir autorização
                </a>
              )}
            </div>
          </aside>

          <div className="space-y-8">
            <Secao titulo="Dados pessoais">
              <Campo label="Nome" valor={item.nome} />
              <Campo label="CPF" valor={item.cpf} />
              <Campo label="WhatsApp" valor={item.telefone} />
              <Campo label="E-mail" valor={item.email} />
              <Campo label="Endereço" valor={item.endereco} />
              <Campo label="Idade" valor={item.idade} />
              <Campo label="Igreja" valor={item.igreja} />
              <Campo label="Camisa" valor={item.camisa} />
              <Campo
                label="Data da inscrição"
                valor={formatarData(item.created_at)}
              />
            </Secao>

            <Secao titulo="Saúde">
              <Campo label="Alergias" valor={item.alergias} />
              <Campo label="Medicamentos" valor={item.medicamentos} />
              <Campo label="Condição de saúde" valor={item.condicao_saude} />
              <Campo
                label="Restrição alimentar"
                valor={item.restricao_alimentar}
              />
              <Campo
                label="Contato de emergência"
                valor={item.contato_emergencia_nome}
              />
              <Campo
                label="Telefone de emergência"
                valor={item.contato_emergencia_telefone}
              />
            </Secao>
            <div className="bg-[#090909] border border-[#2A2A2A] rounded-[28px] p-5">
  <h3 className="text-2xl font-black text-[#C79A4A] mb-3">
    Observação interna
  </h3>

  <p className="text-gray-500 text-sm mb-4">
    Anotações visíveis apenas para a organização. O participante não vê esta informação.
  </p>

  <textarea
    value={observacao}
    onChange={(e) => setObservacao(e.target.value)}
    placeholder="Ex: comprovante conferido, falta autorização, entrou em contato pelo WhatsApp..."
    className="w-full min-h-[140px] bg-[#121212] border border-[#2A2A2A] rounded-2xl px-5 py-4 outline-none focus:border-[#C79A4A] text-white"
  />

  <button
    onClick={salvarObservacao}
    disabled={salvandoObservacao}
    className="mt-4 bg-[#C79A4A] hover:bg-yellow-600 text-black px-5 py-3 rounded-xl font-black transition-all disabled:opacity-60"
  >
    {salvandoObservacao ? "SALVANDO..." : "SALVAR OBSERVAÇÃO"}
  </button>
</div>

            <Secao titulo="Pagamento e anexos" colunas="md:grid-cols-3">
              <Anexo titulo="Foto" url={item.foto_url} textoBotao="Abrir foto" />

              <Anexo
                titulo="Comprovante"
                url={item.comprovante_url}
                textoBotao="Abrir comprovante"
              />

              <Anexo
                titulo="Autorização do menor"
                url={item.autorizacao_menor_url}
                textoBotao="Abrir autorização"
                textoVazio={ehMenor ? "Pendente" : "Não precisa"}
              />
            </Secao>
          </div>
        </div>
      </div>
    </div>
  );
}

function CardResumo({
  titulo,
  valor,
  detalhe,
  cor = "text-white",
}: {
  titulo: string;
  valor: number;
  detalhe: string;
  cor?: string;
}) {
  return (
    <div className="bg-[#121212] border border-[#2A2A2A] hover:border-[#C79A4A]/60 rounded-[28px] p-6 shadow-xl transition-all">
      <p className="text-gray-400">{titulo}</p>
      <h2 className={`text-5xl font-black mt-2 ${cor}`}>{valor}</h2>
      <p className="text-gray-600 text-sm mt-3">{detalhe}</p>
    </div>
  );
}

function BotaoFiltro({
  ativo,
  onClick,
  children,
}: {
  ativo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={
        ativo
          ? "bg-[#C79A4A] text-black px-4 py-2 rounded-xl font-black shadow-lg"
          : "bg-[#090909] border border-[#2A2A2A] text-gray-300 px-4 py-2 rounded-xl font-bold hover:border-[#C79A4A] transition-all"
      }
    >
      {children}
    </button>
  );
}

function MenuExportar({
  label,
  onClick,
  cor = "text-white",
}: {
  label: string;
  onClick: () => void;
  cor?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-5 py-3 hover:bg-[#090909] ${cor} font-bold transition-all`}
    >
      {label}
    </button>
  );
}

function Secao({
  titulo,
  children,
  colunas = "md:grid-cols-2",
}: {
  titulo: string;
  children: React.ReactNode;
  colunas?: string;
}) {
  return (
    <div className="bg-[#090909] border border-[#2A2A2A] rounded-[28px] p-5">
      <h3 className="text-2xl font-black text-[#C79A4A] mb-5">{titulo}</h3>
      <div className={`grid ${colunas} gap-4`}>{children}</div>
    </div>
  );
}

function Campo({ label, valor }: { label: string; valor?: string }) {
  return (
    <div className="bg-[#121212] border border-[#2A2A2A] rounded-2xl p-4">
      <p className="text-gray-500 text-sm mb-1">{label}</p>
      <p className="text-white font-bold break-words whitespace-pre-wrap">
        {valor || "-"}
      </p>
    </div>
  );
}

function Anexo({
  titulo,
  url,
  textoBotao,
  textoVazio = "Não enviado",
}: {
  titulo: string;
  url?: string;
  textoBotao: string;
  textoVazio?: string;
}) {
  return (
    <div className="bg-[#121212] border border-[#2A2A2A] rounded-2xl p-4">
      <p className="text-gray-500 text-sm mb-3">{titulo}</p>

      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-[#C79A4A] hover:bg-yellow-600 text-black px-4 py-2 rounded-xl font-black transition-all"
        >
          {textoBotao}
        </a>
      ) : (
        <p className="text-gray-400 font-bold">{textoVazio}</p>
      )}
    </div>
  );
}