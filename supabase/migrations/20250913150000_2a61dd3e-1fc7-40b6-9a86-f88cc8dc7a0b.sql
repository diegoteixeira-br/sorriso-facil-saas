-- Criar bucket para arquivos dos pacientes
INSERT INTO storage.buckets (id, name, public) VALUES ('paciente-arquivos', 'paciente-arquivos', false);

-- Criar tabela para controlar os arquivos dos pacientes
CREATE TABLE public.paciente_arquivos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  paciente_id UUID NOT NULL,
  nome_arquivo TEXT NOT NULL,
  tipo_arquivo TEXT NOT NULL,
  tamanho_arquivo BIGINT,
  storage_path TEXT NOT NULL,
  descricao TEXT,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.paciente_arquivos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para a tabela paciente_arquivos
CREATE POLICY "Users can manage their own paciente_arquivos" 
ON public.paciente_arquivos 
FOR ALL 
USING (auth.uid() = user_id);

-- Políticas para o storage bucket paciente-arquivos
CREATE POLICY "Users can view their own patient files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'paciente-arquivos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own patient files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'paciente-arquivos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own patient files" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'paciente-arquivos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own patient files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'paciente-arquivos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_paciente_arquivos_updated_at
BEFORE UPDATE ON public.paciente_arquivos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();