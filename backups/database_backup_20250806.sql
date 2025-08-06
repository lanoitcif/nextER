-- ============================================================================
-- NextER Database Backup
-- Date: August 6, 2025
-- Time: Before RLS Migration
-- ============================================================================

-- Database Statistics:
-- analysis_transcripts: 20 rows
-- companies: 12 rows
-- company_prompt_assignments: 22 rows
-- company_types: 8 rows
-- prompts: 4 rows
-- system_settings: 1 row
-- usage_logs: 45 rows
-- user_api_keys: 4 rows
-- user_profiles: 4 rows

-- ============================================================================
-- IMPORTANT: Manual Backup Instructions
-- ============================================================================
-- 1. Use Supabase Dashboard to create a full backup:
--    - Go to Settings > Database > Backups
--    - Click "Create backup"
--    - Wait for completion
--
-- 2. Export data using pg_dump:
--    pg_dump -h db.xorjwzniopfuosadwvfu.supabase.co \
--            -U postgres \
--            -d postgres \
--            --schema=public \
--            --data-only \
--            --no-owner \
--            --no-privileges \
--            -f nextar_data_backup_20250806.sql
--
-- 3. Save this file and the data export in a safe location

-- ============================================================================
-- Current RLS Policies Backup (before migration)
-- ============================================================================

-- Note: To restore these policies, first drop the new ones and then run this script

-- User Profiles Policies
CREATE POLICY IF NOT EXISTS "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Admins can view all profiles" ON user_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- Companies Policies
CREATE POLICY IF NOT EXISTS "Admins can manage companies" ON companies
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

CREATE POLICY IF NOT EXISTS "Users can view companies" ON companies
    FOR SELECT USING (true);

-- Company Types Policies
CREATE POLICY IF NOT EXISTS "Admins can manage company types" ON company_types
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

CREATE POLICY IF NOT EXISTS "Users can view company types" ON company_types
    FOR SELECT USING (true);

-- User API Keys Policies
CREATE POLICY IF NOT EXISTS "Users can manage own API keys" ON user_api_keys
    FOR ALL USING (auth.uid() = user_id);

-- Prompts Policies
CREATE POLICY IF NOT EXISTS "Admins can manage prompts" ON prompts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

CREATE POLICY IF NOT EXISTS "Users can view prompts" ON prompts
    FOR SELECT USING (true);

-- Usage Logs Policies
CREATE POLICY IF NOT EXISTS "Users can view own usage" ON usage_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "System can create usage logs" ON usage_logs
    FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Admins can view all usage" ON usage_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- Analysis Transcripts Policies
CREATE POLICY IF NOT EXISTS "Users can manage own transcripts" ON analysis_transcripts
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Admins can view all transcripts" ON analysis_transcripts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- Company Prompt Assignments Policies
CREATE POLICY IF NOT EXISTS "Admins can manage assignments" ON company_prompt_assignments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

CREATE POLICY IF NOT EXISTS "Users can view assignments" ON company_prompt_assignments
    FOR SELECT USING (true);

-- System Settings Policies
CREATE POLICY IF NOT EXISTS "Admins can manage settings" ON system_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

CREATE POLICY IF NOT EXISTS "Users can view settings" ON system_settings
    FOR SELECT USING (true);

-- ============================================================================
-- Rollback Script (if needed)
-- ============================================================================

-- To rollback the RLS migration:
-- 1. Drop the new private schema functions:
--    DROP SCHEMA IF EXISTS private CASCADE;
--
-- 2. Drop all new policies (with _v2 suffix if renamed)
--
-- 3. Restore the policies from this backup file
--
-- 4. Test all functionality

-- ============================================================================
-- Critical Data Backup Queries
-- ============================================================================

-- Export critical configuration data as INSERT statements:

-- Company Types (8 rows)
-- SELECT 'INSERT INTO company_types (id, name, description, system_prompt_template, created_at, updated_at) VALUES (' ||
--        quote_literal(id) || ', ' ||
--        quote_literal(name) || ', ' ||
--        quote_literal(description) || ', ' ||
--        quote_literal(system_prompt_template) || ', ' ||
--        quote_literal(created_at) || ', ' ||
--        quote_literal(updated_at) || ');'
-- FROM company_types;

-- Companies (12 rows)
-- SELECT 'INSERT INTO companies (id, ticker, name, primary_company_type_id, additional_company_types, created_at, updated_at) VALUES (' ||
--        quote_literal(id) || ', ' ||
--        quote_literal(ticker) || ', ' ||
--        quote_literal(name) || ', ' ||
--        quote_literal(primary_company_type_id) || ', ' ||
--        quote_literal(additional_company_types::text) || ', ' ||
--        quote_literal(created_at) || ', ' ||
--        quote_literal(updated_at) || ');'
-- FROM companies;

-- System Settings (1 row)
-- SELECT 'INSERT INTO system_settings (id, key, value, created_at, updated_at) VALUES (' ||
--        quote_literal(id) || ', ' ||
--        quote_literal(key) || ', ' ||
--        quote_literal(value::text) || ', ' ||
--        quote_literal(created_at) || ', ' ||
--        quote_literal(updated_at) || ');'
-- FROM system_settings;

-- ============================================================================
-- END OF BACKUP
-- ============================================================================