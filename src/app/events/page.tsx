'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Calendar, MapPin, Users, Search, Filter } from 'lucide-react'
import { motion, useInView } from 'framer-motion'
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
  group_size?: number | null
}

// Event card images
const eventCardImages = [
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
]

// Typewriter component
const Typewriter = ({ text, delay = 100 }: { text: string; delay?: number }) => {
  const [displayedText, setDisplayedText] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex])
        setCurrentIndex(prev => prev + 1)
      }, delay)
      return () => clearTimeout(timeout)
    }
  }, [currentIndex, text, delay])

  return <span>{displayedText}</span>
}

// Floating words component with gold color, glow, and cinematic movement
const FloatingWords = () => {
  const words = [
    'discover', 'erasmus+', 'mobility', 'youth exchange', 'training', 'forum',
    'experience', 'volunteering', 'mentorship', 'collaboration', 'innovation',
    'learning', 'international', 'leadership', 'networking', 'projects', 'skills',
    'culture', 'diversity', 'exchange', 'development', 'community', 'growth',
    'opportunity', 'connection', 'empowerment', 'engagement', 'dialogue'
  ]

  // Generate random positions and movement patterns for each word
  const wordConfigs = words.map((word, index) => {
    // Random starting positions spread across the screen
    const left = 5 + (index * 3.3) % 90
    const top = 10 + (index * 2.7) % 80
    
    // Random movement offsets - varied for natural drift
    const x1 = (Math.sin(index) * 60) - 30
    const x2 = (Math.cos(index * 1.3) * 50) - 25
    const x3 = (Math.sin(index * 0.7) * 40) - 20
    const x4 = (Math.cos(index * 0.5) * 35) - 15
    
    const y1 = (Math.cos(index * 1.1) * 50) - 25
    const y2 = (Math.sin(index * 0.9) * 40) - 20
    const y3 = (Math.cos(index * 1.5) * 30) - 15
    const y4 = (Math.sin(index * 1.2) * 25) - 10
    
    // Slow, varied durations (25-40 seconds for very slow, cinematic movement)
    const duration = 25 + (index % 15) + Math.sin(index) * 8
    
    // Staggered delays for organic appearance
    const delay = (index * 0.5) % 10
    
    // Varying sizes for depth
    const sizeMultiplier = 0.8 + (index % 5) * 0.15 // 0.8x to 1.4x
    const baseSize = index % 3 === 0 ? 'text-lg' : index % 3 === 1 ? 'text-xl' : 'text-2xl'
    const mdSize = index % 3 === 0 ? 'md:text-xl' : index % 3 === 1 ? 'md:text-2xl' : 'md:text-3xl'
    const lgSize = index % 3 === 0 ? 'lg:text-2xl' : index % 3 === 1 ? 'lg:text-3xl' : 'lg:text-4xl'
    
    // Varying opacity for depth (some more visible, some more subtle)
    const baseOpacity = 0.12 + (index % 4) * 0.06 // 0.12 to 0.30
    const opacityVariation = [baseOpacity, baseOpacity + 0.08, baseOpacity - 0.04, baseOpacity + 0.06, baseOpacity]
    
    // Z-index for layering (some behind, some in front)
    const zIndex = index % 3 === 0 ? -1 : index % 3 === 1 ? 0 : 1
    
    return {
      word,
      left,
      top,
      x: [0, x1, x2, x3, x4, 0],
      y: [0, y1, y2, y3, y4, 0],
      rotate: [0, (index % 2 === 0 ? 1 : -1) * (10 + (index % 8)), 0],
      duration,
      delay,
      opacity: opacityVariation,
      size: `${baseSize} ${mdSize} ${lgSize}`,
      zIndex,
    }
  })

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {wordConfigs.map((config, index) => (
        <motion.div
          key={`${config.word}-${index}`}
          className={`absolute ${config.size} font-bold whitespace-nowrap`}
          style={{
            left: `${config.left}%`,
            top: `${config.top}%`,
            fontFamily: 'var(--font-inter-tight)',
            color: '#D4AF37', // Golden color
            zIndex: config.zIndex,
            textShadow: '0 0 20px rgba(212, 175, 55, 0.3), 0 0 40px rgba(212, 175, 55, 0.15)',
            filter: 'drop-shadow(0 0 8px rgba(212, 175, 55, 0.4))',
          }}
          animate={{
            x: config.x,
            y: config.y,
            rotate: config.rotate,
            opacity: config.opacity,
          }}
          transition={{
            duration: config.duration,
            repeat: Infinity,
            delay: config.delay,
            ease: 'easeInOut',
            times: [0, 0.2, 0.4, 0.6, 0.8, 1],
          }}
        >
          {config.word}
        </motion.div>
      ))}
    </div>
  )
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [categories, setCategories] = useState<string[]>([])

  // Hooks must be called before any conditional returns
  const heroRef = useRef<HTMLDivElement>(null)
  const heroInView = useInView(heroRef, { once: true, amount: 0.3 })
  const eventsRef = useRef<HTMLDivElement>(null)
  const eventsInView = useInView(eventsRef, { once: true, amount: 0.2 })

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
    if (!event) return false
    const searchFields = [
      event.title || '',
      event.short_description || '',
      event.description || '',
      event.location || '',
      event.city || '',
      event.country || '',
      event.event_type || ''
    ].join(' ').toLowerCase()
    
    const matchesSearch = !searchTerm || searchFields.includes(searchTerm.toLowerCase())
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
      <div className="min-h-screen bg-[#FAF9F6]" style={{ fontFamily: 'var(--font-inter-tight)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-12 bg-[#0B1D3A]/10 rounded w-1/3 mb-4 mx-auto"></div>
            <div className="h-6 bg-[#0B1D3A]/10 rounded w-1/2 mb-12 mx-auto"></div>
            <div className="h-16 bg-white rounded-2xl mb-8 max-w-3xl mx-auto"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl shadow-lg border border-[#0B1D3A]/10 p-6">
                  <div className="h-48 bg-[#0B1D3A]/5 rounded-xl mb-4"></div>
                  <div className="h-6 bg-[#0B1D3A]/10 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-[#0B1D3A]/5 rounded w-1/2 mb-4"></div>
                  <div className="h-20 bg-[#0B1D3A]/5 rounded mb-4"></div>
                  <div className="h-10 bg-[#0B1D3A]/10 rounded w-full"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6]" style={{ fontFamily: 'var(--font-inter-tight)' }}>
      <motion.section
        ref={heroRef}
        className="relative py-20 md:py-32 bg-white overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <FloatingWords />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
          <div className="text-center mb-12">
            <motion.h1
              className="text-4xl md:text-6xl lg:text-7xl font-black text-[#0B1D3A] mb-6 leading-tight tracking-tight"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <Typewriter text="Discover Events" delay={80} />
            </motion.h1>
            <motion.p
              className="text-xl md:text-2xl text-elegant-green-dark max-w-2xl mx-auto font-light mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              Explore verified Erasmus+ events across Europe
            </motion.p>

            <motion.div
              className="max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              <div className="relative">
                <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 text-[#0B1D3A]/40 h-6 w-6" />
                <input
                  type="text"
                  placeholder="Search events by title, description, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-16 pr-6 py-4 text-lg border-2 border-[#0B1D3A]/20 rounded-2xl focus:ring-2 focus:ring-[#0B1D3A] focus:border-[#0B1D3A] bg-white shadow-lg transition-all"
                  style={{ fontFamily: 'var(--font-inter-tight)' }}
                />
              </div>
              
              <div className="flex items-center justify-center gap-4 mt-6">
                <Filter className="h-5 w-5 text-[#0B1D3A]/60" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-6 py-3 border-2 border-[#0B1D3A]/20 rounded-xl focus:ring-2 focus:ring-[#0B1D3A] focus:border-[#0B1D3A] bg-white shadow-md text-[#0B1D3A] font-medium"
                  style={{ fontFamily: 'var(--font-inter-tight)' }}
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        <div ref={eventsRef}>
          {filteredEvents.length === 0 ? (
            <motion.div
              className="text-center py-16"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Calendar className="h-16 w-16 text-[#0B1D3A]/30 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-[#0B1D3A] mb-2">No events found</h3>
              <p className="text-elegant-green-dark">
                {searchTerm || selectedCategory 
                  ? 'Try adjusting your search criteria'
                  : 'No events are currently available. Check back soon!'
                }
              </p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredEvents.map((event, index) => {
                // Cycle through provided images, fallback to event photo_url or placeholder
                const cardImage = event.photo_url || eventCardImages[index % eventCardImages.length]
                
                return (
                  <motion.div
                    key={event.id}
                    className="bg-white rounded-2xl shadow-lg border border-[#0B1D3A]/10 overflow-hidden group"
                    initial={{ opacity: 0, y: 60, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ 
                      delay: index * 0.1, 
                      duration: 0.6,
                      type: 'spring',
                      stiffness: 100,
                      damping: 15
                    }}
                    whileHover={{ 
                      scale: 1.03, 
                      y: -12,
                      boxShadow: '0 25px 50px rgba(11, 29, 58, 0.2)',
                      transition: { duration: 0.3 }
                    }}
                  >
                    <div className="relative h-56 bg-gradient-to-br from-elegant-green-dark/20 via-elegant-navy-dark/20 to-elegant-brown-medium/20 overflow-hidden">
                      <img
                        src={cardImage}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                      
                      {event.event_type && (
                        <div className="absolute top-4 right-4 z-10">
                          <span className="bg-[#0B1D3A] text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                            {event.event_type}
                          </span>
                        </div>
                      )}
                      
                      {event.is_funded && (
                        <div className="absolute top-4 left-4 z-10">
                          <span className="bg-[#D4AF37] text-[#0B1D3A] text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                            ✓ Funded
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-6 bg-white">
                      <h3 className="text-xl font-bold text-[#0B1D3A] mb-3 line-clamp-2 min-h-[3rem] leading-tight">
                        {event.title}
                      </h3>
                      
                      <p className="text-sm text-elegant-green-dark mb-4 line-clamp-2 leading-relaxed">
                        {event.short_description || event.description}
                      </p>
                      
                      <div className="space-y-2.5 mb-6">
                        <div className="flex items-center text-sm text-[#0B1D3A]">
                          <Calendar className="h-4 w-4 mr-2 text-elegant-brown-medium flex-shrink-0" />
                          <span className="font-semibold">{formatDate(event.start_date)}</span>
                          <span className="mx-2 text-[#0B1D3A]/40">•</span>
                          <span className="text-[#0B1D3A]/70">{formatTime(event.start_date)}</span>
                        </div>
                        <div className="flex items-center text-sm text-[#0B1D3A]">
                          <MapPin className="h-4 w-4 mr-2 text-elegant-brown-medium flex-shrink-0" />
                          <span className="font-medium">
                            {event.city && event.country 
                              ? `${event.city}, ${event.country}` 
                              : event.location}
                          </span>
                        </div>
                        {(event.group_size || event.max_participants) && (
                          <div className="flex items-center text-sm text-[#0B1D3A]">
                            <Users className="h-4 w-4 mr-2 text-elegant-brown-medium flex-shrink-0" />
                            <span>Up to {event.group_size || event.max_participants} participants</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="text-xs text-[#0B1D3A]/60 mb-4 pb-4 border-b border-[#0B1D3A]/10">
                        by <span className="font-semibold">{event.organization_name || 'Erasmus+ Connect'}</span>
                      </div>
                      
                      <Link
                        href={`/events/${event.id}`}
                        className="w-full bg-[#0B1D3A] text-white py-3 px-6 rounded-xl font-semibold hover:bg-[#102949] transition-all text-center block shadow-md hover:shadow-xl group-hover:shadow-2xl"
                      >
                        View Details
                      </Link>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>

        {filteredEvents.length > 0 && (
          <motion.div
            className="text-center mt-12 text-[#0B1D3A]/60 font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Showing {filteredEvents.length} of {events.length} events
          </motion.div>
        )}
      </div>
    </div>
  )
}
