# Passos finais — Cidade e resumo no WhatsApp

O código do site já está pronto neste ZIP. Restam apenas duas alterações externas, pois dependem das suas contas do Supabase e do n8n.

## 1. Supabase: criar a coluna `cidade`

Abra **Supabase → SQL Editor → New query** e execute o conteúdo do arquivo:

`supabase/2026-07-31_add_cidade_inscritos.sql`

O comando é:

```sql
alter table public.inscritos
add column if not exists cidade text;
```

## 2. n8n: atualizar o campo `mensagem`

Abra o workflow **FORJADOS - Nova Inscrição WhatsApp** e entre no node **Edit Fields**.

Substitua o valor do campo `mensagem` por esta expressão:

```javascript
{{ `🔥 NOVA INSCRIÇÃO — FORJADOS

👤 Nome: ${$json.body.record.nome}
✨ Idade: ${$json.body.record.idade}
📱 WhatsApp: ${$json.body.record.telefone}
📍 Cidade: ${$json.body.record.cidade}
⛪ Igreja: ${$json.body.record.igreja}
👕 Camisa: ${$json.body.record.camisa}
💳 Status: ${$json.body.record.pagamento_status}

Uma nova inscrição foi recebida.
Acesse o painel administrativo para visualizar a ficha completa.` }}
```

Depois clique em **Publish** para publicar a nova versão do workflow.

## 3. Publicar o site

Substitua o projeto atual pelos arquivos deste ZIP e envie ao GitHub:

```bash
git add .
git commit -m "Adiciona cidade e ajusta notificacao de inscricao"
git push
```

A Vercel fará o deploy automaticamente.

## Alterações já feitas no código

- Campo obrigatório **Cidade** logo abaixo de **Endereço**.
- Cidade salva na tabela `inscritos`.
- Cidade exibida nos detalhes do Admin.
- Cidade incluída na busca do Admin.
- Cidade incluída nas exportações CSV.
- Remoção da antiga abertura manual de `wa.me` após finalizar a inscrição.
- Idade continua sendo calculada automaticamente pela data de nascimento e salva no banco.
