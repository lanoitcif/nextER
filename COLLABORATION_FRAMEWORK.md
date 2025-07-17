# Collaboration Framework

## 1. TRIPOD Framework Methodology
This document outlines our collaborative debugging and development process for complex technical issues that benefit from multiple AI perspectives. Our primary mode of interaction is an asynchronous, file-based system.

### File-Based Async Communication
- **C2G.md**: Claude to Gemini communication
- **G2C.md**: Gemini to Claude response
- **Claude2Gemini.md**: This framework document (meta-documentation)

## 2. Multi-AI Communication Protocols

### Problem Initiation (Claude → C2G.md)
- Brief overview of what's working/not working
- Core problem statement
- Observable symptoms with logs/evidence
- Framework, architecture, key technologies
- Relevant code files and functions
- Approaches attempted
- Current hypothesis
- Key questions for the other AI
- Specific deliverables requested

### Analysis Response (Other AI → G2C.md)
- Primary theory with detailed reasoning
- Step-by-step failure sequence
- Point-by-point responses to questions
- Technical explanations and alternatives
- Step-by-step implementation plan
- Concrete code examples
- Debugging techniques
- Testing strategies
- Immediate actions
- Verification methods

## 3. Collaboration Tools and Setup
- **Enhanced Markdown Templates**: Granular templates for specific request types.
- **Automated Context Gathering**: Tools to automatically pull relevant code, logs, or config files.
- **Versioned Communication**: A system for versioning communication files.
- **Structured Data Exchange**: Using YAML or JSON blocks within Markdown for structured data.
- **"Read-Only" Context Files**: Separate, frequently updated files for common context.
- **Asynchronous "Code Review" Flow**: A formal async code review process using Markdown.

## 4. Best Practices and Guidelines
- Provide complete technical context.
- Include relevant code snippets and file paths.
- Share actual logs and error messages.
- Document all attempted solutions.
- Ask specific, actionable questions.
- Question assumptions.
- Provide step-by-step debugging plans.
- Offer concrete code examples.
- Suggest alternative approaches.
- Focus on root cause over symptoms.

## 5. Framework Evolution and Enhancements
- **Interactive Debugging Sessions (Simulated)**: A tool to allow one AI to "set a breakpoint".
- **Shared "Scratchpad" Environment**: A temporary, shared file or environment for rapid testing.
- **"Live" Log Streaming (Simulated)**: A tool for one AI to "start logging" and the other to "tail" that log.
- **Automated "Check-in" Prompts**: A system for automatic status updates.
- **"Request for Clarification" Tool**: A dedicated tool to signal the need for clarification.
- **"Execute and Report" Micro-Tasks**: A tool for executing small, isolated tasks.
- **Shared "Goal State" Definition**: A tool or document to formally define the desired state.

## 6. Session Management and Briefing Procedures
- **Wake-Up Briefing**: A briefing to re-orient an AI to the current collaboration and project status.
- **Project Context**: An overview of the project and its core functionality.
- **Collaboration Framework**: A review of the communication and collaboration process.
- **Last Known State & Recent Activity**: A summary of the last significant interaction.
- **Current Focus / Pending Tasks**: A list of immediate next steps.
- **Key Files to Review**: A list of relevant documents.
