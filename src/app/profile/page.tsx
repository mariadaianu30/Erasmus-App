'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { calculateAge } from '@/lib/utils'
import { User, Save, ArrowLeft, Mail, MapPin, Calendar, Building, FileText, Languages, Flag, Briefcase, AlertCircle, CheckCircle } from 'lucide-react'
import { countries } from '@/lib/countries'
import Link from 'next/link'

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

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()

  // Form state
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    organization_name: '',
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

  useEffect(() => {
    const getSession = async () => {
      try {
        // Add a small delay to ensure Supabase is fully initialized
        await new Promise(resolve => setTimeout(resolve, 100))
        
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          setError('Session error. Please log in again.')
          setLoading(false)
          return
        }
        
        if (!session?.user) {
          router.push('/auth')
          return
        }

        setUser(session.user)
        await fetchProfile(session.user.id)
      } catch (error: any) {
        setError(`Error loading page: ${error?.message || 'Unknown error'}`)
        setLoading(false)
      }
    }

    getSession()
  }, [router])

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        setError(`Failed to load profile: ${error.message}`)
        setLoading(false)
        return
      }

      if (!data) {
        setError('Profile not found. Please contact support.')
        setLoading(false)
        return
      }

      setProfile(data)
      setLoading(false)
      
      // Parse JSONB fields
      const languages = Array.isArray(data.languages) ? data.languages : []
      const citizenships = Array.isArray(data.citizenships) ? data.citizenships : []
      const fewerOpps = Array.isArray(data.fewer_opportunities_categories) ? data.fewer_opportunities_categories : []
      const targetGroups = Array.isArray(data.participant_target_groups) ? data.participant_target_groups : []
      
      // Set form data based on user type
      if (data.user_type === 'organization') {
        setFormData({
          first_name: '',
          last_name: '',
          organization_name: data.organization_name || '',
          bio: data.bio || '',
          location: data.location || '',
          birth_date: '',
          website: data.website || '',
          email: '',
          gender: '',
          nationality: '',
          citizenships: [],
          residency_country: '',
          role_in_project: '',
          has_fewer_opportunities: false,
          fewer_opportunities_categories: [],
          languages: [],
          participant_target_groups: []
        })
      } else {
        setFormData({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          organization_name: '',
          bio: data.bio || '',
          location: data.location || '',
          birth_date: data.birth_date || '',
          website: data.website || '',
          email: data.email || '',
          gender: data.gender || '',
          nationality: data.nationality || '',
          citizenships: citizenships,
          residency_country: data.residency_country || '',
          role_in_project: data.role_in_project || '',
          has_fewer_opportunities: data.has_fewer_opportunities || false,
          fewer_opportunities_categories: fewerOpps,
          languages: languages,
          participant_target_groups: targetGroups
        })
      }
    } catch (error: any) {
      setError(`Failed to load profile: ${error?.message || 'Unknown error'}`)
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    // Add timeout to prevent hanging
    const timeoutId = setTimeout(() => {
      setSaving(false)
      setError('Update timed out. Please try again.')
    }, 10000) // 10 second timeout

    try {
      if (!user || !profile) {
        throw new Error('User or profile not found')
      }

      const updateData: any = {
        updated_at: new Date().toISOString()
      }

      // Update fields based on user type
      if (profile.user_type === 'participant') {
        updateData.first_name = formData.first_name.trim()
        updateData.last_name = formData.last_name.trim()
        updateData.birth_date = formData.birth_date || null
        updateData.bio = formData.bio.trim()
        updateData.location = formData.location.trim()
        updateData.email = formData.email.trim() || null
        updateData.gender = formData.gender || null
        updateData.nationality = formData.nationality.trim() || null
        updateData.citizenships = formData.citizenships.length > 0 ? formData.citizenships : null
        updateData.residency_country = formData.residency_country.trim() || null
        updateData.role_in_project = formData.role_in_project || null
        updateData.has_fewer_opportunities = formData.has_fewer_opportunities
        updateData.fewer_opportunities_categories = formData.fewer_opportunities_categories.length > 0 ? formData.fewer_opportunities_categories : null
        updateData.languages = formData.languages.length > 0 ? formData.languages : null
        updateData.participant_target_groups = formData.participant_target_groups.length > 0 ? formData.participant_target_groups : null
      } else {
        updateData.organization_name = formData.organization_name.trim()
        updateData.bio = formData.bio.trim()
        updateData.location = formData.location.trim()
        updateData.website = formData.website.trim() || null
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id)

      if (error) {
        throw error
      }

      setSuccess('Profile updated successfully!')
      
      // Redirect to dashboard after successful save
      setTimeout(() => {
        if (profile.user_type === 'organization') {
          router.push('/dashboard/organization')
        } else {
          router.push('/dashboard')
        }
      }, 1000)
    } catch (error) {
      setError('Failed to update profile. Please try again.')
    } finally {
      clearTimeout(timeoutId)
      setSaving(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    
    setFormData(prev => {
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
      setFormData(prev => ({
        ...prev,
        languages: [...prev.languages, { language: newLanguage.language, level: newLanguage.level }]
      }))
      setNewLanguage({ language: '', level: '' })
    }
  }

  const removeLanguage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.filter((_, i) => i !== index)
    }))
  }

  const addCitizenship = () => {
    if (newCitizenship.trim()) {
      setFormData(prev => ({
        ...prev,
        citizenships: [...prev.citizenships, newCitizenship.trim()]
      }))
      setNewCitizenship('')
    }
  }

  const removeCitizenship = (index: number) => {
    setFormData(prev => ({
      ...prev,
      citizenships: prev.citizenships.filter((_, i) => i !== index)
    }))
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
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-4">You need to be logged in to edit your profile.</p>
          <button
            onClick={() => router.push('/auth')}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  // If profile is not loaded yet, show loading or allow creating profile
  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Profile Not Found</h2>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
                {error}
              </div>
            )}
            <p className="text-gray-600 mb-4">
              Your profile could not be loaded. This might be a temporary issue.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setLoading(true)
                  if (user) {
                    fetchProfile(user.id)
                  }
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Retry Loading Profile
              </button>
              <Link
                href={user ? '/dashboard/organization' : '/dashboard'}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link
                href={profile?.user_type === 'organization' ? '/dashboard/organization' : '/dashboard'}
                className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Dashboard
              </Link>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Profile</h1>
              <p className="text-gray-600 mt-2">
                {profile.user_type === 'participant' 
                  ? 'Update your personal information'
                  : 'Update your organization information'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <div className="bg-white rounded-lg shadow-sm border">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Success/Error Messages */}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
                {success}
              </div>
            )}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                {error}
              </div>
            )}

            {/* User Type Display */}
            <div className="flex items-center p-4 bg-blue-50 rounded-lg">
              <User className="h-5 w-5 text-blue-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-blue-900">
                  {profile.user_type === 'participant' ? 'Participant Account' : 'Organization Account'}
                </p>
                <p className="text-xs text-blue-700">
                  {profile.user_type === 'participant' 
                    ? 'You can participate in events and apply to experiences'
                    : 'You can create and manage events'
                  }
                </p>
              </div>
            </div>

            {/* Email (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="h-4 w-4 inline mr-2" />
                Email Address
              </label>
              <input
                type="email"
                value={user.email || ''}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
              />
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
            </div>

            {/* Participant Fields */}
            {profile.user_type === 'participant' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="h-4 w-4 inline mr-2" />
                      Birth Date
                    </label>
                    <input
                      type="date"
                      name="birth_date"
                      value={formData.birth_date}
                      onChange={handleInputChange}
                      max={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {formData.birth_date && (
                      <p className="text-sm text-gray-500 mt-1">
                        Age: {calculateAge(formData.birth_date)} years old
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MapPin className="h-4 w-4 inline mr-2" />
                      Location
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      placeholder="e.g., Munich, Germany"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select gender</option>
                    {genderOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>

                {/* Nationality, Residency Country */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Flag className="h-4 w-4 inline mr-2" />
                      Nationality
                    </label>
                    <select
                      name="nationality"
                      value={formData.nationality}
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MapPin className="h-4 w-4 inline mr-2" />
                      Residency Country
                    </label>
                    <select
                      name="residency_country"
                      value={formData.residency_country}
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Citizenships
                  </label>
                  <div className="flex gap-2 mb-2">
                    <select
                      value={newCitizenship}
                      onChange={(e) => setNewCitizenship(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select citizenship to add</option>
                      {countries.filter(c => !formData.citizenships.includes(c)).map(country => (
                        <option key={country} value={country}>{country}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={addCitizenship}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Add
                    </button>
                  </div>
                  {formData.citizenships.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.citizenships.map((citizenship, idx) => (
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Briefcase className="h-4 w-4 inline mr-2" />
                    Role in Project
                  </label>
                  <select
                    name="role_in_project"
                    value={formData.role_in_project}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select role</option>
                    {roleOptions.map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>

                {/* Participant with Fewer Opportunities */}
                <div>
                  <label className="flex items-center space-x-3 cursor-pointer mb-3">
                    <input
                      type="checkbox"
                      name="has_fewer_opportunities"
                      checked={formData.has_fewer_opportunities}
                      onChange={handleInputChange}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Participant with fewer opportunities</span>
                  </label>
                  
                  {formData.has_fewer_opportunities && (
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
                              checked={formData.fewer_opportunities_categories.includes(option)}
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

                {/* Languages */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Languages className="h-4 w-4 inline mr-2" />
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
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Add
                    </button>
                  </div>
                  {formData.languages.length > 0 && (
                    <div className="space-y-2">
                      {formData.languages.map((lang, idx) => (
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

                {/* Target Groups */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Group for Participant (Select all that apply)
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-4 border border-gray-300 rounded-lg">
                    {targetGroupOptions.map(group => (
                      <label key={group} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          name={`target_group_${group}`}
                          checked={formData.participant_target_groups.includes(group)}
                          onChange={handleInputChange}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{group}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Organization Fields */}
            {profile.user_type === 'organization' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Building className="h-4 w-4 inline mr-2" />
                    Organization Name *
                  </label>
                  <input
                    type="text"
                    name="organization_name"
                    value={formData.organization_name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MapPin className="h-4 w-4 inline mr-2" />
                      Location
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      placeholder="e.g., Munich, Germany"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Website
                    </label>
                    <input
                      type="text"
                      name="website"
                      value={formData.website}
                      onChange={handleInputChange}
                      placeholder="your-website.com or https://your-website.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Bio (Common field) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="h-4 w-4 inline mr-2" />
                Bio
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                rows={4}
                placeholder={
                  profile.user_type === 'participant'
                    ? "Tell us about yourself, your interests, and what you're looking for..."
                    : "Tell us about your organization, mission, and the events you offer..."
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <Link
                href={profile?.user_type === 'organization' ? '/dashboard/organization' : '/dashboard'}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}