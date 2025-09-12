-- Adicionar campos para planos de pagamento na tabela existente pagamentos
ALTER TABLE pagamentos 
ADD COLUMN plano_pagamento BOOLEAN DEFAULT FALSE,
ADD COLUMN valor_total NUMERIC,
ADD COLUMN valor_entrada NUMERIC,
ADD COLUMN forma_pagamento_entrada VARCHAR,
ADD COLUMN numero_parcelas INTEGER DEFAULT 1,
ADD COLUMN parcela_numero INTEGER DEFAULT 1;