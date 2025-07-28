# NextER Development Status & Technical Reference

**Last Updated:** July 28, 2025 (Updated with authentication fixes)  
**Production URL:** https://lanoitcif.com  
**Status:** ✅ Production Ready - Core functionality operational  
**Current Priority:** Android File Upload & Session Management

---

## Table of Contents

1. [Current Production Status](#current-production-status)
2. [Recent Fixes & Resolutions](#recent-fixes--resolutions)
3. [Known Issues & Priorities](#known-issues--priorities)
4. [Technical Implementation Plan](#technical-implementation-plan)
5. [Troubleshooting Guide](#troubleshooting-guide)
6. [Branch Management & History](#branch-management--history)
7. [Development Workflow](#development-workflow)
8. [Essential Commands & Tools](#essential-commands--tools)

---

## Current Production Status

### ✅ Working Features
- **Authentication:** Login/logout fully operational with session corruption fixes
- **Admin Panel:** Complete functionality including API key assignment
- **Analysis Engine:** All LLM providers integrated (OpenAI, Anthropic, Google, Cohere)
- **File Upload (Desktop):** PDF/DOCX/TXT extraction working smoothly
- **Company Search:** Dropdown with auto-complete and analysis type selection
- **Additional Review:** Second LLM review feature implemented
- **System Prompt Editor:** Fixed JSONEditor issue for plain text templates
- **Session Management:** Enhanced with clearCorruptedSession functionality
- **Visibility Handling:** Completely disabled visibility-based refresh to prevent state resets

### ⚠️ Known Issues
- **File Upload (Android):** Chrome on Android shows endless loading state. Request doesn't reach backend. Requires client-side debugging.

### 🔧 Infrastructure
- **Deployment:** Vercel (auto-deploy from main branch)
- **Database:** Supabase PostgreSQL (project: xorjwzniopfuosadwvfu)
- **Build Status:** ✅ Next.js 15 migration complete
- **Security:** AES-256-GCM encryption, RLS policies active

---

## Recent Fixes & Resolutions

### July 28, 2025: Authentication & Session Management Fixes

#### 1. JSONEditor System Prompt Error
**Problem:** JSONEditor expected object/array but received plain text for system prompts  
**Solution:** Replaced JSONEditor with textarea in `/app/dashboard/admin/system-prompts/page.tsx`

#### 2. Login Loading Stuck Issue
**Problem:** Page gets stuck on "loading" after login, requiring cookie clearing  
**Solution:** Enhanced session management in `AuthContext.tsx`:
- Added `clearCorruptedSession` function for manual cleanup
- Improved session refresh with error handling
- Better auth state corruption recovery

#### 3. Visibility Change State Reset
**Problem:** Taking screenshots or switching tabs reset analysis results  
**Solution:** Completely disabled visibility-based session refresh
```typescript
// Removed problematic visibility refresh that was causing state resets
// onAuthStateChange listener is sufficient for auth management
```

### July 27, 2025: JWT Security Vulnerability
**Problem:** Manual JWT decoding without signature verification  
**Solution:** Replaced with Supabase's secure auth
```typescript
// Before (VULNERABLE)
const decoded = jwt.decode(token) as any

// After (SECURE)
const { data: { user }, error } = await supabase.auth.getUser(token)
```

### July 26, 2025: RLS Infinite Recursion
**Problem:** Admin policies creating circular dependencies  
**Solution:** Implemented security definer function
```sql
CREATE FUNCTION private.is_admin_user(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = user_id 
    AND (access_level = 'admin' OR is_admin = true)
  );
END;
$$;
```

### Next.js 15 Migration Issues
**Problems Resolved:**
- Async params in route handlers
- Async cookies API
- TypeScript strict mode compliance
- Missing dependencies

---

## Known Issues & Priorities

### 1. HIGH PRIORITY: Android File Upload Issue
**Symptoms:** File upload shows endless loading on Android Chrome  
**Investigation Steps:**
1. Enable remote debugging for Android Chrome
2. Check Network tab for failed requests
3. Verify FormData construction
4. Test with different file sizes
5. Check for Android-specific CORS issues

### 2. HIGH PRIORITY: RLS Policy Optimization
**Current Issue:** `user_api_keys` table still has circular dependency
```sql
-- PROBLEMATIC POLICY
"Admins can manage all API keys" ON user_api_keys
FOR ALL USING ((SELECT user_profiles.access_level FROM user_profiles WHERE id = auth.uid()) = 'admin')

-- REQUIRED FIX
DROP POLICY IF EXISTS "Admins can manage all API keys" ON user_api_keys;
CREATE POLICY "Admins can manage all API keys" ON user_api_keys
    FOR ALL USING (private.is_admin_user(auth.uid()));
```

### 3. MEDIUM PRIORITY: Supabase Security Settings
**Required Updates:**
- Reduce OTP expiry to 1 hour (currently >1 hour)
- Enable leaked password protection
- Update to latest @supabase/ssr package

### 4. COMPLETED: Session Management Issues
**Status:** ✅ Resolved on July 28, 2025
- Fixed login loading state issues
- Resolved visibility change state resets
- Added session corruption recovery mechanisms
- Note: `multiTab: false` not supported in current @supabase/ssr version

---

## Technical Implementation Plan

### Immediate Actions Required

#### 1. Fix RLS Policy Circular Dependency
```sql
-- Test in development first
BEGIN;
DROP POLICY IF EXISTS "Admins can manage all API keys" ON user_api_keys;
CREATE POLICY "Admins can manage all API keys" ON user_api_keys
    FOR ALL USING (private.is_admin_user(auth.uid()));
COMMIT;
```

#### 2. Update Supabase Auth Settings
Navigate to Supabase Dashboard:
- **Authentication > Settings > Email**
  - Set OTP expiry to 3600 seconds (1 hour)
- **Authentication > Settings > Security**
  - Enable leaked password protection
  - Set minimum password length to 8

#### 3. Package Updates
```bash
# Upgrade to latest SSR package
npm install @supabase/ssr@latest

# Verify no manual JWT handling
grep -r "jwt\.decode\|jwt\.verify" app/ lib/
```

### Performance Optimization Checklist

- [ ] Apply RLS policy fixes
- [ ] Add missing database indexes
- [ ] Implement connection pooling
- [ ] Enable query caching
- [ ] Monitor with Supabase advisor

---

## Troubleshooting Guide

### Common Issues & Solutions

#### Session/Authentication Problems
**Symptom:** 401 errors, login not working  
**Solutions:**
1. Verify environment variables in Vercel
2. Check Supabase service role key
3. Clear browser cache/cookies
4. Test in incognito mode

#### Build Failures
**Symptom:** TypeScript errors during build  
**Solutions:**
1. Run `npm run type-check` locally
2. Ensure all callbacks have explicit types
3. Check for missing imports
4. Verify environment variables

#### API Key Issues
**Symptom:** "No API key found" errors  
**Solutions:**
1. Verify encryption secret is 32 characters
2. Check OWNER_* environment variables
3. Ensure proper provider selection
4. Verify key assignment in database

### Database Debugging Queries
```sql
-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename IN ('user_profiles', 'user_api_keys', 'usage_logs');

-- Verify user roles
SELECT id, email, is_admin, access_level, can_use_owner_key FROM user_profiles;

-- Check API key assignments
SELECT * FROM user_api_keys WHERE assigned_by_admin = true;

-- Monitor usage
SELECT provider, COUNT(*), SUM(cost_estimate) FROM usage_logs GROUP BY provider;
```

---

## Branch Management & History

### Successfully Merged Branches (2025)
- `fix/api-key-storage` - Token-based authentication
- `codex/fix-user-api-key-functionality` - Improved encryption
- `feat/system-prompt-editor` - Admin prompt management
- `feature/pdf-upload` - File upload functionality
- `feature/review-analysis` - Second LLM review
- `fix/loading-screen-bug` - Browser minimize/restore fix
- `fix/desktop-file-upload-lag` - Upload optimization
- `fix/auth-session-management` - Login loading & visibility fixes (July 28)
- `fix/json-editor-placeholder` - System prompt editor fix (July 28)

### Pending Codex Branches
**With commits (need review):**
- `codex/fix-company-search-and-transcript-submission-issues`
- `codex/implement-live-transcription-for-earnings-calls`
- `codex/improve-markdown-to-tables-conversion`
- `codex/plan-and-implement-qa-only-feature`

**Empty branches (to be deleted):**
- `codex/fix-failing-api-test-suite`
- `codex/fix-failing-jest-tests-for-api-routes`

---

## Development Workflow

### Before Making Changes
```bash
# Ensure clean state
git status
git stash push -m "Save local changes"

# Create feature branch
git checkout -b fix/issue-description

# Verify build works
npm run build
npm run type-check
npm run lint
```

### Testing Changes
```bash
# Run development server
npm run dev

# Test authentication flows
# Test with different user roles
# Test on mobile devices
# Check browser console for errors
```

### Deploying to Production
```bash
# Commit with conventional format
git add .
git commit -m "fix: description of fix"

# Push to trigger deployment
git push origin main

# Monitor deployment
vercel logs --tail
```

---

## Essential Commands & Tools

### Vercel CLI
```bash
vercel login              # Use john@151westmain.com
vercel ls                # List deployments
vercel --prod           # Manual production deploy
vercel logs <url>       # View logs
vercel env pull         # Sync environment variables
```

### Supabase MCP Tools
```python
# Execute SQL queries
mcp__supabase__execute_sql(query="SELECT * FROM user_profiles")

# Apply database migrations
mcp__supabase__apply_migration(name="fix_rls", query="...")

# Get service logs
mcp__supabase__get_logs(service="auth")

# Check security advisors
mcp__supabase__get_advisors(type="security")
```

### Local Development
```bash
npm run dev             # Start dev server (port 3000)
npm run build          # Production build
npm run type-check     # TypeScript validation
npm run lint           # ESLint checks
npm test               # Run test suite
```

### Git Operations
```bash
# View recent commits
git log --oneline -10

# Check branch status
git branch -a

# Clean up merged branches
git branch -d branch-name
git push origin --delete branch-name
```

---

## Risk Mitigation

### Before RLS Changes
1. Export current policies as backup
2. Test in development environment
3. Have rollback SQL ready
4. Monitor after deployment

### Emergency Procedures
- **Production Down:** Check Vercel logs first
- **Auth Broken:** Verify Supabase service status
- **RLS Errors:** Run rollback SQL immediately
- **Build Failures:** Check environment variables

---

## Contact Information

- **Vercel Account:** john@151westmain.com
- **Supabase Account:** john@151westmain.com
- **GitHub Repo:** https://github.com/lanoitcif/nextER
- **Production URL:** https://lanoitcif.com

---

## Next Session Priorities

1. **Investigate Android file upload issue** - Primary focus
2. **Fix RLS circular dependency** - Critical for performance
3. **Update Supabase security settings** - Security compliance
4. **Consider multiTab configuration** - Stability enhancement
5. **Monitor production metrics** - Ongoing maintenance

Remember: Always test locally before pushing to main branch!