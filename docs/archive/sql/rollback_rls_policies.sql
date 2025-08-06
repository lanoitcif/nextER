-- EMERGENCY ROLLBACK: Revert RLS policies to original working state
-- Run this immediately to fix 500 errors caused by RLS optimization

-- Rollback user_profiles table RLS policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
CREATE POLICY "Users can view their own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
CREATE POLICY "Admins can view all profiles" ON public.user_profiles
  FOR SELECT TO authenticated
  USING (
    (SELECT access_level FROM public.user_profiles WHERE id = auth.uid()) = 'admin'
      OR (SELECT is_admin FROM public.user_profiles WHERE id = auth.uid()) = true
  );

DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
CREATE POLICY "Users can update their own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can update any profile" ON public.user_profiles;
CREATE POLICY "Admins can update any profile" ON public.user_profiles
  FOR UPDATE TO authenticated
  USING (
    (SELECT access_level FROM public.user_profiles WHERE id = auth.uid()) = 'admin'
      OR (SELECT is_admin FROM public.user_profiles WHERE id = auth.uid()) = true
  );

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;
CREATE POLICY "Users can insert their own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can delete their own profile" ON public.user_profiles;
CREATE POLICY "Users can delete their own profile" ON public.user_profiles
  FOR DELETE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can delete any profile" ON public.user_profiles;
CREATE POLICY "Admins can delete any profile" ON public.user_profiles
  FOR DELETE TO authenticated
  USING (
    (SELECT access_level FROM public.user_profiles WHERE id = auth.uid()) = 'admin'
      OR (SELECT is_admin FROM public.user_profiles WHERE id = auth.uid()) = true
  );

-- Rollback user_api_keys table RLS policies
DROP POLICY IF EXISTS "Users can manage their own API keys" ON public.user_api_keys;
CREATE POLICY "Users can manage their own API keys" ON public.user_api_keys
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all API keys" ON public.user_api_keys;
CREATE POLICY "Admins can manage all API keys" ON public.user_api_keys
  FOR ALL TO authenticated
  USING (
    (SELECT access_level FROM public.user_profiles WHERE id = auth.uid()) = 'admin'
      OR (SELECT is_admin FROM public.user_profiles WHERE id = auth.uid()) = true
  );

-- Rollback usage_logs table RLS policies
DROP POLICY IF EXISTS "Users can view their own usage logs" ON public.usage_logs;
CREATE POLICY "Users can view their own usage logs" ON public.usage_logs
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all usage logs" ON public.usage_logs;
CREATE POLICY "Admins can view all usage logs" ON public.usage_logs
  FOR SELECT TO authenticated
  USING (
    (SELECT access_level FROM public.user_profiles WHERE id = auth.uid()) = 'admin'
      OR (SELECT is_admin FROM public.user_profiles WHERE id = auth.uid()) = true
  );

-- Rollback system_settings table RLS policies
DROP POLICY IF EXISTS "Admins can manage system settings" ON public.system_settings;
CREATE POLICY "Admins can manage system settings" ON public.system_settings
  FOR ALL USING (
    (SELECT access_level FROM public.user_profiles WHERE id = auth.uid()) = 'admin'
      OR (SELECT is_admin FROM public.user_profiles WHERE id = auth.uid()) = true
  );

-- This restores the original working RLS policies
-- The performance optimization can be attempted again later with proper testing