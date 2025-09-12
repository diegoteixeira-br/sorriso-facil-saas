-- Add logo_url column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN logo_url TEXT;

-- Create storage bucket for clinic logos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('clinic-logos', 'clinic-logos', true);

-- Create policies for clinic logo uploads
CREATE POLICY "Users can view clinic logos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'clinic-logos');

CREATE POLICY "Users can upload their own clinic logo" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'clinic-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own clinic logo" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'clinic-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own clinic logo" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'clinic-logos' AND auth.uid()::text = (storage.foldername(name))[1]);