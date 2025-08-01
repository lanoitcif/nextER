# SQL Files Documentation - NEaR Project

**Last Updated**: January 19, 2025  
**Purpose**: Document all SQL files, their purposes, and consolidation strategy

## SQL Files Overview

### 1. **supabase_schema.sql** (Original Schema)
- **Purpose**: Initial database schema creation
- **Status**: Contains circular RLS policies that caused production issues
- **Issues**: 
  - Admin policies query same table causing infinite recursion
  - Missing performance indexes
  - Contains duplicate policies

### 2. **fix_rls_performance.sql** (Failed Optimization)
- **Purpose**: Attempted to wrap `auth.uid()` in subqueries for performance
- **Status**: FAILED - Caused 500 errors in production
- **Issue**: The `(SELECT auth.uid())` syntax incompatible with Supabase RLS
- **Learning**: Do not use this approach

### 3. **rollback_rls_policies.sql** (Emergency Rollback)
- **Purpose**: Revert to original working policies after failed optimization
- **Status**: Successfully used on July 19, 2025
- **Note**: Still contains circular references but was working

### 4. **emergency_disable_rls.sql** (Emergency Access)
- **Purpose**: Temporarily disable RLS to restore access during debugging
- **Status**: Emergency use only
- **Warning**: MUST re-enable RLS after use

### 5. **debug_rls_policies.sql** (Diagnostic Tool)
- **Purpose**: Check current RLS policies and identify issues
- **Status**: Useful for troubleshooting
- **Usage**: Run to see all active policies

### 6. **fix_database.sql** (Data Updates)
- **Purpose**: Add earnings_analyst option to companies
- **Status**: Data maintenance script
- **Scope**: Updates ABNB, PK, RHP companies

## New Consolidated Files (Created Today)

### 7. **consolidated_rls_fixes.sql** ✅
- **Purpose**: Complete RLS fix avoiding infinite recursion
- **Key Changes**:
  - Uses EXISTS subqueries for admin policies
  - Removes all duplicate policies
  - Adds missing foreign key indexes
  - Includes verification queries
- **Status**: PRODUCTION READY

### 8. **supabase_migration_20250119.sql** ✅
- **Purpose**: Complete database migration with all fixes
- **Includes**:
  - Full schema creation
  - Fixed RLS policies (non-recursive)
  - Performance indexes
  - Default data
  - Verification queries
- **Status**: COMPREHENSIVE MIGRATION FILE

## Consolidation Strategy

### Immediate Actions
1. **Use `consolidated_rls_fixes.sql`** for fixing current production issues
2. **Keep `supabase_migration_20250119.sql`** as master migration file
3. **Archive old files** but keep for reference

### File Usage Guide
- **For RLS fixes only**: Use `consolidated_rls_fixes.sql`
- **For fresh database setup**: Use `supabase_migration_20250119.sql`
- **For debugging**: Use `debug_rls_policies.sql`
- **For emergency**: Keep `emergency_disable_rls.sql` available

### Deprecated Files
- `fix_rls_performance.sql` - DO NOT USE (causes errors)
- `rollback_rls_policies.sql` - Replaced by consolidated fixes
- `supabase_schema.sql` - Replaced by migration file

## Key Learnings

### RLS Policy Best Practices
1. **Avoid Circular References**: Admin policies checking same table cause recursion
2. **Use EXISTS Subqueries**: Safer than direct selects for admin checks
3. **Remove Duplicates**: Multiple policies for same action degrade performance
4. **Test in Development**: Always test RLS changes before production

### Performance Optimizations
1. **Foreign Key Indexes**: Critical for join performance
   - `idx_prompts_company_type_id`
   - `idx_usage_logs_prompt_id`
   - `idx_user_api_keys_admin_assigned_by`

2. **Remove Unused Indexes**: Save storage and improve writes
   - `idx_user_api_keys_provider`
   - `idx_companies_primary_type`

### Supabase-Specific Issues
- The `(SELECT auth.uid())` optimization doesn't work in Supabase
- EXISTS subqueries are the recommended approach
- Always verify with pg_policies view after changes

## Verification Commands

```sql
-- Check for duplicate policies
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public' 
GROUP BY tablename
HAVING COUNT(*) > 5;

-- Verify admin policies use EXISTS
SELECT tablename, policyname, qual::text
FROM pg_policies 
WHERE policyname LIKE 'Admins%'
AND qual::text LIKE '%EXISTS%';

-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = true;
```

## Production Deployment Notes

### When Applying RLS Fixes
1. Run `consolidated_rls_fixes.sql` directly in Supabase SQL Editor
2. Verify no errors in execution
3. Test login immediately
4. Check Supabase linter for warnings

### For New Deployments
1. Use `supabase_migration_20250119.sql` for complete setup
2. Includes all tables, indexes, and fixed policies
3. Contains default data for system settings

## Jules' Branch Warning
- **Branch**: `fix/supabase-security-and-docs`
- **Status**: DO NOT MERGE
- **Issues**:
  - Breaking API changes (cookie vs token auth)
  - Incompatible with Next.js 15 route syntax
  - Would break all existing API endpoints
- **Vercel Build**: Currently failing due to type errors