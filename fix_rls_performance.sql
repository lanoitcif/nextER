-- Performance optimization for RLS policies
-- Wraps auth.uid() in subqueries to prevent re-evaluation on each row
-- This can improve query performance from seconds to microseconds at scale

-- Fix user_profiles table RLS policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
CREATE POLICY "Users can view their own profile" ON public.user_profiles
  FOR SELECT USING ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
CREATE POLICY "Admins can view all profiles" ON public.user_profiles
  FOR SELECT TO authenticated
  USING (
    (SELECT access_level FROM public.user_profiles WHERE id = (SELECT auth.uid())) = 'admin'
      OR (SELECT is_admin FROM public.user_profiles WHERE id = (SELECT auth.uid())) = true
  );

DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
CREATE POLICY "Users can update their own profile" ON public.user_profiles
  FOR UPDATE USING ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Admins can update any profile" ON public.user_profiles;
CREATE POLICY "Admins can update any profile" ON public.user_profiles
  FOR UPDATE TO authenticated
  USING (
    (SELECT access_level FROM public.user_profiles WHERE id = (SELECT auth.uid())) = 'admin'
      OR (SELECT is_admin FROM public.user_profiles WHERE id = (SELECT auth.uid())) = true
  );

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;
CREATE POLICY "Users can insert their own profile" ON public.user_profiles
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Users can delete their own profile" ON public.user_profiles;
CREATE POLICY "Users can delete their own profile" ON public.user_profiles
  FOR DELETE USING ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Admins can delete any profile" ON public.user_profiles;
CREATE POLICY "Admins can delete any profile" ON public.user_profiles
  FOR DELETE TO authenticated
  USING (
    (SELECT access_level FROM public.user_profiles WHERE id = (SELECT auth.uid())) = 'admin'
      OR (SELECT is_admin FROM public.user_profiles WHERE id = (SELECT auth.uid())) = true
  );

-- Fix user_api_keys table RLS policies
DROP POLICY IF EXISTS "Users can manage their own API keys" ON public.user_api_keys;
CREATE POLICY "Users can manage their own API keys" ON public.user_api_keys
  FOR ALL USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Admins can manage all API keys" ON public.user_api_keys;
CREATE POLICY "Admins can manage all API keys" ON public.user_api_keys
  FOR ALL TO authenticated
  USING (
    (SELECT access_level FROM public.user_profiles WHERE id = (SELECT auth.uid())) = 'admin'
      OR (SELECT is_admin FROM public.user_profiles WHERE id = (SELECT auth.uid())) = true
  );

-- Fix usage_logs table RLS policies
DROP POLICY IF EXISTS "Users can view their own usage logs" ON public.usage_logs;
CREATE POLICY "Users can view their own usage logs" ON public.usage_logs
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Admins can view all usage logs" ON public.usage_logs;
CREATE POLICY "Admins can view all usage logs" ON public.usage_logs
  FOR SELECT TO authenticated
  USING (
    (SELECT access_level FROM public.user_profiles WHERE id = (SELECT auth.uid())) = 'admin'
      OR (SELECT is_admin FROM public.user_profiles WHERE id = (SELECT auth.uid())) = true
  );

-- Fix system_settings table RLS policies
DROP POLICY IF EXISTS "Admins can manage system settings" ON public.system_settings;
CREATE POLICY "Admins can manage system settings" ON public.system_settings
  FOR ALL USING (
    (SELECT access_level FROM public.user_profiles WHERE id = (SELECT auth.uid())) = 'admin'
      OR (SELECT is_admin FROM public.user_profiles WHERE id = (SELECT auth.uid())) = true
  );

-- Performance Analysis:
-- Before: auth.uid() evaluated for EACH row in the table
-- After: auth.uid() evaluated ONCE at query start and cached
-- 
-- Impact: For tables with thousands of rows, this can reduce
-- overhead from seconds to microseconds with no security impact.