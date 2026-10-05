# Mercado Pago — FORJADOS

| Categoria | Ficha | Pagamento | Por pessoa |
| --- | --- | --- | --- |
| Participante | `/inscricao` | `/pagamento` | R$ 180,00 |
| Equipe | `/inscricaoequipe` | `/pagamentoequipe` | R$ 90,00 |

A ficha compartilhada oferece pagar ou voltar ao site após o envio. Cada pedido
cobre de 1 a 20 inscrições da mesma categoria, identificadas por CPF e e-mail.
O pagador pode ser outra pessoa. O Payment Brick oficial oferece Pix e crédito
em até 3x; juros e parcelas são apresentados pelo Mercado Pago antes de confirmar.
Registros antigos continuam como participantes. A organização deve revisar a
categoria das fichas antigas de equipe antes de cobrar.

## Ativação

A integração bloqueia cobranças até existir configuração completa. As fichas e
os valores funcionam sem credenciais. Cobranças reais e entrega de notificações
pela conta recebedora ainda precisam de homologação.

1. Em [Mercado Pago Developers](https://www.mercadopago.com.br/developers/panel/app),
   criar/selecionar a aplicação para **Checkout Bricks / Payment Brick**. Obter
   Public Key e Access Token do ambiente escolhido.
2. Em Webhooks, configurar a URL abaixo e o evento **Pagamentos** (`payment`,
   utilizado por Checkout Bricks / Payments API). Copiar a assinatura secreta
   gerada. Não selecionar somente `orders`.
3. No [Supabase — Secrets](https://supabase.com/dashboard/project/oxdskhrbfslrjakutoye/functions/secrets),
   cadastrar as variáveis da tabela. Não enviar segredos no chat nem versioná-los.
4. Começar com `MERCADO_PAGO_MODE=test`, credenciais e dados de teste compatíveis
   com a documentação da aplicação. Testar aprovação, recusa, Pix, grupos e
   entrega de Webhooks. Conferir cada ficha no `/admin`.
5. Após homologar, trocar pelas credenciais de produção correspondentes e usar
   `MERCADO_PAGO_MODE=production`. Configurar também a URL de produção no Mercado
   Pago. Para Pix, cadastrar uma chave Pix na conta recebedora.

**Webhook:**

```text
https://oxdskhrbfslrjakutoye.supabase.co/functions/v1/mercado-pago-webhook
```

| Secret do Supabase | Valor |
| --- | --- |
| `MERCADO_PAGO_PUBLIC_KEY` | Public Key do ambiente escolhido |
| `MERCADO_PAGO_ACCESS_TOKEN` | Access Token privado do mesmo ambiente |
| `MERCADO_PAGO_WEBHOOK_SECRET` | Assinatura secreta das notificações |
| `MERCADO_PAGO_MODE` | `test` inicialmente; `production` após homologação |
| `MERCADO_PAGO_ENABLED` | `true` para liberar; `false` para bloquear novas operações |

As chaves devem pertencer à mesma aplicação e ambiente. Não são necessários
segredos de pagamento na Vercel. `site-payment` fornece somente a Public Key
quando a configuração está completa. Chaves privadas nunca chegam ao navegador.

## Conciliação e administrador

O Webhook verifica a assinatura com o SDK oficial, consulta `/v1/payments/{id}`
e valida recebedor, BRL, valor, referência, ambiente e meio de pagamento.
Somente `approved` marca todas as inscrições vinculadas como `pago`. Pix gerado,
cartão autorizado ou pagamento em análise ainda não confirmam quitação.
Reembolso total/parcial e contestação marcam as fichas como `estornado`, para
revisão da organização. Notificações antigas/repetidas não desfazem aprovações.

O painel separa categorias, mostra o ID do Mercado Pago e consulta fichas a cada
15 segundos enquanto estiver visível. O Webhook funciona mesmo depois de o
pagador fechar o site. A consulta da página pública também recupera notificações
perdidas consultando o provedor. Ajustes manuais no admin continuam disponíveis;
uma conciliação posterior aplica o status oficial de um pagamento vinculado.

## Proteções e operação

- Preços fixados no servidor e banco; o valor enviado pelo navegador é ignorado.
- Reservas transacionais e índice único impedem duas cobranças ativas da mesma
  inscrição. Sessões não enviadas expiram em 15 minutos e podem ser alteradas.
  Pix vence em 1 hora. Pedidos enviados só são liberados pelo resultado do
  provedor, nunca por um relógio local.
- Uma chave de idempotência por pedido e o corpo original persistido permitem
  repetir uma chamada cujo resultado foi perdido. Token efêmero de cartão é
  removido após conciliação; número e CVV ficam no formulário oficial.
- Se o resultado for desconhecido, consultar/repetir a mesma sessão. Não liberar
  uma reserva em processamento sem antes consultar o Mercado Pago.
- `localStorage` guarda somente a capacidade aleatória do pedido, sem CPF/e-mail.
  O preenchimento vindo da ficha usa `sessionStorage` temporário, removido ao
  abrir o pagamento. Quem compartilha o dispositivo deve considerar esse acesso.
- Pedidos e segredos têm RLS e acesso exclusivo ao servidor. RPCs não podem ser
  executadas por `anon`/`authenticated`. O admin mantém sua autorização existente.
  Os endpoints públicos usam identificação e limite de tentativas, capacidade de
  pedido ou assinatura do Webhook como autenticação específica.
- CPF/e-mail normalizados são únicos para impedir duplicidade na inscrição.
- A ficha de equipe é pública conforme solicitado. A organização deve distribuir
  seu link aos integrantes e revisar categoria; não é um sistema de aprovação de
  equipe ou controle de vagas.

## Testes

`npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build` e `deno check`
validam código e regras sem cobrar. `supabase/tests/site_payments.sql` verifica
preços, lotes, categoria, concorrência, idempotência, até 3x, aprovação, notificações
antigas/repetidas, estorno, liberação e privilégios. Executar o script inteiro:
fixtures e notificações de cadastro enfileiradas são revertidas por `ROLLBACK`.
A conta recebedora ainda precisa passar por testes completos com dados oficiais
antes de liberar pagamentos reais.

## Documentação oficial

- [Payment Brick](https://www.mercadopago.com.br/developers/pt/docs/checkout-bricks/payment-brick/introduction)
- [Webhooks](https://www.mercadopago.com.br/developers/pt/docs/checkout-bricks/additional-content/your-integrations/notifications/webhooks)
- [Secrets das Edge Functions](https://supabase.com/docs/guides/functions/secrets)
