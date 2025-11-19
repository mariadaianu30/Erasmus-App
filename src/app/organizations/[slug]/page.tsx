'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Calendar, ArrowLeft, Award, MapPin, Globe, Users } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'

interface Organization {
  id: string
  organization_name: string
  organization_website: string | null
  location: string | null
  bio: string | null
  is_verified?: boolean
  first_name?: string | null
  last_name?: string | null
}

interface Event {
  id: string
  title: string
  start_date: string
  end_date: string
  location: string | null
  max_participants: number | null
  category: string | null
}

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const decodeOrganizationSlug = (slug: string) => {
  if (!slug) return ''
  const decoded = decodeURIComponent(slug)
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (!decoded) {
    return slug
  }

  return decoded
}

export default function OrganizationDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const organizationParam = Array.isArray(params?.slug) ? params?.slug[0] : params?.slug

  const [organization, setOrganization] = useState<Organization | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!organizationParam) return

    const fetchOrganizationData = async () => {
      setLoading(true)
      try {
        const isUuidIdentifier = uuidRegex.test(organizationParam)
        const normalizedName = decodeOrganizationSlug(organizationParam)

        let orgData: Organization | null = null

        if (isUuidIdentifier) {
          const { data, error } = await supabase
            .from('organization_view')
            .select('id, organization_name, organization_website, location, bio, is_verified, first_name, last_name')
            .eq('id', organizationParam)
            .maybeSingle()

          if (error) throw error
          orgData = data
        } else {
          const { data, error } = await supabase
            .from('organization_view')
            .select('id, organization_name, organization_website, location, bio, is_verified, first_name, last_name')
            .ilike('organization_name', normalizedName)
            .maybeSingle()

          if (error) throw error
          orgData = data
        }

        if (!orgData) {
          router.replace('/organizations')
          return
        }

        setOrganization(orgData)

        if (orgData.id) {
          const { data: eventsData, error: eventsError } = await supabase
            .from('events')
            .select('id, title, start_date, end_date, location, max_participants, category, is_published')
            .eq('organization_id', orgData.id)
            .eq('is_published', true)
            .order('start_date', { ascending: true })

          if (!eventsError && eventsData) {
            setEvents(eventsData)
          } else {
            setEvents([])
          }
        } else {
          setEvents([])
        }
      } catch (error) {
        console.error('Organization fetch error:', error)
        router.replace('/organizations')
      } finally {
        setLoading(false)
      }
    }

    fetchOrganizationData()
  }, [organizationParam, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-3 text-gray-600">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
          <p className="text-sm">Loading organization...</p>
        </div>
      </div>
    )
  }

  if (!organization) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <p className="text-gray-700">Organization not found.</p>
          <Link href="/organizations" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
            Back to organizations
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/organizations" className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to organizations
        </Link>

        <div className="bg-white border rounded-lg shadow-sm p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{organization.organization_name}</h1>
              {(organization.first_name || organization.last_name) && (
                <p className="text-sm text-gray-600 mt-1">
                  Contact: {[organization.first_name, organization.last_name].filter(Boolean).join(' ')}
                </p>
              )}
            </div>
            {organization.is_verified ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <Award className="h-3 w-3 mr-1" />
                Verified
              </span>
            ) : (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                Unverified
              </span>
            )}
          </div>

          <div className="mt-6 space-y-3 text-sm text-gray-700">
            {organization.location && (
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                {organization.location}
              </div>
            )}

            {organization.organization_website && (
              <div className="flex items-center">
                <Globe className="h-4 w-4 mr-2 text-gray-500" />
                <a
                  href={organization.organization_website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 break-all"
                >
                  {organization.organization_website}
                </a>
              </div>
            )}
          </div>

          {organization.bio && (
            <div className="mt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">About</h2>
              <p className="text-gray-700 whitespace-pre-line">{organization.bio}</p>
            </div>
          )}
        </div>

        <div className="mt-8 bg-white border rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Upcoming events</h2>
            <span className="text-sm text-gray-500">{events.length} {events.length === 1 ? 'event' : 'events'}</span>
          </div>

          {events.length === 0 ? (
            <p className="text-sm text-gray-600">This organization has no upcoming published events.</p>
          ) : (
            <div className="space-y-4">
              {events.map((event) => (
                <div key={event.id} className="border rounded-lg p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
                      {event.category && <p className="text-sm text-gray-600">{event.category}</p>}
                    </div>
                    <Link
                      href={`/events/${event.id}`}
                      className="text-sm text-blue-600 font-medium hover:text-blue-800"
                    >
                      View details →
                    </Link>
                  </div>

                  <div className="mt-3 space-y-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                      {formatDate(event.start_date)} – {formatDate(event.end_date)}
                    </div>
                    {event.location && (
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                        {event.location}
                      </div>
                    )}
                    {typeof event.max_participants === 'number' && (
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2 text-gray-500" />
                        Up to {event.max_participants} participants
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

