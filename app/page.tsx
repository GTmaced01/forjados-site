export default function Home() {
  return (
    <main className="min-h-screen bg-[#0F0F10] text-white overflow-x-hidden">
      {/* HERO */}
      <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 py-20">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-[#111111] to-[#0F0F10]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(183,28,28,0.28),transparent_42%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(199,154,74,0.18),transparent_38%)]" />

        <div className="absolute top-20 left-10 w-40 h-40 bg-[#B71C1C]/20 blur-3xl rounded-full" />
        <div className="absolute bottom-20 right-10 w-56 h-56 bg-[#C79A4A]/10 blur-3xl rounded-full" />

        <div className="relative z-10 max-w-6xl mx-auto grid lg:grid-cols-2 gap-14 lg:gap-20 items-center animate-fade-up">
          {/* TEXTO */}
          <div>
            <span className="inline-block border border-[#C79A4A] text-[#C79A4A] px-4 py-2 rounded-full uppercase tracking-widest text-sm mb-6">
              Pré-venda
            </span>

            <img
              src="/logo-forjados.png"
              alt="Logo FORJADOS"
              className="w-full max-w-[430px] mb-8"
            />

            <h1 className="text-3xl sm:text-4xl md:text-6xl font-black uppercase leading-tight mb-6 break-words">
              A forja não era para te destruir.
              <span className="block text-[#C79A4A]">
                Era para te transformar.
              </span>
            </h1>

            <p className="text-gray-300 text-base sm:text-lg leading-relaxed max-w-xl mb-8">
              O FORJADOS é um retiro de cura, restauração e transformação espiritual
              para pessoas que carregam dores, feridas e batalhas internas — mas
              desejam reencontrar identidade, propósito e a presença de Deus.
            </p>

            <div className="border-l-4 border-[#C79A4A] pl-5 mb-10">
              <p className="text-xl sm:text-2xl text-white font-bold leading-relaxed">
                “Eu não sou vítima do meu passado.
                <span className="block text-[#C79A4A]">
                  Sou testemunho da graça de Deus.”
                </span>
              </p>
            </div>
          </div>

          {/* CARD */}
          <div className="relative">
            <div className="absolute w-96 h-96 bg-red-700/20 blur-3xl rounded-full" />

            <div className="relative bg-[#181818]/95 border border-[#2A2A2A] rounded-[32px] p-5 sm:p-8 shadow-2xl animate-pulse-glow">
              <h2 className="text-3xl sm:text-4xl font-black uppercase mb-4 leading-tight">
                Inscrições abertas
              </h2>

              <p className="text-gray-400 mb-6 leading-relaxed">
                Pré-venda disponível por tempo limitado. Garanta sua participação
                nessa experiência de cura, perdão e restauração.
              </p>

              <div className="space-y-4">
              <div className="bg-black/40 border border-[#2A2A2A] rounded-2xl p-5">
  <div className="flex items-center justify-between gap-3 mb-3">
    <p className="text-gray-400">
      Valor da pré-venda
    </p>

    <span className="bg-[#B71C1C] text-white text-xs font-black px-3 py-1 rounded-full">
      25% OFF
    </span>
  </div>

  <div className="flex items-end gap-3 mb-2">
    <span className="text-gray-500 text-2xl font-black line-through">
      R$180
    </span>

    <h3 className="text-5xl font-black text-[#C79A4A] leading-none">
      R$135
    </h3>
  </div>

  <p className="text-gray-500 mt-2">
    Pré-venda por tempo limitado. Pagamento com comprovante anexado na inscrição.
  </p>
</div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl p-5">
                    <p className="text-gray-400 text-sm">Modalidade</p>

                    <h3 className="text-xl font-bold mt-2">
                      Retiro Misto
                    </h3>
                  </div>

                  <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl p-5">
                    <p className="text-gray-400 text-sm">Organização</p>

                    <h3 className="text-xl font-bold mt-2">
                      IEST
                    </h3>
                  </div>
                </div>

                <a
                  href="/inscricao"
                  className="block w-full bg-[#C79A4A] hover:bg-yellow-600 transition-all text-black py-4 rounded-2xl font-black text-lg text-center"
                >
                  INSCREVER AGORA
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* QUEM SOMOS */}
      <section className="py-24 sm:py-28 px-4 sm:px-6 bg-[#121212]">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <span className="text-[#C79A4A] uppercase tracking-widest text-sm">
              Quem somos
            </span>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase mt-4 mb-8 leading-tight break-words">
              O FORJADOS não é sobre pessoas fortes.
            </h2>

            <p className="text-gray-300 text-lg leading-relaxed mb-6">
              É sobre pessoas que foram quebradas... e encontraram cura em Deus.
            </p>

            <p className="text-gray-300 text-lg leading-relaxed mb-6">
              Pessoas marcadas pela vida, mas restauradas pelo amor do Pai.
              Pessoas que venceram batalhas internas, escolheram perdoar e
              decidiram não transmitir sua dor.
            </p>

            <p className="text-[#C79A4A] text-2xl font-black leading-relaxed">
              Forjados pelo fogo. Guiados pelo Espírito.
            </p>
          </div>

          <div className="bg-[#181818] border border-[#2A2A2A] rounded-[32px] p-6 sm:p-8">
            <p className="text-2xl sm:text-3xl md:text-4xl font-black leading-tight mb-6 break-words">
              “O fogo não me destruiu.
              <span className="block text-[#C79A4A]">
                Me forjou.”
              </span>
            </p>

            <p className="text-gray-400 leading-relaxed">
              O FORJADOS existe para lembrar que a dor não precisa ser o fim da
              história. Em Deus, feridas podem se tornar testemunhos, cicatrizes
              podem carregar propósito e corações quebrados podem voltar a amar.
            </p>
          </div>
        </div>
      </section>

      {/* DNA */}
      <section className="py-24 sm:py-28 px-4 sm:px-6 bg-[#0F0F10]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-[#C79A4A] uppercase tracking-widest text-sm">
              DNA do FORJADOS
            </span>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase mt-4 mb-6 leading-tight break-words">
              Marcados pela vida. Restaurados pelo amor de Deus.
            </h2>

            <p className="text-gray-400 text-lg max-w-3xl mx-auto leading-relaxed">
              Um forjado é alguém que encontrou identidade em Cristo, escolheu
              perdoar, venceu batalhas internas e agora carrega luz onde antes
              havia feridas.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-[#181818] border border-[#2A2A2A] rounded-3xl p-8">
              <h3 className="text-2xl font-black text-[#C79A4A] mb-4">
                Cura
              </h3>

              <p className="text-gray-400 leading-relaxed">
                A presença de Deus restaura o que a vida tentou destruir.
              </p>
            </div>

            <div className="bg-[#181818] border border-[#2A2A2A] rounded-3xl p-8">
              <h3 className="text-2xl font-black text-[#C79A4A] mb-4">
                Perdão
              </h3>

              <p className="text-gray-400 leading-relaxed">
                O perdão quebra correntes, cura traumas e destrói prisões emocionais.
              </p>
            </div>

            <div className="bg-[#181818] border border-[#2A2A2A] rounded-3xl p-8">
              <h3 className="text-2xl font-black text-[#C79A4A] mb-4">
                Identidade
              </h3>

              <p className="text-gray-400 leading-relaxed">
                Você não é definido pelo que fizeram com você. Existe propósito na dor.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* O QUE DEUS QUER CURAR */}
      <section className="py-24 sm:py-28 px-4 sm:px-6 bg-[#121212]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-[#C79A4A] uppercase tracking-widest text-sm">
              O que Deus quer curar
            </span>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase mt-4 mb-6 leading-tight break-words">
              O vazio gerado pelas dores da vida.
            </h2>

            <p className="text-gray-400 text-lg max-w-3xl mx-auto leading-relaxed">
              O FORJADOS é para pessoas emocionalmente feridas que tentaram
              sobreviver longe da presença de Deus, mas ainda desejam recomeçar.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              "Rejeição",
              "Falta de amor",
              "Feridas emocionais",
              "Pecados escondidos",
              "Falta de identidade",
              "Falta de propósito",
              "Distância de Deus",
              "Prisões emocionais",
              "Falta de perdão",
            ].map((item) => (
              <div
                key={item}
                className="bg-[#181818] border border-[#2A2A2A] rounded-2xl p-5 text-center"
              >
                <p className="text-xl font-bold text-white">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* OBJETIVO ESPIRITUAL */}
      <section className="py-24 sm:py-28 px-4 sm:px-6 bg-[#0F0F10]">
        <div className="max-w-5xl mx-auto text-center">
          <span className="text-[#C79A4A] uppercase tracking-widest text-sm">
            Objetivo espiritual
          </span>

          <h2 className="text-3xl sm:text-4xl md:text-6xl font-black uppercase mt-4 mb-8 leading-tight break-words">
            O fogo não é destruição.
            <span className="block text-[#C79A4A]">
              É purificação.
            </span>
          </h2>

          <p className="text-gray-300 text-lg sm:text-xl leading-relaxed mb-8">
            A mensagem central do FORJADOS é que Deus usa o fogo da vida para
            formar pessoas capazes de amar. O processo não veio para destruir sua
            identidade, mas para revelar quem você é em Cristo.
          </p>

          <div className="bg-[#181818] border border-[#2A2A2A] rounded-[32px] p-6 sm:p-8 text-left">
            <p className="text-gray-300 text-lg leading-relaxed mb-4">
              No FORJADOS, o centro não é apenas intensidade, emoção ou resistência.
              O centro é o agir do Espírito Santo.
            </p>

            <p className="text-gray-300 text-lg leading-relaxed mb-4">
              O perdão é uma das chaves principais dessa jornada. Ele vence o orgulho,
              quebra correntes, restaura a alma e reconecta pessoas com Deus.
            </p>

            <p className="text-[#C79A4A] text-xl sm:text-2xl font-black leading-tight">
              O FORJADOS não pode terminar em emoção. Precisa terminar em transformação.
            </p>
          </div>
        </div>
      </section>

      {/* FRASES */}
      <section className="py-24 px-4 sm:px-6 bg-[#121212]">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            "A dor não definiu quem eu sou.",
            "Curados para curar.",
            "Quem foi ferido pode voltar a amar.",
            "Toda cicatriz pode carregar propósito.",
          ].map((frase) => (
            <div
              key={frase}
              className="bg-black/40 border border-[#2A2A2A] rounded-3xl p-6"
            >
              <p className="text-xl font-black text-[#C79A4A] leading-tight">
                {frase}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CHAMADA FINAL */}
      <section className="py-24 sm:py-28 px-4 sm:px-6 bg-[#0F0F10]">
        <div className="max-w-4xl mx-auto text-center">
          <img
            src="/logo-forjados.png"
            alt="Logo FORJADOS"
            className="mx-auto w-full max-w-[280px] mb-8"
          />

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase mb-6 leading-tight break-words">
            A forja não era para te destruir.
            <span className="block text-[#C79A4A]">
              Era para te transformar.
            </span>
          </h2>

          <p className="text-gray-400 text-lg mb-10 leading-relaxed">
            Se existe uma área da sua vida que precisa de cura, perdão, identidade
            e restauração, esse retiro é para você.
          </p>

          <a
            href="/inscricao"
            className="inline-block bg-[#C79A4A] hover:bg-yellow-600 transition-all text-black px-8 sm:px-10 py-5 rounded-2xl font-black text-lg"
          >
            FAZER MINHA INSCRIÇÃO
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#2A2A2A] py-10 px-4 sm:px-6 bg-black">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3">
              <img
                src="/logo-forjados.png"
                alt="Logo FORJADOS"
                className="w-[55px] h-auto"
              />

              <h3 className="text-3xl font-black text-[#C79A4A] uppercase">
                FORJADOS
              </h3>
            </div>

            <p className="text-gray-500 mt-2">
              Igreja Evangélica Sal da Terra
            </p>

            <div className="flex items-center justify-center md:justify-start gap-4 mt-4">
              <a
                href="https://www.instagram.com/forjadosoficial_?igsh=cDluOW1jbG90NTli"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram FORJADOS"
                className="w-11 h-11 rounded-full border border-[#2A2A2A] hover:border-[#C79A4A] flex items-center justify-center transition-all"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#C79A4A"
                  strokeWidth="1.8"
                  className="w-5 h-5"
                >
                  <rect x="3" y="3" width="18" height="18" rx="5"></rect>
                  <circle cx="12" cy="12" r="4"></circle>
                  <circle cx="17.5" cy="6.5" r="1"></circle>
                </svg>
              </a>

              <a
                href="https://www.tiktok.com/@forjados.oficiall?_r=1&_t=ZS-96Lxhdr0HH3"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok FORJADOS"
                className="w-11 h-11 rounded-full border border-[#2A2A2A] hover:border-[#C79A4A] flex items-center justify-center transition-all"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="#C79A4A"
                  className="w-5 h-5"
                >
                  <path d="M16.5 3c.3 1.8 1.4 3.2 3 4.1v2.6c-1.2 0-2.4-.4-3.4-1v6.2c0 3-2.3 5.1-5.3 5.1S5.5 17.9 5.5 15s2.3-5.1 5.3-5.1c.2 0 .5 0 .7.1v2.7c-.2-.1-.5-.1-.7-.1-1.5 0-2.6 1-2.6 2.4s1.1 2.4 2.6 2.4 2.5-1 2.5-2.5V3h3.2z" />
                </svg>
              </a>
            </div>
          </div>

          <div className="text-gray-500 text-sm text-center md:text-right space-y-1">
  <p>forjadosoficial.com.br</p>
  <p>forjados.ofc@gmail.com</p>

  <div className="text-gray-500 text-sm text-center md:text-right space-y-1">
  <p>forjadosoficial.com.br</p>
  <p>forjados.ofc@gmail.com</p>

  <a
    href="/politica-de-privacidade"
    className="block text-[#C79A4A] hover:text-yellow-500 transition-all font-bold"
  >
    Política de Privacidade
  </a>

  <a
    href="/termo-de-ciencia"
    className="block text-[#C79A4A] hover:text-yellow-500 transition-all font-bold"
  >
    Termo de Ciência e Participação
  </a>
</div>
</div>
        </div>
      </footer>
    </main>
  );
}