import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)
  
  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    console.error('🔐 Authentication error in company-types API:', authError)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')
    
    console.log('🏢 Company-types API called for companyId:', companyId)
    
    if (!companyId) {
      console.error('❌ No companyId provided')
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
      console.error('❌ Error fetching company:', companyError)
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    if (!company) {
      console.error('❌ Company not found for ID:', companyId)
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    console.log('✅ Company found:', {
      primaryTypeId: company.primary_company_type_id,
      additionalTypes: company.additional_company_types
    })

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
      console.error('❌ Error fetching company types:', typesError)
      return NextResponse.json({ error: 'Failed to fetch company types' }, { status: 500 })
    }

    console.log('✅ Fetched company types:', companyTypes?.length, 'types')
    console.log('📋 Company types:', companyTypes?.map(ct => ({ id: ct.id, name: ct.name })))

    return NextResponse.json({ 
      companyTypes: companyTypes || [],
      primaryTypeId: company.primary_company_type_id 
    })
    
  } catch (err: any) {
    console.error('Exception in company-types API:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}