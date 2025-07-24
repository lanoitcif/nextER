# NextER Development Context

This is the NextER (Next Earnings Release) project directory containing a sophisticated SaaS platform for AI-powered earnings call transcript analysis.

## Current Project Status
- **Production**: Deployed on Vercel at lanoitcif.com
- **Database**: Supabase project xorjwzniopfuosadwvfu
- **Issue**: Login functionality currently broken due to RLS policy recursion

## Development Standards
- TypeScript strict mode required
- >80% test coverage mandate
- Comprehensive error handling
- Security-first approach with AES-256-GCM encryption

## Key Features Being Developed
1. Multi-LLM support for transcript analysis
2. Industry-specific analysis templates
3. File upload system for transcripts (PDF/DOC/TXT)
4. Simplified Analysis Type workflow

## Testing Commands
- `npm test` - Run test suite
- `npm run type-check` - TypeScript validation  
- `npm run lint` - Code linting

Current focus: Resolving production login issues and simplifying user workflows.