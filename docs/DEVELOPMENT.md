# Development Guide

This guide covers setting up a local development environment and contributing to the LLM Transcript Analyzer project.

## 🛠️ Development Setup

### Prerequisites

- **Node.js**: Version 18 or higher
- **npm**: Comes with Node.js
- **Git**: For version control
- **Supabase Account**: For database and authentication
- **Code Editor**: VS Code recommended

### IDE Recommendations

#### VS Code Extensions
```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next",
    "supabase.supabase"
  ]
}
```

### Initial Setup

#### 1. Clone Repository
```bash
git clone <repository-url>
cd nexter
```

#### 2. Install Dependencies
```bash
npm install
```

#### 3. Environment Configuration
Create `.env.local` file:
```bash
cp .env.example .env.local
```

Fill in required environment variables:
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('base64').slice(0, 32))"
USER_API_KEY_ENCRYPTION_SECRET=your_32_character_encryption_key

# At least one LLM provider API key
OWNER_OPENAI_API_KEY=sk-proj-your_openai_key
OWNER_ANTHROPIC_API_KEY=sk-ant-your_anthropic_key
OWNER_GOOGLE_API_KEY=your_google_key
OWNER_COHERE_API_KEY=your_cohere_key

# Authentication
NEXTAUTH_SECRET=your_random_secret
NEXTAUTH_URL=http://localhost:3000
```

#### 4. Database Setup
Apply the database schema in your Supabase SQL Editor:
```sql
-- Copy and paste contents of supabase_schema.sql
```

#### 5. Start Development Server
```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## 📁 Project Structure

```
├── app/                     # Next.js App Router
│   ├── api/                 # API routes
│   │   ├── analyze/         # Main analysis endpoint
│   │   │   └── route.ts
│   │   ├── companies/       # Company ticker endpoints
│   │   │   └── route.ts
│   │   ├── company-types/   # Company analysis type endpoints
│   │   │   └── route.ts
│   │   └── user-api-keys/   # API key management
│   │       ├── route.ts
│   │       └── [id]/
│   │           └── route.ts
│   ├── auth/               # Authentication pages
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── signup/
│   │       └── page.tsx
│   ├── dashboard/          # Main application
│   │   └── page.tsx
│   ├── globals.css         # Global styles
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Landing page
├── lib/                    # Shared utilities
│   ├── auth/               # Authentication context
│   │   └── AuthContext.tsx
│   ├── crypto.ts           # Encryption utilities
│   ├── llm/                # LLM provider clients
│   │   └── clients.ts
│   └── supabase/           # Database client
│       └── client.ts
├── docs/                   # Documentation
│   ├── API.md
│   ├── DEPLOYMENT.md
│   └── DEVELOPMENT.md
├── public/                 # Static assets
├── supabase_schema.sql     # Database schema
├── package.json            # Dependencies and scripts
├── tailwind.config.js      # Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration
└── next.config.js          # Next.js configuration
```

## 🔧 Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server

# Code Quality
npm run lint            # Run ESLint
npm run lint:fix        # Fix ESLint issues automatically
npm run type-check      # Run TypeScript type checking

# Database
npm run db:types        # Generate TypeScript types from Supabase schema
```

## 🎨 Styling & Design System

### Tailwind CSS Configuration
```javascript
// tailwind.config.js
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          900: '#1e3a8a',
        }
      }
    },
  },
}
```

### Design Principles
- **Mobile-First**: All components should work on mobile
- **Accessibility**: Follow WCAG 2.1 guidelines
- **Consistency**: Use consistent spacing and typography
- **Performance**: Optimize for Core Web Vitals

## 🏗️ Architecture Patterns

### API Route Structure
```typescript
// app/api/example/route.ts
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // 1. Authentication
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Input validation
    const body = await request.json();
    const { field1, field2 } = body;
    
    if (!field1 || !field2) {
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      );
    }

    // 3. Business logic
    const result = await processRequest(field1, field2);

    // 4. Response
    return NextResponse.json({ success: true, data: result });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
```

### Component Structure
```typescript
// components/ExampleComponent.tsx
import { useState, useEffect } from 'react';

interface ExampleComponentProps {
  title: string;
  onAction?: (data: string) => void;
}

export default function ExampleComponent({ 
  title, 
  onAction 
}: ExampleComponentProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      // Component logic
      onAction?.('success');
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      <button 
        onClick={handleClick}
        disabled={loading}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Loading...' : 'Action'}
      </button>
    </div>
  );
}
```

## 🔐 Authentication Flow

### Client-Side Authentication
```typescript
// lib/auth/AuthContext.tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

### Server-Side Authentication
```typescript
// lib/supabase/server.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );
}
```

## 🤖 LLM Integration

### Adding New Providers
```typescript
// lib/llm/clients.ts

// 1. Define provider interface
interface NewProviderConfig {
  apiKey: string;
  model?: string;
}

class NewProviderClient implements LLMClient {
  private apiKey: string;
  private model: string;

  constructor(config: NewProviderConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model || 'default-model';
  }

  async analyze(transcript: string, systemPrompt: string): Promise<LLMResponse> {
    // Implementation here
    const response = await fetch('https://api.newprovider.com/v1/chat', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: transcript }
        ]
      })
    });

    const data = await response.json();
    
    return {
      content: data.choices[0].message.content,
      tokensUsed: data.usage.total_tokens,
      model: this.model
    };
  }
}

// 2. Add to supported providers
export const SUPPORTED_PROVIDERS = [
  // ... existing providers
  'newprovider'
] as const;

// 3. Update factory function
export function createLLMClient(provider: LLMProvider, config: any): LLMClient {
  switch (provider) {
    // ... existing cases
    case 'newprovider':
      return new NewProviderClient(config);
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}
```

## 🗃️ Database Development

### Schema Changes
```sql
-- Always use migrations for schema changes
-- Example: Add new column to existing table

ALTER TABLE user_profiles 
ADD COLUMN new_field TEXT DEFAULT NULL;

-- Update RLS policy if needed
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile" ON user_profiles
FOR SELECT USING (auth.uid() = user_id);

-- Industry-specific tables (new feature)
-- See supabase_schema.sql for complete schema including:
-- - company_types: Industry analysis templates with JSONB metadata
-- - companies: Ticker symbol to analysis type mappings  
-- - company_prompt_assignments: Links companies to analysis types
```

### Type Generation
```bash
# Generate TypeScript types from Supabase schema
npm run db:types
```

### Database Queries
```typescript
// Example: Safe database query with error handling
async function getUserProfile(userId: string) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Database error:', error);
    throw new Error('Failed to fetch user profile');
  }

  return data;
}

// Example: Company ticker lookup with analysis type
async function getCompanyAnalysisType(ticker: string) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('companies')
    .select(`
      *,
      company_types!primary_company_type_id (
        id,
        name,
        system_prompt_template,
        classification_rules,
        key_metrics,
        output_format
      )
    `)
    .eq('ticker', ticker.toUpperCase())
    .single();

  if (error) {
    throw new Error(`Company not found: ${ticker}`);
  }

  return data;
}
```

## 🧪 Testing

### Testing Setup
```bash
# Install testing dependencies
npm install --save-dev @testing-library/react @testing-library/jest-dom jest jest-environment-jsdom
```

### Component Testing
```typescript
// __tests__/components/ExampleComponent.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import ExampleComponent from '@/components/ExampleComponent';

describe('ExampleComponent', () => {
  it('renders with title', () => {
    render(<ExampleComponent title="Test Title" />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('calls onAction when button clicked', () => {
    const mockAction = jest.fn();
    render(<ExampleComponent title="Test" onAction={mockAction} />);
    
    fireEvent.click(screen.getByText('Action'));
    expect(mockAction).toHaveBeenCalledWith('success');
  });
});
```

### API Testing
```typescript
// __tests__/api/analyze.test.ts
import { createMocks } from 'node-mocks-http';
import handler from '@/app/api/analyze/route';

describe('/api/analyze', () => {
  it('returns 401 without authentication', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: { transcript: 'test' }
    });

    await handler(req, res);
    expect(res._getStatusCode()).toBe(401);
  });
});
```

## 🔍 Debugging

### Development Tools
```typescript
// Enable debug logging in development
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info:', { user, transcript, analysis });
}
```

### Error Handling
```typescript
// Comprehensive error handling pattern
async function handleApiCall() {
  try {
    const result = await apiCall();
    return { success: true, data: result };
  } catch (error) {
    // Log error with context
    console.error('API call failed:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      userId: user?.id
    });

    // Return user-friendly error
    return { 
      success: false, 
      error: 'Something went wrong. Please try again.' 
    };
  }
}
```

## 📝 Code Style Guidelines

### TypeScript Best Practices
```typescript
// Use strict typing
interface UserProfile {
  id: string;
  email: string;
  created_at: string;
  can_use_owner_key: boolean;
}

// Prefer const assertions for arrays
const ANALYSIS_TYPES = ['meeting', 'interview', 'sentiment', 'sales'] as const;
type AnalysisType = typeof ANALYSIS_TYPES[number];

// Use optional chaining and nullish coalescing
const userName = user?.profile?.name ?? 'Anonymous';
```

### React Best Practices
```typescript
// Use functional components with hooks
function Component() {
  // Custom hooks for complex logic
  const { data, loading, error } = useAnalysis();
  
  // Early returns for loading/error states
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  
  return <div>{/* Main component */}</div>;
}

// Memoize expensive calculations
const expensiveValue = useMemo(() => 
  computeExpensiveValue(data), [data]
);
```

## 🚀 Performance Optimization

### Code Splitting
```typescript
// Dynamic imports for large components
const AnalysisResults = dynamic(() => import('@/components/AnalysisResults'), {
  loading: () => <div>Loading analysis...</div>
});
```

### Image Optimization
```typescript
import Image from 'next/image';

// Always use Next.js Image component
<Image 
  src="/logo.png" 
  alt="Logo" 
  width={200} 
  height={100}
  priority={true} // For above-the-fold images
/>
```

### Caching Strategies
```typescript
// API response caching
const { data } = useSWR('/api/user-profile', fetcher, {
  revalidateOnFocus: false,
  revalidateOnReconnect: false
});
```

## 🤝 Contributing

### Branch Naming
```bash
# Feature branches
git checkout -b feature/add-new-provider
git checkout -b feature/improve-analysis-ui

# Bug fixes
git checkout -b fix/authentication-redirect
git checkout -b fix/api-key-validation

# Documentation
git checkout -b docs/update-deployment-guide
```

### Commit Messages
```bash
# Use conventional commits
feat: add support for new LLM provider
fix: resolve API key encryption issue
docs: update deployment documentation
refactor: improve error handling in analysis endpoint
test: add unit tests for crypto utilities
```

### Pull Request Process
1. Create feature branch from `main`
2. Implement changes with tests
3. Update documentation if needed
4. Run linting and type checking
5. Create pull request with description
6. Request review from maintainers

### Code Review Checklist
- [ ] Code follows style guidelines
- [ ] All tests pass
- [ ] Documentation updated
- [ ] No sensitive data exposed
- [ ] Performance considerations addressed
- [ ] Accessibility requirements met

---

This development guide provides everything needed to contribute effectively to the LLM Transcript Analyzer project.