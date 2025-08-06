# Refactoring Plan: Analyze Component (1771 lines)

## Executive Summary
The `/app/dashboard/analyze/page.tsx` component is currently 1771 lines of code, making it extremely difficult to maintain, test, and understand. This refactoring plan breaks it down into manageable, testable, and reusable components following React best practices and SOLID principles.

## Current Issues
1. **Monolithic Structure**: Single file contains all logic, UI, and state management
2. **Mixed Concerns**: Business logic, API calls, UI rendering all in one component
3. **State Management Complexity**: Large useReducer with 30+ action types
4. **Difficult Testing**: Cannot unit test individual features
5. **Poor Reusability**: Cannot reuse company selector, API key manager, etc.
6. **Performance Issues**: Entire component re-renders on any state change

## Proposed Architecture

### 1. Component Breakdown Structure
```
app/dashboard/analyze/
├── page.tsx                      # Main container (< 200 lines)
├── components/
│   ├── CompanySelector/
│   │   ├── index.tsx            # Company search & selection
│   │   ├── CompanyDropdown.tsx  # Dropdown list component
│   │   └── types.ts             # Company interfaces
│   ├── TranscriptUploader/
│   │   ├── index.tsx            # File upload logic
│   │   ├── FileDropzone.tsx    # Drag & drop UI
│   │   ├── TranscriptInput.tsx # Text input area
│   │   └── utils.ts            # File parsing utilities
│   ├── AnalysisTypeSelector/
│   │   ├── index.tsx            # Company type selection
│   │   └── CompanyTypeCard.tsx # Individual type card
│   ├── ApiConfiguration/
│   │   ├── index.tsx            # API key & model selection
│   │   ├── KeySourceSelector.tsx
│   │   ├── ModelSelector.tsx
│   │   └── ApiKeyManager.tsx
│   ├── AnalysisResults/
│   │   ├── index.tsx            # Results display container
│   │   ├── MarkdownViewer.tsx  # Markdown rendering
│   │   ├── ResultsToolbar.tsx  # Export/copy/view controls
│   │   └── FeedbackButtons.tsx # Thumbs up/down
│   └── ReviewAnalysis/
│       ├── index.tsx            # Additional review feature
│       └── ReviewSettings.tsx  # Review configuration
├── hooks/
│   ├── useCompanySearch.ts     # Company search logic
│   ├── useTranscriptAnalysis.ts # Analysis submission
│   ├── useApiKeys.ts           # API key management
│   └── useFeedback.ts          # Feedback submission
├── services/
│   ├── analysisService.ts      # API calls for analysis
│   ├── companyService.ts       # Company data fetching
│   └── exportService.ts        # Export functionality
├── store/
│   ├── analysisStore.ts        # Zustand store for analysis state
│   ├── types.ts                # State type definitions
│   └── actions.ts              # Store actions
└── utils/
    ├── validators.ts            # Input validation
    ├── formatters.ts           # Data formatting
    └── constants.ts            # Constants and configs
```

### 2. State Management Refactoring

#### Replace useReducer with Zustand
```typescript
// store/analysisStore.ts
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface AnalysisState {
  // Company selection
  company: {
    ticker: string
    selected: Company | null
    list: Company[]
    filtered: Company[]
    loading: boolean
  }
  
  // Transcript
  transcript: {
    content: string
    source: 'file' | 'input'
    fileName?: string
  }
  
  // Analysis configuration
  config: {
    companyType: CompanyType | null
    keySource: 'owner' | 'user_saved' | 'user_temporary'
    provider: Provider
    model: string
    apiKey?: string
  }
  
  // Results
  results: {
    content: string
    metadata: AnalysisMetadata | null
    viewMode: 'rendered' | 'markdown'
    transcriptId: string | null
    feedbackSubmitted: boolean
  }
  
  // Review
  review: {
    enabled: boolean
    provider: Provider
    model: string
    content: string
    metadata: AnalysisMetadata | null
  }
  
  // Actions
  actions: {
    setCompany: (company: Company) => void
    setTranscript: (content: string, source: 'file' | 'input') => void
    setConfig: (config: Partial<AnalysisConfig>) => void
    submitAnalysis: () => Promise<void>
    submitReview: () => Promise<void>
    exportResults: (format: 'docx' | 'html') => Promise<void>
    submitFeedback: (positive: boolean) => Promise<void>
    reset: () => void
  }
}

export const useAnalysisStore = create<AnalysisState>()(
  devtools(
    (set, get) => ({
      // Initial state...
      // Actions implementation...
    })
  )
)
```

### 3. Component Examples

#### CompanySelector Component
```typescript
// components/CompanySelector/index.tsx
export const CompanySelector: React.FC = () => {
  const { company, actions } = useAnalysisStore()
  const { searchCompanies, loading } = useCompanySearch()
  
  return (
    <div className="relative">
      <Label>Company Ticker</Label>
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4" />
        <Input
          value={company.ticker}
          onChange={(e) => searchCompanies(e.target.value)}
          placeholder="Enter ticker (e.g., AAPL)"
          className="pl-10"
        />
      </div>
      {company.filtered.length > 0 && (
        <CompanyDropdown
          companies={company.filtered}
          onSelect={actions.setCompany}
        />
      )}
    </div>
  )
}
```

#### Custom Hook Example
```typescript
// hooks/useCompanySearch.ts
export const useCompanySearch = () => {
  const [loading, setLoading] = useState(false)
  const { actions } = useAnalysisStore()
  
  const searchCompanies = useCallback(
    debounce(async (query: string) => {
      if (query.length < 2) {
        actions.setFilteredCompanies([])
        return
      }
      
      setLoading(true)
      try {
        const companies = await companyService.search(query)
        actions.setFilteredCompanies(companies)
      } catch (error) {
        console.error('Company search failed:', error)
        actions.setFilteredCompanies([])
      } finally {
        setLoading(false)
      }
    }, 300),
    []
  )
  
  return { searchCompanies, loading }
}
```

### 4. Service Layer Example
```typescript
// services/analysisService.ts
export class AnalysisService {
  static async submitAnalysis(params: {
    transcript: string
    company: Company
    companyType: CompanyType
    config: AnalysisConfig
  }): Promise<AnalysisResult> {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transcript: params.transcript,
        ticker: params.company.ticker,
        companyName: params.company.name,
        companyType: params.companyType.name,
        systemPrompt: params.companyType.system_prompt_template,
        provider: params.config.provider,
        model: params.config.model,
        keySource: params.config.keySource,
        apiKey: params.config.apiKey,
      })
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Analysis failed')
    }
    
    return response.json()
  }
}
```

## Implementation Plan

### Phase 1: Setup & Infrastructure (Week 1)
1. **Day 1-2**: Create folder structure and setup Zustand store
   - Create all directories
   - Install Zustand
   - Define TypeScript interfaces
   - Setup store with initial state

2. **Day 3-4**: Extract service layer
   - Create analysisService.ts
   - Create companyService.ts
   - Create exportService.ts
   - Move all API calls to services

3. **Day 5**: Setup testing infrastructure
   - Create test files for each service
   - Setup mock data
   - Write initial service tests

### Phase 2: Component Extraction (Week 2)
1. **Day 1-2**: Extract CompanySelector
   - Create component files
   - Move company search logic
   - Create useCompanySearch hook
   - Write component tests

2. **Day 3**: Extract TranscriptUploader
   - Create file upload components
   - Extract file parsing logic
   - Create drag & drop functionality
   - Write tests

3. **Day 4**: Extract ApiConfiguration
   - Create API key selector
   - Create model selector
   - Move configuration logic
   - Write tests

4. **Day 5**: Extract AnalysisResults
   - Create results display component
   - Extract markdown rendering
   - Create export toolbar
   - Write tests

### Phase 3: State Migration (Week 3)
1. **Day 1-2**: Migrate from useReducer to Zustand
   - Replace reducer with store actions
   - Update all component connections
   - Ensure state persistence

2. **Day 3**: Optimize performance
   - Add React.memo where appropriate
   - Implement useMemo for expensive computations
   - Add loading states and suspense

3. **Day 4-5**: Integration testing
   - Test complete workflow
   - Fix any integration issues
   - Performance testing

### Phase 4: Polish & Documentation (Week 4)
1. **Day 1-2**: Code cleanup
   - Remove old code
   - Optimize imports
   - Add proper error boundaries

2. **Day 3**: Documentation
   - Add JSDoc comments
   - Create component documentation
   - Update README

3. **Day 4-5**: Final testing & deployment
   - Full regression testing
   - Performance benchmarking
   - Staged rollout

## Success Metrics
- **Code Quality**
  - Main component < 200 lines
  - No component > 300 lines
  - Test coverage > 80%
  
- **Performance**
  - Initial load time < 2s
  - Re-render time < 100ms
  - Bundle size reduced by 30%

- **Maintainability**
  - Cyclomatic complexity < 10 per function
  - Clear separation of concerns
  - Reusable components

## Risk Mitigation
1. **Feature Parity**: Create comprehensive test suite before refactoring
2. **Gradual Migration**: Use feature flags to switch between old/new
3. **Rollback Plan**: Keep old component until new one is stable
4. **User Testing**: Beta test with small user group first

## Dependencies
- Zustand for state management
- React Testing Library for component tests
- MSW for API mocking in tests
- Feature flag system for gradual rollout

## Estimated Timeline
- **Total Duration**: 4 weeks
- **Developer Resources**: 1-2 developers
- **Review Points**: End of each week
- **Go-Live**: Week 5 (after testing period)

## Next Steps
1. Review and approve plan
2. Create feature branch
3. Setup Zustand and testing infrastructure
4. Begin Phase 1 implementation
5. Schedule weekly review meetings

---

**Document Version**: 1.0  
**Created**: August 6, 2025  
**Author**: NextER Development Team  
**Status**: Ready for Review