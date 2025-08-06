-- NextER Seed Data
-- Version: 1.0.0
-- Date: August 6, 2025
-- Description: Initial data for company types, companies, and system settings

-- ============================================================================
-- COMPANY TYPES (ANALYSIS TEMPLATES)
-- ============================================================================

INSERT INTO company_types (id, name, description, system_prompt_template, classification_rules, key_metrics, output_format, llm_settings, is_active)
VALUES 
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

## Key Performance Metrics
| Metric | Q[X] [Year] | Q[X-1] [Year] | YoY Change |
|--------|-------------|---------------|------------|
| RevPAR | | | |
| ADR | | | |
| Occupancy | | | |

## Management Commentary Summary
[Structured summary of key management points]

## Outlook & Guidance
[Forward-looking statements and guidance]',
    '{
        "temporal_tags": ["previous quarter", "next quarter", "full year", "year-to-date"],
        "primary_topics": ["Macro outlook", "Supply", "Group & BT", "Leisure", "Transactions", "Capital allocation", "Outlook/guidance"]
    }'::jsonb,
    '{
        "financial_metrics": ["EBITDA", "FFO per share"],
        "operating_performance": ["RevPAR", "ADR", "Occupancy"],
        "segment_performance": []
    }'::jsonb,
    '{
        "quarterly_highlights": ["RevPAR", "ADR", "Occupancy", "EBITDA", "FFO per share"],
        "qa_analysis_topics": ["Macro outlook", "Supply", "Group & BT", "Leisure", "Transactions", "Capital allocation", "Outlook/guidance"],
        "capital_structure_metrics": ["Total Debt", "Cash Balance", "Debt/EBITDA", "Interest Coverage"],
        "market_performance_metrics": ["RevPAR", "ADR", "Occupancy"]
    }'::jsonb,
    '{
        "temperature": 0.3,
        "top_p": 0.9,
        "max_tokens": 3500,
        "frequency_penalty": 0.3,
        "presence_penalty": 0.2
    }'::jsonb,
    true
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

## Credit Quality Metrics
| Metric | Current Quarter | Prior Quarter | YoY Change |
|--------|-----------------|---------------|------------|
| Delinquency Rate | | | |
| Net Charge-off Rate | | | |
| Loss Reserves | | | |

## Management Commentary Summary
[Structured summary of key management points]

## Outlook & Guidance
[Forward-looking statements and guidance]',
    '{
        "temporal_tags": ["previous quarter", "next quarter", "full year", "year-to-date"],
        "primary_topics": ["Consumer Spending", "Credit Quality", "Travel Spending", "Digital Payments", "Co-brand Partners", "International", "Outlook/Guidance"]
    }'::jsonb,
    '{
        "financial_metrics": ["Credit Loss Rate", "Revenue"],
        "operating_performance": ["Purchase Volume", "Active Accounts", "Net Interest Margin"],
        "segment_performance": ["Travel & Entertainment", "Lodging", "Retail"]
    }'::jsonb,
    '{
        "quarterly_highlights": ["Purchase Volume", "Active Accounts", "Net Interest Margin", "Credit Loss Rate", "Revenue"],
        "credit_metrics": ["Delinquency Rate", "Net Charge-off Rate", "Loss Reserves", "Average FICO"],
        "qa_analysis_topics": ["Consumer Spending", "Credit Quality", "Travel Spending", "Digital Payments", "Co-brand Partners", "International", "Outlook/Guidance"],
        "segment_performance_metrics": ["Travel & Entertainment", "Lodging", "Retail"]
    }'::jsonb,
    '{
        "temperature": 0.3,
        "top_p": 0.9,
        "max_tokens": 3500,
        "frequency_penalty": 0.3,
        "presence_penalty": 0.2
    }'::jsonb,
    true
),
(
    'technology',
    'Technology Company',
    'Analysis template for technology companies',
    'Role: {role}

CRITICAL INSTRUCTION: Structure your response with clear sections and data tables.

# Quarterly Results Highlights
- Revenue: [Value] ([YoY change])
- Operating Margin: [Value] ([YoY change])
- EPS: [Value] ([YoY change])
- Cloud Revenue: [Value] ([YoY change])
- R&D Spend: [Value] ([% of revenue])

## Segment Performance
| Segment | Revenue | Growth | Margin |
|---------|---------|--------|--------|
| Cloud Services | | | |
| Software | | | |
| Hardware | | | |

## Management Commentary Summary
[Key strategic initiatives and market positioning]

## Outlook & Guidance
[Forward guidance and growth expectations]',
    '{
        "temporal_tags": ["Q1", "Q2", "Q3", "Q4", "FY"],
        "primary_topics": ["Cloud Growth", "AI/ML", "Enterprise Sales", "Consumer Products", "R&D Investment", "M&A Activity"]
    }'::jsonb,
    '{
        "financial_metrics": ["Revenue", "Operating Margin", "EPS", "Free Cash Flow"],
        "operating_performance": ["Cloud Revenue", "Subscription Growth", "Customer Retention"],
        "segment_performance": ["Cloud", "Software", "Hardware", "Services"]
    }'::jsonb,
    '{
        "quarterly_highlights": ["Revenue", "Operating Margin", "EPS", "Cloud Revenue", "R&D Spend"],
        "segment_analysis": ["Cloud Services", "Software", "Hardware"],
        "qa_analysis_topics": ["Cloud Growth", "AI Strategy", "Competition", "Enterprise Sales", "Innovation"]
    }'::jsonb,
    '{
        "temperature": 0.4,
        "top_p": 0.85,
        "max_tokens": 4000,
        "frequency_penalty": 0.3,
        "presence_penalty": 0.25
    }'::jsonb,
    true
),
(
    'healthcare',
    'Healthcare Provider',
    'Analysis template for healthcare companies',
    'Role: {role}

# Quarterly Results Highlights
- Patient Volume: [Value] ([YoY change])
- Revenue per Patient: [Value] ([YoY change])
- Operating Margin: [Value] ([YoY change])
- EBITDA: [Value] ([YoY change])

## Key Metrics
| Metric | Current | Prior | Change |
|--------|---------|-------|--------|
| Admissions | | | |
| Length of Stay | | | |
| Payer Mix | | | |

## Management Commentary
[Operational improvements and strategic initiatives]

## Regulatory & Outlook
[Regulatory updates and guidance]',
    '{
        "temporal_tags": ["Q1", "Q2", "Q3", "Q4", "YTD"],
        "primary_topics": ["Patient Volume", "Payer Mix", "Labor Costs", "Regulatory", "M&A", "Technology"]
    }'::jsonb,
    '{
        "financial_metrics": ["Revenue", "EBITDA", "Operating Margin"],
        "operating_performance": ["Patient Volume", "Revenue per Patient", "Occupancy"],
        "quality_metrics": ["Readmission Rate", "Patient Satisfaction"]
    }'::jsonb,
    '{
        "quarterly_highlights": ["Patient Volume", "Revenue per Patient", "Operating Margin", "EBITDA"],
        "operational_metrics": ["Admissions", "Length of Stay", "Payer Mix"],
        "qa_analysis_topics": ["Volume Trends", "Labor Management", "Payer Negotiations", "Technology Adoption"]
    }'::jsonb,
    '{
        "temperature": 0.35,
        "top_p": 0.9,
        "max_tokens": 3500,
        "frequency_penalty": 0.25,
        "presence_penalty": 0.2
    }'::jsonb,
    true
);

-- ============================================================================
-- SAMPLE COMPANIES
-- ============================================================================

INSERT INTO companies (ticker, name, primary_company_type_id, is_active)
VALUES 
    ('XHR', 'Xenia Hotels & Resorts Inc', 'hospitality_reit', true),
    ('PK', 'Park Hotels & Resorts', 'hospitality_reit', true),
    ('AXP', 'American Express', 'credit_card', true),
    ('COF', 'Capital One Financial', 'credit_card', true),
    ('MSFT', 'Microsoft Corporation', 'technology', true),
    ('GOOGL', 'Alphabet Inc', 'technology', true),
    ('HCA', 'HCA Healthcare', 'healthcare', true),
    ('UHS', 'Universal Health Services', 'healthcare', true);

-- ============================================================================
-- SYSTEM SETTINGS
-- ============================================================================

INSERT INTO system_settings (key, value, description)
VALUES
    ('default_llm_provider', '"openai"', 'Default LLM provider for new users'),
    ('default_llm_model', '"gpt-4.1-mini"', 'Default model for new users'),
    ('max_transcript_length', '50000', 'Maximum characters allowed in transcript'),
    ('analysis_timeout', '120', 'Timeout in seconds for analysis requests'),
    ('live_transcription_enabled', '{"enabled": true}', 'Enable/disable live transcription feature'),
    ('rate_limits', '{
        "basic": {"requests_per_minute": 10},
        "advanced": {"requests_per_minute": 50},
        "admin": {"requests_per_minute": 100}
    }', 'Rate limits by user access level'),
    ('maintenance_mode', '{"enabled": false, "message": ""}', 'Maintenance mode settings');

-- ============================================================================
-- DEFAULT PROMPTS
-- ============================================================================

INSERT INTO prompts (name, display_name, description, system_prompt, category, is_active)
VALUES
    ('default_equity', 'Equity Analysis', 'Standard equity research analysis', 
     'You are a senior equity research analyst. Provide comprehensive analysis focusing on revenue growth, profitability, and valuation metrics.',
     'equity', true),
    ('default_debt', 'Debt Analysis', 'Credit and debt analysis', 
     'You are a credit analyst. Focus on creditworthiness, debt metrics, coverage ratios, and liquidity.',
     'debt', true),
    ('default_ma', 'M&A Analysis', 'Merger and acquisition analysis', 
     'You are an M&A analyst. Evaluate strategic rationale, synergies, integration risks, and valuation.',
     'ma', true);