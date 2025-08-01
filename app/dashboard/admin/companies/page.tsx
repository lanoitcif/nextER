'use client'

import { useAuth, isAdmin } from '@/lib/auth/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { ArrowLeft, Edit, Save, Plus, Trash2, Building2 } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface Company {
  id: string
  ticker: string
  name: string
  primary_company_type_id: string
  additional_company_types?: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

interface CompanyType {
  id: string
  name: string
  description: string
}

export default function CompaniesPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [companies, setCompanies] = useState<Company[]>([])
  const [companyTypes, setCompanyTypes] = useState<CompanyType[]>([])
  const [editingCompany, setEditingCompany] = useState<Company | null>(null)
  const [showNewCompanyModal, setShowNewCompanyModal] = useState(false)
  const [newCompany, setNewCompany] = useState<Partial<Company>>({
    ticker: '',
    name: '',
    primary_company_type_id: '',
    is_active: true
  })
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    } else if (!loading && !isAdmin(profile)) {
      router.push('/dashboard')
    }
  }, [user, profile, loading, router])

  useEffect(() => {
    fetchCompanies()
    fetchCompanyTypes()
  }, [])

  const fetchCompanies = async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .order('name')

    if (error) {
      console.error('Error fetching companies:', error)
    } else {
      setCompanies(data)
    }
    setIsLoading(false)
  }

  const fetchCompanyTypes = async () => {
    const { data, error } = await supabase
      .from('company_types')
      .select('id, name, description')
      .eq('is_active', true)
      .order('name')

    if (error) {
      console.error('Error fetching company types:', error)
    } else {
      setCompanyTypes(data)
    }
  }

  const handleSaveCompany = async () => {
    if (!editingCompany) return

    const response = await fetch(`/api/admin/companies/${editingCompany.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(editingCompany),
    })

    if (response.ok) {
      setEditingCompany(null)
      fetchCompanies()
    } else {
      const data = await response.json()
      console.error('Error updating company:', data.error)
    }
  }

  const handleCreateCompany = async () => {
    if (!newCompany.ticker || !newCompany.name || !newCompany.primary_company_type_id) {
      alert('Please fill in all required fields')
      return
    }

    const response = await fetch('/api/admin/companies', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newCompany),
    })

    if (response.ok) {
      setShowNewCompanyModal(false)
      setNewCompany({
        ticker: '',
        name: '',
        primary_company_type_id: '',
        is_active: true
      })
      fetchCompanies()
    } else {
      const data = await response.json()
      alert(`Error creating company: ${data.error}`)
    }
  }

  const handleDeleteCompany = async (companyId: string) => {
    if (!confirm('Are you sure you want to deactivate this company?')) return

    const response = await fetch(`/api/admin/companies/${companyId}`, {
      method: 'DELETE',
    })

    if (response.ok) {
      fetchCompanies()
    } else {
      const data = await response.json()
      console.error('Error deactivating company:', data.error)
    }
  }

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.ticker.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
                    Company Management
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    Manage companies and their analysis types
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <div className="flex-1 max-w-sm">
              <input
                type="text"
                placeholder="Search companies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <button
              onClick={() => setShowNewCompanyModal(true)}
              className="btn-primary ml-4"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Company
            </button>
          </div>

          <div className="card">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ticker
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Company Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Primary Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCompanies.map((company) => {
                    const companyType = companyTypes.find(t => t.id === company.primary_company_type_id)
                    return (
                      <tr key={company.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {company.ticker}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {company.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {companyType?.name || 'Unknown'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex text-xs leading-5 font-semibold rounded-full px-2 py-1 ${
                            company.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {company.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => setEditingCompany(company)}
                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCompany(company.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Edit Company Modal */}
          {editingCompany && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-2xl">
                <h2 className="text-2xl font-bold mb-4">Edit Company</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Ticker</label>
                    <input
                      type="text"
                      value={editingCompany.ticker}
                      onChange={(e) =>
                        setEditingCompany({ ...editingCompany, ticker: e.target.value.toUpperCase() })
                      }
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Company Name</label>
                    <input
                      type="text"
                      value={editingCompany.name}
                      onChange={(e) =>
                        setEditingCompany({ ...editingCompany, name: e.target.value })
                      }
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Primary Analysis Type</label>
                    <select
                      value={editingCompany.primary_company_type_id}
                      onChange={(e) =>
                        setEditingCompany({ ...editingCompany, primary_company_type_id: e.target.value })
                      }
                      className="w-full"
                    >
                      {companyTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Status</label>
                    <select
                      value={editingCompany.is_active ? 'active' : 'inactive'}
                      onChange={(e) =>
                        setEditingCompany({ ...editingCompany, is_active: e.target.value === 'active' })
                      }
                      className="w-full"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
                <div className="mt-6 flex justify-end space-x-4">
                  <button
                    onClick={() => setEditingCompany(null)}
                    className="btn-ghost"
                  >
                    Cancel
                  </button>
                  <button onClick={handleSaveCompany} className="btn-primary">
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* New Company Modal */}
          {showNewCompanyModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-2xl">
                <h2 className="text-2xl font-bold mb-4">Add New Company</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Ticker *</label>
                    <input
                      type="text"
                      value={newCompany.ticker || ''}
                      onChange={(e) =>
                        setNewCompany({ ...newCompany, ticker: e.target.value.toUpperCase() })
                      }
                      className="w-full"
                      placeholder="e.g., AAPL"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Company Name *</label>
                    <input
                      type="text"
                      value={newCompany.name || ''}
                      onChange={(e) =>
                        setNewCompany({ ...newCompany, name: e.target.value })
                      }
                      className="w-full"
                      placeholder="e.g., Apple Inc."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Primary Analysis Type *</label>
                    <select
                      value={newCompany.primary_company_type_id || ''}
                      onChange={(e) =>
                        setNewCompany({ ...newCompany, primary_company_type_id: e.target.value })
                      }
                      className="w-full"
                    >
                      <option value="">-- Select Type --</option>
                      {companyTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mt-6 flex justify-end space-x-4">
                  <button
                    onClick={() => {
                      setShowNewCompanyModal(false)
                      setNewCompany({
                        ticker: '',
                        name: '',
                        primary_company_type_id: '',
                        is_active: true
                      })
                    }}
                    className="btn-ghost"
                  >
                    Cancel
                  </button>
                  <button onClick={handleCreateCompany} className="btn-primary">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Company
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