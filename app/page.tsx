"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const stages = [
  { number: "01", label: "Cura", detail: "Encarar o que foi escondido." },
  { number: "02", label: "Perdão", detail: "Soltar o peso que aprisiona." },
  {
    number: "03",
    label: "Identidade",
    detail: "Lembrar quem você foi chamado para ser.",
  },
  {
    number: "04",
    label: "Propósito",
    detail: "Voltar ao mundo transformado.",
  },
];

const healingPoints = [
  "Rejeição",
  "Falta de amor",
  "Feridas emocionais",
  "Pecados escondidos",
  "Falta de identidade",
  "Falta de propósito",
  "Distância de Deus",
  "Prisões emocionais",
  "Falta de perdão",
];

const statements = [
  "A dor não definiu quem eu sou.",
  "Curados para curar.",
  "Quem foi ferido pode voltar a amar.",
  "Toda cicatriz pode carregar propósito.",
];

const faqItems = [
  {
    question: "O que é o FORJADOS?",
    answer:
      "Um retiro de cura, restauração e transformação espiritual para pessoas que desejam reencontrar identidade, propósito e a presença de Deus.",
  },
  {
    question: "Para quem é o retiro?",
    answer:
      "Para pessoas que carregam dores, feridas e batalhas internas, mas ainda desejam recomeçar. O FORJADOS é um retiro misto.",
  },
  {
    question: "Qual é o valor da pré-venda?",
    answer:
      "A pré-venda está por R$135, com 25% de desconto sobre o valor de R$180, por tempo limitado. O comprovante de pagamento é anexado durante a inscrição.",
  },
  {
    question: "Quem organiza o FORJADOS?",
    answer: "O retiro é organizado pela Igreja Evangélica Sal da Terra — IEST.",
  },
];

function Logo({ priority = false }: { priority?: boolean }) {
  return (
    <span className="logo-frame">
      <Image
        src="/logo-forjados.png"
        alt="Logo FORJADOS"
        fill
        priority={priority}
        sizes="(max-width: 768px) 170px, 430px"
        className="object-contain"
      />
    </span>
  );
}

export default function Home() {
  const root = useRef<HTMLElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const context = gsap.context(() => {
      gsap.to(".page-progress", {
        scaleX: 1,
        ease: "none",
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.2,
        },
      });

      const hero = gsap.timeline({
        scrollTrigger: {
          trigger: ".hero-chapter",
          start: "top top",
          end: "bottom bottom",
          scrub: 1.1,
        },
      });

      hero
        .fromTo(
          ".hero-visual",
          { scale: 1.02, filter: "brightness(.72) contrast(1.08)" },
          {
            scale: 1.28,
            filter: "brightness(.34) contrast(1.2)",
            ease: "none",
          },
          0,
        )
        .to(".hero-kicker", { y: -70, opacity: 0, ease: "none" }, 0.08)
        .to(".line-one", { y: -90, opacity: 0, ease: "none" }, 0.16)
        .fromTo(
          ".line-two",
          { y: 90, opacity: 0 },
          { y: 0, opacity: 1, ease: "none" },
          0.27,
        )
        .to(".hero-veil", { opacity: 0.84, ease: "none" }, 0.18)
        .to(".ember-halo", { scale: 1.7, opacity: 0.62, ease: "none" }, 0.2)
        .to(".scroll-cue", { opacity: 0, y: 20, ease: "none" }, 0.05);

      gsap.to(".topbar", {
        backgroundColor: "rgba(5, 5, 5, 0.9)",
        backdropFilter: "blur(18px)",
        borderColor: "rgba(242, 232, 218, 0.14)",
        scrollTrigger: {
          trigger: ".process-chapter",
          start: "top 12%",
          end: "bottom top",
          toggleActions: "play none none reverse",
        },
      });

      const process = gsap.timeline({
        scrollTrigger: {
          trigger: ".process-chapter",
          start: "top top",
          end: "bottom bottom",
          scrub: 0.85,
        },
      });

      process
        .to(".process-line-fill", { scaleX: 1, ease: "none" }, 0)
        .to(".process-glow", { xPercent: 390, ease: "none" }, 0)
        .to(".process-intro", { opacity: 0.22, y: -30, ease: "none" }, 0.05);

      stages.forEach((_, index) => {
        const start = index * 0.22 + 0.08;
        process
          .to(
            `.stage-${index}`,
            {
              color: "#f2e8da",
              opacity: 1,
              x: 22,
              ease: "power2.out",
              duration: 0.1,
            },
            start,
          )
          .to(
            `.stage-${index} .stage-detail`,
            { opacity: 1, y: 0, ease: "power2.out", duration: 0.08 },
            start + 0.02,
          );

        if (index < stages.length - 1) {
          process.to(
            `.stage-${index}`,
            { opacity: 0.3, x: 0, duration: 0.1 },
            start + 0.16,
          );
        }
      });

      const strike = gsap.timeline({
        scrollTrigger: {
          trigger: ".strike-chapter",
          start: "top top",
          end: "bottom bottom",
          scrub: 0.95,
        },
      });

      strike
        .fromTo(
          ".strike-mask",
          { clipPath: "inset(18% 43% 18% 43% round 999px)" },
          { clipPath: "inset(0% 0% 0% 0% round 0px)", ease: "none" },
          0,
        )
        .fromTo(".strike-image", { scale: 1.42 }, { scale: 1.04, ease: "none" }, 0)
        .fromTo(
          ".strike-copy .word",
          { opacity: 0, yPercent: 115, rotateX: -80 },
          {
            opacity: 1,
            yPercent: 0,
            rotateX: 0,
            stagger: 0.035,
            ease: "power3.out",
            duration: 0.28,
          },
          0.3,
        )
        .fromTo(
          ".impact-ring",
          { scale: 0.35, opacity: 0.9 },
          { scale: 2.2, opacity: 0, ease: "power2.out", duration: 0.25 },
          0.56,
        )
        .fromTo(
          ".strike-note",
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, ease: "power2.out", duration: 0.2 },
          0.62,
        );

      gsap.fromTo(
        ".manifesto-line",
        { opacity: 0.14, x: -42 },
        {
          opacity: 1,
          x: 0,
          stagger: 0.12,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".manifesto",
            start: "top 72%",
            end: "center 52%",
            scrub: 0.8,
          },
        },
      );

      gsap.utils.toArray<HTMLElement>(".reveal-section").forEach((section) => {
        gsap.fromTo(
          section,
          { opacity: 0, y: 52 },
          {
            opacity: 1,
            y: 0,
            duration: 0.9,
            ease: "power3.out",
            scrollTrigger: {
              trigger: section,
              start: "top 84%",
              once: true,
            },
          },
        );
      });
    }, root);

    return () => context.revert();
  }, []);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  const closeMenu = () => setMenuOpen(false);

  return (
    <main ref={root} className="site-shell" id="inicio">
      <a className="skip-link" href="#conteudo">
        Ir para o conteúdo
      </a>

      <div className="page-progress" aria-hidden="true" />

      <header className="topbar" aria-label="Navegação principal">
        <a className="brand-lockup" href="#inicio" aria-label="FORJADOS — início">
          <span className="header-logo">
            <Image
              src="/logo-forjados.png"
              alt=""
              fill
              priority
              sizes="130px"
              className="object-contain object-left"
            />
          </span>
          <span className="brand-name">FORJADOS</span>
        </a>

        <nav className="desktop-nav" aria-label="Seções da página">
          <a href="#inicio">Início</a>
          <a href="#sobre">Sobre</a>
          <a href="#informacoes">Informações</a>
          <Link href="/inscricao">Inscrição</Link>
        </nav>

        <Link className="header-cta" href="/inscricao">Inscreva-se</Link>

        <button
          type="button"
          className="mobile-menu-button"
          aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span />
          <span />
        </button>

        <nav
          id="mobile-navigation"
          className={`mobile-navigation ${menuOpen ? "is-open" : ""}`}
          aria-label="Navegação móvel"
        >
          <a href="#inicio" onClick={closeMenu}>Início</a>
          <a href="#sobre" onClick={closeMenu}>Sobre</a>
          <a href="#informacoes" onClick={closeMenu}>Informações</a>
          <Link href="/inscricao" onClick={closeMenu}>Inscrição</Link>
          <Link className="mobile-cta" href="/inscricao" onClick={closeMenu}>Inscreva-se</Link>
        </nav>
      </header>

      <section className="hero-chapter" aria-labelledby="hero-title">
        <div className="hero-stage">
          <div className="hero-visual" aria-hidden="true">
            <Image
              src="/forjados/home/forjados-forge.webp"
              alt=""
              fill
              priority
              sizes="100vw"
              className="cinematic-image"
            />
          </div>
          <div className="hero-veil" aria-hidden="true" />
          <div className="ember-halo" aria-hidden="true" />

          <div className="hero-copy">
            <p className="eyebrow hero-kicker">Uma experiência FORJADOS</p>
            <h1 id="hero-title" className="hero-title">
              <span className="line line-one">A forja não era para te destruir.</span>
              <span className="line line-two">Era para te transformar.</span>
            </h1>
          </div>

          <div className="scroll-cue" aria-hidden="true">
            <span>Role para entrar</span>
            <span className="scroll-arrow">↓</span>
          </div>

          <div className="chapter-index" aria-hidden="true">
            <span>01</span><i /><span>04</span>
          </div>
        </div>
      </section>

      <div id="conteudo">
        <section className="process-chapter" aria-labelledby="process-title">
          <div className="process-stage">
            <div className="process-header process-intro">
              <p className="eyebrow">O processo</p>
              <h2 id="process-title">Antes do fogo,<br />existe a matéria bruta.</h2>
            </div>

            <div className="process-list">
              {stages.map((stage, index) => (
                <article className={`stage-word stage-${index}`} key={stage.label}>
                  <span className="stage-number">{stage.number}</span>
                  <h3>{stage.label}</h3>
                  <p className="stage-detail">{stage.detail}</p>
                </article>
              ))}
            </div>

            <div className="process-track" aria-hidden="true">
              <div className="process-line-fill" />
              <div className="process-glow" />
            </div>

            <p className="process-caption">Não é uma sequência de telas.<br />É uma travessia.</p>
          </div>
        </section>

        <section id="informacoes" className="scroll-section bg-[#0F0F10] px-4 py-24 sm:px-6 sm:py-32">
          <div className="reveal-section mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-2 lg:gap-20">
            <div>
              <span className="inline-block rounded-full border border-[#C79A4A] px-4 py-2 text-sm uppercase tracking-[0.24em] text-[#C79A4A]">Pré-venda</span>

              <div className="relative my-8 h-36 w-full max-w-[430px] sm:h-44"><Logo priority /></div>

              <h2 className="mb-6 text-3xl font-black uppercase leading-tight sm:text-4xl md:text-6xl">
                A forja não era para te destruir.
                <span className="block text-[#C79A4A]">Era para te transformar.</span>
              </h2>

              <p className="mb-8 max-w-xl text-base leading-relaxed text-gray-300 sm:text-lg">
                O FORJADOS é um retiro de cura, restauração e transformação espiritual
                para pessoas que carregam dores, feridas e batalhas internas — mas
                desejam reencontrar identidade, propósito e a presença de Deus.
              </p>

              <div className="border-l-4 border-[#C79A4A] pl-5">
                <p className="text-xl font-bold leading-relaxed text-white sm:text-2xl">
                  “Eu não sou vítima do meu passado.
                  <span className="block text-[#C79A4A]">Sou testemunho da graça de Deus.”</span>
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-8 rounded-full bg-red-700/20 blur-3xl" aria-hidden="true" />
              <div className="relative rounded-[32px] border border-[#2A2A2A] bg-[#181818]/95 p-5 shadow-2xl sm:p-8">
                <h2 className="mb-4 text-3xl font-black uppercase leading-tight sm:text-4xl">Inscrições abertas</h2>
                <p className="mb-6 leading-relaxed text-gray-400">
                  Pré-venda disponível por tempo limitado. Garanta sua participação
                  nessa experiência de cura, perdão e restauração.
                </p>

                <div className="space-y-4">
                  <div className="rounded-2xl border border-[#2A2A2A] bg-black/40 p-5">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="text-gray-400">Valor da pré-venda</p>
                      <span className="rounded-full bg-[#B71C1C] px-3 py-1 text-xs font-black text-white">25% OFF</span>
                    </div>
                    <div className="mb-2 flex items-end gap-3">
                      <span className="text-2xl font-black text-gray-500 line-through">R$180</span>
                      <h3 className="text-5xl font-black leading-none text-[#C79A4A]">R$135</h3>
                    </div>
                    <p className="mt-2 text-gray-500">Pré-venda por tempo limitado. Pagamento com comprovante anexado na inscrição.</p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-[#2A2A2A] bg-[#111111] p-5">
                      <p className="text-sm text-gray-400">Modalidade</p><h3 className="mt-2 text-xl font-bold">Retiro Misto</h3>
                    </div>
                    <div className="rounded-2xl border border-[#2A2A2A] bg-[#111111] p-5">
                      <p className="text-sm text-gray-400">Organização</p><h3 className="mt-2 text-xl font-bold">IEST</h3>
                    </div>
                  </div>

                  <Link href="/inscricao" className="block w-full rounded-2xl bg-[#C79A4A] py-4 text-center text-lg font-black text-black transition-colors hover:bg-[#E0B561] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F39A4B]">INSCREVER AGORA</Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="sobre" className="scroll-section bg-[#121212] px-4 py-24 sm:px-6 sm:py-28">
          <div className="reveal-section mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <span className="text-sm uppercase tracking-[0.24em] text-[#C79A4A]">Quem somos</span>
              <h2 className="mb-8 mt-4 text-3xl font-black uppercase leading-tight sm:text-4xl md:text-5xl">O FORJADOS não é sobre pessoas fortes.</h2>
              <p className="mb-6 text-lg leading-relaxed text-gray-300">É sobre pessoas que foram quebradas... e encontraram cura em Deus.</p>
              <p className="mb-6 text-lg leading-relaxed text-gray-300">
                Pessoas marcadas pela vida, mas restauradas pelo amor do Pai.
                Pessoas que venceram batalhas internas, escolheram perdoar e decidiram não transmitir sua dor.
              </p>
              <p className="text-2xl font-black leading-relaxed text-[#C79A4A]">Forjados pelo fogo. Guiados pelo Espírito.</p>
            </div>

            <div className="rounded-[32px] border border-[#2A2A2A] bg-[#181818] p-6 sm:p-8">
              <p className="mb-6 text-2xl font-black leading-tight sm:text-3xl md:text-4xl">“O fogo não me destruiu.<span className="block text-[#C79A4A]">Me forjou.”</span></p>
              <p className="leading-relaxed text-gray-400">
                O FORJADOS existe para lembrar que a dor não precisa ser o fim da história.
                Em Deus, feridas podem se tornar testemunhos, cicatrizes podem carregar propósito e corações quebrados podem voltar a amar.
              </p>
            </div>
          </div>
        </section>

        <section className="scroll-section bg-[#0F0F10] px-4 py-24 sm:px-6 sm:py-28">
          <div className="reveal-section mx-auto max-w-6xl">
            <div className="mb-16 text-center">
              <span className="text-sm uppercase tracking-[0.24em] text-[#C79A4A]">DNA do FORJADOS</span>
              <h2 className="mb-6 mt-4 text-3xl font-black uppercase leading-tight sm:text-4xl md:text-5xl">Marcados pela vida. Restaurados pelo amor de Deus.</h2>
              <p className="mx-auto max-w-3xl text-lg leading-relaxed text-gray-400">
                Um forjado é alguém que encontrou identidade em Cristo, escolheu
                perdoar, venceu batalhas internas e agora carrega luz onde antes havia feridas.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <article className="cinematic-card"><h3>Cura</h3><p>A presença de Deus restaura o que a vida tentou destruir.</p></article>
              <article className="cinematic-card"><h3>Perdão</h3><p>O perdão quebra correntes, cura traumas e destrói prisões emocionais.</p></article>
              <article className="cinematic-card"><h3>Identidade</h3><p>Você não é definido pelo que fizeram com você. Existe propósito na dor.</p></article>
            </div>
          </div>
        </section>

        <section className="scroll-section bg-[#121212] px-4 py-24 sm:px-6 sm:py-28">
          <div className="reveal-section mx-auto max-w-6xl">
            <div className="mb-16 text-center">
              <span className="text-sm uppercase tracking-[0.24em] text-[#C79A4A]">O que Deus quer curar</span>
              <h2 className="mb-6 mt-4 text-3xl font-black uppercase leading-tight sm:text-4xl md:text-5xl">O vazio gerado pelas dores da vida.</h2>
              <p className="mx-auto max-w-3xl text-lg leading-relaxed text-gray-400">
                O FORJADOS é para pessoas emocionalmente feridas que tentaram sobreviver longe da presença de Deus, mas ainda desejam recomeçar.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {healingPoints.map((item) => (
                <div key={item} className="rounded-2xl border border-[#2A2A2A] bg-[#181818] p-5 text-center"><p className="text-xl font-bold text-white">{item}</p></div>
              ))}
            </div>
          </div>
        </section>

        <section className="scroll-section bg-[#0F0F10] px-4 py-24 sm:px-6 sm:py-28">
          <div className="reveal-section mx-auto max-w-5xl text-center">
            <span className="text-sm uppercase tracking-[0.24em] text-[#C79A4A]">Objetivo espiritual</span>
            <h2 className="mb-8 mt-4 text-3xl font-black uppercase leading-tight sm:text-4xl md:text-6xl">O fogo não é destruição.<span className="block text-[#C79A4A]">É purificação.</span></h2>
            <p className="mb-8 text-lg leading-relaxed text-gray-300 sm:text-xl">
              A mensagem central do FORJADOS é que Deus usa o fogo da vida para formar pessoas capazes de amar.
              O processo não veio para destruir sua identidade, mas para revelar quem você é em Cristo.
            </p>
            <div className="rounded-[32px] border border-[#2A2A2A] bg-[#181818] p-6 text-left sm:p-8">
              <p className="mb-4 text-lg leading-relaxed text-gray-300">No FORJADOS, o centro não é apenas intensidade, emoção ou resistência. O centro é o agir do Espírito Santo.</p>
              <p className="mb-4 text-lg leading-relaxed text-gray-300">O perdão é uma das chaves principais dessa jornada. Ele vence o orgulho, quebra correntes, restaura a alma e reconecta pessoas com Deus.</p>
              <p className="text-xl font-black leading-tight text-[#C79A4A] sm:text-2xl">O FORJADOS não pode terminar em emoção. Precisa terminar em transformação.</p>
            </div>
          </div>
        </section>

        <section className="strike-chapter" aria-labelledby="strike-title">
          <div className="strike-stage">
            <div className="strike-mask">
              <div className="strike-image" aria-hidden="true">
                <Image src="/forjados/home/forjados-forge.webp" alt="" fill sizes="100vw" className="cinematic-image" />
              </div>
              <div className="strike-shade" aria-hidden="true" />
            </div>
            <div className="impact-ring" aria-hidden="true" />
            <h2 className="strike-copy" id="strike-title">
              <span className="word">Todo</span><span className="word">metal</span><span className="word warm">resiste.</span>
              <span className="word">Até</span><span className="word">encontrar</span><span className="word">o fogo</span><span className="word warm">certo.</span>
            </h2>
            <p className="strike-note">O que parecia pressão era preparação.</p>
          </div>
        </section>

        <section className="manifesto" aria-label="Manifesto FORJADOS">
          <div className="manifesto-kicker"><span>Depois do impacto</span><span>vem a forma</span></div>
          <div className="manifesto-copy">
            <p className="manifesto-line">Força não é ausência de marcas.</p>
            <p className="manifesto-line">É saber o que elas</p>
            <p className="manifesto-line accent-line">forjaram em você.</p>
          </div>
          <div className="manifesto-grid" aria-hidden="true">
            <div><span>01</span><i /></div><div><span>02</span><i /></div><div><span>03</span><i /></div>
          </div>
        </section>

        <section className="scroll-section bg-[#121212] px-4 py-24 sm:px-6">
          <div className="reveal-section mx-auto grid max-w-6xl gap-5 md:grid-cols-2 lg:grid-cols-4">
            {statements.map((statement) => (
              <div key={statement} className="rounded-3xl border border-[#2A2A2A] bg-black/40 p-6"><p className="text-xl font-black leading-tight text-[#C79A4A]">{statement}</p></div>
            ))}
          </div>
        </section>

        <section className="scroll-section bg-[#0B0B0B] px-4 py-24 sm:px-6 sm:py-28" aria-labelledby="faq-title">
          <div className="reveal-section mx-auto max-w-4xl">
            <div className="mb-12 text-center">
              <span className="text-sm uppercase tracking-[0.24em] text-[#C79A4A]">Dúvidas frequentes</span>
              <h2 id="faq-title" className="mt-4 text-3xl font-black uppercase sm:text-4xl md:text-5xl">Antes de atravessar a forja</h2>
            </div>
            <div className="space-y-3">
              {faqItems.map((item) => (
                <details key={item.question} className="faq-item"><summary>{item.question}</summary><p>{item.answer}</p></details>
              ))}
            </div>
          </div>
        </section>

        <section className="final-chapter" aria-labelledby="final-title">
          <div className="final-noise" aria-hidden="true" />
          <div className="reveal-section final-mark">
            <div className="relative mx-auto mb-8 h-32 w-full max-w-[280px] sm:h-40"><Logo /></div>
            <p className="eyebrow">Sua jornada pode começar aqui</p>
            <h2 id="final-title">A forja não era para te destruir.<span>Era para te transformar.</span></h2>
            <p className="final-description">Se existe uma área da sua vida que precisa de cura, perdão, identidade e restauração, esse retiro é para você.</p>
            <Link className="final-cta" href="/inscricao">FAZER MINHA INSCRIÇÃO</Link>
          </div>
        </section>

        <footer className="official-footer">
          <div className="footer-brand">
            <span className="footer-logo"><Image src="/logo-forjados.png" alt="" fill sizes="55px" className="object-contain" /></span>
            <h2>FORJADOS</h2>
          </div>
          <p>Igreja Evangélica Sal da Terra</p>
          <div className="social-links">
            <a href="https://www.instagram.com/forjadosoficial_?igsh=cDluOW1jbG90NTli" target="_blank" rel="noopener noreferrer" aria-label="Instagram FORJADOS">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" /></svg>
            </a>
            <a href="https://www.tiktok.com/@forjados.oficiall?_r=1&_t=ZS-96Lxhdr0HH3" target="_blank" rel="noopener noreferrer" aria-label="TikTok FORJADOS">
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16.5 3c.3 1.8 1.4 3.2 3 4.1v2.6c-1.2 0-2.4-.4-3.4-1v6.2c0 3-2.3 5.1-5.3 5.1S5.5 17.9 5.5 15s2.3-5.1 5.3-5.1c.2 0 .5 0 .7.1v2.7c-.2-.1-.5-.1-.7-.1-1.5 0-2.6 1-2.6 2.4s1.1 2.4 2.6 2.4 2.5-1 2.5-2.5V3h3.2z" /></svg>
            </a>
          </div>
          <div className="footer-contact"><span>forjadosoficial.com.br</span><a href="mailto:forjados.ofc@gmail.com">forjados.ofc@gmail.com</a></div>
          <div className="legal-links"><Link href="/politica-de-privacidade">Política de Privacidade</Link><Link href="/termo-de-ciencia">Termo de Ciência e Participação</Link></div>
        </footer>
      </div>
    </main>
  );
}
