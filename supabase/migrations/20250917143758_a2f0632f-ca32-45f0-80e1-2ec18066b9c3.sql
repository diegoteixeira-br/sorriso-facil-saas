-- Enable real-time for profiles table
ALTER TABLE public.profiles REPLICA IDENTITY FULL;

-- Ensure the profiles table is in the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;