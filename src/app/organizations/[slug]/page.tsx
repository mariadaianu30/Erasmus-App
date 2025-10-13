'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Globe, 
  MapPin, 
  Calendar, 
  Users, 
  Building,
  Award,
  ExternalLink,
  Clock
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'

interface Organization {
  organization_name: string
  organization_website: string
  location: string
  bio: string
}

interface Event {
  id: string
  title: string
  description: string
  start_date: string
  end_date: string
  location: string
  max_participants: number
  category: string
  organization_name: string | null
}

export default function OrganizationDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOrganizationData()
  }, [params.slug])

  const fetchOrganizationData = async () => {
    try {
      // Convert slug back to organization name
      const organizationName = decodeOrganizationName(params.slug as string)
      console.log('Looking for organization:', organizationName)
      
      // Get organization info from organization_view (case-insensitive)
      const { data: orgData, error: orgError } = await supabase
        .from('organization_view')
        .select('*')
        .ilike('organization_name', organizationName)
        .single()

      if (orgData && !orgError) {
        // Organization found in organization_view
        const org = {
          organization_name: orgData.organization_name,
          organization_website: orgData.organization_website,
          location: orgData.location || 'Location not specified',
          bio: orgData.bio || 'No description available',
          is_verified: orgData.is_verified || false // Use database value or default to false
        }
        console.log('Found organization in view:', org)
        setOrganization(org)
      } else {
        console.log('Organization not found in organization view')
        throw new Error('Organization not found')
      }

      // Get organization events (case-insensitive)
      const { data: allEventsData, error: allEventsError } = await supabase
        .from('events')
        .select('*')
        .ilike('organization_name', organizationName)
        .eq('is_published', true)
        .gte('start_date', new Date().toISOString())
        .order('start_date', { ascending: true })

      if (allEventsError) {
        console.log('All events query error:', allEventsError)
        setEvents([])
      } else {
        console.log('Found events for organization:', allEventsData?.length || 0)
        setEvents(allEventsData || [])
      }
    } catch (error) {
      console.log('Organization fetch error (non-critical):', error)
      router.push('/organizations')
    } finally {
      setLoading(false)
    }
  }

  const getOrganizationBio = (orgName: string): string => {
    switch (orgName) {
      case 'Technical University of Munich':
        return 'Leading technical university in Germany, offering world-class education in engineering, technology, and innovation.'
      case 'Student Theater Group':
        return 'Dynamic student theater company creating innovative performances and fostering artistic talent among young people.'
      case 'Youth Impact NGO':
        return 'Non-profit organization dedicated to empowering young people and creating positive social change in communities.'
      default:
        return 'Organization description not available'
    }
  }

  const decodeOrganizationName = (slug: string): string => {
    // Convert slug back to proper organization name
    const name = slug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
    
    // Fix specific organization names to match database
    if (name === 'Technical University Of Munich') {
      return 'Technical University of Munich'
    }
    if (name === 'Youth Impact Ngo') {
      return 'Youth Impact NGO'
    }
    if (name === 'Student Theater Group') {
      return 'Student Theater Group'
    }
    
    return name
  }

  const getEventDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return '1 day'
    return `${diffDays} days`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!organization) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Organization Not Found</h1>
          <Link href="/organizations" className="text-blue-600 hover:text-blue-700">
            ← Back to Organizations
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Back Button */}
        <Link 
          href="/organizations" 
          className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Organizations
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Organization Header */}
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-start space-x-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <Building className="h-8 w-8 text-blue-600" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{organization.organization_name}</h1>
                    <div className="flex items-center mb-2">
                      {(organization as any).is_verified ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                          <Award className="h-4 w-4 mr-2" />
                          Verified Organization
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                          Unverified Organization
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Organization Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {organization.location && (
                  <div className="flex items-center text-gray-600">
                    <MapPin className="h-5 w-5 mr-3 text-blue-600" />
                    <div>
                      <p className="font-medium">Location</p>
                      <p className="text-sm">{organization.location}</p>
                    </div>
                  </div>
                )}
                {organization.organization_website && (
                  <div className="flex items-center text-gray-600">
                    <Globe className="h-5 w-5 mr-3 text-blue-600" />
                    <div>
                      <p className="font-medium">Website</p>
                      <a 
                        href={organization.organization_website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-700 inline-flex items-center"
                      >
                        Visit Website
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Organization Description */}
              <div className="prose max-w-none">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">About This Organization</h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {organization.bio}
                </p>
              </div>
            </div>

            {/* Events Section */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Upcoming Events</h2>
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  {events.length} {events.length === 1 ? 'Event' : 'Events'}
                </span>
              </div>

              {events.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Upcoming Events</h3>
                  <p className="text-gray-500">
                    This organization doesn't have any upcoming events at the moment.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {events.map((event) => (
                    <div key={event.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{event.title}</h3>
                        <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-medium ml-2">
                          {event.category}
                        </span>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="h-4 w-4 mr-2 text-blue-600" />
                          <span>{formatDate(event.start_date)}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="h-4 w-4 mr-2 text-blue-600" />
                          <span>{getEventDuration(event.start_date, event.end_date)}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="h-4 w-4 mr-2 text-blue-600" />
                          <span className="truncate">{event.location}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Users className="h-4 w-4 mr-2 text-blue-600" />
                          <span>Up to {event.max_participants} participants</span>
                        </div>
                      </div>

                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                        {event.description}
                      </p>

                      <Link
                        href={`/events/${event.id}`}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors text-center block"
                      >
                        View Event Details
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-4 space-y-6" style={{ position: 'sticky', top: '1rem' }}>
              {/* Quick Stats */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Organization Stats</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Total Events</span>
                    <span className="font-semibold text-gray-900">{events.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Status</span>
                    {(organization as any).is_verified ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <Award className="h-3 w-3 mr-1" />
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Unverified
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Member Since</span>
                    <span className="font-semibold text-gray-900">2024</span>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              {organization.organization_website && (
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Get in Touch</h3>
                  <div className="space-y-3">
                    <a
                      href={organization.organization_website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-blue-600 hover:text-blue-700"
                    >
                      <Globe className="h-4 w-4 mr-2" />
                      Visit Website
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
