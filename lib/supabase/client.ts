import { createClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Debug: Log what we're getting from environment
console.log('Environment check:', {
  url: supabaseUrl ? `${supabaseUrl.slice(0, 20)}...` : 'MISSING',
  key: supabaseAnonKey ? `${supabaseAnonKey.slice(0, 20)}...` : 'MISSING',
  allEnv: Object.keys(process.env).filter(key => key.startsWith('NEXT_PUBLIC_'))
})

// Client-side Supabase client
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

// Server-side Supabase client with service role (for API routes)
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Database types
export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          can_use_owner_key: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          can_use_owner_key?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          can_use_owner_key?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      user_api_keys: {
        Row: {
          id: string
          user_id: string
          provider: 'openai' | 'anthropic' | 'google' | 'cohere'
          encrypted_api_key: string
          encryption_iv: string
          nickname: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          provider: 'openai' | 'anthropic' | 'google' | 'cohere'
          encrypted_api_key: string
          encryption_iv: string
          nickname?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          provider?: 'openai' | 'anthropic' | 'google' | 'cohere'
          encrypted_api_key?: string
          encryption_iv?: string
          nickname?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      prompts: {
        Row: {
          id: string
          name: string
          display_name: string
          description: string | null
          system_prompt: string
          category: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          display_name: string
          description?: string | null
          system_prompt: string
          category?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          display_name?: string
          description?: string | null
          system_prompt?: string
          category?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      usage_logs: {
        Row: {
          id: string
          user_id: string
          provider: string
          model: string | null
          prompt_id: string | null
          token_count: number | null
          cost_estimate: number | null
          used_owner_key: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          provider: string
          model?: string | null
          prompt_id?: string | null
          token_count?: number | null
          cost_estimate?: number | null
          used_owner_key?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          provider?: string
          model?: string | null
          prompt_id?: string | null
          token_count?: number | null
          cost_estimate?: number | null
          used_owner_key?: boolean
          created_at?: string
        }
      }
    }
  }
}