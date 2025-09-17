-- Remove Google Calendar integration columns from user_settings
ALTER TABLE public.user_settings 
DROP COLUMN IF EXISTS google_client_id,
DROP COLUMN IF EXISTS google_client_secret,
DROP COLUMN IF EXISTS google_access_token,
DROP COLUMN IF EXISTS google_refresh_token,
DROP COLUMN IF EXISTS google_calendar_enabled;