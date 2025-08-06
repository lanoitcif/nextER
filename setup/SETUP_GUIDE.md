# NextER Complete Setup Guide

This guide provides step-by-step instructions to set up NextER from a fresh clone of the repository.

## Prerequisites

- Node.js 18+ and npm 9+
- PostgreSQL database (via Supabase or self-hosted)
- Git
- A Vercel account (for deployment)
- API keys for at least one LLM provider (OpenAI, Anthropic, Google, or Cohere)

## Step 1: Clone the Repository

```bash
git clone https://github.com/lanoitcif/nextER.git
cd nextER
```

## Step 2: Install Dependencies

```bash
npm install
```

## Step 3: Set Up Supabase

### Option A: Use Existing Supabase Project
If using an existing Supabase project, skip to Step 4.

### Option B: Create New Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Create a new project
3. Note your project URL and anon key

## Step 4: Database Setup

### 4.1 Run Database Schema Setup

Connect to your Supabase database and run the SQL files in order:

```sql
-- Run these files in your Supabase SQL editor:
-- 1. setup/01-database-schema.sql
-- 2. setup/02-row-level-security.sql
-- 3. setup/03-seed-data.sql
```

Or use the Supabase CLI:

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push setup/01-database-schema.sql
supabase db push setup/02-row-level-security.sql
supabase db push setup/03-seed-data.sql
```

### 4.2 Configure Authentication

In Supabase Dashboard:
1. Go to Authentication → Settings
2. Set these configurations:
   - Enable Email Auth
   - Set JWT expiry to 604800 (7 days)
   - Enable email confirmations (optional)

## Step 5: Environment Configuration

Create `.env.local` file in the root directory:

```bash
# Supabase Configuration (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Encryption Key (REQUIRED - must be exactly 32 characters)
USER_API_KEY_ENCRYPTION_SECRET=your32characterencryptionsecret

# Deepgram Configuration (REQUIRED for transcription)
DEEPGRAM_API_KEY=your-deepgram-api-key

# LLM Provider Keys (OPTIONAL - users can provide their own)
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
GOOGLE_API_KEY=your-google-api-key
COHERE_API_KEY=your-cohere-api-key

# Optional: Vercel Configuration (for deployment)
VERCEL_URL=https://your-app.vercel.app
```

### Important Notes:
- `USER_API_KEY_ENCRYPTION_SECRET` must be EXACTLY 32 characters
- At least one LLM provider key is recommended for testing
- Deepgram key is required for live transcription feature

## Step 6: Create Admin User

After setting up the database, create your first admin user:

```sql
-- Run this in Supabase SQL editor after creating your account
UPDATE user_profiles 
SET is_admin = true, 
    access_level = 'admin',
    can_use_owner_key = true
WHERE email = 'your-email@example.com';
```

## Step 7: Local Development

Start the development server:

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

### Development Commands:

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Run production build locally
npm run start

# Type checking
npm run type-check

# Linting
npm run lint

# Run tests
npm test
```

## Step 8: Deployment to Vercel

### 8.1 Install Vercel CLI

```bash
npm i -g vercel
```

### 8.2 Deploy

```bash
# Deploy to Vercel
vercel

# Deploy to production
vercel --prod
```

### 8.3 Configure Environment Variables in Vercel

1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add all variables from `.env.local`

## Step 9: Post-Deployment Configuration

### 9.1 Update Supabase URL Configurations

In Supabase Dashboard:
1. Go to Authentication → URL Configuration
2. Add your production URL to:
   - Site URL: `https://your-domain.com`
   - Redirect URLs: `https://your-domain.com/*`

### 9.2 Configure CORS (if needed)

Add your domain to allowed origins in Supabase.

## Step 10: Verify Installation

Run the test script to verify everything is working:

```bash
# Test local installation
node test-production-features.js test@example.com testpassword

# Test production (after deployment)
curl -I https://your-domain.com
```

## Troubleshooting

### Common Issues and Solutions

#### 1. Database Connection Issues
- Verify Supabase URL and anon key are correct
- Check if RLS policies are properly configured
- Ensure your IP is whitelisted in Supabase (if applicable)

#### 2. Build Errors
```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

#### 3. Authentication Issues
- Check JWT expiry settings in Supabase
- Verify auth callback URLs are configured
- Clear browser cookies and localStorage

#### 4. Missing LLM Settings Column
If you see errors about `llm_settings`:
```sql
ALTER TABLE company_types
ADD COLUMN IF NOT EXISTS llm_settings jsonb 
DEFAULT '{"temperature": 0.3, "top_p": 0.9, "max_tokens": 3000, "frequency_penalty": 0.3, "presence_penalty": 0.2}'::jsonb;
```

#### 5. API Key Encryption Errors
- Ensure `USER_API_KEY_ENCRYPTION_SECRET` is exactly 32 characters
- Use only alphanumeric characters for the secret

## File Structure

```
nextER/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   └── dashboard/         # Dashboard pages
├── components/            # React components
├── lib/                   # Utility libraries
│   ├── auth/             # Authentication utilities
│   ├── config/           # Configuration files
│   └── supabase/         # Supabase client
├── public/               # Static assets
├── setup/                # Setup SQL scripts
│   ├── 01-database-schema.sql
│   ├── 02-row-level-security.sql
│   └── 03-seed-data.sql
├── docs/                 # Documentation
├── .env.local           # Environment variables (create this)
├── package.json         # Dependencies
└── README.md           # Project overview
```

## Required API Keys

### Deepgram (Required for Transcription)
1. Sign up at [https://deepgram.com](https://deepgram.com)
2. Get API key from console
3. Add to `.env.local`

### LLM Providers (At least one required)

#### OpenAI
1. Sign up at [https://platform.openai.com](https://platform.openai.com)
2. Create API key
3. Add to `.env.local`

#### Anthropic
1. Sign up at [https://console.anthropic.com](https://console.anthropic.com)
2. Create API key
3. Add to `.env.local`

#### Google (Gemini)
1. Get API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Add to `.env.local`

#### Cohere
1. Sign up at [https://dashboard.cohere.com](https://dashboard.cohere.com)
2. Create API key
3. Add to `.env.local`

## Features Checklist

After setup, verify these features are working:

- [ ] User registration and login
- [ ] Dashboard access
- [ ] Company search
- [ ] Transcript analysis
- [ ] Export (Word/HTML)
- [ ] Template management (admin only)
- [ ] API key management
- [ ] Live transcription
- [ ] Analysis history
- [ ] Feedback system

## Support

For issues or questions:
1. Check the [troubleshooting section](#troubleshooting)
2. Review [API Documentation](docs/API_DOCUMENTATION.md)
3. Open an issue on GitHub

## Security Notes

- Never commit `.env.local` to version control
- Rotate encryption keys regularly
- Use strong, unique passwords
- Enable 2FA on all service accounts
- Regularly update dependencies

## Next Steps

1. Configure templates for your use case
2. Add companies relevant to your analysis
3. Set up user accounts for your team
4. Configure LLM settings for optimal results
5. Test with sample transcripts

---

**Version**: 1.0.0  
**Last Updated**: August 6, 2025  
**Maintained by**: NextER Development Team