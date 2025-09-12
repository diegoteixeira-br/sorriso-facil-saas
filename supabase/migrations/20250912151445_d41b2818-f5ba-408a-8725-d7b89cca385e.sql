-- Criar tabela para planos de pagamento
CREATE TABLE public.planos_pagamento (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  paciente_id UUID NOT NULL,
  valor_total NUMERIC NOT NULL,
  valor_entrada NUMERIC,
  forma_pagamento_entrada VARCHAR,
  forma_pagamento_parcelas VARCHAR NOT NULL,
  numero_parcelas INTEGER NOT NULL DEFAULT 1,
  valor_parcela NUMERIC NOT NULL,
  status VARCHAR DEFAULT 'ativo',
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.planos_pagamento ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own planos_pagamento" 
ON public.planos_pagamento 
FOR ALL
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_planos_pagamento_updated_at
BEFORE UPDATE ON public.planos_pagamento
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();