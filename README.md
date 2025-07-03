# LLM Transcript Analyzer

A powerful web application for analyzing transcripts using multiple LLM providers with pre-built analysis prompts. Built with Next.js and Supabase.

## 🚀 Features

- **Multiple Analysis Types**: Meeting summaries, interview analysis, sentiment analysis, and sales call insights
- **Multiple LLM Providers**: Support for OpenAI, Anthropic, Google, and Cohere
- **Flexible API Key Management**: Use system-provided keys or your own
- **Secure Encryption**: All user API keys are encrypted at rest
- **User-Friendly Interface**: Designed for non-technical users
- **Real-time Analysis**: Get insights in seconds

## 📋 Prerequisites

- Node.js 18+ and npm/yarn
- Supabase account and project
- At least one LLM provider API key (for system keys)

## 🔧 Quick Start

### 1. Clone and Install

```bash
git clone <your-repository-url>
cd nextER
npm install
```

### 2. Set Up Supabase Database

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the complete SQL script from `supabase_schema.sql`

### 3. Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

**Required variables:**

```env
# Supabase Configuration (from your Supabase project settings)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Generate a 32-character encryption key
USER_API_KEY_ENCRYPTION_SECRET=your_32_character_encryption_key

# At least one owner API key (your LLM provider keys)
OWNER_OPENAI_API_KEY=sk-your_openai_key_here
OWNER_ANTHROPIC_API_KEY=sk-ant-your_anthropic_key_here
OWNER_GOOGLE_API_KEY=your_google_key_here
OWNER_COHERE_API_KEY=your_cohere_key_here

# App Configuration
NEXTAUTH_SECRET=your_random_secret_key
NEXTAUTH_URL=http://localhost:3000
```

### 4. Generate Encryption Key

Generate a secure 32-character encryption key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64').slice(0, 32))"
```

Use this output for `USER_API_KEY_ENCRYPTION_SECRET`.

### 5. Run the Application

```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set all environment variables in Vercel project settings
4. Deploy

### Other Platforms

The application can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- Render
- AWS Amplify
- Self-hosted with Docker

## 🏗️ Project Structure

```
├── app/
│   ├── api/                 # API routes
│   │   ├── analyze/         # Main analysis endpoint
│   │   └── user-api-keys/   # API key management
│   ├── auth/               # Authentication pages
│   │   ├── login/
│   │   └── signup/
│   ├── dashboard/          # Main application pages
│   ├── globals.css         # Global styles
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Landing page
├── lib/
│   ├── auth/               # Authentication context
│   ├── crypto.ts           # Encryption utilities
│   ├── llm/                # LLM client implementations
│   └── supabase/           # Supabase configuration
├── public/                 # Static assets
└── supabase_schema.sql     # Database schema
```

## 👥 Usage

### For End Users

1. **Sign Up**: Create an account at your deployed URL
2. **Add API Keys** (optional): Add your own LLM provider API keys in Settings
3. **Analyze Transcripts**: 
   - Go to "Analyze Transcript"
   - Paste or upload your transcript
   - Choose an analysis type
   - Select your API key source
   - Get detailed insights

### For Administrators

1. **Grant System Key Access**: 
   - In Supabase, go to Table Editor → user_profiles
   - Set `can_use_owner_key = true` for authorized users

2. **Manage Prompts**: 
   - Add or modify analysis prompts in the `prompts` table
   - Use the SQL editor or build an admin interface

3. **Monitor Usage**: 
   - Check the `usage_logs` table for usage analytics
   - Monitor costs and token usage

## 🔒 Security

- All user API keys are encrypted using AES-256-GCM
- Row Level Security (RLS) is enabled on all tables
- User sessions are managed by Supabase Auth
- API keys are only decrypted during LLM API calls
- No API keys are logged or stored in plain text

## ⚙️ Customization

### Adding New Analysis Prompts

Insert new prompts into the `prompts` table:

```sql
INSERT INTO public.prompts (name, display_name, description, system_prompt, category) 
VALUES (
  'custom_analysis',
  'Custom Analysis',
  'Your custom analysis description',
  'Your custom system prompt here...',
  'custom'
);
```

### Adding New LLM Providers

1. Implement a new client class in `lib/llm/clients.ts`
2. Add the provider to the `SUPPORTED_PROVIDERS` array
3. Update the database schema if needed
4. Add environment variable for owner key

## 🧪 Testing

```bash
# Run type checking
npm run type-check

# Run linting
npm run lint
```

## 📝 Environment Variables Reference

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | ✅ | `https://abc123.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | ✅ | `eyJ0eXAiOiJKV1Q...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | ✅ | `eyJ0eXAiOiJKV1Q...` |
| `USER_API_KEY_ENCRYPTION_SECRET` | 32-char encryption key | ✅ | `abcd1234efgh5678ijkl9012mnop3456` |
| `OWNER_OPENAI_API_KEY` | Your OpenAI API key | ⚠️ | `sk-proj-abc123...` |
| `OWNER_ANTHROPIC_API_KEY` | Your Anthropic API key | ⚠️ | `sk-ant-api03-...` |
| `OWNER_GOOGLE_API_KEY` | Your Google AI API key | ⚠️ | `AIza...` |
| `OWNER_COHERE_API_KEY` | Your Cohere API key | ⚠️ | `co-...` |
| `NEXTAUTH_SECRET` | Random secret for auth | ✅ | `your-random-secret` |
| `NEXTAUTH_URL` | Your app URL | ✅ | `http://localhost:3000` |

⚠️ = At least one owner API key is required

## 🆘 Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify your Supabase credentials
   - Ensure the database schema has been applied

2. **API Key Encryption Errors**
   - Ensure `USER_API_KEY_ENCRYPTION_SECRET` is exactly 32 characters
   - Regenerate the key if needed

3. **LLM API Errors**
   - Verify your API keys are correct and have sufficient credits
   - Check the provider's API status

4. **Authentication Issues**
   - Ensure email confirmation is enabled in Supabase Auth settings
   - Check NEXTAUTH_SECRET is set

### Getting Help

1. Check the browser console for error messages
2. Review Supabase logs in your project dashboard
3. Verify all environment variables are set correctly

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 🗂️ File Generation Complete

All files have been created successfully! Your project structure is now ready.

## 🎯 Next Steps

1. **Install dependencies**: `npm install`
2. **Set up environment variables**: Copy `.env.example` to `.env.local` and fill in your values
3. **Run the Supabase schema**: Execute `supabase_schema.sql` in your Supabase SQL editor
4. **Start development**: `npm run dev`
5. **Test the application**: Visit `http://localhost:3000`

Your LLM Transcript Analyzer is now ready to use! 🚀