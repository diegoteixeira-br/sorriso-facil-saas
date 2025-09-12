-- Adicionar campo para taxa de juros do boleto
ALTER TABLE user_settings 
ADD COLUMN taxa_juros_boleto NUMERIC DEFAULT 1.5;