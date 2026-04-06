import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Supabase-related storage keys
const AUTH_KEYS = ['supabase.auth.token', 'sb-', 'auth-token', 'supabase']

/**
 * Hyper-Defensive Storage Adapter
 * Prevents "Cannot create property 'user' on string" by ensuring GoTrue 
 * NEVER receives a malformed or truncated string that it can't parse internally.
 */
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null
    const value = window.localStorage.getItem(key)
    if (!value) return null
    
    // Non-JSON keys (like 'favorite_events') should be returned as-is
    if (!AUTH_KEYS.some(k => key.includes(k))) return value
    
    try {
      // 1. MUST BE VALID JSON
      const parsed = JSON.parse(value)
      
      // 2. MUST BE AN OBJECT (not a string, number, or null)
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Not an object')
      }
      
      // 3. MUST HAVE ACCESS_TOKEN IF IT'S A SESSION
      if (value.includes('access_token') && !parsed.access_token) {
        throw new Error('Missing access_token')
      }
      
      // 4. PREVENT TRUNCATION: ensure it's a "clean" JSON string
      // This solves the encoding/truncation issue by standardizing the string
      return JSON.stringify(parsed)
    } catch (e) {
      // ANY CORRUPTION -> NUCLEAR PURGE
      console.warn(`[Supabase Fix] Purging corrupted auth key: ${key}`)
      window.localStorage.removeItem(key)
      return null
    }
  },
  setItem: (key: string, value: string) => {
    if (typeof window !== 'undefined') {
      // Validate before saving to prevent writing more corruption
      if (AUTH_KEYS.some(k => key.includes(k))) {
        try {
          JSON.parse(value)
          window.localStorage.setItem(key, value)
        } catch (e) {
          console.error(`[Supabase Fix] Blocked attempt to save invalid JSON to ${key}`)
        }
      } else {
        window.localStorage.setItem(key, value)
      }
    }
  },
  removeItem: (key: string) => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(key)
    }
  }
}

/**
 * Startup Nuclear Cleanup
 * Runs BEFORE any client initialization to purge any existing corruption.
 */
if (typeof window !== 'undefined') {
  try {
    const keys = Object.keys(localStorage)
    for (const key of keys) {
      if (AUTH_KEYS.some(k => key.includes(k))) {
        const value = localStorage.getItem(key)
        if (value) {
          try {
            const parsed = JSON.parse(value)
            if (!parsed || typeof parsed !== 'object') {
               throw new Error('Malformed')
            }
          } catch (e) {
            console.warn(`[Supabase Fix] NUCLEAR: Deleting corrupted startup key: ${key}`)
            localStorage.removeItem(key)
          }
        }
      }
    }
  } catch (error) {
    console.error('[Supabase Fix] Error during nuclear startup cleanup:', error)
  }
}

// Global variable to hold the client instance
let supabaseInstance: any = null

/**
 * Helper function to create Supabase client with custom storage and error handling
 */
function createSupabaseClient() {
  // Return the existing instance if we're in the browser to avoid multiple client issues
  if (typeof window !== 'undefined' && supabaseInstance) return supabaseInstance

  try {
    const client = createBrowserClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: typeof window !== 'undefined' ? safeLocalStorage : undefined,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
    
    if (typeof window !== 'undefined') {
      supabaseInstance = client
    }
    
    return client
  } catch (error) {
    console.error('[Supabase Fix] CRITICAL: Error initializing Supabase client:', error)
    // Emergency cleanup and retry
    if (typeof window !== 'undefined') {
      localStorage.clear() // NUCLEAR RESET
      return createBrowserClient(supabaseUrl, supabaseAnonKey)
    }
    throw error
  }
}

// Exported Supabase client
export const supabase = createSupabaseClient()

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
            application_deadline: string | null
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
            application_deadline?: string | null
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
            application_deadline?: string | null
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
export const supabaseClient = supabase as ReturnType<typeof createBrowserClient<Database>>
