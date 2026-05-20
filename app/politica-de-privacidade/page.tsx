"use client";

export default function PoliticaDePrivacidadePage() {
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
            Política de Privacidade
          </span>

          <h1 className="text-3xl sm:text-5xl font-black uppercase leading-tight">
            Projeto FORJADOS
          </h1>

          <p className="text-gray-400 mt-4 leading-relaxed">
            Esta Política de Privacidade explica de forma clara como os dados
            pessoais dos participantes são coletados, utilizados, armazenados e
            protegidos durante a utilização do site, preenchimento da ficha de
            inscrição e participação no Projeto FORJADOS.
          </p>
        </div>

        <div className="bg-[#181818] border border-[#2A2A2A] rounded-[32px] p-6 sm:p-10 space-y-8">
          <Secao titulo="1. Quem somos">
            <p>
              O Projeto FORJADOS é uma experiência cristã de imersão espiritual,
              emocional e vivencial, vinculada à Igreja Evangélica Sal da Terra
              — IEST, voltada ao fortalecimento espiritual, amadurecimento
              cristão, restauração de vidas, desenvolvimento de responsabilidade
              pessoal e transformação através de princípios cristãos.
            </p>

            <p>
              Para fins desta Política, o Projeto FORJADOS poderá ser chamado de
              FORJADOS, projeto, organização, equipe organizadora ou nós.
            </p>
          </Secao>

          <Secao titulo="2. Quais dados coletamos">
            <p>
              Para realização da inscrição, organização do evento, comunicação
              com os participantes e segurança durante o Projeto FORJADOS,
              poderão ser coletados os seguintes dados:
            </p>

            <Lista
              itens={[
                "Nome completo;",
                "CPF;",
                "Data de nascimento;",
                "Foto de identificação;",
                "Telefone, WhatsApp e e-mail;",
                "Endereço, cidade e estado, quando informados;",
                "Igreja ou congregação;",
                "Tamanho da camisa;",
                "Comprovante de pagamento;",
                "Informações relacionadas à participação no evento;",
                "Alergias, restrições alimentares, medicamentos contínuos, condições de saúde relevantes e limitações físicas;",
                "Contato de emergência;",
                "Nome do responsável legal e documento de autorização, quando se tratar de participante menor de idade;",
                "Autorizações e aceites realizados eletronicamente no formulário;",
                "Autorização de uso de imagem, voz e depoimentos, quando concedida pelo participante.",
              ]}
            />

            <p>
              O site também poderá coletar informações técnicas básicas de
              navegação, como data e horário de acesso, endereço IP, tipo de
              navegador, dispositivo utilizado e segurança do sistema.
            </p>
          </Secao>

          <Secao titulo="3. Dados pessoais sensíveis">
            <p>
              Algumas informações fornecidas pelo participante poderão ser
              consideradas dados pessoais sensíveis, especialmente aquelas
              relacionadas à saúde, medicamentos, alergias, restrições
              alimentares e condições físicas ou emocionais.
            </p>

            <p>
              Esses dados serão utilizados exclusivamente para segurança dos
              participantes, prevenção de riscos, atendimento emergencial,
              organização adequada das atividades e cuidado básico durante o
              evento.
            </p>

            <p>
              A organização buscará limitar o acesso dessas informações apenas às
              pessoas autorizadas e diretamente envolvidas no cuidado, segurança
              e administração do projeto.
            </p>
          </Secao>

          <Secao titulo="4. Para quais finalidades utilizamos os dados">
            <Lista
              itens={[
                "Realizar e validar inscrições;",
                "Identificar participantes;",
                "Confirmar pagamentos;",
                "Organizar listas internas;",
                "Controlar acesso ao evento;",
                "Organizar alimentação, logística e estrutura;",
                "Confeccionar materiais e camisas;",
                "Prestar suporte ao participante;",
                "Entrar em contato quando necessário;",
                "Enviar informações relacionadas ao projeto;",
                "Garantir segurança durante as atividades;",
                "Acionar contatos de emergência;",
                "Registrar aceite de termos e autorizações;",
                "Cumprir obrigações legais, administrativas e de segurança;",
                "Melhorar a experiência de utilização do site e dos sistemas utilizados pelo projeto.",
              ]}
            />

            <p>
              O tratamento dos dados poderá ocorrer com base no consentimento do
              participante, cumprimento de obrigação legal, proteção da vida,
              garantia da segurança dos participantes e legítimo interesse da
              organização, nos termos da legislação aplicável.
            </p>
          </Secao>

          <Secao titulo="5. Uso de imagem, voz e depoimentos">
            <p>
              O uso de imagem, voz, vídeos, fotografias ou depoimentos do
              participante para divulgação pública do Projeto FORJADOS somente
              ocorrerá mediante autorização específica, separada e opcional.
            </p>

            <p>
              Essa autorização poderá abranger redes sociais, vídeos
              institucionais, fotografias, testemunhos, materiais de divulgação,
              apresentações e campanhas relacionadas ao projeto.
            </p>

            <p>
              A não autorização do uso de imagem não impedirá a participação do
              inscrito no evento, salvo registros internos necessários para
              identificação, segurança e organização.
            </p>
          </Secao>

          <Secao titulo="6. Compartilhamento de dados">
            <p>
              Os dados pessoais dos participantes não serão vendidos, alugados ou
              comercializados.
            </p>

            <p>
              O acesso aos dados será restrito à equipe organizadora e às
              pessoas autorizadas que necessitem dessas informações para
              organização, administração, segurança, logística, comunicação,
              suporte operacional e atendimento emergencial.
            </p>

            <p>
              Em situações necessárias, informações poderão ser compartilhadas
              com equipe de apoio, prestadores de serviço essenciais, plataformas
              tecnológicas utilizadas pelo projeto, serviços médicos ou
              emergenciais e autoridades públicas, quando houver obrigação legal
              ou necessidade de segurança.
            </p>
          </Secao>

          <Secao titulo="7. Plataformas e serviços utilizados">
            <p>
              Para funcionamento do site, armazenamento das inscrições,
              comunicação e operação do Projeto FORJADOS, poderão ser utilizadas
              plataformas e serviços digitais de terceiros, incluindo hospedagem
              de site, banco de dados, armazenamento de arquivos, autenticação,
              plataformas de pagamento, ferramentas de comunicação e sistemas
              administrativos.
            </p>

            <p>
              Entre essas ferramentas poderão estar serviços como Supabase,
              Vercel, WhatsApp, plataformas de pagamento e outras ferramentas
              necessárias para operação do projeto.
            </p>

            <p>
              Cada serviço poderá possuir suas próprias políticas de privacidade
              e segurança. Embora a organização adote medidas razoáveis de
              proteção, nenhum sistema eletrônico é totalmente livre de riscos.
            </p>
          </Secao>

          <Secao titulo="8. Armazenamento e retenção dos dados">
            <p>
              Os dados pessoais serão armazenados apenas pelo período necessário
              para cumprimento das finalidades desta Política, incluindo
              organização do projeto, segurança dos participantes, controle
              administrativo, prestação de contas, histórico organizacional e
              cumprimento de obrigações legais e regulatórias.
            </p>

            <p>
              Após o período necessário, os dados poderão ser excluídos,
              anonimizados ou mantidos apenas quando houver justificativa legal,
              administrativa ou legítima para sua conservação.
            </p>
          </Secao>

          <Secao titulo="9. Segurança dos dados">
            <p>
              A organização buscará adotar medidas razoáveis de segurança para
              proteger os dados pessoais contra acesso não autorizado, perda,
              alteração indevida, divulgação não autorizada, destruição ou uso
              inadequado.
            </p>

            <p>
              O acesso aos dados será limitado às pessoas autorizadas e
              diretamente envolvidas na administração, organização, segurança e
              operação do Projeto FORJADOS.
            </p>
          </Secao>

          <Secao titulo="10. Participação de menores de idade">
            <p>
              A participação no Projeto FORJADOS é destinada preferencialmente a
              maiores de 18 anos.
            </p>

            <p>
              Nos casos autorizados pela organização, menores de idade somente
              poderão participar mediante autorização formal do responsável legal
              e envio da documentação exigida.
            </p>

            <p>
              Os dados dos menores serão utilizados exclusivamente para fins
              relacionados à inscrição, participação, organização, segurança e
              cumprimento das responsabilidades do projeto.
            </p>
          </Secao>

          <Secao titulo="11. Cookies e dados de navegação">
            <p>
              O site poderá utilizar cookies ou tecnologias semelhantes para
              melhorar a navegação, garantir funcionamento adequado do sistema,
              realizar análises de acesso, reforçar medidas de segurança e
              armazenar preferências do usuário.
            </p>

            <p>
              O participante poderá configurar seu navegador para bloquear ou
              remover cookies, ciente de que determinadas funcionalidades do site
              poderão ser afetadas.
            </p>
          </Secao>

          <Secao titulo="12. Links externos">
            <p>
              O site poderá conter links para redes sociais, plataformas de
              pagamento, aplicativos de comunicação ou serviços externos.
            </p>

            <p>
              O Projeto FORJADOS não se responsabiliza pelas práticas de
              privacidade, conteúdo, funcionamento ou segurança de serviços
              mantidos por terceiros.
            </p>
          </Secao>

          <Secao titulo="13. Direitos do titular dos dados">
            <p>
              Nos termos da Lei Geral de Proteção de Dados Pessoais — LGPD, o
              titular dos dados poderá solicitar, quando aplicável:
            </p>

            <Lista
              itens={[
                "Confirmação da existência de tratamento de dados;",
                "Acesso aos dados pessoais;",
                "Correção de informações incompletas, inexatas ou desatualizadas;",
                "Informações sobre uso e compartilhamento de dados;",
                "Anonimização, bloqueio ou exclusão de dados;",
                "Revogação de consentimentos concedidos;",
                "Informações sobre possibilidade de não fornecer consentimento e suas consequências.",
              ]}
            />

            <p>
              As solicitações poderão ser analisadas conforme limites legais,
              operacionais e obrigações aplicáveis.
            </p>
          </Secao>

          <Secao titulo="14. Revogação do consentimento">
            <p>
              O participante poderá solicitar a revogação de consentimentos
              anteriormente concedidos, especialmente relacionados ao uso de
              imagem, voz e depoimentos.
            </p>

            <p>
              A revogação não invalidará tratamentos realizados anteriormente
              com base em consentimento válido, mas impedirá novos tratamentos
              relacionados ao consentimento revogado, quando tecnicamente e
              administrativamente possível.
            </p>
          </Secao>

          <Secao titulo="15. Canal de contato">
            <p>
              Para dúvidas, solicitações, correções ou assuntos relacionados ao
              tratamento de dados pessoais, o participante poderá entrar em
              contato através do e-mail:
            </p>

            <p className="text-[#C79A4A] font-black text-lg mt-3">
              forjados.ofc@gmail.com
            </p>
          </Secao>

          <Secao titulo="16. Alterações nesta Política">
            <p>
              Esta Política de Privacidade poderá ser atualizada periodicamente
              para refletir alterações legais, operacionais, técnicas,
              administrativas ou organizacionais.
            </p>

            <p>
              A versão mais recente estará sempre disponível nos canais oficiais
              do Projeto FORJADOS.
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
