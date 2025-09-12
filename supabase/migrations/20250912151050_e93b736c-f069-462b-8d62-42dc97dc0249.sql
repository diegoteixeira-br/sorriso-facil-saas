-- Adicionar campos para configurações do Asaas na tabela user_settings
ALTER TABLE user_settings 
ADD COLUMN asaas_api_key TEXT,
ADD COLUMN asaas_webhook_token TEXT,
ADD COLUMN asaas_environment TEXT DEFAULT 'sandbox';