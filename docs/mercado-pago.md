# Páginas de pagamento FORJADOS

- `/pagamento`: participantes.
- `/pagamentoequipe`: integrantes da equipe.

As duas rotas são públicas e independem do login no aplicativo. O componente
`app/pagamento/_components/PaymentPage.tsx` reúne identidade visual, resumo,
instruções e links legais. `CheckoutPreview.tsx` contém a prévia de Pix/cartão
e o espaço reservado para o Payment Brick oficial do Mercado Pago.

## Estado atual

Layout publicado, sem cobranças. A escolha entre Pix e cartão muda apenas as
instruções. Não há geração de QR Code, coleta de cartão, envio de dados pessoais,
criação de pagamento nem confirmação financeira. O botão está desabilitado.

As variáveis `MERCADO_PAGO_PARTICIPANT_AMOUNT` e `MERCADO_PAGO_TEAM_AMOUNT`
definem apenas os valores apresentados no resumo. São lidas no servidor e
aceitam valores positivos com ponto decimal, por exemplo `135.00`. Se estiverem
vazias ou inválidas, a página mostra “A confirmar”. Alterações exigem novo deploy.
Nenhum valor anterior do site é automaticamente usado para cobrar.

## Próxima etapa de integração

1. Confirmar conta recebedora, valor de cada categoria, meios aceitos e regras
   de parcelamento. A categoria da equipe possui URL separada, mas não constitui
   controle de elegibilidade; validar o integrante no servidor antes de permitir
   uma eventual tarifa restrita.
2. Criar uma aplicação FORJADOS no painel Mercado Pago e obter as credenciais
   correspondentes à integração selecionada. Começar em ambiente de teste.
3. Configurar a Public Key para o SDK e guardar Access Token e segredo de webhook
   exclusivamente no servidor, em variáveis protegidas da Vercel. Nunca usar
   prefixo `NEXT_PUBLIC_` em um segredo nem versionar credenciais reais.
4. Criar pedidos persistentes com referência única, categoria e identidade do
   participante. Validar inscrição/equipe e fixar o preço no servidor; nunca
   aceitar preço enviado pelo navegador. Não permitir duplicação de cobranças
   aprovadas; usar chave de idempotência estável para uma mesma tentativa.
5. Integrar o Payment Brick oficial e seu envio ao servidor. Números de cartão
   e CVV devem trafegar somente pelo formulário/tokenização do provedor.
6. Implementar a notificação webhook, validar sua assinatura e consultar o
   pagamento na API do Mercado Pago antes de atualizar os registros locais.
   Associar por pedido/referência, verificando recebedor, moeda e valor esperado.
   Preparar estados de aprovação, pendência, recusa, expiração e reembolso.
7. Integrar a conciliação ao painel administrativo/app e a tela de resultado
   aos pagamentos persistidos. A inscrição não deve ser marcada como paga só
   porque o navegador mostra uma mensagem de sucesso.
8. Testar os fluxos antes de usar credenciais de produção. Para disponibilizar
   Pix, cadastrar uma chave Pix na conta Mercado Pago recebedora.

Não configurar notificações para um endpoint inexistente: a URL de webhook
será fornecida quando sua implementação estiver pronta e testada.

## Documentação oficial

- Payment Brick: https://www.mercadopago.com.br/developers/pt/docs/checkout-bricks/payment-brick/introduction
- Credenciais: https://www.mercadopago.com.br/developers/pt/docs/checkout-bricks/additional-content/your-integrations/credentials
- Requisitos de produção: https://www.mercadopago.com.br/developers/pt/docs/checkout-api-payments/integration-test/go-to-production-requirements
