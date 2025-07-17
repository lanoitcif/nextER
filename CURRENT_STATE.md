# NEaR Platform Current State

## System Status
**Last Updated**: 2025-01-17 18:30 UTC  
**Environment**: Vercel Production  
**Branch**: main (commit: 6ec1a5f)  
**Deployment Status**: ✅ Live and accessible

## Active Issues

### 🔴 **CRITICAL: Dropdown Selection Not Working**
- **Location**: `app/dashboard/analyze/page.tsx`
- **Symptom**: User can search companies, see dropdown, but cannot click to select
- **Status**: Debugging phase - debugger statements deployed to production
- **Next Step**: User testing to confirm if click handlers fire

### 🟡 **MONITORING: Alt-Tab Behavior**
- **Location**: Same file as above
- **Status**: Fixed race conditions, removed isVisible dependency
- **Verification**: Pending user confirmation

## Working Features ✅

### Core Functionality
- ✅ **User Authentication**: Supabase Auth working correctly
- ✅ **LLM Analysis**: All 4 providers (OpenAI, Anthropic, Google, Cohere) functional
- ✅ **Company Database**: 11 companies loaded successfully
- ✅ **Company Types**: Analysis templates loading correctly
- ✅ **Admin Dashboard**: Full functionality including API key assignment
- ✅ **API Key Management**: Owner, user-saved, temporary, admin-assigned keys
- ✅ **PDF Processing**: API endpoint ready for file uploads

### Recent Fixes Applied
- ✅ **Admin UI Contrast**: Fixed bright white text in admin forms
- ✅ **Race Conditions**: Combined useEffects to prevent provider conflicts
- ✅ **Documentation**: Complete competitive analysis and roadmap
- ✅ **Git Workflow**: All changes committed and deployed to production

## Technical Architecture

### Frontend
- **Framework**: Next.js 15.0.3 with App Router
- **State**: React useState hooks
- **Styling**: Tailwind CSS with retro CRT color scheme
- **TypeScript**: Strict mode enabled

### Backend
- **Database**: Supabase PostgreSQL with RLS
- **Authentication**: Supabase Auth with JWT
- **API Routes**: Next.js API routes for analysis and management
- **Deployment**: Vercel with auto-deploy from git main branch

### LLM Integration
- **Providers**: OpenAI, Anthropic, Google, Cohere
- **Models**: Latest 2025 models (GPT-4.1, Claude 4, Gemini 2.5, Command-A-03)
- **Token Limits**: Increased to 16K for long transcripts
- **Cost Tracking**: Full usage logging and estimation

## User Flow Status

### ✅ **Working Paths**
1. User registration/login → ✅ Working
2. Admin dashboard access → ✅ Working  
3. API key management → ✅ Working
4. Company data loading → ✅ Working
5. LLM analysis execution → ✅ Working

### 🔴 **Broken Paths**
1. Company search → Company selection → **BLOCKED HERE**
2. Analysis type dropdown → **Cannot reach due to #1**

## Database State

### Companies Table
- **Count**: 11 active companies
- **Sample**: DAL, HST, AXP, PEB, DRH, LVMH, HLT, MAR, ABNB, PK, RHP
- **Status**: All companies loading correctly with proper company types

### Company Types Table  
- **Count**: Multiple analysis types including default "General Analysis"
- **Status**: Successfully loading and auto-selecting primary types
- **Templates**: Industry-specific prompts working

### User Management
- **Authentication**: Working via Supabase
- **Profiles**: User profiles and admin flags functional
- **API Keys**: All key types (owner, user, admin-assigned) working

## Development Environment

### Production Testing Workflow
1. **Code Changes** → Git commit → Git push
2. **Vercel Auto-Deploy** → ~30 seconds deployment time
3. **Live Testing** → User tests on production site
4. **Issue Reporting** → Back to step 1

### Current Debugging Setup
- **Enhanced Logging**: Distinctive console messages for programmatic vs user actions
- **Debugger Statements**: Added to `handleCompanySelect` function
- **Event Handler Verification**: Click handlers confirmed attached to DOM elements

## Security Status
- ✅ **API Key Encryption**: AES-256-GCM for user keys
- ✅ **Row Level Security**: Database policies active
- ✅ **Authentication**: JWT validation on all protected routes
- ✅ **Input Validation**: Zod schemas on API endpoints

## Performance Metrics
- **Page Load**: Fast (Next.js SSR + Vercel CDN)
- **API Response**: Sub-second for most operations
- **LLM Analysis**: 2-15 seconds depending on provider/model
- **Database Queries**: Optimized, no unnecessary fetches identified

## Known Limitations
- **Browser Extensions**: May interfere with fetch requests (use incognito workaround)
- **Session Timeouts**: Fallback handling implemented for edge cases
- **TypeScript**: Requires explicit callback function types for builds

## Emergency Procedures
- **Rollback**: Revert git commit and push to trigger re-deployment
- **Database Issues**: Supabase dashboard access for direct intervention
- **API Outages**: Multiple LLM providers provide redundancy

---

**This document is automatically updated with each significant system change.**  
**For real-time status, check latest git commits and Vercel deployment logs.**