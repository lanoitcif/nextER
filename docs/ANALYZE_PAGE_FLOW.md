# Analyze Page Workflow

This document illustrates how different user types interact with the Analyze page. All users must sign in before accessing `/dashboard/analyze`.

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

**User Types**

- **Basic** – Uses admin-assigned keys or a temporary key. Cannot save personal keys.
- **Advanced** – May save personal API keys in addition to any assigned by an admin.
- **Admin** – Full privileges, including managing keys and system settings.
