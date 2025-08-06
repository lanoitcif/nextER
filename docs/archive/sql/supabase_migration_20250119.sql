-- NEaR Database Migration
-- Version: 2025.01.19
-- Purpose: Complete database schema with RLS fixes and performance optimizations

-- =============================================================================
-- SECTION 1: EXTENSIONS
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- SECTION 2: BASE TABLES
-- =============================================================================

-- User profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  can_use_owner_key BOOLEAN DEFAULT FALSE,
  is_admin BOOLEAN DEFAULT FALSE,
  access_level TEXT NOT NULL DEFAULT 'basic' CHECK (access_level IN ('basic', 'advanced', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User API keys table (encrypted storage)
CREATE TABLE IF NOT EXISTS public.user_api_keys (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('openai', 'anthropic', 'google', 'cohere')),
  encrypted_api_key TEXT NOT NULL,
  encryption_iv TEXT NOT NULL,
  nickname TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  assigned_by_admin BOOLEAN DEFAULT FALSE,
  admin_assigned_at TIMESTAMP WITH TIME ZONE,
  admin_assigned_by UUID REFERENCES public.user_profiles(id),
  default_model TEXT,
  UNIQUE(user_id, provider, nickname)
);

-- Company types table (industry-specific analysis templates)
CREATE TABLE IF NOT EXISTS public.company_types (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  system_prompt_template TEXT NOT NULL,
  classification_rules JSONB,
  key_metrics JSONB,
  output_format JSONB,
  validation_rules TEXT[],
  special_considerations JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Companies table (ticker symbol mappings)
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  ticker TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  primary_company_type_id TEXT REFERENCES public.company_types(id) NOT NULL,
  additional_company_types TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Prompts table (for storing pre-built system prompts)
CREATE TABLE IF NOT EXISTS public.prompts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  system_prompt TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  is_active BOOLEAN DEFAULT TRUE,
  template_variables JSONB,
  company_type_id TEXT REFERENCES public.company_types(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Company prompt assignments (links companies to their analysis types)
CREATE TABLE IF NOT EXISTS public.company_prompt_assignments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  company_type_id TEXT REFERENCES public.company_types(id) NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(company_id, company_type_id)
);

-- Usage logs table (for tracking API usage)
CREATE TABLE IF NOT EXISTS public.usage_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
  provider TEXT NOT NULL,
  model TEXT,
  prompt_id UUID REFERENCES public.prompts(id),
  token_count INTEGER,
  cost_estimate DECIMAL(10,6),
  used_owner_key BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System settings table
CREATE TABLE IF NOT EXISTS public.system_settings (
  key TEXT PRIMARY KEY,
  value JSONB,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- SECTION 3: INDEXES
-- =============================================================================

-- Core indexes
CREATE INDEX IF NOT EXISTS idx_user_api_keys_user_id ON public.user_api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON public.usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON public.usage_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_companies_ticker ON public.companies(ticker);
CREATE INDEX IF NOT EXISTS idx_company_prompt_assignments_company ON public.company_prompt_assignments(company_id);
CREATE INDEX IF NOT EXISTS idx_company_prompt_assignments_type ON public.company_prompt_assignments(company_type_id);

-- Performance optimization indexes (from advisor)
CREATE INDEX IF NOT EXISTS idx_prompts_company_type_id ON public.prompts(company_type_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_prompt_id ON public.usage_logs(prompt_id);
CREATE INDEX IF NOT EXISTS idx_user_api_keys_admin_assigned_by ON public.user_api_keys(admin_assigned_by);

-- =============================================================================
-- SECTION 4: RLS ENABLEMENT
-- =============================================================================

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_prompt_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- SECTION 5: RLS POLICIES (WITH RECURSION FIXES)
-- =============================================================================

-- Drop all existing policies first
DO $$
BEGIN
    -- user_profiles policies
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
    
    -- user_api_keys policies
    DROP POLICY IF EXISTS "Users can manage their own API keys" ON public.user_api_keys;
    DROP POLICY IF EXISTS "Users can manage own API keys" ON public.user_api_keys;
    DROP POLICY IF EXISTS "Admins can manage all API keys" ON public.user_api_keys;
    
    -- usage_logs policies
    DROP POLICY IF EXISTS "Users can view their own usage logs" ON public.usage_logs;
    DROP POLICY IF EXISTS "Users can view own usage logs" ON public.usage_logs;
    DROP POLICY IF EXISTS "Admins can view all usage logs" ON public.usage_logs;
    DROP POLICY IF EXISTS "System can insert usage logs" ON public.usage_logs;
    
    -- system_settings policies
    DROP POLICY IF EXISTS "Admins can manage system settings" ON public.system_settings;
END $$;

-- User Profiles Policies
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete own profile" ON public.user_profiles
    FOR DELETE USING (auth.uid() = id);

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

-- Prompts Policies
CREATE POLICY "Users can view active prompts" ON public.prompts
    FOR SELECT USING (is_active = TRUE);

-- Company Types Policies
CREATE POLICY "Users can view active company types" ON public.company_types
    FOR SELECT USING (is_active = TRUE);

-- Companies Policies
CREATE POLICY "Users can view active companies" ON public.companies
    FOR SELECT USING (is_active = TRUE);

-- Company Prompt Assignments Policies
CREATE POLICY "Users can view company prompt assignments" ON public.company_prompt_assignments
    FOR SELECT USING (true);

-- =============================================================================
-- SECTION 6: FUNCTIONS AND TRIGGERS
-- =============================================================================

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create user profile on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_api_keys_updated_at
  BEFORE UPDATE ON public.user_api_keys
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_prompts_updated_at
  BEFORE UPDATE ON public.prompts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_company_types_updated_at
  BEFORE UPDATE ON public.company_types
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================================
-- SECTION 7: DEFAULT DATA (Only inserts if not exists)
-- =============================================================================

-- Insert default system settings
INSERT INTO public.system_settings (key, value, description) VALUES
('maintenance_mode', '{"enabled": false, "message": "System is currently under maintenance. Please try again later."}', 'Enable or disable maintenance mode for the entire application'),
('default_provider', '{"provider": "openai", "model": "gpt-4o-mini"}', 'Default LLM provider and model for new users'),
('usage_limits', '{"monthly_requests": 1000, "monthly_tokens": 500000}', 'Default usage limits for standard users')
ON CONFLICT (key) DO NOTHING;

-- Fix companies that should have earnings_analyst option
UPDATE public.companies 
SET additional_company_types = 
    CASE 
        WHEN 'earnings_analyst' = ANY(additional_company_types) THEN additional_company_types
        ELSE array_append(additional_company_types, 'earnings_analyst')
    END
WHERE ticker IN ('ABNB', 'PK', 'RHP');

-- =============================================================================
-- SECTION 8: VERIFICATION QUERIES
-- =============================================================================

-- Check for duplicate policies
SELECT 
    'Duplicate policy check:' as check_type,
    tablename,
    COUNT(*) as policy_count,
    STRING_AGG(policyname, ', ') as policy_names
FROM pg_policies 
WHERE schemaname = 'public' 
GROUP BY tablename
HAVING COUNT(*) > 0
ORDER BY tablename;

-- Verify RLS is enabled
SELECT 
    'RLS status check:' as check_type,
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN ('user_profiles', 'user_api_keys', 'usage_logs', 'system_settings', 
                      'prompts', 'company_types', 'companies', 'company_prompt_assignments')
ORDER BY tablename;