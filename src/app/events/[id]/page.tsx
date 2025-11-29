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
  CheckCircle,
  XCircle,
  AlertCircle,
  DollarSign,
  Languages,
  UtensilsCrossed,
  Car,
  Tag,
  Download,
  Edit,
  Trash2
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'
import { downloadCsvFile, participantToCsvRow, PARTICIPANT_CSV_HEADERS, ParticipantProfileForCsv } from '@/lib/csv'

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
  participant_id: string
  status: 'pending' | 'accepted' | 'rejected'
  motivation_letter: string
  created_at: string
}

type ParticipantProfile = ParticipantProfileForCsv

interface AcceptedParticipant {
  application: Application
  profile: ParticipantProfile | null
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
  const [acceptedParticipants, setAcceptedParticipants] = useState<AcceptedParticipant[]>([])
  const [participantsLoading, setParticipantsLoading] = useState(false)
  const [participantsError, setParticipantsError] = useState<string | null>(null)
  const [participantsLoaded, setParticipantsLoaded] = useState(false)
  const [showAcceptedModal, setShowAcceptedModal] = useState(false)
  const [exportingParticipants, setExportingParticipants] = useState(false)
  const [deletingEvent, setDeletingEvent] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

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

  // Ensure ownership is backfilled for organization users (must be before early returns)
  useEffect(() => {
    const ensureOwnership = async () => {
      // Only run if we have the necessary data
      if (!event || !user || loading) return
      
      const normalizeOrgName = (value?: string | null) =>
        value?.trim().toLowerCase().replace(/\s+/g, ' ') || null

      const eventOrgName = normalizeOrgName(event.organization_name)
      const userOrgName = normalizeOrgName(userProfile?.organization_name)
      const isOrganizationUser = userProfile?.user_type === 'organization'

      const canManageEvent = Boolean(
        isOrganizationUser &&
        (
          (event.organization_id && user.id === event.organization_id) ||
          (!event.organization_id && eventOrgName && userOrgName && eventOrgName === userOrgName)
        )
      )

      if (canManageEvent && !event.organization_id && user.id) {
        try {
          await supabase
            .from('events')
            .update({ organization_id: user.id, organization_name: event.organization_name || userProfile?.organization_name })
            .eq('id', event.id)
        } catch (error) {
          console.error('Failed to backfill organization_id:', error)
        }
      }
    }
    ensureOwnership()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event?.id, event?.organization_id, event?.organization_name, user?.id, userProfile?.user_type, userProfile?.organization_name, loading])

  const fetchEvent = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error) throw error
      
      if (!data) {
        router.push('/events')
        return
      }
      
      // Fetch organization name if organization_id exists
      if (data.organization_id) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('organization_name, website')
          .eq('id', data.organization_id)
          .single()
        
        // Handle profile fetch errors gracefully (profile might not exist)
        if (!profileError && profile) {
          data.organization_name = profile.organization_name || null
          data.organization_website = profile.website || null
        }
      }
      
      setEvent(data)
    } catch (error) {
      console.error('Error fetching event:', error)
      router.push('/events')
    } finally {
      setLoading(false)
    }
  }

  const checkUser = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError) {
        console.error('Error getting user:', userError)
        return
      }
      
      setUser(user)

      if (user) {
        // Fetch user profile to check user type
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('user_type, organization_name')
          .eq('id', user.id)
          .single()

        // Handle profile fetch errors gracefully (profile might not exist yet)
        if (!profileError && profile) {
          setUserProfile(profile)

          // Only check applications for participants
          if (profile.user_type === 'participant') {
            const { data: application, error: applicationError } = await supabase
              .from('applications')
              .select('*')
              .eq('event_id', params.id)
              .eq('participant_id', user.id)
              .single()

            // Handle application fetch errors gracefully (application might not exist)
            if (!applicationError && application) {
              setApplication(application)
            }
          }
        }
      }
    } catch (error) {
      console.error('Error checking user:', error)
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
      const insertPromise = supabase
        .from('applications')
        .insert({
          event_id: event.id,
          participant_id: user.id,
          motivation_letter: motivationLetter,
          status: 'pending'
        })

      // Race between the actual request and timeout
      const result = await Promise.race([
        insertPromise,
        timeoutPromise
      ]) as { error?: any; data?: any }

      if (result.error) throw result.error

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

  const normalizeOrgName = (value?: string | null) =>
    value?.trim().toLowerCase().replace(/\s+/g, ' ') || null

  const eventOrgName = normalizeOrgName(event.organization_name)
  const userOrgName = normalizeOrgName(userProfile?.organization_name)

  const isOrganizationUser = userProfile?.user_type === 'organization'

  const canManageEvent = Boolean(
    user &&
    isOrganizationUser &&
    (
      (event.organization_id && user.id === event.organization_id) ||
      (!event.organization_id && eventOrgName && userOrgName && eventOrgName === userOrgName)
    )
  )

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

  const fetchAcceptedParticipants = async (): Promise<AcceptedParticipant[] | null> => {
    setParticipantsLoading(true)
    setParticipantsError(null)
    setParticipantsLoaded(false)

    try {
      const { data: applicationsData, error } = await supabase
        .from('applications')
        .select('id, participant_id, motivation_letter, created_at, status')
        .eq('event_id', params.id)
        .eq('status', 'accepted')

      if (error) throw error

      if (!applicationsData || applicationsData.length === 0) {
        setAcceptedParticipants([])
        setParticipantsLoaded(true)
        return []
      }

      const participantIds = applicationsData
        .map((app) => app.participant_id)
        .filter((id): id is string => Boolean(id))

      let profilesMap = new Map<string, ParticipantProfile>()

      if (participantIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select(
            'id, first_name, last_name, email, location, gender, birth_date, nationality, residency_country, citizenships, languages, participant_target_groups, has_fewer_opportunities, fewer_opportunities_categories, role_in_project, bio, website'
          )
          .in('id', participantIds)

        if (profilesError) throw profilesError

        profilesMap = new Map((profilesData || []).map((profile) => [profile.id, profile]))
      }

      const combined = applicationsData.map((app) => ({
        application: app as Application,
        profile: profilesMap.get(app.participant_id) || null
      }))

      setAcceptedParticipants(combined)
      setParticipantsLoaded(true)
      return combined
    } catch (error) {
      console.error('Error fetching accepted participants:', error)
      setParticipantsError('Failed to load accepted participants.')
      return null
    } finally {
      setParticipantsLoading(false)
    }
  }

  const handleOpenAcceptedModal = async () => {
    if (!canManageEvent) {
      setToast({ message: 'Only the organizing account can view accepted participants.', type: 'error' })
      return
    }
    setParticipantsError(null)
    setShowAcceptedModal(true)
    if (!participantsLoaded && !participantsLoading) {
      await fetchAcceptedParticipants()
    }
  }

  const handleCloseAcceptedModal = () => {
    setShowAcceptedModal(false)
  }

  const handleExportParticipantsCsv = async () => {
    if (!event) return
    if (!canManageEvent) {
      setToast({ message: 'Only the organizing account can export participant data.', type: 'error' })
      return
    }
    setExportingParticipants(true)

    try {
      let data = acceptedParticipants
      if (!participantsLoaded) {
        const fetched = await fetchAcceptedParticipants()
        if (fetched === null) {
          setToast({ message: 'Failed to export CSV. Please try again.', type: 'error' })
          return
        }
        data = fetched
      }

      if (!data || data.length === 0) {
        setToast({ message: 'No accepted participants to export yet.', type: 'info' })
        return
      }

      const rows = data.map(({ application, profile }) =>
        participantToCsvRow(profile, {
          eventTitle: event.title,
          eventId: event.id,
          participantId: application.participant_id,
          applicationStatus: application.status,
          applicationDate: application.created_at,
          motivationLetter: application.motivation_letter,
          email: profile?.email
        })
      )

      const safeTitle = event.title?.replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'event'
      downloadCsvFile(
        `${safeTitle}-accepted-participants.csv`,
        PARTICIPANT_CSV_HEADERS,
        rows
      )
      setToast({ message: 'Participant CSV exported.', type: 'success' })
    } catch (error) {
      console.error('Error exporting participant CSV:', error)
      setToast({ message: 'Failed to export CSV. Please try again.', type: 'error' })
    } finally {
      setExportingParticipants(false)
    }
  }

  const handleDeleteEvent = () => {
    if (!event || deletingEvent) return
    if (!canManageEvent) {
      setToast({ message: 'Only the organizing account can delete this event.', type: 'error' })
      return
    }
    setShowDeleteConfirm(true)
  }

  const confirmDeleteEvent = async () => {
    if (!event || deletingEvent) return
    setShowDeleteConfirm(false)
    setDeletingEvent(true)
    try {
      let deleteQuery = supabase
        .from('events')
        .delete()
        .eq('id', event.id)

      if (event.organization_id) {
        deleteQuery = deleteQuery.eq('organization_id', event.organization_id)
      } else if (event.organization_name) {
        deleteQuery = deleteQuery.eq('organization_name', event.organization_name)
      }

      const { error } = await deleteQuery

      if (error) throw error

      setToast({ message: 'Event deleted successfully.', type: 'success' })
      setTimeout(() => {
        router.push('/events')
      }, 1200)
    } catch (error) {
      console.error('Error deleting event:', error)
      setToast({ message: 'Failed to delete event. Please try again.', type: 'error' })
      setDeletingEvent(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Event</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this event? This action cannot be undone and will remove the event for all participants.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteEvent}
                disabled={deletingEvent}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deletingEvent ? 'Deleting...' : 'Delete Event'}
              </button>
            </div>
          </div>
        </div>
      )}

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

        <div className="space-y-8">
          {/* Main Content */}
          <div>
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              {/* Event Photo - Hero Image */}
              {event.photo_url && (
                <div className="relative w-full h-[280px] sm:h-[360px] lg:h-[420px] overflow-hidden bg-gray-100">
                  <img 
                    src={event.photo_url} 
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <div className="p-6">
                {/* Event Header */}
                <div className="mb-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900 mb-2">{event.title}</h1>
                      {event.category && (
                        <div className="flex items-center text-blue-600 mb-4">
                          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                            {event.category}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {canManageEvent && (
                  <>
                    <div className="flex flex-wrap gap-3 mb-4">
                      <button
                        onClick={handleOpenAcceptedModal}
                        className="inline-flex items-center gap-2 border border-blue-200 text-blue-700 font-semibold px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors"
                      >
                        <Users className="h-4 w-4" />
                        List Accepted Participants
                      </button>
                      <button
                        onClick={handleExportParticipantsCsv}
                        disabled={exportingParticipants}
                        className="inline-flex items-center gap-2 bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {exportingParticipants ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                            Preparing CSV...
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4" />
                            Export Accepted as CSV
                          </>
                        )}
                      </button>
                      <Link
                        href={`/events/edit/${event.id}`}
                        prefetch={false}
                        className="inline-flex items-center gap-2 border border-gray-300 text-gray-700 font-semibold px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                        Edit Event
                      </Link>
                      <button
                        onClick={handleDeleteEvent}
                        disabled={deletingEvent}
                        className="inline-flex items-center gap-2 border border-red-300 text-red-700 font-semibold px-4 py-2 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {deletingEvent ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600" />
                            Deleting...
                          </>
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4" />
                            Delete Event
                          </>
                        )}
                      </button>
                    </div>
                  </>
                  )}
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
                    <p className="text-gray-700 leading-relaxed break-words">
                      {event.short_description}
                    </p>
                  </div>
                )}

                {/* 7. Full Description */}
                {event.full_description && (
                  <div className="prose max-w-none mb-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">Full Description</h3>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line break-words">
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
                          <span className="font-medium">Amount:</span> ${typeof event.participation_fee === 'number' ? event.participation_fee.toFixed(2) : '0.00'}
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

          {/* Organization Info */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
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
                  canManageEvent ? (
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Organization View</h3>
                      <p className="text-gray-600 mb-4">
                        Use the management buttons near the event title to list and export accepted participants.
                      </p>
                      <Link 
                        href="/dashboard/organization" 
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors text-center block"
                      >
                        Go to Dashboard
                      </Link>
                    </div>
                  ) : (
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Organization View</h3>
                      <p className="text-gray-600 mb-4">
                        You&apos;re viewing an event managed by {event.organization_name}. Only that organization can view accepted participants.
                      </p>
                      <Link 
                        href="/dashboard/organization" 
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors text-center block"
                      >
                        Go to Dashboard
                      </Link>
                    </div>
                  )
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
                        🎉 Congratulations! You&apos;ve been accepted to this event.
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
                  <form onSubmit={handleApply} className="space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Apply to This Event</h3>
                      <p className="text-sm text-gray-600">
                        Write a motivation letter explaining why you want to participate in this event
                      </p>
                    </div>
                    
                    <div>
                      <label htmlFor="motivation-letter" className="block text-sm font-medium text-gray-700 mb-2">
                        Motivation Letter *
                      </label>
                      <textarea
                        id="motivation-letter"
                        value={motivationLetter}
                        onChange={(e) => setMotivationLetter(e.target.value)}
                        rows={8}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y transition-colors"
                        placeholder="I am very interested in this opportunity because..."
                        required
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        Write a brief motivation letter explaining your interest and why you&apos;re a good fit for this event
                      </p>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-800">
                        💡 <strong>Tip:</strong> Mention your relevant experience, what you hope to learn, 
                        and how this opportunity aligns with your goals.
                      </p>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <button
                        type="submit"
                        disabled={applying || motivationLetter.trim().length === 0}
                        className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-h-[48px]"
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

      {showAcceptedModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center px-4 py-6">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={handleCloseAcceptedModal}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-gray-200 ring-1 ring-black/5">
            <div className="sticky top-0 bg-white/95 backdrop-blur-sm px-4 sm:px-6 py-3 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Accepted Participants</h3>
                <p className="text-sm text-gray-500">
                  {participantsLoading
                    ? 'Loading accepted participants...'
                    : `${acceptedParticipants.length} participant${acceptedParticipants.length === 1 ? '' : 's'} accepted`}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={fetchAcceptedParticipants}
                  disabled={participantsLoading}
                  className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Refresh
                </button>
                <button
                  onClick={handleCloseAcceptedModal}
                  className="text-gray-500 hover:text-gray-700"
                  aria-label="Close modal"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
              {participantsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
                </div>
              ) : participantsError ? (
                <div className="text-center py-12">
                  <p className="text-red-600 font-medium mb-2">{participantsError}</p>
                  <button
                    onClick={fetchAcceptedParticipants}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Try again
                  </button>
                </div>
              ) : acceptedParticipants.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No accepted participants yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {acceptedParticipants.map(({ application, profile }) => (
                    <div key={application.id} className="border border-gray-200 rounded-lg p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-lg font-semibold text-gray-900">
                            {(profile?.first_name || 'First name') + ' ' + (profile?.last_name || 'not provided')}
                          </p>
                          <p className="text-sm text-gray-500">
                            {profile?.email || 'Email not provided'}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            Applied on {formatDate(application.created_at)}
                          </p>
                        </div>
                        <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-1 rounded-full">
                          Accepted
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 text-sm text-gray-700">
                        {profile?.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-blue-500" />
                            <span>{profile.location}</span>
                          </div>
                        )}
                        {profile?.nationality && (
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4 text-blue-500" />
                            <span>{profile.nationality}</span>
                          </div>
                        )}
                        {profile?.languages && Array.isArray(profile.languages) && profile.languages.length > 0 && (
                          <div className="flex items-center gap-2 md:col-span-2">
                            <Languages className="h-4 w-4 text-blue-500" />
                            <span>
                              {profile.languages
                                .map((lang) => `${lang.language}${lang.level ? ` (${lang.level})` : ''}`)
                                .join(', ')}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="mt-4 bg-gray-50 rounded-lg p-3">
                        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                          Motivation Letter
                        </p>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                          {application.motivation_letter || 'Not provided.'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Need a copy? Use the dashboard actions or export directly.
              </p>
              <button
                onClick={handleExportParticipantsCsv}
                disabled={exportingParticipants}
                className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {exportingParticipants ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Export CSV
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
