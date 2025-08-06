-- ============================================================================
-- NextER Critical Data Export
-- Date: August 6, 2025
-- Purpose: Backup of critical configuration data before RLS migration
-- ============================================================================

-- Company Types (8 rows)
INSERT INTO company_types (id, name, description) VALUES 
('airline', 'Airline', 'Analysis template for airline companies'),
('credit_card', 'Credit Card', 'Analysis template for credit card companies'),
('earnings_analyst', 'Earnings Analyst', 'Narrative analysis format for earnings calls'),
('hospitality_ccorp', 'Hospitality C-Corporation', 'Analysis template for hospitality management companies'),
('hospitality_reit', 'Hospitality REIT', 'Analysis template for hospitality real estate investment trusts'),
('hospitality_reit_qa_focused', 'Hospitality REIT - Q&A Focus', 'Analysis template for hospitality REITs focused on Q&A section only'),
('luxury_retail', 'Luxury Retail', 'Analysis template for luxury retail companies'),
('general_analysis', 'QA Only test1', 'test of a QA only prompt')
ON CONFLICT (id) DO NOTHING;

-- Companies (12 rows)
INSERT INTO companies (ticker, name, primary_company_type_id) VALUES 
('ABNB', 'Airbnb, Inc.', 'hospitality_ccorp'),
('AXP', 'American Express', 'credit_card'),
('DAL', 'Delta Air Lines', 'airline'),
('DRH', 'DiamondRock Hospitality', 'hospitality_reit'),
('HLT', 'Hilton Worldwide Holdings Inc', 'hospitality_ccorp'),
('HST', 'Host Hotels & Resorts', 'hospitality_reit'),
('LVMH', 'LVMH Moët Hennessy Louis Vuitton', 'luxury_retail'),
('MAR', 'Marriott International Inc', 'hospitality_ccorp'),
('PEB', 'Pebblebrook Hotel Trust', 'hospitality_reit'),
('PK', 'Park Hotels & Resorts', 'hospitality_reit'),
('RHP', 'Ryman Hospitality Properties, Inc.', 'hospitality_reit'),
('XHR', 'Xenia Hotels & Resorts Inc', 'hospitality_reit')
ON CONFLICT (ticker) DO NOTHING;

-- Note: System prompts templates are very large and stored separately
-- Note: User data and API keys are sensitive and should be backed up via Supabase dashboard

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- After restore, verify data integrity:
-- SELECT COUNT(*) as company_types_count FROM company_types; -- Should be 8
-- SELECT COUNT(*) as companies_count FROM companies; -- Should be 12
-- SELECT COUNT(*) as analysis_count FROM analysis_transcripts; -- Should be 20
-- SELECT COUNT(*) as user_count FROM user_profiles; -- Should be 4

-- ============================================================================
-- END OF EXPORT
-- ============================================================================