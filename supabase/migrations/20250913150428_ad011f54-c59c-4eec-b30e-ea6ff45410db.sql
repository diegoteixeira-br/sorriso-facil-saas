-- Adicionar campo categoria na tabela paciente_arquivos
ALTER TABLE public.paciente_arquivos 
ADD COLUMN categoria TEXT NOT NULL DEFAULT 'raio-x' CHECK (categoria IN ('raio-x', 'exame-sangue', 'outro'));