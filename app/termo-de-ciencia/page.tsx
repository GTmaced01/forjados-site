"use client";

export default function TermoDeCienciaPage() {
  function voltarParaFicha() {
    window.close();
  
    setTimeout(() => {
      alert(
        "Se esta aba não fechar automaticamente, feche ela manualmente e volte para a aba da ficha. Os dados preenchidos continuam lá."
      );
    }, 300);
  }
  return (
    <main className="min-h-screen bg-[#0F0F10] text-white px-6 py-20">
      <section className="max-w-4xl mx-auto">
        <div className="mb-12 text-center">
          <img
            src="/logo-forjados.png"
            alt="Logo FORJADOS"
            className="mx-auto w-full max-w-[260px] mb-8"
          />

          <span className="inline-block border border-[#C79A4A] text-[#C79A4A] px-4 py-2 rounded-full uppercase tracking-widest text-sm mb-6">
            Termo de Ciência
          </span>

          <h1 className="text-3xl sm:text-5xl font-black uppercase leading-tight">
            Responsabilidade e Participação
          </h1>

          <p className="text-gray-400 mt-4 leading-relaxed">
            Este Termo informa o participante sobre a proposta, natureza,
            dinâmica, condições de participação, regras de segurança e
            responsabilidades relacionadas ao Projeto FORJADOS.
          </p>
        </div>

        <div className="bg-[#181818] border border-[#2A2A2A] rounded-[32px] p-6 sm:p-10 space-y-8">
          <Secao titulo="1. Sobre o Projeto FORJADOS">
            <p>
              O Projeto FORJADOS é uma experiência cristã de imersão espiritual,
              emocional e vivencial, realizada em local reservado, durante um
              período determinado, com o propósito de conduzir homens e mulheres
              a um processo de reflexão, fortalecimento, transformação de vida,
              amadurecimento espiritual, alinhamento com princípios cristãos e
              desenvolvimento de responsabilidade pessoal e espiritual.
            </p>

            <p>
              Assim como o ferro é moldado na forja através do fogo, da pressão
              e da resistência, entendemos que determinadas áreas da vida também
              precisam passar por processos de confronto, disciplina, renúncia,
              fortalecimento e restauração.
            </p>

            <div className="bg-[#0F0F10] border border-[#2A2A2A] rounded-2xl p-5">
              <p className="text-[#C79A4A] font-black">
                O FORJADOS não é um evento de entretenimento ou lazer. É um
                ambiente de processo, quebrantamento, reconstrução e
                posicionamento espiritual.
              </p>
            </div>

            <p>
              Nosso objetivo não é constranger, humilhar ou expor pessoas, mas
              proporcionar um ambiente de reflexão, crescimento, fortalecimento
              emocional e desenvolvimento espiritual à luz dos princípios
              cristãos.
            </p>
          </Secao>

          <Secao titulo="2. Nossa missão">
            <p>
              O Projeto FORJADOS tem como propósito despertar no participante um
              compromisso verdadeiro:
            </p>

            <Lista
              itens={[
                "Com Deus;",
                "Consigo mesmo;",
                "Com sua família;",
                "Com sua igreja local;",
                "Com a obra de evangelismo e missões;",
                "Com valores cristãos e princípios de responsabilidade, honra e integridade.",
              ]}
            />

            <p>
              O FORJADOS não promove divisão denominacional, não defende placas
              ministeriais e não está fundamentado em disputas doutrinárias. O
              foco é a formação de caráter cristão, maturidade espiritual,
              responsabilidade pessoal e transformação de vida.
            </p>
          </Secao>

          <Secao titulo="3. Sobre a experiência">
            <p>
              O participante declara estar ciente de que o evento poderá envolver
              etapas, ministrações, atividades e dinâmicas vivenciais que poderão
              incluir:
            </p>

            <Lista
              itens={[
                "Simulações;",
                "Ambientes de reflexão e silêncio;",
                "Pressão emocional controlada;",
                "Limitação temporária de conforto;",
                "Desafios físicos moderados;",
                "Exercícios de tomada de decisão;",
                "Confrontos comportamentais;",
                "Dinâmicas de resistência emocional;",
                "Atividades voltadas à disciplina, cooperação e posicionamento pessoal e espiritual.",
              ]}
            />

            <p>
              O Projeto FORJADOS possui como pano de fundo simbólico e reflexivo
              princípios cristãos relacionados à vigilância espiritual,
              arrependimento, responsabilidade, compromisso com Deus e
              preparação para uma vida cristã consciente e alinhada aos
              ensinamentos bíblicos.
            </p>

            <p>
              Durante determinadas atividades, membros da equipe poderão assumir
              posturas firmes, corretivas ou provocativas, sempre com finalidade
              pedagógica, reflexiva, emocional e espiritual.
            </p>

            <p>
              O participante declara compreender que poderá sentir desconforto
              físico e emocional, ser confrontado em áreas pessoais e
              espirituais, experimentar momentos de intensidade emocional,
              silêncio, reflexão e limitação temporária de conforto.
            </p>
          </Secao>

          <Secao titulo="4. Limites das dinâmicas e respeito à dignidade">
            <p>
              A organização declara que nenhuma atividade do Projeto FORJADOS
              terá por finalidade humilhar, ameaçar, agredir, ridicularizar,
              constranger publicamente, violentar emocionalmente, discriminar,
              expor indevidamente, abusar da autoridade ou violar a dignidade do
              participante.
            </p>

            <p>
              As atividades e dinâmicas serão conduzidas dentro de limites
              razoáveis de segurança, respeito, responsabilidade e cuidado.
            </p>

            <p>
              Não serão permitidas agressões físicas, ameaças reais, violência
              psicológica, humilhação pública, discriminação, abuso de autoridade
              ou qualquer prática que coloque em risco a integridade física,
              emocional, moral ou espiritual dos participantes.
            </p>
          </Secao>

          <Secao titulo="5. Condições de participação">
            <h3 className="text-xl font-black text-white">
              5.1. Condições físicas, emocionais e psicológicas
            </h3>

            <p>
              O participante declara estar em condições físicas, emocionais e
              psicológicas adequadas para participar das atividades propostas.
              Declara ainda não possuir condições médicas, psiquiátricas,
              psicológicas ou limitações físicas que possam colocar em risco sua
              integridade ou a de terceiros durante o evento.
            </p>

            <p>Não será recomendada a participação de pessoas que apresentem:</p>

            <Lista
              itens={[
                "Doenças cardíacas graves;",
                "Limitações físicas severas;",
                "Transtornos psiquiátricos descompensados;",
                "Crises severas de ansiedade;",
                "Histórico recente de surtos psicológicos;",
                "Condições incompatíveis com esforço físico moderado;",
                "Condições emocionais ou psicológicas incompatíveis com ambientes de pressão simbólica, reflexão intensa ou confronto comportamental.",
              ]}
            />

            <p>
              Caso o participante omita informações relevantes sobre sua saúde
              física, emocional ou psicológica, assumirá responsabilidade pelas
              consequências decorrentes dessa omissão.
            </p>

            <h3 className="text-xl font-black text-white mt-6">
              5.2. Gestantes
            </h3>

            <p>
              Mulheres grávidas não poderão participar do Projeto FORJADOS, em
              razão da natureza das atividades, deslocamentos, possíveis pressões
              emocionais e limitações temporárias de conforto.
            </p>

            <h3 className="text-xl font-black text-white mt-6">
              5.3. Idade mínima
            </h3>

            <p>
              A participação no Projeto FORJADOS é destinada preferencialmente a
              maiores de 18 anos.
            </p>

            <p>
              Menores de idade somente poderão participar mediante autorização
              formal do responsável legal, envio da documentação exigida e
              aprovação prévia da organização.
            </p>

            <h3 className="text-xl font-black text-white mt-6">
              5.4. Deslocamento
            </h3>

            <p>
              Os participantes não poderão se dirigir ao local do evento
              utilizando veículo próprio, salvo autorização expressa da
              organização.
            </p>

            <p>
              O deslocamento ocorrerá conforme orientação previamente informada
              pela equipe organizadora.
            </p>

            <h3 className="text-xl font-black text-white mt-6">
              5.5. Objetos proibidos
            </h3>

            <p>É terminantemente proibido portar ou levar ao evento:</p>

            <Lista
              itens={[
                "Armas de fogo;",
                "Armas brancas;",
                "Objetos cortantes ou perfurantes;",
                "Fogos de artifício;",
                "Substâncias ilícitas;",
                "Bebidas alcoólicas;",
                "Medicamentos de uso controlado sem comunicação prévia à organização;",
                "Qualquer item que represente risco à segurança coletiva.",
              ]}
            />

            <p>
              A organização poderá orientar a retirada, guarda ou descarte de
              itens incompatíveis com as regras de segurança do evento.
            </p>

            <h3 className="text-xl font-black text-white mt-6">
              5.6. Medicamentos
            </h3>

            <p>
              Participantes que façam uso de medicamentos contínuos, controlados
              ou emergenciais deverão informar previamente à organização e portar
              quantidade suficiente para todo o período do evento.
            </p>

            <p>
              O participante é responsável pelo uso correto de seus medicamentos,
              salvo situações emergenciais em que necessite de auxílio imediato.
            </p>

            <h3 className="text-xl font-black text-white mt-6">
              5.7. Desistência e cancelamento
            </h3>

            <p>
              Em caso de desistência sem aviso prévio mínimo de 7 dias antes da
              data do evento, poderá não haver devolução do valor da inscrição,
              em razão dos custos operacionais, logísticos, alimentícios,
              administrativos e estruturais previamente assumidos pela
              organização.
            </p>

            <p>
              Situações excepcionais poderão ser analisadas individualmente pela
              organização.
            </p>
          </Secao>

          <Secao titulo="6. Ciência sobre o processo">
            <p>
              O participante reconhece que o FORJADOS é um ambiente de
              transformação, amadurecimento espiritual, fortalecimento emocional
              e formação de caráter cristão.
            </p>

            <p>
              O participante declara estar ciente de que poderá ser levado a
              refletir sobre orgulho, perdão, fé, vaidade, obediência,
              relacionamentos, traumas, feridas emocionais, propósito,
              compromisso cristão, responsabilidade espiritual, vida familiar,
              chamado, renúncia e maturidade cristã.
            </p>
          </Secao>

          <Secao titulo="7. Direito de interrupção e medidas de segurança">
            <p>
              A organização poderá interromper, suspender ou encerrar a
              participação de qualquer pessoa que apresente risco físico, risco
              emocional grave, comportamento agressivo, desobediência às
              orientações da equipe, conduta desrespeitosa, tentativa de
              prejudicar a dinâmica do evento, posse de objetos proibidos, uso de
              substâncias ilícitas ou qualquer condição incompatível com a
              continuidade segura no evento.
            </p>

            <p>
              O participante também poderá comunicar à equipe caso se sinta em
              situação de risco físico, emocional ou psicológico, podendo ser
              avaliada sua permanência, pausa temporária ou retirada de
              determinada atividade.
            </p>

            <p>
              A organização compromete-se a adotar medidas razoáveis de
              segurança, orientação, prevenção e cuidado durante o evento.
            </p>
          </Secao>

          <Secao titulo="8. Atendimento emergencial">
            <p>
              Em caso de mal-estar, acidente, crise emocional, alteração de saúde
              ou qualquer situação que exija cuidado imediato, o participante
              autoriza a organização a:
            </p>

            <Lista
              itens={[
                "Acionar serviços de emergência;",
                "Comunicar o contato de emergência informado;",
                "Encaminhar o participante para atendimento médico;",
                "Prestar auxílio inicial dentro das possibilidades da equipe;",
                "Tomar providências necessárias para preservação de sua integridade física e emocional.",
              ]}
            />

            <p>
              O participante declara estar ciente de que a organização não
              substitui acompanhamento médico, psicológico, psiquiátrico ou
              profissional especializado.
            </p>
          </Secao>

          <Secao titulo="9. Confidencialidade e respeito à privacidade">
            <p>
              O participante compromete-se a respeitar a privacidade, intimidade
              e dignidade dos demais participantes.
            </p>

            <p>
              Não será permitido divulgar, expor, compartilhar, gravar ou
              comentar publicamente relatos pessoais, experiências, testemunhos
              ou situações íntimas vivenciadas por terceiros durante o Projeto
              FORJADOS sem autorização expressa.
            </p>
          </Secao>

          <Secao titulo="10. Uso de imagem, voz e depoimentos">
            <p>
              O uso de imagem, voz, vídeos, fotos ou depoimentos do participante
              para divulgação institucional do Projeto FORJADOS somente ocorrerá
              mediante autorização específica e separada.
            </p>

            <p>
              A não autorização do uso de imagem para divulgação pública não
              impedirá a participação no evento, salvo registros internos
              necessários para segurança, identificação e organização.
            </p>
          </Secao>

          <Secao titulo="11. Aceite eletrônico">
            <p>Ao marcar a opção de aceite no formulário, o participante declara que:</p>

            <Lista
              itens={[
                "Leu integralmente este Termo;",
                "Compreendeu a natureza do Projeto FORJADOS;",
                "Participa por livre e espontânea vontade;",
                "Declara estar em condições físicas, emocionais e psicológicas compatíveis com a participação;",
                "Assume responsabilidade pelas informações prestadas;",
                "Compromete-se a respeitar integralmente as orientações da equipe organizadora;",
                "Reconhece que as atividades possuem propósito espiritual, educativo, reflexivo e formativo;",
                "Está ciente de que poderá experimentar momentos de intensidade emocional, reflexão e limitação temporária de conforto;",
                "Autoriza, em caso de necessidade, o acionamento de atendimento emergencial;",
                "Compromete-se a respeitar a privacidade dos demais participantes;",
                "Concorda com as condições descritas neste Termo.",
              ]}
            />

            <p>
              A confirmação eletrônica do aceite terá validade como manifestação
              livre, informada e consciente da vontade do participante.
            </p>
          </Secao>

          <div className="border-t border-[#2A2A2A] pt-6">
            <p className="text-gray-500 text-sm">
              Última atualização: maio de 2026.
            </p>
          </div>
        </div>

        <div className="text-center mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="/"
            className="inline-block bg-[#C79A4A] hover:bg-yellow-600 transition-all text-black px-6 py-4 rounded-2xl font-black"
          >
            VOLTAR PARA O SITE
          </a>

          <button
  type="button"
  onClick={voltarParaFicha}
  className="inline-block bg-[#121212] border border-[#2A2A2A] hover:border-[#C79A4A] transition-all text-white px-6 py-4 rounded-2xl font-black"
>
  VOLTAR PARA A FICHA
</button>
        </div>
      </section>
    </main>
  );
}

function Secao({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-2xl font-black text-[#C79A4A] mb-3">{titulo}</h2>

      <div className="text-gray-300 leading-relaxed space-y-4">{children}</div>
    </section>
  );
}

function Lista({ itens }: { itens: string[] }) {
  return (
    <ul className="list-disc list-inside text-gray-300 leading-relaxed space-y-2">
      {itens.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
