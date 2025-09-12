-- Criar tabela para bloqueios de agenda (férias, folgas, feriados)
CREATE TABLE public.bloqueios_agenda (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  dentista_id UUID,
  tipo VARCHAR NOT NULL CHECK (tipo IN ('ferias', 'folga', 'feriado')),
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  motivo TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT bloqueios_data_valida CHECK (data_fim >= data_inicio)
);

-- Adicionar foreign key para dentistas (opcional)
ALTER TABLE public.bloqueios_agenda 
ADD CONSTRAINT bloqueios_agenda_dentista_id_fkey 
FOREIGN KEY (dentista_id) REFERENCES public.dentistas(id) ON DELETE CASCADE;

-- Habilitar RLS
ALTER TABLE public.bloqueios_agenda ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS
CREATE POLICY "Users can manage their own bloqueios" 
ON public.bloqueios_agenda 
FOR ALL 
USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_bloqueios_agenda_updated_at
BEFORE UPDATE ON public.bloqueios_agenda
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();