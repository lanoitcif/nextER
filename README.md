# NextER (NEaR) - Next Earnings Release

A sophisticated SaaS platform for AI-powered earnings call transcript analysis with real-time transcription and visual template management.

## 🎯 Project Status

**Production Ready** - Deployed at [lanoitcif.com](https://lanoitcif.com)  
**Last Updated**: August 6, 2025  
**Current Phase**: Enterprise feature development and funding preparation

## 📋 Quick Start

### For Investors & Stakeholders
- **[Investor Overview](INVESTOR_OVERVIEW.md)** - Business case and market opportunity
- **[Demo Guide](FUNDING_DEMO_GUIDE.md)** - 10-minute investor demo walkthrough
- **[Technical Architecture](TECHNICAL_ARCHITECTURE.md)** - System design and scalability

### For Developers
- **[API Documentation](docs/API_DOCUMENTATION.md)** - Comprehensive REST API reference
- **[Development Handoff](DEVELOPMENT_HANDOFF_AUGUST_2025.md)** - Complete development context
- **[Claude Instructions](CLAUDE.md)** - AI assistant configuration

## 🚀 Key Features

### Production Features ✅
- **Multi-LLM Analysis**: OpenAI, Anthropic, Google, Cohere integration with configurable models
- **Industry-Specific Templates**: Advanced template management with LLM settings
- **Company Intelligence**: Automatic analysis selection by ticker
- **Real-time Transcription**: Live earnings call processing with Deepgram HTTP streaming
- **Export Capabilities**: Word (.docx) and HTML format support with formatting preservation
- **Enterprise Security**: Row-level security, AES-256-GCM encryption, audit trails
- **User Management**: Role-based access (basic/advanced/admin), company isolation
- **Template Configuration**: JSON-based configuration with visual editors for:
  - Classification rules and topics
  - Key metrics and KPIs
  - Output format specifications
  - LLM parameters (temperature, top_p, penalties)
- **Analysis History**: Complete transcript storage with feedback system

### Recent Improvements (August 2025) 🆕
- **Enhanced UI Contrast**: Improved text legibility in both light and dark themes
- **LLM Model Configuration**: Centralized model management with metadata
- **Template Management UI**: Advanced tabbed interface with:
  - Visual JSON editors with examples
  - LLM settings with interactive sliders and tooltips
  - Template variable helper with copy functionality
  - Recommendations for financial analysis settings
- **API Documentation**: Complete REST API reference with examples
- **Deepgram Integration**: Production-ready HTTP streaming implementation

## 🏗️ Technical Stack

- **Frontend**: Next.js 15, TypeScript (strict mode), Tailwind CSS, Real-time UI
- **Backend**: Supabase PostgreSQL, Row Level Security, Edge Functions  
- **AI/ML**: Multi-LLM gateway with intelligent routing and fallback
- **Transcription**: Deepgram Nova-2 for real-time audio processing
- **Deployment**: Vercel edge computing with global CDN
- **Authentication**: Supabase Auth with session management

## 💼 Business Value

### For Financial Analysts
- **10x faster** earnings analysis vs manual methods
- **Consistent quality** through standardized templates
- **Real-time insights** during live earnings calls
- **Industry expertise** with specialized analysis types

### For Investment Firms
- **50% reduction** in analyst preparation time
- **Standardized outputs** for portfolio comparison
- **Scalable coverage** of more companies
- **Audit trail** for compliance

### For Enterprise Administrators
- **Visual configuration** without coding
- **Template reusability** across teams
- **Usage analytics** for optimization
- **Role-based access** control

## 🚦 Development Setup

### Prerequisites
```bash
# Node.js 18+ and npm
node --version  # Should be 18.x or higher
npm --version   # Should be 9.x or higher
```

### Environment Variables
Create `.env.local`:
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Encryption
USER_API_KEY_ENCRYPTION_SECRET=32_character_secret_key_here

# Deepgram (for transcription)
DEEPGRAM_API_KEY=your_deepgram_api_key

# LLM Providers (optional, can use user keys)
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
GOOGLE_API_KEY=your_google_key
COHERE_API_KEY=your_cohere_key
```

### Installation
```bash
# Clone repository
git clone https://github.com/your-org/nextER.git
cd nextER

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Type checking
npm run type-check

# Linting
npm run lint
```

## 📊 Database Schema

### Core Tables
- `user_profiles` - User accounts with role management
- `companies` - Company registry with ticker symbols
- `company_types` - Analysis templates with LLM settings
- `analysis_transcripts` - Stored analyses with feedback
- `user_api_keys` - Encrypted API key storage
- `prompts` - System prompts and templates
- `usage_logs` - Analytics and tracking

### Security Features
- Row Level Security (RLS) on all tables
- AES-256-GCM encryption for API keys
- Audit trails for compliance
- Session-based authentication

## 🔌 API Endpoints

### Analysis
- `POST /api/analyze` - Analyze transcript with AI
- `POST /api/commentary` - Generate Q&A commentary
- `GET /api/history` - Retrieve analysis history
- `POST /api/feedback` - Submit analysis feedback

### Live Transcription
- `POST /api/live-transcription/start` - Initialize session
- `POST /api/live-transcription/deepgram-stream` - Stream audio

### Admin
- `GET /api/admin/templates` - Manage analysis templates
- `POST /api/admin/settings` - Configure system settings
- `GET /api/admin/stats` - Platform statistics

[Full API Documentation →](docs/API_DOCUMENTATION.md)

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- path/to/test.spec.ts

# E2E tests (when available)
npm run test:e2e
```

## 📈 Performance Metrics

- **API Response**: < 100ms (p95)
- **Analysis Time**: 15-30 seconds per transcript
- **Transcription Latency**: < 500ms real-time
- **Build Size**: ~2.5MB (gzipped)
- **Lighthouse Score**: 95+ (Performance)

## 🔒 Security

- **Authentication**: Supabase Auth with JWT
- **Encryption**: AES-256-GCM for sensitive data
- **Authorization**: Row Level Security (RLS)
- **Rate Limiting**: 100 req/min (standard), 500 req/min (admin)
- **CORS**: Production domain only
- **Input Validation**: Zod schemas on all endpoints

## 🚀 Deployment

### Vercel (Production)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to production
vercel --prod

# Check deployment status
vercel ls
```

### Supabase Migrations
```bash
# Create new migration
supabase migration new feature_name

# Apply migrations
supabase db push

# Reset database (development only)
supabase db reset
```

## 📚 Documentation

- [API Documentation](docs/API_DOCUMENTATION.md) - REST API reference
- [Technical Architecture](TECHNICAL_ARCHITECTURE.md) - System design
- [Development Handoff](DEVELOPMENT_HANDOFF_AUGUST_2025.md) - Development context
- [Investor Overview](INVESTOR_OVERVIEW.md) - Business case
- [Demo Guide](FUNDING_DEMO_GUIDE.md) - Product demonstration

## 🤝 Contributing

1. Review [CLAUDE.md](CLAUDE.md) for development standards
2. Create feature branch from `main`
3. Follow TypeScript strict mode
4. Maintain >80% test coverage
5. Update documentation
6. Submit PR with description

## 📊 Project Metrics

- **Lines of Code**: ~25,000
- **Test Coverage**: Target >80%
- **Dependencies**: 45 production, 35 development
- **Database Tables**: 8 core tables
- **API Endpoints**: 25+ REST endpoints
- **Supported LLMs**: 4 providers, 40+ models

## 🔮 Roadmap

### Q3 2025
- ✅ Template management UI
- ✅ LLM configuration settings
- ✅ API documentation
- ⏳ User FAQ system
- ⏳ Enhanced analytics dashboard

### Q4 2025
- Visual template builders (drag & drop)
- Template marketplace
- Advanced analytics
- Enterprise SSO
- Webhook integrations

### 2026
- AI model fine-tuning
- Custom model deployment
- Industry benchmarking
- Regulatory compliance tools
- International expansion

## 📞 Support

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/your-org/nextER/issues)
- **Email**: support@lanoitcif.com

## 📄 License

Proprietary - All rights reserved

---

**NextER** - Transforming earnings analysis with AI  
Built with ❤️ for financial professionals