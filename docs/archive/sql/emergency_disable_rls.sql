-- EMERGENCY: Temporarily disable RLS to restore access
-- This will allow immediate login while we debug the policies

-- Disable RLS on user_profiles temporarily
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- Disable RLS on usage_logs temporarily  
ALTER TABLE public.usage_logs DISABLE ROW LEVEL SECURITY;

-- Keep other tables enabled for now
-- ALTER TABLE public.user_api_keys DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.system_settings DISABLE ROW LEVEL SECURITY;

-- This removes the security constraint temporarily
-- IMPORTANT: Re-enable RLS after fixing the policies!