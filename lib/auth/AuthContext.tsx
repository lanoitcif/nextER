'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/client'
import { useIsVisible } from '@/lib/utils/hooks'

type UserProfile = {
  id: string;
  full_name: string | null;
  email: string;
  can_use_owner_key: boolean;
  access_level: 'basic' | 'advanced' | 'admin';
};

// Helper function to check if a user profile has admin privileges
export function isAdmin(profile: UserProfile | null): boolean {
  if (!profile) return false
  return (
    (profile as any).access_level === 'admin' ||
    (profile as any).is_admin === true
  )
}

export function isAdvanced(profile: UserProfile | null): boolean {
  if (!profile) return false
  const level = (profile as any).access_level
  return level === 'advanced' || level === 'admin'
}

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string, fullName?: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<UserProfile | null>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  clearCorruptedSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const isVisible = useIsVisible()

  const refreshSession = async (showLoading = true) => {
    if (showLoading) {
      setLoading(true)
    }
    try {
      console.log('🔄 Refreshing session...')
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('❌ Session refresh error:', error)
        // Clear potentially corrupted auth state
        await supabase.auth.signOut({ scope: 'local' })
        setSession(null)
        setUser(null)
        setProfile(null)
        return
      }

      console.log('✅ Session refreshed:', session ? 'authenticated' : 'anonymous')
      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        await fetchUserProfile(session.user.id)
      } else {
        setProfile(null)
      }
    } catch (error) {
      console.error('💥 Critical error refreshing session:', error)
      // Force clear everything on critical errors
      setSession(null)
      setUser(null)
      setProfile(null)
    } finally {
      if (showLoading) {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    // Get initial session
    refreshSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setLoading(true) // Ensure loading state is active during auth changes
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await fetchUserProfile(session.user.id)
        } else {
          setProfile(null)
        }
        
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    // Disable visibility-based session refresh to prevent state resets during user interactions
    // The onAuthStateChange listener and initial session fetch are sufficient for auth management
    // This prevents analysis results from being reset when taking screenshots or switching tabs
  }, [isVisible, user, loading])

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, full_name, email, can_use_owner_key, access_level')
        .eq('id', userId)
        .single()
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user profile:', error)
        return
      }
      
      setProfile(data)
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
  }

  const signUp = async (email: string, password: string, fullName?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        }
      }
    })

    if (error) throw error
    
    // Profile will be created automatically by the database trigger
  }

  const signIn = async (email: string, password: string) => {
    const { data: signInData, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw error
    if (!signInData.user) throw new Error('Sign in failed, no user returned')

    // After successful sign-in, fetch the user's profile
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('id, full_name, email, can_use_owner_key, access_level')
        .eq('id', signInData.user.id)
        .single()
      
      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error fetching user profile after sign in:', profileError)
        // Still return null instead of throwing, so login can complete
        return null
      }
      
      setProfile(profileData)
      return profileData

    } catch (profileError) {
      console.error('Error fetching user profile after sign in:', profileError)
      return null
    }
  }

  const clearCorruptedSession = async () => {
    console.log('🧹 Clearing potentially corrupted session...')
    try {
      // Clear local auth state first
      await supabase.auth.signOut({ scope: 'local' })
      
      // Clear any lingering state
      setSession(null)
      setUser(null)
      setProfile(null)
      setLoading(false)
      
      // Clear relevant cookies/localStorage if any
      if (typeof window !== 'undefined') {
        // Clear any auth-related localStorage
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('supabase.auth.token') || key.startsWith('sb-')) {
            localStorage.removeItem(key)
          }
        })
      }
      
      console.log('✅ Session cleared successfully')
    } catch (error) {
      console.error('Error clearing session:', error)
    }
  }

  const signOut = async () => {
    try {
      console.log('Starting sign out process...')
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Error signing out:', error)
        throw error
      }
      console.log('Sign out successful, clearing local state')
      // Clear local state immediately
      setUser(null)
      setProfile(null)
      setSession(null)
      console.log('Local state cleared')
    } catch (error) {
      console.error('Sign out failed:', error)
      // Clear local state anyway to ensure user is logged out
      setUser(null)
      setProfile(null)
      setSession(null)
      throw error
    }
  }

  const refreshProfile = async () => {
    if (user) {
      await fetchUserProfile(user.id)
    }
  }

  const value = {
    user,
    profile,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    refreshProfile,
    clearCorruptedSession
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}