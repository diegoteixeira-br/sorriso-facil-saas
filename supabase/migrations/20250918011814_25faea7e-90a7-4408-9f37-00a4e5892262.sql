-- Adicionar referência do orçamento ao plano de pagamento
ALTER TABLE public.planos_pagamento 
ADD COLUMN orcamento_id UUID REFERENCES public.orcamentos(id);