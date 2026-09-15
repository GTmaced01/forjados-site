# FORJADOS Site

Site institucional e plataforma de inscrições do **FORJADOS**, retiro cristão organizado pela Igreja Evangélica Sal da Terra (IEST).

O projeto combina uma experiência visual imersiva com um fluxo de inscrição, envio de documentos e gestão administrativa.

## Visão geral

A aplicação foi desenvolvida para centralizar a apresentação do evento e reduzir processos manuais de inscrição. A página inicial utiliza animações orientadas por rolagem para contar a proposta do retiro, enquanto o fluxo seguro coleta os dados necessários e encaminha os documentos para a infraestrutura do Supabase.

## Principais funcionalidades

- landing page responsiva com narrativa visual e animações;
- informações do evento, perguntas frequentes e chamada para inscrição;
- formulário com validação de CPF, data de nascimento e campos obrigatórios;
- tratamento específico para participantes menores de idade;
- envio de foto, comprovante e autorização do responsável;
- aceite de termo de participação, política de privacidade e uso de imagem;
- fluxo de inscrição intermediado por Supabase Edge Function;
- painel administrativo autenticado;
- busca, filtros e acompanhamento do status de pagamento;
- observações administrativas e exportação de dados;
- páginas de termos e política de privacidade;
- suporte a redução de movimento e navegação responsiva.

## Tecnologias

- **Next.js 16**
- **React 19**
- **TypeScript**
- **Tailwind CSS**
- **GSAP e ScrollTrigger**
- **Supabase**
  - PostgreSQL
  - Authentication
  - Storage
  - Edge Functions
  - Row Level Security
- **Vercel**
- **GitHub Actions**

## Segurança e privacidade

O projeto contém medidas voltadas à proteção dos dados de inscrição:

- controle administrativo baseado em autenticação e autorização;
- políticas de acesso no banco de dados;
- documentos armazenados com regras de acesso específicas;
- validação de tipo e tamanho dos arquivos;
- honeypot e controles contra submissões automatizadas;
- separação entre chave pública do frontend e credenciais privadas;
- fluxo de recuperação de senha administrativa.

Variáveis prefixadas com \`NEXT_PUBLIC_\` ficam disponíveis no navegador. Por isso, apenas valores públicos devem ser utilizados nelas. Chaves secretas e credenciais com privilégios elevados nunca devem ser versionadas.

## Execução local

### Pré-requisitos

- Node.js 22 ou superior;
- npm;
- projeto Supabase configurado.

### Instalação

```bash
git clone https://github.com/GTmaced01/forjados-site.git
cd forjados-site
npm ci
cp .env.exemple .env.local
npm run dev
```

Abra \`http://localhost:3000\` no navegador.

### Variáveis de ambiente

```env
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=SUA_CHAVE_PUBLICA
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

A Edge Function de inscrição e as migrations do diretório \`supabase/\` precisam estar configuradas no projeto utilizado.

## Validação

```bash
npm run lint
npm run build
```

## Estrutura principal

```text
app/
  admin/                 painel administrativo
  inscricao/             rota pública de inscrição
  inscricao-segura/      fluxo protegido de envio
  politica-de-privacidade/
  termo-de-ciencia/
  lib/                   integração do frontend
public/                  imagens e arquivos públicos
supabase/                migrations e configuração do banco
```

## Status

Projeto em desenvolvimento ativo. A situação mais recente de build e integração pode ser consultada na aba **Actions** do GitHub.

## Autor

Desenvolvido por [Gustavo Medeiros](https://github.com/GTmaced01).

## Uso do código

Este projeto **não é open source**. O código é disponibilizado publicamente para demonstração e avaliação técnica de portfólio, sem concessão de licença para uso, modificação, redistribuição ou exploração comercial.

Contribuições externas não são aceitas no momento. Todos os direitos reservados ao autor.
