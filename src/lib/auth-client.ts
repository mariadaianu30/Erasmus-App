import { supabase } from '@/lib/supabase'

export async function signOutEverywhere() {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.warn('Global sign-out failed; clearing local session only.', error.message)
      await supabase.auth.signOut({ scope: 'local' })
      return { success: false, error }
    }
    return { success: true, error: null }
  } catch (error) {
    console.error('Unexpected error during sign-out. Clearing local session.', error)
    try {
      await supabase.auth.signOut({ scope: 'local' })
    } catch (localError) {
      console.error('Local sign-out cleanup failed:', localError)
    }
    return { success: false, error }
  }
}




