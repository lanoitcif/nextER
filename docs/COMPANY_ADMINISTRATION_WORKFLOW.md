# Company Administration Workflow

This document outlines the comprehensive workflow for managing companies, company types, and system prompts in NextER.

## Overview

The company administration system allows admins to:
- Manage companies and their tickers
- Create and modify company types (industry templates)
- Manage system prompts for each company type
- Copy prompts between company types
- Assign company types to companies
- Bulk operations for efficiency

## Database Architecture

```mermaid
erDiagram
    companies ||--o{ company_prompt_assignments : has
    company_types ||--o{ company_prompt_assignments : assigned_to
    company_types ||--o{ prompts : has
    companies ||--|| company_types : primary_type
    
    companies {
        uuid id PK
        text ticker UK
        text name
        text primary_company_type_id FK
        text[] additional_company_types
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }
    
    company_types {
        text id PK
        text name
        text description
        text system_prompt_template
        jsonb classification_rules
        jsonb key_metrics
        jsonb output_format
        text[] validation_rules
        jsonb special_considerations
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }
    
    company_prompt_assignments {
        uuid id PK
        uuid company_id FK
        text company_type_id FK
        boolean is_primary
        timestamp created_at
    }
    
    prompts {
        uuid id PK
        text name UK
        text display_name
        text description
        text system_prompt
        text category
        boolean is_active
        timestamp created_at
        timestamp updated_at
        jsonb template_variables
        text company_type_id FK
    }
```

## Company Administration Workflow

```mermaid
flowchart TD
    Start[Admin Dashboard] --> CompanyMgmt[Company Management]
    Start --> TypeMgmt[Company Type Management]
    Start --> PromptMgmt[System Prompt Management]
    
    %% Company Management Flow
    CompanyMgmt --> CompanyList[List Companies]
    CompanyList --> CompanyActions{Actions}
    CompanyActions --> AddCompany[Add New Company]
    CompanyActions --> EditCompany[Edit Company]
    CompanyActions --> DeleteCompany[Deactivate Company]
    CompanyActions --> BulkImport[Bulk Import]
    
    AddCompany --> CompanyForm[Company Form]
    CompanyForm --> TickerValidation{Ticker Valid?}
    TickerValidation -->|No| ShowError[Show Validation Error]
    ShowError --> CompanyForm
    TickerValidation -->|Yes| SelectType[Select Primary Type]
    SelectType --> SaveCompany[Save to Database]
    
    EditCompany --> UpdateForm[Update Form]
    UpdateForm --> UpdateType[Change Company Type]
    UpdateForm --> AddSecondaryTypes[Add Secondary Types]
    UpdateForm --> UpdateInfo[Update Basic Info]
    
    %% Company Type Management Flow
    TypeMgmt --> TypeList[List Company Types]
    TypeList --> TypeActions{Actions}
    TypeActions --> AddType[Add New Type]
    TypeActions --> EditType[Edit Type]
    TypeActions --> CopyType[Copy Type]
    TypeActions --> DeleteType[Deactivate Type]
    
    AddType --> TypeForm[Type Form]
    TypeForm --> TypeIdGen[Generate Type ID]
    TypeIdGen --> TemplateBuilder[Template Builder]
    TemplateBuilder --> SaveType[Save Type]
    
    CopyType --> SelectSource[Select Source Type]
    SelectSource --> ModifyCopy[Modify Copy]
    ModifyCopy --> SaveNewType[Save as New Type]
    
    %% System Prompt Management Flow
    PromptMgmt --> SelectCompany[Select Company]
    SelectCompany --> LoadTypes[Load Company Types]
    LoadTypes --> SelectPromptType[Select Type to Edit]
    SelectPromptType --> PromptEditor[Prompt Editor]
    
    PromptEditor --> EditActions{Edit Actions}
    EditActions --> EditPrompt[Edit Template]
    EditActions --> CopyPrompt[Copy from Other Type]
    EditActions --> PreviewPrompt[Preview with Variables]
    EditActions --> ValidatePrompt[Validate Template]
    
    CopyPrompt --> SourceSelector[Select Source Type]
    SourceSelector --> ReviewDiff[Review Differences]
    ReviewDiff --> ApplyCopy[Apply Copy]
    
    EditPrompt --> VariableHelper[Variable Helper]
    VariableHelper --> LivePreview[Live Preview]
    LivePreview --> SavePrompt[Save Changes]
    
    %% Validation and Security
    SaveCompany --> RLSCheck{RLS Policy Check}
    SaveType --> RLSCheck
    SavePrompt --> RLSCheck
    RLSCheck -->|Pass| Success[Success]
    RLSCheck -->|Fail| AccessDenied[Access Denied]
    
    %% Bulk Operations
    BulkImport --> CSVUpload[Upload CSV]
    CSVUpload --> ValidateData[Validate Data]
    ValidateData --> PreviewChanges[Preview Changes]
    PreviewChanges --> ConfirmImport[Confirm Import]
    ConfirmImport --> ProcessImport[Process Import]
    ProcessImport --> ImportResults[Show Results]
```

## Feature Implementation Plan

### Phase 1: Core Company Management
1. **Company Management Page** (`/dashboard/admin/companies`)
   - List all companies with search/filter
   - Add new company with ticker validation
   - Edit company details
   - Assign primary and secondary company types
   - Bulk import via CSV

### Phase 2: Company Type Management
1. **Company Type Management Page** (`/dashboard/admin/company-types`)
   - List all company types
   - Add new company type with ID generation
   - Copy existing type as template
   - Edit type metadata and configuration
   - Preview type usage across companies

### Phase 3: Enhanced Prompt Management
1. **Enhanced System Prompts Page**
   - Current functionality plus:
   - Copy prompts between types
   - Bulk edit capabilities
   - Template variable management
   - Version history
   - Preview with real data

### Phase 4: Advanced Features
1. **Prompt Templates Library**
   - Pre-built industry templates
   - Community-shared templates
   - Template marketplace

2. **Analytics Dashboard**
   - Usage by company type
   - Performance metrics per type
   - Prompt effectiveness tracking

## API Endpoints Required

### Company Management
- `GET /api/admin/companies` - List all companies
- `POST /api/admin/companies` - Create new company
- `PUT /api/admin/companies/[id]` - Update company
- `DELETE /api/admin/companies/[id]` - Deactivate company
- `POST /api/admin/companies/bulk-import` - Bulk import

### Company Type Management
- `GET /api/admin/company-types` - List all types
- `POST /api/admin/company-types` - Create new type
- `PUT /api/admin/company-types/[id]` - Update type
- `DELETE /api/admin/company-types/[id]` - Deactivate type
- `POST /api/admin/company-types/copy` - Copy type

### Prompt Management
- `GET /api/admin/prompts/[type_id]` - Get prompts for type
- `PUT /api/admin/prompts/[type_id]` - Update prompt
- `POST /api/admin/prompts/copy` - Copy prompt between types
- `GET /api/admin/prompts/preview` - Preview with variables

## Security Considerations

1. **Row Level Security (RLS)**
   - Admin-only access for all management operations
   - Audit logging for all changes
   - Version control for prompts

2. **Validation**
   - Ticker uniqueness
   - Type ID format validation
   - Template variable validation
   - Circular reference prevention

3. **Performance**
   - Indexed searches on tickers
   - Cached company type lookups
   - Optimized bulk operations

## User Experience Guidelines

1. **Intuitive Navigation**
   - Clear breadcrumbs
   - Quick actions menu
   - Keyboard shortcuts

2. **Smart Defaults**
   - Auto-generate type IDs from names
   - Pre-fill common template variables
   - Suggest related types

3. **Error Prevention**
   - Real-time validation
   - Confirmation dialogs for destructive actions
   - Undo capabilities

4. **Efficiency Features**
   - Bulk operations
   - Quick copy actions
   - Template inheritance

## Implementation Priority

1. **High Priority**
   - Basic company CRUD operations
   - Company type assignment
   - Prompt copying functionality

2. **Medium Priority**
   - Bulk import/export
   - Template versioning
   - Advanced search/filter

3. **Low Priority**
   - Template marketplace
   - Analytics dashboard
   - AI-suggested improvements