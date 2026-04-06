'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, MapPin, Users, Clock, Search, Filter, X, SlidersHorizontal, Heart, ArrowUp, LayoutGrid, List, ChevronDown, ArrowUpRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { EventCardSkeleton } from '@/components/SkeletonLoader'
import GlobalBlueLine from '@/components/GlobalBlueLine'



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
  photo_url?: string | null
  application_deadline?: string | null
  working_language?: string | null
  event_type?: string | null
  country?: string | null
  created_at: string
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Multi-select states
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedMonths, setSelectedMonths] = useState<string[]>([])
  const [selectedYears, setSelectedYears] = useState<string[]>([])
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([])
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([])
  const [selectedCountries, setSelectedCountries] = useState<string[]>([])

  const [locationFilter, setLocationFilter] = useState('')
  const [categories, setCategories] = useState<string[]>([])
  const [availableCountries, setAvailableCountries] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [favorites, setFavorites] = useState<string[]>([])
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [viewColumns, setViewColumns] = useState(3)
  const [visibleRows, setVisibleRows] = useState(3)

  useEffect(() => {
    fetchEvents()
    const savedFavorites = localStorage.getItem('favorite_events')
    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites))
      } catch (e) {
        console.error('Failed to parse favorites', e)
      }
    }

    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Manage body class for Navbar shift
  useEffect(() => {
    if (showFilters) {
      document.body.classList.add('sidebar-open')
    } else {
      document.body.classList.remove('sidebar-open')
    }
  }, [showFilters])

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('is_published', true)
        .gte('start_date', new Date().toISOString())
        .order('start_date', { ascending: true })

      if (error) {
        setEvents([])
        return
      }

      const organizationIds = [...new Set((data || []).map((event: any) => event.organization_id).filter(Boolean))]
      const organizationMap: Record<string, { name: string | null; website: string | null }> = {}

      if (organizationIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, organization_name, website')
          .in('id', organizationIds)

        if (profiles) {
          profiles.forEach((profile: any) => {
            organizationMap[profile.id] = {
              name: profile.organization_name || null,
              website: profile.website || null
            }
          })
        }
      }

      const eventsWithOrgName = (data || []).map((event: any) => ({
        ...event,
        organization_name: event.organization_id ? (organizationMap[event.organization_id]?.name || null) : null,
        organization_website: event.organization_id ? (organizationMap[event.organization_id]?.website || null) : null
      }))

      setEvents(eventsWithOrgName)

      // Dynamic Filter Options
      setCategories([...new Set(eventsWithOrgName.map((event: Event) => event.category).filter((c): c is string => !!c))])
      setAvailableCountries([...new Set(eventsWithOrgName.map((event: Event) => event.country).filter((c): c is string => !!c))].sort())

    } catch (error) {
      setEvents([])
    } finally {
      setLoading(false)
    }
  }

  const filteredEvents = events.filter(event => {
    const query = searchTerm.toLowerCase()
    const matchesSearch = !query ||
      event.title.toLowerCase().includes(query) ||
      event.description.toLowerCase().includes(query) ||
      event.location.toLowerCase().includes(query) ||
      event.organization_name?.toLowerCase().includes(query)

    const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(event.category)
    const matchesLocation = !locationFilter || event.location.toLowerCase().includes(locationFilter.toLowerCase())

    const eventDate = new Date(event.start_date)
    const matchesMonth = selectedMonths.length === 0 || selectedMonths.includes((eventDate.getMonth() + 1).toString())
    const matchesYear = selectedYears.length === 0 || selectedYears.includes(eventDate.getFullYear().toString())
    const matchesLanguage = selectedLanguages.length === 0 || (event.working_language && selectedLanguages.includes(event.working_language))
    const matchesEventType = selectedEventTypes.length === 0 || (event.event_type && selectedEventTypes.includes(event.event_type))
    const matchesCountry = selectedCountries.length === 0 || (event.country && selectedCountries.includes(event.country))

    return matchesSearch && matchesCategory && matchesLocation &&
      matchesMonth && matchesYear && matchesLanguage &&
      matchesEventType && matchesCountry
  })

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedCategories([])
    setSelectedMonths([])
    setSelectedYears([])
    setSelectedLanguages([])
    setSelectedEventTypes([])
    setSelectedCountries([])
    setLocationFilter('')
  }

  const hasActiveFilters = !!(searchTerm || selectedCategories.length || locationFilter ||
    selectedMonths.length || selectedYears.length || selectedLanguages.length ||
    selectedEventTypes.length || selectedCountries.length)

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const startMonth = start.toLocaleDateString('en-US', { month: 'short' })
    const endMonth = end.toLocaleDateString('en-US', { month: 'short' })
    const startDay = start.getDate()
    const endDay = end.getDate()
    const year = start.getFullYear()

    if (startMonth === endMonth) {
      return `${startMonth} ${startDay} – ${endDay}, ${year}`
    } else {
      return `${startMonth} ${startDay} – ${endMonth} ${endDay}, ${year}`
    }
  }

  const toggleFavorite = (eventId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const newFavorites = favorites.includes(eventId)
      ? favorites.filter(id => id !== eventId)
      : [...favorites, eventId]
    setFavorites(newFavorites)
    localStorage.setItem('favorite_events', JSON.stringify(newFavorites))
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-[#003399] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#003399] font-bold">Loading events...</p>
        </div>
      </div>
    )
  }

  // Live Stats Calculation
  const activeEventsCount = events.filter(e => e.application_deadline && new Date(e.application_deadline) > new Date()).length
  const countriesCount = new Set(events.filter(e => e.country).map(e => e.country)).size
  const organizationsCount = new Set(events.filter(e => e.organization_name).map(e => e.organization_name)).size

  // Recently Added Events (last 3)
  const recentlyAdded = [...events].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 3)

  // Helper for flags
  const getCountryFlagEmoji = (countryName: string) => {
    if (!countryName) return '🌍';
    // Simplified flag logic or mapping would be better, but using the user's requested logic
    // Usually requires 2-letter ISO code, but we'll try to fallback safely
    return '🌍';
  };

  return (
    <div className="bg-[#fdfbf6] min-h-screen relative overflow-x-clip font-sans">

      {/* Background Patterns */}
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

        {/* EU Stars circle watermark (top-left, 20% opacity) */}
        <div className="absolute -top-20 -left-20 opacity-20 -rotate-12 scale-150">
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

        {/* Navy Blue Radial Blobs (#1a2e6b at 10% opacity) bottom-left */}
        <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-[#1a2e6b] opacity-10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute -bottom-20 left-20 w-[300px] h-[300px] bg-[#1a2e6b] opacity-5 rounded-full blur-[80px] pointer-events-none"></div>
      </div>

      {/* Plane Animation (Fly behind text) */}
      <motion.div
        className="absolute z-20 pointer-events-none"
        style={{
          top: '18%',
          width: '100px',
          left: '-150px'
        }}
        animate={{
          x: '110vw',
          y: [0, -60, 40, -120, 0],
          rotate: [12, 0, 8, -4, 12]
        }}
        transition={{
          duration: 25,
          ease: "linear",
          repeat: Infinity,
          repeatDelay: 3
        }}
      >
        <img
          src="/images/red_plane.png"
          alt="Flying Plane"
          className="w-full h-auto object-contain"
        />
      </motion.div>

      <GlobalBlueLine startSide="left" initialProgress={0.27} />

      {/* Page Fade-In Wrapper */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2 }}
        className="relative flex flex-col md:flex-row min-h-screen w-full max-w-[1700px] mx-auto z-20"
      >

        {/* Advanced Filters Sidebar (Pushes content) - Now Fixed for full scroll */}
        <AnimatePresence mode="wait">
          {showFilters && (
            <motion.div
              initial={{ x: -380, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -380, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 35 }}
              className="fixed left-0 top-0 h-screen w-full md:w-[380px] bg-white z-[100] overflow-y-auto shadow-2xl pt-20"
            >
              <div className="flex justify-between items-center mb-10 p-8">
                <h3 className="text-2xl font-black text-[#003399] uppercase tracking-tighter">Refine Search</h3>
                <button onClick={() => setShowFilters(false)} className="bg-blue-50 p-2 rounded-full text-blue-400 hover:text-red-500 hover:bg-red-50 transition-all">
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-8 pb-10">
                {/* Dynamic Selection Groups */}
                {[
                  { label: 'Categories', options: categories, state: selectedCategories, setter: setSelectedCategories },
                  { label: 'Countries', options: availableCountries, state: selectedCountries, setter: setSelectedCountries },
                  { label: 'Months', options: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'], displayOptions: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], state: selectedMonths, setter: setSelectedMonths },
                  { label: 'Years', options: ['2024', '2025', '2026', '2027'], state: selectedYears, setter: setSelectedYears },
                  { label: 'Working Language', options: ['English', 'Romanian', 'French', 'Spanish', 'German', 'Italian'], state: selectedLanguages, setter: setSelectedLanguages },
                  { label: 'Event Type', options: ['Youth exchange', 'Training Course', 'Seminar', 'Study visit', 'Partnership - Building Activity', 'Conference simpozion forum', 'E-learning', 'Other'], state: selectedEventTypes, setter: setSelectedEventTypes },
                ].map((filter) => (
                  <div key={filter.label} className="border-b border-gray-100 pb-6">
                    <label className="block text-[10px] font-black text-[#003399]/40 uppercase mb-4 tracking-[0.2em]">{filter.label}</label>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {filter.state.map(val => (
                        <span key={val} className="inline-flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-xl text-[10px] font-bold shadow-sm animate-in fade-in zoom-in duration-300">
                          {filter.displayOptions ? filter.displayOptions[parseInt(filter.options.indexOf(val).toString())] : val}
                          <button onClick={() => filter.setter(filter.state.filter(s => s !== val))} className="hover:text-amber-300 transition-colors">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <select
                      value=""
                      onChange={(e) => {
                        const val = e.target.value
                        if (val && !filter.state.includes(val)) filter.setter([...filter.state, val])
                      }}
                      className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-2xl outline-none font-bold text-blue-900 shadow-inner focus:bg-white focus:border-blue-100 transition-all text-sm"
                    >
                      <option value="" disabled>Add {filter.label.slice(0, -1)}...</option>
                      {filter.options.map((opt, idx) => (
                        <option key={opt} value={opt} className={filter.state.includes(opt) ? 'opacity-30' : ''}>
                          {filter.displayOptions ? filter.displayOptions[idx] : opt}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}

                <div>
                  <label className="block text-[10px] font-black text-[#003399]/40 uppercase mb-4 tracking-[0.2em]">City Filter</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#003399]/20" />
                    <input
                      type="text"
                      placeholder="Enter city..."
                      value={locationFilter}
                      onChange={(e) => setLocationFilter(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-transparent rounded-2xl outline-none font-bold text-blue-900 shadow-inner focus:bg-white focus:border-blue-100 transition-all text-sm"
                    />
                  </div>
                </div>

                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="w-full py-4 bg-red-50 text-red-500 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-red-100 transition-all flex items-center justify-center gap-2 border border-red-100"
                  >
                    <Filter className="h-4 w-4" />
                    Clear All
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Unified Main Column Wrapper: Hero + Metrics + Catalog (Scaling & Movement) */}
        <div className={`flex-1 flex flex-col transition-all duration-[800ms] ease-in-out relative overflow-visible ${showFilters ? 'md:ml-[380px] scale-[0.98]' : 'scale-100'}`}>

          {/* Hero Section Content (Center Column) with Assets */}
          <div className="flex flex-col items-center pt-72 pb-24 px-6 sm:px-10 lg:px-20 relative overflow-visible min-h-[90vh]">

            {/* Centered Text & Search Area */}
            <div className="flex flex-col items-center text-center w-full max-w-5xl mb-8 relative z-40">

              <h1 className="text-4xl md:text-7xl font-black text-[#003399] mb-4 tracking-tight leading-[0.9] flex flex-col items-center gap-1 drop-shadow-sm">
                Discover New Events
              </h1>

              <p className="text-base md:text-xl text-blue-900/40 font-medium mb-12 max-w-2xl leading-relaxed italic">
                Connect, learn, and grow through our curated selection of verified Erasmus+ workshops across the European map.
              </p>

              {/* Search Area - Now Floating cleanly */}
              <div className="w-full max-w-2xl relative group">
                <div className="relative z-30 flex flex-col gap-6 items-center">
                  <div className="w-full relative group/search">
                    <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 text-blue-600 h-6 w-6 group-focus-within/search:scale-110 transition-transform" />
                    <input
                      id="search-events"
                      type="text"
                      placeholder="Search for events..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-16 pr-14 py-5 bg-white text-blue-700 placeholder:text-blue-400 placeholder:opacity-60 rounded-[2rem] focus:ring-8 focus:ring-blue-100/30 transition-all outline-none text-lg font-bold shadow-2xl border border-blue-50/50"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="absolute right-6 top-1/2 transform -translate-y-1/2 text-gray-200 hover:text-red-400"
                      >
                        <X className="h-6 w-6" />
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap justify-center gap-3">
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className={`flex items-center gap-2 px-8 py-3 rounded-2xl transition-all duration-500 font-black uppercase text-[8px] tracking-[0.15em] shadow-xl hover:-translate-y-1 active:scale-95 border-2 ${showFilters || hasActiveFilters
                        ? 'bg-[#003399] text-white border-[#003399]'
                        : 'bg-white text-[#003399] border-blue-50'
                        }`}
                    >
                      <SlidersHorizontal className="h-3.5 w-3.5" />
                      <span>Advanced Filters</span>
                      {hasActiveFilters && (
                        <span className="bg-amber-400 text-blue-900 rounded-full w-5 h-5 flex items-center justify-center ml-1 border-2 border-white text-[8px] font-black">
                          {[searchTerm, ...selectedCategories, locationFilter, ...selectedMonths, ...selectedYears, ...selectedLanguages, ...selectedEventTypes, ...selectedCountries].filter(Boolean).length}
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* New Stats Bar Section */}
            <div className="w-full max-w-4xl grid grid-cols-3 gap-6 relative z-40 mt-64 mb-32 px-4">
              {[
                { label: 'Active Events', value: activeEventsCount, icon: Calendar, color: 'text-blue-600' },
                { label: 'Global Countries', value: countriesCount, icon: MapPin, color: 'text-amber-500' },
                { label: 'Organizations', value: organizationsCount, icon: Users, color: 'text-red-500' },
              ].map((stat, idx) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * idx }}
                  className="bg-white/80 backdrop-blur-xl p-6 rounded-[2.5rem] shadow-xl border border-white/50 flex flex-col items-center text-center group hover:bg-white transition-all hover:-translate-y-1"
                >
                  <div className={`p-3 rounded-2xl bg-gray-50 mb-3 group-hover:scale-110 transition-transform ${stat.color}`}>
                    {/* @ts-ignore */}
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <span className="text-3xl font-black text-[#003399] tracking-tighter mb-1">{stat.value}</span>
                  <span className="text-[9px] font-black uppercase text-blue-900/40 tracking-[0.2em]">{stat.label}</span>
                </motion.div>
              ))}
            </div>

            {/* Recently Added Section */}
            <div className="w-full max-w-6xl relative z-40 px-4 mb-20">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-2 bg-amber-400 rounded-full"></div>
                  <h2 className="text-2xl font-black text-[#003399] uppercase tracking-tighter">Recently Added</h2>
                </div>
                <div className="h-0.5 flex-1 bg-gray-100 mx-8 hidden md:block"></div>
                <span className="text-[10px] font-black text-[#003399]/40 uppercase tracking-widest bg-blue-50 px-4 py-1.5 rounded-full">New Arrivals</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {recentlyAdded.map((event, idx) => (
                  <Link href={`/events/${event.id}`} key={event.id} className="relative z-30 group">
                    <motion.div
                      whileHover={{ y: -10 }}
                      className="bg-white rounded-[2rem] p-6 shadow-xl border border-blue-50 group-hover:shadow-[0_20px_50px_rgba(0,51,153,0.1)] transition-all flex flex-col h-full overflow-hidden"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[8.5px] font-[900] uppercase tracking-widest">
                          {event.event_type || 'Opportunity'}
                        </span>
                        <div className="bg-blue-50 p-2 rounded-xl text-[#003399]">
                          <ArrowUpRight className="h-4 w-4" />
                        </div>
                      </div>

                      <h3 className="text-lg font-black text-blue-950 mb-3 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors">
                        {event.title}
                      </h3>

                      <div className="flex items-center gap-2 mb-4 text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                        <span>{getCountryFlagEmoji(event.country || '')}</span>
                        <MapPin className="w-3.5 h-3.5 text-blue-400" />
                        <span className="line-clamp-1">{event.location}</span>
                      </div>

                      <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
                        <div className="text-[9px] font-black text-blue-900/30 uppercase tracking-[0.1em]">
                          {event.organization_name}
                        </div>
                        <div className="flex items-center gap-1.5 text-[9px] font-black text-red-500 uppercase tracking-widest bg-red-50 px-2.5 py-1 rounded-lg">
                          <Clock className="w-3 h-3" />
                          {event.application_deadline ? new Date(event.application_deadline).toLocaleDateString() : 'N/A'}
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Main Catalog Section - Now inside the same flex column as Hero */}
          <div className="bg-white/50 backdrop-blur-3xl pt-24 pb-32 relative z-[25] border-t border-white overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-20 relative z-30">

              <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
                <div className="space-y-3">
                  <h2 className="text-4xl md:text-5xl font-black text-[#003399] tracking-tighter uppercase leading-none">The Catalog</h2>
                  <div className="h-1.5 w-24 bg-amber-400 rounded-full"></div>
                </div>

                <div className="flex gap-3 bg-white/80 p-2.5 rounded-2xl shadow-xl border border-blue-50">
                  <button
                    onClick={() => setViewColumns(3)}
                    className={`p-3 rounded-xl transition-all ${viewColumns === 3 ? 'bg-[#003399] text-white shadow-xl scale-105' : 'text-blue-100 hover:text-blue-900'}`}
                  >
                    <LayoutGrid className="h-6 w-6" />
                  </button>
                  <button
                    onClick={() => setViewColumns(5)}
                    className={`p-3 rounded-xl transition-all ${viewColumns === 5 ? 'bg-[#003399] text-white shadow-xl scale-105' : 'text-blue-100 hover:text-blue-900'}`}
                  >
                    <List className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {filteredEvents.length === 0 ? (
                <div className="text-center py-32 bg-white/50 backdrop-blur-sm rounded-[4rem] border-4 border-dashed border-blue-50">
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex flex-col items-center"
                  >
                    <Search className="h-20 w-20 text-blue-50 mb-8" />
                    <h3 className="text-2xl font-black text-blue-900/20 mb-4 uppercase tracking-wider">Empty Results</h3>
                    <p className="text-blue-900/30 max-w-sm mx-auto font-black mb-10 uppercase text-[9px] tracking-widest leading-loose">
                      Your search criteria found no matches. Adjust your filters or explore our broad categories.
                    </p>
                    <button
                      onClick={clearFilters}
                      className="px-10 py-4 bg-[#003399] text-white font-black uppercase text-[9px] tracking-widest rounded-2xl shadow-xl active:scale-95"
                    >
                      Reset Parameters
                    </button>
                  </motion.div>
                </div>
              ) : (
                <div>
                  <div className={`grid gap-8 ${viewColumns === 3 ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'}`}>
                    {filteredEvents.slice(0, visibleRows * viewColumns).map((event, index) => (
                      <motion.div
                        layout
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ delay: (index % (viewColumns * 2)) * 0.08, duration: 0.6 }}
                        key={event.id}
                        className="bg-white rounded-[2rem] shadow-sm border border-blue-50 hover:shadow-[0_30px_70px_rgba(0,51,153,0.1)] hover:-translate-y-3 transition-all duration-700 overflow-hidden flex flex-col group relative z-[35]"
                      >
                        <div className="relative h-48 w-full overflow-hidden bg-gray-50">
                          {event.photo_url ? (
                            <Image
                              src={event.photo_url}
                              alt={event.title}
                              fill
                              className="object-cover group-hover:scale-115 transition-transform duration-[1.5s] ease-out shadow-inner"
                              unoptimized
                              onError={(e) => { (e.target as any).style.display = 'none' }}
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full text-blue-100 bg-blue-50/20">
                              <Calendar className="h-16 w-16 opacity-10" />
                            </div>
                          )}

                          <div className="absolute top-6 left-6 z-20">
                            <span className="bg-white/95 backdrop-blur-md text-[#003399] text-[8px] uppercase font-black px-4 py-1.5 rounded-full shadow-lg border border-blue-50 tracking-[0.15em]">
                              {event.category}
                            </span>
                          </div>

                          {event.application_deadline && (new Date(event.application_deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24) < 7 && (
                            <div className="absolute bottom-6 left-6 z-30">
                              <div className="flex items-center gap-2 bg-red-600 text-white text-[8px] font-black uppercase px-3 py-2 rounded-xl shadow-xl animate-bounce tracking-widest">
                                <Clock className="w-3.5 h-3.5" />
                                Priority
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="p-8 flex flex-col flex-1">
                          <h3 className="text-xl font-black text-[#003399] mb-6 line-clamp-2 min-h-[3rem] leading-[1.1] transition-all tracking-tight">{event.title}</h3>

                          <div className="space-y-3 mb-8 opacity-60">
                            <div className="flex items-center text-[9px] font-black text-gray-500 uppercase tracking-widest">
                              <MapPin className="h-3.5 w-3.5 mr-2 text-blue-500" />
                              {event.location}
                            </div>
                            <div className="flex items-center text-[9px] font-black text-gray-500 uppercase tracking-widest">
                              <Users className="h-3.5 w-3.5 mr-2 text-blue-500" />
                              {event.max_participants || 0} SEATS
                            </div>
                            <div className="flex items-center text-[9px] font-black text-[#003399] uppercase tracking-[0.15em]">
                              <Calendar className="h-3.5 w-3.5 mr-2 text-amber-500" />
                              {formatDateRange(event.start_date, event.end_date)}
                            </div>
                          </div>

                          <div className="flex gap-3 mt-auto">
                            <Link
                              href={`/events/${event.id}`}
                              className="flex-1 bg-[#003399] text-white py-4 rounded-2xl font-black uppercase text-[9px] tracking-[0.2em] hover:bg-amber-500 hover:shadow-xl transition-all text-center flex items-center justify-center shadow-lg"
                            >
                              View Details
                            </Link>
                            <button
                              onClick={(e) => toggleFavorite(event.id, e)}
                              className={`p-4 rounded-2xl border-2 transition-all duration-500 ${favorites.includes(event.id) ? 'bg-red-50 border-red-100 text-red-500 shadow-xl scale-105' : 'bg-gray-50 border-gray-100 text-blue-100 hover:text-red-500 hover:bg-red-50'
                                }`}
                            >
                              <Heart className={`h-5 w-5 ${favorites.includes(event.id) ? 'fill-current' : ''}`} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {filteredEvents.length > visibleRows * viewColumns && (
                    <div className="flex justify-center mt-24">
                      <button
                        onClick={() => setVisibleRows(prev => prev + 3)}
                        className="group flex flex-col items-center gap-4 py-8 px-16 bg-white border border-blue-50 rounded-[3rem] shadow-xl hover:shadow-2xl transition-all duration-700 active:scale-95"
                      >
                        <div className="w-12 h-12 bg-[#003399] text-white rounded-full flex items-center justify-center group-hover:scale-110 shadow-lg group-hover:bg-amber-500">
                          <ChevronDown className="h-6 w-6" />
                        </div>
                        <span className="text-[9px] font-black uppercase text-[#003399] tracking-[0.3em] opacity-40 group-hover:opacity-100 transition-all">Load More</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      </motion.div>

      <button
        onClick={scrollToTop}
        className={`fixed bottom-12 right-12 p-6 bg-[#003399] text-white rounded-full shadow-[0_30px_70px_rgba(0,51,153,0.4)] transition-all duration-700 z-[100] hover:scale-125 active:scale-95 border-8 border-white/50 backdrop-blur-md ${showScrollTop ? 'translate-y-0 opacity-100 rotate-0' : 'translate-y-32 opacity-0 rotate-180 pointer-events-none'
          }`}
      >
        <ArrowUp className="h-8 w-8" />
      </button>
    </div>
  )
}
