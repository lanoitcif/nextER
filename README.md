# NextER (NEaR) - Next Earnings Release

A sophisticated SaaS platform for AI-powered earnings call transcript analysis with multi-LLM support and industry-specific templates.

## 🚧 Development Status
**This project is production ready with core functionality complete. Continuous improvements being made.**

## 📚 Documentation

### Core Documentation
*   **[Development Status](DEVELOPMENT_STATUS.md)**: Current status, known issues, troubleshooting, and technical reference
*   **[Project Documentation](DOCUMENTATION.md)**: Complete technical architecture and API reference
*   **[Claude Context](CLAUDE.md)**: AI assistant context and development standards

### Additional Guides
*   **[API Documentation](docs/API.md)**: A comprehensive guide to the project's API.
*   **[Deployment Guide](docs/DEPLOYMENT.md)**: Instructions for deploying the application.
*   **[Development Guide](docs/DEVELOPMENT.md)**: Information about the project's development process.
*   **[UI Element Inventory](docs/INVENTORY.md)**: A list of all the UI elements in the application.
*   **[Enhancement Roadmap](docs/ENHANCEMENT_ROADMAP.md)**: The future direction of the project.
*   **[Decisions Log](docs/DECISIONS_LOG.md)**: A log of all the major decisions made during the development of the project.
*   **[Competitive Analysis](docs/COMPETITIVE_ANALYSIS.md)**: An analysis of the competitive landscape.
*   **[Areas of Improvement](docs/AoI.MD)**: A plan for improving the project's documentation.
*   **[Design Guide](docs/VIBE.md)**: A guide to the project's aesthetic.
*   **[Archived Documents](docs/archive/)**: A collection of historical documents, including the `TRIPOD` framework and debugging logs.

## 🚀 Features

- **Multiple LLM Providers**: OpenAI, Anthropic, Google, and Cohere integration
- **Industry-Specific Analysis**: Specialized templates for hospitality REITs, airlines, credit cards, luxury retail, and more
- **Company Ticker Integration**: Automatic analysis type selection based on ticker symbols (e.g., DAL → airline analysis)
- **Structured Output Formats**: Industry-specific tables and metrics for consistent analysis
- **Pre-built Analysis Types**: Meeting summaries, interview analysis, sentiment analysis, sales call insights
- **Secure API Key Management**: AES-256-GCM encryption for user API keys
- **Flexible Key Sources**: System-provided keys or user's own API keys
- **Usage Tracking**: Cost estimation and analytics
- **User-Friendly Interface**: Clean, responsive design for non-technical users
- **Admin Dashboard**: Manage users and system settings.

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **Authentication**: Supabase Auth
- **Deployment**: Vercel/Netlify ready
- **Testing**: Jest, React Testing Library

## 📋 Prerequisites

- Node.js 18+
- Supabase account and project
- At least one LLM provider API key

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd nexter
npm install
```

### 2. Database Setup

1. Create a Supabase project
2. Run the SQL schema from `supabase_schema.sql` in your Supabase SQL Editor

### 3. Environment Configuration

Create `.env.local` with these variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Encryption Secret (32 characters)
USER_API_KEY_ENCRYPTION_SECRET=your_32_character_encryption_key

# LLM Provider Keys (at least one required)
OWNER_OPENAI_API_KEY=sk-your_openai_key
OWNER_ANTHROPIC_API_KEY=sk-ant-your_anthropic_key
OWNER_GOOGLE_API_KEY=your_google_key
OWNER_COHERE_API_KEY=your_cohere_key

# Authentication
NEXTAUTH_SECRET=your_random_secret
NEXTAUTH_URL=http://localhost:3000
```

### 4. Generate Encryption Key

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64').slice(0, 32))"
```

### 5. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

## 🏗️ Project Structure

```
├── app/
│   ├── api/                 # API endpoints
│   │   ├── analyze/         # Main transcript analysis
│   │   └── user-api-keys/   # API key management
│   ├── auth/               # Login/signup pages
│   ├── dashboard/          # Main application
│   └── page.tsx            # Landing page
├── lib/
│   ├── auth/               # Authentication context
│   ├── crypto.ts           # Encryption utilities
│   ├── llm/                # LLM provider clients
│   └── supabase/           # Database client
└── supabase_schema.sql     # Database schema
```

## 🔒 Security Features

- **Encrypted API Keys**: AES-256-GCM encryption at rest
- **Row Level Security**: Database-level access controls for users and admins.
- **Session Management**: Secure JWT authentication
- **No Key Exposure**: API keys never sent to client
- **Input Validation**: All API endpoints validate inputs using Zod.

## 📊 Database Schema

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

## 🔧 API Endpoints

### `POST /api/analyze`
Main transcript analysis endpoint
- Accepts transcript text and analysis parameters
- Routes to appropriate LLM provider
- Logs usage and estimates costs

### `GET/POST /api/user-api-keys`
API key management
- Add new encrypted keys
- Retrieve user's saved keys (metadata only)

### `PUT/DELETE /api/user-api-keys/[id]`
- Update or delete a specific API key.

## 📱 User Workflow

1. **Sign Up**: Create account with email/password
2. **API Keys**: Add personal keys or use system keys (if authorized)
3. **Analyze**: Paste transcript → select analysis type → get insights
4. **Manage**: View usage statistics and manage API keys

## 🚀 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Connect repository to Vercel
3. Configure environment variables
4. Deploy automatically

### Other Platforms

Compatible with Netlify, Railway, Render, AWS Amplify, or self-hosted.

## 👥 User Management

### Standard Users
- Use their own API keys
- Access all analysis features
- View personal usage statistics

### Owner Key Users
Grant access via database:
```sql
UPDATE user_profiles 
SET can_use_owner_key = true 
WHERE email = 'user@company.com';
```

### Admins
Grant access via database:
```sql
UPDATE user_profiles
SET role = 'admin'
WHERE email = 'admin@example.com';
```

## 🔧 Customization

### Add Analysis Prompts
```sql
INSERT INTO public.prompts (name, display_name, description, system_prompt, category) 
VALUES (
  'custom_analysis',
  'Custom Analysis',
  'Description of analysis',
  'System prompt text...',
  'custom'
);
```

### Add Company Types
```sql
INSERT INTO public.company_types (id, name, description, system_prompt_template, classification_rules, key_metrics, output_format) 
VALUES (
  'industry_id',
  'Industry Name',
  'Description of industry analysis',
  'Role: {role}...',
  '{"primary_topics": ["Topic1", "Topic2"]}',
  '{"operating_performance": ["Metric1", "Metric2"]}',
  '{"quarterly_highlights": ["Metric1", "Metric2"]}'
);
```

### Add Companies
```sql
INSERT INTO public.companies (ticker, name, primary_company_type_id, additional_company_types) 
VALUES ('TICK', 'Company Name', 'industry_id', ARRAY['additional_type']);
```

### Add LLM Provider
1. Implement client in `lib/llm/clients.ts`
2. Add to `SUPPORTED_PROVIDERS` array
3. Update environment variables

## 🧪 Development

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Build
npm run build

# Testing
npm test
```

## 🆘 Troubleshooting

### Common Issues

**Company Search Not Working**
- Company dropdown not appearing: Check that companies are loaded (console logs show "Setting companies: X companies loaded")
- "No companies found" error: Verify database has active companies (`SELECT * FROM companies WHERE is_active = true`)
- Analysis types not loading: Check Row Level Security policies allow public access to `company_types` table

**Browser Extension Interference**
- LLM analysis requests hanging: Try incognito/private browsing mode to disable extensions
- JavaScript errors in console: Password managers and other extensions can interfere with fetch requests
- Page not loading properly: Disable browser extensions or use private browsing

**Session/Authentication Issues**
- "Session check timeout" errors: Common in some browser configurations, app includes fallback handling
- Analysis hanging at "Getting session...": Implemented 3-second timeout with auth context fallback
- 401 errors on API requests: Verify SUPABASE_SERVICE_ROLE_KEY is set in Vercel environment variables

**Database Connection**
- Verify Supabase credentials in environment variables
- Ensure schema is applied with proper RLS policies
- Check that both anon key and service role key are configured

**API Key Management**
- Ensure encryption secret is exactly 32 characters
- Owner API keys require OWNER_[PROVIDER]_API_KEY environment variables
- User saved keys require ENCRYPTION_KEY for decryption

**LLM API Errors**
- Verify API keys and credits/quotas
- Check provider status and rate limits
- Monitor Vercel function logs for detailed error messages

**Build/Deployment Issues**
- TypeScript errors: All callback functions need explicit type annotations
- Next.js cache issues: Clear .next folder and rebuild
- Vercel deployment: Check build logs for compilation errors

## 📈 Monitoring

- Check `usage_logs` table for analytics
- Monitor costs by provider
- Review user activity patterns
- Track API response times

## 🔮 Future Enhancements

- Batch processing for multiple transcripts
- Custom user prompts
- Team collaboration features
- Integration with meeting platforms
- Mobile applications
- Advanced analytics dashboard

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new features
4. Submit a pull request

---

**Status**: Production Ready - Core functionality working, admin features complete
**Last Updated**: 2025-07-28 (Authentication & session management fixes deployed)
**Production URL**: https://lanoitcif.com
**Build Status**: ✅ SUCCESSFUL

## 🔧 Recent Fixes & Improvements

### Fixed Issues (July 2025)
- ✅ **Company Search**: Fixed company loading with proper authentication and RLS policy compliance
- ✅ **Company Types**: Resolved analysis type dropdown population with timeout handling
- ✅ **Dropdown Visibility**: Fixed exact match auto-selection keeping dropdown visible
- ✅ **Browser Extension Compatibility**: Added error handling for extension interference
- ✅ **Session Management**: Implemented timeouts and fallbacks for authentication edge cases
- ✅ **TypeScript Compilation**: Fixed type annotations for Next.js 15 build compatibility
- ✅ **Debugging Infrastructure**: Added comprehensive logging throughout the application
- ✅ **Retro CRT Design**: Implemented comprehensive retro color palette across all pages
- ✅ **Analysis Dropdown Persistence**: Fixed state reset bug causing dropdown to break after alt-tabbing
- ✅ **Admin UI Contrast**: Resolved bright white text issues in admin pages
- ✅ **Long Transcript Support**: Increased token limits to 16K for handling 30+ page transcripts
- ✅ **Admin API Key Management**: Complete system for assigning keys with default models to users
- ✅ **Production Build Issues**: Resolved Next.js 15 migration issues and environment configuration
- ✅ **supabaseAdmin Import Error**: Fixed missing import causing TypeScript compilation failures
- ✅ **File Upload (Desktop)**: Resolved issue where PDF/DOCX/TXT file uploads would sometimes hang or show a lag before displaying text on desktop browsers.
- ✅ **Loading Screen Bug**: Fixed issue where the application would get stuck on a 'loading' screen after minimizing and restoring the browser, particularly after an analysis.
- ✅ **JSONEditor System Prompt Error**: Fixed admin page error where JSONEditor expected object/array but received plain text (July 28)
- ✅ **Login Loading Stuck**: Resolved issue requiring cookie clearing to login - added session corruption recovery (July 28)
- ✅ **Visibility Change State Reset**: Fixed analysis results being reset when taking screenshots or switching tabs (July 28)

### Known Limitations
- Session timeout handling in some browser configurations (fallbacks implemented)
- Browser extensions may interfere with fetch requests (use incognito mode as workaround)
- Build requires explicit TypeScript types for all callback functions

### Current Known Issues (July 28, 2025)
- 🔴 **File Upload (Android)**: File uploads from Android devices (specifically Chrome browser) still result in a 'loading' state with no progress. The request does not appear to reach the backend. Further investigation required with client-side debugging.
- **Debugging**: Use `vercel logs <deployment-url>` and Supabase MCP tools for investigation

### Recently Fixed (July 28, 2025)
- ✅ **Authentication Issues**: Fixed login stuck on loading, session corruption, and visibility change problems
- ✅ **Admin Features**: Resolved JSONEditor system prompt editing error

### Development Debugging
- Console logs extensively document the application flow
- Company loading: Look for "Setting companies: X companies loaded"
- Analysis flow: Track from "Starting analysis..." through session checks
- API requests: Monitor Vercel function logs for backend processing