-- Adicionar coluna cargo na tabela dentistas
ALTER TABLE public.dentistas 
ADD COLUMN cargo character varying DEFAULT 'Dentista';

-- Criar tabela funcionarios
CREATE TABLE public.funcionarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  nome character varying NOT NULL,
  cargo character varying NOT NULL,
  salario numeric,
  data_admissao date,
  email character varying,
  telefone character varying,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS na tabela funcionarios
ALTER TABLE public.funcionarios ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para funcionarios
CREATE POLICY "Users can manage their own funcionarios" 
ON public.funcionarios 
FOR ALL 
USING (auth.uid() = user_id);

-- Criar tabela despesas
CREATE TABLE public.despesas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  descricao text NOT NULL,
  valor numeric NOT NULL,
  data date NOT NULL,
  categoria character varying NOT NULL,
  funcionario_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS na tabela despesas
ALTER TABLE public.despesas ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para despesas
CREATE POLICY "Users can manage their own despesas" 
ON public.despesas 
FOR ALL 
USING (auth.uid() = user_id);

-- Criar trigger para atualizar updated_at em funcionarios
CREATE TRIGGER update_funcionarios_updated_at
BEFORE UPDATE ON public.funcionarios
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Criar trigger para atualizar updated_at em despesas
CREATE TRIGGER update_despesas_updated_at
BEFORE UPDATE ON public.despesas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();