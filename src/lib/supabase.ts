import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Use createBrowserClient for proper cookie-based auth in Next.js App Router
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

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
          // Participant-specific fields
          email: string | null
          birthdate: string | null
          gender: 'female' | 'male' | 'undefined' | null
          nationality: string | null
          citizenships: string[] | null
          residency_country: string | null
          role_in_project: 'participant' | 'group leader' | 'trainer or facilitator' | null
          has_fewer_opportunities: boolean | null
          fewer_opportunities_categories: any | null // JSONB
          languages: any | null // JSONB array: [{"language": "English", "level": "B2"}]
          participant_target_groups: any | null // JSONB array
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
          email?: string | null
          birthdate?: string | null
          gender?: 'female' | 'male' | 'undefined' | null
          nationality?: string | null
          citizenships?: string[] | null
          residency_country?: string | null
          role_in_project?: 'participant' | 'group leader' | 'trainer + facilitator' | null
          has_fewer_opportunities?: boolean | null
          fewer_opportunities_categories?: any | null
          languages?: any | null
          participant_target_groups?: any | null
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
          email?: string | null
          birthdate?: string | null
          gender?: 'female' | 'male' | 'undefined' | null
          nationality?: string | null
          citizenships?: string[] | null
          residency_country?: string | null
          role_in_project?: 'participant' | 'group leader' | 'trainer + facilitator' | null
          has_fewer_opportunities?: boolean | null
          fewer_opportunities_categories?: any | null
          languages?: any | null
          participant_target_groups?: any | null
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
          // New Erasmus+ fields
          event_type: 'Youth exchange' | 'Training Course' | 'Seminar' | 'Study visit' | 'Partnership - Building Activity' | 'Conference simpozion forum' | 'E-learning' | 'Other' | null
          venue_place: string | null
          city: string | null
          country: string | null
          short_description: string | null
          full_description: string | null
          photo_url: string | null
          is_funded: boolean | null
          target_groups: any | null // JSONB array
          group_size: number | null
          working_language: string | null
          participation_fee: number | null
          participation_fee_reason: string | null
          accommodation_food_details: string | null
          transport_details: string | null
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
          event_type?: 'Youth exchange' | 'Training Course' | 'Seminar' | 'Study visit' | 'Partnership - Building Activity' | 'Conference simpozion forum' | 'E-learning' | 'Other' | null
          venue_place?: string | null
          city?: string | null
          country?: string | null
          short_description?: string | null
          full_description?: string | null
          photo_url?: string | null
          is_funded?: boolean | null
          target_groups?: any | null
          group_size?: number | null
          working_language?: string | null
          participation_fee?: number | null
          participation_fee_reason?: string | null
          accommodation_food_details?: string | null
          transport_details?: string | null
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
          event_type?: 'Youth exchange' | 'Training Course' | 'Seminar' | 'Study visit' | 'Partnership - Building Activity' | 'Conference simpozion forum' | 'E-learning' | 'Other' | null
          venue_place?: string | null
          city?: string | null
          country?: string | null
          short_description?: string | null
          full_description?: string | null
          photo_url?: string | null
          is_funded?: boolean | null
          target_groups?: any | null
          group_size?: number | null
          working_language?: string | null
          participation_fee?: number | null
          participation_fee_reason?: string | null
          accommodation_food_details?: string | null
          transport_details?: string | null
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
      projects: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          project_title: string
          organization_id: string
          organization_name: string | null
          searching_partners_countries: string[]
          begin_date: string | null
          end_date: string | null
          deadline_for_partner_request: string | null
          number_of_partners_needed: number
          short_description: string | null
          full_description: string | null
          project_type: string | null
          tags: string[]
          is_active: boolean
          is_published: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          project_title: string
          organization_id: string
          organization_name?: string | null
          searching_partners_countries?: string[]
          begin_date?: string | null
          end_date?: string | null
          deadline_for_partner_request?: string | null
          number_of_partners_needed?: number
          short_description?: string | null
          full_description?: string | null
          project_type?: string | null
          tags?: string[]
          is_active?: boolean
          is_published?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          project_title?: string
          organization_id?: string
          organization_name?: string | null
          searching_partners_countries?: string[]
          begin_date?: string | null
          end_date?: string | null
          deadline_for_partner_request?: string | null
          number_of_partners_needed?: number
          short_description?: string | null
          full_description?: string | null
          project_type?: string | null
          tags?: string[]
          is_active?: boolean
          is_published?: boolean
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
export const supabaseClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
