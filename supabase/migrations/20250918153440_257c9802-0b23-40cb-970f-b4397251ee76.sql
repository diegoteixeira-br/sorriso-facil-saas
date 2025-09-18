-- Adicionar campo para arquivar orçamentos quando tratamento for finalizado
ALTER TABLE public.orcamentos ADD COLUMN arquivado BOOLEAN NOT NULL DEFAULT false;

-- Adicionar índice para melhor performance
CREATE INDEX idx_orcamentos_arquivado ON public.orcamentos(arquivado);