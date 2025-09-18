-- Atualizar função para gerar parcelas corretamente
-- A entrada deve ser paga no dia atual e a data de vencimento é apenas para as parcelas
CREATE OR REPLACE FUNCTION public.gerar_parcelas_plano(p_plano_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    
    -- Gerar parcela da entrada se houver (entrada é paga no dia atual)
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
            CURRENT_DATE, -- Entrada vence hoje (dia do orçamento)
            TRUE,
            p_plano_id,
            0,
            'Entrada do plano de pagamento'
        );
    END IF;
    
    -- Gerar parcelas (primeira parcela usa a data especificada)
    FOR i IN 1..plano.numero_parcelas LOOP
        -- Calcular data de vencimento 
        -- i=1: primeira parcela = data_vencimento_primeira_parcela
        -- i>1: primeira parcela + (i-1) meses
        IF i = 1 THEN
            data_vencimento := plano.data_vencimento_primeira_parcela;
        ELSE
            data_vencimento := plano.data_vencimento_primeira_parcela + ((i-1) || ' month')::INTERVAL;
        END IF;
        
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
$function$