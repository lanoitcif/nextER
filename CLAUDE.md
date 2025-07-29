# NextER Development Context

This is the NextER (Next Earnings Release) project directory containing a sophisticated SaaS platform for AI-powered earnings call transcript analysis.

## Current Project Status (July 29, 2025 - Evening Update)
- **Production**: Deployed on Vercel at lanoitcif.com
- **Build Status**: ✅ SUCCESSFUL
- **Code Quality**: Good overall with technical debt in analyze component (1845 lines)
- **Database**: Supabase project xorjwzniopfuosadwvfu
- **Authentication**: Login functionality fully operational with enhanced session management

## Today's Major Accomplishments (July 29, 2025)
1. **Export Functionality Enhancement**: 
   - Added HTML export button alongside Word export
   - Implemented mobile-friendly Word export using .doc format
   - Both exports preserve formatting (tables, headings, lists)
   - HTML export works universally with inline CSS

2. **Comprehensive Codebase Analysis Completed**:
   - Identified critical issues: Android file upload, security settings, RLS performance
   - Found technical debt: Large analyze component needs refactoring
   - Limited test coverage (only 5 test files)
   - Good overall architecture and TypeScript usage

## Critical Issues Identified
1. **Android File Upload**: Still broken on Chrome mobile - endless loading state
2. **Security Settings**: 
   - OTP expiry too long (604800 seconds = 7 days)
   - Leaked password protection disabled
3. **RLS Performance**: Circular dependencies in policies causing inefficiencies
4. **Mobile Word Export**: iPhone compatibility issues with .doc files
5. **UI/UX Issue**: Font color legibility problem reported (needs investigation)

## Technical Debt
- **analyze/page.tsx**: 1845 lines - needs splitting into smaller components
- **Test Coverage**: Only 5 test files - needs comprehensive testing
- **Hardcoded Values**: LLM model lists should be configuration-driven
- **Missing Documentation**: No API documentation for endpoints

## Development Standards
- TypeScript strict mode required
- >80% test coverage mandate
- Comprehensive error handling
- Security-first approach with AES-256-GCM encryption

## Working Features
1. Multi-LLM support for transcript analysis ✅
2. Industry-specific analysis templates ✅
3. File upload system for transcripts (PDF/DOC/TXT) ✅ (Desktop only, Android broken)
4. Simplified Analysis Type workflow ✅
5. Additional Review feature ✅
6. Transcript feedback system (thumbs up/down) ✅
7. Analysis history with search/filter capabilities ✅
8. **NEW**: Dual export options (Word .docx and HTML) ✅
9. Authentication and session management ✅
10. Admin panel with API key assignment ✅
11. Company search with auto-complete ✅

## Testing Commands
- `npm test` - Run test suite
- `npm run type-check` - TypeScript validation  
- `npm run lint` - Code linting

## Available Tools & Resources
- **Vercel CLI**: For deployment logs and monitoring
- **Supabase MCP**: Direct database queries and operations via mcp__supabase tools
- **Memory MCP**: Knowledge graph for tracking project history and decisions
- **Context7**: For reviewing documentation and best practices

## Recent Technical Changes (July 29, 2025)
- **Analysis Transcripts**: New table with performance indexes for storing analysis history
- **Feedback System**: Users can rate analyses with thumbs up/down, stored in database
- **History Feature**: Full-featured history page with search, filtering, and detailed views
- **View Analysis Modal**: Fixed critical issue where modal returned HTML instead of JSON
- **Middleware Configuration**: Excluded all API routes to prevent response interference
- **Session Management**: Enhanced to prevent unnecessary loading states on alt-tab
- **API Endpoints**: New /api/history and /api/feedback routes with comprehensive security

## Previous Technical Changes (July 28, 2025)
- **AuthContext.tsx**: Added clearCorruptedSession function, removed visibility-based refresh
- **System Prompts Admin**: Replaced JSONEditor with textarea for plain text handling
- **globals.css**: Added explicit select element styling for proper theme contrast
- **Documentation**: Consolidated into DEVELOPMENT_STATUS.md for easier maintenance

## Immediate Priorities (In Order)
1. **Fix Android file upload** - Critical user-facing issue
2. **Update Supabase security settings** - OTP expiry and password protection
3. **Fix RLS circular dependencies** - Performance and scalability issue
4. **Refactor analyze component** - Split 1845-line file into manageable pieces
5. **Add comprehensive testing** - Currently only 5 test files exist

## Architecture Notes
- **Good Practices Observed**:
  - Consistent use of TypeScript
  - Server-side API key encryption
  - Proper separation of concerns (mostly)
  - Well-structured database schema
  
- **Areas for Improvement**:
  - Component size (analyze/page.tsx)
  - Test coverage
  - Configuration management (hardcoded values)
  - API documentation

Current focus: Critical bug fixes and security improvements before feature development.