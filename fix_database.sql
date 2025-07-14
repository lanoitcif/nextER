-- Fix companies that should have earnings_analyst in additional_company_types
-- This ensures all major companies have the earnings analyst analysis option

-- Update ABNB to include earnings_analyst
UPDATE public.companies 
SET additional_company_types = ARRAY['earnings_analyst']
WHERE ticker = 'ABNB';

-- Update PK to include earnings_analyst  
UPDATE public.companies 
SET additional_company_types = ARRAY['earnings_analyst']
WHERE ticker = 'PK';

-- Update RHP to include earnings_analyst
UPDATE public.companies 
SET additional_company_types = ARRAY['earnings_analyst']
WHERE ticker = 'RHP';

-- Verify all companies have earnings_analyst available
SELECT ticker, name, primary_company_type_id, additional_company_types 
FROM public.companies 
ORDER BY ticker;

-- Check that earnings_analyst company type exists and is active
SELECT id, name, is_active FROM public.company_types WHERE id = 'earnings_analyst';