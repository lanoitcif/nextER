'use client'

import { useAuth, isAdmin } from '@/lib/auth/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, Edit } from 'lucide-react'
import UserSettingsForm from '@/components/admin/UserSettingsForm'

interface UserRow {
  id: string
  email: string
  full_name: string | null
  access_level: 'basic' | 'advanced' | 'admin'
  default_provider: string | null
  default_model: string | null
}

export default function AdminUsersPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<UserRow[]>([])
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null)

  useEffect(() => {
    if (!loading && (!user || !isAdmin(profile))) {
      router.push('/dashboard')
    }
  }, [user, profile, loading, router])

  useEffect(() => {
    if (user && isAdmin(profile)) {
      fetchUsers()
    }
  }, [user, profile])

  const fetchUsers = async () => {
    const token = (await supabase.auth.getSession()).data.session?.access_token
    if (!token) return
    const res = await fetch('/api/admin/users', {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (res.ok) {
      const data = await res.json()
      setUsers(data.users)
    }
  }

  const handleSave = () => {
    setSelectedUser(null)
    fetchUsers()
    setSuccess('User updated successfully')
    setTimeout(() => setSuccess(''), 3000)
  }

  if (!user || loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!isAdmin(profile)) return null

  return (
    <div className="min-h-screen bg-charcoal">
      <header className="bg-charcoal shadow-lg border-b border-teal-mist/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard/admin" className="btn-ghost flex items-center space-x-2">
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Admin</span>
              </Link>
              <h1 className="text-2xl font-bold text-cream-glow">User Management</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {error && <div className="text-red-400 mb-4">{error}</div>}
          {success && <div className="text-green-400 mb-4">{success}</div>}
          <div className="space-y-4">
            {users.map(u => (
              <div key={u.id} className="border border-grape-static/20 rounded-lg p-4 bg-charcoal/60">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-cream-glow">{u.email}</div>
                    <div className="text-cream-glow/70 text-sm">{u.full_name}</div>
                    <div className="text-xs text-teal-mist mt-1">
                      LLM: {u.default_provider || 'System'} / {u.default_model || 'Default'}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <select
                      value={u.access_level}
                      onChange={e => handleChange(u.id, e.target.value)}
                      disabled={updating}
                      className="bg-charcoal border border-grape-static text-cream-glow p-2 rounded-md"
                    >
                      <option value="basic">basic</option>
                      <option value="advanced">advanced</option>
                      <option value="admin">admin</option>
                    </select>
                    <button onClick={() => setSelectedUser(u)} className="btn-secondary">
                      <Edit className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {selectedUser && (
        <UserSettingsForm
          user={selectedUser}
          onSave={handleSave}
          onCancel={() => setSelectedUser(null)}
        />
      )}
    </div>
  )
}

async function handleChange(id: string, level: string) {
  const token = (await supabase.auth.getSession()).data.session?.access_token
  await fetch('/api/admin/users', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ userId: id, accessLevel: level })
  })
}
