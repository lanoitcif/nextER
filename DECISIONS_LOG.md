# NEaR Platform Decisions Log

## Purpose
This document tracks major architectural and implementation decisions with rationale, alternatives considered, and outcomes. Prevents re-litigating solved problems and provides context for future development.

---

## 2025-01-17: Dropdown Selection Debugging Strategy

### Decision: Systematic Debugging with Gemini Collaboration
**Context**: Persistent dropdown selection issue where logs show success but UI doesn't respond  
**Options Considered**:
1. Trial-and-error fixes
2. Complete rewrite of dropdown component
3. Systematic debugging following Gemini's methodology

**Chosen**: #3 - Systematic debugging approach  
**Rationale**: 
- Previous fixes (alt-tab, race conditions) partially worked but missed root cause
- Gemini's analysis identified onChange handler as likely culprit
- Methodical approach prevents wasted effort on symptoms vs. root cause

**Implementation**: Added debugger statements, enhanced logging, verified click handler attachment  
**Outcome**: ✅ Success - Click handlers confirmed working, issue isolated to database query phase

---

## 2025-01-17: Multi-AI Collaboration Framework

### Decision: Formal Claude↔Gemini Collaboration Process
**Context**: Complex technical issues benefit from multiple AI perspectives  
**Options Considered**:
1. Ad-hoc consultation
2. Formal file-based communication protocol
3. Real-time collaboration tools

**Chosen**: #2 - File-based async protocol (C2G.md, G2C.md, Claude2Gemini.md)  
**Rationale**:
- Preserves full context and reasoning chains
- Version controllable with git
- Enables systematic problem-solving methodology
- Works within current Vercel production deployment workflow

**Implementation**: Created communication templates and best practices  
**Outcome**: Successfully applied to dropdown debugging issue  
**Next Evolution**: Implementing Gemini's TRIPOD_IDEAS for enhanced templates

---

## 2025-01-17: Production-Only Development Workflow

### Decision: All Testing on Vercel Production
**Context**: No local development environment, all changes tested live  
**Options Considered**:
1. Set up local development with env variables
2. Use Vercel preview deployments
3. Continue production testing with careful commits

**Chosen**: #3 - Production testing with systematic git workflow  
**Rationale**:
- Vercel auto-deploy provides fast feedback (30 seconds)
- Production environment eliminates dev/prod parity issues
- Git provides safety net for rollbacks
- Works well with current user testing approach

**Implementation**: Enhanced commit discipline, clear debugging markers  
**Outcome**: Effective for rapid iteration and debugging  
**Risks**: Mitigated by careful commits and immediate rollback capability

---

## 2025-01-17: useEffect Race Condition Resolution

### Decision: Combine User-Dependent Effects
**Context**: Two separate useEffects both depending on `user` state causing conflicts  
**Options Considered**:
1. Keep separate effects, add timing delays
2. Use useCallback for function stability
3. Combine effects into single useEffect with proper execution order

**Chosen**: #3 - Combined useEffect  
**Rationale**:
- Eliminates race conditions between loadUserPreferences and fetchUserApiKeys
- Ensures proper execution order (preferences → companies → API keys)
- Simpler mental model than managing timing dependencies

**Implementation**: Single useEffect calling functions in sequence  
**Outcome**: Reduced multiple fetchCompanies calls, cleaner state management

---

## 2025-01-16: Retro CRT Color Scheme Implementation

### Decision: Complete Application-Wide Color Transformation
**Context**: User requested retro CRT-inspired aesthetic throughout application  
**Options Considered**:
1. Theme toggle between dark/retro
2. Gradual page-by-page implementation
3. Complete transformation all at once

**Chosen**: #3 - Complete transformation  
**Rationale**:
- Consistent user experience across all pages
- Avoids jarring transitions between themed/unthemed pages
- Establishes strong brand identity

**Implementation**: Updated tailwind.config.js, globals.css, and all component files  
**Outcome**: Successful aesthetic transformation, user satisfaction  
**Follow-up**: Fixed admin page contrast issues discovered post-implementation

---

## 2025-01-16: Alt-Tab Page Refresh Issue

### Decision: Remove useIsVisible Hook Dependency
**Context**: Alt-tabbing caused page to appear refreshed and break dropdown functionality  
**Options Considered**:
1. Add debouncing to visibility changes
2. Improve state persistence across visibility changes
3. Remove visibility dependency entirely

**Chosen**: #3 - Remove dependency  
**Rationale**:
- Companies data doesn't change frequently enough to warrant constant refetch
- Page visibility is unreliable indicator of need to refresh data
- Eliminates unnecessary API calls and state resets

**Implementation**: Removed isVisible from useEffect dependency array  
**Outcome**: Reduced unnecessary refetches but didn't solve core selection issue

---

## 2025-01-15: LLM Provider Model Updates

### Decision: Support Latest 2025 Models
**Context**: New models released by all major providers (GPT-4.1, Claude 4, Gemini 2.5)  
**Options Considered**:
1. Wait for stability before implementing
2. Add new models alongside existing ones
3. Replace defaults with new models

**Chosen**: #2 - Add new models, update defaults  
**Rationale**:
- Competitive advantage in supporting latest models
- Backward compatibility for users with existing preferences
- Updated defaults provide better cost/performance ratio

**Implementation**: Updated PROVIDER_MODELS and DEFAULT_MODELS constants  
**Outcome**: Platform supports cutting-edge LLM capabilities  
**Usage**: Users report improved analysis quality with new models

---

## 2025-01-14: Admin API Key Management System

### Decision: Complete Admin Key Assignment System
**Context**: Need for admins to assign API keys with default models to users  
**Options Considered**:
1. Simple key sharing without admin assignment
2. Admin assignment with user override capability
3. Admin assignment with mandatory usage

**Chosen**: #2 - Admin assignment with user override  
**Rationale**:
- Balances admin control with user flexibility
- Enables onboarding without requiring user API keys
- Maintains user autonomy for advanced users

**Implementation**: Admin dashboard, assignment API routes, auto-configuration  
**Outcome**: Successful admin onboarding workflow  
**User Feedback**: Significantly improves new user experience

---

## 2025-01-17: Database Query Debugging Strategy

### Decision: Enhanced Query Performance Monitoring
**Context**: Click handlers work but fetchCompanyTypes database query appears to hang silently  
**Options Considered**:
1. Assume RLS (Row Level Security) permission issue
2. Implement query timeout with fallback
3. Add detailed timing and progress logging to isolate failure point

**Chosen**: #3 - Detailed diagnostic logging first  
**Rationale**:
- Need empirical data before making architectural changes
- Timing data will distinguish between network, permission, and performance issues
- Systematic debugging approach proven effective in previous phases

**Implementation**: Added performance.now() timing, START/COMPLETE markers, session validation logging  
**Outcome**: ✅ **Issue Redirected** - Revealed symptoms, but Gemini identified true root cause  
**Next Steps**: Led to discovering race condition in onChange handler (see next decision entry)

---

## 2025-01-17: Race Condition Resolution in State Management

### Decision: Implement Gemini's onChange Handler Separation Pattern
**Context**: Database query appeared to hang, but Gemini analysis revealed race condition in state management  
**Options Considered**:
1. Add database query timeouts and retry logic
2. Investigate Row Level Security policies
3. Fix race condition in onChange handler as identified by Gemini

**Chosen**: #3 - Fix race condition per Gemini's analysis  
**Rationale**:
- Gemini correctly identified aggressive onChange handler resetting selectedCompany/availableCompanyTypes
- onChange was creating timing conflicts between typing and database queries
- Surgical fix addresses root cause rather than symptoms

**Implementation**: 
- Separated typing state (filteredCompanies) from selection state (selectedCompany)
- onChange only manages filtering logic, preserves selection persistence
- Cleaned up handleCompanySelect to match Gemini's specification

**Outcome**: ✅ **COMPLETE SUCCESS** - End-to-end dropdown selection workflow functional  
**Lessons Learned**: Multi-AI collaboration and systematic debugging methodology highly effective  
**Future Considerations**: Apply TRIPOD framework to other complex technical issues

---

## Decision Template for Future Entries

```markdown
## YYYY-MM-DD: Decision Title

### Decision: Brief Decision Statement
**Context**: What situation prompted this decision  
**Options Considered**:
1. Option A - brief description
2. Option B - brief description  
3. Option C - brief description

**Chosen**: #X - Selected option  
**Rationale**:
- Primary reason for selection
- Secondary considerations
- Why alternatives were rejected

**Implementation**: How the decision was executed  
**Outcome**: Results and effectiveness  
**Lessons Learned**: What we discovered  
**Future Considerations**: What to watch for
```

---

**Maintenance Notes**:
- Add new decisions as they occur
- Include enough context for future developers
- Link to relevant commits/PRs when applicable
- Review and update outcomes as they become clear