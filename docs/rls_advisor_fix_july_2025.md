# Supabase Advisor RLS Warnings (July 2025)

## Issue Summary
Supabase Advisor reported that multiple tables had row level security (RLS) policies defined but RLS itself was not enabled. Affected tables included `user_profiles`, `user_api_keys`, `usage_logs`, `prompts`, `companies`, `company_types`, `company_prompt_assignments`, and `system_settings`.

Without RLS enabled, these policies had no effect. This exposed data that should have been restricted or allowed unwanted access.

## Root Cause
The original `supabase_schema.sql` file contains `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` statements. However, these changes were not consistently applied to all environments. The advisor warnings indicated that production was missing the `ENABLE ROW LEVEL SECURITY` setting for the tables listed above.

## Fix Implementation
A new SQL script, `enable_rls.sql`, has been created to explicitly enable RLS on all public tables:

```sql
-- Enable Row Level Security on all public tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_prompt_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
```

Run this script in the Supabase SQL editor or through the CLI to ensure each table has RLS enabled.

## Validation
After executing the script, verify that `relrowsecurity` is `true` for each table:

```sql
SELECT relname, relrowsecurity
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND relname IN (
    'user_profiles',
    'user_api_keys',
    'usage_logs',
    'prompts',
    'companies',
    'company_types',
    'company_prompt_assignments',
    'system_settings'
  );
```

The query should return `t` in the `relrowsecurity` column for each table.

## Future Prevention
Include `enable_rls.sql` in your deployment process or migrations to ensure new environments always have RLS enabled. Regularly run Supabase Advisor as part of CI to catch configuration drift.
