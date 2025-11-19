'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Calendar, MapPin, Users, Clock, Search, Filter } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { EventCardSkeleton } from '@/components/SkeletonLoader'

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

      setEvents(data || [])
      
      // Extract unique categories
      const uniqueCategories = [...new Set(data?.map(event => event.category) || [])]
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
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.location.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !selectedCategory || event.category === selectedCategory
    return matchesSearch && matchesCategory
  })

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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Discover Opportunities</h1>
          <p className="text-gray-600 mb-8">Explore verified opportunities across Europe</p>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <label htmlFor="search-events" className="sr-only">Search events</label>
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" aria-hidden="true" />
              <input
                id="search-events"
                type="text"
                placeholder="Search opportunities by title, description, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                aria-label="Search events"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-400" aria-hidden="true" />
              <label htmlFor="filter-category" className="sr-only">Filter by category</label>
              <select
                id="filter-category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full md:w-auto"
                aria-label="Filter by category"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Events Grid */}
        {filteredEvents.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No opportunities found</h3>
            <p className="text-gray-500">
              {searchTerm || selectedCategory 
                ? 'Try adjusting your search criteria'
                : 'No opportunities are currently available. Check back soon!'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <div key={event.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow overflow-hidden flex flex-col">
                {event.photo_url ? (
                  <div className="relative h-48 w-full">
                    <img
                      src={event.photo_url}
                      alt={`${event.title} cover`}
                      className="h-full w-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent"></div>
                  </div>
                ) : (
                  <div className="h-48 w-full bg-gradient-to-br from-blue-100 via-indigo-50 to-purple-100 flex items-center justify-center text-sm text-blue-700 font-medium">
                    Event cover not provided
                  </div>
                )}
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{event.title}</h3>
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full ml-2">
                      {event.category}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">{event.description}</p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="h-4 w-4 mr-2" />
                      {formatDate(event.start_date)} at {formatTime(event.start_date)}
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="h-4 w-4 mr-2" />
                      Until {formatDate(event.end_date)}
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <MapPin className="h-4 w-4 mr-2" />
                      {event.location}
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Users className="h-4 w-4 mr-2" />
                      Up to {event.max_participants} participants
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-600 mb-4">
                    by <span className="font-medium">{event.organization_name || 'Erasmus+ Connect'}</span>
                  </div>
                  
                  <Link
                    href={`/events/${event.id}`}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors text-center block mt-auto focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
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
        {filteredEvents.length > 0 && (
          <div className="text-center mt-8 text-gray-500">
            Showing {filteredEvents.length} of {events.length} opportunities
          </div>
        )}
      </div>
    </div>
  )
}

