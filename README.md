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

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **Authentication**: Supabase Auth
- **Deployment**: Vercel/Netlify ready

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
- **Row Level Security**: Database-level access controls
- **Session Management**: Secure JWT authentication
- **No Key Exposure**: API keys never sent to client

## 📊 Database Schema

### Core Tables

- **`user_profiles`**: User accounts and permissions
- **`user_api_keys`**: Encrypted API key storage with metadata
- **`prompts`**: Pre-built analysis templates
- **`usage_logs`**: API usage tracking and cost analytics

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
```

## 🆘 Troubleshooting

### Common Issues

**Database Connection**
- Verify Supabase credentials
- Ensure schema is applied

**API Key Encryption**
- Ensure encryption secret is exactly 32 characters
- Regenerate if needed

**LLM API Errors**
- Verify API keys and credits
- Check provider status

**Authentication**
- Enable email confirmation in Supabase
- Verify NEXTAUTH_SECRET

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

**Status**: In Development  
**Last Updated**: 2025-07-13