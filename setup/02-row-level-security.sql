-- NextER Row Level Security (RLS) Policies
-- Version: 1.0.0
-- Date: August 6, 2025
-- Description: Complete RLS setup for all tables

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_prompt_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- USER PROFILES POLICIES
-- ============================================================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Admin users can view all profiles
CREATE POLICY "Admin users can view all profiles" ON user_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- Admin users can update all profiles
CREATE POLICY "Admin users can update all profiles" ON user_profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- ============================================================================
-- COMPANIES POLICIES
-- ============================================================================

-- All authenticated users can view active companies
CREATE POLICY "Authenticated users can view active companies" ON companies
    FOR SELECT USING (is_active = true);

-- Admin users can manage companies
CREATE POLICY "Admin users can insert companies" ON companies
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND is_admin = true
        )
    );

CREATE POLICY "Admin users can update companies" ON companies
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND is_admin = true
        )
    );

CREATE POLICY "Admin users can delete companies" ON companies
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- ============================================================================
-- COMPANY TYPES POLICIES
-- ============================================================================

-- All authenticated users can view active company types
CREATE POLICY "Authenticated users can view active company types" ON company_types
    FOR SELECT USING (is_active = true);

-- Admin users can manage company types
CREATE POLICY "Admin users can insert company types" ON company_types
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND is_admin = true
        )
    );

CREATE POLICY "Admin users can update company types" ON company_types
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND is_admin = true
        )
    );

CREATE POLICY "Admin users can delete company types" ON company_types
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- ============================================================================
-- USER API KEYS POLICIES
-- ============================================================================

-- Users can view their own API keys
CREATE POLICY "Users can view own API keys" ON user_api_keys
    FOR SELECT USING (user_id = auth.uid());

-- Users can insert their own API keys
CREATE POLICY "Users can insert own API keys" ON user_api_keys
    FOR INSERT WITH CHECK (user_id = auth.uid() AND assigned_by_admin = false);

-- Users can update their own API keys (non-admin assigned)
CREATE POLICY "Users can update own API keys" ON user_api_keys
    FOR UPDATE USING (user_id = auth.uid() AND assigned_by_admin = false);

-- Users can delete their own API keys (non-admin assigned)
CREATE POLICY "Users can delete own API keys" ON user_api_keys
    FOR DELETE USING (user_id = auth.uid() AND assigned_by_admin = false);

-- Admin users can manage all API keys
CREATE POLICY "Admin users can view all API keys" ON user_api_keys
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND is_admin = true
        )
    );

CREATE POLICY "Admin users can insert API keys for users" ON user_api_keys
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND is_admin = true
        )
    );

CREATE POLICY "Admin users can update all API keys" ON user_api_keys
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- ============================================================================
-- PROMPTS POLICIES
-- ============================================================================

-- All authenticated users can view active prompts
CREATE POLICY "Authenticated users can view active prompts" ON prompts
    FOR SELECT USING (is_active = true);

-- Admin users can manage prompts
CREATE POLICY "Admin users can manage prompts" ON prompts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- ============================================================================
-- USAGE LOGS POLICIES
-- ============================================================================

-- Users can view their own usage logs
CREATE POLICY "Users can view own usage logs" ON usage_logs
    FOR SELECT USING (user_id = auth.uid());

-- Users can insert their own usage logs
CREATE POLICY "Users can insert own usage logs" ON usage_logs
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Admin users can view all usage logs
CREATE POLICY "Admin users can view all usage logs" ON usage_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- ============================================================================
-- ANALYSIS TRANSCRIPTS POLICIES
-- ============================================================================

-- Users can view their own transcripts
CREATE POLICY "Users can view own transcripts" ON analysis_transcripts
    FOR SELECT USING (user_id = auth.uid());

-- Users can insert their own transcripts
CREATE POLICY "Users can insert own transcripts" ON analysis_transcripts
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own transcripts (for feedback)
CREATE POLICY "Users can update own transcripts" ON analysis_transcripts
    FOR UPDATE USING (user_id = auth.uid());

-- Admin users can view all transcripts
CREATE POLICY "Admin users can view all transcripts" ON analysis_transcripts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- ============================================================================
-- COMPANY PROMPT ASSIGNMENTS POLICIES
-- ============================================================================

-- All authenticated users can view assignments
CREATE POLICY "Authenticated users can view assignments" ON company_prompt_assignments
    FOR SELECT USING (true);

-- Admin users can manage assignments
CREATE POLICY "Admin users can manage assignments" ON company_prompt_assignments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- ============================================================================
-- SYSTEM SETTINGS POLICIES
-- ============================================================================

-- All authenticated users can view settings
CREATE POLICY "Authenticated users can view settings" ON system_settings
    FOR SELECT USING (true);

-- Only admin users can modify settings
CREATE POLICY "Admin users can manage settings" ON system_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND is_admin = true
        )
    );