-- LLM Transcript Analyzer Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- User profiles table (extends Supabase auth.users)
CREATE TABLE public.user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  can_use_owner_key BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User API keys table (encrypted storage)
CREATE TABLE public.user_api_keys (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('openai', 'anthropic', 'google', 'cohere')),
  encrypted_api_key TEXT NOT NULL,
  encryption_iv TEXT NOT NULL,
  nickname TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, provider, nickname)
);

-- Prompts table (for storing pre-built system prompts)
CREATE TABLE public.prompts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  system_prompt TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Usage logs table (for tracking API usage)
CREATE TABLE public.usage_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
  provider TEXT NOT NULL,
  model TEXT,
  prompt_id UUID REFERENCES public.prompts(id),
  token_count INTEGER,
  cost_estimate DECIMAL(10,6),
  used_owner_key BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_user_api_keys_user_id ON public.user_api_keys(user_id);
CREATE INDEX idx_user_api_keys_provider ON public.user_api_keys(provider);
CREATE INDEX idx_usage_logs_user_id ON public.usage_logs(user_id);
CREATE INDEX idx_usage_logs_created_at ON public.usage_logs(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for user_api_keys
CREATE POLICY "Users can manage own API keys" ON public.user_api_keys
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for prompts (read-only for users, admin manages via service role)
CREATE POLICY "Users can view active prompts" ON public.prompts
  FOR SELECT USING (is_active = TRUE);

-- RLS Policies for usage_logs
CREATE POLICY "Users can view own usage logs" ON public.usage_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert usage logs" ON public.usage_logs
  FOR INSERT WITH CHECK (true);

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on auth.users insert
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_api_keys_updated_at
  BEFORE UPDATE ON public.user_api_keys
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_prompts_updated_at
  BEFORE UPDATE ON public.prompts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Company types table (industry-specific analysis templates)
CREATE TABLE public.company_types (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  system_prompt_template TEXT NOT NULL,
  classification_rules JSONB,
  key_metrics JSONB,
  output_format JSONB,
  validation_rules TEXT[],
  special_considerations JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Companies table (ticker symbol mappings)
CREATE TABLE public.companies (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  ticker TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  primary_company_type_id TEXT REFERENCES public.company_types(id) NOT NULL,
  additional_company_types TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Company prompt assignments (links companies to their analysis types)
CREATE TABLE public.company_prompt_assignments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  company_type_id TEXT REFERENCES public.company_types(id) NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(company_id, company_type_id)
);

-- Update prompts table to support structured templates
ALTER TABLE public.prompts ADD COLUMN IF NOT EXISTS template_variables JSONB;
ALTER TABLE public.prompts ADD COLUMN IF NOT EXISTS company_type_id TEXT REFERENCES public.company_types(id);

-- Create indexes
CREATE INDEX idx_companies_ticker ON public.companies(ticker);
CREATE INDEX idx_companies_primary_type ON public.companies(primary_company_type_id);
CREATE INDEX idx_company_prompt_assignments_company ON public.company_prompt_assignments(company_id);
CREATE INDEX idx_company_prompt_assignments_type ON public.company_prompt_assignments(company_type_id);

-- Enable RLS for new tables
ALTER TABLE public.company_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_prompt_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for company_types (read-only for users)
CREATE POLICY "Users can view active company types" ON public.company_types
  FOR SELECT USING (is_active = TRUE);

-- RLS Policies for companies (read-only for users)
CREATE POLICY "Users can view active companies" ON public.companies
  FOR SELECT USING (is_active = TRUE);

-- RLS Policies for company_prompt_assignments (read-only for users)
CREATE POLICY "Users can view company prompt assignments" ON public.company_prompt_assignments
  FOR SELECT USING (true);

-- Add updated_at triggers for new tables
CREATE TRIGGER update_company_types_updated_at
  BEFORE UPDATE ON public.company_types
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert company types from sample data
INSERT INTO public.company_types (id, name, description, system_prompt_template, classification_rules, key_metrics, output_format, validation_rules, special_considerations) VALUES
(
  'hospitality_reit',
  'Hospitality REIT',
  'Analysis template for hospitality real estate investment trusts',
  'Role: {role}

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
| Analyst | Firm | Question Topic | Key Points | Quantitative Data | Management Response |
|---------|------|----------------|------------|-------------------|-------------------|
[Create a row for each Q&A interaction from the transcript]

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
{special_considerations}',
  '{"primary_topics": ["Macro outlook", "Supply", "Group & BT", "Leisure", "Transactions", "Capital allocation", "Outlook/guidance"], "temporal_tags": ["previous quarter", "next quarter", "full year", "year-to-date"]}',
  '{"operating_performance": ["RevPAR", "ADR", "Occupancy"], "segment_performance": [], "financial_metrics": ["EBITDA", "FFO per share"]}',
  '{"quarterly_highlights": ["RevPAR", "ADR", "Occupancy", "EBITDA", "FFO per share"], "qa_analysis_topics": ["Macro outlook", "Supply", "Group & BT", "Leisure", "Transactions", "Capital allocation", "Outlook/guidance"], "market_performance_metrics": ["RevPAR", "ADR", "Occupancy"], "capital_structure_metrics": ["Total Debt", "Cash Balance", "Debt/EBITDA", "Interest Coverage"]}',
  ARRAY['Ensure all tables are present.', 'Verify quantitative data accuracy.', 'Check for consistency in YoY changes.'],
  '{"mixed_topics": [], "forward_looking": [], "analyst_tracking": []}'
),
(
  'airline',
  'Airline',
  'Analysis template for airline companies',
  'Role: {role}

CRITICAL INSTRUCTION: You MUST structure your response EXACTLY as shown below, using markdown tables.
Each section and table is REQUIRED - if data is not available, write "No data available" but maintain the structure.

MANDATORY FORMAT:

# Quarterly Results Highlights
- Revenue Passenger Miles (RPM): [Value] ([YoY change])
- Available Seat Miles (ASM): [Value] ([YoY change])
- Passenger Load Factor (PLF): [Value] ([YoY change])
- Total Revenue: [Value] ([YoY change])
- Net Income: [Value] ([YoY change])
- [Add any additional metrics with specific values]

# Q&A Analysis
| Topic | Q&A Count |
|-------|-----------|
| Revenue Trends | [Count] |
| Cost Management | [Count] |
| Capacity Outlook | [Count] |
| Fleet Updates | [Count] |
| Loyalty Program | [Count] |
| Strategic Partnerships | [Count] |
| Outlook/Guidance | [Count] |

# Question and Answer Details
| Analyst | Firm | Question Topic | Key Points | Quantitative Data | Management Response |
|---------|------|----------------|------------|-------------------|-------------------|
[Create a row for each Q&A interaction from the transcript]

# Topic Summaries

## Revenue Trends
| Topic | Current Performance | Forward Outlook | YoY Change |
|-------|-------------------|-----------------|------------|
| Revenue Trends | [Current state] | [Future expectations] | [YoY metrics] |

## Cost Management
| Topic | Current Performance | Forward Outlook | YoY Change |
|-------|-------------------|-----------------|------------|
| Cost Management | [Current state] | [Future expectations] | [YoY metrics] |

[Repeat for each primary topic]

# Operational Performance
| Metric | Value | Change | Commentary |
|------------|--------|-----|-----------|
| On-Time Arrival | [Value]% | [+/-]% | [Key points] |
| Completion Factor | [Value]% | [+/-]% | [Key points] |
| Customer Satisfaction | [Value] | [+/-] | [Key points] |

# Financial Position
| Metric | Current | Change | Commentary |
|--------|---------|--------|------------|
| Total Debt | $[Value] | [+/-]% | [Details] |
| Cash Balance | $[Value] | [+/-]% | [Details] |
| Debt/Equity Ratio | [Value]x | [+/-] | [Details] |
| Liquidity | $[Value] | [+/-]% | [Details] |

Classification Rules:
{classification_rules}

Temporal Tags:
{temporal_tags}

Operational Performance Metrics:
{operating_metrics}

Segment Performance Metrics:
{segment_metrics}

Financial Metrics:
{financial_metrics}

Validation Rules:
{validation_rules}

Special Considerations:
{special_considerations}',
  '{"primary_topics": ["Revenue Trends", "Cost Management", "Capacity Outlook", "Fleet Updates", "Loyalty Program", "Strategic Partnerships", "Outlook/Guidance"], "temporal_tags": ["previous quarter", "next quarter", "full year", "year-to-date"]}',
  '{"operating_performance": ["Revenue Passenger Miles (RPM)", "Available Seat Miles (ASM)", "Passenger Load Factor (PLF)"], "segment_performance": [], "financial_metrics": ["Total Revenue", "Net Income"]}',
  '{"quarterly_highlights": ["RPM", "ASM", "PLF", "Total Revenue", "Net Income"], "qa_analysis_topics": ["Revenue Trends", "Cost Management", "Capacity Outlook", "Fleet Updates", "Loyalty Program", "Strategic Partnerships", "Outlook/Guidance"], "operational_performance_metrics": ["On-Time Arrival", "Completion Factor", "Customer Satisfaction"], "financial_position_metrics": ["Total Debt", "Cash Balance", "Debt/Equity Ratio", "Liquidity"]}',
  ARRAY['Ensure all tables are present.', 'Verify quantitative data accuracy.', 'Check for consistency in YoY changes.'],
  '{"mixed_topics": [], "forward_looking": [], "analyst_tracking": []}'
),
(
  'credit_card',
  'Credit Card',
  'Analysis template for credit card companies',
  'Role: {role}

CRITICAL INSTRUCTION: You MUST structure your response EXACTLY as shown below, using markdown tables.
Each section and table is REQUIRED - if data is not available, write "No data available" but maintain the structure.

MANDATORY FORMAT:

# Quarterly Results Highlights
- Purchase Volume: [Value] ([YoY change])
- Active Accounts: [Value] ([YoY change])
- Net Interest Margin: [Value] ([YoY change])
- Credit Loss Rate: [Value] ([YoY change])
- Revenue: [Value] ([YoY change])
- [Add any additional metrics with specific values]

# Q&A Analysis
| Topic | Q&A Count |
|-------|-----------|
| Consumer Spending | [Count] |
| Credit Quality | [Count] |
| Travel Spending | [Count] |
| Digital Payments | [Count] |
| Co-brand Partners | [Count] |
| International | [Count] |
| Outlook/Guidance | [Count] |

# Question and Answer Details
| Analyst | Firm | Question Topic | Key Points | Quantitative Data | Management Response |
|---------|------|----------------|------------|-------------------|-------------------|
[Create a row for each Q&A interaction from the transcript]

# Topic Summaries

## Consumer Spending
| Topic | Current Performance | Forward Outlook | YoY Change |
|-------|-------------------|-----------------|------------|
| Consumer Spending | [Current state] | [Future expectations] | [YoY metrics] |

## Credit Quality
| Topic | Current Performance | Forward Outlook | YoY Change |
|-------|-------------------|-----------------|------------|
| Credit Quality | [Current state] | [Future expectations] | [YoY metrics] |

[Repeat for each primary topic]

# Segment Performance
| Segment | Volume | Growth | Share | Commentary |
|---------|---------|--------|-------|------------|
| Travel & Entertainment | [Value] | [+/-]% | [Value]% | [Key points] |
| Lodging | [Value] | [+/-]% | [Value]% | [Key points] |
| Retail | [Value] | [+/-]% | [Value]% | [Key points] |

# Credit Metrics
| Metric | Current | Change | Commentary |
|--------|---------|--------|------------|
| Delinquency Rate | [Value]% | [+/-]% | [Details] |
| Net Charge-off Rate | [Value]% | [+/-]% | [Details] |
| Loss Reserves | $[Value] | [+/-]% | [Details] |
| Average FICO | [Value] | [+/-] | [Details] |',
  '{"primary_topics": ["Consumer Spending", "Credit Quality", "Travel Spending", "Digital Payments", "Co-brand Partners", "International", "Outlook/Guidance"], "temporal_tags": ["previous quarter", "next quarter", "full year", "year-to-date"]}',
  '{"operating_performance": ["Purchase Volume", "Active Accounts", "Net Interest Margin"], "segment_performance": ["Travel & Entertainment", "Lodging", "Retail"], "financial_metrics": ["Credit Loss Rate", "Revenue"]}',
  '{"quarterly_highlights": ["Purchase Volume", "Active Accounts", "Net Interest Margin", "Credit Loss Rate", "Revenue"], "qa_analysis_topics": ["Consumer Spending", "Credit Quality", "Travel Spending", "Digital Payments", "Co-brand Partners", "International", "Outlook/Guidance"], "segment_performance_metrics": ["Travel & Entertainment", "Lodging", "Retail"], "credit_metrics": ["Delinquency Rate", "Net Charge-off Rate", "Loss Reserves", "Average FICO"]}',
  ARRAY['Ensure all tables are present.', 'Verify quantitative data accuracy.', 'Check for consistency in YoY changes.'],
  '{"mixed_topics": [], "forward_looking": [], "analyst_tracking": []}'
),
(
  'luxury_retail',
  'Luxury Retail',
  'Analysis template for luxury retail companies',
  'Role: {role}

CRITICAL INSTRUCTION: You MUST structure your response EXACTLY as shown below, using markdown tables.
Each section and table is REQUIRED - if data is not available, write "No data available" but maintain the structure.

MANDATORY FORMAT:

# Quarterly Results Highlights
- Comparable Sales: [Value] ([YoY change])
- Average Transaction Value: [Value] ([YoY change])
- Customer Traffic: [Value] ([YoY change])
- Operating Margin: [Value] ([YoY change])
- Revenue: [Value] ([YoY change])
- [Add any additional metrics with specific values]

# Q&A Analysis
| Topic | Q&A Count |
|-------|-----------|
| Consumer Sentiment | [Count] |
| Travel Retail | [Count] |
| Regional Performance | [Count] |
| Digital/Omnichannel | [Count] |
| Product Categories | [Count] |
| Pricing Strategy | [Count] |
| Outlook/Guidance | [Count] |

# Question and Answer Details
| Analyst | Firm | Question Topic | Key Points | Quantitative Data | Management Response |
|---------|------|----------------|------------|-------------------|-------------------|
[Create a row for each Q&A interaction from the transcript]

# Topic Summaries

## Consumer Sentiment
| Topic | Current Performance | Forward Outlook | YoY Change |
|-------|-------------------|-----------------|------------|
| Consumer Sentiment | [Current state] | [Future expectations] | [YoY metrics] |

## Travel Retail
| Topic | Current Performance | Forward Outlook | YoY Change |
|-------|-------------------|-----------------|------------|
| Travel Retail | [Current state] | [Future expectations] | [YoY metrics] |

[Repeat for each primary topic]

# Regional Performance
| Region | Sales Growth | Traffic | ATV | Commentary |
|--------|-------------|---------|-----|------------|
| North America | [Value]% | [+/-]% | [Value] | [Key points] |
| Europe | [Value]% | [+/-]% | [Value] | [Key points] |
| Asia Pacific | [Value]% | [+/-]% | [Value] | [Key points] |
| Other | [Value]% | [+/-]% | [Value] | [Key points] |

# Channel Performance
| Channel | Sales | % of Total | YoY Growth | Commentary |
|---------|-------|------------|------------|------------|
| Retail Stores | [Value] | [Value]% | [Value]% | [Details] |
| Travel Retail | [Value] | [Value]% | [Value]% | [Details] |
| Digital | [Value] | [Value]% | [Value]% | [Details] |
| Wholesale | [Value] | [Value]% | [Value]% | [Details] |',
  '{"primary_topics": ["Consumer Sentiment", "Travel Retail", "Regional Performance", "Digital/Omnichannel", "Product Categories", "Pricing Strategy", "Outlook/Guidance"], "temporal_tags": ["previous quarter", "next quarter", "full year", "year-to-date"]}',
  '{"operating_performance": ["Comparable Sales", "Average Transaction Value", "Customer Traffic"], "segment_performance": ["North America", "Europe", "Asia Pacific", "Travel Retail"], "financial_metrics": ["Operating Margin", "Revenue"]}',
  '{"quarterly_highlights": ["Comparable Sales", "Average Transaction Value", "Customer Traffic", "Operating Margin", "Revenue"], "qa_analysis_topics": ["Consumer Sentiment", "Travel Retail", "Regional Performance", "Digital/Omnichannel", "Product Categories", "Pricing Strategy", "Outlook/Guidance"], "regional_performance_metrics": ["North America", "Europe", "Asia Pacific", "Other"], "channel_performance_metrics": ["Retail Stores", "Travel Retail", "Digital", "Wholesale"]}',
  ARRAY['Ensure all tables are present.', 'Verify quantitative data accuracy.', 'Check for consistency in YoY changes.'],
  '{"mixed_topics": [], "forward_looking": [], "analyst_tracking": []}'
),
(
  'hospitality_ccorp',
  'Hospitality C-Corporation',
  'Analysis template for hospitality management companies',
  'Role: {role}

CRITICAL INSTRUCTION: You MUST structure your response EXACTLY as shown below, using markdown tables.
Each section and table is REQUIRED - if data is not available, write "No data available" but maintain the structure.

MANDATORY FORMAT:

# Quarterly Results Highlights
- System-wide RevPAR: [Value] ([YoY change])
- Net Unit Growth: [Value] ([YoY change])
- Fee Revenue: [Value] ([YoY change])
- Adjusted EBITDA: [Value] ([YoY change])
- EPS: [Value] ([YoY change])
- Pipeline Growth: [Value] ([YoY change])
- [Add any additional metrics with specific values]

# Q&A Analysis
| Topic | Q&A Count |
|-------|-----------|
| Macro outlook | [Count] |
| Development pipeline | [Count] |
| Brand performance | [Count] |
| Geographic segments | [Count] |
| Fee business | [Count] |
| Capital return | [Count] |
| Outlook/guidance | [Count] |

# Question and Answer Details
| Analyst | Firm | Question Topic | Key Points | Quantitative Data | Management Response |
|---------|------|----------------|------------|-------------------|-------------------|
[Create a row for each Q&A interaction from the transcript]

# Topic Summaries

## Brand Performance
| Brand Segment | RevPAR Growth | Net Unit Growth | Pipeline | Commentary |
|--------------|---------------|-----------------|-----------|------------|
| Luxury | [Value] | [Value] | [Value] | [Key points] |
| Premium | [Value] | [Value] | [Value] | [Key points] |
| Select Service | [Value] | [Value] | [Value] | [Key points] |

## Geographic Performance
| Region | RevPAR Growth | Net Unit Growth | Fee Revenue | Commentary |
|--------|---------------|-----------------|-------------|------------|
| Americas | [Value] | [Value] | [Value] | [Key points] |
| EMEA | [Value] | [Value] | [Value] | [Key points] |
| Asia Pacific | [Value] | [Value] | [Value] | [Key points] |

## Development Pipeline
| Stage | Properties | Rooms | YoY Change | Key Markets |
|-------|------------|-------|------------|-------------|
| Under Construction | [Value] | [Value] | [Value] | [List] |
| Approved | [Value] | [Value] | [Value] | [List] |
| Planning | [Value] | [Value] | [Value] | [List] |

# Revenue Analysis
| Revenue Stream | Amount | % of Total | YoY Growth | Commentary |
|----------------|---------|------------|------------|------------|
| Base Fees | [Value] | [Value]% | [Value]% | [Details] |
| Incentive Fees | [Value] | [Value]% | [Value]% | [Details] |
| Other Fees | [Value] | [Value]% | [Value]% | [Details] |
| Owned/Leased | [Value] | [Value]% | [Value]% | [Details] |

# Balance Sheet Metrics
| Metric | Current | Change | Commentary |
|--------|---------|--------|------------|
| Net Debt | $[Value] | [+/-]% | [Details] |
| Cash Balance | $[Value] | [+/-]% | [Details] |
| Net Debt/EBITDA | [Value]x | [+/-] | [Details] |
| Share Repurchases | $[Value] | [+/-]% | [Details] |',
  '{"primary_topics": ["Macro outlook", "Development pipeline", "Brand performance", "Geographic segments", "Fee business", "Capital return", "Outlook/guidance"], "temporal_tags": ["previous quarter", "next quarter", "full year", "year-to-date"]}',
  '{"operating_performance": ["System-wide RevPAR", "Net Unit Growth", "Pipeline Growth"], "segment_performance": ["Brand segments", "Geographic regions", "Fee types"], "financial_metrics": ["Fee Revenue", "Adjusted EBITDA", "EPS"]}',
  '{"quarterly_highlights": ["System-wide RevPAR", "Net Unit Growth", "Fee Revenue", "Adjusted EBITDA", "EPS", "Pipeline Growth"], "qa_analysis_topics": ["Macro outlook", "Development pipeline", "Brand performance", "Geographic segments", "Fee business", "Capital return", "Outlook/guidance"], "brand_performance_metrics": ["RevPAR Growth", "Net Unit Growth", "Pipeline"], "revenue_analysis_metrics": ["Base Fees", "Incentive Fees", "Other Fees", "Owned/Leased"]}',
  ARRAY['Ensure all tables are present.', 'Verify quantitative data accuracy.', 'Check for consistency in YoY changes.', 'Validate segment totals match company-wide figures.'],
  '{"mixed_topics": ["Brand and geographic performance may overlap", "Pipeline updates may affect multiple segments"], "forward_looking": ["Pipeline conversion rates", "Development timelines", "Brand expansion plans"], "analyst_tracking": ["Focus on unit growth trajectories", "Fee revenue mix changes", "Geographic expansion strategies"]}'
),
(
  'earnings_analyst',
  'Earnings Analyst',
  'Narrative analysis format for earnings calls',
  'Role: {role}

CRITICAL INSTRUCTION: Structure your response as a narrative analysis with the following sections. Use tables sparingly and only for key metrics.

# Key Takeaways
[2-3 paragraphs summarizing the most important points, surprises, and implications]

# Business Performance
## Sales and Margins
[Narrative analysis with key metrics and management commentary]

## Regional Performance
[Narrative focusing on major regions and trends]

# Strategic Themes
[Analysis of 3-4 key themes from the call, with management quotes]

# Notable Q&A Exchanges
| Topic | Analyst & Question | Key Management Quotes | Implications |
|-------|-------------------|---------------------|---------------|

# Management Outlook
[Analysis of forward-looking statements and tone]

# Business Implications
[Analysis of short and long-term business impact]',
  '{"primary_themes": ["Sales Performance", "Regional Dynamics", "Strategic Initiatives", "Forward Looking Statements"], "highlight_criteria": ["unexpected results", "strategic changes", "tone shifts", "guidance updates"]}',
  '{"narrative_elements": {"management_quotes": true, "context": true, "implications": true, "market_expectations": true}, "quantitative_elements": {"key_metrics": true, "regional_performance": true, "segment_performance": true, "year_over_year": true}}',
  '{}',
  ARRAY['Ensure narrative flow between sections', 'Include relevant management quotes', 'Highlight unexpected developments', 'Connect metrics to business implications'],
  '{"tone_analysis": ["Management confidence level", "Changes in forward guidance", "Response to challenges"], "context_requirements": ["Market expectations", "Industry trends", "Competitive dynamics"]}'
);

-- Insert companies from sample data
INSERT INTO public.companies (ticker, name, primary_company_type_id, additional_company_types) VALUES
('DAL', 'Delta Air Lines', 'airline', ARRAY['earnings_analyst']),
('HST', 'Host Hotels & Resorts', 'hospitality_reit', ARRAY['earnings_analyst']),
('AXP', 'American Express', 'credit_card', ARRAY['earnings_analyst']),
('PEB', 'Pebblebrook Hotel Trust', 'hospitality_reit', ARRAY['earnings_analyst']),
('DRH', 'DiamondRock Hospitality', 'hospitality_reit', ARRAY['earnings_analyst']),
('LVMH', 'LVMH Moët Hennessy Louis Vuitton', 'luxury_retail', ARRAY['earnings_analyst']),
('HLT', 'Hilton Worldwide Holdings Inc', 'hospitality_ccorp', ARRAY['earnings_analyst']),
('MAR', 'Marriott International Inc', 'hospitality_ccorp', ARRAY['earnings_analyst']),
('ABNB', 'Airbnb, Inc.', 'hospitality_ccorp', ARRAY[]::TEXT[]),
('PK', 'Park Hotels & Resorts', 'hospitality_reit', ARRAY[]::TEXT[]),
('RHP', 'Ryman Hospitality Properties, Inc.', 'hospitality_reit', ARRAY[]::TEXT[]);

-- Insert company prompt assignments
INSERT INTO public.company_prompt_assignments (company_id, company_type_id, is_primary)
SELECT c.id, c.primary_company_type_id, true
FROM public.companies c;

-- Insert additional company prompt assignments
INSERT INTO public.company_prompt_assignments (company_id, company_type_id, is_primary)
SELECT c.id, unnest(c.additional_company_types), false
FROM public.companies c
WHERE array_length(c.additional_company_types, 1) > 0;

-- Insert some default prompts
INSERT INTO public.prompts (name, display_name, description, system_prompt, category) VALUES
(
  'meeting_summary',
  'Meeting Summary',
  'Summarize meeting transcripts with key points and action items',
  'You are an expert at analyzing meeting transcripts. Please provide a comprehensive summary that includes:

1. **Key Discussion Points**: Main topics covered during the meeting
2. **Decisions Made**: Any concrete decisions or resolutions reached
3. **Action Items**: Specific tasks assigned with responsible parties (if mentioned)
4. **Important Dates/Deadlines**: Any mentioned timelines or due dates
5. **Next Steps**: What should happen following this meeting

Format your response in clear sections with bullet points where appropriate. Be concise but thorough.',
  'meetings'
),
(
  'interview_analysis',
  'Interview Analysis',
  'Analyze interview transcripts for key insights and themes',
  'You are an expert at analyzing interview transcripts. Please provide a thorough analysis that includes:

1. **Key Themes**: Main topics and patterns that emerged
2. **Notable Quotes**: Important or revealing statements from the interviewee
3. **Insights**: Your analysis of what the responses reveal
4. **Recommendations**: Suggested follow-up questions or areas for deeper exploration
5. **Summary**: Overall impression and key takeaways

Maintain objectivity and focus on factual observations while highlighting significant patterns or insights.',
  'interviews'
),
(
  'sentiment_analysis',
  'Sentiment Analysis',
  'Analyze the emotional tone and sentiment of conversations',
  'You are an expert at sentiment analysis and emotional intelligence. Please analyze this transcript for:

1. **Overall Sentiment**: General emotional tone (positive, negative, neutral)
2. **Emotional Shifts**: How sentiment changes throughout the conversation
3. **Key Emotional Moments**: Specific points where strong emotions are expressed
4. **Participant Dynamics**: How different speakers interact emotionally
5. **Underlying Concerns**: Any hidden or implicit emotional themes

Provide specific examples from the text to support your analysis. Be sensitive and professional in your assessment.',
  'analysis'
),
(
  'sales_call_analysis',
  'Sales Call Analysis',
  'Analyze sales conversations for opportunities and insights',
  'You are an expert sales analyst. Please analyze this sales call transcript for:

1. **Customer Needs**: What problems or needs did the customer express?
2. **Pain Points**: What challenges or frustrations were mentioned?
3. **Buying Signals**: Positive indicators of purchase intent
4. **Objections**: Concerns or resistance expressed by the customer
5. **Next Steps**: Recommended follow-up actions
6. **Opportunities**: Areas for upselling or additional value delivery
7. **Coaching Notes**: Suggestions for improving the sales approach

Focus on actionable insights that can improve future sales performance.',
  'sales'
);