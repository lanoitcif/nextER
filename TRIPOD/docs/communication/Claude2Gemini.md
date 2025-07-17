# Claude ↔ Gemini Collaboration Framework

## Purpose
This document outlines our collaborative debugging and development process for complex technical issues that benefit from multiple AI perspectives.

## Communication Structure

### File-Based Async Communication
- **C2G.md**: Claude to Gemini communication
- **G2C.md**: Gemini to Claude response  
- **Claude2Gemini.md**: This framework document (meta-documentation)

### Communication Protocol

#### 1. Problem Initiation (Claude → C2G.md)
```markdown
# Format Template for C2G.md

## Current Status
- Brief overview of what's working/not working

## Problem Description  
### Primary Issue
- Core problem statement
- Observable symptoms with logs/evidence

### Technical Context
- Framework, architecture, key technologies
- Relevant code files and functions

## Approaches Attempted
### [Approach Name]
**Problem Identified**: What we thought was wrong
**Solution Applied**: What we tried
**Result**: Outcome and remaining issues

## Current Hypothesis
- Leading theories about root cause
- Supporting evidence

## Key Questions for Gemini
1. Specific technical questions
2. Debugging strategy requests
3. Alternative approach suggestions

## Request for Gemini
- Specific deliverables requested
- Priority/urgency level
```

#### 2. Analysis Response (Gemini → G2C.md)
```markdown
# Format Template for G2C.md

## Overall Analysis & Root Cause Hypothesis
- Primary theory with detailed reasoning
- Step-by-step failure sequence

## Answering Your Questions
- Point-by-point responses to Claude's questions
- Technical explanations and alternatives

## Recommended Solution Approach
### Step-by-step implementation plan
- Concrete code examples
- Debugging techniques
- Testing strategies

## Next Steps
- Immediate actions
- Verification methods
```

#### 3. Implementation Updates (Claude → C2G.md updates)
```markdown
# Progress Update in C2G.md

## Debugging Results
- What we tested
- Findings and evidence
- Confirmed/rejected hypotheses

## Implementation Progress  
- What we've built
- Issues encountered
- Current status

## Questions/Blockers
- New issues discovered
- Need for additional guidance
```

## Collaboration Benefits

### Complementary Strengths
- **Claude**: Deep codebase context, implementation details, user interaction history
- **Gemini**: Fresh perspective, systematic debugging, architectural patterns

### Systematic Problem Solving
1. **Context Sharing**: Claude provides comprehensive background
2. **Root Cause Analysis**: Gemini applies systematic debugging methodology  
3. **Solution Design**: Collaborative approach design
4. **Implementation**: Claude implements with Gemini guidance
5. **Verification**: Joint testing and validation

## Best Practices

### For Claude (Problem Reporter)
✅ **Do:**
- Provide complete technical context
- Include relevant code snippets and file paths
- Share actual logs and error messages
- Document all attempted solutions
- Ask specific, actionable questions

❌ **Avoid:**
- Vague problem descriptions
- Missing technical details
- Jumping to solutions without analysis
- Not sharing failed attempts

### For Gemini (Problem Analyzer)
✅ **Do:**
- Question assumptions
- Provide step-by-step debugging plans
- Offer concrete code examples
- Suggest alternative approaches
- Focus on root cause over symptoms

❌ **Avoid:**
- Generic advice without specifics
- Solutions without debugging verification
- Complex changes without incremental steps

### For Both
✅ **Effective Communication:**
- Be explicit about confidence levels
- Provide reasoning behind recommendations
- Build on each other's insights
- Acknowledge when uncertain

## Workflow Patterns

### Pattern 1: Complex Bug Investigation
1. Claude documents comprehensive problem context
2. Gemini provides systematic debugging approach
3. Claude implements debugging steps, reports findings
4. Gemini adjusts hypothesis based on results
5. Iterate until root cause confirmed
6. Gemini provides solution architecture
7. Claude implements with periodic check-ins

### Pattern 2: Architecture Review
1. Claude presents current implementation and goals
2. Gemini analyzes patterns and suggests improvements
3. Claude asks clarifying questions about recommendations
4. Gemini provides detailed implementation plan
5. Claude implements incrementally with progress updates

### Pattern 3: Performance Investigation
1. Claude provides performance symptoms and measurements
2. Gemini suggests profiling and measurement strategies
3. Claude implements monitoring, shares results
4. Gemini identifies bottlenecks and optimization opportunities
5. Joint implementation of performance improvements

## Quality Assurance

### Documentation Standards
- **Technical Accuracy**: Include exact file paths, line numbers, function names
- **Reproducibility**: Provide steps that others can follow
- **Completeness**: Don't skip context that might be relevant
- **Clarity**: Use clear headings, code blocks, and formatting

### Progress Tracking
- Update status clearly in each communication
- Mark completed/pending items explicitly
- Include verification steps for implementations
- Document lessons learned

## Success Metrics

### Effective Collaboration Indicators
- ✅ Issues resolved systematically rather than by trial-and-error
- ✅ Both perspectives contribute unique insights
- ✅ Solutions are architectural improvements, not just fixes
- ✅ Knowledge transfer occurs between AI systems
- ✅ Debugging approach is systematic and reproducible

### Communication Quality Indicators
- ✅ Questions are specific and actionable
- ✅ Responses include concrete next steps
- ✅ Technical details are accurate and complete
- ✅ Progress updates include both successes and blockers

## File Management

### Naming Conventions
- `C2G.md`: Always Claude's communication to Gemini
- `G2C.md`: Always Gemini's response to Claude
- `Claude2Gemini.md`: Framework/meta documentation
- Timestamps in content for complex multi-day issues

### Version Control & Production Deployment 🚨
- **CRITICAL**: Project runs on **Vercel Production** - no local development
- **All changes must be committed and pushed to git** for testing
- **Git commit → Auto-deploy to Vercel → User tests live site**
- Commit communication files with descriptive messages
- Include progress markers in commit history
- Preserve conversation history for future reference
- **Testing workflow**: Code → Commit → Push → Wait for Vercel deploy → Test live

## Recovery Procedures

### If Session Interrupts
1. Review this framework document
2. Read latest C2G.md and G2C.md files
3. Check git commit history for recent progress
4. Create status update in new C2G.md
5. Continue from last known good state

### If Approach Isn't Working
1. Document what we've tried in C2G.md
2. Explicitly request alternative approach from Gemini
3. Consider if problem needs different framing
4. Reset to earlier known good state if needed

---

## Current Issue Application

### Applied to Dropdown Selection Problem
- **C2G.md**: Comprehensive context about dropdown state management issue
- **G2C.md**: Gemini's systematic analysis identifying onChange handler as root cause  
- **Next**: Claude implements debugging steps, reports findings, then follows refactor plan
- **Check-ins**: Regular progress updates to validate approach

This framework ensures our collaboration remains productive, systematic, and knowledge-preserving across complex technical challenges.

---
**Created**: 2025-01-17
**Purpose**: Enable effective Claude-Gemini technical collaboration
**Status**: Active framework for current dropdown debugging issue