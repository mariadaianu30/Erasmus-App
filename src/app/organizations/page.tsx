'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import {
  Building,
  MapPin,
  Globe,
  Search,
  Users,
  Award,
  X,
  ChevronRight,
  Filter,
  CheckCircle2,
  AlertCircle,
  Star,
  ArrowDown,
  ChevronDown,
  Plus
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import GlobalBlueLine from '@/components/GlobalBlueLine'

// --- Types ---
interface Organization {
  id: string
  organization_name: string
  organization_website: string | null
  location: string | null
  bio: string | null
  website: string | null
  first_name: string | null
  last_name: string | null
  source?: string
  is_verified?: boolean
  type?: string // Derived/Simulated for UX
}

// --- Helper Components ---

/**
 * Rotating Star Circle for the Hero Title
 */
const StarCircle = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="relative flex items-center justify-center p-12 md:p-20">
      {/* Rotating Stars Container */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 w-full h-full"
      >
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{
              transform: `rotate(${i * 30}deg) translateY(-120px)`
            }}
          >
            <Star className="w-4 h-4 fill-[#FFE400] text-[#FFE400] drop-shadow-[0_0_8px_rgba(255,228,0,0.4)]" />
          </div>
        ))}
      </motion.div>

      {/* The Title Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}

/**
 * Highlights matching search text
 */
const HighlightText = ({ text, highlight }: { text: string; highlight: string }) => {
  if (!highlight.trim()) return <>{text}</>
  const regex = new RegExp(`(${highlight})`, 'gi')
  const parts = text.split(regex)
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-blue-100 text-blue-900 rounded-sm px-0.5">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  )
}

/**
 * Placeholder for Organization Logo
 */
const OrgAvatar = ({ name, className = "" }: { name: string; className?: string }) => {
  const colors = [
    'bg-blue-100 text-blue-600',
    'bg-indigo-100 text-indigo-600',
    'bg-purple-100 text-purple-600',
    'bg-emerald-100 text-emerald-600',
    'bg-amber-100 text-amber-600'
  ]
  // Stable color based on name
  const colorIndex = name.length % colors.length
  return (
    <div className={`flex items-center justify-center font-bold rounded-full shrink-0 ${colors[colorIndex]} ${className}`}>
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

/**
 * Skeleton Loader Component
 */
const OrgSkeleton = () => (
  <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm flex flex-col h-full animate-pulse">
    <div className="flex items-center gap-4 mb-6">
      <div className="w-14 h-14 rounded-full bg-gray-200" />
      <div className="flex-1">
        <div className="h-5 bg-gray-200 rounded-full w-3/4 mb-2" />
        <div className="h-3 bg-gray-200 rounded-full w-1/2" />
      </div>
    </div>
    <div className="space-y-3 mb-6 flex-1">
      <div className="h-3 bg-gray-200 rounded-full w-full" />
      <div className="h-3 bg-gray-200 rounded-full w-full" />
      <div className="h-3 bg-gray-200 rounded-full w-2/3" />
    </div>
    <div className="flex gap-2 mb-6">
      <div className="h-6 bg-gray-100 rounded-lg w-16" />
      <div className="h-6 bg-gray-100 rounded-lg w-20" />
    </div>
    <div className="h-12 bg-gray-200 rounded-2xl w-full" />
  </div>
)

// --- Main Page Component ---

const slugifyOrganizationName = (name: string) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Advanced Filters (Revised for Multi-Select)
  const [showFilters, setShowFilters] = useState(false)
  const [filterLocations, setFilterLocations] = useState<string[]>([])
  const [filterTypes, setFilterTypes] = useState<string[]>([])
  const [filterVerifiedOnly, setFilterVerifiedOnly] = useState(false)

  // Pagination Support
  const [visibleCount, setVisibleCount] = useState(9)

  // Search Debounce Implementation
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
      // Reset pagination when search changes
      setVisibleCount(9)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    fetchOrganizations()
  }, [])

  const fetchOrganizations = async () => {
    try {
      const { data, error } = await supabase
        .from('organization_view')
        .select('*')
        .order('organization_name', { ascending: true })

      if (error) {
        console.error('Organizations query error:', error)
        setOrganizations([])
        return
      }

      const organizationsWithStatus = (data || []).map(org => {
        // Simple heuristic for "Type" just for UX polish
        let type = 'NGO'
        const name = org.organization_name.toLowerCase()
        if (name.includes('university') || name.includes('school') || name.includes('academy')) type = 'Education'
        if (name.includes('corp') || name.includes('inc') || name.includes('startup') || name.includes('limited')) type = 'Enterprise'
        if (name.includes('foundation') || name.includes('association')) type = 'Foundation'

        return {
          ...org,
          is_verified: org.is_verified || false,
          type
        }
      })

      setOrganizations(organizationsWithStatus)
    } catch (error) {
      console.error('Organizations fetch error:', error)
      setOrganizations([])
    } finally {
      setLoading(false)
    }
  }

  // Get unique locations for filter
  const uniqueLocations = useMemo(() => {
    const locs = Array.from(new Set(organizations.map(o => o.location).filter(Boolean)))
    return locs.sort()
  }, [organizations])

  const orgTypes = ['NGO', 'Education', 'Enterprise', 'Foundation']

  const filteredOrganizations = useMemo(() => {
    return organizations.filter(org => {
      // Search logic
      const searchMatch = !debouncedSearch || (
        org.organization_name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        (org.bio && org.bio.toLowerCase().includes(debouncedSearch.toLowerCase())) ||
        (org.location && org.location.toLowerCase().includes(debouncedSearch.toLowerCase()))
      )

      // Multi-select location logic
      const locationMatch = filterLocations.length === 0 || (org.location && filterLocations.includes(org.location))

      // Multi-select type logic
      const typeMatch = filterTypes.length === 0 || (org.type && filterTypes.includes(org.type))

      // Verified logic
      const verifiedMatch = !filterVerifiedOnly || org.is_verified

      return searchMatch && locationMatch && verifiedMatch && typeMatch
    })
  }, [organizations, debouncedSearch, filterLocations, filterTypes, filterVerifiedOnly])

  const toggleLocation = (location: string) => {
    setFilterLocations(prev =>
      prev.includes(location) ? prev.filter(l => l !== location) : [...prev, location]
    )
    setVisibleCount(9) // Reset pagination on filter change
  }

  const toggleType = (type: string) => {
    setFilterTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    )
    setVisibleCount(9) // Reset pagination on filter change
  }

  const clearFilters = () => {
    setSearchTerm('')
    setFilterLocations([])
    setFilterTypes([])
    setFilterVerifiedOnly(false)
    setVisibleCount(9)
  }

  const scrollToCatalog = () => {
    const catalogElement = document.getElementById('organizations-catalog')
    if (catalogElement) {
      catalogElement.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="min-h-screen bg-[#fdfbf6] font-sans relative overflow-x-hidden">

      {/* Background Patterns (Shared design language) */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* EU Stars circle watermark (top-right, 20% opacity) */}
        <div className="absolute -top-20 -right-20 opacity-20 rotate-12 scale-150">
          <svg width="400" height="400" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
            {Array.from({ length: 12 }).map((_, i) => (
              <path
                key={i}
                d="M12 2.1L14.7 10.3H23.5L16.4 15.4L19.1 23.6L12 18.5L4.9 23.6L7.6 15.4L0.5 10.3H9.3L12 2.1Z"
                fill="#FFD700"
                transform={`translate(${200 + 120 * Math.cos(i * Math.PI / 6) - 12}, ${200 + 120 * Math.sin(i * Math.PI / 6) - 12})`}
              />
            ))}
          </svg>
        </div>

        {/* EU Stars circle watermark (center-left, 10% opacity) */}
        <div className="absolute top-1/2 -left-20 opacity-10 -translate-y-1/2 -rotate-12 scale-125">
          <svg width="400" height="400" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
            {Array.from({ length: 12 }).map((_, i) => (
              <path
                key={i}
                d="M12 2.1L14.7 10.3H23.5L16.4 15.4L19.1 23.6L12 18.5L4.9 23.6L7.6 15.4L0.5 10.3H9.3L12 2.1Z"
                fill="#FFD700"
                transform={`translate(${200 + 120 * Math.cos(i * Math.PI / 6) - 12}, ${200 + 120 * Math.sin(i * Math.PI / 6) - 12})`}
              />
            ))}
          </svg>
        </div>

        {/* Blue Radial Blobs */}
        <div className="absolute top-1/4 -right-40 w-[600px] h-[600px] bg-[#1a2e6b] opacity-5 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-50/50 rounded-full blur-3xl opacity-60" />
      </div>

      <GlobalBlueLine initialProgress={0.27} />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2 }}
        className="relative z-10 flex flex-col"
      >
        {/* HERO SECTION: FULL SCREEN */}
        <section className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden pt-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="flex flex-col items-center text-center max-w-4xl"
          >
            <StarCircle>
              <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-[#003399] tracking-tight leading-none text-center drop-shadow-sm">
                Trusted<br />Organizations
              </h1>
            </StarCircle>

            <p className="mt-6 text-base md:text-xl text-blue-900/40 font-medium max-w-xl leading-relaxed italic">
              Connect with verified partners and official organizations driving real-world impact across the Erasmus+ network.
            </p>

            {/* Floating Search Bar Focal Point (Styled with Blue requested) */}
            <div className="w-full max-w-2xl mt-12 relative group">
              <div className="relative z-30 flex flex-col gap-6 items-center">
                <div className="w-full relative group/search">
                  <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 text-blue-600 h-5 w-5 group-focus-within/search:scale-110 transition-transform" />
                  <input
                    type="text"
                    placeholder="Search Organizations"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-14 pr-12 py-4 bg-white text-blue-700 placeholder:text-blue-400 placeholder:opacity-60 rounded-2xl focus:ring-4 focus:ring-blue-100/50 transition-all outline-none text-lg font-bold shadow-xl border border-blue-50/50"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-5 top-1/2 transform -translate-y-1/2 text-gray-200 hover:text-red-400"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* CATALOG SECTION */}
        <div id="organizations-catalog" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative z-10 scroll-mt-20">

          {/* Controls Bar: Filters & Reset (Integrated elegantly) */}
          <div className="mb-16 flex flex-col gap-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex flex-col gap-2">
                <h2 className="text-3xl font-black text-[#003399] tracking-tighter uppercase">Our organizations</h2>
                <div className="h-1.5 w-16 bg-amber-400 rounded-full"></div>
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-3 px-8 py-3.5 rounded-2xl transition-all duration-300 font-black uppercase text-[9px] tracking-[0.2em] shadow-xl hover:-translate-y-1 border-2 ${showFilters || filterLocations.length > 0 || filterTypes.length > 0 || filterVerifiedOnly
                    ? 'bg-[#003399] text-white border-[#003399]'
                    : 'bg-white text-[#003399] border-blue-50'
                  }`}
              >
                <Filter className="h-4 w-4" />
                <span>Refine List</span>
                {(filterLocations.length > 0 || filterTypes.length > 0 || filterVerifiedOnly) && (
                  <span className="bg-amber-400 text-blue-900 rounded-full w-5 h-5 flex items-center justify-center ml-1 border-2 border-white text-[9px] font-black">
                    {[filterLocations.length > 0, filterTypes.length > 0, filterVerifiedOnly].filter(Boolean).length}
                  </span>
                )}
              </button>
            </div>

            {/* Expanded Filters (Multi-Select Tags) */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 p-10 bg-white/80 backdrop-blur-xl border border-blue-50 rounded-[3rem] shadow-2xl overflow-hidden"
                >
                  <div className="space-y-5">
                    <label className="text-[10px] font-black text-[#003399]/40 uppercase tracking-widest pl-1">Global Locations</label>
                    <div className="flex flex-wrap gap-2">
                      {uniqueLocations.map(loc => (
                        <button
                          key={loc}
                          onClick={() => toggleLocation(loc)}
                          className={`px-4 py-2 rounded-xl text-[10px] font-bold transition-all border ${filterLocations.includes(loc)
                              ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200'
                              : 'bg-gray-50 text-gray-400 border-transparent hover:bg-gray-100 hover:text-gray-600'
                            }`}
                        >
                          {loc}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-5">
                    <label className="text-[10px] font-black text-[#003399]/40 uppercase tracking-widest pl-1">Specialization</label>
                    <div className="flex flex-wrap gap-2">
                      {orgTypes.map(type => (
                        <button
                          key={type}
                          onClick={() => toggleType(type)}
                          className={`px-4 py-2 rounded-xl text-[10px] font-bold transition-all border ${filterTypes.includes(type)
                              ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200'
                              : 'bg-gray-50 text-gray-400 border-transparent hover:bg-gray-100 hover:text-gray-600'
                            }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col justify-between gap-6">
                    <div className="space-y-5">
                      <label className="text-[10px] font-black text-[#003399]/40 uppercase tracking-widest pl-1">Verification</label>
                      <label className="flex items-center gap-4 cursor-pointer group w-full p-4 bg-gray-50 rounded-2xl hover:bg-blue-50 transition-colors">
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={filterVerifiedOnly}
                            onChange={(e) => setFilterVerifiedOnly(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-12 h-6 bg-gray-300 rounded-full peer peer-checked:bg-[#003399] transition-all after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-6"></div>
                        </div>
                        <span className="text-[11px] font-black text-[#003399]/40 uppercase tracking-widest group-hover:text-[#003399] transition-colors">Verified Only</span>
                      </label>
                    </div>

                    <button
                      onClick={clearFilters}
                      className="w-full p-4 text-[10px] font-black text-red-400 bg-red-50 rounded-2xl uppercase tracking-widest hover:bg-red-100 hover:text-red-600 transition-colors"
                    >
                      Clear Selection
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Status Indicator */}
          {debouncedSearch && (
            <div className="mb-10 animate-in fade-in duration-500">
              <p className="text-xs text-blue-900/40 font-black uppercase tracking-widest">
                Found <span className="text-[#003399]">{filteredOrganizations.length}</span> Results for &ldquo;{debouncedSearch}&rdquo;
              </p>
            </div>
          )}

          {/* Main Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => <OrgSkeleton key={i} />)}
            </div>
          ) : filteredOrganizations.length === 0 ? (
            <div className="py-32 text-center bg-white/50 backdrop-blur-sm rounded-[4rem] border-4 border-dashed border-blue-50">
              <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                <Building className="h-10 w-10 text-blue-200" />
              </div>
              <h3 className="text-2xl font-black text-blue-900/20 mb-4 uppercase tracking-wider">No Partners Found</h3>
              <p className="text-blue-900/30 max-w-sm mx-auto font-black mb-10 uppercase text-[9px] tracking-widest leading-loose">
                Your current filters yielded no matches. Reset your parameters to explore the full network.
              </p>
              <button
                onClick={clearFilters}
                className="px-10 py-5 bg-[#003399] text-white rounded-2xl font-black uppercase text-[9px] tracking-widest shadow-xl active:scale-95 transition-all"
              >
                Reset Parameters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredOrganizations.slice(0, visibleCount).map((org) => {
                  const website = org.organization_website ?? org.website ?? undefined
                  const organizationIdentifier = org.id ?? slugifyOrganizationName(org.organization_name)

                  return (
                    <div
                      key={org.id}
                      className="group bg-white rounded-[32px] border border-blue-50 shadow-sm hover:shadow-[0_40px_80px_rgba(0,51,153,0.08)] hover:-translate-y-3 transition-all duration-700 flex flex-col h-full overflow-hidden relative z-20"
                    >
                      <div className="p-10 flex flex-col h-full relative">
                        {/* Header Info */}
                        <div className="flex items-start justify-between mb-8">
                          <OrgAvatar name={org.organization_name} className="w-16 h-16 text-2xl shadow-inner border-4 border-gray-50" />
                          <div className="flex flex-col items-end gap-2">
                            {org.is_verified && (
                              <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase tracking-widest border border-emerald-100 shadow-sm">
                                <CheckCircle2 className="h-3 w-3" />
                                Verified
                              </span>
                            )}
                            <span className="px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 text-[8px] font-black uppercase tracking-widest border border-blue-100">
                              {org.type}
                            </span>
                          </div>
                        </div>

                        <div className="mb-6 flex-1">
                          <h3 className="text-2xl font-black text-blue-950 leading-[1.1] mb-4 group-hover:text-blue-600 transition-colors line-clamp-2 tracking-tight">
                            <HighlightText text={org.organization_name} highlight={debouncedSearch} />
                          </h3>

                          <div className="flex items-center text-[10px] font-black text-gray-400 mb-6 gap-2 uppercase tracking-widest">
                            <MapPin className="h-4 w-4 shrink-0 text-blue-400" />
                            <HighlightText text={org.location || 'Location Pending'} highlight={debouncedSearch} />
                          </div>

                          <p className="text-gray-500 text-sm leading-relaxed font-medium line-clamp-3 mb-8 italic">
                            {org.bio ? (
                              <HighlightText text={org.bio} highlight={debouncedSearch} />
                            ) : (
                              `A dedicated ${org.type || 'organization'} specialized in creating impactful opportunities within the Erasmus+ community.`
                            )}
                          </p>
                        </div>

                        {/* Metadata */}
                        <div className="pt-8 border-t border-gray-50 flex items-center justify-between mt-auto">
                          <div className="flex -space-x-3">
                            {[...Array(3)].map((_, i) => (
                              <div key={i} className="w-9 h-9 rounded-full border-4 border-white bg-gray-50 flex items-center justify-center shadow-sm">
                                <Users className="h-3.5 w-3.5 text-gray-300" />
                              </div>
                            ))}
                            <div className="w-9 h-9 rounded-full border-4 border-white bg-blue-50 flex items-center justify-center text-[9px] font-black text-blue-600 shadow-sm">
                              +12
                            </div>
                          </div>

                          <Link
                            href={`/organizations/${organizationIdentifier}`}
                            className="flex items-center gap-2 text-[#003399] font-black text-[10px] uppercase tracking-[0.2em] group/btn transition-all relative z-40 bg-blue-50 px-5 py-2.5 rounded-xl hover:bg-blue-600 hover:text-white"
                          >
                            Profile
                            <ChevronRight className="h-4 w-4 transform group-hover/btn:translate-x-1 transition-transform" />
                          </Link>
                        </div>

                        {/* Click Overlay */}
                        <Link
                          href={`/organizations/${organizationIdentifier}`}
                          className="absolute inset-0 z-10"
                          aria-label={`View ${org.organization_name}`}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Load More Organizations Button */}
              {visibleCount < filteredOrganizations.length && (
                <div className="mt-20 flex justify-center">
                  <button
                    onClick={() => setVisibleCount(prev => prev + 3)}
                    className="group relative px-12 py-5 bg-white border-2 border-blue-100 rounded-3xl overflow-hidden active:scale-95 transition-all shadow-xl hover:border-blue-200"
                  >
                    <div className="absolute inset-0 bg-blue-50 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                    <span className="relative z-10 text-[10px] font-black uppercase tracking-[0.3em] text-[#003399] flex items-center gap-3">
                      <Plus className="w-4 h-4" />
                      Load more organizations
                    </span>
                  </button>
                </div>
              )}
            </>
          )}

          {/* Footer Stats */}
          {!loading && filteredOrganizations.length > 0 && (
            <div className="mt-32 pt-16 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-10 text-gray-400 relative z-20">
              <p className="text-[10px] font-black uppercase tracking-[0.2em]">
                Displaying <span className="text-blue-900">{Math.min(visibleCount, filteredOrganizations.length)}</span> of <span className="text-blue-900">{filteredOrganizations.length}</span> Verified Partners
              </p>
              <div className="flex gap-4">
                <div className="flex items-center gap-3 px-6 py-3 bg-white rounded-2xl shadow-xl border border-gray-50">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Global Live Directory</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
