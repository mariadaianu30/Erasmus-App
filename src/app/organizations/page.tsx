'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Building, MapPin, Globe, Calendar, Search, Users, Award } from 'lucide-react'
import { motion, useInView, useMotionValue, useSpring, useAnimationFrame } from 'framer-motion'
import { supabase } from '@/lib/supabase'

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
}

const heroBackgroundImages = [
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
  'https://i.pinimg.com/736x/33/05/dd/3305dd2637a831986a18079d6bee0bb2.jpg'
]

const Typewriter = ({ text, delay = 100 }: { text: string; delay?: number }) => {
  const [displayedText, setDisplayedText] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText((prev) => prev + text[currentIndex])
        setCurrentIndex((prev) => prev + 1)
      }, delay)

      return () => clearTimeout(timeout)
    }
  }, [currentIndex, delay, text])

  return <span>{displayedText}</span>
}

const AnimatedBackgroundImage = ({ src, index }: { src: string; index: number }) => {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const scale = useMotionValue(1)
  const rotate = useMotionValue(0)

  const springX = useSpring(x, { stiffness: 50, damping: 20 })
  const springY = useSpring(y, { stiffness: 50, damping: 20 })
  const springScale = useSpring(scale, { stiffness: 50, damping: 20 })
  const springRotate = useSpring(rotate, { stiffness: 30, damping: 15 })

  useEffect(() => {
    const initialX = Math.random() * 100 - 50
    const initialY = Math.random() * 100 - 50
    x.set(initialX)
    y.set(initialY)

    const interval = setInterval(() => {
      const newX = Math.random() * 200 - 100
      const newY = Math.random() * 200 - 100
      const newScale = 0.8 + Math.random() * 0.4
      const newRotate = (Math.random() - 0.5) * 20

      x.set(newX)
      y.set(newY)
      scale.set(newScale)
      rotate.set(newRotate)
    }, 8000 + Math.random() * 4000)

    return () => clearInterval(interval)
  }, [rotate, scale, x, y])

  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        x: springX,
        y: springY,
        scale: springScale,
        rotate: springRotate,
        opacity: 1,
        left: `${10 + (index % 4) * 22}%`,
        top: `${10 + Math.floor(index / 4) * 28}%`,
        width: '220px',
        height: '160px',
        zIndex: 1
      }}
    >
      <img
        src={src}
        alt={`Background ${index + 1}`}
        className="w-full h-full object-cover rounded-xl shadow-2xl"
        style={{ filter: 'blur(1px)' }}
      />
    </motion.div>
  )
}

const MarqueeRow = ({
  organizations,
  direction = 'left',
  speed = 50,
  rowIndex = 0
}: {
  organizations: Organization[]
  direction?: 'left' | 'right'
  speed?: number
  rowIndex?: number
}) => {
  const baseX = useMotionValue(0)
  const contentRef = useRef<HTMLDivElement>(null)
  const [contentWidth, setContentWidth] = useState(0)
  const [isStopped, setIsStopped] = useState(false)

  const duplicatedOrgs = organizations.length > 0 ? [...organizations, ...organizations] : []

  useEffect(() => {
    if (contentRef.current && organizations.length > 0) {
      const firstCard = contentRef.current.querySelector('[data-card]') as HTMLElement | null
      if (firstCard) {
        const cardWidth = firstCard.offsetWidth
        const gap = 24
        setContentWidth(organizations.length * (cardWidth + gap))
      }
    }
  }, [organizations.length])

  useAnimationFrame((_, delta) => {
    if (!contentRef.current || contentWidth === 0 || isStopped) return

    const moveBy = (direction === 'left' ? -1 : 1) * speed * (delta / 1000)
    let newX = baseX.get() + moveBy

    if (direction === 'left' && newX <= -contentWidth) {
      newX += contentWidth
    } else if (direction === 'right' && newX >= contentWidth) {
      newX -= contentWidth
    }

    baseX.set(newX)
  })

  const handleStopScrolling = () => setIsStopped(true)

  if (isStopped || duplicatedOrgs.length === 0) {
    return (
      <div className="py-6">
        <div className="flex items-center justify-between mb-4 px-4">
          <h3 className="text-xl font-bold text-[#0B1D3A]">All Organizations</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 px-4">
          {organizations.map((org, index) => (
            <OrganizationCard key={org.id} org={org} index={index} isStatic />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden py-6">
      <div className="absolute top-6 right-2 md:right-4 z-10">
        <motion.button
          onClick={handleStopScrolling}
          className="bg-[#0B1D3A] text-white px-4 md:px-6 py-2 rounded-xl font-semibold shadow-lg hover:bg-[#102949] transition-all text-sm md:text-base"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{ fontFamily: 'var(--font-inter-tight)' }}
        >
          List All
        </motion.button>
      </div>

      <motion.div ref={contentRef} className="flex gap-6" style={{ x: baseX }}>
        {duplicatedOrgs.map((org, index) => (
          <div
            key={`${org.id}-${index}-${rowIndex}`}
            data-card
            onClick={(event) => {
              if ((event.target as HTMLElement).closest('a')) {
                return
              }
              handleStopScrolling()
            }}
            className="cursor-pointer"
          >
            <OrganizationCard org={org} index={index} />
          </div>
        ))}
      </motion.div>
    </div>
  )
}

const OrganizationCard = ({ org, index, isStatic = false }: { org: Organization; index: number; isStatic?: boolean }) => {
  const slug = org.organization_name.toLowerCase().replace(/\s+/g, '-')

  return (
    <motion.div
      className={`bg-white rounded-2xl shadow-lg border border-[#0B1D3A]/10 hover:shadow-xl transition-all overflow-hidden group ${
        isStatic ? '' : 'flex-shrink-0 w-[320px] md:w-[380px]'
      }`}
      whileHover={{ scale: 1.02, y: -8 }}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-bold text-[#0B1D3A] line-clamp-2">{org.organization_name}</h3>
          <div className="flex items-center ml-2">
            {org.is_verified ? (
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
        </div>

        {(org.bio || org.website) && (
          <p className="text-[#0B1D3A]/70 text-sm mb-4 line-clamp-3 leading-relaxed">
            {org.bio || `Contact: ${org.first_name} ${org.last_name}`}
          </p>
        )}

        <div className="space-y-2 mb-4">
          {org.location && (
            <div className="flex items-center text-sm text-[#0B1D3A]">
              <MapPin className="h-4 w-4 mr-2 text-elegant-brown-medium flex-shrink-0" />
              <span className="font-medium">{org.location}</span>
            </div>
          )}
          {(org.organization_website || org.website) && (
            <div className="flex items-center text-sm text-[#0B1D3A]">
              <Globe className="h-4 w-4 mr-2 text-elegant-brown-medium flex-shrink-0" />
              <a
                href={(org.organization_website || org.website) ?? '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#0B1D3A] hover:text-elegant-green-dark truncate font-medium"
              >
                {(org.organization_website || org.website)?.replace(/^https?:\/\//, '')}
              </a>
            </div>
          )}
          {org.first_name && org.last_name && (
            <div className="flex items-center text-sm text-[#0B1D3A]">
              <Users className="h-4 w-4 mr-2 text-elegant-brown-medium flex-shrink-0" />
              <span>Contact: {org.first_name} {org.last_name}</span>
            </div>
          )}
        </div>

        <Link
          href={`/organizations/${slug}`}
          className="w-full bg-[#0B1D3A] text-white py-3 px-4 rounded-xl font-semibold hover:bg-[#102949] transition-all text-center block shadow-md hover:shadow-lg"
        >
          View Organization
        </Link>
      </div>
    </motion.div>
  )
}

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const heroRef = useRef<HTMLDivElement>(null)
  const heroInView = useInView(heroRef, { once: true, amount: 0.3 })

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const { data, error } = await supabase
          .from('organization_view')
          .select('*')
          .order('organization_name', { ascending: true })

        if (error) {
          setOrganizations([])
          return
        }

        const organizationsWithStatus = (data || []).map((org) => ({
          ...org,
          is_verified: org.is_verified || false
        }))

        setOrganizations(organizationsWithStatus)
      } catch (error) {
        setOrganizations([])
      } finally {
        setLoading(false)
      }
    }

    fetchOrganizations()
  }, [])

  const filteredOrganizations = organizations.filter((org) => {
    return (
      org.organization_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (org.bio && org.bio.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (org.location && org.location.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6]">
        <div className="relative min-h-[500px] md:min-h-[600px] flex items-center justify-center overflow-hidden bg-gradient-to-b from-white/40 via-white/20 to-white/40">
          <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
            <div className="animate-pulse">
              <div className="h-12 md:h-16 bg-[#0B1D3A]/20 rounded w-3/4 mx-auto mb-6"></div>
              <div className="h-6 bg-[#0B1D3A]/20 rounded w-1/2 mx-auto mb-8"></div>
              <div className="h-14 bg-white/80 rounded-2xl w-full max-w-2xl mx-auto"></div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl shadow-lg border border-[#0B1D3A]/10 p-6">
                  <div className="h-6 bg-[#0B1D3A]/20 rounded w-3/4 mb-3"></div>
                  <div className="h-4 bg-[#0B1D3A]/20 rounded w-1/2 mb-4"></div>
                  <div className="h-20 bg-[#0B1D3A]/10 rounded mb-4"></div>
                  <div className="h-10 bg-[#0B1D3A]/20 rounded w-full"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      <motion.section
        ref={heroRef}
        className="relative min-h-[500px] md:min-h-[600px] flex items-center justify-center overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="absolute inset-0 w-full h-full">
          {heroBackgroundImages.map((src, index) => (
            <AnimatedBackgroundImage key={`bg-img-${index}`} src={src} index={index} />
          ))}
        </div>

        <div className="relative z-[10] max-w-4xl mx-auto px-6 sm:px-8 lg:px-10 py-20 text-center">
          <div className="absolute inset-0 bg-white rounded-3xl shadow-2xl border-4 border-[#0B1D3A]" style={{ zIndex: 1 }} />

          <motion.h1
            className="relative text-4xl md:text-5xl lg:text-6xl font-black mb-6"
            style={{ fontFamily: 'var(--font-inter-tight)', color: '#0B1D3A', zIndex: 2, position: 'relative' }}
            initial={{ opacity: 0, y: 30 }}
            animate={heroInView ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <Typewriter text="Discover Organizations" delay={80} />
          </motion.h1>

          <motion.p
            className="relative text-lg md:text-xl mb-8 font-bold"
            style={{ fontFamily: 'var(--font-inter-tight)', color: '#0B1D3A', zIndex: 2, position: 'relative' }}
            initial={{ opacity: 0, y: 20 }}
            animate={heroInView ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            Connect with organizations creating events across Europe
          </motion.p>

          <motion.div
            className="relative max-w-2xl mx-auto"
            style={{ zIndex: 2, position: 'relative' }}
            initial={{ opacity: 0, y: 20 }}
            animate={heroInView ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
          >
            <div className="relative bg-white rounded-2xl shadow-2xl border-4 border-[#0B1D3A] p-3">
              <div className="relative flex items-center">
                <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 text-[#0B1D3A]/40 h-6 w-6" />
                <input
                  type="text"
                  placeholder="Search organizations by name, description, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-16 pr-4 py-4 text-lg bg-transparent border-none focus:outline-none focus:ring-0 font-bold placeholder:text-[#0B1D3A] placeholder:opacity-70"
                  style={{ fontFamily: 'var(--font-inter-tight)', color: '#0B1D3A' }}
                />
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      <div className="w-full py-12 overflow-hidden">
        {filteredOrganizations.length === 0 ? (
          <motion.div
            className="text-center py-12"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Building className="h-12 w-12 text-[#0B1D3A]/30 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-[#0B1D3A] mb-2">No organizations found</h3>
            <p className="text-[#0B1D3A]/60">
              {searchTerm ? 'Try adjusting your search criteria' : 'No organizations are currently available. Check back soon!'}
            </p>
          </motion.div>
        ) : (
          <MarqueeRow organizations={filteredOrganizations} direction="left" speed={40} rowIndex={0} />
        )}

        {filteredOrganizations.length > 0 && (
          <motion.div
            className="text-center mt-8 text-[#0B1D3A]/60 font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Showing {filteredOrganizations.length} of {organizations.length} organizations
          </motion.div>
        )}
      </div>
    </div>
  )
}
