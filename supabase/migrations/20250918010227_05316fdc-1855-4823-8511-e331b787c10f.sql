-- Adicionar campo de data de vencimento da primeira parcela nos planos de pagamento
ALTER TABLE public.planos_pagamento 
ADD COLUMN data_vencimento_primeira_parcela DATE;

-- Adicionar campo para identificar se as parcelas já foram geradas
ALTER TABLE public.planos_pagamento 
ADD COLUMN parcelas_geradas BOOLEAN DEFAULT FALSE;

-- Adicionar índice para melhor performance nas consultas de parcelas
CREATE INDEX IF NOT EXISTS idx_pagamentos_plano_parcela 
ON public.pagamentos(plano_pagamento, parcela_numero) 
WHERE plano_pagamento = TRUE;

-- Adicionar campo para referenciar o plano de pagamento nas parcelas
ALTER TABLE public.pagamentos 
ADD COLUMN plano_pagamento_id UUID REFERENCES public.planos_pagamento(id);

-- Função para gerar parcelas automaticamente
CREATE OR REPLACE FUNCTION public.gerar_parcelas_plano(p_plano_id UUID)
RETURNS VOID AS $$
DECLARE
    plano RECORD;
    i INTEGER;
    data_vencimento DATE;
BEGIN
    -- Buscar dados do plano
    SELECT * INTO plano FROM public.planos_pagamento WHERE id = p_plano_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Plano de pagamento não encontrado';
    END IF;
    
    -- Verificar se já foram geradas
    IF plano.parcelas_geradas THEN
        RETURN;
    END IF;
    
    -- Gerar parcela da entrada se houver
    IF plano.valor_entrada > 0 THEN
        INSERT INTO public.pagamentos (
            paciente_id,
            user_id,
            valor,
            forma_pagamento,
            status,
            data_vencimento,
            plano_pagamento,
            plano_pagamento_id,
            parcela_numero,
            observacoes
        ) VALUES (
            plano.paciente_id,
            plano.user_id,
            plano.valor_entrada,
            plano.forma_pagamento_entrada,
            'pendente',
            plano.data_vencimento_primeira_parcela,
            TRUE,
            p_plano_id,
            0,
            'Entrada do plano de pagamento'
        );
    END IF;
    
    -- Gerar parcelas
    FOR i IN 1..plano.numero_parcelas LOOP
        -- Calcular data de vencimento (primeira parcela + i meses)
        data_vencimento := plano.data_vencimento_primeira_parcela + (i || ' month')::INTERVAL;
        
        INSERT INTO public.pagamentos (
            paciente_id,
            user_id,
            valor,
            forma_pagamento,
            status,
            data_vencimento,
            plano_pagamento,
            plano_pagamento_id,
            parcela_numero,
            observacoes
        ) VALUES (
            plano.paciente_id,
            plano.user_id,
            plano.valor_parcela,
            plano.forma_pagamento_parcelas,
            'pendente',
            data_vencimento,
            TRUE,
            p_plano_id,
            i,
            'Parcela ' || i || ' de ' || plano.numero_parcelas
        );
    END LOOP;
    
    -- Marcar como geradas
    UPDATE public.planos_pagamento 
    SET parcelas_geradas = TRUE 
    WHERE id = p_plano_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;