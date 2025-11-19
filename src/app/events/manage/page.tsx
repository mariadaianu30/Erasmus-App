 'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  CalendarDays,
  CalendarRange,
  Clock,
  Edit,
  Filter,
  Plus,
  Search,
  Users,
  AlertTriangle,
  CheckCircle,
  UploadCloud
} from 'lucide-react'

interface User {
  id: string
  email?: string
}

interface Profile {
  user_type: 'participant' | 'organization'
  organization_name?: string | null
}

interface OrgEvent {
  id: string
  title: string
  start_date: string
  end_date: string
  city: string | null
  country: string | null
  event_type: string | null
  is_published: boolean | null
  short_description: string | null
  photo_url: string | null
  updated_at: string | null
  created_at: string | null
}

type StatusFilter = 'all' | 'upcoming' | 'past' | 'draft'

export default function ManageEventsPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [events, setEvents] = useState<OrgEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    const initialize = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) {
          router.push('/auth')
          return
        }
        setUser(session.user)

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('user_type, organization_name')
          .eq('id', session.user.id)
          .single()

        if (profileError || profileData?.user_type !== 'organization') {
          setError('Only organization accounts can manage events.')
          setLoading(false)
          return
        }

        setProfile(profileData)
        await fetchEvents(session.user.id)
      } catch (err) {
        console.error(err)
        setError('Failed to load events. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    initialize()
  }, [router])

  const fetchEvents = async (organizationId: string) => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('id, title, start_date, end_date, city, country, event_type, is_published, short_description, photo_url, created_at, updated_at')
        .eq('organization_id', organizationId)
        .order('start_date', { ascending: false })

      if (error) {
        throw error
      }

      setEvents(data || [])
    } catch (err) {
      console.error('Failed to fetch events', err)
      setError('Could not load your events. Please try again later.')
    }
  }

  const handleRefresh = async () => {
    if (!user) return
    setRefreshing(true)
    await fetchEvents(user.id)
    setRefreshing(false)
  }

  const filteredEvents = useMemo(() => {
    const term = searchTerm.toLowerCase()
    const now = new Date()

    return events.filter((event) => {
      const matchesSearch =
        event.title.toLowerCase().includes(term) ||
        (event.city?.toLowerCase().includes(term) ?? false) ||
        (event.country?.toLowerCase().includes(term) ?? false)

      if (!matchesSearch) return false

      if (statusFilter === 'draft') {
        return !event.is_published
      }

      const eventDate = new Date(event.start_date)

      if (statusFilter === 'upcoming') {
        return event.is_published !== false && eventDate >= now
      }

      if (statusFilter === 'past') {
        return event.is_published !== false && eventDate < now
      }

      return true
    })
  }, [events, searchTerm, statusFilter])

  const stats = useMemo(() => {
    const now = new Date()
    const upcoming = events.filter(
      (event) => event.is_published !== false && new Date(event.start_date) >= now
    ).length

    const past = events.filter(
      (event) => event.is_published !== false && new Date(event.start_date) < now
    ).length

    const draft = events.filter((event) => event.is_published === false).length

    return {
      total: events.length,
      upcoming,
      past,
      draft,
    }
  }, [events])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="text-gray-500 text-sm">Loading your events...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white border border-red-200 rounded-lg p-6 max-w-md text-center">
          <AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Restricted</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/dashboard"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm text-gray-500 uppercase tracking-wide">Event Management</p>
            <h1 className="text-3xl font-bold text-gray-900">
              Manage Events {profile?.organization_name ? `– ${profile.organization_name}` : ''}
            </h1>
            <p className="text-gray-600 mt-1">
              Track, edit, and publish the opportunities created by your organization.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-md text-gray-700 hover:bg-gray-100 disabled:opacity-60"
            >
              {refreshing ? (
                <>
                  <div className="h-4 w-4 border-b-2 border-gray-600 rounded-full animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <UploadCloud className="h-4 w-4" />
                  Refresh
                </>
              )}
            </button>
            <Link
              href="/events/create"
              className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Create Event
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard title="Total Events" value={stats.total} icon={<CalendarDays className="h-5 w-5 text-blue-600" />} />
          <StatCard title="Upcoming" value={stats.upcoming} icon={<Clock className="h-5 w-5 text-green-600" />} />
          <StatCard title="Past" value={stats.past} icon={<CalendarRange className="h-5 w-5 text-gray-500" />} />
          <StatCard title="Drafts" value={stats.draft} icon={<AlertTriangle className="h-5 w-5 text-yellow-600" />} />
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-5 space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1">
              <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search events by title, city, or country..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All events</option>
                <option value="upcoming">Upcoming</option>
                <option value="past">Past</option>
                <option value="draft">Drafts</option>
              </select>
            </div>
          </div>

          {filteredEvents.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-gray-200 rounded-xl bg-gray-50">
              <CalendarDays className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No events match your filters</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Try adjusting your search or create a new opportunity for participants.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredEvents.map((event) => (
                <EventRow key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const StatCard = ({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) => (
  <div className="bg-white border rounded-lg p-4 flex items-center gap-4">
    <div className="p-2.5 rounded-full bg-gray-50 border border-gray-100">{icon}</div>
    <div>
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
    </div>
  </div>
)

const EventRow = ({ event }: { event: OrgEvent }) => {
  const startDate = new Date(event.start_date)
  const isUpcoming = startDate >= new Date()
  const statusLabel = event.is_published === false ? 'Draft' : isUpcoming ? 'Upcoming' : 'Past'
  const statusClasses =
    event.is_published === false
      ? 'bg-yellow-50 text-yellow-800 border border-yellow-100'
      : isUpcoming
      ? 'bg-green-50 text-green-800 border border-green-100'
      : 'bg-gray-100 text-gray-700 border border-gray-200'

  return (
    <div className="border rounded-xl p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-start">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-xl font-semibold text-gray-900">{event.title}</h3>
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusClasses}`}>
              {statusLabel}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-blue-500" />
            {startDate.toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}{' '}
            · {event.city || 'City TBD'}, {event.country || 'Country TBD'}
          </p>
          {event.short_description && (
            <p className="text-sm text-gray-600 mt-3 line-clamp-2">{event.short_description}</p>
          )}
          <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-gray-500">
            {event.event_type && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-full">
                <Users className="h-3 w-3" />
                {event.event_type}
              </span>
            )}
            <span>Created {new Date(event.created_at || event.start_date).toLocaleDateString()}</span>
            {event.updated_at && (
              <span>Updated {new Date(event.updated_at).toLocaleDateString()}</span>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-2 min-w-[200px]">
          <Link
            href={`/events/${event.id}`}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 rounded-md text-sm text-gray-700 hover:bg-gray-50"
          >
            View public page
          </Link>
          <Link
            href={`/events/edit/${event.id}`}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
          >
            <Edit className="h-4 w-4" />
            Edit Event
          </Link>
        </div>
      </div>
    </div>
  )
}
