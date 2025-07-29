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

### AI Agent Knowledge Graph

For AI agents and automated systems working with this project, see the structured operational knowledge in:
- [AI_KNOWLEDGE_GRAPH.yaml](../AI_KNOWLEDGE_GRAPH.yaml) - Machine-readable workflows, configurations, and procedures
- [AI_KNOWLEDGE_STRUCTURE.md](../AI_KNOWLEDGE_STRUCTURE.md) - Visual Mermaid chart of the knowledge organization

This enables automated tools to understand project structure, security requirements, and operational procedures without parsing human-focused documentation.

## 7. Collaboration Framework

This project utilizes the TRIPOD framework for collaborative debugging and development, leveraging multiple AI perspectives through an asynchronous, file-based system.

### File-Based Async Communication

-   **C2G.md**: Claude to Gemini communication
-   **G2C.md**: Gemini to Claude response

### Multi-AI Communication Protocols

#### Problem Initiation

-   Brief overview of the problem
-   Core problem statement and observable symptoms
-   Relevant code, logs, and architecture
-   Approaches attempted and current hypothesis
-   Specific questions and deliverables

#### Analysis Response

-   Primary theory with detailed reasoning
-   Step-by-step failure sequence
-   Point-by-point responses to questions
-   Technical explanations and alternatives
-   Step-by-step implementation plan
-   Concrete code examples and debugging techniques

### Session Management

-   **Wake-Up Briefing**: A briefing to re-orient an AI to the current collaboration and project status.
-   **Project Context**: An overview of the project and its core functionality.
-   **Last Known State & Recent Activity**: A summary of the last significant interaction.
-   **Current Focus / Pending Tasks**: A list of immediate next steps.

### API Key Management Review

A review of the API key management system concluded the following:

-   AES-256-GCM encryption is used for user API keys.
-   Environment variables store encryption secrets and provider owner keys.
-   API routes never return plaintext keys.
-   Admin API allows assigning encrypted keys to users.
-   Jest tests mock Supabase to validate authentication error responses.

## 8. Design System

### Design Philosophy
The application uses a high-contrast, dark-themed design inspired by retro CRT monitors. The aesthetic is functional and nostalgic, prioritizing legibility and a clean user interface. The entire color and component system is built on a themeable foundation using CSS variables.

### Color Palette and Theming
The application uses a dark theme by default, defined in `app/globals.css`. Colors are managed via CSS variables to ensure consistency.

#### Core Theme Colors (`.dark` theme)
| Variable | HSL Value | Description |
|---|---|---|
| `--background` | `240 6% 10%` | Near Black, main page background |
| `--foreground` | `44 50% 94%` | Cream Pixel Glow, primary text color |
| `--card` | `240 6% 13%` | Darker Charcoal, card backgrounds |
| `--primary` | `358 85% 72%` | Sunbleached Coral, for primary buttons and accents |
| `--primary-foreground` | `240 6% 10%` | Near Black, text on primary elements |
| `--secondary` | `158 51% 58%` | Pacific Teal Mist, for secondary buttons |
| `--secondary-foreground` | `240 6% 10%` | Near Black, text on secondary elements |
| `--muted-foreground` | `44 50% 80%` | Lighter Cream, for descriptions and subtitles |
| `--border` | `240 6% 20%` | Charcoal Border, for borders and inputs |
| `--ring` | `358 85% 72%` | Sunbleached Coral, for focus rings |

### Component Library
Components are styled globally in `app/globals.css` and use the CSS theme variables.

- **Buttons (`.btn`, `.btn-primary`, etc.):** Styled with theme colors for high contrast. They use `bg-primary` for the background and `text-primary-foreground` for the text.
- **Cards (`.card`):** Use `bg-card` and `text-card-foreground`.
- **Forms (`.input`, `.select`, `.textarea`):** Styled with `border-input` and transparent backgrounds to blend with their container.

### Accessibility
The new theme was designed with accessibility as a priority.
- **Color Contrast:** All default text and background combinations meet WCAG AA standards. The primary and secondary button styles now use dark text on lighter backgrounds to ensure legibility.
- **Focus Indicators:** All interactive elements have clear, visible focus rings using the `--ring` variable.
