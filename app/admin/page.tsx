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
  created_at: string;
};

export default function AdminPage() {
  const [email, setEmail] = useState("forjados.ofc@gmail.com");
  const [senha, setSenha] = useState("");
  const [logado, setLogado] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [inscritos, setInscritos] = useState<Inscrito[]>([]);
  const [busca, setBusca] = useState("");
  const [selecionado, setSelecionado] = useState<Inscrito | null>(null);

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
    setLogado(false);
    setInscritos([]);
  }

  async function carregarInscritos() {
    const { data, error } = await supabase
      .from("inscritos")
      .select("*")
      .order("created_at", { ascending: false });

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

  function exportarCSV() {
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
      "Foto",
      "Comprovante",
      "Autorizacao menor",
      "Data",
    ];

    const linhas = inscritos.map((item) => [
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
      item.pagamento_status,
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
    link.download = "inscritos-forjados.csv";
    link.click();

    URL.revokeObjectURL(url);
  }

  function classeStatus(status: string) {
    if (status === "pago" || status === "approved") {
      return "bg-green-500/10 text-green-400 border-green-500/30";
    }

    if (status === "cancelado") {
      return "bg-red-500/10 text-red-400 border-red-500/30";
    }

    return "bg-yellow-500/10 text-yellow-400 border-yellow-500/30";
  }

  function formatarData(data: string) {
    if (!data) return "-";

    return new Date(data).toLocaleString("pt-BR");
  }

  const inscritosFiltrados = inscritos.filter((item) => {
    const texto = busca.toLowerCase();

    return (
      item.nome?.toLowerCase().includes(texto) ||
      item.cpf?.toLowerCase().includes(texto) ||
      item.telefone?.toLowerCase().includes(texto) ||
      item.email?.toLowerCase().includes(texto) ||
      item.igreja?.toLowerCase().includes(texto) ||
      item.camisa?.toLowerCase().includes(texto) ||
      item.pagamento_status?.toLowerCase().includes(texto)
    );
  });

  const pagos = inscritos.filter(
    (item) =>
      item.pagamento_status === "pago" || item.pagamento_status === "approved"
  ).length;

  const cancelados = inscritos.filter(
    (item) => item.pagamento_status === "cancelado"
  ).length;

  const pendentes = inscritos.length - pagos - cancelados;

  const menores = inscritos.filter((item) => Number(item.idade) < 18).length;

  if (!logado) {
    return (
      <main className="min-h-screen bg-[#0F0F10] text-white flex items-center justify-center px-6">
        <form
          onSubmit={fazerLogin}
          className="w-full max-w-md bg-[#181818] border border-[#2A2A2A] rounded-[32px] p-8"
        >
          <h1 className="text-4xl font-black text-[#C79A4A] mb-2">
            Admin FORJADOS
          </h1>

          <p className="text-gray-400 mb-8">
            Entre para acessar o painel de inscritos.
          </p>

          <div className="space-y-4">
            <input
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#0F0F10] border border-[#2A2A2A] rounded-2xl px-5 py-4 outline-none focus:border-[#C79A4A]"
            />

            <input
              type="password"
              placeholder="Senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full bg-[#0F0F10] border border-[#2A2A2A] rounded-2xl px-5 py-4 outline-none focus:border-[#C79A4A]"
            />

            <button
              disabled={carregando}
              className="w-full bg-[#B71C1C] hover:bg-red-800 transition-all py-4 rounded-2xl font-black disabled:opacity-60"
            >
              {carregando ? "ENTRANDO..." : "ENTRAR"}
            </button>
          </div>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0F0F10] text-white px-6 py-10">
      <section className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-5xl font-black text-[#C79A4A]">
              Painel FORJADOS
            </h1>

            <p className="text-gray-400 mt-2">
              Gerencie inscrições, saúde, anexos, comprovantes e status.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={carregarInscritos}
              className="bg-[#181818] border border-[#2A2A2A] px-5 py-3 rounded-xl font-bold"
            >
              Atualizar
            </button>

            <button
              onClick={exportarCSV}
              className="bg-[#C79A4A] text-black px-5 py-3 rounded-xl font-black"
            >
              Exportar Excel
            </button>

            <button
              onClick={sair}
              className="bg-[#B71C1C] px-5 py-3 rounded-xl font-black"
            >
              Sair
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-5 gap-4 mb-8">
          <CardResumo titulo="Total" valor={inscritos.length} />
          <CardResumo titulo="Pagos" valor={pagos} cor="text-green-400" />
          <CardResumo
            titulo="Pendentes"
            valor={pendentes}
            cor="text-yellow-400"
          />
          <CardResumo
            titulo="Cancelados"
            valor={cancelados}
            cor="text-red-400"
          />
          <CardResumo titulo="Menores" valor={menores} cor="text-[#C79A4A]" />
        </div>

        <div className="mb-6">
          <input
            type="text"
            placeholder="Buscar por nome, CPF, telefone, e-mail, igreja, camisa ou status..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full bg-[#181818] border border-[#2A2A2A] rounded-2xl px-5 py-4 outline-none focus:border-[#C79A4A]"
          />
        </div>

        <div className="bg-[#181818] border border-[#2A2A2A] rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-black/50 text-[#C79A4A]">
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
                {inscritosFiltrados.map((item) => (
                  <tr key={item.id} className="border-t border-[#2A2A2A]">
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
                            className="w-14 h-14 rounded-full object-cover border border-[#C79A4A] cursor-pointer"
                          />
                        </a>
                      ) : (
                        <span className="text-gray-500">Sem foto</span>
                      )}
                    </td>

                    <td className="p-4 font-bold min-w-[180px]">
                      {item.nome}
                    </td>

                    <td className="p-4">
                      <span
                        className={
                          Number(item.idade) < 18
                            ? "text-[#C79A4A] font-black"
                            : ""
                        }
                      >
                        {item.idade || "-"}
                      </span>
                    </td>

                    <td className="p-4">{item.telefone}</td>
                    <td className="p-4">{item.igreja}</td>
                    <td className="p-4">{item.camisa}</td>

                    <td className="p-4">
                      {item.comprovante_url ? (
                        <a
                          href={item.comprovante_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-[#C79A4A] text-black px-4 py-2 rounded-xl font-black inline-block"
                        >
                          Abrir
                        </a>
                      ) : (
                        <span className="text-gray-500">
                          Sem comprovante
                        </span>
                      )}
                    </td>

                    <td className="p-4">
                      {Number(item.idade) < 18 ? (
                        item.autorizacao_menor_url ? (
                          <a
                            href={item.autorizacao_menor_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-[#C79A4A] text-black px-4 py-2 rounded-xl font-black inline-block"
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
                        className={`border px-3 py-2 rounded-xl text-xs font-bold uppercase bg-[#0F0F10] ${classeStatus(
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
                        className="bg-[#C79A4A] text-black px-4 py-2 rounded-xl font-black"
                      >
                        Ver ficha
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {inscritosFiltrados.length === 0 && (
            <div className="p-10 text-center text-gray-400">
              Nenhum inscrito encontrado.
            </div>
          )}
        </div>
      </section>

      {selecionado && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center px-6">
          <div className="bg-[#181818] border border-[#2A2A2A] rounded-[32px] p-8 max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between gap-4 mb-8">
              <div>
                <h2 className="text-4xl font-black text-[#C79A4A]">
                  Ficha do inscrito
                </h2>

                <p className="text-gray-400">
                  Dados completos, saúde, anexos e status.
                </p>
              </div>

              <button
                onClick={() => setSelecionado(null)}
                className="bg-[#B71C1C] px-4 py-2 rounded-xl font-black h-fit"
              >
                Fechar
              </button>
            </div>

            <div className="grid lg:grid-cols-[220px_1fr] gap-8">
              <div>
                {selecionado.foto_url ? (
                  <a
                    href={selecionado.foto_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <img
                      src={selecionado.foto_url}
                      alt={selecionado.nome}
                      className="w-52 h-52 rounded-3xl object-cover border border-[#C79A4A] cursor-pointer"
                    />
                  </a>
                ) : (
                  <div className="w-52 h-52 rounded-3xl bg-[#0F0F10] border border-[#2A2A2A] flex items-center justify-center text-gray-500">
                    Sem foto
                  </div>
                )}

                <div className="mt-4">
                  <select
                    value={selecionado.pagamento_status || "pendente"}
                    onChange={(e) =>
                      alterarStatus(selecionado.id, e.target.value)
                    }
                    className={`w-full border px-3 py-3 rounded-xl text-xs font-bold uppercase bg-[#0F0F10] ${classeStatus(
                      selecionado.pagamento_status
                    )}`}
                  >
                    <option value="pendente">Pendente</option>
                    <option value="pago">Pago</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                </div>

                <div className="mt-4 space-y-3">
                  {selecionado.comprovante_url && (
                    <a
                      href={selecionado.comprovante_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-center bg-[#C79A4A] text-black px-4 py-3 rounded-xl font-black"
                    >
                      Abrir comprovante
                    </a>
                  )}

                  {selecionado.autorizacao_menor_url && (
                    <a
                      href={selecionado.autorizacao_menor_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-center bg-[#C79A4A] text-black px-4 py-3 rounded-xl font-black"
                    >
                      Abrir autorização
                    </a>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-black text-[#C79A4A] mb-4">
                    Dados pessoais
                  </h3>

                  <div className="grid md:grid-cols-2 gap-4">
                    <Campo label="Nome" valor={selecionado.nome} />
                    <Campo label="CPF" valor={selecionado.cpf} />
                    <Campo label="WhatsApp" valor={selecionado.telefone} />
                    <Campo label="E-mail" valor={selecionado.email} />
                    <Campo label="Endereço" valor={selecionado.endereco} />
                    <Campo label="Idade" valor={selecionado.idade} />
                    <Campo label="Igreja" valor={selecionado.igreja} />
                    <Campo label="Camisa" valor={selecionado.camisa} />
                    <Campo
                      label="Data da inscrição"
                      valor={formatarData(selecionado.created_at)}
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-2xl font-black text-[#C79A4A] mb-4">
                    Saúde
                  </h3>

                  <div className="grid md:grid-cols-2 gap-4">
                    <Campo label="Alergias" valor={selecionado.alergias} />
                    <Campo
                      label="Medicamentos"
                      valor={selecionado.medicamentos}
                    />
                    <Campo
                      label="Condição de saúde"
                      valor={selecionado.condicao_saude}
                    />
                    <Campo
                      label="Restrição alimentar"
                      valor={selecionado.restricao_alimentar}
                    />
                    <Campo
                      label="Contato de emergência"
                      valor={selecionado.contato_emergencia_nome}
                    />
                    <Campo
                      label="Telefone de emergência"
                      valor={selecionado.contato_emergencia_telefone}
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-2xl font-black text-[#C79A4A] mb-4">
                    Anexos
                  </h3>

                  <div className="grid md:grid-cols-3 gap-4">
                    <Anexo
                      titulo="Foto"
                      url={selecionado.foto_url}
                      textoBotao="Abrir foto"
                    />

                    <Anexo
                      titulo="Comprovante"
                      url={selecionado.comprovante_url}
                      textoBotao="Abrir comprovante"
                    />

                    <Anexo
                      titulo="Autorização do menor"
                      url={selecionado.autorizacao_menor_url}
                      textoBotao="Abrir autorização"
                      textoVazio={
                        Number(selecionado.idade) < 18
                          ? "Pendente"
                          : "Não precisa"
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function CardResumo({
  titulo,
  valor,
  cor = "text-white",
}: {
  titulo: string;
  valor: number;
  cor?: string;
}) {
  return (
    <div className="bg-[#181818] border border-[#2A2A2A] rounded-3xl p-6">
      <p className="text-gray-400">{titulo}</p>
      <h2 className={`text-5xl font-black mt-2 ${cor}`}>{valor}</h2>
    </div>
  );
}

function Campo({ label, valor }: { label: string; valor?: string }) {
  return (
    <div className="bg-[#0F0F10] border border-[#2A2A2A] rounded-2xl p-4">
      <p className="text-gray-500 text-sm mb-1">{label}</p>
      <p className="text-white font-bold break-words">{valor || "-"}</p>
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
    <div className="bg-[#0F0F10] border border-[#2A2A2A] rounded-2xl p-4">
      <p className="text-gray-500 text-sm mb-3">{titulo}</p>

      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-[#C79A4A] text-black px-4 py-2 rounded-xl font-black"
        >
          {textoBotao}
        </a>
      ) : (
        <p className="text-gray-400 font-bold">{textoVazio}</p>
      )}
    </div>
  );
}