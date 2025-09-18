-- Corrigir a constraint de foreign key para permitir exclusão em cascata
ALTER TABLE public.pagamentos 
DROP CONSTRAINT IF EXISTS pagamentos_plano_pagamento_id_fkey;

ALTER TABLE public.pagamentos 
ADD CONSTRAINT pagamentos_plano_pagamento_id_fkey 
FOREIGN KEY (plano_pagamento_id) 
REFERENCES public.planos_pagamento(id) 
ON DELETE CASCADE;