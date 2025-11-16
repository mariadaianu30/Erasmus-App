'use client'

import { useState, useEffect } from 'react'
import type { CSSProperties } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Globe, MapPin, Calendar, Users, Award, ExternalLink, Clock, Mail } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'

interface Organization {
  organization_name: string
  organization_website: string | null
  location: string | null
  bio: string | null
  is_verified?: boolean
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

const backgroundImages = [
  'https://i.pinimg.com/1200x/e0/b3/93/e0b39350a86b7195925e6e4dc7446758.jpg',
  'https://i.pinimg.com/1200x/34/ef/db/34efdbfee7989d49803ef1d5bc1adc3f.jpg',
  'https://i.pinimg.com/736x/6e/4d/e4/6e4de4dd1106a0cf1901b316ea9aa642.jpg',
  'https://i.pinimg.com/1200x/4c/47/1b/4c471b3cfd52024f19f96a46e27e0449.jpg',
  'https://i.pinimg.com/736x/d6/6c/06/d66c0688dcd26ca908e75a69a9ec6315.jpg',
  'https://i.pinimg.com/1200x/45/f8/c2/45f8c2b8224cd98792fee10cdbb95f98.jpg',
  'https://i.pinimg.com/736x/b4/64/0b/b4640be4045f71dba498c33e659b56eb.jpg',
  'https://i.pinimg.com/1200x/d2/18/bc/d218bcc32655fdd728126750cf709a46.jpg',
  'https://i.pinimg.com/736x/09/68/4d/09684d9369ba34bdade9f0c5c22a8f24.jpg',
  'https://i.pinimg.com/736x/33/50/8f/33508fb44f45028260b5c5e192e08947.jpg',
  'https://i.pinimg.com/1200x/f4/38/7e/f4387ea8137055f9dcb5dec9e968b508.jpg',
  'https://i.pinimg.com/1200x/fd/c5/c8/fdc5c8109bbdd45b29082820c87eef4a.jpg',
  'https://i.pinimg.com/736x/93/7c/8b/937c8b80aef9bd2e3611d25c8f40f02d.jpg',
  'https://i.pinimg.com/736x/33/05/dd/3305dd2637a831986a18079d6bee0bb2.jpg',
  'https://i.pinimg.com/736x/14/de/dd/14dedd7edd773929ff6d92ffca412cf1.jpg',
  'https://i.pinimg.com/736x/b8/6f/4b/b86f4b193d888aad448185a32d4d75d0.jpg',
  'https://i.pinimg.com/736x/6c/33/45/6c3345f6726089958e79b7d9ac8c01fb.jpg',
  'https://i.pinimg.com/1200x/b5/a6/4d/b5a64da8bef038cf288ae480e020eb39.jpg',
  'https://i.pinimg.com/736x/45/f5/f0/45f5f0f80f12a0fdd529afa61d5fa4e7.jpg',
  'https://i.pinimg.com/736x/e2/eb/41/e2eb41946e29720e81e8172b12f760a4.jpg',
  'https://i.pinimg.com/736x/6f/49/a1/6f49a10811ea7529eec4293e7d6af0ec.jpg',
  'https://i.pinimg.com/1200x/5a/da/34/5ada34e2aca22aaab6db7cf689bc6546.jpg',
  'https://i.pinimg.com/736x/0a/6c/a1/0a6ca1ffb65847be8e71fcb161ce704d.jpg'
]

const barHeights = backgroundImages.map((_, idx) => 40 + (idx % 6) * 10)
const barWidths = backgroundImages.map((_, idx) => 3 + (idx % 5))

const decodeOrganizationName = (slug: string) => {
  const formatted = slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

  if (formatted === 'Technical University Of Munich') return 'Technical University of Munich'
  if (formatted === 'Youth Impact Ngo') return 'Youth Impact NGO'
  if (formatted === 'Student Theater Group') return 'Student Theater Group'

  return formatted
}

const getEventDuration = (startDate: string, endDate: string) => {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diffTime = Math.abs(end.getTime() - start.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return diffDays === 1 ? '1 day' : `${diffDays} days`
}

export default function OrganizationDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  const slugParam = Array.isArray(params?.slug) ? params?.slug[0] : params?.slug

  useEffect(() => {
    if (!slugParam) {
      return
    }

    const fetchOrganizationData = async () => {
      try {
        const organizationName = decodeOrganizationName(slugParam)

        const { data: orgData, error: orgError } = await supabase
          .from('organization_view')
          .select('*')
          .ilike('organization_name', organizationName)
          .single()

        if (orgError || !orgData) {
          router.push('/organizations')
          return
        }

        setOrganization({
          organization_name: orgData.organization_name,
          organization_website: orgData.organization_website,
          location: orgData.location || 'Location not specified',
          bio: orgData.bio || 'No description available',
          is_verified: orgData.is_verified || false
        })

        const { data: eventsData, error: eventsError } = await supabase
          .from('events')
          .select('*')
          .ilike('organization_name', organizationName)
          .eq('is_published', true)
          .gte('start_date', new Date().toISOString())
          .order('start_date', { ascending: true })

        if (!eventsError && eventsData) {
          setEvents(eventsData)
        } else {
          setEvents([])
        }
      } catch (error) {
        router.push('/organizations')
      } finally {
        setLoading(false)
      }
    }

    fetchOrganizationData()
  }, [router, slugParam])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy-600"></div>
      </div>
    )
  }

  if (!organization) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-navy-900 mb-4">Organization Not Found</h1>
          <Link href="/organizations" className="text-navy-600 hover:text-navy-700">
            ← Back to Organizations
          </Link>
        </div>
      </div>
    )
  }

  const handleContact = () => {
    if (organization.organization_website) {
      window.open(organization.organization_website, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="fixed inset-0 flex items-end justify-center z-0">
        <div className="flex h-full w-full items-end">
          {backgroundImages.map((imageUrl, idx) => {
            const animIndex = idx % 3
            const animationDuration = 8 + (idx % 4) * 2
            const animationDelay = idx * 0.2

            return (
              <div
                key={idx}
                className="relative overflow-hidden"
                style={{
                  width: `${barWidths[idx]}%`,
                  height: `${barHeights[idx]}%`,
                  animationName: `float-${animIndex}`,
                  animationDuration: `${animationDuration}s`,
                  animationTimingFunction: 'ease-in-out',
                  animationIterationCount: 'infinite',
                  animationDelay: `${animationDelay}s`
                } as CSSProperties}
              >
                <img
                  src={imageUrl}
                  alt=""
                  className="w-full h-full object-cover"
                  style={{
                    opacity: 0.45,
                    filter: 'brightness(0.85)'
                  }}
                />
              </div>
            )
          })}
        </div>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-6xl">
          <Link href="/organizations" className="inline-flex items-center text-navy-600 hover:text-navy-700 mb-6 relative z-20">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Organizations
          </Link>

          <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 relative z-10">
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl font-bold text-navy-900 mb-4">{organization.organization_name}</h1>
              {organization.is_verified ? (
                <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  <Award className="h-4 w-4 mr-2" />
                  Verified Organization
                </span>
              ) : (
                <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                  Unverified Organization
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="space-y-6">
                  <div className="space-y-4">
                    {organization.location && (
                      <div className="flex items-center text-navy-700">
                        <MapPin className="h-5 w-5 mr-3 text-navy-600" />
                        <div>
                          <p className="font-medium text-navy-900">Location</p>
                          <p className="text-sm text-navy-700">{organization.location}</p>
                        </div>
                      </div>
                    )}
                    {organization.organization_website && (
                      <div className="flex items-center text-navy-700">
                        <Globe className="h-5 w-5 mr-3 text-navy-600" />
                        <div>
                          <p className="font-medium text-navy-900">Website</p>
                          <a
                            href={organization.organization_website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-navy-600 hover:text-navy-700 inline-flex items-center"
                          >
                            Visit Website
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-navy-200 pt-6">
                    <h3 className="text-xl font-semibold text-navy-900 mb-3">About This Organization</h3>
                    <p className="text-navy-700 leading-relaxed whitespace-pre-line">{organization.bio}</p>
                  </div>

                  <div className="border-t border-navy-200 pt-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold text-navy-900">Upcoming Events</h2>
                      <span className="bg-navy-100 text-navy-800 px-3 py-1 rounded-full text-sm font-medium">
                        {events.length} {events.length === 1 ? 'Event' : 'Events'}
                      </span>
                    </div>

                    {events.length === 0 ? (
                      <div className="text-center py-12">
                        <Calendar className="h-12 w-12 text-navy-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-navy-900 mb-2">No Upcoming Events</h3>
                        <p className="text-navy-700">This organization doesn't have any upcoming events at the moment.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {events.map((event) => (
                          <div key={event.id} className="border border-navy-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
                            <div className="flex items-start justify-between mb-3">
                              <h3 className="text-lg font-semibold text-navy-900 line-clamp-2">{event.title}</h3>
                              <span className="bg-navy-100 text-navy-800 px-2 py-1 rounded text-xs font-medium ml-2">{event.category}</span>
                            </div>

                            <div className="space-y-2 mb-4">
                              <div className="flex items-center text-sm text-navy-700">
                                <Calendar className="h-4 w-4 mr-2 text-navy-600" />
                                <span>{formatDate(event.start_date)}</span>
                              </div>
                              <div className="flex items-center text-sm text-navy-700">
                                <Clock className="h-4 w-4 mr-2 text-navy-600" />
                                <span>{getEventDuration(event.start_date, event.end_date)}</span>
                              </div>
                              <div className="flex items-center text-sm text-navy-700">
                                <MapPin className="h-4 w-4 mr-2 text-navy-600" />
                                <span className="truncate">{event.location}</span>
                              </div>
                              <div className="flex items-center text-sm text-navy-700">
                                <Users className="h-4 w-4 mr-2 text-navy-600" />
                                <span>Up to {event.max_participants} participants</span>
                              </div>
                            </div>

                            <p className="text-navy-700 text-sm mb-4 line-clamp-3">{event.description}</p>

                            <Link
                              href={`/events/${event.id}`}
                              className="w-full bg-navy-900 text-white py-2 px-4 rounded-lg font-semibold hover:bg-navy-800 transition-colors text-center block"
                            >
                              View Event Details
                            </Link>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-1">
                <div className="sticky top-8 space-y-6">
                  <div className="bg-white rounded-lg shadow-sm border border-navy-200 p-6">
                    <h3 className="text-lg font-semibold text-navy-900 mb-4">Organization Stats</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-navy-700">Total Events</span>
                        <span className="font-semibold text-navy-900">{events.length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-navy-700">Status</span>
                        {organization.is_verified ? (
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
                        <span className="text-navy-700">Member Since</span>
                        <span className="font-semibold text-navy-900">2024</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-xl border-2 border-navy-300 p-6 relative z-10 backdrop-blur-sm overflow-hidden" style={{ backgroundColor: 'rgba(255, 255, 255, 0.98)' }}>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-navy-900 mb-1">Contact Organization</h3>
                        <p className="text-sm text-navy-800 font-medium">Get in touch with this organization</p>
                      </div>
                      <button
                        onClick={handleContact}
                        disabled={!organization.organization_website}
                        className="bg-white border-2 border-navy-900 text-navy-900 py-2.5 px-5 rounded-lg font-semibold hover:bg-navy-50 transition-colors whitespace-nowrap text-center sm:text-left shadow-md text-sm sm:text-base w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Send Message
                      </button>
                    </div>

                    <div className="mt-4 space-y-3 pt-4 border-t border-navy-200">
                      {organization.organization_website && (
                        <a
                          href={organization.organization_website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-navy-700 hover:text-navy-900 text-sm font-medium"
                        >
                          <Globe className="h-4 w-4 mr-2 text-navy-600" />
                          Visit Website
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      )}
                      <div className="flex items-center text-navy-700 text-sm">
                        <Mail className="h-4 w-4 mr-2 text-navy-600" />
                        <span>{organization.organization_website ? 'Contact via website' : 'Contact details unavailable'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
