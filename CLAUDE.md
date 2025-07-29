# NextER Development Context

This is the NextER (Next Earnings Release) project directory containing a sophisticated SaaS platform for AI-powered earnings call transcript analysis.

## Current Project Status
- **Production**: Deployed on Vercel at lanoitcif.com
- **Database**: Supabase project xorjwzniopfuosadwvfu
- **Authentication**: Login functionality fully operational with enhanced session management
- **Recent Major Updates (July 29, 2025)**:
  - Transcript feedback system with thumbs up/down ratings implemented
  - Comprehensive analysis history feature with search and filtering
  - Session management improvements to reduce alt-tab loading issues
  - Performance database indexes for scalable history queries
- **Previous Fixes (July 28, 2025)**:
  - JSONEditor system prompt error resolved
  - Login stuck on loading issue fixed
  - Visibility change state reset eliminated
  - Dropdown font color contrast improved
- **Current Known Issue**: File uploads from Android devices (specifically Chrome browser) still result in a 'loading' state with no progress. The request does not appear to reach the backend. Further investigation required with client-side debugging.

## Development Standards
- TypeScript strict mode required
- >80% test coverage mandate
- Comprehensive error handling
- Security-first approach with AES-256-GCM encryption

## Key Features Implemented
1. Multi-LLM support for transcript analysis ✅
2. Industry-specific analysis templates ✅
3. File upload system for transcripts (PDF/DOC/TXT) ✅ (Desktop only, Android pending)
4. Simplified Analysis Type workflow ✅
5. Additional Review feature ✅
6. **NEW**: Transcript feedback system ✅
7. **NEW**: Analysis history with search/filter capabilities ✅

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
- **Session Management**: Enhanced to prevent unnecessary loading states on alt-tab
- **API Endpoints**: New /api/history and /api/feedback routes with comprehensive security

## Previous Technical Changes (July 28, 2025)
- **AuthContext.tsx**: Added clearCorruptedSession function, removed visibility-based refresh
- **System Prompts Admin**: Replaced JSONEditor with textarea for plain text handling
- **globals.css**: Added explicit select element styling for proper theme contrast
- **Documentation**: Consolidated into DEVELOPMENT_STATUS.md for easier maintenance

Current focus: Testing new features and resolving Android file upload issue.