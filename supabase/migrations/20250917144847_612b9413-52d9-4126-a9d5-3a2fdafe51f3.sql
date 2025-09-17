-- Add slogan field to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS slogan text DEFAULT 'Seu sorriso é nossa prioridade';