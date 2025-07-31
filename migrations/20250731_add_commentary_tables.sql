-- Migration to add tables for structured Q&A commentary and commenters

BEGIN;

-- 1. Create the commenters table
CREATE TABLE IF NOT EXISTS public.commenters (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    title TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_name_company UNIQUE (name, company_id)
);

-- Enable RLS for the new table
ALTER TABLE public.commenters ENABLE ROW LEVEL SECURITY;

-- RLS Policies for commenters (read-only for users)
CREATE POLICY "Users can view commenters" ON public.commenters
  FOR SELECT USING (true);

-- 2. Create the qa_commentary table
CREATE TABLE IF NOT EXISTS public.qa_commentary (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    analysis_transcript_id UUID REFERENCES public.analysis_transcripts(id) ON DELETE CASCADE NOT NULL,
    commenter_id UUID REFERENCES public.commenters(id) ON DELETE SET NULL,
    analyst_name TEXT,
    analyst_firm TEXT,
    question_topic TEXT,
    key_points TEXT,
    quantitative_data TEXT,
    management_response TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_qa_commentary_analysis_transcript_id ON public.qa_commentary(analysis_transcript_id);
CREATE INDEX idx_qa_commentary_commenter_id ON public.qa_commentary(commenter_id);
CREATE INDEX idx_qa_commentary_question_topic ON public.qa_commentary(question_topic);


-- Enable RLS for the new table
ALTER TABLE public.qa_commentary ENABLE ROW LEVEL SECURITY;

-- RLS Policies for qa_commentary
CREATE POLICY "Users can view their own commentary" ON public.qa_commentary
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.analysis_transcripts
      WHERE id = analysis_transcript_id AND user_id = auth.uid()
    )
  );

-- 3. Update the system_prompt_template for 'hospitality_reit'
UPDATE public.company_types
SET 
  system_prompt_template = 'Role: {role}

CRITICAL INSTRUCTION: You MUST structure your response EXACTLY as shown below, using markdown tables.
Each section and table is REQUIRED - if data is not available, write "No data available" but maintain the structure.

MANDATORY FORMAT:

# Quarterly Results Highlights
- RevPAR: [Value] ([YoY change])
- ADR: [Value] ([YoY change])
- Occupancy: [Value] ([YoY change])
- EBITDA: [Value] ([YoY change])
- FFO per share: [Value] ([YoY change])
- [Add any additional metrics with specific values]

# Q&A Analysis
| Topic | Q&A Count |
|-------|-----------|
| Macro outlook | [Count] |
| Supply | [Count] |
| Group & BT | [Count] |
| Leisure | [Count] |
| Transactions | [Count] |
| Capital allocation | [Count] |
| Outlook/guidance | [Count] |

# Question and Answer Details
| Analyst | Firm | Question Topic | Key Points | Quantitative Data | Management Response | Commenter |
|---------|------|----------------|------------|-------------------|-------------------|-----------|
[Create a row for each Q&A interaction from the transcript. Identify the C-Suite executive or other person who responded to the question and put their name in the "Commenter" column.]

# Topic Summaries

## Macro Outlook
| Topic | Current Performance | Forward Outlook | YoY Change |
|-------|-------------------|-----------------|------------|
| Macro outlook | [Current state] | [Future expectations] | [YoY metrics] |

## Supply
| Topic | Current Performance | Forward Outlook | YoY Change |
|-------|-------------------|-----------------|------------|
| Supply | [Current state] | [Future expectations] | [YoY metrics] |

[Repeat for each primary topic]

# Market Performance
| Market Type | RevPAR | ADR | Occupancy | Commentary |
|------------|--------|-----|-----------|------------|
| Urban | [Value] | [Value] | [Value]% | [Key points] |
| Resort | [Value] | [Value] | [Value]% | [Key points] |
| Overall | [Value] | [Value] | [Value]% | [Key points] |

# Capital Structure
| Metric | Current | Change | Commentary |
|--------|---------|--------|------------|
| Total Debt | $[Value] | [+/-]% | [Details] |
| Cash Balance | $[Value] | [+/-]% | [Details] |
| Debt/EBITDA | [Value]x | [+/-] | [Details] |
| Interest Coverage | [Value]x | [+/-] | [Details] |

Classification Rules:
{classification_rules}

Temporal Tags:
{temporal_tags}

Operating Performance Metrics:
{operating_metrics}

Segment Performance Metrics:
{segment_metrics}

Financial Metrics:
{financial_metrics}

Validation Rules:
{validation_rules}

Special Considerations:
{special_considerations}'
WHERE id = 'hospitality_reit';

COMMIT;
