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
  AlertCircle
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

  useEffect(() => {
    fetchEvent()
    checkUser()
  }, [params.id])

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
      alert('Please write a motivation letter.')
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
      alert('Application submitted successfully! The organization will review your application.')
    } catch (error: any) {
      console.error('Error applying:', error)
      
      // Provide more specific error messages
      if (error?.message?.includes('timed out')) {
        alert('Request timed out. Please check your connection and try again.')
      } else if (error?.message?.includes('Failed to fetch')) {
        alert('Network error. Please check your internet connection and try again.')
      } else if (error?.code === '23505') {
        alert('You have already applied to this event.')
      } else if (error?.code === '23514') {
        alert('Invalid data provided. Please check your motivation letter and try again.')
      } else {
        alert(`Failed to submit application: ${error?.message || 'Unknown error'}`)
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

                {/* Event Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center text-gray-600">
                    <Calendar className="h-5 w-5 mr-3 text-blue-600" />
                    <div>
                      <p className="font-medium">Start Date</p>
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
                  <div className="flex items-center text-gray-600">
                    <MapPin className="h-5 w-5 mr-3 text-blue-600" />
                    <div>
                      <p className="font-medium">Location</p>
                      <p className="text-sm">{event.location}</p>
                    </div>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Users className="h-5 w-5 mr-3 text-blue-600" />
                    <div>
                      <p className="font-medium">Max Participants</p>
                      <p className="text-sm">{event.max_participants} people</p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="prose max-w-none">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">About This Event</h3>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {event.description}
                  </p>
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
                        Thank you for your interest. Keep applying to other opportunities!
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
