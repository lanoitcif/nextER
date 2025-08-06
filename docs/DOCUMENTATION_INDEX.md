# NextER Documentation Index

**Last Updated**: August 6, 2025

This document serves as the central index for all project documentation.

## Core Documentation

-   [**README.md**](../README.md): Project overview, features, and setup instructions
-   [**GUIDE.md**](GUIDE.md): Comprehensive developer guide covering system architecture, development, deployment, design system, and collaboration framework
-   [**PROJECT.md**](PROJECT.md): Project management documentation, including status, development history, and strategic roadmap
-   [**IMPLEMENTATION_PLAN.md**](IMPLEMENTATION_PLAN.md): Detailed, actionable steps for the project's next development phase.
-   [**API.md**](API.md): Detailed documentation for all API endpoints

## Specialized Documentation

-   [**WORKFLOWS.md**](WORKFLOWS.md): Visual diagrams of user and system workflows
-   [**COMPANY_ADMINISTRATION_WORKFLOW.md**](COMPANY_ADMINISTRATION_WORKFLOW.md): Complete workflow for managing companies, company types, and system prompts
-   [**SYSTEM_PROMPT_MANAGEMENT_TECHNICAL_SPEC.md**](SYSTEM_PROMPT_MANAGEMENT_TECHNICAL_SPEC.md): Comprehensive technical specification for advanced system prompt and placeholder management system
-   [**TROUBLESHOOTING.md**](TROUBLESHOOTING.md): A guide to common issues and their solutions
-   [**LIVE_TRANSCRIPTION.md**](LIVE_TRANSCRIPTION.md): Implementation notes for the live earnings call feature
-   [**DATABASE_ADMIN.md**](DATABASE_ADMIN.md): Comprehensive database administration using Supabase CLI tools and inspection commands

## Technical Analysis

-   [**rls_performance_analysis.md**](../rls_performance_analysis.md): Analysis of Row Level Security performance optimization attempts and current Supabase warnings
-   [**JULY_2025_UX_IMPROVEMENTS.md**](JULY_2025_UX_IMPROVEMENTS.md): Comprehensive documentation of UX simplification and file upload implementation

## AI Agent Documentation

-   [**AI_KNOWLEDGE_GRAPH.yaml**](../AI_KNOWLEDGE_GRAPH.yaml): Structured operational knowledge for AI agents and knowledge graphs
-   [**AI_KNOWLEDGE_STRUCTURE.md**](AI_KNOWLEDGE_STRUCTURE.md): Visual Mermaid chart showing YAML organization and navigation guide
-   [**DOCUMENTATION_STRATEGY.md**](DOCUMENTATION_STRATEGY.md): Human vs AI documentation architecture and guidelines
-   [**CLAUDE_WAKEUP.md**](../CLAUDE_WAKEUP.md): Context and memory for AI agent sessions

## Documentation Evolution (January 2025)

### Phase 1: Consolidation ✅
- **Merged** `DESIGN.md` content into `GUIDE.md` Section 8
- **Merged** `COLLABORATION.md` content into `GUIDE.md` Section 7  
- **Removed** deprecated `AGENT-MCP.md` (multi-agent framework no longer used)
- **Reduced** from 9 to 6 human-focused documentation files

### Phase 2: AI-Human Separation ✅
- **Created** `AI_KNOWLEDGE_GRAPH.yaml` for structured AI agent operational knowledge
- **Enhanced** `CLAUDE_WAKEUP.md` for AI session context and memory
- **Established** clear separation between human conceptual docs and AI operational instructions
- **Documented** strategy in `DOCUMENTATION_STRATEGY.md` for future maintenance

### Phase 3: UX Improvements Documentation (July 2025) ✅
- **Created** `JULY_2025_UX_IMPROVEMENTS.md` documenting major workflow simplification
- **Updated** `WORKFLOWS.md` Mermaid diagrams to reflect Analysis Type removal and file upload
- **Enhanced** `AI_KNOWLEDGE_GRAPH.yaml` with UX simplification patterns and lessons learned
- **Integrated** file upload architecture and implementation details

### Phase 4: Company Administration System (August 2025) ✅
- **Created** `COMPANY_ADMINISTRATION_WORKFLOW.md` with comprehensive admin workflows
- **Implemented** full CRUD operations for companies and company types
- **Added** system prompt management with copy functionality
- **Enhanced** admin capabilities with proper RLS policies and validation

### Phase 5: Advanced System Prompt Management (August 2025) ✅
- **Created** `SYSTEM_PROMPT_MANAGEMENT_TECHNICAL_SPEC.md` comprehensive technical specification
- **Designed** hierarchical template system with inheritance (Global → Industry → Company)
- **Specified** visual placeholder builders for complex JSON configurations
- **Planned** 16-week implementation roadmap with detailed phases
- **Researched** Next.js App Router and Supabase best practices using Context7 MCP

### Benefits
- **Human docs** focus on understanding, rationale, and strategic context
- **AI docs** provide structured operational instructions and automation workflows  
- **Knowledge graphs** can directly ingest YAML for semantic search and agent coordination
- **Maintenance efficiency** through appropriate format for each audience type
- **Living documentation** captures real implementation lessons and user feedback integration
