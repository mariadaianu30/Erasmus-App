'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { calculateAge, formatNameField } from '@/lib/utils'
import { signOutEverywhere } from '@/lib/auth-client'
import { Calendar, Users, User, LogOut, Plus, Settings, TrendingUp, Clock, CheckCircle, XCircle, AlertCircle, Edit, Award, Flag, MapPin, Briefcase, Languages, Mail, FileText } from 'lucide-react'
import { countries } from '@/lib/countries'
import { calculateProfileCompletion } from '@/lib/profile-completion'

interface User {
  id: string
  email?: string
}

interface Profile {
  user_type: 'participant' | 'organization'
  first_name?: string
  last_name?: string
  organization_name?: string
  bio?: string
  location?: string
  birth_date?: string
  birthdate?: string
  website?: string
  // Participant-specific fields
  email?: string
  gender?: 'female' | 'male' | 'undefined'
  nationality?: string
  citizenships?: string[]
  residency_country?: string
  role_in_project?: 'participant' | 'group leader' | 'trainer or facilitator'
  has_fewer_opportunities?: boolean
  fewer_opportunities_categories?: any
  languages?: any
  participant_target_groups?: any
}

interface Application {
  id: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  events: {
    id: string
    title: string
    start_date: string
    end_date: string
    location: string
    category: string
    organization_name: string | null
  }
}

interface ApplicationStats {
  total: number
  pending: number
  accepted: number
  rejected: number
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [applicationStats, setApplicationStats] = useState<ApplicationStats>({ total: 0, pending: 0, accepted: 0, rejected: 0 })
  const [loading, setLoading] = useState(true)
  const [signingOut, setSigningOut] = useState(false)
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [profileForm, setProfileForm] = useState({
    first_name: '',
    last_name: '',
    bio: '',
    location: '',
    birth_date: '',
    website: '',
    // Participant-specific fields
    email: '',
    gender: '' as 'female' | 'male' | 'undefined' | '',
    nationality: '',
    citizenships: [] as string[],
    residency_country: '',
    role_in_project: '' as 'participant' | 'group leader' | 'trainer or facilitator' | '',
    has_fewer_opportunities: false,
    fewer_opportunities_categories: [] as string[],
    languages: [] as Array<{language: string, level: string}>,
    participant_target_groups: [] as string[]
  })
  const [newLanguage, setNewLanguage] = useState({ language: '', level: '' })
  const [newCitizenship, setNewCitizenship] = useState('')

  const genderOptions = ['female', 'male', 'undefined']
  const roleOptions = ['participant', 'group leader', 'trainer or facilitator']
  const fewerOpportunitiesOptions = [
    'Discrimination',
    'Education',
    'Cultural',
    'Disabilities',
    'Economical',
    'Geographical',
    'Health',
    'Social'
  ]
  const targetGroupOptions = [
    'Youth',
    'Youth workers',
    'Trainers',
    'Youth leaders',
    'Project managers',
    'Policy makers',
    'Volunteering',
    'Mentors',
    'Coaches',
    'Researchers',
    'Authorities',
    'Others'
  ]
  const languageLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'Native']
  const [profileUpdateLoading, setProfileUpdateLoading] = useState(false)
  const [profileUpdateMessage, setProfileUpdateMessage] = useState('')
  const router = useRouter()

  useEffect(() => {
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Session error:', error)
          router.push('/auth')
          return
        }
        
        if (!session?.user) {
          router.push('/auth')
          return
        }

        setUser(session.user)
        
        // Fetch user profile with all fields
        let { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (profileError) {
          const notFound =
            profileError.code === 'PGRST116' ||
            profileError.message?.toLowerCase().includes('no rows') ||
            profileError.details?.toLowerCase().includes('no rows')

          if (notFound) {
            try {
              // Get user metadata to extract names
              const { data: userData } = await supabase.auth.getUser()
              const userMeta = userData?.user?.user_metadata || {}
              const participantDefaults = userMeta.participant_profile_defaults || {}
              const organizationDefaults = userMeta.organization_profile_defaults || {}
              const profileType = (userMeta.user_type || 'participant') as 'participant' | 'organization'

              const birthDateValue =
                participantDefaults.birth_date ??
                participantDefaults.birthdate ??
                userMeta.birth_date ??
                new Date(Date.now() - 18 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

              const baseProfile: any = {
                id: session.user.id,
                user_type: profileType,
                first_name: participantDefaults.first_name ?? userMeta.first_name ?? '',
                last_name: participantDefaults.last_name ?? userMeta.last_name ?? '',
                email: participantDefaults.email ?? session.user.email ?? userMeta.email ?? '',
                location:
                  profileType === 'participant'
                    ? participantDefaults.location ?? userMeta.location ?? ''
                    : organizationDefaults.location ?? userMeta.location ?? '',
                birth_date: birthDateValue,
              }

              if (profileType === 'participant') {
                baseProfile.gender = participantDefaults.gender ?? null
                baseProfile.nationality = participantDefaults.nationality ?? null
                baseProfile.citizenships = participantDefaults.citizenships ?? null
                baseProfile.residency_country = participantDefaults.residency_country ?? null
                baseProfile.role_in_project = participantDefaults.role_in_project ?? null
                baseProfile.has_fewer_opportunities = participantDefaults.has_fewer_opportunities ?? false
                baseProfile.fewer_opportunities_categories =
                  participantDefaults.fewer_opportunities_categories ?? []
                baseProfile.languages = participantDefaults.languages ?? []
                baseProfile.participant_target_groups = participantDefaults.participant_target_groups ?? []
              } else {
                baseProfile.organization_name =
                  organizationDefaults.organization_name ?? userMeta.organization_name ?? 'Organization'
                baseProfile.bio = organizationDefaults.bio ?? ''
                baseProfile.website = organizationDefaults.website ?? ''
              }
              
              const { error: insertError } = await supabase
                .from('profiles')
                .upsert(baseProfile)
              
              if (insertError) {
                console.warn('Profile insert deferred:', insertError)
              }

              // Use the base profile immediately so the dashboard has data
              profileData = baseProfile
              profileError = null
              setProfile(profileData)
              setProfileForm(prev => ({
                ...prev,
                first_name: profileData.first_name || '',
                last_name: profileData.last_name || '',
                email: profileData.email || session.user.email || '',
                birth_date: profileData.birth_date || profileData.birthdate || prev.birth_date,
                nationality: profileData.nationality || prev.nationality,
                residency_country: profileData.residency_country || prev.residency_country,
                role_in_project: profileData.role_in_project || prev.role_in_project,
                languages: Array.isArray(profileData.languages) ? profileData.languages : prev.languages,
              }))

              // Kick off a background refresh to hydrate the rest
              fetchApplications(session.user.id)
              setLoading(false)
              return
            } catch (createError) {
              console.error('Failed to create profile:', createError)
            }
          } else {
            console.error('Profile error:', profileError)
            setLoading(false)
            return
          }
        }

        if (profileData) {
          setProfile(profileData)
          
          // Redirect organizations to their dashboard
          if (profileData.user_type === 'organization') {
            router.push('/dashboard/organization')
            return
          }
          
          // Populate profile form
          const languages = Array.isArray(profileData.languages) ? profileData.languages : []
          const citizenships = Array.isArray(profileData.citizenships) ? profileData.citizenships : []
          const fewerOpps = Array.isArray(profileData.fewer_opportunities_categories) ? profileData.fewer_opportunities_categories : []
          const targetGroups = Array.isArray(profileData.participant_target_groups) ? profileData.participant_target_groups : []
          
          setProfileForm({
            first_name: profileData.first_name || '',
            last_name: profileData.last_name || '',
            bio: profileData.bio || '',
            location: profileData.location || '',
            birth_date: profileData.birth_date || '',
            website: profileData.website || '',
            email: profileData.email || '',
            gender: profileData.gender || '',
            nationality: profileData.nationality || '',
            citizenships: citizenships,
            residency_country: profileData.residency_country || '',
            role_in_project: profileData.role_in_project || '',
            has_fewer_opportunities: profileData.has_fewer_opportunities || false,
            fewer_opportunities_categories: fewerOpps,
            languages: languages,
            participant_target_groups: targetGroups
          })
          
          // Fetch applications for participants
          if (profileData.user_type === 'participant') {
            await fetchApplications(session.user.id)
          }
        }
      } catch (error) {
        console.error('Dashboard error:', error)
        router.push('/auth')
      } finally {
        setLoading(false)
      }
    }

    getSession()
  }, [router])

  const fetchApplications = async (userId: string) => {
    try {
        const { data, error } = await supabase
          .from('applications')
          .select(`
            id,
            status,
            created_at,
            events (
              id,
              title,
              start_date,
              end_date,
              location,
              category,
              organization_name
            )
          `)
          .eq('participant_id', userId)
          .order('created_at', { ascending: false })

      if (error) {
        console.log('Applications query error:', error)
        console.log('Error details:', JSON.stringify(error, null, 2))
        // If table doesn't exist or no applications, set empty arrays
        setApplications([])
        setApplicationStats({
          total: 0,
          pending: 0,
          accepted: 0,
          rejected: 0
        })
        return
      }

      console.log('Applications fetched successfully:', data)
      console.log('Number of applications:', data?.length || 0)
      setApplications((data as unknown as Application[]) || [])
      
      // Calculate stats
      const stats = {
        total: data?.length || 0,
        pending: data?.filter(app => app.status === 'pending').length || 0,
        accepted: data?.filter(app => app.status === 'accepted').length || 0,
        rejected: data?.filter(app => app.status === 'rejected').length || 0
      }
      setApplicationStats(stats)
    } catch (error) {
      console.log('Applications fetch error (non-critical):', error)
      // Set empty data on error
      setApplications([])
      setApplicationStats({
        total: 0,
        pending: 0,
        accepted: 0,
        rejected: 0
      })
    }
  }

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

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setProfileUpdateLoading(true)
    setProfileUpdateMessage('')

    // Add timeout to prevent hanging
    const timeoutId = setTimeout(() => {
      setProfileUpdateLoading(false)
      setProfileUpdateMessage('Update timed out. Please try again.')
    }, 5000) // 5 second timeout

    try {
      // Handle website field - simple cleanup
      const websiteValue = profileForm.website?.trim() || null;

      const formattedFirstName = formatNameField(profileForm.first_name) || ''
      const formattedLastName = formatNameField(profileForm.last_name) || ''

      const updateData: any = {
        first_name: formattedFirstName,
        last_name: formattedLastName,
        bio: profileForm.bio,
        location: profileForm.location,
        birth_date: profileForm.birth_date || null,
        website: websiteValue
      }

      // Add participant-specific fields if user is a participant
      if (profile?.user_type === 'participant') {
        updateData.email = profileForm.email.trim() || null
        updateData.gender = profileForm.gender || null
        updateData.nationality = profileForm.nationality.trim() || null
        updateData.citizenships = profileForm.citizenships.length > 0 ? profileForm.citizenships : null
        updateData.residency_country = profileForm.residency_country.trim() || null
        updateData.role_in_project = profileForm.role_in_project || null
        updateData.has_fewer_opportunities = profileForm.has_fewer_opportunities
        updateData.fewer_opportunities_categories = profileForm.fewer_opportunities_categories.length > 0 ? profileForm.fewer_opportunities_categories : null
        updateData.languages = profileForm.languages.length > 0 ? profileForm.languages : null
        updateData.participant_target_groups = profileForm.participant_target_groups.length > 0 ? profileForm.participant_target_groups : null
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id)


      if (error) {
        setProfileUpdateMessage('Failed to update profile: ' + error.message)
      } else {
        setProfileUpdateMessage('Profile updated successfully!')
        setIsEditingProfile(false)
        
        // Refresh profile data
        const { data: updatedProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        if (updatedProfile) {
          setProfile(updatedProfile)
        }
      }
    } catch {
      setProfileUpdateMessage('An error occurred while updating profile')
    } finally {
      clearTimeout(timeoutId)
      setProfileUpdateLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    
    setProfileForm(prev => {
      if (type === 'checkbox') {
        if (name === 'has_fewer_opportunities') {
          return { ...prev, [name]: checked }
        }
        // Handle checkbox arrays
        if (name.startsWith('fewer_opp_') || name.startsWith('target_group_')) {
          const key = name.startsWith('fewer_opp_') ? 'fewer_opportunities_categories' : 'participant_target_groups'
          const item = name.replace('fewer_opp_', '').replace('target_group_', '')
          const current = prev[key as keyof typeof prev] as string[]
          if (checked) {
            return { ...prev, [key]: [...current, item] }
          } else {
            return { ...prev, [key]: current.filter(i => i !== item) }
          }
        }
        return { ...prev, [name]: checked }
      }
      return { ...prev, [name]: value }
    })
  }

  const addLanguage = () => {
    if (newLanguage.language && newLanguage.level) {
      setProfileForm(prev => ({
        ...prev,
        languages: [...prev.languages, { language: newLanguage.language, level: newLanguage.level }]
      }))
      setNewLanguage({ language: '', level: '' })
    }
  }

  const removeLanguage = (index: number) => {
    setProfileForm(prev => ({
      ...prev,
      languages: prev.languages.filter((_, i) => i !== index)
    }))
  }

  const addCitizenship = () => {
    if (newCitizenship.trim()) {
      setProfileForm(prev => ({
        ...prev,
        citizenships: [...prev.citizenships, newCitizenship.trim()]
      }))
      setNewCitizenship('')
    }
  }

  const removeCitizenship = (index: number) => {
    setProfileForm(prev => ({
      ...prev,
      citizenships: prev.citizenships.filter((_, i) => i !== index)
    }))
  }

  const handleEditProfileClick = () => {
    // Populate form with current profile data when starting to edit
    if (profile) {
      const languages = Array.isArray(profile.languages) ? profile.languages : []
      const citizenships = Array.isArray(profile.citizenships) ? profile.citizenships : []
      const fewerOpps = Array.isArray(profile.fewer_opportunities_categories) ? profile.fewer_opportunities_categories : []
      const targetGroups = Array.isArray(profile.participant_target_groups) ? profile.participant_target_groups : []
      
      setProfileForm({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        bio: profile.bio || '',
        location: profile.location || '',
        birth_date: profile.birth_date || '',
        website: profile.website || '',
        email: profile.email || '',
        gender: profile.gender || '',
        nationality: profile.nationality || '',
        citizenships: citizenships,
        residency_country: profile.residency_country || '',
        role_in_project: profile.role_in_project || '',
        has_fewer_opportunities: profile.has_fewer_opportunities || false,
        fewer_opportunities_categories: fewerOpps,
        languages: languages,
        participant_target_groups: targetGroups
      })
    }
    setIsEditingProfile(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <h2 className="text-2xl font-bold text-gray-900">Setting up your dashboard…</h2>
          <p className="text-gray-600">We’re finishing your profile. This may take a moment.</p>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    )
  }

  const profileCompletion = calculateProfileCompletion(profile, profile.user_type)

  const renderProfileField = (
    label: string,
    value?: string | string[] | null,
    icon?: React.ReactNode
  ) => {
    if (!value || (Array.isArray(value) && value.length === 0)) return null
    return (
      <div className="flex items-start gap-3">
        {icon && <div className="mt-1 text-gray-400">{icon}</div>}
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
          {Array.isArray(value) ? (
            <div className="flex flex-wrap gap-2 mt-2">
              {value.map((item, idx) => (
                <span key={`${label}-${idx}`} className="bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-xs">
                  {item}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-900 mt-1">{value}</p>
          )}
        </div>
      </div>
    )
  }

  const getDisplayName = () => {
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
      if (user.email) {
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
    if (user.email) {
      const emailName = user.email.split('@')[0]
      // Capitalize first letter and replace dots/underscores with spaces
      return emailName.replace(/[._]/g, ' ').split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ')
    }
    
    // Final fallback
    return 'User'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {getDisplayName()}!
              </h1>
              <p className="text-gray-600 mt-2">
                {profile.user_type === 'participant' 
                  ? 'Discover and apply to amazing events'
                  : 'Manage your events and applications'
                }
              </p>
            </div>
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="flex items-center text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md hover:bg-gray-100"
            >
              {signingOut ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2" />
                  Signing out...
                </>
              ) : (
                <>
                  <LogOut className="h-5 w-5 mr-2" />
                  Sign Out
                </>
              )}
            </button>
          </div>
        </div>

        {/* Stats Overview - Only for participants */}
        {profile.user_type === 'participant' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center">
                <div className="bg-blue-100 p-3 rounded-full">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Applications</p>
                  <p className="text-2xl font-bold text-gray-900">{applicationStats.total}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center">
                <div className="bg-yellow-100 p-3 rounded-full">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">{applicationStats.pending}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center">
                <div className="bg-green-100 p-3 rounded-full">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Accepted</p>
                  <p className="text-2xl font-bold text-gray-900">{applicationStats.accepted}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center">
                <div className="bg-red-100 p-3 rounded-full">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Rejected</p>
                  <p className="text-2xl font-bold text-gray-900">{applicationStats.rejected}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Profile Editing Section */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                    profileCompletion.percent === 100 ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'
                  }`}
                >
                  {profileCompletion.percent === 100 && <CheckCircle className="h-3 w-3" />}
                  {profileCompletion.percent}% complete
                </span>
              </div>
              {profileCompletion.percent < 100 && (
                <p className="text-xs text-gray-500 mt-1">
                  Missing: {profileCompletion.missing.join(', ')}
                </p>
              )}
            </div>
            <button
              onClick={isEditingProfile ? () => setIsEditingProfile(false) : handleEditProfileClick}
              className="flex items-center text-blue-600 hover:text-blue-700 px-3 py-2 rounded-md hover:bg-blue-50"
            >
              <Edit className="h-4 w-4 mr-2" />
              {isEditingProfile ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>

          {isEditingProfile ? (
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={profileForm.first_name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={profileForm.last_name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Birth Date
                  </label>
                  <input
                    type="date"
                    name="birth_date"
                    value={profileForm.birth_date}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={profileForm.location}
                    onChange={handleInputChange}
                    placeholder="City, Country"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bio
                </label>
                <textarea
                  name="bio"
                  value={profileForm.bio}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Tell us about yourself..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Website
                </label>
                  <input
                    type="text"
                    name="website"
                    value={profileForm.website}
                    onChange={handleInputChange}
                    placeholder="your-website.com or https://your-website.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
              </div>

              {/* Participant-specific fields */}
              {profile?.user_type === 'participant' && (
                <>
                  <div className="border-t pt-6 mt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
                    
                    {/* Email */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <Mail className="h-4 w-4 inline mr-1" />
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={profileForm.email}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="your.email@example.com"
                      />
                    </div>

                    {/* Gender */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Gender
                      </label>
                      <select
                        name="gender"
                        value={profileForm.gender}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select gender</option>
                        {genderOptions.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>

                    {/* Nationality and Residency */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          <Flag className="h-4 w-4 inline mr-1" />
                          Nationality
                        </label>
                        <select
                          name="nationality"
                          value={profileForm.nationality}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select nationality</option>
                          {countries.map(country => (
                            <option key={country} value={country}>{country}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          <MapPin className="h-4 w-4 inline mr-1" />
                          Residency Country
                        </label>
                        <select
                          name="residency_country"
                          value={profileForm.residency_country}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select country</option>
                          {countries.map(country => (
                            <option key={country} value={country}>{country}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Citizenships */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Citizenships
                      </label>
                      <div className="flex gap-2 mb-2">
                        <select
                          value={newCitizenship}
                          onChange={(e) => setNewCitizenship(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select citizenship to add</option>
                          {countries.filter(c => !profileForm.citizenships.includes(c)).map(country => (
                            <option key={country} value={country}>{country}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={addCitizenship}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                        >
                          Add
                        </button>
                      </div>
                      {profileForm.citizenships.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {profileForm.citizenships.map((citizenship, idx) => (
                            <span key={idx} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                              {citizenship}
                              <button
                                type="button"
                                onClick={() => removeCitizenship(idx)}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Role in Project */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <Briefcase className="h-4 w-4 inline mr-1" />
                        Role in Project
                      </label>
                      <select
                        name="role_in_project"
                        value={profileForm.role_in_project}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select role</option>
                        {roleOptions.map(role => (
                          <option key={role} value={role}>{role}</option>
                        ))}
                      </select>
                    </div>

                    {/* Languages */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <Languages className="h-4 w-4 inline mr-1" />
                        Languages
                      </label>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={newLanguage.language}
                          onChange={(e) => setNewLanguage(prev => ({ ...prev, language: e.target.value }))}
                          placeholder="Language"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <select
                          value={newLanguage.level}
                          onChange={(e) => setNewLanguage(prev => ({ ...prev, level: e.target.value }))}
                          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Level</option>
                          {languageLevels.map(level => (
                            <option key={level} value={level}>{level}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={addLanguage}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                        >
                          Add
                        </button>
                      </div>
                      {profileForm.languages.length > 0 && (
                        <div className="space-y-2">
                          {profileForm.languages.map((lang, idx) => (
                            <div key={idx} className="bg-blue-50 px-3 py-2 rounded-md flex items-center justify-between">
                              <span className="text-sm text-gray-700">
                                {lang.language} - {lang.level}
                              </span>
                              <button
                                type="button"
                                onClick={() => removeLanguage(idx)}
                                className="text-red-600 hover:text-red-800"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Participant with Fewer Opportunities */}
                    <div className="mb-4">
                      <label className="flex items-center space-x-3 cursor-pointer mb-2">
                        <input
                          type="checkbox"
                          name="has_fewer_opportunities"
                          checked={profileForm.has_fewer_opportunities}
                          onChange={handleInputChange}
                          className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">Participant with fewer opportunities</span>
                      </label>
                      
                      {profileForm.has_fewer_opportunities && (
                        <div className="ml-8 mt-3 p-4 bg-gray-50 rounded-lg">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Fewer Opportunities Categories (Select all that apply)
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            {fewerOpportunitiesOptions.map(option => (
                              <label key={option} className="flex items-center space-x-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  name={`fewer_opp_${option}`}
                                  checked={profileForm.fewer_opportunities_categories.includes(option)}
                                  onChange={handleInputChange}
                                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700">{option}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Target Groups */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Target Group for Participant (Select all that apply)
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-4 border border-gray-300 rounded-lg">
                        {targetGroupOptions.map(group => (
                          <label key={group} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              name={`target_group_${group}`}
                              checked={profileForm.participant_target_groups.includes(group)}
                              onChange={handleInputChange}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">{group}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {profileUpdateMessage && (
                <div className={`p-3 rounded-md ${
                  profileUpdateMessage.includes('successfully') 
                    ? 'bg-green-50 text-green-700 border border-green-200' 
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {profileUpdateMessage}
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={profileUpdateLoading}
                  className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50"
                >
                  {profileUpdateLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderProfileField(
                  'Full Name',
                  `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
                  <User className="h-4 w-4" />
                )}
                {renderProfileField(
                  'Email',
                  profile.email || user.email,
                  <Mail className="h-4 w-4" />
                )}
                {renderProfileField(
                  'Birth Date',
                  profile.birth_date
                    ? `${profile.birth_date} (${calculateAge(profile.birth_date)} years old)`
                    : null,
                  <Calendar className="h-4 w-4" />
                )}
                {renderProfileField('Gender', profile.gender, <User className="h-4 w-4" />)}
                {renderProfileField('Location', profile.location, <MapPin className="h-4 w-4" />)}
                {renderProfileField('Website', profile.website, <Award className="h-4 w-4" />)}
                {renderProfileField('Bio', profile.bio, <FileText className="h-4 w-4" />)}
              </div>

              {profile.user_type === 'participant' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {renderProfileField('Nationality', profile.nationality, <Flag className="h-4 w-4" />)}
                  {renderProfileField('Residency Country', profile.residency_country, <MapPin className="h-4 w-4" />)}
                  {renderProfileField(
                    'Citizenships',
                    Array.isArray(profile.citizenships) ? profile.citizenships : [],
                    <Flag className="h-4 w-4" />
                  )}
                  {renderProfileField('Role in Project', profile.role_in_project, <Briefcase className="h-4 w-4" />)}
                  {renderProfileField(
                    'Languages',
                    Array.isArray(profile.languages)
                      ? profile.languages.map((lang: any) => `${lang.language} - ${lang.level}`)
                      : [],
                    <Languages className="h-4 w-4" />
                  )}
                  {renderProfileField(
                    'Target Groups',
                    Array.isArray(profile.participant_target_groups) ? profile.participant_target_groups : [],
                    <Users className="h-4 w-4" />
                  )}
                  {profile.has_fewer_opportunities &&
                    renderProfileField(
                      'Fewer Opportunities Categories',
                      Array.isArray(profile.fewer_opportunities_categories)
                        ? profile.fewer_opportunities_categories
                        : [],
                      <AlertCircle className="h-4 w-4" />
                    )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Dashboard Content */}
        {profile.user_type === 'participant' ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

              {/* Recent Applications */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Applications</h3>
                <div className="space-y-4">
                  {applications.length === 0 ? (
                    <div className="text-center py-4">
                      <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">No applications yet</p>
                      <p className="text-gray-400 text-xs mt-1">Start by browsing events!</p>
                    </div>
                  ) : (
                    applications.slice(0, 3).map((application) => (
                      <div key={application.id} className="border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-gray-900 mb-1">
                              {application.events.title}
                            </h4>
                            <p className="text-xs text-gray-600 mb-1">
                              by {application.events.organization_name || 'Erasmus+ Connect'}
                            </p>
                            <p className="text-xs text-gray-500">
                              Applied {new Date(application.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center space-x-1">
                            {application.status === 'accepted' && <CheckCircle className="h-4 w-4 text-green-600" />}
                            {application.status === 'rejected' && <XCircle className="h-4 w-4 text-red-600" />}
                            {application.status === 'pending' && <Clock className="h-4 w-4 text-yellow-600" />}
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                              application.status === 'accepted' ? 'bg-green-100 text-green-800' :
                              application.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {application.status === 'pending' ? 'Under Review' : 
                               application.status === 'accepted' ? 'Accepted!' : 
                               'Not Selected'}
                            </span>
                          </div>
                        </div>
                        {application.status === 'accepted' && (
                          <div className="bg-green-50 border border-green-200 rounded p-2 mt-2">
                            <p className="text-xs text-green-800 font-medium">
                              🎉 Congratulations! You&apos;ve been accepted to this event.
                            </p>
                          </div>
                        )}
                        {application.status === 'rejected' && (
                          <div className="bg-gray-50 border border-gray-200 rounded p-2 mt-2">
                            <p className="text-xs text-gray-700">
                              Thank you for your interest. Keep applying to other events!
                            </p>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
                {applications.length > 3 && (
                  <Link
                    href="/my-applications"
                    className="mt-4 block text-center text-sm text-blue-600 hover:text-blue-800"
                  >
                    View all applications →
                  </Link>
                )}
              </div>

              {/* Profile Summary */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Profile</h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <User className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{getDisplayName()}</p>
                      <p className="text-xs text-gray-500">Participant</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {profile?.birth_date ? calculateAge(profile.birth_date) + ' years old' : 'Age not set'}
                      </p>
                      <p className="text-xs text-gray-500">Age</p>
                    </div>
                  </div>
                  
                  {profile.location && (
                    <div className="flex items-center">
                      <Award className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{profile.location}</p>
                        <p className="text-xs text-gray-500">Location</p>
                      </div>
                    </div>
                  )}
                  
                  {profile.bio && (
                    <div className="pt-3 border-t">
                      <p className="text-xs text-gray-500 mb-1">Bio</p>
                      <p className="text-sm text-gray-700 line-clamp-3">{profile.bio}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Organization Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <Calendar className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Events</p>
                    <p className="text-2xl font-bold text-gray-900">0</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center">
                  <div className="bg-green-100 p-3 rounded-full">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Events</p>
                    <p className="text-2xl font-bold text-gray-900">0</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center">
                  <div className="bg-purple-100 p-3 rounded-full">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Applications</p>
                    <p className="text-2xl font-bold text-gray-900">0</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center">
                  <div className="bg-orange-100 p-3 rounded-full">
                    <CheckCircle className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Accepted Participants</p>
                    <p className="text-2xl font-bold text-gray-900">0</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Link
                    href="/events/create"
                    className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Create Event
                  </Link>
                  <Link
                    href="/applications"
                    className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    <Users className="h-5 w-5 mr-2" />
                    View Applications
                  </Link>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 text-sm">No recent activity</p>
                    <p className="text-gray-400 text-xs mt-2">Create your first event to get started!</p>
                </div>
              </div>

              {/* Organization Profile */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Organization Profile</h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Award className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{getDisplayName()}</p>
                      <p className="text-xs text-gray-500">Verified Organization</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <User className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{user.email}</p>
                      <p className="text-xs text-gray-500">Contact Email</p>
                    </div>
                  </div>
                  
                  {profile.location && (
                    <div className="flex items-center">
                      <Award className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{profile.location}</p>
                        <p className="text-xs text-gray-500">Location</p>
                      </div>
                    </div>
                  )}
                  
                  {profile.bio && (
                    <div className="pt-3 border-t">
                      <p className="text-xs text-gray-500 mb-1">About</p>
                      <p className="text-sm text-gray-700 line-clamp-3">{profile.bio}</p>
                    </div>
                  )}
                  
                  <Link
                    href="/profile"
                    className="mt-4 w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    <Settings className="h-5 w-5 mr-2" />
                    Edit Profile
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
