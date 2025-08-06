INSERT INTO public.system_settings (key, value, description) 
VALUES ('live_transcription_enabled', '{"enabled": false}', 'Enable or disable the live transcription feature for non-admin users.') 
ON CONFLICT (key) DO NOTHING;