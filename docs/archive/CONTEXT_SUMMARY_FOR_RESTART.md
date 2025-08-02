# NextER Context Summary for Restart

**Generated**: August 1, 2025
**Purpose**: Critical context summary for continuing work after context window restart

## Project Overview
- **NextER (NEaR)**: AI-powered earnings call transcript analysis SaaS platform
- **Production**: lanoitcif.com on Vercel
- **Database**: Supabase (xorjwzniopfuosadwvfu)
- **Status**: Build successful, authentication operational

## Recent Work Completed (Chronologically)
1. Added "Hospitality REIT - Q&A Focus" analyst type to database and all hospitality_reit companies
2. Discovered placeholder system in analyze/route.ts:184-198 processing database JSONB columns
3. Created CSV export of all company types with placeholder values
4. Created comprehensive SYSTEM_PROMPT_MANAGEMENT_TECHNICAL_SPEC.md (1300+ lines, 16-week plan)
5. Analyzed repository and created PENDING_FEATURES_INVENTORY.md
6. Added entities to memory MCP for critical bugs and pending features

## Key Technical Discoveries
- **Placeholder System**: Template strings in system prompts replaced with JSONB data from company_types table
- **Available Placeholders**: {role}, {classification_rules}, {temporal_tags}, {operating_metrics}, {segment_metrics}, {financial_metrics}, {validation_rules}, {special_considerations}
- **Company Administration**: Full UI exists at /dashboard/admin/companies

## Critical Production Issues
1. **Android file upload**: Broken on Chrome mobile (endless loading)
2. **Security Settings**: OTP expiry 7 days (should be 1 hour), leaked password protection disabled
3. **RLS Performance**: Circular dependencies causing inefficiencies
4. **Mobile Word Export**: iPhone .doc compatibility issues

## Pending Features (Priority Order)
1. **Ready to Merge**: Whisper transcription feature (branch: feature/transcript-acceptance-and-qa-extraction)
2. **Planned**: Advanced System Prompt Management (16-week implementation spec complete)
3. **Technical Debt**: analyze/page.tsx refactoring (1845 lines), test coverage improvement

## Key Files for Reference
- `/home/john_w_dayton/nextER/CLAUDE.md` - Main project context
- `/app/api/analyze/route.ts` - Placeholder processing logic
- `/dashboard/admin/companies` - Company management UI
- `/docs/SYSTEM_PROMPT_MANAGEMENT_TECHNICAL_SPEC.md` - Future implementation plan
- `/PENDING_FEATURES_INVENTORY.md` - Complete feature inventory

## Next Immediate Actions
1. Review and merge Whisper transcription feature
2. Fix Supabase security settings (1-day task)
3. Investigate Android file upload issue
4. Start Phase 1 of System Prompt Management implementation

## Development Standards
- TypeScript strict mode required
- >80% test coverage mandate
- Run `npm test`, `npm run type-check`, `npm run lint` before commits
- Never create files unless necessary, prefer editing existing
- Security-first approach with comprehensive error handling

## Current Context Window
- User switched to Opus 4 model
- Created new specialized agents: financial-ui-architect, postgres-supabase-interop
- Completed review of all .MD files against memory MCP
- Ready for context window restart with all critical information preserved