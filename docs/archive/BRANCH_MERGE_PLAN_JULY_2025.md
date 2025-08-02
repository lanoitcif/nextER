# NextER Branch Merge Plan

## Executive Summary
This plan outlines the strategy for merging outstanding branches and resolving authentication/RLS security issues. Critical security updates have been implemented locally but not yet pushed to origin.

## Critical Updates Already Applied Locally
1. **RLS Security Fix** (commit: 0d6273c)
   - Enabled RLS on ALL public tables (previously disabled)
   - Created `enable_rls_security.sql` script
   - This was a CRITICAL security vulnerability

2. **Authentication Migration** (commits: 0d6273c, a84ed7f)
   - Migrated from Bearer token to cookie-based authentication
   - Added Next.js middleware for session management
   - Updated API tests to reflect new auth approach

3. **Additional Local Changes**
   - Transcript file upload functionality (b32016e)
   - Removed TRIPOD references (88e26e5)
   - Added MCP configuration (2de7be2)

## Branch Analysis

### 1. Priority 1: Push Local Changes to Main
**Action**: Push 5 local commits immediately
**Conflicts**: None expected (ahead of origin/main)
**Command**: `git push origin main`

### 2. Priority 2: Active Codex Branches (27 hours old)

#### a. `codex/review-and-resolve-rls-warnings-from-supabase`
- **Status**: Contains RLS fixes and documentation
- **Key Changes**: 
  - RLS advisor fix and enable script
  - Previously attempted optimization that was rolled back
- **Potential Conflicts**: May conflict with local RLS changes in `enable_rls_security.sql`
- **Action**: Review and cherry-pick non-conflicting improvements

#### b. `codex/review-and-audit-feature-branches`
- **Status**: Audit branch for feature review
- **Action**: Use for reference, then close

### 3. Priority 3: Feature Branches (2 days old)

#### a. `feature/pdf-upload`
- **Status**: PDF upload functionality
- **Potential Conflicts**: May conflict with local transcript upload (b32016e)
- **Action**: Review for additional PDF handling logic

#### b. `feat/system-prompt-editor`
- **Status**: System prompt editing functionality
- **Potential Conflicts**: Low risk
- **Action**: Merge after testing

#### c. `feature/review-analysis`
- **Status**: Review analysis features
- **Potential Conflicts**: Check for API route changes
- **Action**: Test with new auth system

#### d. `fix/api-key-storage`
- **Status**: API key storage fixes
- **Potential Conflicts**: High - may conflict with cookie-based auth
- **Action**: Needs careful review and adaptation

### 4. Priority 4: Older Codex Branches (6-7 days old)
- Various bug fixes and improvements
- Most likely superseded by recent changes
- Action: Review for any missed fixes, then close

## Authentication Audit Requirements

### API Routes Requiring Cookie-Based Auth Update:
1. `/api/admin/*` routes
2. `/api/analyze`
3. `/api/company-types`
4. `/api/extract-pdf`
5. `/api/upload-transcript`
6. `/api/user-api-keys/*`

### Verification Checklist:
- [ ] Remove all Bearer token references
- [ ] Implement cookie validation via middleware
- [ ] Update all API tests
- [ ] Ensure consistent error handling
- [ ] Verify RLS policies work with new auth

## Detailed Conflict Analysis

### RLS Security Conflicts (CRITICAL)
**Local vs Remote RLS Files:**
- **Local**: `enable_rls_security.sql` (comprehensive security update)
- **Remote**: `enable_rls.sql` in `codex/review-and-resolve-rls-warnings-from-supabase`
- **Conflict**: Both files enable RLS on same tables but with different approaches
- **Resolution**: Local file is more comprehensive and includes security comments
- **Action**: Keep local version, merge remote documentation

### Authentication Pattern Conflicts (HIGH PRIORITY)
**Current API Route Status:**
- **Cookie-Based (Correct)**: 4 routes (company-types, user-api-keys GET/POST, analyze, upload-transcript)
- **Bearer Token (Needs Update)**: 6 routes (all admin routes, user-api-keys/[id], extract-pdf)
- **Public (No Auth)**: 1 route (companies)

**Routes Requiring Immediate Update:**
1. `/app/api/admin/users/route.ts` 
2. `/app/api/admin/usage/route.ts`
3. `/app/api/admin/stats/route.ts`
4. `/app/api/extract-pdf/route.ts` (uses custom JWT - highest risk)
5. `/app/api/admin/assign-api-key/route.ts`
6. `/app/api/user-api-keys/[id]/route.ts`

### Branch-Specific Conflicts

#### `fix/api-key-storage` vs Local Auth Changes
- **Risk Level**: HIGH
- **Conflict**: Branch may implement Bearer token auth while local uses cookies
- **Impact**: API key management functionality
- **Resolution Strategy**: Update branch to use cookie-based auth pattern

#### `feature/pdf-upload` vs Local Upload Changes
- **Risk Level**: MEDIUM  
- **Conflict**: Both implement file upload functionality
- **Local Change**: `b32016e feat: Add transcript file upload functionality`
- **Resolution Strategy**: Merge PDF-specific features, avoid duplicate upload logic

#### `codex/review-and-resolve-rls-warnings-from-supabase` vs Local RLS
- **Risk Level**: LOW
- **Conflict**: Different RLS enable scripts
- **Resolution Strategy**: Use local script, adopt remote documentation improvements

## Merge Sequence

### Phase 1: Immediate Actions (Day 1)
1. **Push local commits to origin/main**
   ```bash
   git push origin main
   ```
2. **Create backup branch**
   ```bash
   git checkout -b pre-merge-backup-$(date +%Y%m%d)
   git push origin pre-merge-backup-$(date +%Y%m%d)
   git checkout main
   ```

### Phase 2: Authentication Standardization (Day 1-2)
1. **Update Bearer token routes to cookie-based auth**
   - Priority order: extract-pdf (custom JWT), admin routes, user-api-keys/[id]
   - Test each route after update
   - Verify middleware compatibility

2. **Validate RLS + Cookie Auth Integration**
   - Test all API routes with new auth
   - Verify RLS policies work with cookie sessions
   - Check Supabase logs for auth errors

### Phase 3: Branch Integration (Day 2-3)
1. **Low-Risk Merges First**
   - `feat/system-prompt-editor` (low risk)
   - Verify auth compatibility before merge

2. **Medium-Risk Merges**
   - `feature/review-analysis` 
   - Test thoroughly with cookie-based auth
   - Update any Bearer token usage

3. **High-Risk Merges**
   - `fix/api-key-storage`: Review and update auth pattern
   - `feature/pdf-upload`: Resolve upload functionality conflicts

### Phase 4: RLS Consolidation (Day 3-4)
1. **Merge RLS documentation from remote branch**
2. **Apply local RLS script to production**
3. **Run Supabase RLS advisor verification**
4. **Update RLS policies if needed**

### Phase 5: Cleanup and Verification (Day 4-5)
1. **Delete merged branches**
2. **Close stale codex branches** 
3. **Run comprehensive test suite**
4. **Deploy and monitor**

## Post-Merge Verification

### Security Checklist:
- [ ] All tables have RLS enabled
- [ ] No API routes accept Bearer tokens
- [ ] Cookie-based auth works across all endpoints
- [ ] Admin routes properly secured
- [ ] API key functionality adapted to new auth

### Testing Requirements:
1. Run full test suite: `npm test`
2. Manual testing of:
   - User authentication flow
   - API key management
   - File upload functionality
   - Admin features
3. Verify Supabase RLS advisor shows no warnings

## Risk Mitigation
1. Create full backup before major merges
2. Test each merge in isolated environment
3. Have rollback plan ready
4. Monitor error logs post-deployment

## Timeline
- Day 1: Push local changes, analyze branches
- Day 2: Resolve RLS conflicts, merge low-risk features
- Day 3: Handle complex merges (API keys, upload features)
- Day 4: Cleanup and final testing
- Day 5: Production deployment

## API Route Update Templates

### Cookie-Based Auth Pattern (Use This)
```typescript
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Route logic here
}
```

### Bearer Token Pattern (REPLACE THIS)
```typescript
// ❌ REMOVE - Bearer token authentication
const authHeader = request.headers.get('authorization')
if (!authHeader || !authHeader.startsWith('Bearer ')) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
const token = authHeader.replace('Bearer ', '')
const { data: { user }, error: authError } = await supabase.auth.getUser(token)
```

### Custom JWT Pattern (CRITICAL - REPLACE IMMEDIATELY)
```typescript
// ❌ REMOVE - Custom JWT decoding (SECURITY RISK)
const token = authHeader.split(' ')[1]
const decoded = jwt.decode(token) as any
userId = decoded.sub
```

## Critical Security Notes

1. **RLS + Cookie Auth**: Local changes enable RLS on all tables AND migrate to cookie-based auth - this is the correct security approach per Supabase documentation

2. **Authentication Consistency**: Mixed auth patterns create security vulnerabilities and user experience issues

3. **Admin Route Security**: Admin functionality should use the same secure auth pattern as user routes

4. **JWT Security**: Custom JWT decoding bypasses Supabase security features and should be eliminated immediately

## Context7 Insights Applied

Based on Supabase documentation review:
- Cookie-based auth with `createServerClient` is the recommended approach for Next.js
- RLS policies should use `(select auth.uid())` pattern for optimization
- Middleware should handle session refresh automatically
- `auth.getUser()` is preferred over `auth.getSession()` for security

## Notes
- The duplicate markdown-to-tables branches should be consolidated
- Monitor for any authentication edge cases during rollout  
- Consider implementing automated security scanning post-merge
- Test extensively in development before production deployment
- Document the new authentication pattern for future development