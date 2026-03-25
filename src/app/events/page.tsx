'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Calendar, MapPin, Users, Clock, Search, Filter, X, SlidersHorizontal } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { EventCardSkeleton } from '@/components/SkeletonLoader'
import GlobalYellowLine from '@/components/GlobalYellowLine'

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
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [categories, setCategories] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [locationFilter, setLocationFilter] = useState('')

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('is_published', true)
        .gte('start_date', new Date().toISOString())
        .order('start_date', { ascending: true })

      if (error) {
        console.log('Events query error:', error)
        setEvents([])
        setCategories([])
        return
      }

      // Fetch organization names for all unique organization IDs
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

      // Map events with organization names
      const eventsWithOrgName = (data || []).map((event: any) => ({
        ...event,
        organization_name: event.organization_id ? (organizationMap[event.organization_id]?.name || null) : null,
        organization_website: event.organization_id ? (organizationMap[event.organization_id]?.website || null) : null
      }))

      setEvents(eventsWithOrgName)

      // Extract unique categories
      const uniqueCategories = [...new Set(eventsWithOrgName.map((event: Event) => event.category) || [])]
      setCategories(uniqueCategories)
    } catch (error) {
      console.log('Events fetch error (non-critical):', error)
      setEvents([])
      setCategories([])
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

    const matchesCategory = !selectedCategory || event.category === selectedCategory

    const matchesLocation = !locationFilter ||
      event.location.toLowerCase().includes(locationFilter.toLowerCase())

    return matchesSearch && matchesCategory && matchesLocation
  })

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedCategory('')
    setLocationFilter('')
    setShowFilters(false)
  }

  const hasActiveFilters = searchTerm || selectedCategory || locationFilter

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header Skeleton */}
          <div className="text-center mb-8">
            <div className="h-9 bg-gray-200 rounded w-64 mx-auto mb-4 animate-pulse"></div>
            <div className="h-5 bg-gray-200 rounded w-96 mx-auto mb-8 animate-pulse"></div>
          </div>

          {/* Search Skeleton */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
          </div>

          {/* Event Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <EventCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white min-h-screen relative overflow-hidden z-0">
      <GlobalYellowLine />
      {/* Sticky Splash Section */}
      <div className="sticky top-0 h-[100dvh] w-full flex flex-col z-10 overflow-hidden">
        
        {/* Glow effect behind */}
        <div className="absolute top-1/2 left-1/4 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-50/50 blur-[100px] rounded-full pointer-events-none"></div>

        {/* Top Header Section (Two Columns) */}
        <div className="pt-80 md:pt-[24rem] px-6 sm:px-10 lg:px-20 max-w-7xl mx-auto w-full z-20 relative flex-1 flex flex-col md:flex-row gap-6 md:gap-10 min-h-0 transform scale-90 origin-top">
          
          {/* Left Column (Headline + Subtitle + Search Area) */}
          <div className="flex-1 relative z-30 flex flex-col min-h-0 justify-center">
             <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-blue-950 mb-2 md:mb-4 drop-shadow-sm leading-tight tracking-tight shrink-0">
                Discover <br/> New Events
             </h1>
             <p className="text-base md:text-lg lg:text-xl text-blue-900 font-medium drop-shadow-sm mb-6 shrink-0 max-w-lg">
                Explore verified opportunities. Connect, learn, and grow through our curated selection of events and workshops.
             </p>
             
             {/* Search Area */}
             <div className="w-full max-w-xl flex flex-col gap-3 relative mt-2 z-30">
               {/* Search Input Bar */}
               <div className="relative z-20 mt-2">
                 <label htmlFor="search-events" className="sr-only">Search events</label>
                 <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 text-white h-6 w-6 pointer-events-none" aria-hidden="true" />
                 <input
                   id="search-events"
                   type="text"
                   placeholder="Search by title, location..."
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   className="w-full pl-14 pr-14 py-4 md:py-5 bg-blue-950 shadow-2xl text-white placeholder-blue-200/60 rounded-2xl focus:ring-4 focus:ring-blue-900/50 transition-all outline-none text-lg font-bold border border-blue-900"
                   aria-label="Search events"
                 />
                 {searchTerm && (
                   <button
                     onClick={() => setSearchTerm('')}
                     className="absolute right-5 top-1/2 transform -translate-y-1/2 text-blue-200/60 hover:text-white transition-colors"
                     aria-label="Clear search"
                   >
                     <X className="h-6 w-6" />
                   </button>
                 )}
               </div>

               {/* Tags and Advanced Filters */}
               <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-2">
                    {categories.slice(0, 3).map(tag => (
                      <button 
                         key={tag}
                         onClick={() => {
                             setSelectedCategory(tag);
                             setSearchTerm('');
                         }}
                         className="px-5 py-2.5 bg-white hover:bg-gray-50 text-blue-950 text-sm font-bold rounded-full shadow-lg transition-colors border border-gray-100"
                      >
                        {tag}
                      </button>
                    ))}
                    <button
                       onClick={() => {
                         setShowFilters(true);
                         window.scrollBy({ top: window.innerHeight * 0.8, behavior: 'smooth' });
                       }}
                       className="px-4 py-2.5 text-blue-900/60 text-sm font-bold hover:text-blue-950 transition-colors ml-1"
                    >
                      Search for more...
                    </button>
                  </div>

                  <button
                     onClick={() => {
                       setShowFilters(!showFilters);
                       window.scrollBy({ top: window.innerHeight * 0.8, behavior: 'smooth' });
                     }}
                     className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-full transition-all duration-300 font-bold shadow-lg ${showFilters || hasActiveFilters
                         ? 'bg-blue-950 text-white'
                         : 'bg-white text-blue-950 hover:bg-gray-50'
                       }`}
                     aria-label="Filters"
                   >
                     <SlidersHorizontal className="h-4 w-4" />
                     <span>Filters</span>
                     {hasActiveFilters && (
                       <span className="bg-blue-100 text-blue-950 text-xs rounded-full px-2 py-0.5 ml-2">
                         {[searchTerm, selectedCategory, locationFilter].filter(Boolean).length}
                       </span>
                     )}
                  </button>
               </div>
             </div>
          </div>

          {/* Right Column (Events Illustration) */}
          <div className="flex-1 relative z-20 flex flex-col justify-center items-end min-h-[150px] md:min-h-[250px] pointer-events-none md:mb-0 hidden md:flex w-full">
             <div className="relative w-full flex-1 pointer-events-none flex items-center justify-end">
                <img src="/images/events_animated.png" alt="Animated Events Illustration" className="w-[80%] md:w-[90%] max-w-[400px] h-auto object-contain drop-shadow-2xl translate-y-[-2rem]" />
             </div>
          </div>

        </div>

        {/* Bottom Right: Scroll Indicator */}
        <div className="pb-4 lg:pb-8 px-6 sm:px-10 lg:px-20 w-full max-w-7xl mx-auto flex justify-between items-end z-20 relative shrink-0 transform scale-90 origin-bottom">
           
           {/* Scroll indicator inner hint (Moved to bottom left visually) */}
           <div className="relative animate-bounce text-blue-900/60 hidden md:flex flex-col items-center pointer-events-none pl-10 mb-8 z-30">
               <span className="text-xs font-semibold mb-1 uppercase tracking-widest">Scroll</span>
               <div className="w-5 h-8 border-2 border-blue-900/50 rounded-full flex justify-center pt-1.5">
                 <div className="w-1 h-1 bg-blue-900/60 rounded-full animate-ping"></div>
               </div>
           </div>
        </div>
      </div>

      {/* Events Listing Section - No negative margin, starts immediately after 100vh */}
      <div className="relative min-h-screen pb-24">
        <div className="absolute inset-x-0 bottom-0 h-full bg-gray-50 rounded-t-[3rem] shadow-[0_-30px_60px_rgba(0,0,0,0.2)] border-t-2 border-white/60 -z-10"></div>
        <div className="absolute top-5 left-1/2 transform -translate-x-1/2 w-20 h-1.5 bg-gray-300 rounded-full z-10"></div>
        <div className="absolute top-12 left-1/2 transform -translate-x-1/2 text-gray-400 font-bold text-xs uppercase tracking-[0.2em] z-10">Scroll to reveal</div>
        
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-20 pt-24 relative z-20 transform scale-90 origin-top">
          
          {/* Advanced Filters Panel (visible if clicked) */}
          {showFilters && (
            <div className="bg-white rounded-3xl shadow-md border border-gray-100 p-6 md:p-8 mb-10 animate-in slide-in-from-top-4 relative z-20">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xl font-extrabold text-blue-950">Advanced Filters</h3>
                 {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="text-sm text-blue-600 hover:text-blue-800 font-bold flex items-center bg-blue-50 px-3 py-1.5 rounded-full transition-colors"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Clear All
                    </button>
                 )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="filter-category" className="block text-sm font-bold text-blue-950 mb-2">
                    Category
                  </label>
                  <div className="relative">
                    <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-950/50 pointer-events-none" />
                    <select
                      id="filter-category"
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all outline-none text-blue-950 font-bold appearance-none cursor-pointer"
                    >
                      <option value="">All Categories</option>
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label htmlFor="filter-location" className="block text-sm font-bold text-blue-950 mb-2">
                    Location
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-950/50 pointer-events-none" />
                    <input
                      id="filter-location"
                      type="text"
                      placeholder="Filter by location..."
                      value={locationFilter}
                      onChange={(e) => setLocationFilter(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all outline-none text-blue-950 font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Active Filters Display */}
          {hasActiveFilters && !showFilters && (
            <div className="flex flex-wrap gap-3 mb-8">
              {searchTerm && (
                <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-100 text-blue-900 rounded-full text-sm font-bold shadow-sm border border-blue-200">
                  Search: {searchTerm}
                  <button onClick={() => setSearchTerm('')} className="hover:text-blue-950 ml-1">
                    <X className="h-4 w-4" />
                  </button>
                </span>
              )}
              {selectedCategory && (
                <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-100 text-blue-900 rounded-full text-sm font-bold shadow-sm border border-blue-200">
                  Category: {selectedCategory}
                  <button onClick={() => setSelectedCategory('')} className="hover:text-blue-950 ml-1">
                    <X className="h-4 w-4" />
                  </button>
                </span>
              )}
              {locationFilter && (
                <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-100 text-blue-900 rounded-full text-sm font-bold shadow-sm border border-blue-200">
                  Location: {locationFilter}
                  <button onClick={() => setLocationFilter('')} className="hover:text-blue-950 ml-1">
                    <X className="h-4 w-4" />
                  </button>
                </span>
              )}
            </div>
          )}

          {/* Events Grid */}
          {filteredEvents.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100">
              <Calendar className="h-16 w-16 text-blue-200 mx-auto mb-4" />
              <h3 className="text-xl font-extrabold text-blue-950 mb-2">No events found</h3>
              <p className="text-gray-500 max-w-md mx-auto font-medium">
                {searchTerm || selectedCategory || locationFilter
                  ? 'Try adjusting your search criteria or filters.'
                  : 'No opportunities are currently available. Check back soon!'
                }
              </p>
              {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="mt-6 px-6 py-3 bg-blue-100 text-blue-900 font-bold rounded-full hover:bg-blue-200 transition-colors shadow-sm"
                  >
                    Clear filters
                  </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {filteredEvents.map((event, index) => (
                <div key={event.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col group">
                  {event.photo_url ? (
                    <div className="relative h-56 w-full overflow-hidden">
                      <Image
                        src={event.photo_url}
                        alt={`${event.title} cover`}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        unoptimized
                        priority={index === 0}
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none'
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-blue-950/80 via-transparent to-transparent"></div>
                      <span className="absolute bottom-4 left-4 bg-amber-400 text-amber-950 text-xs font-bold px-3 py-1.5 rounded-full shadow-md">
                        {event.category}
                      </span>
                    </div>
                  ) : (
                    <div className="h-56 w-full bg-gradient-to-br from-blue-100 via-blue-50 to-indigo-50 flex flex-col items-center justify-center text-blue-500 relative">
                      <Calendar className="h-10 w-10 mb-2 opacity-50" />
                      <span className="font-bold opacity-70">{event.category}</span>
                      <span className="absolute bottom-4 left-4 bg-white/70 text-blue-950 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm backdrop-blur-sm">
                        {event.category}
                      </span>
                    </div>
                  )}
                  <div className="p-6 md:p-8 flex flex-col flex-1">
                    <h3 className="text-xl font-extrabold text-blue-950 mb-3 line-clamp-2 group-hover:text-blue-700 transition-colors">{event.title}</h3>

                    <p className="text-gray-600 text-sm mb-6 line-clamp-3 leading-relaxed font-medium">{event.description}</p>

                    <div className="space-y-3 mb-6 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                      <div className="flex items-center text-sm font-bold text-gray-700">
                        <Calendar className="h-4 w-4 mr-3 text-amber-500" />
                        {formatDate(event.start_date)} • {formatTime(event.start_date)}
                      </div>
                      <div className="flex items-center text-sm font-bold text-gray-700">
                        <Clock className="h-4 w-4 mr-3 text-amber-500" />
                        Until {formatDate(event.end_date)}
                      </div>
                      <div className="flex items-center text-sm font-bold text-gray-700">
                        <MapPin className="h-4 w-4 mr-3 text-amber-500" />
                        {event.location}
                      </div>
                      <div className="flex items-center text-sm font-bold text-gray-700">
                        <Users className="h-4 w-4 mr-3 text-amber-500" />
                        Up to {event.max_participants} participants
                      </div>
                    </div>

                    {event.organization_name && (
                      <div className="text-sm font-bold text-blue-900/60 mb-6 flex items-center">
                        <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center mr-2 text-xs">
                          {event.organization_name.charAt(0)}
                        </span>
                        {event.organization_name}
                      </div>
                    )}

                    <Link
                      href={`/events/${event.id}`}
                      className="w-full bg-blue-950 text-white py-3.5 px-4 rounded-xl font-bold hover:bg-blue-800 hover:shadow-lg hover:-translate-y-0.5 transition-all text-center block mt-auto focus:outline-none focus:ring-4 focus:ring-blue-900/40"
                      aria-label={`View details for ${event.title}`}
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Results count */}
          <div className="flex justify-center mt-12">
            <div className="px-6 py-3 bg-white rounded-full shadow-sm border border-gray-200">
              <p className="text-gray-600 font-bold">
                {filteredEvents.length === 0 ? (
                  <span>No events</span>
                ) : (
                  <span>
                    Showing <span className="text-blue-700">{filteredEvents.length}</span> of{' '}
                    <span className="text-blue-950">{events.length}</span> events
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

