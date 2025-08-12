'use client'

import { useAuth, isAdmin } from '@/lib/auth/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { ArrowLeft, Edit, Save, Plus, Trash2, Users, Key } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface Organization {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

interface Member {
    id: string;
    email: string;
    full_name: string;
}

interface ApiKey {
  id: string;
  provider: string;
  nickname: string;
  created_at: string;
}

export default function OrganizationsPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [editingOrganization, setEditingOrganization] = useState<Organization | null>(null)
  const [showNewOrgModal, setShowNewOrgModal] = useState(false)
  const [newOrganization, setNewOrganization] = useState<Partial<Organization>>({ name: '' })
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [managingMembersOrg, setManagingMembersOrg] = useState<Organization | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [newMemberEmail, setNewMemberEmail] = useState('')
  const [managingKeysOrg, setManagingKeysOrg] = useState<Organization | null>(null)
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [newApiKey, setNewApiKey] = useState({ provider: 'openai', apiKey: '', nickname: '' })

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    } else if (!loading && !isAdmin(profile)) {
      router.push('/dashboard')
    }
  }, [user, profile, loading, router])

  useEffect(() => {
    fetchOrganizations()
  }, [])

  const fetchOrganizations = async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .order('name')

    if (error) {
      console.error('Error fetching organizations:', error)
    } else {
      setOrganizations(data as Organization[])
    }
    setIsLoading(false)
  }

  const handleOpenMembersModal = async (org: Organization) => {
    setManagingMembersOrg(org)
    const response = await fetch(`/api/admin/organizations/${org.id}/members`)
    if (response.ok) {
      const data = await response.json()
      setMembers(data.members)
    } else {
      console.error('Failed to fetch members')
    }
  }

  const handleAddMember = async () => {
    if (!newMemberEmail || !managingMembersOrg) return;

    const { data: userToAdd, error } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('email', newMemberEmail)
      .single()

    if (error || !userToAdd) {
      alert('User not found with that email address.')
      return
    }

    const response = await fetch(`/api/admin/organizations/${managingMembersOrg.id}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userToAdd.id }),
    })

    if (response.ok) {
      setNewMemberEmail('')
      handleOpenMembersModal(managingMembersOrg) // Refresh members list
    } else {
      const data = await response.json()
      alert(`Error adding member: ${data.error}`)
    }
  }

  const handleRemoveMember = async (userId: string) => {
    if (!managingMembersOrg) return;
    if (!confirm('Are you sure you want to remove this member?')) return;

    const response = await fetch(`/api/admin/organizations/${managingMembersOrg.id}/members`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId }),
    })

    if (response.ok) {
      handleOpenMembersModal(managingMembersOrg) // Refresh members list
    } else {
      const data = await response.json()
      alert(`Error removing member: ${data.error}`)
    }
  }

  const handleOpenKeysModal = async (org: Organization) => {
    setManagingKeysOrg(org)
    const response = await fetch(`/api/admin/organizations/${org.id}/api-keys`)
    if (response.ok) {
      const data = await response.json()
      setApiKeys(data.apiKeys)
    } else {
      console.error('Failed to fetch API keys')
    }
  }

  const handleAddApiKey = async () => {
    if (!newApiKey.apiKey || !managingKeysOrg) return;

    const response = await fetch(`/api/admin/organizations/${managingKeysOrg.id}/api-keys`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newApiKey),
    })

    if (response.ok) {
      setNewApiKey({ provider: 'openai', apiKey: '', nickname: '' })
      handleOpenKeysModal(managingKeysOrg) // Refresh keys list
    } else {
      const data = await response.json()
      alert(`Error adding API key: ${data.error}`)
    }
  }

  const handleRemoveApiKey = async (keyId: string) => {
    if (!managingKeysOrg) return;
    if (!confirm('Are you sure you want to remove this API key?')) return;

    const response = await fetch(`/api/admin/organizations/${managingKeysOrg.id}/api-keys/${keyId}`, {
      method: 'DELETE',
    })

    if (response.ok) {
      handleOpenKeysModal(managingKeysOrg) // Refresh keys list
    } else {
      const data = await response.json()
      alert(`Error removing API key: ${data.error}`)
    }
  }

  const handleSaveOrganization = async () => {
    if (!editingOrganization) return

    const response = await fetch(`/api/admin/organizations/${editingOrganization.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editingOrganization.name }),
    })

    if (response.ok) {
      setEditingOrganization(null)
      fetchOrganizations()
    } else {
      const data = await response.json()
      alert(`Error updating organization: ${data.error}`)
    }
  }

  const handleCreateOrganization = async () => {
    if (!newOrganization.name) {
      alert('Please enter an organization name')
      return
    }

    const response = await fetch('/api/admin/organizations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newOrganization),
    })

    if (response.ok) {
      setShowNewOrgModal(false)
      setNewOrganization({ name: '' })
      fetchOrganizations()
    } else {
      const data = await response.json()
      alert(`Error creating organization: ${data.error}`)
    }
  }

  const handleDeleteOrganization = async (orgId: string) => {
    if (!confirm('Are you sure you want to delete this organization? This action cannot be undone.')) return

    const response = await fetch(`/api/admin/organizations/${orgId}`, {
      method: 'DELETE',
    })

    if (response.ok) {
      fetchOrganizations()
    } else {
      const data = await response.json()
      alert(`Error deleting organization: ${data.error}`)
    }
  }

  const filteredOrganizations = organizations.filter(org =>
    org.name.toLowerCase().includes(searchTerm.toLowerCase())
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
              <Link href="/dashboard/admin" className="btn-ghost flex items-center space-x-2">
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Admin</span>
              </Link>
              <div className="flex items-center space-x-3">
                <Image src="/near-logo.png" alt="NEaR" width={32} height={32} className="h-8 w-8" />
                <div>
                  <h1 className="text-2xl font-bold">Organization Management</h1>
                  <p className="text-sm text-muted-foreground mt-1">Manage organizations, members, and API keys</p>
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
              <input type="text" placeholder="Search organizations..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full" />
            </div>
            <button onClick={() => setShowNewOrgModal(true)} className="btn-primary ml-4">
              <Plus className="h-4 w-4 mr-2" />
              Add Organization
            </button>
          </div>

          <div className="card">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organization Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOrganizations.map((org) => (
                    <tr key={org.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{org.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(org.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button onClick={() => handleOpenMembersModal(org)} className="text-indigo-600 hover:text-indigo-900 mr-4"><Users className="h-4 w-4" /></button>
                        <button onClick={() => handleOpenKeysModal(org)} className="text-yellow-600 hover:text-yellow-900 mr-4"><Key className="h-4 w-4" /></button>
                        <button onClick={() => setEditingOrganization(org)} className="text-blue-600 hover:text-blue-900 mr-4"><Edit className="h-4 w-4" /></button>
                        <button onClick={() => handleDeleteOrganization(org.id)} className="text-red-600 hover:text-red-900"><Trash2 className="h-4 w-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {editingOrganization && (
            <div className="modal-overlay">
              <div className="modal-content">
                <h2 className="modal-header">Edit Organization</h2>
                <div className="space-y-4">
                  <div>
                    <label className="modal-label">Organization Name</label>
                    <input type="text" value={editingOrganization.name} onChange={(e) => setEditingOrganization({ ...editingOrganization, name: e.target.value })} className="modal-input" />
                  </div>
                </div>
                <div className="mt-6 flex justify-end space-x-4">
                  <button onClick={() => setEditingOrganization(null)} className="btn-ghost">Cancel</button>
                  <button onClick={handleSaveOrganization} className="btn-primary"><Save className="h-4 w-4 mr-2" />Save</button>
                </div>
              </div>
            </div>
          )}

          {showNewOrgModal && (
            <div className="modal-overlay">
              <div className="modal-content">
                <h2 className="modal-header">Add New Organization</h2>
                <div className="space-y-4">
                  <div>
                    <label className="modal-label">Organization Name *</label>
                    <input type="text" value={newOrganization.name || ''} onChange={(e) => setNewOrganization({ name: e.target.value })} className="modal-input" placeholder="e.g., Acme Corp" />
                  </div>
                </div>
                <div className="mt-6 flex justify-end space-x-4">
                  <button onClick={() => setShowNewOrgModal(false)} className="btn-ghost">Cancel</button>
                  <button onClick={handleCreateOrganization} className="btn-primary"><Plus className="h-4 w-4 mr-2" />Create Organization</button>
                </div>
              </div>
            </div>
          )}

          {/* Members Management Modal */}
          {managingMembersOrg && (
            <div className="modal-overlay">
              <div className="modal-content">
                <h2 className="modal-header">Manage Members for {managingMembersOrg.name}</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium">Current Members</h3>
                    <ul className="mt-2 border rounded-md divide-y">
                      {members.map(member => (
                        <li key={member.id} className="p-2 flex justify-between items-center">
                          <div>
                            <p className="font-semibold">{member.full_name}</p>
                            <p className="text-sm text-gray-500">{member.email}</p>
                          </div>
                          <button onClick={() => handleRemoveMember(member.id)} className="btn-danger-sm">Remove</button>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium">Add New Member</h3>
                    <div className="flex space-x-2 mt-2">
                      <input type="email" value={newMemberEmail} onChange={(e) => setNewMemberEmail(e.target.value)} className="modal-input flex-grow" placeholder="Enter user email" />
                      <button onClick={handleAddMember} className="btn-primary">Add</button>
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                  <button onClick={() => setManagingMembersOrg(null)} className="btn-ghost">Close</button>
                </div>
              </div>
            </div>
          )}
        </div>

          {/* API Key Management Modal */}
          {managingKeysOrg && (
            <div className="modal-overlay">
              <div className="modal-content">
                <h2 className="modal-header">Manage API Keys for {managingKeysOrg.name}</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium">Current API Keys</h3>
                    <ul className="mt-2 border rounded-md divide-y">
                      {apiKeys.map(key => (
                        <li key={key.id} className="p-2 flex justify-between items-center">
                          <div>
                            <p className="font-semibold">{key.provider} - {key.nickname}</p>
                            <p className="text-sm text-gray-500">Added on {new Date(key.created_at).toLocaleDateString()}</p>
                          </div>
                          <button onClick={() => handleRemoveApiKey(key.id)} className="btn-danger-sm">Remove</button>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium">Add New API Key</h3>
                    <div className="space-y-2 mt-2">
                      <select value={newApiKey.provider} onChange={(e) => setNewApiKey({...newApiKey, provider: e.target.value})} className="modal-input">
                        <option value="openai">OpenAI</option>
                        <option value="anthropic">Anthropic</option>
                        <option value="google">Google</option>
                        <option value="cohere">Cohere</option>
                      </select>
                      <input type="text" value={newApiKey.nickname} onChange={(e) => setNewApiKey({...newApiKey, nickname: e.target.value})} className="modal-input" placeholder="Nickname (optional)" />
                      <input type="password" value={newApiKey.apiKey} onChange={(e) => setNewApiKey({...newApiKey, apiKey: e.target.value})} className="modal-input" placeholder="API Key" />
                      <button onClick={handleAddApiKey} className="btn-primary w-full">Add API Key</button>
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                  <button onClick={() => setManagingKeysOrg(null)} className="btn-ghost">Close</button>
                </div>
              </div>
            </div>
          )}
      </main>
    </div>
  )
}
