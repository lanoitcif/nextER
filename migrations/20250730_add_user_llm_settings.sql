-- Add default_provider and default_model to user_profiles
ALTER TABLE public.user_profiles
ADD COLUMN default_provider TEXT,
ADD COLUMN default_model TEXT;

-- Update default LLM provider and model in system_settings
UPDATE public.system_settings
SET value = '{"provider": "google", "model": "gemini-2.5-pro"}'
WHERE key = 'default_provider';
