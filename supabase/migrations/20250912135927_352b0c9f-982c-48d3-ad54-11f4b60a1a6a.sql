-- Função para verificar conflitos de horários
CREATE OR REPLACE FUNCTION public.check_agendamento_conflict(
  p_data_agendamento timestamp with time zone,
  p_duracao_minutos integer,
  p_dentista_id uuid,
  p_agendamento_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  conflict_count integer;
  data_fim timestamp with time zone;
BEGIN
  -- Calcular data de fim do agendamento
  data_fim := p_data_agendamento + (p_duracao_minutos || ' minutes')::interval;
  
  -- Verificar se há conflitos (sobreposição de horários)
  SELECT COUNT(*)
  INTO conflict_count
  FROM agendamentos a
  WHERE a.dentista_id = p_dentista_id
    AND a.status NOT IN ('cancelado')
    AND (p_agendamento_id IS NULL OR a.id != p_agendamento_id)
    AND (
      -- Novo agendamento inicia durante outro agendamento existente
      (p_data_agendamento >= a.data_agendamento 
       AND p_data_agendamento < a.data_agendamento + (a.duracao_minutos || ' minutes')::interval)
      OR
      -- Novo agendamento termina durante outro agendamento existente  
      (data_fim > a.data_agendamento 
       AND data_fim <= a.data_agendamento + (a.duracao_minutos || ' minutes')::interval)
      OR
      -- Novo agendamento engloba completamente outro agendamento
      (p_data_agendamento <= a.data_agendamento 
       AND data_fim >= a.data_agendamento + (a.duracao_minutos || ' minutes')::interval)
    );
    
  RETURN conflict_count > 0;
END;
$$;

-- Função para validar agendamento antes de inserir/atualizar
CREATE OR REPLACE FUNCTION public.validate_agendamento()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar se há conflito de horário
  IF NEW.status != 'cancelado' AND public.check_agendamento_conflict(
    NEW.data_agendamento,
    NEW.duracao_minutos,
    NEW.dentista_id,
    NEW.id
  ) THEN
    RAISE EXCEPTION 'Conflito de horário detectado. Já existe um agendamento para este dentista no horário especificado.';
  END IF;
  
  -- Verificar se o agendamento não é no passado (exceto para atualizações de status)
  IF TG_OP = 'INSERT' AND NEW.data_agendamento < NOW() THEN
    RAISE EXCEPTION 'Não é possível agendar consultas no passado.';
  END IF;
  
  -- Verificar se a duração é válida
  IF NEW.duracao_minutos IS NULL OR NEW.duracao_minutos <= 0 THEN
    RAISE EXCEPTION 'Duração do agendamento deve ser maior que zero.';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger para validar agendamentos
DROP TRIGGER IF EXISTS validate_agendamento_trigger ON agendamentos;
CREATE TRIGGER validate_agendamento_trigger
  BEFORE INSERT OR UPDATE ON agendamentos
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_agendamento();

-- Função para obter horários disponíveis para um dentista em uma data
CREATE OR REPLACE FUNCTION public.get_horarios_disponiveis(
  p_dentista_id uuid,
  p_data date,
  p_duracao_minutos integer DEFAULT 60
)
RETURNS TABLE (
  horario_inicio time,
  horario_fim time,
  disponivel boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  horario_atual time;
  horario_limite time;
  data_agendamento_check timestamp with time zone;
BEGIN
  -- Definir horário de funcionamento (8h às 18h)
  horario_atual := '08:00'::time;
  horario_limite := '18:00'::time;
  
  -- Gerar slots de 30 em 30 minutos
  WHILE horario_atual < horario_limite LOOP
    data_agendamento_check := p_data::timestamp + horario_atual;
    
    -- Verificar se o horário está disponível
    horario_inicio := horario_atual;
    horario_fim := horario_atual + (p_duracao_minutos || ' minutes')::interval;
    disponivel := NOT public.check_agendamento_conflict(
      data_agendamento_check,
      p_duracao_minutos,
      p_dentista_id
    );
    
    -- Verificar se não ultrapassa o horário de funcionamento
    IF horario_fim > horario_limite THEN
      disponivel := false;
    END IF;
    
    RETURN NEXT;
    
    -- Avançar 30 minutos
    horario_atual := horario_atual + interval '30 minutes';
  END LOOP;
  
  RETURN;
END;
$$;