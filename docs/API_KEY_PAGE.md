# API Key Page Workflow

This document explains how the **API Key** management pages behave for each user type.

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

- **Basic users**: Redirected away; cannot manage personal API keys.
- **Advanced users**: Can add and delete their own API keys.
- **Admin users**: Have advanced permissions plus a separate admin page to assign keys to other users.
