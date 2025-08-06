-- ============================================================================
-- RLS Policy Refactoring Migration
--
-- Version: 2.0.0
-- Date: August 6, 2025
--
-- Description:
-- This script refactors the Row Level Security (RLS) policies to eliminate
-- circular dependencies and improve query performance. It introduces a
-- private schema with cached security functions and simplifies all policies
-- to use these functions.
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: Create private schema and helper functions
-- ============================================================================

-- Create a schema to hold private functions
CREATE SCHEMA IF NOT EXISTS private;

-- Function to check if the current user is an admin, with caching.
CREATE OR REPLACE FUNCTION private.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_is_admin boolean;
BEGIN
  -- Check for a cached value within the current transaction
  BEGIN
    v_is_admin := current_setting('app.current_user_is_admin')::boolean;
    RETURN v_is_admin;
  EXCEPTION
    WHEN undefined_object THEN
      -- The setting is not yet defined in this transaction, so continue.
      NULL;
  END;

  -- Look up the admin status from the user_profiles table
  SELECT is_admin INTO v_is_admin
  FROM public.user_profiles
  WHERE id = auth.uid();

  -- Cache the result for the duration of the transaction.
  -- The 'true' at the end makes it transaction-local.
  PERFORM set_config('app.current_user_is_admin', COALESCE(v_is_admin, false)::text, true);

  RETURN COALESCE(v_is_admin, false);
END;
$$;

-- Function to get the user's access level, with caching.
CREATE OR REPLACE FUNCTION private.get_user_access_level()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_access_level text;
BEGIN
  -- Check for a cached value
  BEGIN
    v_access_level := current_setting('app.current_user_access_level');
    RETURN v_access_level;
  EXCEPTION
    WHEN undefined_object THEN
      NULL;
  END;

  -- Look up the access level
  SELECT access_level INTO v_access_level
  FROM public.user_profiles
  WHERE id = auth.uid();

  -- Cache the result for the transaction
  PERFORM set_config('app.current_user_access_level', COALESCE(v_access_level, 'basic'), true);

  RETURN COALESCE(v_access_level, 'basic');
END;
$$;


-- ============================================================================
-- STEP 2: Grant permissions for the new schema and functions
-- ============================================================================

GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA private TO authenticated;


-- ============================================================================
-- STEP 3: Drop old policies and create new, optimized policies
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Table: user_profiles
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admin users can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admin users can update all profiles" ON public.user_profiles;

CREATE POLICY "Users can view their own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all user profiles" ON public.user_profiles
    FOR SELECT USING (private.is_admin());

CREATE POLICY "Admins can update all user profiles" ON public.user_profiles
    FOR UPDATE USING (private.is_admin()) WITH CHECK (private.is_admin());

-- ----------------------------------------------------------------------------
-- Table: companies
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can view active companies" ON public.companies;
DROP POLICY IF EXISTS "Admin users can insert companies" ON public.companies;
DROP POLICY IF EXISTS "Admin users can update companies" ON public.companies;
DROP POLICY IF EXISTS "Admin users can delete companies" ON public.companies;

CREATE POLICY "All users can view active companies" ON public.companies
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage companies" ON public.companies
    FOR ALL USING (private.is_admin()) WITH CHECK (private.is_admin());

-- ----------------------------------------------------------------------------
-- Table: company_types
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can view active company types" ON public.company_types;
DROP POLICY IF EXISTS "Admin users can insert company types" ON public.company_types;
DROP POLICY IF EXISTS "Admin users can update company types" ON public.company_types;
DROP POLICY IF EXISTS "Admin users can delete company types" ON public.company_types;

CREATE POLICY "All users can view active company types" ON public.company_types
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage company types" ON public.company_types
    FOR ALL USING (private.is_admin()) WITH CHECK (private.is_admin());

-- ----------------------------------------------------------------------------
-- Table: user_api_keys
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own API keys" ON public.user_api_keys;
DROP POLICY IF EXISTS "Users can insert own API keys" ON public.user_api_keys;
DROP POLICY IF EXISTS "Users can update own API keys" ON public.user_api_keys;
DROP POLICY IF EXISTS "Users can delete own API keys" ON public.user_api_keys;
DROP POLICY IF EXISTS "Admin users can view all API keys" ON public.user_api_keys;
DROP POLICY IF EXISTS "Admin users can insert API keys for users" ON public.user_api_keys;
DROP POLICY IF EXISTS "Admin users can update all API keys" ON public.user_api_keys;

CREATE POLICY "Users can manage their own API keys" ON public.user_api_keys
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all API keys" ON public.user_api_keys
    FOR ALL USING (private.is_admin());

-- ----------------------------------------------------------------------------
-- Table: prompts
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can view active prompts" ON public.prompts;
DROP POLICY IF EXISTS "Admin users can manage prompts" ON public.prompts;

CREATE POLICY "All users can view active prompts" ON public.prompts
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage prompts" ON public.prompts
    FOR ALL USING (private.is_admin()) WITH CHECK (private.is_admin());

-- ----------------------------------------------------------------------------
-- Table: usage_logs
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own usage logs" ON public.usage_logs;
DROP POLICY IF EXISTS "Users can insert own usage logs" ON public.usage_logs;
DROP POLICY IF EXISTS "Admin users can view all usage logs" ON public.usage_logs;

CREATE POLICY "Users can view and insert their own usage logs" ON public.usage_logs
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all usage logs" ON public.usage_logs
    FOR SELECT USING (private.is_admin());

-- ----------------------------------------------------------------------------
-- Table: analysis_transcripts
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own transcripts" ON public.analysis_transcripts;
DROP POLICY IF EXISTS "Users can insert own transcripts" ON public.analysis_transcripts;
DROP POLICY IF EXISTS "Users can update own transcripts" ON public.analysis_transcripts;
DROP POLICY IF EXISTS "Admin users can view all transcripts" ON public.analysis_transcripts;

CREATE POLICY "Users can manage their own transcripts" ON public.analysis_transcripts
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all transcripts" ON public.analysis_transcripts
    FOR SELECT USING (private.is_admin());

-- ----------------------------------------------------------------------------
-- Table: company_prompt_assignments
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can view assignments" ON public.company_prompt_assignments;
DROP POLICY IF EXISTS "Admin users can manage assignments" ON public.company_prompt_assignments;

CREATE POLICY "All users can view assignments" ON public.company_prompt_assignments
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage assignments" ON public.company_prompt_assignments
    FOR ALL USING (private.is_admin()) WITH CHECK (private.is_admin());

-- ----------------------------------------------------------------------------
-- Table: system_settings
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can view settings" ON public.system_settings;
DROP POLICY IF EXISTS "Admin users can manage settings" ON public.system_settings;

CREATE POLICY "All users can view settings" ON public.system_settings
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage settings" ON public.system_settings
    FOR ALL USING (private.is_admin()) WITH CHECK (private.is_admin());


COMMIT;
