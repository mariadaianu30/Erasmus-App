'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Menu, X, Calendar, Users, User, LogOut, Settings } from 'lucide-react'

interface User {
  id: string
  email?: string
  user_metadata?: {
    first_name?: string
    last_name?: string
    organization_name?: string
  }
}

interface Profile {
  user_type: 'participant' | 'organization'
  first_name?: string
  last_name?: string
  organization_name?: string
  birth_date?: string
}

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUser(session.user)
        await fetchProfile(session.user.id)
      }
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user)
          // Add a small delay for sign-up events to allow profile creation
          if ((event as any) === 'SIGNED_UP') {
            setTimeout(() => fetchProfile(session.user.id), 1000)
          } else {
            await fetchProfile(session.user.id)
          }
        } else {
          setUser(null)
          setProfile(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId: string, retryCount = 0) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_type, first_name, last_name, organization_name, bio, location, birth_date, website')
        .eq('id', userId)
        .single()

      // Handle case where profile doesn't exist yet (common during sign-up)
      if (error) {
        // Check if it's a "not found" error or empty error object
        const isNotFoundError = error.code === 'PGRST116' || 
                                error.message?.includes('No rows found') ||
                                error.message?.includes('not found') ||
                                Object.keys(error).length === 0 ||
                                !error.code // Handle cases where error object has no code
        
        if (isNotFoundError) {
          // Retry up to 3 times with delay for new sign-ups
          if (retryCount < 3) {
            setTimeout(() => fetchProfile(userId, retryCount + 1), (retryCount + 1) * 2000)
            return
          }
          
          // Try to create a basic profile if it doesn't exist
          try {
            // Get user metadata to extract names
            const { data: userData } = await supabase.auth.getUser()
            const userMeta = userData?.user?.user_metadata || {}
            
            // Try to insert, but if it fails due to existing profile, update instead
            const { error: insertError } = await supabase
              .from('profiles')
              .upsert({
                id: userId,
                user_type: (userMeta.user_type || 'participant') as any,
                first_name: userMeta.first_name || '',
                last_name: userMeta.last_name || '',
                birth_date: userMeta.birth_date || new Date(Date.now() - 18 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                organization_name: userMeta.organization_name || null
              })
            
            if (insertError) {
              console.error('Failed to create/update profile:', insertError)
              setProfile(null)
            } else {
              // Try to fetch the newly created/updated profile
              setTimeout(() => fetchProfile(userId, 0), 1000)
            }
          } catch (createError) {
            console.error('Exception creating profile:', createError)
            setProfile(null)
          }
          return
        }
        
        // Only log meaningful errors (skip empty error objects)
        if (Object.keys(error).length > 0 && error.code && error.code !== 'PGRST116') {
          console.error('Profile fetch error:', error.code, error.message)
        }
        return
      }

      if (data) {
        setProfile(data)
      } else {
        setProfile(null)
      }
    } catch (error) {
      console.error('Profile fetch exception:', error)
      setProfile(null)
    }
  }

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const getDisplayName = () => {
    // If no profile yet (during sign-up), extract name from email
    if (!profile) {
      if (user?.email) {
        const emailName = user.email.split('@')[0]
        // Capitalize first letter and replace dots/underscores with spaces
        return emailName.replace(/[._]/g, ' ').split(' ').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ')
      }
      return 'User'
    }
    
    if (profile.user_type === 'organization') {
      return profile.organization_name || 'Organization'
    }
    
    // For participants, try to get a meaningful display name
    const firstName = profile.first_name?.trim() || ''
    const lastName = profile.last_name?.trim() || ''
    
    // Check if names are empty or default values
    const isEmptyName = (!firstName || firstName.trim() === '' || firstName === 'User') && 
                       (!lastName || lastName.trim() === '' || lastName === 'User')
    
    if (isEmptyName) {
      // If names are empty, extract from email
      if (user?.email) {
        const emailName = user.email.split('@')[0]
        // Capitalize first letter and replace dots/underscores with spaces
        return emailName.replace(/[._]/g, ' ').split(' ').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ')
      }
      return 'User'
    }
    
    // If we have both names, show full name
    if (firstName && lastName) {
      return `${firstName} ${lastName}`
    }
    
    // If we have only first name, show it
    if (firstName) {
      return firstName
    }
    
    // If we have only last name, show it
    if (lastName) {
      return lastName
    }
    
    // Extract name from email if possible (before @)
    if (user?.email) {
      const emailName = user.email.split('@')[0]
      // Capitalize first letter and replace dots/underscores with spaces
      return emailName.replace(/[._]/g, ' ').split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ')
    }
    
    // Final fallback
    return 'User'
  }

  const getNavigationItems = () => {
    if (!user) {
      return [
        { name: 'Opportunities', href: '/events' },
        { name: 'Organizations', href: '/organizations' },
        { name: 'Login/Register', href: '/auth' },
      ]
    }

    const baseItems = [
      { name: 'Opportunities', href: '/events' },
      { name: 'Organizations', href: '/organizations' },
    ]

    if (profile?.user_type === 'participant') {
      return [
        ...baseItems,
        { name: 'Dashboard', href: '/dashboard' },
      ]
    }

    if (profile?.user_type === 'organization') {
      return [
        ...baseItems,
        { name: 'Dashboard', href: '/dashboard/organization' },
      ]
    }

    return baseItems
  }

  if (loading) {
    return (
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <Calendar className="h-8 w-8 text-primary-600" />
                <div className="ml-2">
                  <div className="text-xl font-bold text-gray-900">Erasmus+ Connect</div>
                  <div className="text-xs text-gray-500 -mt-1">by Scout Society</div>
                </div>
              </Link>
            </div>
            <div className="flex items-center">
              <div className="animate-pulse bg-gray-200 h-8 w-24 rounded"></div>
            </div>
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <Calendar className="h-8 w-8 text-primary-600" />
              <div className="ml-2">
                <div className="text-xl font-bold text-gray-900">Erasmus+ Connect</div>
                <div className="text-xs text-gray-500 -mt-1">by Scout Society</div>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {getNavigationItems().map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <Link
                  href="/profile"
                  className="flex items-center text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  <User className="h-4 w-4 mr-2" />
                  {getDisplayName()}
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex items-center bg-red-50 text-red-700 hover:bg-red-100 px-3 py-2 rounded-md text-sm font-medium transition-colors border border-red-200"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  href="/auth"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Login/Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-700 hover:text-primary-600 p-2 rounded-md"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-50 border-t">
              {getNavigationItems().map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-gray-700 hover:text-primary-600 block px-3 py-2 rounded-md text-base font-medium transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              
              {user && (
                <div className="border-t pt-2 mt-2">
                  <Link
                    href="/profile"
                    className="flex items-center text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-base font-medium transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <User className="h-4 w-4 mr-2" />
                    {getDisplayName()}
                  </Link>
                  <button
                    onClick={() => {
                      handleSignOut()
                      setMobileMenuOpen(false)
                    }}
                    className="flex items-center bg-red-50 text-red-700 hover:bg-red-100 px-3 py-2 rounded-md text-base font-medium transition-colors w-full text-left border border-red-200"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
