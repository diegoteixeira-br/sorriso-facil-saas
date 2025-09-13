-- Atualizar função de validação para permitir datas passadas em procedimentos realizados
CREATE OR REPLACE FUNCTION public.validate_agendamento()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Verificar se há conflito de horário (apenas para agendamentos futuros)
  IF NEW.status NOT IN ('cancelado', 'realizado') AND public.check_agendamento_conflict(
    NEW.data_agendamento,
    NEW.duracao_minutos,
    NEW.dentista_id,
    NEW.id
  ) THEN
    RAISE EXCEPTION 'Conflito de horário detectado. Já existe um agendamento para este dentista no horário especificado.';
  END IF;
  
  -- Verificar se o agendamento não é no passado (exceto para procedimentos realizados e atualizações)
  IF TG_OP = 'INSERT' AND NEW.data_agendamento < NOW() AND NEW.status NOT IN ('realizado', 'cancelado') THEN
    RAISE EXCEPTION 'Não é possível agendar consultas no passado.';
  END IF;
  
  -- Verificar se a duração é válida
  IF NEW.duracao_minutos IS NULL OR NEW.duracao_minutos <= 0 THEN
    RAISE EXCEPTION 'Duração do agendamento deve ser maior que zero.';
  END IF;
  
  RETURN NEW;
END;
$function$;