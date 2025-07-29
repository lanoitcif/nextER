# Claude Memory: NEaR Project Context

**Last Updated**: July 29, 2025 (Evening)  
**Project**: NEaR (Next Earnings Release) - LLM-powered earnings call analysis platform
**Production URL**: https://lanoitcif.com
**Build Status**: ✅ SUCCESSFUL
**Code Quality**: Good overall with technical debt in analyze component (1845 lines)

## 🎉 RECENT ACCOMPLISHMENTS (July 29, 2025)

### Export Functionality Enhancement - COMPLETED ✅
- **Dual Export Options**: Added HTML export alongside Word export
- **Mobile Compatibility**: Implemented .doc format for better mobile support
- **Features**: Both exports preserve formatting (tables, headings, lists)
- **HTML Export**: Universal compatibility with inline CSS
- **Status**: Both export options fully functional in production

### Comprehensive Codebase Analysis - COMPLETED ✅
- **Scope**: Full project analysis including architecture, security, performance
- **Critical Issues Found**: Android upload, security settings, RLS performance
- **Technical Debt**: Large analyze component (1845 lines), limited test coverage
- **Positive Findings**: Good TypeScript usage, proper encryption, clean architecture

### Build Process Fixes - RESOLVED ✅
- **TypeScript Errors**: Fixed null check for `state.selectedCompany.primary_company_type_id`
- **Supabase Client**: Fixed missing cookieStore parameter in createClient
- **Dependencies**: Added missing pdf-parse, mammoth, @types/pdf-parse
- **Result**: Successful Vercel deployment after multiple failed attempts

### Security Improvements - COMPLETED ✅
- **Issue**: Sensitive mcp.json file containing API keys was in repository
- **Fix**: Removed file and updated .gitignore
- **Prevention**: Future secret exposure prevented

### File Parsing - FUNCTIONAL ✅
- **PDF/DOCX Upload**: Now working with proper text extraction libraries
- **Desktop**: Fully functional
- **Mobile**: Android Chrome still showing endless loading (known issue)

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

## ✅ CURRENT FEATURE STATUS (July 29, 2025)

### Working Features
- ✅ Authentication with session management
- ✅ Admin panel with API key assignment
- ✅ All LLM providers (OpenAI, Anthropic, Google, Cohere)
- ✅ Company search with auto-complete
- ✅ Analysis type selection (automatic based on company)
- ✅ Transcript feedback system (thumbs up/down)
- ✅ Analysis history with search/filter
- ✅ Professional Word document export (.docx)
- ✅ File upload (PDF/DOCX/TXT) on desktop

### Known Issues (Updated Evening July 29)
- ⚠️ Android file upload broken (Chrome shows endless loading)
- ⚠️ Supabase security settings need update (OTP expiry 7 days, password protection off)
- ⚠️ RLS circular dependencies causing performance issues
- ⚠️ iPhone Word export compatibility (.doc files)
- ⚠️ Occasional alt-tab loading screen
- ⚠️ RLS performance warnings (16 auth.uid() re-evaluations)
- ⚠️ Multiple permissive policy warnings (44 duplicate policies)

## 🎯 IMMEDIATE PRIORITIES (Updated Evening July 29)

### 1. Fix Android File Upload (Critical)
- User-facing issue affecting mobile users
- Chrome mobile shows endless loading
- Requires client-side debugging

### 2. Update Supabase Security Settings (High)
- Change OTP expiry from 7 days to reasonable duration
- Enable leaked password protection
- Review other security settings

### 3. Fix RLS Circular Dependencies (High)
- Causing performance degradation
- Affects scalability
- Need to refactor policies

### 4. Refactor Analyze Component (Medium)
- Split 1845-line file into smaller components
- Improve maintainability
- Enable better testing

### 5. Add Comprehensive Testing (Medium)
- Currently only 5 test files
- Need unit and integration tests
- Achieve >80% coverage mandate

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

## 🎯 RECENT UX IMPROVEMENTS (July 2025)

**Major Changes**: Analysis Type workflow simplification + File upload implementation

### Analysis Type Simplification
- ❌ **Removed**: Analysis Type dropdown (caused user friction)
- ✅ **Automated**: Uses `company.primary_company_type_id` automatically
- 📈 **Result**: 20% reduction in user workflow steps

### File Upload System
- 📁 **Formats**: PDF, DOC, DOCX, TXT (10MB limit)
- 🔧 **Libraries**: `pdf-parse`, `mammoth` for server-side processing
- 🎨 **UX**: Drag-and-drop with visual feedback
- 🔗 **Integration**: Supplements existing textarea (progressive enhancement)

**Key Files**:
- `components/FileUpload.tsx` - React component
- `app/api/extract-text/route.ts` - Text extraction API
- `docs/JULY_2025_UX_IMPROVEMENTS.md` - Complete documentation

### UX Lessons Learned
1. **Eliminate steps that don't add user value** - Technical requirements ≠ User needs
2. **Progressive enhancement** - Add capabilities, don't replace workflows
3. **Leverage existing data relationships** - Simplify state management
4. **Server-side file processing** - Security and consistency over client convenience

## 📚 QUICK REFERENCE LINKS

- **Database Linter**: https://supabase.com/dashboard/project/xorjwzniopfuosadwvfu/database/linter
- **Documentation**: See `docs/DOCUMENTATION_INDEX.md`
- **Troubleshooting**: See `docs/TROUBLESHOOTING.md`
- **DB Admin Guide**: See `docs/DATABASE_ADMIN.md`
- **UX Improvements**: See `docs/JULY_2025_UX_IMPROVEMENTS.md`

---

**Remember**: This project is production-ready with active users. Always test in development environment first, especially for database and authentication changes.
