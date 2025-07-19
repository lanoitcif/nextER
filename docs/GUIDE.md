# Developer Guide

This guide provides a comprehensive overview of the technical aspects of the LLM Transcript Analyzer project, including development, deployment, and best practices.

## 1. System Architecture

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

## 2. Development Setup

### Prerequisites

- **Node.js**: Version 18 or higher
- **npm**: Comes with Node.js
- **Git**: For version control
- **Supabase Account**: For database and authentication
- **Code Editor**: VS Code recommended

### Initial Setup

1.  **Clone Repository**
    ```bash
    git clone <repository-url>
    cd nexter
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Environment Configuration**
    Create a `.env.local` file by copying the example:
    ```bash
    cp .env.example .env.local
    ```
    Fill in the required environment variables as described in the file.

4.  **Database Setup**
    Apply the database schema from `supabase_schema.sql` in your Supabase SQL Editor.

5.  **Start Development Server**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:3000`.

## 3. Deployment

### Vercel (Recommended)

1.  Push your code to a GitHub repository.
2.  Connect the repository to a new Vercel project.
3.  Configure the environment variables in the Vercel project settings.
4.  Vercel will automatically build and deploy the application.

### Other Platforms

The application can also be deployed to other platforms like Netlify, Railway, Render, or AWS Amplify, or self-hosted using Docker. Refer to the `Dockerfile` in the root directory for self-hosting.

## 4. Best Practices

### Supabase Optimization

-   **Row-Level Security (RLS):** Enable RLS on all tables and index columns used in policies.
-   **Connection Pooling:** Use Supabase's PgBouncer or Supavisor in serverless environments.
-   **Schema Design:** Use `BIGINT` for primary keys and leverage `JSONB`.

### Vercel Optimization

-   **Core Web Vitals:** Monitor INP, CLS, and LCP using Vercel Speed Insights.
-   **Caching:** Use ISR and appropriate caching headers.
-   **Build Optimization:** Use Turborepo for monorepos.

### Security

-   Use declarative schema management and version control for database changes.
-   Rotate JWT secrets and environment variables regularly.
-   Enable Vercel's security features like WAF and deployment protection.

## 5. Project Structure

```
├── app/
│   ├── api/
│   ├── auth/
│   ├── dashboard/
│   └── page.tsx
├── lib/
│   ├── auth/
│   ├── crypto.ts
│   ├── llm/
│   └── supabase/
├── docs/
├── public/
├── supabase_schema.sql
└── package.json
```

## 6. Available Scripts

-   `npm run dev`: Start the development server.
-   `npm run build`: Build the application for production.
-   `npm run start`: Start a production server.
-   `npm run lint`: Run ESLint.
-   `npm run type-check`: Run TypeScript type checking.
-   `npm test`: Run Jest tests.
-   `npm run db:types`: Generate TypeScript types from the Supabase schema.
