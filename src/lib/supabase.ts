import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          user_type: 'participant' | 'organization'
          first_name: string | null
          last_name: string | null
          age: number | null
          bio: string | null
          location: string | null
          organization_name: string | null
          website: string | null
        }
        Insert: {
          id: string
          created_at?: string
          updated_at?: string
          user_type: 'participant' | 'organization'
          first_name?: string | null
          last_name?: string | null
          age?: number | null
          bio?: string | null
          location?: string | null
          organization_name?: string | null
          website?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          user_type?: 'participant' | 'organization'
          first_name?: string | null
          last_name?: string | null
          age?: number | null
          bio?: string | null
          location?: string | null
          organization_name?: string | null
          website?: string | null
        }
      }
      events: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          title: string
          description: string
          start_date: string
          end_date: string
          location: string
          max_participants: number
          category: string
          organization_id: string
          is_published: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          title: string
          description: string
          start_date: string
          end_date: string
          location: string
          max_participants: number
          category: string
          organization_id: string
          is_published?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          title?: string
          description?: string
          start_date?: string
          end_date?: string
          location?: string
          max_participants?: number
          category?: string
          organization_id?: string
          is_published?: boolean
        }
      }
      applications: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          event_id: string
          participant_id: string
          motivation_letter: string
          status: 'pending' | 'accepted' | 'rejected'
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          event_id: string
          participant_id: string
          motivation_letter: string
          status?: 'pending' | 'accepted' | 'rejected'
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          event_id?: string
          participant_id?: string
          motivation_letter?: string
          status?: 'pending' | 'accepted' | 'rejected'
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Helper functions for common operations
export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey)
