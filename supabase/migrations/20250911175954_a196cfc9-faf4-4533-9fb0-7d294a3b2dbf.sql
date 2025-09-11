-- Create dentistas table
CREATE TABLE public.dentistas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR NOT NULL,
  cro VARCHAR NOT NULL UNIQUE,
  especialidade VARCHAR,
  email VARCHAR UNIQUE,
  telefone VARCHAR,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on dentistas table
ALTER TABLE public.dentistas ENABLE ROW LEVEL SECURITY;

-- Create policies for dentistas
CREATE POLICY "Users can manage their own dentistas" 
ON public.dentistas 
FOR ALL 
USING (auth.uid() = user_id);

-- Add dentista_id column to agendamentos table
ALTER TABLE public.agendamentos 
ADD COLUMN dentista_id UUID REFERENCES public.dentistas(id);

-- Create google_integrations table
CREATE TABLE public.google_integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on google_integrations table
ALTER TABLE public.google_integrations ENABLE ROW LEVEL SECURITY;

-- Create policies for google_integrations
CREATE POLICY "Users can manage their own google integrations" 
ON public.google_integrations 
FOR ALL 
USING (auth.uid() = user_id);

-- Add trigger for updated_at on dentistas
CREATE TRIGGER update_dentistas_updated_at
BEFORE UPDATE ON public.dentistas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add trigger for updated_at on google_integrations
CREATE TRIGGER update_google_integrations_updated_at
BEFORE UPDATE ON public.google_integrations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();