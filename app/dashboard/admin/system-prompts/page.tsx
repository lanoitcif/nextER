'use client'

import { useAuth, isAdmin } from '@/lib/auth/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { ArrowLeft, Edit, Save } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
// Removed JSONEditor import - using textarea for plain text templates

interface Company {
  id: string
  name: string
  ticker: string
}

interface CompanyType {
  id: string
  name: string
  description: string
  system_prompt_template: any
}

export default function SystemPromptsPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [companies, setCompanies] = useState<Company[]>([])
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [companyTypes, setCompanyTypes] = useState<CompanyType[]>([])
  const [editingType, setEditingType] = useState<CompanyType | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    } else if (!loading && !isAdmin(profile)) {
      router.push('/dashboard')
    }
  }, [user, profile, loading, router])

  useEffect(() => {
    const fetchCompanies = async () => {
      const { data, error } = await supabase.from('companies').select('*').order('name')
      if (error) {
        console.error('Error fetching companies:', error)
      } else {
        setCompanies(data)
      }
      setIsLoading(false)
    }
    fetchCompanies()
  }, [])

  const fetchCompanyTypes = async (companyId: string) => {
    setIsLoading(true)
    const response = await fetch(`/api/company-types?companyId=${companyId}`)
    const data = await response.json()
    if (response.ok) {
      setCompanyTypes(data.companyTypes)
    } else {
      console.error('Error fetching company types:', data.error)
    }
    setIsLoading(false)
  }

  const handleCompanyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const companyId = e.target.value
    const company = companies.find((c) => c.id === companyId)
    setSelectedCompany(company || null)
    if (companyId) {
      fetchCompanyTypes(companyId)
    } else {
      setCompanyTypes([])
    }
  }

  const handleEdit = (companyType: CompanyType) => {
    setEditingType({ ...companyType })
  }

  const handleSave = async () => {
    if (!editingType) return

    const response = await fetch(`/api/admin/company-types/${editingType.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: editingType.name,
        description: editingType.description,
        system_prompt_template: editingType.system_prompt_template,
      }),
    })

    if (response.ok) {
      setEditingType(null)
      if (selectedCompany) {
        fetchCompanyTypes(selectedCompany.id)
      }
    } else {
      const data = await response.json()
      console.error('Error updating company type:', data.error)
    }
  }

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-charcoal">
        <div className="text-lg text-cream-glow">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <header className="shadow-lg border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard/admin"
                className="btn-ghost flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Admin</span>
              </Link>
              <div className="flex items-center space-x-3">
                <Image
                  src="/near-logo.png"
                  alt="NEaR"
                  width={32}
                  height={32}
                  className="h-8 w-8"
                />
                <div>
                  <h1 className="text-2xl font-bold">
                    System Prompt Management
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    Manage system prompts for different company types
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <label htmlFor="company-select" className="block text-sm font-medium mb-2">
              Select a Company
            </label>
            <select
              id="company-select"
              onChange={handleCompanyChange}
              className="w-full max-w-xs"
            >
              <option value="">-- Select a Company --</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name} ({company.ticker})
                </option>
              ))}
            </select>
          </div>

          {selectedCompany && (
            <div>
              <h2 className="text-xl font-semibold mb-4">
                Company Types for {selectedCompany.name}
              </h2>
              <div className="space-y-4">
                {companyTypes.map((type) => (
                  <div key={type.id} className="card">
                    <div className="card-content p-6">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">{type.name}</h3>
                        <button
                          onClick={() => handleEdit(type)}
                          className="btn-secondary"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </button>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {type.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {editingType && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-2xl">
                <h2 className="text-2xl font-bold mb-4">Edit {editingType.name}</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Name</label>
                    <input
                      type="text"
                      value={editingType.name}
                      onChange={(e) =>
                        setEditingType({ ...editingType, name: e.target.value })
                      }
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
                      value={editingType.description}
                      onChange={(e) =>
                        setEditingType({ ...editingType, description: e.target.value })
                      }
                      className="w-full h-24"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      System Prompt Template
                    </label>
                    <p className="text-xs text-muted-foreground mb-2">
                      Use {`{placeholders}`} for dynamic content like {`{role}`}, {`{classification_rules}`}, etc.
                    </p>
                    <textarea
                      value={editingType.system_prompt_template || ""}
                      onChange={(e) =>
                        setEditingType({
                          ...editingType,
                          system_prompt_template: e.target.value,
                        })
                      }
                      className="w-full h-96 font-mono text-sm p-3 border rounded-md"
                      placeholder="Enter your system prompt template here..."
                    />
                  </div>
                </div>
                <div className="mt-6 flex justify-end space-x-4">
                  <button
                    onClick={() => setEditingType(null)}
                    className="btn-ghost"
                  >
                    Cancel
                  </button>
                  <button onClick={handleSave} className="btn-primary">
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
