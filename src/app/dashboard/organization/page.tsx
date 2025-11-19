'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { 
  Calendar, 
  Users, 
  FileText, 
  TrendingUp, 
  Plus,
  Edit,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Building,
  Globe,
  Mail,
  Phone,
  MapPin,
  User,
  X,
  Flag,
  Briefcase,
  Languages,
  Award,
  ArrowLeft,
  Download,
  Trash2
} from 'lucide-react'
import Link from 'next/link'
import Notification from '@/components/Notification'
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
  is_published: boolean
  created_at: string
  organization_id?: string | null
  organization_name?: string | null
}

interface Application {
  application_id: string
  event_id: string
  participant_id: string
  status: 'pending' | 'accepted' | 'rejected'
  motivation_letter: string
  created_at: string
  first_name: string | null
  last_name: string | null
  email: string | null
  event_title: string | null
  organization_name: string | null
}

interface Profile {
  id: string
  first_name: string
  last_name: string
  organization_name: string
  bio: string
  website: string
  location: string
}

interface AcceptedParticipantRecord {
  application: {
    id: string
    participant_id: string
    status: 'accepted'
    motivation_letter: string | null
    created_at: string
  }
  profile: ParticipantProfileForCsv | null
}

export default function OrganizationDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [notification, setNotification] = useState<{type: 'success' | 'error' | 'warning', message: string} | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{event: Event | null}>({ event: null })
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalApplications: 0,
    pendingApplications: 0,
    acceptedApplications: 0,
    upcomingEvents: 0
  })
  const [selectedParticipant, setSelectedParticipant] = useState<any>(null)
  const [participantProfile, setParticipantProfile] = useState<any>(null)
  const [loadingProfile, setLoadingProfile] = useState(false)
  const [downloadingParticipantCsv, setDownloadingParticipantCsv] = useState(false)
  const [activeTab, setActiveTab] = useState<'events' | 'applications'>('events')
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [acceptedModalVisible, setAcceptedModalVisible] = useState(false)
  const [acceptedModalEvent, setAcceptedModalEvent] = useState<Event | null>(null)
  const [acceptedModalParticipants, setAcceptedModalParticipants] = useState<AcceptedParticipantRecord[]>([])
  const [acceptedModalLoading, setAcceptedModalLoading] = useState(false)
  const [acceptedModalError, setAcceptedModalError] = useState<string | null>(null)
  const [acceptedModalExporting, setAcceptedModalExporting] = useState(false)
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null)

  useEffect(() => {
    getSession()
  }, [])

  useEffect(() => {
    if (user && profile) {
      fetchDashboardData()
    }
  }, [user, profile])

  const getSession = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user) {
      router.push('/auth')
      return
    }

    setUser(session.user)

    // Fetch profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (profileError) {
      console.error('Error fetching profile:', profileError)
      router.push('/auth')
      return
    }

    if (profileData.user_type !== 'organization') {
      router.push('/dashboard')
      return
    }

    setProfile(profileData)
  }

  const normalizeOrgName = (value?: string | null) =>
    value?.trim().toLowerCase().replace(/\s+/g, ' ') || null

  const ownsEvent = (event: Event) => {
    if (!user) return false
    if (event.organization_id) {
      return event.organization_id === user.id
    }
    return normalizeOrgName(event.organization_name) === normalizeOrgName(profile?.organization_name)
  }

  const fetchDashboardData = async () => {
    if (!user || !profile) return

    try {
      console.log('Fetching events for organization user:', user.id)
      
      // Fetch organization events
      const { data: eventsById, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .eq('organization_id', user.id)
        .order('created_at', { ascending: false })

      const uniqueEvents = new Map<string, Event>()

      if (eventsError) {
        console.log('Events query error (non-critical):', eventsError)
        console.log('Error details:', JSON.stringify(eventsError, null, 2))
      } else if (eventsById) {
        eventsById.forEach(event => uniqueEvents.set(event.id, event))
      }

      if (profile.organization_name) {
        const { data: eventsByName, error: eventsByNameError } = await supabase
          .from('events')
          .select('*')
          .ilike('organization_name', profile.organization_name)
          .order('created_at', { ascending: false })

        if (eventsByNameError) {
          console.log('Events-by-name query error (non-critical):', eventsByNameError)
          console.log('Error details:', JSON.stringify(eventsByNameError, null, 2))
        } else if (eventsByName) {
          eventsByName.forEach(event => {
            if (ownsEvent(event)) {
              uniqueEvents.set(event.id, event)
            }
          })
        }
      }

      const mergedEvents = Array.from(uniqueEvents.values()).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )

      setEvents(mergedEvents)

      // Fetch applications for organization events
      let applicationsData = []
      console.log('Organization events found:', mergedEvents.length)
      console.log('Event IDs:', mergedEvents.map(e => e.id))
      
      if (mergedEvents.length > 0) {
        const { data: appData, error: applicationsError } = await supabase
          .from('applications_with_details')
          .select('*')
          .in('event_id', mergedEvents.map(e => e.id))
          .order('created_at', { ascending: false })

        if (applicationsError) {
          console.log('Applications query error (non-critical):', applicationsError)
          console.log('Error details:', JSON.stringify(applicationsError, null, 2))
          applicationsData = []
        } else {
          console.log('Applications fetched successfully:', appData)
          console.log('Number of applications:', appData?.length || 0)
          applicationsData = appData || []
        }
      }
      setApplications(applicationsData)

      // Calculate stats
      const upcomingEvents = mergedEvents.filter(e => new Date(e.start_date) > new Date()).length
      const pendingApps = applicationsData.filter(a => a.status === 'pending').length
      const acceptedApps = applicationsData.filter(a => a.status === 'accepted').length

      setStats({
        totalEvents: mergedEvents.length,
        totalApplications: applicationsData.length,
        pendingApplications: pendingApps,
        acceptedApplications: acceptedApps,
        upcomingEvents
      })

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApplicationStatus = async (applicationId: string, status: 'accepted' | 'rejected') => {
    try {
      console.log(`Updating application ${applicationId} to status: ${status}`)
      
      const { error } = await supabase
        .from('applications')
        .update({ status })
        .eq('id', applicationId)

      if (error) {
        console.error('Supabase error:', error)
        setNotification({type: 'error', message: `Failed to update application: ${error.message}`})
        return
      }

      // Show success message
      const actionText = status === 'accepted' ? 'accepted' : 'rejected'
      setNotification({type: 'success', message: `Application ${actionText} successfully!`})
      
      // Refresh applications
      await fetchDashboardData()
    } catch (error) {
      console.error('Error updating application status:', error)
      setNotification({type: 'error', message: 'Failed to update application status. Please try again.'})
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Pending Application</span>
      case 'accepted':
        return <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Accepted Application</span>
      case 'rejected':
        return <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Rejected Application</span>
      default:
        return null
    }
  }

  const fetchParticipantProfile = async (participantId: string) => {
    setLoadingProfile(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', participantId)
        .single()

      if (error) {
        console.error('Error fetching participant profile:', error)
        setNotification({ type: 'error', message: 'Failed to load participant profile' })
        return
      }

      setParticipantProfile(data)
    } catch (error) {
      console.error('Error fetching participant profile:', error)
      setNotification({ type: 'error', message: 'Failed to load participant profile' })
    } finally {
      setLoadingProfile(false)
    }
  }

  const handleParticipantClick = async (participantId: string, application: Application) => {
    setSelectedParticipant(application)
    await fetchParticipantProfile(participantId)
  }

  const handleDownloadParticipantCsv = () => {
    if (!participantProfile || !selectedParticipant) return

    setDownloadingParticipantCsv(true)
    try {
      const row = participantToCsvRow(participantProfile, {
        eventTitle: selectedParticipant.event_title,
        eventId: selectedParticipant.event_id,
        participantId: selectedParticipant.participant_id,
        applicationStatus: selectedParticipant.status,
        applicationDate: selectedParticipant.created_at,
        motivationLetter: selectedParticipant.motivation_letter,
        email: participantProfile.email || selectedParticipant.email
      })

      const safeNamePart = `${participantProfile.first_name || 'participant'}-${participantProfile.last_name || ''}`
        .trim()
        .replace(/[^a-z0-9]+/gi, '-')
        .toLowerCase() || 'participant'

      downloadCsvFile(
        `${safeNamePart}-profile.csv`,
        PARTICIPANT_CSV_HEADERS,
        [row]
      )
      setNotification({ type: 'success', message: 'Participant data downloaded as CSV.' })
    } catch (error) {
      console.error('Error exporting participant CSV:', error)
      setNotification({ type: 'error', message: 'Failed to export participant CSV.' })
    } finally {
      setDownloadingParticipantCsv(false)
    }
  }

  const fetchAcceptedParticipantsForEvent = async (eventId: string) => {
    const { data: applicationsData, error } = await supabase
      .from('applications')
      .select('id, participant_id, status, motivation_letter, created_at')
      .eq('event_id', eventId)
      .eq('status', 'accepted')

    if (error) throw error

    if (!applicationsData || applicationsData.length === 0) {
      return []
    }

    const participantIds = applicationsData
      .map((app) => app.participant_id)
      .filter((id): id is string => Boolean(id))

    let profilesMap = new Map<string, ParticipantProfileForCsv>()

    if (participantIds.length > 0) {
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, location, gender, birth_date, nationality, residency_country, citizenships, languages, participant_target_groups, has_fewer_opportunities, fewer_opportunities_categories, role_in_project, bio, website')
        .in('id', participantIds)

      if (profilesError) throw profilesError

      profilesMap = new Map((profilesData || []).map((profile) => [profile.id, profile]))
    }

    return applicationsData.map((app) => ({
      application: app as AcceptedParticipantRecord['application'],
      profile: profilesMap.get(app.participant_id) || null
    }))
  }

  const loadAcceptedParticipantsIntoModal = async (eventId: string) => {
    setAcceptedModalLoading(true)
    setAcceptedModalError(null)
    try {
      const participants = await fetchAcceptedParticipantsForEvent(eventId)
      setAcceptedModalParticipants(participants)
    } catch (error) {
      console.error('Error fetching accepted participants:', error)
      setAcceptedModalError('Failed to load accepted participants.')
      setAcceptedModalParticipants([])
    } finally {
      setAcceptedModalLoading(false)
    }
  }

  const handleOpenAcceptedModalForEvent = async (event: Event) => {
    setAcceptedModalVisible(true)
    setAcceptedModalEvent(event)
    await loadAcceptedParticipantsIntoModal(event.id)
  }

  const handleEditEvent = (event: Event) => {
    console.log('Dashboard - Edit button clicked for event:', event.id, event.title)
    console.log('Dashboard - Ownership check:', ownsEvent(event))
    if (!ownsEvent(event)) {
      console.error('Dashboard - Ownership check failed')
      setNotification({ type: 'error', message: 'You can edit only events created by your organization.' })
      return
    }
    const editUrl = `/events/edit/${event.id}`
    console.log('Dashboard - Navigating to edit page:', editUrl)
    // Use direct navigation as fallback to ensure it works
    try {
      router.push(editUrl)
      // Fallback after a short delay if router.push doesn't work
      setTimeout(() => {
        if (window.location.pathname !== editUrl) {
          console.log('Dashboard - Router.push failed, using window.location')
          window.location.href = editUrl
        }
      }, 100)
    } catch (err) {
      console.error('Dashboard - Navigation error:', err)
      window.location.href = editUrl
    }
  }

  const handleDeleteEvent = (event: Event) => {
    if (!ownsEvent(event)) {
      setNotification({ type: 'error', message: 'You can delete only events created by your organization.' })
      return
    }
    setShowDeleteConfirm({ event })
  }

  const confirmDeleteEvent = async () => {
    const event = showDeleteConfirm.event
    if (!event) return
    
    setShowDeleteConfirm({ event: null })
    setDeletingEventId(event.id)
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', event.id)

      if (error) throw error

      setNotification({ type: 'success', message: 'Event deleted successfully.' })
      setSelectedEvent(null)
      await fetchDashboardData()
    } catch (error) {
      console.error('Error deleting event:', error)
      setNotification({ type: 'error', message: 'Failed to delete event. Please try again.' })
    } finally {
      setDeletingEventId(null)
    }
  }

  const handleRefreshAcceptedModal = async () => {
    if (!acceptedModalEvent) return
    await loadAcceptedParticipantsIntoModal(acceptedModalEvent.id)
  }

  const handleCloseAcceptedModal = () => {
    setAcceptedModalVisible(false)
    setAcceptedModalEvent(null)
    setAcceptedModalParticipants([])
    setAcceptedModalError(null)
  }

  const handleExportAcceptedParticipantsCsv = async (event: Event) => {
    setAcceptedModalExporting(true)
    try {
      const participants =
        acceptedModalEvent?.id === event.id && acceptedModalParticipants.length > 0
          ? acceptedModalParticipants
          : await fetchAcceptedParticipantsForEvent(event.id)

      if (participants.length === 0) {
        setNotification({ type: 'warning', message: 'No accepted participants to export for this event yet.' })
        return
      }

      const rows = participants.map(({ application, profile }) =>
        participantToCsvRow(profile, {
          eventTitle: event.title,
          eventId: event.id,
          participantId: application.participant_id,
          applicationStatus: application.status,
          applicationDate: application.created_at,
          motivationLetter: application.motivation_letter || ''
        })
      )

      const safeTitle = event.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'event'
      downloadCsvFile(`${safeTitle}-accepted-participants.csv`, PARTICIPANT_CSV_HEADERS, rows)
      setNotification({ type: 'success', message: 'Accepted participants exported as CSV.' })
    } catch (error) {
      console.error('Error exporting accepted participants CSV:', error)
      setNotification({ type: 'error', message: 'Failed to export accepted participants CSV.' })
    } finally {
      setAcceptedModalExporting(false)
    }
  }

  const calculateAge = (birthDate: string) => {
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm.event && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Event</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{showDeleteConfirm.event.title}"? This action cannot be undone and will remove the event for all participants.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm({ event: null })}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteEvent}
                disabled={deletingEventId === showDeleteConfirm.event.id}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deletingEventId === showDeleteConfirm.event.id ? 'Deleting...' : 'Delete Event'}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="min-h-screen bg-gray-50 py-8">
          {notification && (
            <Notification
              type={notification.type}
              message={notification.message}
              onClose={() => setNotification(null)}
            />
          )}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Organization Dashboard
                </h1>
                <p className="text-gray-600 mt-2">
                  Welcome back, {profile?.organization_name || 'Organization'}
                </p>
              </div>
              <Link
                href="/events/create"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create Event
              </Link>
            </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Events</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalEvents}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Applications</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalApplications}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Applications</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingApplications}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Accepted Applications</p>
                <p className="text-2xl font-bold text-gray-900">{stats.acceptedApplications}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Upcoming Events</p>
                <p className="text-2xl font-bold text-gray-900">{stats.upcomingEvents}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => {
                  setActiveTab('events')
                  setSelectedEvent(null)
                }}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'events'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  My Events
                  {events.length > 0 && (
                    <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                      {events.length}
                    </span>
                  )}
                </div>
              </button>
              <button
                onClick={() => {
                  setActiveTab('applications')
                  setSelectedEvent(null)
                }}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'applications'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  All Applications
                  {applications.length > 0 && (
                    <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                      {applications.length}
                    </span>
                  )}
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'events' ? (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              {selectedEvent ? (
                // Show applications for selected event
                <div>
                  <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <button
                        onClick={() => setSelectedEvent(null)}
                        className="text-blue-600 hover:text-blue-800 mb-2 flex items-center text-sm"
                      >
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Back to Events
                      </button>
                      <h2 className="text-2xl font-bold text-gray-900">{selectedEvent.title}</h2>
                      <p className="text-gray-600 mt-1">
                        {formatDate(selectedEvent.start_date)} - {formatDate(selectedEvent.end_date)}
                      </p>
                      <Link
                        href={`/events/${selectedEvent.id}`}
                        className="text-sm text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 mt-2"
                        title="View public event page"
                      >
                        <Eye className="h-4 w-4" />
                        View public event page
                      </Link>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                    <button
                      onClick={() => handleOpenAcceptedModalForEvent(selectedEvent)}
                      className="inline-flex items-center justify-center gap-2 border border-blue-200 text-blue-700 font-semibold px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      <Users className="h-4 w-4" />
                      List Accepted Participants
                    </button>
                    <button
                      onClick={() => handleExportAcceptedParticipantsCsv(selectedEvent)}
                      disabled={acceptedModalExporting}
                      className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {acceptedModalExporting ? (
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
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleEditEvent(selectedEvent)
                      }}
                      disabled={!ownsEvent(selectedEvent)}
                      className="inline-flex items-center justify-center gap-2 border border-gray-300 text-gray-700 font-semibold px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Edit className="h-4 w-4" />
                      Edit Event
                    </button>
                    <button
                      onClick={() => handleDeleteEvent(selectedEvent)}
                      disabled={deletingEventId === selectedEvent.id}
                      className="inline-flex items-center justify-center gap-2 border border-red-300 text-red-700 font-semibold px-4 py-2 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {deletingEventId === selectedEvent.id ? (
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

                  {(() => {
                    const eventApplications = applications.filter(app => app.event_id === selectedEvent.id)
                    return eventApplications.length === 0 ? (
                      <div className="text-center py-12">
                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">No applications for this event yet</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="mb-4">
                          <p className="text-sm text-gray-600">
                            {eventApplications.length} {eventApplications.length === 1 ? 'application' : 'applications'} for this event
                          </p>
                        </div>
                        {eventApplications.map((application) => (
                          <div key={application.application_id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-3 min-w-0">
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 mb-1">
                                  <button
                                    onClick={() => handleParticipantClick(application.participant_id, application)}
                                    className="font-medium text-gray-900 truncate hover:text-blue-600 hover:underline text-left"
                                    title="Click to view full profile"
                                  >
                                    {application.first_name || 'Unknown'} {application.last_name || 'User'}
                                  </button>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-xs text-gray-500 hidden sm:inline">•</span>
                                    <span className="text-xs text-gray-500 truncate">{application.email || `ID: ${application.participant_id.slice(0, 8)}...`}</span>
                                  </div>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                  Applied on {formatDate(application.created_at)}
                                </p>
                              </div>
                              <div className="flex flex-col items-end space-y-2 ml-4 min-w-0 flex-shrink-0">
                                {getStatusBadge(application.status)}
                                {application.status === 'pending' && (
                                  <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-2">
                                    <button
                                      onClick={() => handleApplicationStatus(application.application_id, 'accepted')}
                                      className="bg-green-600 text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-green-700 transition-colors flex items-center justify-center min-w-[70px]"
                                      title="Accept Application"
                                    >
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Accept
                                    </button>
                                    <button
                                      onClick={() => handleApplicationStatus(application.application_id, 'rejected')}
                                      className="bg-red-600 text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-red-700 transition-colors flex items-center justify-center min-w-[70px]"
                                      title="Reject Application"
                                    >
                                      <XCircle className="h-3 w-3 mr-1" />
                                      Reject
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="bg-gray-50 rounded-lg p-3">
                              <p className="text-xs font-medium text-gray-700 mb-1">Motivation Letter:</p>
                              <p className="text-sm text-gray-600 line-clamp-3">
                                {application.motivation_letter}
                              </p>
                              {application.motivation_letter.length > 150 && (
                                <button 
                                  className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                                  onClick={() => {
                                    alert(application.motivation_letter)
                                  }}
                                >
                                  Read full letter...
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  })()}
                </div>
              ) : (
                // Show events list
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Your Events</h2>
                  </div>
                  {events.length === 0 ? (
                    <div className="text-center py-12">
                      <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">No events created yet</p>
                      <Link
                        href="/events/create"
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors inline-block"
                      >
                        Create Your First Event
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {events.map((event) => {
                        const eventApps = applications.filter(app => app.event_id === event.id)
                        const pendingCount = eventApps.filter(app => app.status === 'pending').length
                        const acceptedCount = eventApps.filter(app => app.status === 'accepted').length
                        
                        return (
                          <div
                            key={event.id}
                            onClick={() => setSelectedEvent(event)}
                            className="border border-gray-200 rounded-lg p-5 hover:shadow-lg transition-all cursor-pointer bg-white"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <h3 className="font-semibold text-gray-900 text-lg flex-1 pr-2">{event.title}</h3>
                              <span className={`px-2 py-1 text-xs rounded-full flex-shrink-0 ${
                                event.is_published 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {event.is_published ? 'Published' : 'Draft'}
                              </span>
                            </div>
                            <div className="space-y-2 mb-4">
                              <div className="flex items-center text-sm text-gray-600">
                                <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                                <span>{formatDate(event.start_date)} - {formatDate(event.end_date)}</span>
                              </div>
                              <div className="flex items-center text-sm text-gray-600">
                                <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                                <span className="truncate">{event.location}</span>
                              </div>
                            </div>
                            <div className="pt-4 border-t border-gray-200">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Applications:</span>
                                <div className="flex items-center gap-3">
                                  {pendingCount > 0 && (
                                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                                      {pendingCount} pending
                                    </span>
                                  )}
                                  {acceptedCount > 0 && (
                                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                                      {acceptedCount} accepted
                                    </span>
                                  )}
                                  <span className="text-gray-900 font-medium">
                                    {eventApps.length} total
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <p className="text-xs text-blue-600 font-medium">Manage event →</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          // All Applications View
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900">All Applications</h2>
                <p className="text-sm text-gray-600 mt-1">View and manage all applications across all events</p>
              </div>
              {applications.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No applications yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {applications.map((application) => {
                    const event = events.find(e => e.id === application.event_id)
                    return (
                      <div key={application.application_id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="mb-3">
                          <p className="text-sm font-medium text-blue-600 mb-1">
                            Event: {event?.title || application.event_title || 'Unknown Event'}
                          </p>
                        </div>
                        <div className="flex items-start justify-between mb-3 min-w-0">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 mb-1">
                              <button
                                onClick={() => handleParticipantClick(application.participant_id, application)}
                                className="font-medium text-gray-900 truncate hover:text-blue-600 hover:underline text-left"
                                title="Click to view full profile"
                              >
                                {application.first_name || 'Unknown'} {application.last_name || 'User'}
                              </button>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-gray-500 hidden sm:inline">•</span>
                                <span className="text-xs text-gray-500 truncate">{application.email || `ID: ${application.participant_id.slice(0, 8)}...`}</span>
                              </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              Applied on {formatDate(application.created_at)}
                            </p>
                          </div>
                          <div className="flex flex-col items-end space-y-2 ml-4 min-w-0 flex-shrink-0">
                            {getStatusBadge(application.status)}
                            {application.status === 'pending' && (
                              <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-2">
                                <button
                                  onClick={() => handleApplicationStatus(application.application_id, 'accepted')}
                                  className="bg-green-600 text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-green-700 transition-colors flex items-center justify-center min-w-[70px]"
                                  title="Accept Application"
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Accept
                                </button>
                                <button
                                  onClick={() => handleApplicationStatus(application.application_id, 'rejected')}
                                  className="bg-red-600 text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-red-700 transition-colors flex items-center justify-center min-w-[70px]"
                                  title="Reject Application"
                                >
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Reject
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs font-medium text-gray-700 mb-1">Motivation Letter:</p>
                          <p className="text-sm text-gray-600 line-clamp-3">
                            {application.motivation_letter}
                          </p>
                          {application.motivation_letter.length > 150 && (
                            <button 
                              className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                              onClick={() => {
                                alert(application.motivation_letter)
                              }}
                            >
                              Read full letter...
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Organization Profile */}
        <div className="mt-8 bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Organization Profile</h2>
              <Link
                href="/profile"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Edit Profile
              </Link>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {profile?.organization_name}
                </h3>
                {profile?.bio && (
                  <p className="text-gray-600 mb-4">{profile.bio}</p>
                )}
                <div className="space-y-2">
                  {profile?.location && (
                    <div className="flex items-center text-gray-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span>{profile.location}</span>
                    </div>
                  )}
                  {profile?.website && (
                    <div className="flex items-center text-gray-600">
                      <Globe className="h-4 w-4 mr-2" />
                      <a 
                        href={profile.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {profile.website.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-3">Contact Information</h4>
                <div className="space-y-2">
                  <div className="flex items-center text-gray-600">
                    <Mail className="h-4 w-4 mr-2" />
                    <span>{user?.email}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Building className="h-4 w-4 mr-2" />
                    <span>{profile?.first_name} {profile?.last_name}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {acceptedModalVisible && acceptedModalEvent && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div
            className="absolute inset-0"
            onClick={handleCloseAcceptedModal}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-gray-200 ring-1 ring-black/5">
            <div className="sticky top-0 bg-white/95 backdrop-blur-sm px-4 sm:px-6 py-3 border-b border-gray-200 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                  Accepted Participants
                </h3>
                <p className="text-sm text-gray-500">
                  {acceptedModalEvent.title}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleRefreshAcceptedModal}
                  disabled={acceptedModalLoading}
                  className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Refresh
                </button>
                <button
                  onClick={handleCloseAcceptedModal}
                  className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-2 transition-colors"
                  aria-label="Close modal"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="px-4 sm:px-6 py-3 border-b border-gray-200 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-500">
                {acceptedModalLoading
                  ? 'Loading accepted participants...'
                  : `${acceptedModalParticipants.length} participant${acceptedModalParticipants.length === 1 ? '' : 's'} accepted`}
              </p>
              <button
                onClick={() => handleExportAcceptedParticipantsCsv(acceptedModalEvent)}
                disabled={acceptedModalExporting}
                className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {acceptedModalExporting ? (
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
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
              {acceptedModalLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
                </div>
              ) : acceptedModalError ? (
                <div className="text-center py-12">
                  <p className="text-red-600 font-medium mb-2">{acceptedModalError}</p>
                  <button
                    onClick={handleRefreshAcceptedModal}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Try again
                  </button>
                </div>
              ) : acceptedModalParticipants.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No accepted participants yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {acceptedModalParticipants.map(({ application, profile }) => (
                    <div key={application.id} className="border border-gray-200 rounded-lg p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-lg font-semibold text-gray-900">
                            {(profile?.first_name || 'First name') + ' ' + (profile?.last_name || 'Not provided')}
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
          </div>
        </div>
      )}

      {/* Participant Profile Modal */}
      {selectedParticipant && (
        <div className="fixed inset-0 bg-gray-100 bg-opacity-80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-gray-200">
            <div className="sticky top-0 bg-gradient-to-r from-blue-50 to-white border-b border-gray-200 px-6 py-5 flex items-center justify-between z-10">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Participant Profile
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedParticipant.first_name || 'Unknown'} {selectedParticipant.last_name || 'User'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleDownloadParticipantCsv}
                  disabled={downloadingParticipantCsv || !participantProfile}
                  className="flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-900 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {downloadingParticipantCsv ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700" />
                      Preparing CSV...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Download CSV
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setSelectedParticipant(null)
                    setParticipantProfile(null)
                  }}
                  className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-2 transition-all"
                  aria-label="Close modal"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {loadingProfile ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : participantProfile ? (
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">First Name</h4>
                        <p className="text-gray-900">{participantProfile.first_name || 'Not specified'}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Last Name (Family Name)</h4>
                        <p className="text-gray-900">{participantProfile.last_name || 'Not specified'}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Email</h4>
                        <p className="text-gray-900">{participantProfile.email || selectedParticipant.email || 'Not specified'}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Birth Date</h4>
                        <p className="text-gray-900">
                          {participantProfile.birth_date || participantProfile.birthdate
                            ? new Date(participantProfile.birth_date || participantProfile.birthdate).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })
                            : 'Not specified'}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Age</h4>
                        <p className="text-gray-900">
                          {participantProfile.birth_date || participantProfile.birthdate
                            ? calculateAge(participantProfile.birth_date || participantProfile.birthdate) + ' years old'
                            : 'Not specified'}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Gender</h4>
                        <p className="text-gray-900">{participantProfile.gender || 'Not specified'}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Location</h4>
                        <p className="text-gray-900">{participantProfile.location || 'Not specified'}</p>
                      </div>
                      {participantProfile.website && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-1">Website</h4>
                          <p className="text-gray-900">
                            <a href={participantProfile.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              {participantProfile.website}
                            </a>
                          </p>
                        </div>
                      )}
                    </div>
                    {participantProfile.bio && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Bio</h4>
                        <p className="text-gray-900 whitespace-pre-wrap">{participantProfile.bio}</p>
                      </div>
                    )}
                  </div>

                  {/* Nationality & Citizenship */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Flag className="h-5 w-5 mr-2" />
                      Nationality & Location
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Nationality</h4>
                        <p className="text-gray-900">{participantProfile.nationality || 'Not specified'}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Residency Country</h4>
                        <p className="text-gray-900">{participantProfile.residency_country || 'Not specified'}</p>
                      </div>
                      <div className="md:col-span-2">
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Citizenships</h4>
                        {participantProfile.citizenships && Array.isArray(participantProfile.citizenships) && participantProfile.citizenships.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {participantProfile.citizenships.map((citizenship: string, idx: number) => (
                              <span key={idx} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                                {citizenship}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 text-sm">Not specified</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Role & Languages */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Briefcase className="h-5 w-5 mr-2" />
                      Role & Languages
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Role in Project</h4>
                        <p className="text-gray-900">{participantProfile.role_in_project || 'Not specified'}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1 flex items-center">
                          <Languages className="h-4 w-4 mr-1" />
                          Languages
                        </h4>
                        {participantProfile.languages && Array.isArray(participantProfile.languages) && participantProfile.languages.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {participantProfile.languages.map((lang: any, idx: number) => (
                              <span key={idx} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                                {lang.language} - {lang.level}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 text-sm">Not specified</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Target Groups */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Target Groups</h3>
                    {participantProfile.participant_target_groups && Array.isArray(participantProfile.participant_target_groups) && participantProfile.participant_target_groups.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {participantProfile.participant_target_groups.map((group: string, idx: number) => (
                          <span key={idx} className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                            {group}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">Not specified</p>
                    )}
                  </div>

                  {/* Fewer Opportunities */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Fewer Opportunities</h3>
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Participant with fewer opportunities</h4>
                      <p className="text-gray-900">
                        {participantProfile.has_fewer_opportunities === true ? 'Yes' : participantProfile.has_fewer_opportunities === false ? 'No' : 'Not specified'}
                      </p>
                    </div>
                    {participantProfile.has_fewer_opportunities && participantProfile.fewer_opportunities_categories && Array.isArray(participantProfile.fewer_opportunities_categories) && participantProfile.fewer_opportunities_categories.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-2">Categories</h4>
                        <div className="flex flex-wrap gap-2">
                          {participantProfile.fewer_opportunities_categories.map((category: string, idx: number) => (
                            <span key={idx} className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm">
                              {category}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">Failed to load participant profile</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
        </div>
      )}
    </div>
  )
}
