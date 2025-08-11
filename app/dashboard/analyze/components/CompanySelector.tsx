'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import debounce from 'lodash/debounce'

interface Company {
  id: string
  ticker: string
  name: string
  primary_company_type_id: string
  additional_company_types: string[]
}

interface CompanySelectorProps {
  value: Company | null
  onChange: (company: Company | null) => void
  onTickerChange: (ticker: string) => void
  ticker: string
}

export default function CompanySelector({ 
  value, 
  onChange, 
  onTickerChange,
  ticker 
}: CompanySelectorProps) {
  const [companies, setCompanies] = useState<Company[]>([])
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [loadingCompanies, setLoadingCompanies] = useState(false)

  // Fetch all companies on mount
  useEffect(() => {
    fetchCompanies()
  }, [])

  const fetchCompanies = async () => {
    setLoadingCompanies(true)
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('is_active', true)
        .order('ticker')

      if (error) throw error
      setCompanies(data || [])
    } catch (error) {
      console.error('Error fetching companies:', error)
    } finally {
      setLoadingCompanies(false)
    }
  }

  // Debounced search function
  const searchCompanies = useCallback(
    debounce((searchTerm: string) => {
      if (!searchTerm) {
        setFilteredCompanies([])
        setShowDropdown(false)
        return
      }

      const filtered = companies.filter(company =>
        company.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.name.toLowerCase().includes(searchTerm.toLowerCase())
      ).slice(0, 10)

      setFilteredCompanies(filtered)
      setShowDropdown(filtered.length > 0)
    }, 300),
    [companies]
  )

  // Handle ticker input change
  const handleTickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTicker = e.target.value.toUpperCase()
    onTickerChange(newTicker)
    searchCompanies(newTicker)
    
    // Clear selection if ticker doesn't match
    if (value && value.ticker !== newTicker) {
      onChange(null)
    }
  }

  // Handle company selection
  const selectCompany = (company: Company) => {
    onTickerChange(company.ticker)
    onChange(company)
    setShowDropdown(false)
  }

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-foreground mb-2">
        Company Ticker
      </label>
      <div className="relative">
        <input
          type="text"
          value={ticker}
          onChange={handleTickerChange}
          placeholder="Enter ticker (e.g., HST, MAR)"
          className="input pl-10"
          disabled={loadingCompanies}
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      </div>

      {/* Company dropdown */}
      {showDropdown && (
        <div className="absolute z-10 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-auto">
          {filteredCompanies.map((company) => (
            <button
              key={company.id}
              onClick={() => selectCompany(company)}
              className="w-full text-left px-4 py-2 hover:bg-muted transition-colors"
            >
              <div className="font-medium">{company.ticker}</div>
              <div className="text-sm text-muted-foreground">{company.name}</div>
            </button>
          ))}
        </div>
      )}

      {/* Selected company display */}
      {value && (
        <div className="mt-2 p-3 bg-muted rounded-md">
          <div className="text-sm">
            <span className="font-medium">{value.ticker}</span> - {value.name}
          </div>
        </div>
      )}
    </div>
  )
}