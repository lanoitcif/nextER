# LLM Transcript Analyzer

A powerful SaaS web application for analyzing transcripts using multiple AI providers with secure API key management and industry-specific analysis templates.

## 🚧 Development Status
**This project is currently in active development. Features and documentation may change.**

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

1. Create a Supabase project at `https://xorjwzniopfuosadwvfu.supabase.co`
2. Run the SQL schema from `supabase_schema.sql` in your Supabase SQL Editor

### 3. Environment Configuration

Create `.env.local` with these variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xorjwzniopfuosadwvfu.supabase.co
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
5. After any completion of code updates, we need to push to git for this project so that Vercel updates automatically.

## 🔍 Lessons Learned (January 2025)

### Critical Authentication Issue
- **Problem**: Server-side Supabase client accidentally configured with anon key instead of service role key
- **Impact**: Complete production authentication failure 
- **Root Cause**: `lib/supabase/server.ts` using `NEXT_PUBLIC_SUPABASE_ANON_KEY` instead of `SUPABASE_SERVICE_ROLE_KEY`
- **Prevention**: Always verify Supabase client configurations use appropriate keys for their context

### RLS Performance Optimization 
- **Attempted**: Wrapping `auth.uid()` in subqueries `(SELECT auth.uid())` for performance
- **Result**: Caused 500 errors across all affected endpoints
- **Hypothesis**: Multiple duplicate policies + subquery optimization created conflicts
- **Current Status**: Optimization reverted, duplicate policies remain (performance warnings persist)
- **Future Approach**: Clean up duplicate RLS policies before attempting subquery optimization

## 🚀 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Connect repository to Vercel
3. Configure environment variables
4. Deploy automatically

### Other Platforms

Compatible with Netlify, Railway, Render, AWS Amplify, or self-hosted.

## 👥 User Management

### Access Levels
Users now have an `access_level`:

- **basic** – can use admin assigned keys but cannot manage their own
  keys.
- **advanced** – may add personal API keys in addition to any assigned
  by an admin.
- **admin** – full administrative privileges.

Change a user's level via the admin dashboard or SQL:
```sql
UPDATE user_profiles
SET access_level = 'advanced'
WHERE email = 'user@company.com';
```

Admins can assign API keys directly to users and manage system settings.

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

### Traditional Development
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

### ⚠️ Deprecated: Multi-Agent Development

**Note**: The Agent-MCP multi-agent development framework has been deprecated as of July 2025. This section is kept for historical reference only.

For development, use standard single-agent workflows with Claude Code or similar tools.

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new features
4. Submit a pull request