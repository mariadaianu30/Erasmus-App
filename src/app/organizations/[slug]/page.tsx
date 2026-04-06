'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Calendar, ArrowLeft, Award, MapPin, Globe, Users, ArrowUpRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
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
    <div className="min-h-screen bg-[#fdfbf6] flex flex-col md:flex-row relative font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Hiding global navbar for this specific specialized view */}
      <style dangerouslySetInnerHTML={{ __html: `nav { display: none !important; }` }} />

      {/* Left Sidebar: NGO Profile (Fixed, White, Clean) */}
      <motion.aside
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full md:w-[30%] bg-white text-[#003399] p-8 md:p-12 md:fixed md:left-0 md:top-0 md:h-screen overflow-y-auto shadow-[20px_0_60px_rgba(0,51,153,0.05)] z-50 flex flex-col border-r border-blue-50/50"
      >
        <Link 
          href="/organizations" 
          className="inline-flex items-center text-[10px] font-black uppercase tracking-[0.3em] text-blue-900/30 hover:text-blue-600 mb-12 transition-all group"
        >
          <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          BACK TO ORGANIZATIONS
        </Link>

        <div className="flex-1">
          <div className="flex flex-col gap-6 mb-10">
            <div className="space-y-1">
              <p className="text-[9px] font-black uppercase tracking-[0.4em] text-amber-500 mb-2">Verified Partner</p>
              <h1 className="text-3xl md:text-4xl font-black tracking-tighter leading-[0.95] mb-4 text-[#003399]">
                {organization.organization_name}
              </h1>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {organization.is_verified ? (
                <span className="inline-flex items-center px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest bg-blue-50 text-[#003399] border border-blue-100/50 shadow-sm">
                  <Award className="h-3.5 w-3.5 mr-2 text-amber-500" />
                  Official Agency
                </span>
              ) : (
                <span className="inline-flex items-center px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest bg-gray-50 text-gray-400 border border-gray-100 uppercase italic">
                  Pending Verification
                </span>
              )}
            </div>
          </div>

          <div className="space-y-6 text-sm text-[#003399]/70 font-medium">
            {organization.location && (
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-blue-50/30 border border-blue-100/20">
                <div className="p-2 bg-white rounded-lg shadow-sm border border-blue-50">
                  <MapPin className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-[8px] uppercase tracking-widest text-[#003399]/30 mb-1">Headquarters</p>
                  <span className="leading-relaxed text-[#003399] text-xs font-bold">{organization.location}</span>
                </div>
              </div>
            )}

            {organization.organization_website && (
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-blue-50/30 border border-blue-100/20">
                <div className="p-2 bg-white rounded-lg shadow-sm border border-blue-50">
                  <Globe className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-[8px] uppercase tracking-widest text-[#003399]/30 mb-1">Digital Presence</p>
                  <a
                    href={organization.organization_website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#003399] hover:text-blue-800 transition-colors break-all font-black uppercase text-[9px] tracking-widest flex items-center gap-2 group/link"
                  >
                    Visit Website
                    <ArrowUpRight className="h-3 w-3 opacity-0 group-hover/link:opacity-100 transition-all -translate-y-1" />
                  </a>
                </div>
              </div>
            )}

            {(organization.first_name || organization.last_name) && (
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-blue-50/30 border border-blue-100/20">
                <div className="p-2 bg-white rounded-lg shadow-sm border border-blue-50">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-[8px] uppercase tracking-widest text-[#003399]/30 mb-1">Representative</p>
                  <p className="text-[#003399] uppercase font-black tracking-tight text-xs">
                    {[organization.first_name, organization.last_name].filter(Boolean).join(' ')}
                  </p>
                </div>
              </div>
            )}
          </div>

          {organization.bio && (
            <div className="mt-12 pt-8 border-t border-blue-50 relative">
              <div className="absolute -top-3 left-0 px-4 bg-white text-[8px] font-black uppercase tracking-[0.5em] text-[#003399]/20">Mission</div>
              <p className="text-[#003399]/70 text-base leading-relaxed font-serif italic tracking-wide">
                "{organization.bio}"
              </p>
            </div>
          )}
        </div>

        <div className="mt-auto pt-8 border-t border-blue-50 flex flex-col gap-4">
          <div className="flex justify-between items-center text-[8px] font-black text-[#003399]/20 uppercase tracking-[0.5em]">
            <span>Est. 2024</span>
            <span>Connect Program</span>
          </div>
        </div>
      </motion.aside>

      {/* Right Content: Hosted Events (Scrollable Area, Pushed by fixed Sidebar) */}
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="flex-1 md:ml-[30%] p-8 md:p-16 flex flex-col relative z-10"
      >
        <div className="max-w-4xl w-full mx-auto">
          <div className="flex flex-col md:flex-row items-baseline justify-between mb-16 gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <div className="h-8 w-1.5 bg-[#003399] rounded-full"></div>
                <h2 className="text-3xl md:text-4xl font-black text-[#003399] uppercase tracking-tighter leading-none">Catalog</h2>
              </div>
              <p className="text-[9px] font-black text-[#003399]/20 uppercase tracking-[0.4em] ml-6">Available Opportunities</p>
            </div>
            <div className="bg-white px-6 py-3 rounded-2xl shadow-xl shadow-blue-900/[0.03] flex flex-col items-end border border-blue-50/50">
              <span className="text-2xl font-black text-[#003399] tracking-tighter leading-none">{events.length}</span>
              <span className="text-[7px] font-black text-[#003399]/30 uppercase tracking-[0.2em] mt-1">Active Events</span>
            </div>
          </div>

          {events.length === 0 ? (
            <div className="text-center py-32 bg-white rounded-[3rem] border-2 border-dashed border-blue-100/30 flex flex-col items-center">
              <Calendar className="h-16 w-16 text-blue-100 mb-6 opacity-20" />
              <h3 className="text-lg font-black text-[#003399]/20 uppercase tracking-widest mb-2">No Active Programs</h3>
              <p className="text-[8px] font-black text-[#003399]/10 uppercase tracking-[0.3em]">Check back later for new arrivals</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8">
              <AnimatePresence>
                {events.map((event, index) => (
                  <motion.div 
                    key={event.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ delay: index * 0.05, duration: 0.5 }}
                    className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-[0_15px_60px_rgba(0,51,153,0.03)] hover:shadow-[0_30px_90px_rgba(0,51,153,0.06)] transition-all duration-700 group relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-8 hover:-translate-y-2 border border-transparent hover:border-blue-50"
                  >
                    {/* Subtle numbering for boutique feel */}
                    <div className="absolute top-6 right-10 text-[40px] font-black text-blue-50/50 leading-none select-none group-hover:text-amber-50/50 transition-colors">
                      {(index + 1).toString().padStart(2, '0')}
                    </div>

                    <div className="flex-1 space-y-6 relative z-10 text-center md:text-left">
                      <div className="flex items-center justify-center md:justify-start gap-3">
                        <span className="bg-blue-50 text-[#003399] px-5 py-1.5 rounded-full text-[8.5px] font-black uppercase tracking-[0.2em] shadow-sm">
                          {event.category || 'Erasmus+'}
                        </span>
                      </div>
                      
                      <h3 className="text-2xl md:text-3xl font-black text-[#003399] leading-tight tracking-tighter group-hover:text-blue-800 transition-colors max-w-sm">
                        {event.title}
                      </h3>

                      <div className="flex flex-wrap justify-center md:justify-start gap-6 opacity-40">
                        <div className="flex items-center text-[9px] font-black text-[#003399] uppercase tracking-widest">
                          <Calendar className="h-3.5 w-3.5 mr-2 text-amber-500" />
                          {formatDate(event.start_date)}
                        </div>
                        {event.location && (
                          <div className="flex items-center text-[9px] font-black text-[#003399] uppercase tracking-widest">
                            <MapPin className="h-3.5 w-3.5 mr-2 text-blue-400" />
                            {event.location}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="relative z-10 w-full md:w-auto">
                      <Link
                        href={`/events/${event.id}`}
                        className="bg-[#003399] text-white px-10 py-5 rounded-2xl font-black uppercase text-[9px] tracking-[0.2em] hover:bg-amber-500 shadow-xl shadow-blue-900/10 hover:shadow-amber-200 transition-all flex items-center justify-center group/btn"
                      >
                        Details
                        <ArrowUpRight className="h-4 w-4 ml-2 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </motion.main>
    </div>
  )
}

