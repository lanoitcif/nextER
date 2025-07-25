# Technical Guide

## 1. System Architecture and Design Patterns

### Frontend
- **Framework**: Next.js 15.4.1 with App Router
- **State**: React useState hooks
- **Styling**: Tailwind CSS with retro CRT color scheme
- **TypeScript**: Strict mode enabled

### Backend
- **Database**: Supabase PostgreSQL with RLS
- **Authentication**: Supabase Auth with JWT for all protected routes
- **API Routes**: Next.js API routes for analysis and management
- **Deployment**: Vercel with auto-deploy from git main branch
- **Production Status**: ✅ LIVE at https://lanoitcif.com

### LLM Integration
- **Providers**: OpenAI, Anthropic, Google, Cohere
- **Models**: Latest 2025 models (GPT-4.1, Claude 4, Gemini 2.5, Command-A-03)
- **Token Limits**: Increased to 16K for long transcripts
- **Cost Tracking**: Full usage logging and estimation

## 2. Database Schema and Management

### Core Tables

- **`user_profiles`**: User accounts and permissions, including roles.
- **`user_api_keys`**: Encrypted API key storage with metadata.
- **`prompts`**: Pre-built analysis templates
- **`usage_logs`**: API usage tracking and cost analytics
- **`system_settings`**: Admin-configurable system-wide settings.

### Industry-Specific Tables (New)

- **`company_types`**: Industry analysis templates with structured metadata (hospitality REIT, airline, credit card, etc.)
- **`companies`**: Company ticker symbol to analysis type mappings
- **`company_prompt_assignments`**: Links companies to their primary and additional analysis types

### Database Consistency Review - July 17, 2025

- **`company_types`**: Fixed `general_analysis` type having NULL values for JSON fields.
- **`prompts`**: Fixed all prompts having NULL `template_variables` field.
- **`company_prompt_assignments`**: Fixed some companies missing "earnings_analyst" assignments.

## 3. UI/UX Design System and Components

This document provides a comprehensive inventory of all UI elements by location throughout the NEaR application to ensure consistency when making aesthetic changes.

### Color Palette Reference
- **Cream Pixel Glow**: `#FAF3E3` / `cream-glow`
- **Sunbleached Coral**: `#F7797D` / `coral`
- **Retro Sunset Gold**: `#F4B860` / `sunset-gold`
- **Pacific Teal Mist**: `#59C9A5` / `teal-mist`
- **Pastel Fuchsia Buzz**: `#D881D4` / `fuchsia-buzz`
- **Cool Grape Static**: `#8D8BE0` / `grape-static`
- **Shadow Grid Charcoal**: `#2C2C32` / `charcoal`

For a full breakdown of all components and their styles, see the `DESIGN_SYSTEM.md` file.

## 4. Development Workflow and Standards

- **Production-Only Development Workflow**: All testing is done on Vercel Production.
- **Git Workflow**: All changes must be committed and pushed to git for testing.
- **Vercel Auto-Deploy**: Provides fast feedback (~30 seconds).
- **Systematic Debugging**: A methodical approach is used to prevent wasted effort on symptoms vs. root cause.

## 5. Testing and Deployment Procedures

- **Testing**: Jest, React Testing Library
- **Deployment**: Vercel/Netlify ready
- **Type checking**: `npm run type-check`
- **Linting**: `npm run lint`
- **Build**: `npm run build`
- **Testing**: `npm test`

## 6. Security Considerations

- **API Key Encryption**: AES-256-GCM for user keys
- **Row Level Security**: Database policies active
- **Authentication**: JWT validation on all protected routes
- **Input Validation**: Zod schemas on API endpoints

### API Key Storage Workflow

```mermaid
sequenceDiagram
    participant User as 👩‍💻 User
    participant Frontend as 🌐 Frontend (Next.js)
    participant Backend as ⚙️ Backend (API Route)
    participant Supabase as 🐘 Supabase

    User->>Frontend: 1. Enters API Key details
    Frontend->>Backend: 2. POST /api/user-api-keys (with JWT)
    Backend->>Supabase: 3. Validates JWT
    Supabase-->>Backend: 4. Returns user
    Backend->>Backend: 5. Encrypts API Key
    Backend->>Supabase: 6. Stores encrypted key in user_api_keys
    Supabase-->>Backend: 7. Confirms storage
    Backend-->>Frontend: 8. Success response
    Frontend-->>User: 9. Displays success message
```

## 7. Performance Optimization

- **Page Load**: Fast (Next.js SSR + Vercel CDN)
- **API Response**: Sub-second for most operations
- **LLM Analysis**: 2-15 seconds depending on provider/model
- **Database Queries**: Optimized, no unnecessary fetches identified
- **Caching & Performance**: Redis Cache, CDN Integration, Load Balancing, and Background Jobs are planned for future enhancements.

## 8. Common Issues and Debugging

### Alt-Tab State Reset Issue
- **Problem**: Analysis types dropdown resets when alt-tabbing away and back
- **Root Cause**: useEffect dependency on `isVisible` causing unnecessary re-renders
- **Solution**: Remove `isVisible` from useEffect dependency arrays
- **Files Affected**: `app/dashboard/page.tsx`, `app/dashboard/analyze/page.tsx`
- **Fixed**: Commit 16e1368

### Dropdown Selection Issues
- **Problem**: Company selection dropdown not populating or resetting
- **Root Cause**: Race condition in onChange handler state management
- **Solution**: Separate typing state from selection state
- **Debugging**: Check console for `fetchCompanyTypes` logs and database query results
- **Fixed**: Commit 4e25658

### Database Connection Issues
- **Problem**: "No analysis types available" error message
- **Debugging Steps**:
  1. Check Supabase connection in browser console
  2. Verify RLS policies allow access to `company_types` table
  3. Check database logs for query errors
  4. Ensure user authentication is valid
- **Common Fix**: Refresh page to re-establish session

### Development Debugging
- **Console Logging**: Extensive logging implemented for analysis flow
- **Company Loading**: Look for "Setting companies: X companies loaded"
- **Analysis Flow**: Track from "Starting analysis..." through session checks
- **API Requests**: Monitor Vercel function logs for backend processing
- **Database Queries**: Look for timing logs and query result objects

### Recent Production Fixes (July 25, 2025)
- **Next.js 15 Migration**: Resolved async cookies and params API changes
- **supabaseAdmin Import**: Fixed missing import causing TypeScript compilation errors
- **Environment Variables**: Synchronized Vercel environment with local development
- **Build Process**: All builds now successful in production environment
- **Deployment**: Auto-deploy working correctly from main branch

## 9. Essential Tools and Usage Guide

### Vercel CLI Tools
**Installation**: `sudo npm install -g vercel`
**Authentication**: `vercel login` (use email: john@151westmain.com)

**Key Commands Used:**
```bash
# Link project to Vercel
vercel link --yes

# List deployments
vercel ls

# Deploy to production
vercel --prod

# View logs for specific deployment
vercel logs <deployment-url>

# Pull environment variables
vercel env pull .env.vercel

# List environment variables
vercel env ls

# Add environment variable
vercel env add <VAR_NAME> production
```

### Supabase MCP Tools
**Critical for database operations and debugging:**

```python
# Get project configuration
mcp__supabase__get_project_url()
mcp__supabase__get_anon_key()

# Execute SQL queries (for debugging RLS policies)
mcp__supabase__execute_sql(query="SELECT * FROM pg_policies WHERE tablename = 'user_profiles'")

# Apply migrations (for fixing RLS issues)
mcp__supabase__apply_migration(
    name="fix_user_profiles_rls_recursion",
    query="DROP POLICY IF EXISTS admin_all_access ON user_profiles..."
)

# Get service logs
mcp__supabase__get_logs(service="auth")  # auth, api, postgres

# Search documentation
mcp__supabase__search_docs(graphql_query="query { searchDocs(query: 'authentication') { ... } }")
```

### Context7 Integration
**For researching best practices and debugging patterns:**

```python
# Find library documentation
mcp__context7__resolve-library-id(libraryName="supabase auth")

# Get specific documentation
mcp__context7__get-library-docs(
    context7CompatibleLibraryID="/supabase/auth",
    topic="session errors and authentication debugging",
    tokens=8000
)
```

### Git Workflow Commands
```bash
# Check status
git status

# Stage files
git add <file>

# Commit with detailed message
git commit -m "$(cat <<'EOF'
type: description

- Bullet point details
- More details

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"

# Push to remote
git push origin main
```

### Debugging Authentication Issues

**1. RLS Policy Investigation:**
```sql
-- Check for circular references
SELECT schemaname, tablename, policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'user_profiles' 
ORDER BY policyname;
```

**2. Session Error Debugging:**
- Check Vercel environment variables match local
- Verify Supabase service role key is set
- Look for `SecretSessionError` in logs

**3. Code 42P17 (Undefined Column):**
```sql
-- Check table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
ORDER BY ordinal_position;
```

### Environment Variables Management

**Critical Variables for Production:**
- `USER_API_KEY_ENCRYPTION_SECRET` - Must be exactly 32 characters
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (keep secret!)

**Sync Check:**
```bash
# Pull from Vercel
vercel env pull .env.vercel

# Compare with local
diff .env .env.vercel
```

### Troubleshooting Build Issues

**TypeScript Errors:**
```bash
# Check types locally
npm run type-check

# Full build test
npm run build
```

**Next.js 15 Specific Fixes:**
- Remove `await` from `createClient()` calls
- Add `await` to `cookies()` calls
- Update route handlers: `params: Promise<{ id: string }>`
