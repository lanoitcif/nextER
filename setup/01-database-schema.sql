-- NextER Complete Database Schema Setup
-- Version: 1.0.0
-- Date: August 6, 2025
-- Description: Complete database schema for NextER platform

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- TABLES
-- ============================================================================

-- User profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    can_use_owner_key BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_admin BOOLEAN DEFAULT false,
    access_level TEXT DEFAULT 'basic' CHECK (access_level IN ('basic', 'advanced', 'admin')),
    default_provider TEXT,
    default_model TEXT
);

-- Company types (Analysis templates)
CREATE TABLE IF NOT EXISTS company_types (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    system_prompt_template TEXT NOT NULL,
    classification_rules JSONB DEFAULT '{}'::jsonb,
    key_metrics JSONB DEFAULT '{}'::jsonb,
    output_format JSONB DEFAULT '{}'::jsonb,
    validation_rules TEXT[] DEFAULT ARRAY[]::TEXT[],
    special_considerations JSONB DEFAULT '{}'::jsonb,
    llm_settings JSONB DEFAULT '{"temperature": 0.3, "top_p": 0.9, "max_tokens": 3000, "frequency_penalty": 0.3, "presence_penalty": 0.2}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticker TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    primary_company_type_id TEXT REFERENCES company_types(id),
    additional_company_types TEXT[] DEFAULT ARRAY[]::TEXT[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User API keys (encrypted storage)
CREATE TABLE IF NOT EXISTS user_api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider IN ('openai', 'anthropic', 'google', 'cohere')),
    encrypted_api_key TEXT NOT NULL,
    encryption_iv TEXT NOT NULL,
    nickname TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    assigned_by_admin BOOLEAN DEFAULT false,
    admin_assigned_at TIMESTAMPTZ,
    admin_assigned_by UUID REFERENCES user_profiles(id),
    default_model TEXT,
    UNIQUE(user_id, provider)
);

-- Prompts table
CREATE TABLE IF NOT EXISTS prompts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    description TEXT,
    system_prompt TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    template_variables JSONB,
    company_type_id TEXT REFERENCES company_types(id)
);

-- Usage logs table
CREATE TABLE IF NOT EXISTS usage_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(id),
    provider TEXT NOT NULL,
    model TEXT,
    prompt_id UUID REFERENCES prompts(id),
    token_count INTEGER,
    cost_estimate NUMERIC,
    used_owner_key BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analysis transcripts table
CREATE TABLE IF NOT EXISTS analysis_transcripts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(id),
    company_id UUID REFERENCES companies(id),
    company_type_id TEXT REFERENCES company_types(id),
    transcript TEXT NOT NULL,
    analysis_result TEXT,
    review_result TEXT,
    provider TEXT NOT NULL,
    model TEXT,
    review_provider TEXT,
    review_model TEXT,
    feedback SMALLINT CHECK (feedback IN (-1, 1, NULL)),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Company prompt assignments
CREATE TABLE IF NOT EXISTS company_prompt_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    company_type_id TEXT NOT NULL REFERENCES company_types(id),
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, company_type_id)
);

-- System settings table
CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT PRIMARY KEY,
    value JSONB,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_admin ON user_profiles(is_admin);
CREATE INDEX IF NOT EXISTS idx_companies_ticker ON companies(ticker);
CREATE INDEX IF NOT EXISTS idx_companies_active ON companies(is_active);
CREATE INDEX IF NOT EXISTS idx_user_api_keys_user_provider ON user_api_keys(user_id, provider);
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_created ON usage_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analysis_transcripts_user ON analysis_transcripts(user_id);
CREATE INDEX IF NOT EXISTS idx_analysis_transcripts_created ON analysis_transcripts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analysis_transcripts_company ON analysis_transcripts(company_id);
CREATE INDEX IF NOT EXISTS idx_company_types_active ON company_types(is_active);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update timestamp triggers
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_companies_updated_at
    BEFORE UPDATE ON companies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_types_updated_at
    BEFORE UPDATE ON company_types
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_api_keys_updated_at
    BEFORE UPDATE ON user_api_keys
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prompts_updated_at
    BEFORE UPDATE ON prompts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create profile on user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE user_profiles IS 'Extended user profile information linked to Supabase auth';
COMMENT ON TABLE company_types IS 'Analysis templates with prompts and configuration for different company types';
COMMENT ON TABLE companies IS 'Company registry with ticker symbols and type associations';
COMMENT ON TABLE user_api_keys IS 'Encrypted storage of user API keys for LLM providers';
COMMENT ON TABLE prompts IS 'System prompts for various analysis types';
COMMENT ON TABLE usage_logs IS 'Track API usage for analytics and billing';
COMMENT ON TABLE analysis_transcripts IS 'Store completed analyses with transcripts and results';
COMMENT ON TABLE company_prompt_assignments IS 'Link companies to their analysis templates';
COMMENT ON TABLE system_settings IS 'Global system configuration storage';

COMMENT ON COLUMN company_types.llm_settings IS 'LLM configuration including temperature, top_p, max_tokens, and penalties';
COMMENT ON COLUMN analysis_transcripts.feedback IS '-1 for negative, 1 for positive feedback';
COMMENT ON COLUMN user_profiles.access_level IS 'User access level: basic, advanced, or admin';