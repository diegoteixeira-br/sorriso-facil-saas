-- Adicionar campo para taxa de juros da máquina de cartão
ALTER TABLE user_settings 
ADD COLUMN taxa_juros_cartao NUMERIC DEFAULT 2.5;