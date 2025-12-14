'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { signOutEverywhere } from '@/lib/auth-client'
import { Menu, X, Calendar, User, LogOut } from 'lucide-react'

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
  const [signingOut, setSigningOut] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  const fetchProfile = useCallback(async (userId: string, retryCount = 0) => {
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
            // Get user metadata to extract names - use session instead of getUser()
            const { data: { session } } = await supabase.auth.getSession()
            const userMeta = session?.user?.user_metadata || {}
            
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
  }, [])

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
  }, [fetchProfile])

  const handleSignOut = async () => {
    if (signingOut) return
    setSigningOut(true)
    try {
      const result = await signOutEverywhere()
      if (!result.success && result.error) {
        console.error('Error signing out:', result.error)
      }
    } catch (error) {
      console.error('Error signing out:', error)
    } finally {
      setUser(null)
      setProfile(null)
      router.push('/')
      router.refresh()
      setSigningOut(false)
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
    const baseItems = [
      { name: 'Events', href: '/events' },
      { name: 'Organizations', href: '/organizations' },
    ]

    // Default dashboard tab (also covers logged out state)
    const dashboardItem = {
      name: 'Dashboard',
      href: profile?.user_type === 'organization' ? '/dashboard/organization' : '/dashboard',
    }

    if (!user || !profile) {
      return [...baseItems, dashboardItem]
    }

    if (profile.user_type === 'organization') {
      return [...baseItems, dashboardItem, { name: 'Projects', href: '/projects' }]
    }

    return [...baseItems, dashboardItem]
  }

  const isRouteActive = (href: string) => {
    if (!pathname) return false
    if (href === '/') {
      return pathname === '/'
    }
    if (href === '/dashboard' && pathname.startsWith('/dashboard/organization')) {
      return false
    }
    if (href === '/dashboard/organization' && pathname === '/dashboard') {
      return false
    }
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  const getDesktopNavClasses = (href: string) => {
    const active = isRouteActive(href)
    return [
      'px-3 py-2 rounded-md text-sm font-medium transition-colors border',
      active
        ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-sm'
        : 'text-gray-700 hover:text-blue-600 border-transparent',
    ].join(' ')
  }

  const getMobileNavClasses = (href: string) => {
    const active = isRouteActive(href)
    return [
      'block px-3 py-2 rounded-md text-base font-medium transition-colors border',
      active
        ? 'bg-blue-50 text-blue-700 border-blue-200'
        : 'text-gray-700 hover:text-blue-600 border-transparent',
    ].join(' ')
  }

  const navContent = (
    <>
      {/* Logo */}
      <div className="flex items-center">
        <Link href="/" className="flex items-center group">
          <Calendar className="h-8 w-8 text-blue-600 group-hover:text-blue-700 transition-colors duration-200" />
          <div className="ml-2">
            <div className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">Erasmus+ Connect</div>
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
            className={getDesktopNavClasses(item.href)}
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
              className="flex items-center text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              <User className="h-4 w-4 mr-2" />
              {getDisplayName()}
            </Link>
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="flex items-center bg-red-50 text-red-700 hover:bg-red-100 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 border border-red-200 hover:border-red-300 disabled:opacity-50"
            >
              {signingOut ? (
                <>
                  <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-red-600 mr-2" />
                  Signing out...
                </>
              ) : (
                <>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </>
              )}
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
          className="text-gray-700 hover:text-blue-600 p-2 rounded-md"
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>
    </>
  )

  if (loading) {
    return (
      <nav className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <Calendar className="h-8 w-8 text-blue-600" />
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
    <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {navContent}
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div 
            className="md:hidden fixed inset-0 z-40 bg-black bg-opacity-50 transition-opacity duration-300"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div 
              className="bg-white w-64 sm:w-80 h-full shadow-xl transform transition-transform duration-300 ease-out"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b">
                <span className="text-lg font-semibold text-gray-900">Menu</span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-gray-500 hover:text-gray-700 p-1 rounded-md transition-colors"
                  aria-label="Close menu"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="px-2 pt-4 pb-3 space-y-1 overflow-y-auto max-h-[calc(100vh-80px)]">
                {getNavigationItems().map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={getMobileNavClasses(item.href)}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
                
                {!user && (
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <Link
                      href="/auth"
                      className="block bg-blue-600 text-white px-4 py-3 rounded-lg text-base font-medium hover:bg-blue-700 transition-colors text-center mx-3"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Login/Register
                    </Link>
                  </div>
                )}
                
                {user && (
                  <div className="border-t border-gray-200 pt-4 mt-4 space-y-2">
                    <Link
                      href="/profile"
                      className="flex items-center text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-base font-medium transition-colors"
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
                      disabled={signingOut}
                      className="flex items-center bg-red-50 text-red-700 hover:bg-red-100 px-3 py-2 rounded-md text-base font-medium transition-all duration-200 w-full text-left border border-red-200 hover:border-red-300 disabled:opacity-50"
                    >
                      {signingOut ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2" />
                          Signing out...
                        </>
                      ) : (
                        <>
                          <LogOut className="h-4 w-4 mr-2" />
                          Sign Out
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
