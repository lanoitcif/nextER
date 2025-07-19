import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')
    
    if (!companyId) {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 })
    }

    // First, get the company to find its type IDs
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('primary_company_type_id, additional_company_types')
      .eq('id', companyId)
      .eq('is_active', true)
      .single()

    if (companyError) {
      console.error('Error fetching company:', companyError)
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // Build the list of company type IDs
    const additionalTypes = Array.isArray(company.additional_company_types) 
      ? company.additional_company_types 
      : []
    const allCompanyTypeIds = [company.primary_company_type_id, ...additionalTypes]
    
    // Always include the general analysis type
    if (!allCompanyTypeIds.includes('general_analysis')) {
      allCompanyTypeIds.push('general_analysis')
    }

    // Fetch the company types
    const { data: companyTypes, error: typesError } = await supabase
      .from('company_types')
      .select('id, name, description, system_prompt_template')
      .in('id', allCompanyTypeIds)
      .eq('is_active', true)
      .order('name')

    if (typesError) {
      console.error('Error fetching company types:', typesError)
      return NextResponse.json({ error: 'Failed to fetch company types' }, { status: 500 })
    }

    return NextResponse.json({ 
      companyTypes: companyTypes || [],
      primaryTypeId: company.primary_company_type_id 
    })
    
  } catch (err: any) {
    console.error('Exception in company-types API:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}