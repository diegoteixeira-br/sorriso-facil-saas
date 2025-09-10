-- Criação das tabelas principais do sistema odontológico

-- Tabela de pacientes
CREATE TABLE public.pacientes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  data_nascimento DATE,
  cpf VARCHAR(14) UNIQUE,
  telefone VARCHAR(20),
  email VARCHAR(255),
  endereco TEXT,
  profissao VARCHAR(255),
  estado_civil VARCHAR(50),
  responsavel VARCHAR(255), -- Para menores de idade
  telefone_responsavel VARCHAR(20),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de procedimentos odontológicos
CREATE TABLE public.procedimentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  preco_base DECIMAL(10,2) DEFAULT 0,
  categoria VARCHAR(100), -- limpeza, canal, restauracao, implantes, ortodontia, extracao, clareamento
  tempo_estimado INTEGER DEFAULT 60, -- em minutos
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de anamnese dos pacientes  
CREATE TABLE public.anamnese (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  paciente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  pressao_arterial VARCHAR(20),
  diabetes BOOLEAN DEFAULT false,
  problemas_cardiacos BOOLEAN DEFAULT false,
  alergias TEXT,
  medicamentos_uso TEXT,
  gravidez BOOLEAN DEFAULT false,
  fumante BOOLEAN DEFAULT false,
  observacoes_medicas TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de odontograma (mapa dental)
CREATE TABLE public.odontograma (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  paciente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  dente INTEGER NOT NULL, -- número do dente (1-32)
  faces JSONB, -- faces do dente com anotações
  procedimentos_realizados TEXT[],
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(paciente_id, dente)
);

-- Tabela de orçamentos
CREATE TABLE public.orcamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  paciente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  numero_orcamento VARCHAR(20) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'pendente', -- pendente, aprovado, rejeitado
  valor_total DECIMAL(10,2) DEFAULT 0,
  desconto DECIMAL(10,2) DEFAULT 0,
  observacoes TEXT,
  validade_dias INTEGER DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Itens do orçamento
CREATE TABLE public.orcamento_itens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  orcamento_id UUID NOT NULL REFERENCES public.orcamentos(id) ON DELETE CASCADE,
  procedimento_id UUID NOT NULL REFERENCES public.procedimentos(id),
  quantidade INTEGER DEFAULT 1,
  preco_unitario DECIMAL(10,2) NOT NULL,
  dente INTEGER, -- dente específico se aplicável
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de agendamentos
CREATE TABLE public.agendamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  paciente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  data_agendamento TIMESTAMP WITH TIME ZONE NOT NULL,
  duracao_minutos INTEGER DEFAULT 60,
  procedimento VARCHAR(255),
  status VARCHAR(50) DEFAULT 'agendado', -- agendado, confirmado, realizado, cancelado
  observacoes TEXT,
  lembrete_enviado BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de pagamentos
CREATE TABLE public.pagamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  paciente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  orcamento_id UUID REFERENCES public.orcamentos(id),
  agendamento_id UUID REFERENCES public.agendamentos(id),
  valor DECIMAL(10,2) NOT NULL,
  forma_pagamento VARCHAR(50) NOT NULL, -- cartao, pix, dinheiro, boleto
  status VARCHAR(50) DEFAULT 'pendente', -- pendente, pago, vencido, cancelado
  data_vencimento DATE,
  data_pagamento TIMESTAMP WITH TIME ZONE,
  asaas_payment_id VARCHAR(255), -- ID do pagamento no Asaas
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inserção de procedimentos básicos
INSERT INTO public.procedimentos (nome, descricao, preco_base, categoria) VALUES
('Limpeza (Profilaxia)', 'Limpeza dental completa com remoção de tártaro', 80.00, 'limpeza'),
('Restauração Resina', 'Restauração com resina composta', 120.00, 'restauracao'),
('Tratamento de Canal', 'Endodontia completa', 400.00, 'canal'),
('Extração Simples', 'Extração dental simples', 100.00, 'extracao'),
('Extração Complexa', 'Extração dental complexa/cirúrgica', 200.00, 'extracao'),
('Clareamento Dental', 'Clareamento dental profissional', 300.00, 'clareamento'),
('Implante Unitário', 'Implante dental unitário', 1500.00, 'implantes'),
('Aparelho Ortodôntico', 'Instalação de aparelho ortodôntico', 800.00, 'ortodontia'),
('Manutenção Ortodôntica', 'Consulta mensal de manutenção', 80.00, 'ortodontia'),
('Coroa Dental', 'Prótese coroa unitária', 600.00, 'protese');

-- Enable Row Level Security
ALTER TABLE public.pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.procedimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anamnese ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.odontograma ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orcamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orcamento_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagamentos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (por enquanto permitindo tudo para usuários autenticados - ajustaremos depois com roles)
CREATE POLICY "Usuários autenticados podem ver pacientes" ON public.pacientes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuários autenticados podem inserir pacientes" ON public.pacientes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Usuários autenticados podem atualizar pacientes" ON public.pacientes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Usuários autenticados podem deletar pacientes" ON public.pacientes FOR DELETE TO authenticated USING (true);

CREATE POLICY "Usuários autenticados podem ver procedimentos" ON public.procedimentos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuários autenticados podem inserir procedimentos" ON public.procedimentos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Usuários autenticados podem atualizar procedimentos" ON public.procedimentos FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Usuários autenticados podem ver anamnese" ON public.anamnese FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuários autenticados podem inserir anamnese" ON public.anamnese FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Usuários autenticados podem atualizar anamnese" ON public.anamnese FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Usuários autenticados podem deletar anamnese" ON public.anamnese FOR DELETE TO authenticated USING (true);

CREATE POLICY "Usuários autenticados podem ver odontograma" ON public.odontograma FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuários autenticados podem inserir odontograma" ON public.odontograma FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Usuários autenticados podem atualizar odontograma" ON public.odontograma FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Usuários autenticados podem deletar odontograma" ON public.odontograma FOR DELETE TO authenticated USING (true);

CREATE POLICY "Usuários autenticados podem ver orçamentos" ON public.orcamentos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuários autenticados podem inserir orçamentos" ON public.orcamentos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Usuários autenticados podem atualizar orçamentos" ON public.orcamentos FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Usuários autenticados podem deletar orçamentos" ON public.orcamentos FOR DELETE TO authenticated USING (true);

CREATE POLICY "Usuários autenticados podem ver itens orçamento" ON public.orcamento_itens FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuários autenticados podem inserir itens orçamento" ON public.orcamento_itens FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Usuários autenticados podem atualizar itens orçamento" ON public.orcamento_itens FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Usuários autenticados podem deletar itens orçamento" ON public.orcamento_itens FOR DELETE TO authenticated USING (true);

CREATE POLICY "Usuários autenticados podem ver agendamentos" ON public.agendamentos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuários autenticados podem inserir agendamentos" ON public.agendamentos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Usuários autenticados podem atualizar agendamentos" ON public.agendamentos FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Usuários autenticados podem deletar agendamentos" ON public.agendamentos FOR DELETE TO authenticated USING (true);

CREATE POLICY "Usuários autenticados podem ver pagamentos" ON public.pagamentos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuários autenticados podem inserir pagamentos" ON public.pagamentos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Usuários autenticados podem atualizar pagamentos" ON public.pagamentos FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Usuários autenticados podem deletar pagamentos" ON public.pagamentos FOR DELETE TO authenticated USING (true);

-- Função para atualizar o campo updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at automaticamente
CREATE TRIGGER update_pacientes_updated_at BEFORE UPDATE ON public.pacientes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_anamnese_updated_at BEFORE UPDATE ON public.anamnese FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_odontograma_updated_at BEFORE UPDATE ON public.odontograma FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orcamentos_updated_at BEFORE UPDATE ON public.orcamentos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_agendamentos_updated_at BEFORE UPDATE ON public.agendamentos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pagamentos_updated_at BEFORE UPDATE ON public.pagamentos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();