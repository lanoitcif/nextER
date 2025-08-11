# NextER Development Context

This is the NextER (Next Earnings Release) project directory containing a sophisticated SaaS platform for AI-powered earnings call transcript analysis.

## Current Project Status (August 6, 2025 - Active Development)
- **Production**: Deployed on Vercel at nextearningsrelease.com (formerly lanoitcif.com)
- **Build Status**: ✅ SUCCESSFUL  
- **Code Quality**: Improving - TDD approach established, refactoring planned
- **Database**: Supabase project xorjwzniopfuosadwvfu with RLS performance improvements applied
- **Authentication**: Login functionality operational (cache issues resolved)
- **Test Coverage**: <10% current, >80% target with TDD specifications created
- **Documentation**: Reorganized into clear structure (business/technical/development)
- **Next Phase**: Test infrastructure setup and component refactoring

## August 6, 2025 Development Session (PM) Accomplishments
1. **Test-Driven Development Foundation**:
   - Created comprehensive TDD specifications based on user value
   - Analyzed test coverage gap (<10% vs 80% requirement)
   - Identified 60+ missing test files needed

2. **RLS Performance Improvements**:
   - Reviewed and merged Jules' RLS refactoring branch
   - Applied private schema with cached security functions
   - Created comprehensive database backups before migration

3. **Documentation & Planning**:
   - Created component refactoring plan (1,771-line analyze component)
   - Reorganized documentation into clear directory structure
   - Updated all documentation with current status

## August 6, 2025 Development Session (AM) Accomplishments  
1. **Template Management System**: 
   - Built advanced template CRUD UI with tabbed interface
   - Added JSON configuration editors with examples
   - Integrated LLM settings (temperature, top_p, penalties)

2. **UI/UX Improvements**:
   - Fixed font color legibility issues in both themes
   - Enhanced contrast for WCAG compliance

## August 2, 2025 Session Accomplishments
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

## Critical Issues Being Addressed
1. **RLS Performance**: Jules working on refactoring in feature branch
2. **Component Refactoring**: Jules addressing analyze/page.tsx (1845 lines)
3. **Security Settings**: 
   - OTP expiry too long (604800 seconds = 7 days)
   - Leaked password protection disabled
4. **Test Coverage**: Only 5 test files - TDD approach now documented

## Technical Debt
- **Test Coverage**: Comprehensive TDD specification created
- **Hardcoded Values**: LLM model lists should be configuration-driven
- **Deepgram Integration**: Fixed fetch error in streaming endpoint

## Archived Issues
- **Android File Upload**: Deprioritized - multiple versions old, to be retested later
- **Mobile Word Export**: iPhone compatibility - needs retesting after updates
- **UI/UX Font Color**: Resolved in previous updates

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

## Immediate Priorities (In Order) - Resume Here
1. **Complete RLS Migration** - Apply remaining policies (functions already installed)
2. **Run RLS Test Suite** - Verify migration with Jules' test file
3. **Begin Component Refactoring** - Split 1,771-line analyze/page.tsx per plan
4. **Set Up Test Infrastructure** - Jest, MSW, Playwright (critical gap)
5. **Template Library UI** - Core feature for business value

## Session End Status (August 6, 2025 PM)
- ✅ TDD specifications created (docs/development/TEST_DRIVEN_DEVELOPMENT.md)
- ✅ Test gap analysis complete (<10% coverage, need 60+ test files)
- ✅ Jules' RLS work merged (partial migration applied)
- ✅ Database backed up (backups/ directory)
- ✅ Documentation reorganized (business/technical/development structure)
- ✅ Repository cleaned (deleted merged branches, archived old files)
- ⏳ RLS migration partially applied (private schema done, policies pending)
- ⏳ Deepgram streaming partially fixed (navigation works, errors remain)

## Planned Feature Development

### System Prompt Management Enhancement (August 2025)
**Status**: Technical specification completed
**Documentation**: `/docs/SYSTEM_PROMPT_MANAGEMENT_TECHNICAL_SPEC.md`

**Overview**: Complete overhaul of system prompt and placeholder management system to replace current textarea-based editing with sophisticated template management.

**Key Features**:
- **Template Library**: Hierarchical template system with inheritance (Global → Industry → Company)
- **Visual Placeholder Builders**: Drag-drop interfaces for complex JSON configurations
- **Organizational Hierarchy**: Industry-based categorization and bulk operations
- **Template Analytics**: Usage tracking and performance metrics
- **Advanced UI**: Modern, intuitive interface replacing current simple textarea editing

**Technical Approach**:
- Enhanced database schema with template versioning and inheritance
- React-based visual builders for classification rules, key metrics, and validation rules
- Template rendering service with caching and performance optimization
- Comprehensive API with proper TypeScript interfaces and validation

**Implementation Timeline**: 16-week phased approach
- Phase 1 (Weeks 1-3): Database enhancement and API foundation
- Phase 2 (Weeks 4-7): Core UI components development
- Phase 3 (Weeks 8-10): Organizational hierarchy and assignment management
- Phase 4 (Weeks 11-14): Advanced features and migration system
- Phase 5 (Weeks 15-16): Testing, optimization, and deployment

**Expected Benefits**:
- 50% reduction in time to create/modify analyst types
- 75% fewer analysis failures due to prompt errors
- Template reusability across similar companies and industries
- Non-technical admin users can manage complex configurations

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