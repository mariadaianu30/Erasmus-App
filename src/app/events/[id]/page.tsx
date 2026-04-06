'use client'

import { useState, useEffect, useCallback } from 'react'
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
  Trash2,
  Paperclip
} from 'lucide-react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'
import { downloadCsvFile, participantToCsvRow, PARTICIPANT_CSV_HEADERS, ParticipantProfileForCsv } from '@/lib/csv'
import ShareOpportunity from '@/components/ShareOpportunity'

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
  cv_url?: string | null
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
  const [cvFile, setCvFile] = useState<File | null>(null)
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

  const fetchEvent = useCallback(async () => {
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
  }, [params.id, router])

  const checkUser = useCallback(async () => {
    try {
      // Use getSession() instead of getUser() to avoid AuthSessionMissingError
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError) {
        console.error('Error getting session:', sessionError)
        setUser(null)
        setUserProfile(null)
        return
      }

      const user = session?.user || null
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
  }, [params.id])

  useEffect(() => {
    fetchEvent()
    checkUser()
  }, [fetchEvent, checkUser])

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !event) return

    // Validate motivation letter & CV
    if (motivationLetter.trim().length === 0) {
      setToast({ message: 'Please write a motivation letter.', type: 'error' })
      return
    }

    if (!cvFile) {
      setToast({ message: 'Please upload your CV.', type: 'error' })
      return
    }

    setApplying(true)

    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Request timed out. Please try again.'))
      }, 15000) // 15 second timeout
      setTimeoutId(timeout)
    })

    try {
      let cv_url = null
      const fileExt = cvFile.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('cvs')
        .upload(fileName, cvFile)
        
        if (uploadError) {
          throw new Error(`Failed to upload CV: ${uploadError.message}`)
        }
        
        const { data: publicUrlData } = supabase.storage
          .from('cvs')
          .getPublicUrl(fileName)
          
        cv_url = publicUrlData.publicUrl

      const insertPromise = supabase
        .from('applications')
        .insert({
          event_id: event.id,
          participant_id: user.id,
          motivation_letter: motivationLetter,
          cv_url: cv_url,
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
      setCvFile(null)

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
    setCvFile(null)
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
            className={`flex items-center gap-3 px-6 py-4 rounded-lg shadow-lg max-w-md ${toast.type === 'success'
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
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-20 py-12 border-t mt-20 sm:mt-24 pt-8 border-gray-100">
        {/* Back Button */}
        <div className="mb-8">
          <Link
            href="/events"
            className="inline-flex items-center text-[#003399] hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-5 py-2.5 rounded-full font-bold transition-all shadow-sm border border-blue-100"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Catalog
          </Link>
        </div>

        <div className="flex flex-col lg:flex-row gap-10 items-start w-full relative">
          
          {/* LEFT COLUMN: Event Details & Organization */}
          <div className="flex-1 w-full flex flex-col gap-10 order-2 lg:order-1 relative z-10">
            
            {/* Main Specs Card */}
            <div className="bg-white rounded-3xl shadow-xl shadow-blue-900/5 border border-blue-900/10 p-8 sm:p-10 relative overflow-hidden">
              <h2 className="text-2xl font-extrabold text-[#003399] mb-8 border-b border-gray-100 pb-4">Event Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-2xl border border-gray-100 mb-10">
                <div className="flex items-start text-gray-700">
                  <Calendar className="h-6 w-6 mr-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-extrabold text-[#003399] text-xs uppercase tracking-wider mb-1">Begin Date</p>
                    <p className="text-sm font-bold text-gray-800">{formatDate(event.start_date)}</p>
                  </div>
                </div>
                <div className="flex items-start text-gray-700">
                  <Clock className="h-6 w-6 mr-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-extrabold text-[#003399] text-xs uppercase tracking-wider mb-1">End Date</p>
                    <p className="text-sm font-bold text-gray-800">{formatDate(event.end_date)}</p>
                  </div>
                </div>
                
                {(event.venue_place || event.city) && (
                  <div className="flex items-start text-gray-700">
                    <MapPin className="h-6 w-6 mr-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-extrabold text-[#003399] text-xs uppercase tracking-wider mb-1">Location</p>
                      <p className="text-sm font-bold text-gray-800">
                        {event.venue_place && <span className="block">{event.venue_place}</span>}
                        {event.city && <span className="block">{event.city}</span>}
                      </p>
                    </div>
                  </div>
                )}
                
                {event.country && (
                  <div className="flex items-start text-gray-700">
                    <Globe className="h-6 w-6 mr-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-extrabold text-[#003399] text-xs uppercase tracking-wider mb-1">Country</p>
                      <p className="text-sm font-bold text-gray-800">{event.country}</p>
                    </div>
                  </div>
                )}

                {event.group_size && (
                  <div className="flex items-start text-gray-700">
                    <Users className="h-6 w-6 mr-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-extrabold text-[#003399] text-xs uppercase tracking-wider mb-1">Group Size</p>
                      <p className="text-sm font-bold text-gray-800">{event.group_size} participants</p>
                    </div>
                  </div>
                )}

                {event.working_language && (
                  <div className="flex items-start text-gray-700">
                    <Languages className="h-6 w-6 mr-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-extrabold text-[#003399] text-xs uppercase tracking-wider mb-1">Language</p>
                      <p className="text-sm font-bold text-gray-800">{event.working_language}</p>
                    </div>
                  </div>
                )}
              </div>

              {event.is_funded && (
                <div className="mb-10 inline-block">
                  <span className="bg-green-100 text-green-800 px-5 py-2.5 rounded-full text-sm font-extrabold shadow-sm border border-green-200 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Fully Funded Opportunity
                  </span>
                </div>
              )}

              {event.short_description && (
                <div className="mb-10">
                  <h3 className="text-xl font-extrabold text-[#003399] mb-4">Summary</h3>
                  <p className="text-gray-700 text-lg leading-relaxed font-medium">
                    {event.short_description}
                  </p>
                </div>
              )}

              {event.full_description && (
                <div className="mb-10">
                  <h3 className="text-xl font-extrabold text-[#003399] mb-4">Full Details</h3>
                  <div className="prose max-w-none">
                    <p className="text-gray-700 leading-[1.8] whitespace-pre-wrap break-words border-l-4 border-amber-400 pl-6 bg-amber-50/30 py-6 pr-6 rounded-r-3xl font-medium">
                      {event.full_description}
                    </p>
                  </div>
                </div>
              )}

              {/* Extra Details */}
              {(event.target_groups || event.participation_fee !== null || event.accommodation_food_details || event.transport_details) && (
                <div className="border-t border-gray-100 pt-8 mt-4 space-y-8">
                  {event.target_groups && Array.isArray(event.target_groups) && event.target_groups.length > 0 && (
                    <div>
                      <h4 className="text-lg font-extrabold text-[#003399] mb-4 flex items-center">
                        <Users className="h-5 w-5 mr-3 text-amber-500" />
                        Target Groups
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {event.target_groups.map((group, idx) => (
                          <span key={idx} className="bg-gray-100 text-gray-800 px-4 py-2 rounded-xl text-sm font-bold border border-gray-200">
                            {group}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {event.participation_fee !== null && event.participation_fee !== undefined && (
                    <div>
                      <h4 className="text-lg font-extrabold text-[#003399] mb-3 flex items-center">
                        <DollarSign className="h-5 w-5 mr-3 text-amber-500" />
                        Participation Fee
                      </h4>
                      <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 inline-block">
                        <p className="text-gray-800 font-extrabold text-lg">
                          ${typeof event.participation_fee === 'number' ? event.participation_fee.toFixed(2) : '0.00'}
                        </p>
                        {event.participation_fee_reason && (
                          <p className="text-gray-600 font-medium text-sm mt-1 max-w-md">
                            {event.participation_fee_reason}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {event.accommodation_food_details && (
                    <div>
                      <h4 className="text-lg font-extrabold text-[#003399] mb-3 flex items-center">
                        <UtensilsCrossed className="h-5 w-5 mr-3 text-amber-500" />
                        Accommodation & Food
                      </h4>
                      <p className="text-gray-700 leading-relaxed font-medium bg-gray-50 p-6 rounded-2xl border border-gray-100">
                        {event.accommodation_food_details}
                      </p>
                    </div>
                  )}

                  {event.transport_details && (
                    <div>
                      <h4 className="text-lg font-extrabold text-[#003399] mb-3 flex items-center">
                        <Car className="h-5 w-5 mr-3 text-amber-500" />
                        Transport Arrangements
                      </h4>
                      <p className="text-gray-700 leading-relaxed font-medium bg-gray-50 p-6 rounded-2xl border border-gray-100">
                        {event.transport_details}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Organizator Info */}
            <div className="bg-[#003399] rounded-3xl shadow-xl shadow-blue-900/10 p-8 sm:p-10 flex flex-col sm:flex-row items-center sm:items-start gap-6 relative overflow-hidden text-center sm:text-left">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
              
              <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center flex-shrink-0 border border-white/20 shadow-inner">
                <User className="h-10 w-10 text-amber-400" />
              </div>
              
              <div className="flex-1 relative z-10">
                <h3 className="text-blue-200 font-bold uppercase tracking-widest text-xs mb-2">Organized By</h3>
                <h4 className="font-extrabold text-white text-2xl sm:text-3xl mb-4">{event.organization_name}</h4>
                {event.organization_website && (
                  <a
                    href={event.organization_website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm text-[#003399] bg-amber-400 hover:bg-amber-300 font-extrabold px-6 py-3 rounded-xl transition-colors shadow-sm"
                  >
                    <Globe className="h-5 w-5 mr-2" />
                    Visit Official Website
                  </a>
                )}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Hero Photo & Actions (Sticky Layout) */}
          <div className="w-full lg:w-[420px] xl:w-[460px] flex flex-col gap-8 order-1 lg:order-2 lg:sticky lg:top-8 z-30 mb-8 lg:mb-0">
            
            {/* Action/Hero Card */}
            <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-blue-900/10 border border-blue-900/5 overflow-hidden flex flex-col relative z-20">
              
              {/* Photo Area */}
              {event.photo_url ? (
                <div className="relative w-full h-[280px] sm:h-[320px] bg-gray-100 group">
                  <Image
                    src={event.photo_url}
                    alt={event.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  
                  {/* Category on top of image */}
                  {event.category && (
                    <div className="absolute top-6 left-6 z-10">
                      <span className="bg-amber-400 text-amber-950 px-4 py-1.5 rounded-xl text-xs font-extrabold uppercase shadow-lg border border-amber-300">
                        {event.category}
                      </span>
                    </div>
                  )}
                  {/* Share button on top of image */}
                  <div className="absolute top-6 right-6 z-10">
                    <div className="bg-white/90 backdrop-blur-md rounded-xl p-1 shadow-lg hover:scale-110 transition-transform">
                      <ShareOpportunity title={event.title} url={`/events/${event.id}`} type="event" />
                    </div>
                  </div>
                </div>
              ) : (
                 <div className="w-full bg-[#003399] p-6 flex justify-between items-start">
                   {event.category && (
                      <span className="bg-amber-400 text-amber-950 px-4 py-1.5 rounded-xl text-xs font-extrabold uppercase shadow-sm">
                        {event.category}
                      </span>
                    )}
                    <div className="bg-white/10 rounded-xl p-1">
                      <ShareOpportunity title={event.title} url={`/events/${event.id}`} type="event" />
                    </div>
                 </div>
              )}

              {/* Title Area */}
              <div className="p-8">
                {event.event_type && (
                  <p className="text-blue-500 font-extrabold text-xs uppercase tracking-widest mb-3">{event.event_type}</p>
                )}
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#003399] leading-tight mb-2">
                  {event.title}
                </h1>
                
                {/* Management Actions */}
                {canManageEvent && (
                  <div className="mt-8 pt-6 border-t border-gray-100 space-y-3">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Management Options</p>
                    <button
                      onClick={handleOpenAcceptedModal}
                      className="w-full inline-flex items-center justify-center gap-3 bg-blue-50 text-[#003399] font-extrabold px-5 py-3.5 rounded-2xl hover:bg-blue-100 transition-colors border border-blue-200 shadow-sm"
                    >
                      <Users className="h-5 w-5" />
                      List Accepted Participants
                    </button>
                    <button
                      onClick={handleExportParticipantsCsv}
                      disabled={exportingParticipants}
                      className="w-full inline-flex items-center justify-center gap-3 bg-[#003399] text-white font-extrabold px-5 py-3.5 rounded-2xl hover:bg-blue-800 transition-colors border-2 border-[#003399] shadow-md disabled:opacity-50"
                    >
                      {exportingParticipants ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                      ) : (
                        <Download className="h-5 w-5" />
                      )}
                      Export as CSV
                    </button>
                    
                    <div className="flex gap-2 mt-2">
                        <Link
                          href={`/events/edit/${event.id}`}
                          className="flex-1 inline-flex items-center justify-center gap-2 bg-white text-gray-700 font-extrabold px-4 py-3 rounded-2xl hover:bg-gray-50 transition-colors border-2 border-gray-200 shadow-sm"
                        >
                          <Edit className="h-4 w-4" />
                          Edit
                        </Link>
                        <button
                          onClick={handleDeleteEvent}
                          disabled={deletingEvent}
                          className="flex-1 inline-flex items-center justify-center gap-2 bg-red-50 text-red-600 font-extrabold px-4 py-3 rounded-2xl hover:bg-red-100 transition-colors border border-red-200 shadow-sm"
                        >
                          {deletingEvent ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                          Delete
                        </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Application Section */}
            <div className="bg-white rounded-[2.5rem] shadow-xl shadow-blue-900/5 border border-blue-900/10 p-8 relative overflow-hidden z-20">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400 opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
              
              {!user ? (
                <div className="text-center relative z-10">
                  <h3 className="text-2xl font-extrabold text-[#003399] mb-3">Apply to Join</h3>
                  <p className="text-gray-600 font-medium mb-8">Create an account or sign in to verify your identity and apply for this opportunity.</p>
                  <Link
                    href="/auth"
                    className="w-full inline-flex items-center justify-center bg-amber-400 text-amber-950 py-4 px-6 rounded-2xl font-extrabold hover:bg-amber-300 transition-all text-lg shadow-md hover:shadow-lg"
                  >
                    Sign In to Apply
                  </Link>
                </div>
              ) : userProfile?.user_type === 'organization' ? (
                <div className="text-center relative z-10">
                  <div className="w-16 h-16 bg-blue-100 text-[#003399] rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <User className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-extrabold text-[#003399] mb-3">Organization Mode</h3>
                  <p className="text-gray-600 font-medium mb-6">
                    Organizations cannot apply to events. Manage your events from the dashboard.
                  </p>
                  <Link
                    href="/dashboard/organization"
                    className="w-full inline-flex items-center justify-center bg-blue-50 text-[#003399] py-3 px-6 rounded-2xl font-extrabold hover:bg-blue-100 transition-all border border-blue-200 shadow-sm"
                  >
                    Go to Dashboard
                  </Link>
                </div>
              ) : application ? (
                <div className="text-center relative z-10">
                  <h3 className="text-2xl font-extrabold text-[#003399] mb-6">Status</h3>
                  <div className="flex flex-col items-center justify-center mb-6 bg-gray-50 rounded-2xl p-6 border border-gray-100 shadow-inner">
                    <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 mb-4">
                      {getStatusIcon(application.status)}
                    </div>
                    <span className={`px-5 py-2 rounded-full text-base font-extrabold uppercase tracking-wide shadow-sm ${getStatusColor(application.status)}`}>
                      {application.status === 'pending' ? 'Under Review' :
                        application.status === 'accepted' ? 'Accepted!' :
                          'Not Selected'}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-gray-400 mb-6 uppercase tracking-wider">
                    Applied on {formatDate(application.created_at)}
                  </p>
                  
                  {application.status === 'pending' && (
                    <p className="text-[#003399] font-medium bg-blue-50 p-4 rounded-xl mb-6 border border-blue-100 shadow-sm">
                      Your application is being reviewed by the organization.
                    </p>
                  )}
                  {application.status === 'accepted' && (
                    <p className="text-green-800 font-medium bg-green-50 p-4 rounded-xl mb-6 border border-green-200 shadow-sm">
                      🎉 Congratulations! You have been accepted to this event. Check your email for next steps.
                    </p>
                  )}
                  {application.status === 'rejected' && (
                    <p className="text-gray-600 font-medium bg-gray-50 p-4 rounded-xl mb-6 border border-gray-200 shadow-sm">
                      Thank you for your interest. Unfortunately, you were not selected this time. Keep applying!
                    </p>
                  )}
                  <Link
                    href="/my-applications"
                    className="w-full inline-flex items-center justify-center text-[#003399] bg-white border-2 border-[#003399] hover:bg-[#003399] hover:text-white py-3 mt-2 rounded-2xl font-extrabold transition-colors shadow-sm"
                  >
                    View All My Applications
                  </Link>
                </div>
              ) : showApplyForm ? (
                <form onSubmit={handleApply} className="space-y-6 relative z-10">
                  <div className="mb-6 border-b border-gray-100 pb-6">
                    <h3 className="text-2xl font-extrabold text-[#003399] mb-2">Apply Now</h3>
                    <p className="text-gray-600 font-medium">
                      Tell the organizers why you are the perfect fit for this event.
                    </p>
                  </div>

                  <div>
                    <label htmlFor="motivation-letter" className="block text-xs font-extrabold text-[#003399] uppercase tracking-wider mb-2">
                      Motivation Letter
                    </label>
                    <textarea
                      id="motivation-letter"
                      value={motivationLetter}
                      onChange={(e) => setMotivationLetter(e.target.value)}
                      maxLength={10000}
                      rows={6}
                      className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-[#003399] resize-none transition-all font-medium text-gray-800 bg-gray-50"
                      placeholder="I am very interested in this opportunity because..."
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1 text-right">{motivationLetter.length}/10000 characters</p>
                  </div>

                  <div>
                    <label htmlFor="cv-upload" className="block text-xs font-extrabold text-[#003399] uppercase tracking-wider mb-2">
                      Upload CV (Required)
                    </label>
                    <div className="flex items-center justify-center w-full">
                      <label htmlFor="cv-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Paperclip className="w-8 h-8 mb-3 text-gray-400" />
                          <p className="mb-2 text-sm text-gray-500 font-medium">
                            {cvFile ? <span className="text-[#003399] font-bold">{cvFile.name}</span> : <span><span className="font-semibold text-[#003399]">Click to upload</span> or drag and drop</span>}
                          </p>
                          <p className="text-xs text-gray-500">PDF, DOCX, DOC (Max 5MB)</p>
                        </div>
                        <input id="cv-upload" type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            setCvFile(e.target.files[0])
                          }
                        }} />
                      </label>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3 pt-2 mt-4">
                    <button
                      type="submit"
                      disabled={applying || motivationLetter.trim().length === 0 || !cvFile}
                      className="w-full bg-[#003399] text-white py-4 px-6 rounded-2xl font-extrabold hover:bg-blue-800 shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center text-lg z-20"
                    >
                      {applying ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
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
                      className="w-full py-4 rounded-2xl font-extrabold text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors z-20"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="text-center relative z-10">
                  <h3 className="text-2xl font-extrabold text-[#003399] mb-4">You&apos;re Eligible</h3>
                  <p className="text-gray-600 font-medium mb-8">
                    Your profile matches the criteria. Ready to join this amazing opportunity?
                  </p>
                  <button
                    onClick={() => setShowApplyForm(true)}
                    className="w-full bg-amber-400 text-amber-950 py-4 px-6 rounded-2xl font-extrabold hover:bg-amber-500 hover:shadow-lg transition-all text-lg shadow-md z-20 relative"
                  >
                    Start Application
                  </button>
                </div>
              )}
            </div>

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
