# Application Workflows

This document contains Mermaid diagrams illustrating various user and system workflows within the application.

## Admin Page Flow

This diagram shows how the admin dashboard behaves for each user type.

```mermaid
graph TD
    A[User visits /dashboard/admin] --> B{access_level == "admin"?}
    B -- No --> C[Redirect to /dashboard]
    B -- Yes --> D[Show Admin Dashboard]
    D --> E[View Stats Cards]
    D --> F[API Key Management]
    D --> G[User Management]
    D --> H[Usage Analytics]
```

## Analyze Page Flow

This diagram illustrates how different user types interact with the Analyze page.

```mermaid
flowchart TD
    Start["Open /dashboard/analyze"] --> Auth{Authenticated?}
    Auth -- "No" --> Login["Redirect to login"]
    Auth -- "Yes" --> Role{Access level}

    subgraph Basic
        Role -- "basic" --> B1["Select company & type"]
        B1 --> BKey{Key source}
        BKey -- "Owner or Temporary" --> BRun["Run analysis"]
    end

    subgraph Advanced
        Role -- "advanced" --> A1["Select company & type"]
        A1 --> AKey{Key source}
        AKey -- "Owner" --> ARun["Run analysis"]
        AKey -- "Saved" --> ARun
        AKey -- "Temporary" --> ARun
    end

    subgraph Admin
        Role -- "admin" --> C1["Select company & type"]
        C1 --> CKey{Key source}
        CKey -- "Owner" --> CRun["Run analysis"]
        CKey -- "Saved" --> CRun
        CKey -- "Temporary" --> CRun
    end

    BRun --> Result["View result"]
    ARun --> Result
    CRun --> Result
```

## Analyze Page Step-by-Step Workflow (Updated July 2025)

This diagram details the simplified workflow on the analyze page after removing the Analysis Type dropdown and adding file upload capability.

```mermaid
flowchart TD
  A[File Upload Component]
  A1[Transcript Textarea]
  B[Ticker Input]
  C[Search Button]
  
  A -->|PDF/DOC/TXT| AF[POST /api/extract-text]
  AF -->|Success| A1
  AF -->|Error| AE[File Upload Error]
  
  B --> C
  C --> D{Companies API Response}
  D -->|Select| E[Selected Company]
  E --> EA[Show Company's Analysis Type]
  EA -->|primary_company_type_id| H[Provider Selection]
  
  H --> I[Model Dropdown Auto-Updated]
  H --> J[API Key Source Selection]
  J -->|user_saved| K[Saved API Key Dropdown]
  J -->|user_temporary| L[Temporary API Key Input]
  J -->|owner| M[Use System Keys]
  K --> N{API Key Available?}
  N -->|Yes| O[Analyze Button Enabled]
  N -->|No| P[Show "Add API Key" Link]
  L --> O
  M --> O
  I --> O
  O --> Q[POST /api/analyze]
  Q -->|Success| R[Result Display]
  Q -->|Error| S[Error Messages]
  R --> T[Copy Button]
  R --> U[Download Word]
  R --> V[View Toggle: Rendered/Markdown]
  
  subgraph FileUpload["File Upload Features"]
    A
    AF
    AE
  end
  
  subgraph Simplified["Simplified UX"]
    EA
    style EA fill:#c8e6c9
  end
  
  subgraph Fallback["Error Handling"]
    AE
    P
    S
  end
  
  style AF fill:#e1f5fe
  style Q fill:#e8f5e8
  style AE fill:#ffebee
  style P fill:#fff3e0
  style S fill:#ffebee
```

## API Key Page Workflow

This diagram explains how the API Key management pages behave for each user type.

```mermaid
flowchart TD
    Start[User visits API Keys page] --> Check{Access Level}
    Check -- basic --> Redirect[Redirect to Dashboard]
    Check -- advanced/admin --> Load[Load user's API keys]
    Load --> View[List keys]
    Load --> Add[Add new key]
    Add --> POST[POST /api/user-api-keys]
    POST --> Refresh1[Reload list]
    View --> Delete[Delete key]
    Delete --> DEL[DELETE /api/user-api-keys/:id]
    DEL --> Refresh2[Reload list]
    Admin[Admin user] --> AdminPage[Admin API Keys page]
    AdminPage --> Assign[Assign key to user]
    Assign --> POSTAssign[POST /api/admin/assign-api-key]
    AdminPage --> Remove[Remove assigned key]
    Remove --> DELAssign[DELETE /api/admin/assign-api-key]
```

## Company Administration Workflow

For detailed company, company type, and system prompt management workflows, see [COMPANY_ADMINISTRATION_WORKFLOW.md](./COMPANY_ADMINISTRATION_WORKFLOW.md).

## Supabase Connection Workflow (Updated July 2025)

This diagram maps how the application communicates with Supabase, including the new file upload endpoint and simplified architecture.

```mermaid
graph TD
  subgraph Client
    A[React pages & components]
    B[Supabase.js client]
  end
  subgraph API Routes
    C[/api/analyze]
    D[/api/companies]
    ET[/api/extract-text]
    E[/api/user-api-keys]
    F[/api/user-api-keys/[id]]
    subgraph Admin
      G[/api/admin/users]
      H[/api/admin/assign-api-key]
      I[/api/admin/usage]
      J[/api/admin/stats]
    end
  end
  A -->|auth & session| B
  B -->|anon key + RLS| K[(Supabase)]
  A -->|fetch + JWT| C
  A -->|fetch + JWT| D
  A -->|file upload| ET
  A -->|fetch + JWT| E
  A -->|fetch + JWT| F
  A -->|fetch + JWT| G
  A -->|fetch + JWT| H
  A -->|fetch + JWT| I
  A -->|fetch + JWT| J
  C -->|service role| K
  D -->|service role| K
  ET -->|file processing| FP[pdf-parse, mammoth]
  E -->|service role| K
  F -->|service role| K
  G -->|service role| K
  H -->|service role| K
  I -->|service role| K
  J -->|service role| K
  
  subgraph Tables
    K --> T1[companies]
    K --> T2[company_types]
    K --> T3[user_api_keys]
    K --> T4[user_profiles]
    K --> T5[usage_logs]
    K --> T6[prompts]
  end
  
  subgraph FileProcessing["File Processing"]
    ET
    FP
  end
  
  style ET fill:#e1f5fe
  style FP fill:#fff3e0
  style T1 fill:#c8e6c9
```
