# Claude Memory: NEaR Project Context

**Last Updated**: January 29, 2025  
**Project**: NEaR (Next Earnings Release) - LLM-powered earnings call analysis platform

## 🚨 CRITICAL RECENT FIXES (January 2025)

### Authentication Issue - RESOLVED ✅
- **Problem**: Production login failures due to server-side Supabase client using anon key instead of service role key
- **Fix Applied**: `lib/supabase/server.ts:9` now uses `SUPABASE_SERVICE_ROLE_KEY` (commit `a9fa4a8`)
- **Status**: Fixed and deployed

### RLS Performance Optimization - FAILED ❌
- **Attempted**: Wrapping `auth.uid()` calls in subqueries `(SELECT auth.uid())`
- **Result**: Caused 500 errors across all endpoints
- **Rollback**: Applied immediately (commit `82c9e3d`)
- **Root Cause**: Multiple duplicate RLS policies + subquery optimization created conflicts

## 🔄 RECENT FEATURE ADDITIONS (July 2025)

### Default Analyst Auto-Selection - RESOLVED ✅
**Problem**: Primary analyst wasn't populating after company selection
**Root Cause**: React state timing issues in `fetchCompanyTypes` function
**Solution Implemented**:
- Added setTimeout for proper state update timing
- Implemented backup useEffect for redundant auto-selection
- Enhanced state cleanup during company transitions
- Added visual indicators for auto-selected analysts

**Files Modified**: `app/dashboard/analyze/page.tsx`

### API Key Storage Issue - IDENTIFIED ⚠️
- Frontend expects `preferred_model` field for each API key
- Database table `user_api_keys` is missing this column
- Backend API routes don't handle preferred_model storage/retrieval

## 🛠️ DATABASE ADMINISTRATION TOOLS

### Supabase CLI Setup
**Project**: `xorjwzniopfuosadwvfu`
**URL**: `https://xorjwzniopfuosadwvfu.supabase.co`

```bash
# Quick setup commands
export SUPABASE_PROJECT_REF="xorjwzniopfuosadwvfu"
export SUPABASE_URL="https://xorjwzniopfuosadwvfu.supabase.co"

# Common inspection commands
supabase db inspect cache-hit --project-ref $SUPABASE_PROJECT_REF
supabase db inspect unused-indexes --project-ref $SUPABASE_PROJECT_REF
supabase db inspect outliers --project-ref $SUPABASE_PROJECT_REF
```

### Performance Issues Identified
1. **16 Auth RLS warnings** - `auth.uid()` re-evaluates per row
2. **44 Multiple permissive policy warnings** - Duplicate policies
3. **3 Unindexed foreign keys** - Need indexes on:
   - `prompts.company_type_id`
   - `usage_logs.prompt_id` 
   - `user_api_keys.admin_assigned_by`
4. **2 Unused indexes** - Candidates for removal

## 📁 PROJECT STRUCTURE & DOCUMENTATION

### Key Files
- `lib/supabase/server.ts` - **CRITICAL**: Must use service role key
- `lib/supabase/client.ts` - Client-side Supabase config
- `docs/DATABASE_ADMIN.md` - Comprehensive DB admin guide
- `docs/TROUBLESHOOTING.md` - Updated with auth fixes
- `rls_performance_analysis.md` - RLS optimization lessons learned

### Documentation Status - NEEDS CLEANUP ⚠️
**Note**: Documentation cleanup was planned but appears incomplete
- Multiple .md files exist that should have been consolidated
- Remote branch shows different documentation structure than local
- Need to reconcile documentation strategy and complete cleanup

## 🔧 DEVELOPMENT ENVIRONMENT

### Tech Stack
- **Framework**: Next.js 15.0.3 with App Router
- **Database**: Supabase PostgreSQL with RLS
- **Authentication**: Supabase Auth (JWT)
- **Deployment**: Vercel (auto-deploy from main branch)
- **Styling**: Tailwind CSS with retro CRT theme

### Environment Variables
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xorjwzniopfuosadwvfu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
USER_API_KEY_ENCRYPTION_SECRET=LuoKK+0+uUk9hvBlfAZPVt0MgvQCtPMq
```

### Available Scripts
```bash
npm run dev          # Development server
npm run build        # Production build
npm run type-check   # TypeScript validation
npm test            # Jest tests
npm run lint        # ESLint
```

## 🎯 IMMEDIATE PRIORITIES

### Database Performance (Phase 1 - Low Risk)
```sql
-- Add missing foreign key indexes
CREATE INDEX idx_prompts_company_type_id ON prompts(company_type_id);
CREATE INDEX idx_usage_logs_prompt_id ON usage_logs(prompt_id);
CREATE INDEX idx_user_api_keys_admin_assigned_by ON user_api_keys(admin_assigned_by);

-- Remove unused indexes (after confirmation)
DROP INDEX IF EXISTS idx_user_api_keys_provider;
DROP INDEX IF EXISTS idx_companies_primary_type;
```

### Documentation Cleanup (Phase 2)
- Complete planned documentation consolidation
- Resolve conflicting .md file structures
- Establish clear documentation strategy

### RLS Policy Cleanup (Phase 3 - Medium Risk)
- Remove duplicate policies before attempting subquery optimization
- Test one table at a time in development environment

## 🚫 WHAT NOT TO DO

### Authentication
- ❌ Never use `NEXT_PUBLIC_SUPABASE_ANON_KEY` in server-side clients
- ❌ Always verify `lib/supabase/server.ts` uses service role key

### RLS Optimization  
- ❌ Don't attempt `(SELECT auth.uid())` subquery optimization until duplicate policies are cleaned up
- ❌ Never apply RLS changes directly to production without development testing

### Database Administration
- ❌ Don't use MCP Supabase server for admin tasks (use Supabase CLI instead)
- ❌ Don't manually execute SQL without proper migration management

## 📊 MONITORING & HEALTH CHECKS

### Key Metrics
- **Cache Hit Rate**: Should be > 99% (use `supabase db inspect cache-hit`)
- **Authentication**: Monitor login success rates after deployments
- **Query Performance**: Watch for queries > 2s execution time

### Health Check Commands
```bash
# Quick health check
supabase db inspect cache-hit --project-ref $SUPABASE_PROJECT_REF
supabase db inspect long-running-queries --project-ref $SUPABASE_PROJECT_REF

# Performance analysis
supabase db inspect outliers --project-ref $SUPABASE_PROJECT_REF
supabase db inspect seq-scans --project-ref $SUPABASE_PROJECT_REF
```

## 🔄 DEPLOYMENT PROCESS

1. **Local Development**: Test all changes locally
2. **Type Check**: Run `npm run type-check` 
3. **Lint**: Run `npm run lint`
4. **Commit**: Use descriptive commit messages
5. **Auto-Deploy**: Vercel deploys automatically from main branch
6. **Health Check**: Verify authentication and basic functionality

## 📚 QUICK REFERENCE LINKS

- **Database Linter**: https://supabase.com/dashboard/project/xorjwzniopfuosadwvfu/database/linter
- **Documentation**: See `docs/DOCUMENTATION_INDEX.md`
- **Troubleshooting**: See `docs/TROUBLESHOOTING.md`
- **DB Admin Guide**: See `docs/DATABASE_ADMIN.md`

---

**Remember**: This project is production-ready with active users. Always test in development environment first, especially for database and authentication changes.
