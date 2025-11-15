'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  ArrowLeft, 
  Globe, 
  User, 
  Mail,
  CheckCircle,
  XCircle,
  AlertCircle,
  Image,
  DollarSign,
  Languages,
  UtensilsCrossed,
  Car,
  Building2,
  Tag
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'

interface Event {
  id: string
  title: string
  description: string
  start_date: string
  end_date: string
  location: string
  max_participants: number
  category: string
  organization_id: string | null
  organization_name: string | null
  organization_website: string | null
  is_published: boolean
  // New Erasmus+ fields
  event_type?: string | null
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

interface Application {
  id: string
  status: 'pending' | 'accepted' | 'rejected'
  motivation_letter: string
  created_at: string
}

export default function EventDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [application, setApplication] = useState<Application | null>(null)
  const [showApplyForm, setShowApplyForm] = useState(false)
  const [motivationLetter, setMotivationLetter] = useState('')
  const [applying, setApplying] = useState(false)
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

  useEffect(() => {
    fetchEvent()
    checkUser()
  }, [params.id])

  // Auto-dismiss toast after 3 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const fetchEvent = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error) throw error
      setEvent(data)
    } catch (error) {
      console.error('Error fetching event:', error)
      router.push('/events')
    } finally {
      setLoading(false)
    }
  }

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)

    if (user) {
      // Fetch user profile to check user type
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', user.id)
        .single()

      setUserProfile(profile)

      // Only check applications for participants
      if (profile?.user_type === 'participant') {
        const { data: application } = await supabase
          .from('applications')
          .select('*')
          .eq('event_id', params.id)
          .eq('participant_id', user.id)
          .single()

        setApplication(application)
      }
    }
  }

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !event) return

    // Validate motivation letter
    if (motivationLetter.trim().length === 0) {
      setToast({ message: 'Please write a motivation letter.', type: 'error' })
      return
    }

    setApplying(true)
    
    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      const timeout =       setTimeout(() => {
        reject(new Error('Request timed out. Please try again.'))
      }, 15000) // 15 second timeout
      setTimeoutId(timeout)
    })

    try {
      console.log('Starting application submission...')
      console.log('Event ID:', event.id)
      console.log('User ID:', user.id)
      console.log('Motivation letter length:', motivationLetter.length)
      
      const insertPromise = supabase
        .from('applications')
        .insert({
          event_id: event.id,
          participant_id: user.id,
          motivation_letter: motivationLetter,
          status: 'pending'
        })

      console.log('Insert promise created, racing with timeout...')
      
      // Race between the actual request and timeout
      const { error } = await Promise.race([
        insertPromise,
        timeoutPromise
      ]) as any

      console.log('Promise race completed, error:', error)

      if (error) throw error

      // Refresh application status
      await checkUser()
      setShowApplyForm(false)
      setMotivationLetter('')
      
      // Show success message
      setToast({ message: 'Application submitted successfully! The organization will review your application.', type: 'success' })
    } catch (error: any) {
      console.error('Error applying:', error)
      
      // Provide more specific error messages
      if (error?.message?.includes('timed out')) {
        setToast({ message: 'Request timed out. Please check your connection and try again.', type: 'error' })
      } else if (error?.message?.includes('Failed to fetch')) {
        setToast({ message: 'Network error. Please check your internet connection and try again.', type: 'error' })
      } else if (error?.code === '23505') {
        setToast({ message: 'You have already applied to this event.', type: 'error' })
      } else if (error?.code === '23514') {
        setToast({ message: 'Invalid data provided. Please check your motivation letter and try again.', type: 'error' })
      } else {
        setToast({ message: `Failed to submit application: ${error?.message || 'Unknown error'}`, type: 'error' })
      }
    } finally {
      setApplying(false)
      if (timeoutId) {
        clearTimeout(timeoutId)
        setTimeoutId(null)
      }
    }
  }

  const handleCancelApply = () => {
    setApplying(false)
    setShowApplyForm(false)
    setMotivationLetter('')
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

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Event Not Found</h1>
          <Link href="/events" className="text-blue-600 hover:text-blue-700">
            ← Back to Events
          </Link>
        </div>
      </div>
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-600" />
      case 'pending':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div
            className={`flex items-center gap-3 px-6 py-4 rounded-lg shadow-lg max-w-md ${
              toast.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-800'
                : toast.type === 'error'
                ? 'bg-red-50 border border-red-200 text-red-800'
                : 'bg-blue-50 border border-blue-200 text-blue-800'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
            ) : toast.type === 'error' ? (
              <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
            )}
            <p className="text-sm font-medium flex-1">{toast.message}</p>
            <button
              onClick={() => setToast(null)}
              className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
              aria-label="Close notification"
            >
              <XCircle className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <Link 
          href="/events" 
          className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Events
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              {/* Event Header */}
              <div className="mb-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{event.title}</h1>
                    <div className="flex items-center text-blue-600 mb-4">
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                        {event.category}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Event Details - Restructured */}
                <div className="space-y-4 mb-6">
                  {/* 2. Event Type */}
                  {event.event_type && (
                    <div className="flex items-center text-gray-600">
                      <Tag className="h-5 w-5 mr-3 text-blue-600" />
                      <div>
                        <p className="font-medium">Event Type</p>
                        <p className="text-sm">{event.event_type}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* 3. Begin date - end date */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center text-gray-600">
                      <Calendar className="h-5 w-5 mr-3 text-blue-600" />
                      <div>
                        <p className="font-medium">Begin Date</p>
                        <p className="text-sm">{formatDate(event.start_date)}</p>
                      </div>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Clock className="h-5 w-5 mr-3 text-blue-600" />
                      <div>
                        <p className="font-medium">End Date</p>
                        <p className="text-sm">{formatDate(event.end_date)}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* 4. Venue place - city */}
                  {(event.venue_place || event.city) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {event.venue_place && (
                        <div className="flex items-center text-gray-600">
                          <MapPin className="h-5 w-5 mr-3 text-blue-600" />
                          <div>
                            <p className="font-medium">Venue Place</p>
                            <p className="text-sm">{event.venue_place}</p>
                          </div>
                        </div>
                      )}
                      {event.city && (
                        <div className="flex items-center text-gray-600">
                          <MapPin className="h-5 w-5 mr-3 text-blue-600" />
                          <div>
                            <p className="font-medium">City</p>
                            <p className="text-sm">{event.city}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* 5. Country */}
                  {event.country && (
                    <div className="flex items-center text-gray-600">
                      <Globe className="h-5 w-5 mr-3 text-blue-600" />
                      <div>
                        <p className="font-medium">Country</p>
                        <p className="text-sm">{event.country}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* 11. Group Size */}
                  {event.group_size && (
                    <div className="flex items-center text-gray-600">
                      <Users className="h-5 w-5 mr-3 text-blue-600" />
                      <div>
                        <p className="font-medium">Group Size</p>
                        <p className="text-sm">{event.group_size} participants</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Photo */}
                {event.photo_url && (
                  <div className="mb-6">
                    <img 
                      src={event.photo_url} 
                      alt={event.title}
                      className="w-full h-64 object-cover rounded-lg"
                    />
                  </div>
                )}

                {/* 9. Funded (Yes / No) */}
                {event.is_funded && (
                  <div className="mb-6">
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                      ✓ Funded
                    </span>
                  </div>
                )}

                {/* 6. Short Description */}
                {event.short_description && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Short Description</h3>
                    <p className="text-gray-700 leading-relaxed">
                      {event.short_description}
                    </p>
                  </div>
                )}

                {/* 7. Full Description */}
                {event.full_description && (
                  <div className="prose max-w-none mb-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">Full Description</h3>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                      {event.full_description}
                    </p>
                  </div>
                )}

                {/* Additional Event Details */}
                <div className="border-t pt-6 space-y-4">
                  {/* 10. Target Groups */}
                  {event.target_groups && Array.isArray(event.target_groups) && event.target_groups.length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                        <Users className="h-5 w-5 mr-2 text-blue-600" />
                        Target Groups
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {event.target_groups.map((group: string, idx: number) => (
                          <span key={idx} className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">
                            {group}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Group Size and Working Language */}
                  {(event.group_size || event.working_language) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {event.group_size && (
                        <div className="flex items-center text-gray-700">
                          <Users className="h-5 w-5 mr-3 text-blue-600" />
                          <div>
                            <p className="font-medium">Group Size</p>
                            <p className="text-sm">{event.group_size} participants</p>
                          </div>
                        </div>
                      )}
                      {event.working_language && (
                        <div className="flex items-center text-gray-700">
                          <Languages className="h-5 w-5 mr-3 text-blue-600" />
                          <div>
                            <p className="font-medium">Working Language</p>
                            <p className="text-sm">{event.working_language}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Participation Fee */}
                  {event.participation_fee !== null && event.participation_fee !== undefined && (
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                        <DollarSign className="h-5 w-5 mr-2 text-blue-600" />
                        Participation Fee
                      </h4>
                      <div className="space-y-2">
                        <p className="text-gray-700">
                          <span className="font-medium">Amount:</span> ${event.participation_fee.toFixed(2)}
                        </p>
                        {event.participation_fee_reason && (
                          <p className="text-gray-600 text-sm">
                            <span className="font-medium">Reason:</span> {event.participation_fee_reason}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Accommodation and Food */}
                  {event.accommodation_food_details && (
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                        <UtensilsCrossed className="h-5 w-5 mr-2 text-blue-600" />
                        Accommodation & Food
                      </h4>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                        {event.accommodation_food_details}
                      </p>
                    </div>
                  )}

                  {/* Transport */}
                  {event.transport_details && (
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                        <Car className="h-5 w-5 mr-2 text-blue-600" />
                        Transport
                      </h4>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                        {event.transport_details}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              {/* Organization Info */}
              <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Organized By</h3>
                <div className="flex items-start space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{event.organization_name}</h4>
                    {event.organization_website && (
                      <a 
                        href={event.organization_website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 mt-1"
                      >
                        <Globe className="h-4 w-4 mr-1" />
                        Visit Website
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Application Section */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                {!user ? (
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Apply to This Event</h3>
                    <p className="text-gray-600 mb-4">Sign in to apply for this opportunity</p>
                    <Link 
                      href="/auth" 
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors text-center block"
                    >
                      Sign In to Apply
                    </Link>
                  </div>
                ) : userProfile?.user_type === 'organization' ? (
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Organization View</h3>
                    <p className="text-gray-600 mb-4">
                      As an organization, you can view and manage your events from your dashboard.
                    </p>
                    <Link 
                      href="/dashboard/organization" 
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors text-center block"
                    >
                      Go to Dashboard
                    </Link>
                  </div>
                ) : application ? (
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Application Status</h3>
                    <div className="flex items-center justify-center mb-4">
                      {getStatusIcon(application.status)}
                      <span className={`ml-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(application.status)}`}>
                        {application.status === 'pending' ? 'Under Review' : 
                         application.status === 'accepted' ? 'Accepted!' : 
                         'Not Selected'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      Applied on {formatDate(application.created_at)}
                    </p>
                    {application.status === 'pending' && (
                      <p className="text-sm text-blue-600 mb-4">
                        Your application is being reviewed by the organization.
                      </p>
                    )}
                    {application.status === 'accepted' && (
                      <p className="text-sm text-green-600 mb-4">
                        🎉 Congratulations! You've been accepted to this event.
                      </p>
                    )}
                    {application.status === 'rejected' && (
                      <p className="text-sm text-gray-600 mb-4">
                        Thank you for your interest. Keep applying to other events!
                      </p>
                    )}
                    <Link 
                      href="/my-applications" 
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View All My Applications →
                    </Link>
                  </div>
                ) : showApplyForm ? (
                  <form onSubmit={handleApply} className="space-y-4">
                    <div className="text-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Apply to This Event</h3>
                      <p className="text-sm text-gray-600">
                        Write a motivation letter explaining why you want to participate
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Motivation Letter *
                      </label>
                      <textarea
                        value={motivationLetter}
                        onChange={(e) => setMotivationLetter(e.target.value)}
                        rows={6}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="I am very interested in this opportunity because..."
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Write a brief motivation letter explaining your interest
                      </p>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm text-blue-800">
                        💡 <strong>Tip:</strong> Mention your relevant experience, what you hope to learn, 
                        and how this opportunity aligns with your goals.
                      </p>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        type="submit"
                        disabled={applying || motivationLetter.trim().length === 0}
                        className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-h-[48px]"
                      >
                        {applying ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Submitting...
                          </>
                        ) : (
                          'Submit Application'
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelApply}
                        disabled={applying}
                        className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] sm:w-auto w-full"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Apply to This Event</h3>
                    <p className="text-gray-600 mb-4">
                      Ready to join this amazing opportunity?
                    </p>
                    <button
                      onClick={() => setShowApplyForm(true)}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                      Apply Now
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
