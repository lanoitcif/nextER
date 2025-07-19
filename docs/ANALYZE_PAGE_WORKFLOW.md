```mermaid
flowchart TD
  A[Transcript Textarea]
  B[Ticker Input]
  C[Search Button]
  B --> C
  C --> D{Filtered Companies}
  D -->|Select| E[Selected Company]
  E --> F[Fetch Company Types]
  F --> G[Analysis Type Dropdown]
  G --> H[Provider Selection]
  H --> I[Model Dropdown]
  H --> J[API Key Source]
  J --> K[Saved API Key Dropdown]
  J --> L[Temporary API Key]
  K --> M[Analyze Button]
  L --> M
  I --> M
  M --> N[/api/analyze POST]
  N --> O[Result Display]
  O --> P[Copy Button]
  O --> Q[Download Word]
  O --> R[View Toggle]
  O --> S[Error Messages]
```
