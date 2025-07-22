# Admin Page Flow

This document illustrates how the admin dashboard behaves for each user type.

## User Access Levels
- **basic** – may use API keys assigned by an administrator but cannot manage their own keys.
- **advanced** – may add personal API keys in addition to any assigned keys.
- **admin** – full administrative privileges.

Only users with the `admin` access level can view the admin dashboard. Basic and advanced users are redirected back to the standard dashboard.

## Flow Diagram

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

The admin dashboard provides system statistics, API key assignment tools, user management controls, and usage analytics.
