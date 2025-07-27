# NextER Development Context

This is the NextER (Next Earnings Release) project directory containing a sophisticated SaaS platform for AI-powered earnings call transcript analysis.

## Current Project Status
- **Production**: Deployed on Vercel at lanoitcif.com
- **Database**: Supabase project xorjwzniopfuosadwvfu
- **Issue**: Login functionality is now resolved.
- **Current Known Issue**: File uploads from Android devices (specifically Chrome browser) still result in a 'loading' state with no progress. The request does not appear to reach the backend. Further investigation required with client-side debugging.

## Development Standards
- TypeScript strict mode required
- >80% test coverage mandate
- Comprehensive error handling
- Security-first approach with AES-256-GCM encryption

## Key Features Being Developed
1. Multi-LLM support for transcript analysis (Implemented)
2. Industry-specific analysis templates (Implemented)
3. File upload system for transcripts (PDF/DOC/TXT) (Implemented for Desktop, Android pending)
4. Simplified Analysis Type workflow (Implemented)
5. Additional Review feature (Implemented)

## Testing Commands
- `npm test` - Run test suite
- `npm run type-check` - TypeScript validation  
- `npm run lint` - Code linting

Current focus: Resolving production login issues and simplifying user workflows.