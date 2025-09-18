-- Adicionar campo sexo à tabela pacientes
ALTER TABLE public.pacientes ADD COLUMN IF NOT EXISTS sexo character varying;