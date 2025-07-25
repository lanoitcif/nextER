# NextER Troubleshooting Guide

## Quick Reference for Common Issues

### 🔴 Current Active Issues (July 25, 2025)

#### Login Authentication Errors
**Symptoms:**
- SecretSessionError: "encrypt without session key"
- Code 42P17: PostgreSQL undefined column error
- User profile fetching fails

**Investigation Steps:**
1. Check Vercel logs: `vercel logs <deployment-url>`
2. Check Supabase auth logs: `mcp__supabase__get_logs(service="auth")`
3. Verify RLS policies: Already fixed infinite recursion issue

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

1. Fix login authentication errors
2. Investigate session key management
3. Resolve code 42P17 column errors
4. Test full user authentication flow

Remember: Always check build status at https://vercel.com/lanoitcifs-projects/next-er