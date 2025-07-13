# Deployment Guide

This guide covers deploying the LLM Transcript Analyzer to various platforms.

## 📋 Pre-deployment Checklist

### 1. Supabase Setup
- ✅ Create Supabase project
- ✅ Apply database schema (`supabase_schema.sql`)
- ✅ Configure Row Level Security policies
- ✅ Get API keys from Settings → API

### 2. Environment Variables
- ✅ Generate 32-character encryption secret
- ✅ Obtain LLM provider API keys
- ✅ Configure authentication secrets

### 3. Testing
- ✅ Test locally with `npm run dev`
- ✅ Verify database connections
- ✅ Test all analysis features
- ✅ Validate API key encryption/decryption

## 🚀 Platform-Specific Deployment

### Vercel (Recommended)

Vercel provides the best Next.js deployment experience with zero configuration.

#### Step 1: Prepare Repository
```bash
# Ensure your code is pushed to GitHub
git add .
git commit -m "feat: ready for deployment"
git push origin main
```

#### Step 2: Connect to Vercel
1. Visit [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "New Project"
4. Import your repository
5. Configure project settings:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)

#### Step 3: Environment Variables
Add these in Vercel Project Settings → Environment Variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Encryption Secret (32 characters)
USER_API_KEY_ENCRYPTION_SECRET=your_32_character_encryption_key

# LLM Provider Keys (at least one required)
OWNER_OPENAI_API_KEY=sk-proj-your_openai_key_here
OWNER_ANTHROPIC_API_KEY=sk-ant-your_anthropic_key_here
OWNER_GOOGLE_API_KEY=your_google_key_here
OWNER_COHERE_API_KEY=your_cohere_key_here

# Authentication
NEXTAUTH_SECRET=your_random_secret_here
NEXTAUTH_URL=https://your-app.vercel.app
```

#### Step 4: Deploy
1. Click "Deploy"
2. Wait for build completion (~2-3 minutes)
3. Visit your deployed URL
4. Test login and analysis features

#### Step 5: Custom Domain (Optional)
1. Go to Project Settings → Domains
2. Add your custom domain
3. Configure DNS records as instructed
4. Update `NEXTAUTH_URL` environment variable

---

### Netlify

Alternative deployment platform with similar capabilities.

#### Step 1: Build Settings
```bash
# Build command
npm run build

# Publish directory
.next
```

#### Step 2: Environment Variables
Add in Site Settings → Environment Variables (same as Vercel list above)

#### Step 3: Deploy
1. Connect GitHub repository
2. Configure build settings
3. Add environment variables
4. Deploy automatically

---

### Railway

Great for applications requiring more backend resources.

#### Step 1: Railway Setup
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway deploy
```

#### Step 2: Environment Configuration
Add environment variables in Railway dashboard.

#### Step 3: Database Connection
Railway can also host your PostgreSQL database if you prefer not to use Supabase.

---

### Render

Simple deployment with free tier available.

#### Step 1: Service Configuration
- **Environment**: Node
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

#### Step 2: Environment Variables
Add in Service → Environment tab.

---

### AWS Amplify

For AWS-integrated deployments.

#### Step 1: Amplify Console
1. Connect GitHub repository
2. Choose main branch
3. Configure build settings:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm install
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
```

#### Step 2: Environment Variables
Add in Amplify Console → App Settings → Environment Variables.

---

### Self-Hosted (Docker)

For organizations requiring full control.

#### Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY . .

# Build application
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

#### Docker Compose
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - USER_API_KEY_ENCRYPTION_SECRET=${USER_API_KEY_ENCRYPTION_SECRET}
      - OWNER_OPENAI_API_KEY=${OWNER_OPENAI_API_KEY}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - NEXTAUTH_URL=${NEXTAUTH_URL}
    restart: unless-stopped
```

#### Deployment Commands
```bash
# Build and run
docker-compose up -d

# View logs
docker-compose logs -f

# Update deployment
docker-compose pull && docker-compose up -d
```

---

## 🔧 Post-Deployment Configuration

### 1. Database Verification
```sql
-- Verify tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies;
```

### 2. Test User Registration
1. Visit your deployed URL
2. Create a test account
3. Verify email confirmation (if enabled)
4. Check user profile creation in Supabase

### 3. API Key Testing
```bash
# Test analysis endpoint
curl -X POST "https://your-app.vercel.app/api/analyze" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <test_token>" \
  -d '{
    "transcript": "Test meeting transcript",
    "promptId": "meeting_summary",
    "provider": "openai",
    "keySource": "owner"
  }'
```

### 4. Enable Owner Key Access
Grant users access to system API keys:
```sql
UPDATE user_profiles 
SET can_use_owner_key = true 
WHERE email = 'user@company.com';
```

## 🔒 Security Configuration

### 1. Supabase Security
- **Auth Settings**: Configure email confirmation
- **RLS Policies**: Verify all policies are active
- **API Keys**: Rotate service role key if compromised

### 2. Environment Security
- **Secrets Rotation**: Regularly rotate encryption keys
- **Access Control**: Limit environment variable access
- **Monitoring**: Enable deployment notifications

### 3. Application Security
- **CORS**: Configure allowed origins
- **Rate Limiting**: Implement API rate limits
- **Input Validation**: Ensure all inputs are sanitized

## 📊 Monitoring & Analytics

### 1. Application Monitoring
```bash
# Vercel Analytics (built-in)
# Add to next.config.js
const nextConfig = {
  experimental: {
    webVitalsAttribution: ['CLS', 'LCP']
  }
}
```

### 2. Error Tracking
Consider integrating:
- **Sentry**: Error tracking and performance monitoring
- **LogRocket**: Session replay and bug tracking
- **Datadog**: Full-stack monitoring

### 3. Usage Analytics
Monitor via Supabase:
```sql
-- Daily usage stats
SELECT 
  DATE(created_at) as date,
  provider,
  COUNT(*) as requests,
  SUM(estimated_cost) as total_cost
FROM usage_logs 
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at), provider
ORDER BY date DESC;
```

## 🚨 Troubleshooting

### Common Deployment Issues

#### Build Failures
```bash
# Check Node version compatibility
node --version  # Should be 18+

# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check for TypeScript errors
npm run type-check
```

#### Environment Variable Issues
- Verify all required variables are set
- Check for typos in variable names
- Ensure encryption secret is exactly 32 characters
- Validate API key formats

#### Database Connection Errors
- Verify Supabase URL and keys
- Check database schema is applied
- Validate RLS policies are active
- Test connection from deployment platform

#### Authentication Problems
- Verify NEXTAUTH_URL matches deployment URL
- Check NEXTAUTH_SECRET is set
- Validate Supabase auth configuration
- Test email confirmation settings

### Performance Issues
- Enable Next.js caching
- Optimize image loading
- Implement CDN for static assets
- Monitor API response times

### Security Alerts
- Rotate compromised API keys immediately
- Update dependencies regularly
- Monitor for unauthorized access
- Implement audit logging

## 📈 Scaling Considerations

### 1. Database Scaling
- Monitor Supabase usage limits
- Consider read replicas for high traffic
- Implement connection pooling
- Optimize query performance

### 2. API Rate Limiting
- Implement user-based rate limits
- Monitor provider API quotas
- Cache analysis results when possible
- Implement queue system for high volume

### 3. Cost Management
- Monitor LLM API costs
- Implement usage alerts
- Consider bulk pricing for high volume
- Optimize token usage

## 🔄 Continuous Deployment

### GitHub Actions (Example)
```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

### Automated Testing
```yaml
- name: Run Tests
  run: |
    npm test
    npm run lint
    npm run type-check
```

---

This deployment guide ensures your LLM Transcript Analyzer is properly configured, secure, and ready for production use.