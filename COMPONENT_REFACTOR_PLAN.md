# Analyze Component Refactoring Plan

## Current State
- **File**: `app/dashboard/analyze/page.tsx`
- **Lines**: 1,771 lines
- **Complexity**: Extremely high - violates single responsibility principle
- **State Management**: Single massive useReducer with 20+ state variables

## Proposed Component Structure

### 1. Core Page Component (`analyze/page.tsx`) - ~200 lines
- Main layout and orchestration
- Route protection and auth checks
- Top-level state management
- Component composition

### 2. Company Selection (`components/analyze/CompanySelector.tsx`) - ~150 lines
- Ticker input and autocomplete
- Company search dropdown
- Company selection logic
- Recent companies display

### 3. Analysis Configuration (`components/analyze/AnalysisConfig.tsx`) - ~200 lines
- Company type selection
- Analysis type dropdown
- Additional review toggle
- Configuration state management

### 4. API Key Management (`components/analyze/ApiKeySelector.tsx`) - ~180 lines
- Key source selection (owner/saved/temporary)
- Saved keys dropdown
- Temporary key input
- Provider and model selection

### 5. File Upload (`components/analyze/TranscriptUpload.tsx`) - ~120 lines
- File upload interface
- Drag and drop support
- File validation
- Upload progress

### 6. Transcript Editor (`components/analyze/TranscriptEditor.tsx`) - ~100 lines
- Text area for manual input
- Character count
- Paste support
- Clear functionality

### 7. Analysis Results (`components/analyze/AnalysisResults.tsx`) - ~250 lines
- Result display with markdown rendering
- Export functionality (Word/HTML)
- Copy to clipboard
- Feedback (thumbs up/down)
- Save to history

### 8. Loading State (`components/analyze/AnalysisLoading.tsx`) - ~50 lines
- Loading animation
- Progress indicators
- Status messages
- Cancel option

### 9. Error Handling (`components/analyze/AnalysisError.tsx`) - ~80 lines
- Error display
- Retry logic
- Error recovery suggestions
- Support contact

## Shared Utilities

### 1. State Management (`lib/analyze/state.ts`) - ~150 lines
- Reducer definition
- Action types
- State interfaces
- Initial state

### 2. API Calls (`lib/analyze/api.ts`) - ~200 lines
- Analysis submission
- File extraction
- Company search
- Type fetching
- History saving

### 3. Validation (`lib/analyze/validation.ts`) - ~100 lines
- Transcript validation
- File type checking
- API key validation
- Input sanitization

### 4. Export Utilities (`lib/analyze/export.ts`) - ~150 lines
- Word document generation
- HTML export
- Markdown conversion
- Download helpers

## Custom Hooks

### 1. `useAnalysisState` - ~50 lines
- Centralized state management
- Persistence to localStorage
- State synchronization

### 2. `useCompanySearch` - ~80 lines
- Debounced search
- Cache management
- Error handling

### 3. `useApiKeys` - ~100 lines
- Key fetching
- Encryption/decryption
- Provider management

### 4. `useAnalysisSubmit` - ~120 lines
- Submission logic
- Progress tracking
- Error recovery

## Implementation Steps

### Phase 1: Setup (Day 1)
1. Create component directory structure
2. Set up shared types and interfaces
3. Create base component shells
4. Set up props interfaces

### Phase 2: Extract Logic (Day 2-3)
1. Move state management to reducer
2. Extract API calls to lib
3. Create custom hooks
4. Set up context if needed

### Phase 3: Component Migration (Day 4-5)
1. Start with leaf components (Loading, Error)
2. Move to data components (CompanySelector, ApiKeySelector)
3. Handle complex components (Results, Config)
4. Wire up main page component

### Phase 4: Testing (Day 6-7)
1. Unit tests for each component
2. Integration tests for workflows
3. E2E test for full analysis flow
4. Performance testing

### Phase 5: Optimization (Day 8)
1. Code splitting with dynamic imports
2. Memoization where appropriate
3. Lazy loading for heavy components
4. Bundle size optimization

## Benefits of Refactoring

1. **Maintainability**: Each component has single responsibility
2. **Testability**: Components can be tested in isolation
3. **Reusability**: Components can be used elsewhere
4. **Performance**: Better code splitting and lazy loading
5. **Developer Experience**: Easier to understand and modify
6. **Type Safety**: Better TypeScript inference with smaller components

## Success Criteria

- [ ] No component exceeds 300 lines
- [ ] Each component has single responsibility
- [ ] 80%+ test coverage for all components
- [ ] No performance regression
- [ ] Improved bundle size
- [ ] Clear component documentation
- [ ] Storybook stories for UI components

## Risk Mitigation

1. **Feature Parity**: Create comprehensive test of current functionality first
2. **Gradual Migration**: Refactor incrementally, maintaining working state
3. **State Management**: Ensure state synchronization during transition
4. **User Testing**: Test all workflows after each phase
5. **Rollback Plan**: Keep original component until fully validated

## Estimated Timeline

- **Total Effort**: 8-10 days with single developer
- **With Parallel Work**: 4-5 days with 2 developers
- **Testing**: Additional 2-3 days
- **Documentation**: 1 day

## Next Actions

1. Create component directory structure
2. Set up Storybook for component development
3. Write comprehensive tests for current functionality
4. Begin Phase 1 implementation