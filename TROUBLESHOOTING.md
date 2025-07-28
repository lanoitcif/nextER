# NextER Troubleshooting Guide

## Quick Reference for Common Issues

### ✅ Recently Resolved Issues (July 28, 2025)

#### RLS Infinite Recursion Error (RESOLVED)
**Symptoms:**
- Error code 42P17: "Infinite recursion detected in policy for relation user_profiles"
- 403 Forbidden errors on user_profiles and usage_logs tables
- Login page not refreshing after authentication

**Root Cause:**
- Admin RLS policies were referencing the same `user_profiles` table they were protecting
- Created circular dependency: Policy → Check admin status → Trigger same policy → Infinite loop

**Solution Applied:**
- Created `private.is_admin_user()` security definer function
- Function bypasses RLS to check admin status without recursion
- Rebuilt all RLS policies using this approach
- Follows Supabase official best practices

**Resolution Date:** July 26, 2025
**Status:** ✅ FIXED - Login functionality fully restored

#### Dashboard Loading Performance Issue (RESOLVED)
**Symptoms:**
- Dashboard gets stuck in "loading" state after tab switching
- API requests timing out or taking excessive time
- Mobile browser compatibility issues

**Root Cause:**
- Over 30 RLS performance warnings from Supabase advisor
- `auth.uid()` being re-evaluated for each database row instead of cached
- Multiple duplicate permissive policies causing query overhead
- Missing database indexes on foreign keys

**Solution Applied:**
- Optimized RLS policies by wrapping `auth.uid()` with `(SELECT auth.uid())`
- Removed duplicate policies on `user_api_keys` table
- Added missing index for `companies.primary_company_type_id` foreign key
- Performance improvements should reduce query times significantly

**Resolution Date:** July 26, 2025
**Status:** ✅ FIXED - Dashboard loading performance optimized

#### Loading Screen Bug (RESOLVED)
**Symptoms:**
- Application gets stuck on a 'loading' screen after minimizing and restoring the browser, particularly after an analysis.
- No errors in console, but UI elements do not reappear.
- Issue particularly noticeable when modals are open.

**Root Cause:**
- `AuthContext`'s `refreshSession` function was setting loading state to true on every visibility change.
- This disrupted UI when modals were open, causing confusing user experience.

**Solution Applied:**
- Modified `refreshSession` to accept optional `showLoading` parameter (defaults to true).
- When refreshing due to visibility change, call `refreshSession(false)` to avoid UI disruption.
- Only refresh if user is already authenticated to avoid unnecessary API calls.

**Resolution Date:** July 28, 2025
**Status:** ✅ FIXED - Page no longer shows loading screen on tab switches.

#### File Upload Lag (Desktop) (RESOLVED)
**Symptoms:**
- Noticeable lag between attaching a `.pdf`, `.docx`, or `.txt` file and the raw text appearing in the transcript text box on desktop browsers.

**Root Cause:**
- Backend file processing (PDF/DOCX extraction) was synchronous and could be slow for larger files, causing a delay before the extracted text was returned to the frontend.

**Solution Applied:**
- Backend processing for file extraction has been optimized, reducing the lag.
- Frontend now handles the `analyzing` state more robustly during file upload, providing better user feedback.

**Resolution Date:** July 27, 2025
**Status:** ✅ FIXED - File upload on desktop is now smoother.

---

## 🔐 Security & Architecture Review (July 27, 2025)

### **Critical Security Vulnerability - JWT Token Handling (RESOLVED)**
**Location:** `/app/api/extract-pdf/route.ts:24`
**Issue:** Dangerous use of `jwt.decode()` without signature verification
**Risk Level:** HIGH - Token forgery possible, authentication bypass
**Status:** ✅ FIXED - Replaced with secure Supabase auth

**Previous Vulnerable Code:**
```typescript
const decoded = jwt.decode(token) as any
userId = decoded.sub
```

**Security Impact:**
- Anyone could forge tokens and bypass authentication
- No signature validation allowed malicious token creation
- Violated Supabase security best practices
- Could have led to unauthorized API access

**Resolution Applied:** Replaced with Supabase's secure `auth.getUser()` method
**Resolution Date:** July 27, 2025

### **Supabase Authentication Migration Status**
**Current Status:** ✅ MOSTLY COMPLIANT with 2025 standards
- ✅ Using `@supabase/ssr` v0.5.1 (modern package)
- ✅ No deprecated `@supabase/auth-helpers` dependencies
- ✅ Modern `@supabase/supabase-js` v2.45.4
- ⚠️ Upgrade needed to `@supabase/ssr` v0.6.1 for latest improvements
- 🚨 Remove manual JWT handling (security risk)

**Migration Deadlines (from Supabase):**
- **October 2025:** New projects auto-use asymmetric JWT
- **November 2025:** Existing projects receive migration reminders
- **Late 2026:** Complete deprecation of legacy anon/service_role keys

**Reference:** [Supabase Auth Best Practices 2024-2025](https://claude.ai/public/artifacts/0bdd8981-f1c0-45f6-b83c-c6f6968325bf)

### **Architecture Recommendations for Senior Review**

**High Priority:**
1. **JWT Security Fix** - Remove manual JWT decoding immediately
2. **Package Cleanup** - Remove unused `jsonwebtoken` dependency
3. **Auth Pattern Audit** - Review all API routes for similar vulnerabilities

**Medium Priority:**
1. **PKCE Flow Implementation** - Enhanced security for auth flows
2. **Cookie-based Sessions** - Migrate from localStorage if applicable
3. **Performance Monitoring** - Implement getClaims() for faster auth checks

**Low Priority:**
1. **Environment Integration** - Use official Vercel + Supabase integration
2. **Session Management** - Advanced session controls (Pro+ features)
3. **Documentation Update** - Modern auth patterns in developer guides

---

## ✅ Resolved Issues Reference

### Build Deployment Failures

**Issue:** Next.js 15 build failing on Vercel
**Error:** `Cannot find name 'supabaseAdmin'`

**Solution:**
```typescript
// Add import
import { supabaseAdmin } from '@/lib/supabase/client'

// Add null checks
if (!supabaseAdmin) {
  return NextResponse.json(
    { error: 'Service unavailable - admin client not configured' },
    { status: 503 }
  )
}
```

### RLS Policy Infinite Recursion

**Issue:** "Infinite recursion detected in policy for relation user_profiles"

**Solution Applied:**
```sql
-- Fixed admin policy to avoid self-reference
DROP POLICY IF EXISTS admin_all_access ON user_profiles;

CREATE POLICY admin_all_access ON user_profiles
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM auth.users 
            WHERE auth.users.email IN ('john@151westmain.com')
        )
        OR
        auth.uid() = user_profiles.id
    );
```

### Environment Variable Issues

**Issue:** Build failing due to missing environment variables

**Solution:**
1. Pull from Vercel: `vercel env pull .env.vercel`
2. Compare: `diff .env .env.vercel`
3. Ensure these are set in Vercel:
   - USER_API_KEY_ENCRYPTION_SECRET (32 chars)
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY

---

## Essential Commands Cheatsheet

### Vercel CLI
```bash
vercel login               # Use john@151westmain.com
vercel ls                 # List deployments
vercel --prod            # Deploy to production
vercel logs <url>        # View runtime logs
vercel env ls            # List env vars
vercel env pull          # Pull env vars
```

### Local Testing
```bash
npm run type-check       # Check TypeScript
npm run build           # Test build locally
npm run lint            # Check linting
npm test                # Run tests
```

### Database Debugging
```sql
-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'user_profiles';

-- Check table structure
SELECT * FROM information_schema.columns WHERE table_name = 'user_profiles';

-- Check user roles
SELECT id, email, is_admin, access_level FROM user_profiles;
```

### Git Operations
```bash
git add .
git commit -m "type: description"
git push origin main
```

---

## Contact Information

- **Vercel Account**: john@151westmain.com
- **Supabase Account**: john@151westmain.com
- **Production URL**: https://lanoitcif.com
- **GitHub Repo**: https://github.com/lanoitcif/nextER

---

## Next Session Priorities

1. Investigate and resolve **File Upload (Android)** issue
2. Fix RLS policy circular dependency on user_api_keys table
3. Update Supabase auth security settings (OTP expiry, password protection)
4. Consider implementing multiTab: false configuration
5. Monitor production using Vercel CLI and Supabase MCP tools

Remember: Always check build status at https://vercel.com/lanoitcifs-projects/next-er

---

## Incident Reports

### RLS Performance Optimization Failure (July 19, 2025)

#### Issue Summary
Attempted to implement RLS performance optimization based on Supabase advisor recommendation. The optimization failed and was rolled back.

#### Attempted Optimization
- **Original Issue**: `auth.uid()` function re-evaluated for each row in RLS policies  
- **Suggested Fix**: Wrap in subquery `(SELECT auth.uid())` to evaluate once per query  
- **Expected Benefit**: Reduce query time from seconds to microseconds on large tables

#### Implementation
Applied optimization to all RLS policies in:
- `user_profiles` table (7 policies)
- `user_api_keys` table (2 policies)  
- `usage_logs` table (2 policies)
- `system_settings` table (1 policy)

#### Failure Analysis
**Symptoms**: 500 Internal Server Error on all affected endpoints
- `GET /rest/v1/user_profiles` - 500 error
- `GET /rest/v1/usage_logs` - 500 error
- Frontend unable to load user profile or usage data

**Root Cause**: The `(SELECT auth.uid())` subquery syntax appears incompatible with Supabase's RLS implementation or creates circular references in policy evaluation.

#### Resolution
- **Immediate**: Ran `rollback_rls_policies.sql` to restore original working policies
- **Result**: Service restored, all endpoints functional
- **Time to Resolution**: < 5 minutes

#### Lessons Learned
1. **Test RLS changes in development first**: Performance optimizations should be validated in non-production
2. **Supabase-specific syntax**: Generic PostgreSQL optimizations may not work in Supabase's managed environment
3. **Have rollback ready**: Always prepare rollback scripts before applying RLS changes
4. **Monitor after deployment**: Database-level changes can fail silently until queries are executed

#### Alternative Approaches
For future performance optimization:
1. **Database indexing**: Add indexes on frequently queried columns
2. **Query optimization**: Optimize application-level queries instead of RLS
3. **Connection pooling**: Implement proper connection pooling for better performance
4. **Caching layer**: Add Redis or similar caching for frequently accessed data

**Impact**: Production outage ~5 minutes  
**Resolution**: Complete rollback to working state