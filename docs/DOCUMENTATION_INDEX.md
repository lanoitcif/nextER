# NEaR Project Documentation Index

**Last Updated**: January 19, 2025

This document serves as the central index for all project documentation.

## Core Documentation

-   [**README.md**](../README.md): Project overview, features, and setup instructions
-   [**GUIDE.md**](GUIDE.md): Comprehensive developer guide covering system architecture, development, deployment, design system, and collaboration framework
-   [**PROJECT.md**](PROJECT.md): Project management documentation, including status, development history, and strategic roadmap
-   [**API.md**](API.md): Detailed documentation for all API endpoints

## Specialized Documentation

-   [**WORKFLOWS.md**](WORKFLOWS.md): Visual diagrams of user and system workflows
-   [**DESIGN.md**](DESIGN.md): The project's design system, including color palette, typography, and component styles
-   [**TROUBLESHOOTING.md**](TROUBLESHOOTING.md): A guide to common issues and their solutions
-   [**COLLABORATION.md**](COLLABORATION.md): The multi-AI collaboration framework used in this project
-   [**LIVE_TRANSCRIPTION.md**](LIVE_TRANSCRIPTION.md): Implementation notes for the live earnings call feature
-   [**DATABASE_ADMIN.md**](DATABASE_ADMIN.md): Comprehensive database administration using Supabase CLI tools and inspection commands

## Technical Analysis

-   [**rls_performance_analysis.md**](../rls_performance_analysis.md): Analysis of Row Level Security performance optimization attempts and current Supabase warnings

## AI Agent Documentation

-   [**AI_KNOWLEDGE_GRAPH.yaml**](../AI_KNOWLEDGE_GRAPH.yaml): Structured operational knowledge for AI agents and knowledge graphs
-   [**AI_KNOWLEDGE_STRUCTURE.md**](../AI_KNOWLEDGE_STRUCTURE.md): Visual Mermaid chart showing YAML organization and navigation guide
-   [**CLAUDE_WAKEUP.md**](../CLAUDE_WAKEUP.md): Context and memory for AI agent sessions
-   [**DOCUMENTATION_STRATEGY.md**](../DOCUMENTATION_STRATEGY.md): Human vs AI documentation architecture and guidelines

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

### Benefits
- **Human docs** focus on understanding, rationale, and strategic context
- **AI docs** provide structured operational instructions and automation workflows  
- **Knowledge graphs** can directly ingest YAML for semantic search and agent coordination
- **Maintenance efficiency** through appropriate format for each audience type
