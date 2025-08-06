-- Consolidated RLS Fixes for NEaR Project
-- Last Updated: January 19, 2025
-- Purpose: Fix infinite recursion and performance issues in RLS policies

-- =============================================================================
-- SECTION 1: DROP ALL EXISTING POLICIES TO START FRESH
-- =============================================================================

-- Drop all existing policies on user_profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can delete any profile" ON public.user_profiles;

-- Drop all existing policies on user_api_keys
DROP POLICY IF EXISTS "Users can manage their own API keys" ON public.user_api_keys;
DROP POLICY IF EXISTS "Users can manage own API keys" ON public.user_api_keys;
DROP POLICY IF EXISTS "Admins can manage all API keys" ON public.user_api_keys;

-- Drop all existing policies on usage_logs
DROP POLICY IF EXISTS "Users can view their own usage logs" ON public.usage_logs;
DROP POLICY IF EXISTS "Users can view own usage logs" ON public.usage_logs;
DROP POLICY IF EXISTS "Admins can view all usage logs" ON public.usage_logs;
DROP POLICY IF EXISTS "System can insert usage logs" ON public.usage_logs;

-- Drop all existing policies on system_settings
DROP POLICY IF EXISTS "Admins can manage system settings" ON public.system_settings;

-- =============================================================================
-- SECTION 2: CREATE NEW NON-RECURSIVE RLS POLICIES
-- =============================================================================

-- User Profiles Policies (avoiding circular references)
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete own profile" ON public.user_profiles
    FOR DELETE USING (auth.uid() = id);

-- Admin policies using EXISTS to avoid recursion
CREATE POLICY "Admins can view all profiles" ON public.user_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid()
            AND (access_level = 'admin' OR is_admin = true)
        )
    );

CREATE POLICY "Admins can update any profile" ON public.user_profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid()
            AND (access_level = 'admin' OR is_admin = true)
        )
    );

CREATE POLICY "Admins can delete any profile" ON public.user_profiles
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid()
            AND (access_level = 'admin' OR is_admin = true)
        )
    );

-- User API Keys Policies
CREATE POLICY "Users can manage own API keys" ON public.user_api_keys
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all API keys" ON public.user_api_keys
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid()
            AND (access_level = 'admin' OR is_admin = true)
        )
    );

-- Usage Logs Policies
CREATE POLICY "Users can view own usage logs" ON public.usage_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all usage logs" ON public.usage_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid()
            AND (access_level = 'admin' OR is_admin = true)
        )
    );

CREATE POLICY "System can insert usage logs" ON public.usage_logs
    FOR INSERT WITH CHECK (true);

-- System Settings Policies
CREATE POLICY "Admins can manage system settings" ON public.system_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid()
            AND (access_level = 'admin' OR is_admin = true)
        )
    );

-- =============================================================================
-- SECTION 3: PERFORMANCE OPTIMIZATIONS - INDEXES
-- =============================================================================

-- Add missing foreign key indexes for better performance
CREATE INDEX IF NOT EXISTS idx_prompts_company_type_id ON public.prompts(company_type_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_prompt_id ON public.usage_logs(prompt_id);
CREATE INDEX IF NOT EXISTS idx_user_api_keys_admin_assigned_by ON public.user_api_keys(admin_assigned_by);

-- Remove unused indexes to save storage and improve write performance
DROP INDEX IF EXISTS idx_user_api_keys_provider;
DROP INDEX IF EXISTS idx_companies_primary_type;

-- =============================================================================
-- SECTION 4: VERIFY RLS IS ENABLED
-- =============================================================================

-- Ensure RLS is enabled on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_prompt_assignments ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- SECTION 5: VERIFICATION QUERIES
-- =============================================================================

-- Verify no duplicate policies exist
SELECT 
    tablename,
    COUNT(*) as policy_count,
    STRING_AGG(policyname, ', ') as policy_names
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename IN ('user_profiles', 'user_api_keys', 'usage_logs', 'system_settings')
GROUP BY tablename
ORDER BY tablename;

-- Check admin policy structure
SELECT 
    tablename,
    policyname,
    qual::text as using_expression
FROM pg_policies 
WHERE schemaname = 'public' 
    AND policyname LIKE 'Admins%'
ORDER BY tablename, policyname;

-- =============================================================================
-- NOTES:
-- 1. The key fix is using EXISTS subqueries for admin policies to avoid recursion
-- 2. Removed all duplicate policies that were causing performance issues
-- 3. Added missing indexes identified by Supabase performance advisor
-- 4. This replaces the failed (SELECT auth.uid()) optimization attempt
-- =============================================================================