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
  CheckCircle,
  Image,
  DollarSign,
  Languages,
  UtensilsCrossed,
  Car
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

  // Form state - Restructured to match new event structure
  const [formData, setFormData] = useState({
    // 1. Title of event
    title: '',
    // 2. Event type
    event_type: '',
    // 3. Begin date - end date
    start_date: '',
    end_date: '',
    // 4. Venue place - city
    venue_place: '',
    city: '',
    // 5. Venue place - Country
    country: '',
    // 6. Short description
    short_description: '',
    // 7. Full description
    full_description: '',
    // 8. Photo extracted
    photo_url: '',
    // 9. Funded (Yes / No)
    is_funded: false,
    // 10. Target groups
    target_groups: [] as string[],
    // 11. Group Size
    group_size: 50,
    // 12. Working language
    working_language: '',
    // 13. Participation fee (20 $ - reason!!)
    participation_fee: '',
    participation_fee_reason: '',
    // 14. Details for accommodation and food
    accommodation_food_details: '',
    // 15. Transport details
    transport_details: ''
  })

  const eventTypes = [
    'Youth exchange',
    'Training Course',
    'Seminar',
    'Study visit',
    'Partnership - Building Activity',
    'Conference simpozion forum',
    'E-learning',
    'Other'
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
  
  // Countries list for venue country
  const countries = [
    'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaijan',
    'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi',
    'Cabo Verde', 'Cambodia', 'Cameroon', 'Canada', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo', 'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 'Czech Republic',
    'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic',
    'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia',
    'Fiji', 'Finland', 'France',
    'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana',
    'Haiti', 'Honduras', 'Hungary',
    'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy',
    'Jamaica', 'Japan', 'Jordan',
    'Kazakhstan', 'Kenya', 'Kiribati', 'Kosovo', 'Kuwait', 'Kyrgyzstan',
    'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg',
    'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar',
    'Namibia', 'Nauru', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea', 'North Macedonia', 'Norway',
    'Oman',
    'Pakistan', 'Palau', 'Palestine', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal',
    'Qatar',
    'Romania', 'Russia', 'Rwanda',
    'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 'Sao Tome and Principe', 'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa', 'South Korea', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria',
    'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Timor-Leste', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu',
    'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan',
    'Vanuatu', 'Vatican City', 'Venezuela', 'Vietnam',
    'Yemen',
    'Zambia', 'Zimbabwe'
  ].sort()

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
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    
    setFormData(prev => {
      if (type === 'checkbox') {
        return {
          ...prev,
          [name]: checked
        }
      }
      if (name === 'group_size') {
        return {
          ...prev,
          [name]: parseInt(value) || 1
        }
      }
      if (name === 'participation_fee') {
        // Keep as string in state to satisfy typing; convert on submit
        return {
          ...prev,
          [name]: value
        }
      }
      return {
        ...prev,
        [name]: value
      }
    })
  }


  const handleTargetGroupChange = (group: string) => {
    setFormData(prev => {
      const current = prev.target_groups
      const index = current.indexOf(group)
      if (index > -1) {
        return {
          ...prev,
          target_groups: current.filter(g => g !== group)
        }
      } else {
        return {
          ...prev,
          target_groups: [...current, group]
        }
      }
    })
  }

  const validateForm = () => {
    const errors = []

    // 1. Title of event
    if (!formData.title.trim()) {
      errors.push('Event title is required')
    }

    // 2. Event type
    if (!formData.event_type.trim()) {
      errors.push('Event type is required')
    }

    // 3. Begin date - end date
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
    }

    // 11. Group Size
    if (formData.group_size < 1) {
      errors.push('Group size must be at least 1')
    }

    if (formData.group_size > 1000) {
      errors.push('Group size cannot exceed 1000')
    }

    // 13. Participation fee reason (if fee is provided)
    if (formData.participation_fee && parseFloat(formData.participation_fee.toString()) > 0) {
      if (!formData.participation_fee_reason.trim()) {
        errors.push('Participation fee reason is required when a fee is set')
      }
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

    try {
      const eventData: any = {
        // Required fields
        title: formData.title.trim(),
        start_date: formData.start_date,
        end_date: formData.end_date,
        organization_id: user.id,
        organization_name: profile.organization_name || 'Unknown Organization',
        organization_website: (profile as any).website || null,
        is_published: true,
        // New structured fields
        event_type: formData.event_type || null,
        venue_place: formData.venue_place.trim() || null,
        city: formData.city.trim() || null,
        country: formData.country.trim() || null,
        short_description: formData.short_description.trim() || null,
        full_description: formData.full_description.trim() || null,
        photo_url: null, // Photo feature disabled for now
        is_funded: formData.is_funded,
        target_groups: formData.target_groups.length > 0 ? formData.target_groups : null,
        group_size: formData.group_size,
        working_language: formData.working_language.trim() || null,
        participation_fee: formData.participation_fee ? parseFloat(formData.participation_fee.toString()) : null,
        participation_fee_reason: formData.participation_fee_reason.trim() || null,
        accommodation_food_details: formData.accommodation_food_details.trim() || null,
        transport_details: formData.transport_details.trim() || null,
        // Legacy fields for backward compatibility (set from new fields)
        // Ensure description is never empty (required field)
        description: formData.full_description.trim() || formData.short_description.trim() || formData.title.trim() || 'Event description',
        location: [formData.venue_place, formData.city, formData.country].filter(Boolean).join(', ') || 'Location TBD',
        max_participants: formData.group_size || 50,
        category: formData.event_type || 'Other'
      }

      // Verify user is authenticated
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (!currentUser) {
        setError('You are not logged in. Please log in and try again.')
        setSaving(false)
        return
      }
      
      console.log('=== EVENT CREATION DEBUG ===')
      console.log('User ID:', currentUser.id)
      console.log('User email:', currentUser.email)
      console.log('Profile:', profile)
      console.log('Organization ID in eventData:', eventData.organization_id)
      console.log('Event data:', JSON.stringify(eventData, null, 2))
      console.log('===========================')

      // Direct insert with timeout protection
      console.log('Starting database insert...')
      const startTime = Date.now()
      
      let timeoutHandle: NodeJS.Timeout
      let insertResult
      
      try {
        // Create timeout promise (reduced to 15 seconds for faster feedback)
        const timeoutPromise = new Promise((_, reject) => {
          timeoutHandle = setTimeout(() => {
            reject(new Error('TIMEOUT: Request took longer than 15 seconds. Open Network tab (F12) and check the /rest/v1/events request status code.'))
          }, 15000)
        })
        
        // Create insert promise
        const insertPromise = supabase
          .from('events')
          .insert(eventData)
          .select()
        
        // Race them
        insertResult = await Promise.race([insertPromise, timeoutPromise]) as any
        
        clearTimeout(timeoutHandle!)
        const endTime = Date.now()
        console.log(`✅ Insert completed in ${endTime - startTime}ms`)
        console.log('Insert result:', insertResult)
      } catch (insertErr: any) {
        clearTimeout(timeoutHandle!)
        const endTime = Date.now()
        console.error(`❌ Insert failed after ${endTime - startTime}ms`)
        console.error('Error type:', typeof insertErr)
        console.error('Error:', insertErr)
        console.error('Error message:', insertErr?.message)
        console.error('Error code:', insertErr?.code)
        console.error('Error details:', insertErr?.details)
        console.error('Error hint:', insertErr?.hint)
        setSaving(false)
        throw insertErr
      }
      
      const { data, error: insertError } = insertResult

      if (insertError) {
        console.error('Insert error details:', insertError)
        console.error('Error code:', insertError.code)
        console.error('Error message:', insertError.message)
        console.error('Error details:', insertError.details)
        console.error('Error hint:', insertError.hint)
        setSaving(false)
        throw insertError
      }

      if (!data || data.length === 0) {
        console.error('No data returned from insert')
        console.error('Full result:', insertResult)
        setSaving(false)
        throw new Error('No data returned from database')
      }

      // Get the first (and should be only) item
      const createdEvent = data[0]

      console.log('Event created successfully:', createdEvent)
      setSuccess('Event created successfully!')
      
      // Clear form
      setFormData({
        title: '',
        event_type: '',
        start_date: '',
        end_date: '',
        venue_place: '',
        city: '',
        country: '',
        short_description: '',
        full_description: '',
        photo_url: '',
        is_funded: false,
        target_groups: [],
        group_size: 50,
        working_language: '',
        participation_fee: '',
        participation_fee_reason: '',
        accommodation_food_details: '',
        transport_details: ''
      })

      // Redirect to event details after 2 seconds
      setTimeout(() => {
        router.push(`/events/${createdEvent.id}`)
      }, 2000)

    } catch (error: any) {
      console.error('Event creation error:', error)
      console.error('Error type:', typeof error)
      console.error('Error constructor:', error?.constructor?.name)
      console.error('Error keys:', Object.keys(error || {}))
      console.error('Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2))
      
      // Check if it's a timeout error
      if (error?.message?.includes('timed out') || error?.message?.includes('timeout') || error?.message?.includes('TIMEOUT')) {
        setError('Request timed out after 20 seconds. Open browser DevTools (F12) → Network tab → Look for the /rest/v1/events request → Check its status code. If it shows 403, RLS is blocking. If it shows pending, the request is hanging. Run TEST_RLS.sql in Supabase to verify policies.')
      } else if (error?.code === 'PGRST301') {
        setError('You do not have permission to create events. Please ensure you are logged in as an organization and run FIX_RLS_POLICIES.sql in Supabase.')
      } else if (error?.code === '23505') {
        setError('An event with this title already exists. Please choose a different title.')
      } else if (error?.code === '23514') {
        setError(`Invalid data provided: ${error?.message || 'Please check all fields and try again.'}`)
      } else if (error?.code === '42501') {
        setError('Permission denied. Please run FIX_RLS_POLICIES.sql in Supabase SQL Editor to set up RLS policies.')
      } else if (error?.code === 'PGRST116') {
        setError('The request body must contain JSON. Please check your data and try again.')
      } else if (error?.message?.includes('403') || error?.status === 403) {
        setError('Access denied. Please ensure you are logged in as an organization and run FIX_RLS_POLICIES.sql in Supabase.')
      } else if (error?.message?.includes('Failed to fetch') || error?.message?.includes('NetworkError')) {
        setError('Network error. Please check your internet connection and try again.')
      } else if (error?.message) {
        setError(`Failed to create event: ${error.message}. If this persists, run FIX_RLS_POLICIES.sql in Supabase.`)
      } else {
        setError(`Failed to create event. This is likely an RLS policy issue. Please run FIX_RLS_POLICIES.sql in Supabase SQL Editor. Check the browser console for more details.`)
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
            {/* 1. Title of event */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Title of Event *
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

            {/* 2. Event type */}
            <div>
              <label htmlFor="event_type" className="block text-sm font-medium text-gray-700 mb-2">
                Event Type *
              </label>
              <select
                id="event_type"
                name="event_type"
                value={formData.event_type}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select event type</option>
                {eventTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* 3. Begin date - end date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-2">
                  Begin Date *
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
                  End Date *
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

            {/* 4. Venue place - city */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="venue_place" className="block text-sm font-medium text-gray-700 mb-2">
                  Venue Place
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    id="venue_place"
                    name="venue_place"
                    value={formData.venue_place}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Venue name"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                  City
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="City"
                  />
                </div>
              </div>
            </div>

            {/* 5. Venue place - Country */}
            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
                Country
              </label>
              <select
                id="country"
                name="country"
                value={formData.country}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select country</option>
                {countries.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>

            {/* 6. Short description */}
            <div>
              <label htmlFor="short_description" className="block text-sm font-medium text-gray-700 mb-2">
                Short Description
              </label>
              <textarea
                id="short_description"
                name="short_description"
                value={formData.short_description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Brief summary of the event (for listings)"
              />
            </div>

            {/* 7. Full description */}
            <div>
              <label htmlFor="full_description" className="block text-sm font-medium text-gray-700 mb-2">
                Full Description
              </label>
              <textarea
                id="full_description"
                name="full_description"
                value={formData.full_description}
                onChange={handleInputChange}
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Detailed description of the event, activities, learning outcomes, etc."
              />
            </div>

            {/* 8. Photo extracted - DISABLED FOR NOW */}
            {/* Photo feature temporarily disabled */}

            {/* 9. Funded (Yes / No) */}
            <div>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_funded"
                  checked={formData.is_funded}
                  onChange={handleInputChange}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Funded (Yes / No)</span>
              </label>
            </div>

            {/* 10. Target groups */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Groups (Select all that apply)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 border border-gray-300 rounded-lg">
                {targetGroupOptions.map(group => (
                  <label key={group} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.target_groups.includes(group)}
                      onChange={() => handleTargetGroupChange(group)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{group}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 11. Group Size */}
            <div>
              <label htmlFor="group_size" className="block text-sm font-medium text-gray-700 mb-2">
                Group Size *
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="number"
                  id="group_size"
                  name="group_size"
                  value={formData.group_size}
                  onChange={handleInputChange}
                  min="1"
                  max="1000"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* 12. Working language */}
            <div>
              <label htmlFor="working_language" className="block text-sm font-medium text-gray-700 mb-2">
                <Languages className="h-4 w-4 inline mr-2" />
                Working Language
              </label>
              <input
                type="text"
                id="working_language"
                name="working_language"
                value={formData.working_language}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., English, Spanish"
              />
            </div>

            {/* 13. Participation fee (20 $ - reason!!) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="participation_fee" className="block text-sm font-medium text-gray-700 mb-2">
                  <DollarSign className="h-4 w-4 inline mr-2" />
                  Participation Fee ($)
                </label>
                <input
                  type="number"
                  id="participation_fee"
                  name="participation_fee"
                  value={formData.participation_fee}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label htmlFor="participation_fee_reason" className="block text-sm font-medium text-gray-700 mb-2">
                  Participation Fee Reason *
                </label>
                <textarea
                  id="participation_fee_reason"
                  name="participation_fee_reason"
                  value={formData.participation_fee_reason}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Please explain why there is a participation fee"
                  required={formData.participation_fee && parseFloat(formData.participation_fee.toString()) > 0}
                />
              </div>
            </div>

            {/* 14. Details for accommodation and food */}
            <div>
              <label htmlFor="accommodation_food_details" className="block text-sm font-medium text-gray-700 mb-2">
                <UtensilsCrossed className="h-4 w-4 inline mr-2" />
                Details for Accommodation and Food
              </label>
              <textarea
                id="accommodation_food_details"
                name="accommodation_food_details"
                value={formData.accommodation_food_details}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Information about accommodation type, meals included, dietary options, etc."
              />
            </div>

            {/* 15. Transport details */}
            <div>
              <label htmlFor="transport_details" className="block text-sm font-medium text-gray-700 mb-2">
                <Car className="h-4 w-4 inline mr-2" />
                Transport Details
              </label>
              <textarea
                id="transport_details"
                name="transport_details"
                value={formData.transport_details}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Information about transportation, travel reimbursement, pick-up services, etc."
              />
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
                {formData.event_type && (
                  <div className="flex items-center text-gray-700">
                    <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
                      {formData.event_type}
                    </span>
                  </div>
                )}
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
                {formData.end_date && (
                  <div className="flex items-center text-gray-700">
                    <Clock className="h-4 w-4 text-blue-600 mr-2" />
                    <span className="text-sm">
                      Until {new Date(formData.end_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                )}
                {(formData.venue_place || formData.city || formData.country) && (
                  <div className="flex items-center text-gray-700">
                    <MapPin className="h-4 w-4 text-blue-600 mr-2" />
                    <span className="text-sm">
                      {[formData.venue_place, formData.city, formData.country].filter(Boolean).join(', ') || 'Location TBD'}
                    </span>
                  </div>
                )}
                {formData.group_size && (
                  <div className="flex items-center text-gray-700">
                    <Users className="h-4 w-4 text-blue-600 mr-2" />
                    <span className="text-sm">Group Size: {formData.group_size} participants</span>
                  </div>
                )}
                {formData.is_funded && (
                  <div className="flex items-center text-gray-700">
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                      ✓ Funded
                    </span>
                  </div>
                )}
              </div>
              
              {formData.photo_url && (
                <div className="mb-4">
                  <img
                    src={formData.photo_url}
                    alt="Event photo"
                    className="w-full h-48 object-cover rounded-lg"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                </div>
              )}
              
              {formData.short_description && (
                <p className="text-gray-600 text-sm mb-2 line-clamp-3">{formData.short_description}</p>
              )}
              {formData.full_description && (
                <p className="text-gray-600 text-sm line-clamp-3">{formData.full_description}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}