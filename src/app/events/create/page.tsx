'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { 
  Calendar, 
  MapPin, 
  Users, 
  FileText, 
  Save, 
  ArrowLeft,
  Clock,
  Building,
  Globe,
  AlertCircle,
  CheckCircle
} from 'lucide-react'

interface User {
  id: string
  email?: string
}

interface Profile {
  user_type: 'participant' | 'organization'
  organization_name?: string
}

export default function CreateEventPage() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null)
  const router = useRouter()

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    location: '',
    max_participants: 50,
    category: 'Technology'
  })

  const categories = [
    'Technology',
    'Arts & Culture',
    'Social Impact',
    'Education',
    'Sports & Recreation',
    'Business & Entrepreneurship',
    'Environment',
    'Health & Wellness',
    'Science & Research',
    'Other'
  ]

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
        
        // Fetch user profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('user_type, organization_name')
          .eq('id', session.user.id)
          .single()

        if (profileError) {
          console.error('Profile error:', profileError)
          router.push('/auth')
          return
        }

        if (profileData.user_type !== 'organization') {
          router.push('/dashboard')
          return
        }

        setProfile(profileData)
      } catch (error) {
        console.error('Session setup error:', error)
        router.push('/auth')
      } finally {
        setLoading(false)
      }
    }

    getSession()
  }, [router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'max_participants' ? parseInt(value) || 1 : value
    }))
  }

  const validateForm = () => {
    const errors = []

    if (!formData.title.trim()) {
      errors.push('Event title is required')
    }

    if (!formData.description.trim()) {
      errors.push('Event description is required')
    }

    if (formData.description.trim().length < 20) {
      errors.push('Event description must be at least 20 characters long')
    }

    if (!formData.start_date) {
      errors.push('Start date is required')
    }

    if (!formData.end_date) {
      errors.push('End date is required')
    }

    if (formData.start_date && formData.end_date) {
      const startDate = new Date(formData.start_date)
      const endDate = new Date(formData.end_date)
      
      if (startDate >= endDate) {
        errors.push('End date must be after start date')
      }

      if (startDate < new Date()) {
        errors.push('Start date must be in the future')
      }
    }

    if (!formData.location.trim()) {
      errors.push('Location is required')
    }

    if (formData.max_participants < 1) {
      errors.push('Maximum participants must be at least 1')
    }

    if (formData.max_participants > 1000) {
      errors.push('Maximum participants cannot exceed 1000')
    }

    return errors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !profile) return

    const validationErrors = validateForm()
    if (validationErrors.length > 0) {
      setError(validationErrors.join('. ') + '.')
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')

    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Request timed out. Please try again.'))
      }, 30000) // 30 second timeout
      setTimeoutId(timeout)
    })

    try {
      const eventData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        start_date: formData.start_date,
        end_date: formData.end_date,
        location: formData.location.trim(),
        max_participants: formData.max_participants,
        category: formData.category,
        organization_id: user.id,
        organization_name: profile.organization_name || 'Unknown Organization',
        organization_website: (profile as any).website || null,
        is_published: true
      }

      console.log('Creating event with data:', eventData)
      console.log('User ID:', user.id)
      console.log('User email:', user.email)
      console.log('Profile:', profile)

      // Race between the actual request and timeout
      const insertPromise = supabase
        .from('events')
        .insert(eventData)
        .select()
        .single()

      const { data, error: insertError } = await Promise.race([
        insertPromise,
        timeoutPromise
      ]) as any

      if (insertError) {
        console.error('Insert error details:', insertError)
        throw insertError
      }

      console.log('Event created successfully:', data)
      setSuccess('Event created successfully!')
      
      // Clear form
      setFormData({
        title: '',
        description: '',
        start_date: '',
        end_date: '',
        location: '',
        max_participants: 50,
        category: 'Technology'
      })

      // Redirect to event details after 2 seconds
      setTimeout(() => {
        router.push(`/events/${data.id}`)
      }, 2000)

    } catch (error: any) {
      console.error('Event creation error:', error)
      
      // Provide more specific error messages
      if (error?.message?.includes('timed out')) {
        setError('Request timed out. Please check your connection and try again.')
      } else if (error?.code === 'PGRST301') {
        setError('You do not have permission to create events. Please ensure you are logged in as an organization.')
      } else if (error?.code === '23505') {
        setError('An event with this title already exists. Please choose a different title.')
      } else if (error?.code === '23514') {
        setError('Invalid data provided. Please check all fields and try again.')
      } else if (error?.message?.includes('403')) {
        setError('Access denied. Please ensure you are logged in as an organization and try again.')
      } else if (error?.message?.includes('Failed to fetch')) {
        setError('Network error. Please check your internet connection and try again.')
      } else {
        setError(`Failed to create event: ${error?.message || 'Unknown error'}`)
      }
    } finally {
      setSaving(false)
      if (timeoutId) {
        clearTimeout(timeoutId)
        setTimeoutId(null)
      }
    }
  }

  const handleCancel = () => {
    setSaving(false)
    setError('')
    if (timeoutId) {
      clearTimeout(timeoutId)
      setTimeoutId(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">Only organizations can create events.</p>
          <Link 
            href="/auth" 
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-6">
            <Link 
              href="/dashboard/organization" 
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors mr-4"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Dashboard
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Create New Event</h1>
          <p className="text-gray-600 mt-2">Create a new opportunity for participants to join</p>
        </div>

        {/* Event Form */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Event Information</h2>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Event Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Event Title *
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter event title"
                  required
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            {/* Event Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Event Description *
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 text-gray-400 h-5 w-5" />
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={6}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Describe your event in detail. What will participants learn or do? What are the requirements? (Minimum 20 characters)"
                  required
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {formData.description.length} characters (minimum 20)
              </p>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date & Time *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="datetime-local"
                    id="start_date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-2">
                  End Date & Time *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="datetime-local"
                    id="end_date"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Location and Max Participants */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                  Location *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Venue, City, Country"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="max_participants" className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Participants *
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="number"
                    id="max_participants"
                    name="max_participants"
                    value={formData.max_participants}
                    onChange={handleInputChange}
                    min="1"
                    max="1000"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Error and Success Messages */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  <p className="text-green-700 text-sm">{success}</p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              {saving ? (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-6 py-3 border border-red-300 rounded-lg font-medium text-red-700 hover:bg-red-50 transition-colors"
                >
                  Cancel
                </button>
              ) : (
                <Link
                  href="/dashboard/organization"
                  className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </Link>
              )}
              <button
                type="submit"
                disabled={saving}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating Event...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Create Event
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Event Preview */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Event Preview</h3>
            <p className="text-sm text-gray-600">How your event will appear to participants</p>
          </div>
          <div className="p-6">
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="text-xl font-semibold text-gray-900 mb-2">
                {formData.title || 'Event Title'}
              </h4>
              <p className="text-gray-600 text-sm mb-4">
                by <span className="font-medium">{profile.organization_name || 'Your Organization'}</span>
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                {formData.start_date && (
                  <div className="flex items-center text-gray-700">
                    <Calendar className="h-4 w-4 text-blue-600 mr-2" />
                    <span className="text-sm">
                      {new Date(formData.start_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                )}
                {formData.location && (
                  <div className="flex items-center text-gray-700">
                    <MapPin className="h-4 w-4 text-blue-600 mr-2" />
                    <span className="text-sm">{formData.location}</span>
                  </div>
                )}
                {formData.max_participants && (
                  <div className="flex items-center text-gray-700">
                    <Users className="h-4 w-4 text-blue-600 mr-2" />
                    <span className="text-sm">Max {formData.max_participants} participants</span>
                  </div>
                )}
                <div className="flex items-center text-gray-700">
                  <Clock className="h-4 w-4 text-blue-600 mr-2" />
                  <span className="text-sm">Category: {formData.category}</span>
                </div>
              </div>
              
              {formData.description && (
                <p className="text-gray-600 text-sm line-clamp-3">{formData.description}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}