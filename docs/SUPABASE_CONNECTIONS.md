# Supabase Connection Workflow

This document maps how the application communicates with Supabase. It lists the client-side and server-side interactions and visualizes the flow using a mermaid diagram.

## Connection Types
- **Client** (`lib/supabase/client.ts`): Uses the public anon key for browser-based authentication and read operations.
- **Server** (`lib/supabase/server.ts`): Uses the service role key for secure reads and writes inside API routes.

## Mermaid Diagram
```mermaid
graph TD
  subgraph Client
    A[React pages & components]
    B[Supabase.js client]
  end
  subgraph API Routes
    C[/api/analyze]
    D[/api/companies]
    E[/api/user-api-keys]
    F[/api/user-api-keys/[id]]
    subgraph Admin
      G[/api/admin/users]
      H[/api/admin/assign-api-key]
      I[/api/admin/usage]
      J[/api/admin/stats]
    end
  end
  A -->|auth & queries| B
  B -->|anon key| K[(Supabase)]
  A -->|fetch| C
  A -->|fetch| D
  A -->|fetch| E
  A -->|fetch| F
  A -->|fetch| G
  A -->|fetch| H
  A -->|fetch| I
  A -->|fetch| J
  C -->|service role| K
  D -->|service role| K
  E -->|service role| K
  F -->|service role| K
  G -->|service role| K
  H -->|service role| K
  I -->|service role| K
  J -->|service role| K
```

## Direct Client Queries
- `app/dashboard/analyze/page.tsx` – loads company types using `supabase.from('company_types')`.
- Admin pages retrieve usage logs, API keys and user lists directly via the client.

## API Routes
- **`/api/analyze`** – validates the user, fetches data from Supabase, logs usage and calls the LLM provider.
- **`/api/companies`** – returns active companies from Supabase.
- **`/api/user-api-keys`** – creates and lists API keys for the current user.
- **`/api/user-api-keys/[id]`** – updates or deletes a specific API key.
- **`/api/admin/*`** – admin-only endpoints for user management, API key assignment, usage logs and stats.

All writes and privileged reads are performed server-side using the service role to keep keys secure.
