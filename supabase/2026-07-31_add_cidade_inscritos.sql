-- Adiciona a cidade à ficha de inscrição do FORJADOS.
-- Execute uma única vez no SQL Editor do Supabase.

alter table public.inscritos
add column if not exists cidade text;
