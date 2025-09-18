-- Adicionar campos para controlar evolução do tratamento nos itens do orçamento
ALTER TABLE public.orcamento_itens ADD COLUMN realizado BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.orcamento_itens ADD COLUMN data_realizacao DATE;