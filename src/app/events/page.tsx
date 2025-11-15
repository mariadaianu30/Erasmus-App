'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Calendar, MapPin, Users, Clock, Search, Filter } from 'lucide-react'
import { supabase } from '@/lib/supabase'

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
  // New Erasmus+ fields
  event_type?: string | null
  city?: string | null
  country?: string | null
  short_description?: string | null
  photo_url?: string | null
  is_funded?: boolean | null
  working_language?: string | null
  participation_fee?: number | null
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
      
      // Extract unique event types (prefer event_type over category)
      const uniqueEventTypes = [...new Set(data?.map(event => event.event_type || event.category).filter(Boolean) || [])]
      setCategories(uniqueEventTypes)
    } catch (error) {
      console.log('Events fetch error (non-critical):', error)
      setEvents([])
      setCategories([])
    } finally {
      setLoading(false)
    }
  }

  const filteredEvents = events.filter(event => {
    const searchFields = [
      event.title,
      event.short_description || '',
      event.full_description || '',
      event.venue_place || '',
      event.city || '',
      event.country || '',
      event.event_type || ''
    ].join(' ').toLowerCase()
    
    const matchesSearch = searchFields.includes(searchTerm.toLowerCase())
    const matchesCategory = !selectedCategory || event.event_type === selectedCategory || event.category === selectedCategory
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
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-20 bg-gray-200 rounded mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
              ))}
            </div>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Discover Events</h1>
          <p className="text-gray-600 mb-8">Explore verified events across Europe</p>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search events by title, description, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
            <p className="text-gray-500">
              {searchTerm || selectedCategory 
                ? 'Try adjusting your search criteria'
                : 'No events are currently available. Check back soon!'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <div key={event.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{event.title}</h3>
                    <div className="flex flex-col gap-1 ml-2">
                      {event.event_type && (
                        <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                          {event.event_type}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {event.short_description || event.description}
                  </p>
                  
                  {event.is_funded && (
                    <div className="mb-2">
                      <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                        ✓ Funded
                      </span>
                    </div>
                  )}
                  
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
                      {event.city && event.country 
                        ? `${event.city}, ${event.country}` 
                        : event.location}
                    </div>
                    {event.working_language && (
                      <div className="flex items-center text-sm text-gray-500">
                        <span className="mr-2">🌐</span>
                        {event.working_language}
                      </div>
                    )}
                    {event.participation_fee !== null && event.participation_fee !== undefined && event.participation_fee > 0 && (
                      <div className="flex items-center text-sm text-gray-500">
                        <span className="mr-2">$</span>
                        Fee: ${event.participation_fee.toFixed(2)}
                      </div>
                    )}
                    {(event.group_size || event.max_participants) && (
                      <div className="flex items-center text-sm text-gray-500">
                        <Users className="h-4 w-4 mr-2" />
                        Group Size: {event.group_size || event.max_participants} participants
                      </div>
                    )}
                  </div>
                  
                  <div className="text-sm text-gray-600 mb-4">
                    by <span className="font-medium">{event.organization_name || 'Erasmus+ Connect'}</span>
                  </div>
                  
                  <Link
                    href={`/events/${event.id}`}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors text-center block"
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
            Showing {filteredEvents.length} of {events.length} events
          </div>
        )}
      </div>
    </div>
  )
}
