# Collaboration Framework

This document outlines the multi-AI collaboration framework used in this project.

## 1. TRIPOD Framework Methodology

This project utilizes the TRIPOD framework for collaborative debugging and development, leveraging multiple AI perspectives through an asynchronous, file-based system.

### File-Based Async Communication

-   **C2G.md**: Claude to Gemini communication
-   **G2C.md**: Gemini to Claude response

## 2. Multi-AI Communication Protocols

### Problem Initiation

-   Brief overview of the problem
-   Core problem statement and observable symptoms
-   Relevant code, logs, and architecture
-   Approaches attempted and current hypothesis
-   Specific questions and deliverables

### Analysis Response

-   Primary theory with detailed reasoning
-   Step-by-step failure sequence
-   Point-by-point responses to questions
-   Technical explanations and alternatives
-   Step-by-step implementation plan
-   Concrete code examples and debugging techniques

## 3. Session Management

-   **Wake-Up Briefing**: A briefing to re-orient an AI to the current collaboration and project status.
-   **Project Context**: An overview of the project and its core functionality.
-   **Last Known State & Recent Activity**: A summary of the last significant interaction.
-   **Current Focus / Pending Tasks**: A list of immediate next steps.

## 4. API Key Management Review

A review of the API key management system concluded the following:

-   AES-256-GCM encryption is used for user API keys.
-   Environment variables store encryption secrets and provider owner keys.
-   API routes never return plaintext keys.
-   Admin API allows assigning encrypted keys to users.
-   Jest tests mock Supabase to validate authentication error responses.
