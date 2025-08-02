# RLS Re-enablement Plan

**Date**: July 20, 2025  
**Status**: 📋 Planning Phase  
**Priority**: Medium (Production is stable with RLS disabled)  
**Target Implementation**: July 21, 2025

## Current Situation

### ✅ What's Working
- **Production is stable** with RLS disabled on all tables
- **Authentication functions properly** via Supabase cookie-based auth
- **All application features working** including new file upload system
- **User access control** still enforced at API route level via service role

### ⚠️ Security Impact
- **RLS is currently DISABLED** on all tables
- **API routes provide security layer** using service role authentication
- **Not immediately critical** but should be re-enabled for defense in depth
- **No direct database access** from client-side (all goes through API routes)

## Implementation Plan

### Phase 1: Pre-Implementation Analysis
**Duration**: 30 minutes  
**Risk**: Low

#### 1.1 Current State Audit
```bash
# Check current RLS status
supabase db inspect --project-ref xorjwzniopfuosadwvfu

# Review database linter warnings
# URL: https://supabase.com/dashboard/project/xorjwzniopfuosadwvfu/database/linter
```

#### 1.2 Review Previous Failures
- **Read** `rls_performance_analysis.md` - documents failed optimization attempt
- **Review** `consolidated_rls_fixes.sql` - contains working RLS policies
- **Analyze** what caused the original infinite recursion issue

#### 1.3 Backup Current State
```sql
-- Export current working schema (without RLS enabled)
-- This ensures we can quickly rollback if needed
```

### Phase 2: Incremental RLS Re-enablement
**Duration**: 2 hours  
**Risk**: Medium (systematic approach reduces risk)

#### 2.1 Start with Low-Risk Tables
**Order of implementation** (from safest to most complex):

1. **`usage_logs`** - Append-only, low complexity
2. **`user_api_keys`** - User-specific, clear ownership
3. **`prompts`** - Reference data, mostly read-only  
4. **`companies`** - Reference data, public read
5. **`company_types`** - Reference data, public read
6. **`user_profiles`** - Most complex, caused original issues

#### 2.2 Policy Implementation Strategy

**For each table, follow this pattern:**

```sql
-- 1. Enable RLS
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- 2. Create minimal policies first
CREATE POLICY "policy_name" ON table_name FOR operation_type USING (simple_condition);

-- 3. Test immediately
-- 4. Add more complex policies only if needed
```

#### 2.3 Testing Protocol

**After each table RLS enablement:**
1. ✅ Test login/logout flow
2. ✅ Test basic dashboard functionality  
3. ✅ Test analyze page with file upload
4. ✅ Test admin functions (if admin table)
5. ✅ Monitor for errors in browser console
6. ✅ Check Supabase logs for RLS issues

**If any test fails:**
- ❌ Immediately disable RLS on that table
- 📝 Document the failure
- 🔄 Continue with next table

### Phase 3: Specific RLS Policies

#### 3.1 Safe Tables (Start Here)

**`usage_logs` Table:**
```sql
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;

-- Simple policy: users can insert their own logs, admins can view all
CREATE POLICY "Users can insert own usage logs" ON usage_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all usage logs" ON usage_logs  
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND (access_level = 'admin' OR is_admin = true)
        )
    );
```

**`user_api_keys` Table:**
```sql
ALTER TABLE user_api_keys ENABLE ROW LEVEL SECURITY;

-- Users manage their own keys, admins can view/manage all
CREATE POLICY "Users manage own API keys" ON user_api_keys
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins manage all API keys" ON user_api_keys
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND (access_level = 'admin' OR is_admin = true)
        )
    );
```

#### 3.2 Reference Data Tables

**`companies` and `company_types` Tables:**
```sql
-- These are public reference data
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_types ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read
CREATE POLICY "Authenticated users can read companies" ON companies
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can read company types" ON company_types
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Only admins can modify
CREATE POLICY "Admins can modify companies" ON companies
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND (access_level = 'admin' OR is_admin = true)
        )
    );
```

#### 3.3 Complex Table (Handle Last)

**`user_profiles` Table** (caused original infinite recursion):
```sql
-- This is the most dangerous - implement last with extra caution
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Start with minimal policies
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles  
    FOR UPDATE USING (auth.uid() = id);

-- Admin policies - use EXISTS to avoid recursion
CREATE POLICY "Admins can view all profiles" ON user_profiles
    FOR SELECT USING (
        -- Use specific admin user IDs to avoid recursion
        auth.uid() IN (
            'admin-user-id-1',  -- Replace with actual admin user IDs
            'admin-user-id-2'
        )
    );
```

### Phase 4: Performance Validation
**Duration**: 1 hour  
**Risk**: Low

#### 4.1 Performance Testing
```bash
# Check for new performance issues
supabase db inspect outliers --project-ref xorjwzniopfuosadwvfu
supabase db inspect seq-scans --project-ref xorjwzniopfuosadwvfu

# Monitor cache hit rates
supabase db inspect cache-hit --project-ref xorjwzniopfuosadwvfu
```

#### 4.2 Database Linter Review
- Check Supabase dashboard linter for new warnings
- Address any critical RLS-related performance issues
- Document any remaining low-priority warnings

### Phase 5: Production Validation  
**Duration**: 30 minutes  
**Risk**: Low

#### 5.1 Full Application Testing
- ✅ Complete user journey from login to analysis
- ✅ File upload functionality with different formats
- ✅ Admin dashboard and user management
- ✅ API key management for all user types
- ✅ Error handling and edge cases

#### 5.2 Monitoring Setup
- 📊 Monitor Supabase logs for RLS-related errors
- 📈 Track performance metrics for degradation
- 🚨 Set up alerts for authentication failures

## Risk Mitigation

### Immediate Rollback Plan
If any issues occur during implementation:

```sql
-- Emergency RLS disable (same as before)
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;  
ALTER TABLE company_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_api_keys DISABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE prompts DISABLE ROW LEVEL SECURITY;
```

### Monitoring Indicators
**Stop implementation immediately if:**
- Login success rate drops below 95%
- API response times increase by >50%
- Browser console shows auth-related errors
- Supabase logs show RLS infinite recursion warnings

### Staged Deployment
1. **Test in development** first (if available)
2. **Implement during low-traffic hours** (early morning)
3. **Monitor for 4 hours** after each table enablement
4. **Have rollback commands ready** in terminal

## Success Criteria

### Technical Metrics
- ✅ All RLS policies enabled without infinite recursion
- ✅ Database linter shows no critical warnings
- ✅ Performance metrics within 10% of baseline
- ✅ Zero authentication-related error logs

### Functional Validation  
- ✅ Users can login, analyze transcripts, manage API keys
- ✅ Admins can access admin dashboard and user management
- ✅ File upload system continues working properly
- ✅ All user access levels (basic, advanced, admin) function correctly

### Security Improvement
- ✅ Defense in depth restored with both API route + RLS protection
- ✅ Database queries properly filtered by user context
- ✅ Admin data properly isolated from regular users

## Implementation Timeline

### Day 1 (July 21, 2025)
- **9:00 AM**: Phase 1 - Pre-implementation analysis
- **9:30 AM**: Phase 2 - Start with `usage_logs` table
- **10:00 AM**: Continue with `user_api_keys` table  
- **10:30 AM**: Reference tables (`companies`, `company_types`)
- **11:00 AM**: Phase 3 - Performance validation
- **11:30 AM**: Production validation and monitoring setup

### Contingency
- **If issues arise**: Rollback immediately, document problems
- **If successful**: Monitor for remainder of day
- **Next day**: Review performance metrics and user feedback

## Documentation Updates Required

After successful implementation:
1. Update `CLAUDE_WAKEUP.md` to reflect RLS re-enabled status
2. Update `DATABASE_ADMIN.md` with new RLS policies
3. Document any lessons learned in `AI_KNOWLEDGE_GRAPH.yaml`
4. Update `TROUBLESHOOTING.md` if any new patterns discovered

## Dependencies and Prerequisites

### Required Access
- ✅ Supabase project admin access
- ✅ Database inspection tools
- ✅ Ability to disable RLS quickly if needed

### Required Knowledge
- ✅ Understanding of previous infinite recursion issue
- ✅ Location of working RLS policies in `consolidated_rls_fixes.sql`
- ✅ How to use Supabase CLI inspection tools

### Preparation Steps
1. Review all relevant documentation files
2. Have Supabase dashboard open to database linter
3. Prepare rollback commands in advance
4. Notify team of maintenance window (if applicable)

---

## Summary

This plan provides a **systematic, low-risk approach** to re-enabling RLS while maintaining production stability. The incremental implementation with immediate testing after each step ensures any issues can be quickly identified and resolved.

**Key Principles:**
- **Safety First**: Start with safest tables, implement rollback-ready approach
- **Incremental Progress**: One table at a time with full testing
- **Learn from History**: Apply lessons from previous infinite recursion failure
- **Monitor Continuously**: Watch for performance and security indicators

**Expected Outcome**: Restored defense-in-depth security with RLS enabled on all tables, maintaining current performance and functionality levels.