'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion, useScroll, useTransform, useInView, useMotionValue, useSpring } from 'framer-motion'
import { Calendar, Users, ArrowRight, Star, CheckCircle, Award } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Stats {
  totalEvents: number
  totalOrganizations: number
  totalParticipants: number
  totalApplications: number
  acceptedApplications: number
  pendingApplications: number
  upcomingEvents: number
}

interface Creator {
  name: string
  role: string
  description: string
  gradient: string
}

// Gallery images
const galleryImages = [
  'https://i.pinimg.com/736x/1d/67/ad/1d67adb1c2fb06236272c9125f6930d1.jpg',
  'https://i.pinimg.com/1200x/d3/fa/f0/d3faf0ed7989863d5499f5041e46c513.jpg',
  'https://i.pinimg.com/736x/6a/a9/5a/6aa95af5f4c6b4d1d35b00c17aab65ca.jpg',
  'https://i.pinimg.com/736x/5f/9c/16/5f9c16117b2b1d3fb3f1f7095d5f747e.jpg',
  'https://i.pinimg.com/1200x/24/8c/7b/248c7b9c002815db9beec55c90ebbd9a.jpg',
  'https://i.pinimg.com/736x/14/26/b4/1426b44f0ba38405663b5da798584d16.jpg',
  'https://i.pinimg.com/1200x/20/79/00/2079008cf7bc8c9c4d114b19ba2e3c07.jpg',
  'https://i.pinimg.com/1200x/e6/2c/c5/e62cc509cd98aea2fb04d33547ede827.jpg',
  'https://i.pinimg.com/1200x/1a/4f/b3/1a4fb3695d6864effd380a65f9d4ce6f.jpg',
  'https://i.pinimg.com/736x/af/34/7f/af347fe88222bccfafb99c6cfd97cf76.jpg',
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

// Transparent Title Section
const TransparentTitleSection = () => {
  const introRef = useRef<HTMLDivElement>(null)
  const introInView = useInView(introRef, { once: true, amount: 0.3 })

  return (
    <motion.section
      ref={introRef}
      className="relative h-screen flex items-center justify-center overflow-hidden bg-elegant-navy-dark"
      initial={{ opacity: 0 }}
      animate={introInView ? { opacity: 1 } : {}}
      transition={{ duration: 1.2 }}
    >
      {/* Background Image */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: 'url(https://i.pinimg.com/1200x/e0/b3/93/e0b39350a86b7195925e6e4dc7446758.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />
      
      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-elegant-navy-dark/80 via-elegant-navy-dark/60 to-elegant-navy-dark/80" />
      
      <motion.div
        className="relative z-10 text-center"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={introInView ? { scale: 1, opacity: 1 } : {}}
        transition={{ duration: 1.5, ease: 'easeOut' }}
      >
        <h1
          className="text-7xl md:text-[10rem] lg:text-[14rem] font-black leading-[0.9] tracking-tight"
          style={{
            backgroundImage: 'linear-gradient(180deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.6) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            textShadow: '0 0 80px rgba(255, 255, 255, 0.3)',
            fontFamily: 'var(--font-inter-tight), system-ui, sans-serif',
            letterSpacing: '-0.03em',
          }}
        >
          ERASMUS+
        </h1>
        <motion.h2
          className="text-5xl md:text-[7rem] lg:text-[10rem] font-black leading-[0.9] tracking-tight mt-2"
          style={{
            backgroundImage: 'linear-gradient(180deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.6) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            textShadow: '0 0 80px rgba(255, 255, 255, 0.3)',
            fontFamily: 'var(--font-inter-tight), system-ui, sans-serif',
            letterSpacing: '-0.03em',
          }}
          initial={{ opacity: 0, y: 30 }}
          animate={introInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.5, duration: 1 }}
        >
          CONNECT
        </motion.h2>
      </motion.div>
    </motion.section>
  )
}

// Figma-Style Draggable Gallery
const DraggableGallery = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  
  // Calculate constraints based on container width
  const [constraints, setConstraints] = useState({ left: 0, right: 0 })
  
  useEffect(() => {
    const updateConstraints = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth
        const imageWidth = 400 // Each image is 400px wide
        const gap = 24 // Gap between images
        const totalWidth = galleryImages.length * (imageWidth + gap) - gap
        const maxDrag = containerWidth - totalWidth
        
        setConstraints({
          left: Math.min(0, maxDrag),
          right: 0,
        })
      }
    }
    
    updateConstraints()
    window.addEventListener('resize', updateConstraints)
    return () => window.removeEventListener('resize', updateConstraints)
  }, [])

  // Mouse parallax effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        const centerX = rect.left + rect.width / 2
        const centerY = rect.top + rect.height / 2
        mouseX.set((e.clientX - centerX) / rect.width)
        mouseY.set((e.clientY - centerY) / rect.height)
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [mouseX, mouseY])

  const parallaxX = useSpring(useTransform(mouseX, [-0.5, 0.5], [-5, 5]), { stiffness: 50, damping: 20 })
  const parallaxY = useSpring(useTransform(mouseY, [-0.5, 0.5], [-5, 5]), { stiffness: 50, damping: 20 })

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden z-0">
      {/* Subtle overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-elegant-navy-dark/20 via-transparent to-elegant-navy-dark/20 z-10 pointer-events-none" />
      
      <motion.div
        className="flex gap-6 h-full items-center z-0"
        style={{ x }}
        drag="x"
        dragConstraints={constraints}
        dragElastic={0.1}
        dragMomentum={true}
        dragTransition={{ bounceStiffness: 300, bounceDamping: 30 }}
        whileDrag={{ cursor: 'grabbing' }}
      >
        {galleryImages.map((image, index) => (
          <motion.div
            key={`${image}-${index}`}
            className="flex-shrink-0 w-[400px] h-[600px] rounded-2xl overflow-hidden shadow-2xl relative"
            style={{
              x: parallaxX,
              y: parallaxY,
            }}
            whileHover={{ scale: 1.02, zIndex: 20 }}
            transition={{ duration: 0.3 }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image}
              alt={`Gallery image ${index + 1}`}
              className="w-full h-full object-cover"
              loading="eager"
              draggable={false}
            />
            {/* Subtle shadow overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}

export default function Home() {
  const [stats, setStats] = useState<Stats>({ 
    totalEvents: 0, 
    totalOrganizations: 0, 
    totalParticipants: 0, 
    totalApplications: 0,
    acceptedApplications: 0,
    pendingApplications: 0,
    upcomingEvents: 0
  })
  const [loading, setLoading] = useState(true)
  
  const heroRef = useRef<HTMLDivElement>(null)
  const impactRef = useRef<HTMLDivElement>(null)
  const whyChooseRef = useRef<HTMLDivElement>(null)
  const creatorRef = useRef<HTMLDivElement>(null)
  
  const { scrollYProgress } = useScroll()
  const heroScale = useTransform(scrollYProgress, [0, 0.3], [1, 0.98])
  
  const heroInView = useInView(heroRef, { once: true, amount: 0.3 })
  const impactInView = useInView(impactRef, { once: true, amount: 0.2 })
  const whyChooseInView = useInView(whyChooseRef, { once: true, amount: 0.2 })
  const creatorInView = useInView(creatorRef, { once: true, amount: 0.2 })

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStats()
    }, 100)
    
    return () => clearTimeout(timer)
  }, [])

  const fetchStats = async () => {
    try {
      const [
        eventsResult, 
        orgsResult, 
        participantsResult, 
        applicationsResult,
        acceptedAppsResult,
        pendingAppsResult,
        upcomingEventsResult
      ] = await Promise.all([
        supabase.from('events').select('id', { count: 'exact' }).eq('is_published', true),
        supabase.from('profiles').select('id', { count: 'exact' }).eq('user_type', 'organization'),
        supabase.from('profiles').select('id', { count: 'exact' }).eq('user_type', 'participant'),
        supabase.from('applications').select('id', { count: 'exact' }),
        supabase.from('applications').select('id', { count: 'exact' }).eq('status', 'accepted'),
        supabase.from('applications').select('id', { count: 'exact' }).eq('status', 'pending'),
        supabase.from('events').select('id', { count: 'exact' }).eq('is_published', true).gte('start_date', new Date().toISOString())
      ])

      setStats({
        totalEvents: eventsResult.count || 0,
        totalOrganizations: orgsResult.count || 0,
        totalParticipants: participantsResult.count || 0,
        totalApplications: applicationsResult.count || 0,
        acceptedApplications: acceptedAppsResult.count || 0,
        pendingApplications: pendingAppsResult.count || 0,
        upcomingEvents: upcomingEventsResult.count || 0
      })
    } catch {
      setStats({
        totalEvents: 0,
        totalOrganizations: 0,
        totalParticipants: 0,
        totalApplications: 0,
        acceptedApplications: 0,
        pendingApplications: 0,
        upcomingEvents: 0
      })
    } finally {
      setLoading(false)
    }
  }

  // Creator data
  const creators: Creator[] = [
    {
      name: 'Scout Society',
      role: 'Platform Architects',
      description: 'Leading the development of Erasmus+ Connect with a vision to bridge communities across Europe.',
      gradient: 'from-elegant-green-dark to-elegant-green-medium',
    },
    {
      name: 'Design Collective',
      role: 'Visual Storytellers',
      description: 'Creating the cinematic, editorial aesthetic that makes Erasmus+ Connect feel both premium and approachable.',
      gradient: 'from-elegant-navy-dark to-elegant-navy-medium',
    },
    {
      name: 'Community Builders',
      role: 'Ecosystem Developers',
      description: 'Building the network of organizations, participants, and partners that make the platform thrive.',
      gradient: 'from-elegant-brown-medium to-elegant-brown-light',
    },
    {
      name: 'Tech Innovators',
      role: 'Platform Engineers',
      description: 'Ensuring scalability, security, and seamless user experiences with robust infrastructure.',
      gradient: 'from-elegant-green-medium to-elegant-green-dark',
    },
    {
      name: 'Youth Leaders',
      role: 'Community Advocates',
      description: 'Connecting young people across Europe and fostering meaningful relationships through events.',
      gradient: 'from-elegant-navy-medium to-elegant-brown-light',
    },
  ]

  // Timeline data
  const timelineData = [
    { 
      year: '1998', 
      title: 'Early International Mobility Initiative', 
      description: 'Foundation of cross-border educational exchange programs across Europe',
      glow: 'from-elegant-green-dark to-elegant-green-medium'
    },
    { 
      year: '2004', 
      title: 'Expansion of Educational Partnerships', 
      description: 'Major expansion connecting universities and institutions across member states',
      glow: 'from-elegant-navy-dark to-elegant-navy-medium'
    },
    { 
      year: '2010', 
      title: 'Mobility Grants First Introduced', 
      description: 'Financial support system launched to enable wider participation',
      glow: 'from-elegant-brown-medium to-elegant-brown-light'
    },
    { 
      year: '2014', 
      title: 'Major Program Restructuring', 
      description: 'Comprehensive reform enhancing program accessibility and impact',
      glow: 'from-elegant-green-medium to-elegant-green-dark'
    },
    { 
      year: '2020', 
      title: 'Digital Collaboration Rollout', 
      description: 'Transition to digital platforms enabling remote and hybrid exchanges',
      glow: 'from-elegant-navy-medium to-elegant-brown-light'
    },
    { 
      year: '2024', 
      title: 'Cross-Country Youth Innovation Labs', 
      description: 'Launch of innovation-focused programs connecting young entrepreneurs',
      glow: 'from-elegant-brown-light to-elegant-green-medium'
    },
  ]

  return (
    <div className="min-h-screen bg-[#FAF9F6] overflow-hidden" style={{ fontFamily: 'var(--font-inter-tight)' }}>
      {/* Transparent Title Section */}
      <TransparentTitleSection />
      
      {/* Hero Section with Draggable Gallery */}
      <motion.section
        ref={heroRef}
        className="relative min-h-screen flex items-center justify-center overflow-hidden bg-elegant-navy-dark"
        style={{ scale: heroScale }}
      >
        {/* 10% Global Opacity Reduction Overlay */}
        <div className="absolute inset-0 bg-black/10 z-10 pointer-events-none" />
        {/* Desktop interactive gallery */}
        <div className="hidden md:block">
          <DraggableGallery />
        </div>
        {/* Mobile static background fallback */}
        <div
          className="absolute inset-0 md:hidden"
          style={{
            backgroundImage: 'url(https://i.pinimg.com/1200x/24/8c/7b/248c7b9c002815db9beec55c90ebbd9a.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
          aria-hidden
        />
        
        {/* Centered Info Container */}
        <motion.div
          className="relative z-30 max-w-2xl mx-auto px-4 sm:px-6 lg:px-8"
          initial={{ y: 50 }}
          animate={heroInView ? { y: 0 } : {}}
          transition={{ duration: 1, ease: 'easeOut' }}
        >
          <motion.div
            className="relative bg-[#F8F3EB] rounded-3xl p-6 md:p-10 shadow-2xl border border-white/20"
            style={{
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
            }}
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-center space-y-5">
              {/* Headline */}
              <motion.h1
                className="text-4xl md:text-6xl lg:text-7xl font-black text-[#0B1D3A] leading-tight tracking-tight"
                initial={{ y: 20 }}
                animate={heroInView ? { y: 0 } : {}}
                transition={{ duration: 0.8, delay: 0.2 }}
                style={{ fontFamily: 'var(--font-inter-tight)' }}
              >
                Step Into the{' '}
                <span className="text-[#0B1D3A]">
                  <Typewriter text="Erasmus+ World" delay={80} />
              </span>
              </motion.h1>

              {/* Supporting text */}
              <motion.p
                className="text-base md:text-lg text-[#0B1D3A] leading-relaxed font-bold max-w-xl mx-auto"
                initial={{ y: 20 }}
                animate={heroInView ? { y: 0 } : {}}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                Discover transformative event experiences that connect young people across Europe. 
                Join a vibrant community building meaningful connections through verified Erasmus+ events.
              </motion.p>

              {/* CTA Button with Stars */}
              <motion.div
                className="relative inline-block"
                initial={{ y: 20 }}
                animate={heroInView ? { y: 0 } : {}}
                transition={{ delay: 0.6 }}
              >
                {/* Floating Stars */}
                {[
                  { x: -30, y: -15, delay: 0 },
                  { x: -20, y: -25, delay: 0.3 },
                  { x: 10, y: -30, delay: 0.6 },
                  { x: 25, y: -20, delay: 0.9 },
                  { x: 35, y: -10, delay: 1.2 },
                  { x: -15, y: 20, delay: 0.2 },
                  { x: 15, y: 25, delay: 0.5 },
                  { x: 30, y: 15, delay: 0.8 },
                ].map((star, i) => (
                  <motion.div
                    key={i}
                    className="absolute"
                    style={{
                      left: `${star.x}px`,
                      top: `${star.y}px`,
                    }}
                    animate={{
                      y: [0, -8, 0],
                      rotate: [0, 180, 360],
                      opacity: [0.7, 1, 0.7],
                      scale: [1, 1.2, 1],
                    }}
                    transition={{
                      duration: 2.5 + i * 0.3,
                      repeat: Infinity,
                      delay: star.delay,
                    }}
                  >
                    <Star 
                      className="w-4 h-4 text-[#D4AF37]" 
                      fill="currentColor"
                      style={{
                        filter: 'drop-shadow(0 0 6px rgba(212, 175, 55, 0.9))',
                      }}
                    />
                  </motion.div>
                ))}
                
                <Link
                  href="/auth"
                  className="group relative inline-flex items-center gap-3 bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-elegant-navy-dark px-8 py-4 rounded-lg font-bold text-lg hover:from-[#F4D03F] hover:to-[#D4AF37] transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 z-10"
                  style={{
                    boxShadow: '0 4px 20px rgba(212, 175, 55, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                  }}
                >
                  Join the Community
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
            <motion.div
              className="w-1 h-3 bg-white/50 rounded-full mt-2"
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
        </motion.div>
      </motion.section>

      {/* Erasmus+ Historical Timeline */}
      <section
        ref={impactRef}
        className="relative py-32 bg-[#FAF9F6] overflow-hidden"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            className="text-center mb-20"
            initial={{ opacity: 0, y: 30 }}
            animate={impactInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-5xl md:text-6xl font-black text-elegant-navy-dark mb-6 tracking-tight" style={{ fontFamily: 'var(--font-inter-tight)' }}>
              Erasmus+ Historical Evolution
            </h2>
            <p className="text-xl text-elegant-green-dark max-w-2xl mx-auto font-light">
              A journey of connection, growth, and innovation across Europe
            </p>
          </motion.div>

          {/* Horizontal Timeline */}
          <div className="relative pt-20 pb-24 md:pt-24 md:pb-32">
            {/* Strong Navy Blue Timeline Axis */}
            <div className="absolute top-1/2 left-0 right-0 h-3 bg-[#0B1D3A] hidden md:block -translate-y-1/2 shadow-2xl" 
              style={{
                boxShadow: '0 0 30px rgba(11, 29, 58, 0.8), 0 4px 8px rgba(0, 0, 0, 0.3)',
              }}
            />
            
            {/* EU Flags Above Timeline */}
            <div className="absolute top-1/2 left-0 right-0 hidden md:block -translate-y-[140px]">
              {[
                { country: 'IT', url: 'https://seekflag.com/wp-content/uploads/2021/12/Flag-of-Italy-01-1.svg', size: 42 },
                { country: 'FR', url: 'https://seekflag.com/wp-content/uploads/2021/11/Flag-of-France-01-1.svg', size: 38 },
                { country: 'DE', url: 'https://seekflag.com/wp-content/uploads/2021/11/Flag-of-Germany-01-1.svg', size: 40 },
                { country: 'BE', url: 'https://seekflag.com/wp-content/uploads/2021/11/Flag-of-Belgian-01-1.svg', size: 36 },
                { country: 'PL', url: 'https://seekflag.com/wp-content/uploads/2022/01/Poland-01-1.svg', size: 34 },
                { country: 'PT', url: 'https://seekflag.com/wp-content/uploads/2021/12/portugal-01-1.svg', size: 38 },
                { country: 'ES', url: 'https://seekflag.com/wp-content/uploads/2021/12/Flag-of-Spain-01-2.svg', size: 40 },
                { country: 'RO', url: 'https://seekflag.com/wp-content/uploads/2021/12/romania-01-1.svg', size: 36 },
                { country: 'GR', url: 'https://seekflag.com/wp-content/uploads/2021/11/Flag-of-Greece-01-1.svg', size: 34 },
                { country: 'BG', url: 'https://seekflag.com/wp-content/uploads/2021/11/Flag-of-Bulgaria-01.svg', size: 32 },
              ].map((flag, index) => (
                <motion.div
                  key={flag.country}
                  className="absolute"
                  style={{
                    left: `${6 + index * 9.5}%`,
                  }}
                  initial={{ opacity: 0, y: -20 }}
                  animate={impactInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: index * 0.1, type: 'spring', stiffness: 100 }}
                  whileHover={{ y: -8, scale: 1.15 }}
                >
                  <motion.img
                    src={flag.url}
                    alt={flag.country}
                    width={flag.size}
                    height={flag.size * 0.67}
                    className="rounded shadow-lg"
                    animate={{
                      y: [0, -10, 0],
                    }}
                    transition={{
                      duration: 3 + index * 0.3,
                      repeat: Infinity,
                      delay: index * 0.2,
                    }}
                    style={{
                      filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3)) drop-shadow(0 0 12px rgba(11, 29, 58, 0.2))',
                    }}
                  />
                </motion.div>
              ))}
            </div>
            
            {/* Year Labels Below Flags, Above Cards */}
            <div className="absolute top-1/2 left-0 right-0 hidden md:block -translate-y-[70px] z-10">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                <div className="grid grid-cols-6 gap-6">
                  {timelineData.map((milestone, index) => (
                    <motion.div
                      key={index}
                      className="flex justify-center"
                      initial={{ opacity: 0, scale: 0 }}
                      animate={impactInView ? { opacity: 1, scale: 1 } : {}}
                      transition={{ delay: index * 0.15 + 0.3 }}
                    >
                      <div className="bg-[#0B1D3A] px-4 py-1.5 rounded-full text-sm font-black text-white shadow-lg min-w-[70px] text-center"
                        style={{
                          boxShadow: '0 4px 12px rgba(11, 29, 58, 0.5)',
                        }}
                      >
                        {milestone.year}
              </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 mt-8">
              {timelineData.map((milestone, index) => (
                <motion.div
                  key={index}
                  className="relative"
                  initial={{ opacity: 0, y: 50, scale: 0.8 }}
                  animate={impactInView ? { opacity: 1, y: 0, scale: 1 } : {}}
                  transition={{ delay: index * 0.15, type: 'spring', stiffness: 100 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                >
                  {/* Milestone Card */}
                  <motion.div
                    className={`relative mt-8 md:mt-0 md:top-1/2 p-6 rounded-xl bg-white border-2 border-[#0B1D3A]/20 shadow-lg max-w-full min-h-[220px]`}
                    whileHover={{
                      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
                    }}
                  >
                    <h3 className="text-base font-bold text-[#0B1D3A] mb-2 leading-tight">{milestone.title}</h3>
                    <p className="text-xs text-elegant-green-dark leading-relaxed font-medium">{milestone.description}</p>
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Creator Section */}
      <motion.section
        ref={creatorRef}
        className="relative py-32 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={creatorInView ? { opacity: 1 } : {}}
        transition={{ duration: 0.8 }}
      >
        {/* Background Image */}
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: 'url(https://i.pinimg.com/1200x/e8/c4/5c/e8c45c28eaa6c5e97ec64c8344716538.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        />
        
        {/* Soft Opacity Overlay */}
        <div className="absolute inset-0 bg-white/70" />
        
        {/* Floating Stars */}
        {[
          { left: 10, top: 15, xOffset: 5, duration: 8, delay: 0 },
          { left: 25, top: 30, xOffset: -8, duration: 10, delay: 0.5 },
          { left: 45, top: 20, xOffset: 6, duration: 9, delay: 1 },
          { left: 60, top: 40, xOffset: -5, duration: 11, delay: 1.5 },
          { left: 75, top: 25, xOffset: 7, duration: 8.5, delay: 0.3 },
          { left: 15, top: 60, xOffset: -6, duration: 9.5, delay: 0.8 },
          { left: 35, top: 70, xOffset: 4, duration: 10.5, delay: 1.2 },
          { left: 55, top: 55, xOffset: -7, duration: 8.8, delay: 0.6 },
          { left: 80, top: 65, xOffset: 5, duration: 9.2, delay: 1.8 },
          { left: 20, top: 80, xOffset: -4, duration: 10.2, delay: 0.4 },
          { left: 50, top: 85, xOffset: 6, duration: 8.7, delay: 1.1 },
          { left: 70, top: 75, xOffset: -5, duration: 9.8, delay: 0.7 },
          { left: 30, top: 45, xOffset: 4, duration: 10.3, delay: 1.4 },
          { left: 65, top: 50, xOffset: -6, duration: 8.9, delay: 0.9 },
          { left: 85, top: 35, xOffset: 5, duration: 9.6, delay: 1.6 },
        ].map((star, i) => (
          <motion.div
            key={i}
            className="absolute pointer-events-none"
            style={{
              left: `${star.left}%`,
              top: `${star.top}%`,
            }}
            animate={{
              y: [0, -30, 0],
              x: [0, star.xOffset, 0],
              opacity: [0.3, 0.7, 0.3],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: star.duration,
              repeat: Infinity,
              delay: star.delay,
            }}
          >
            <Star 
              className="w-3 h-3 text-[#D4AF37]" 
              fill="currentColor"
              style={{
                filter: 'drop-shadow(0 0 4px rgba(212, 175, 55, 0.6))',
              }}
            />
          </motion.div>
        ))}
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            className="text-center mb-20"
            initial={{ opacity: 0, y: 30 }}
            animate={creatorInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-5xl md:text-6xl font-black text-elegant-navy-dark mb-6 tracking-tight" style={{ fontFamily: 'var(--font-inter-tight)' }}>
              Our Creators
            </h2>
            <p className="text-xl text-elegant-green-dark max-w-2xl mx-auto font-light">
              Meet the passionate team building the future of European connections
            </p>
          </motion.div>

          {/* Creator Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {creators.map((creator, index) => (
              <motion.div
                key={index}
                className="bg-white rounded-3xl p-6 border border-elegant-navy-dark/10 shadow-lg overflow-hidden group"
                initial={{ opacity: 0, y: 50 }}
                animate={creatorInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: index * 0.1, type: 'spring', stiffness: 100 }}
                whileHover={{ scale: 1.05, y: -8, boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)' }}
              >
                {/* Photo placeholder */}
                <div className={`w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br ${creator.gradient} shadow-lg flex items-center justify-center text-white text-2xl font-black`}>
                  {creator.name.charAt(0)}
            </div>

                <h3 className="text-xl font-bold text-elegant-navy-dark mb-2 text-center" style={{ fontFamily: 'var(--font-inter-tight)' }}>
                  {creator.name}
                </h3>
                <p className="text-sm text-elegant-green-dark font-semibold mb-3 text-center">{creator.role}</p>
                <p className="text-sm text-elegant-navy-medium leading-relaxed font-light text-center">
                  {creator.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Our Impact Section */}
      <motion.section
        ref={whyChooseRef}
        className="relative py-32 bg-[#FAF9F6] overflow-hidden"
        initial={{ opacity: 0 }}
        animate={whyChooseInView ? { opacity: 1 } : {}}
        transition={{ duration: 0.8 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            className="text-center mb-20"
            initial={{ opacity: 0, y: 30 }}
            animate={whyChooseInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2 }}
          >
            <h2 
              className="text-5xl md:text-6xl font-black text-elegant-navy-dark mb-6 tracking-tight" 
              style={{ fontFamily: 'var(--font-inter-tight)' }}
            >
              Our Impact
            </h2>
            <p 
              className="text-xl text-elegant-green-dark max-w-2xl mx-auto font-light"
              style={{ fontFamily: 'var(--font-inter-tight)' }}
            >
              Building connections across Europe, one event at a time
            </p>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
            initial={{ opacity: 0, y: 50 }}
            animate={whyChooseInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.4 }}
          >
            {[
              { icon: Calendar, label: 'Upcoming Events', value: stats.upcomingEvents, color: 'elegant-green-dark' },
              { icon: Users, label: 'Active Participants', value: stats.totalParticipants, color: 'elegant-navy-medium' },
              { icon: Award, label: 'Verified Organizations', value: stats.totalOrganizations, color: 'elegant-brown-medium' },
              { icon: CheckCircle, label: 'Accepted Applications', value: stats.acceptedApplications, color: 'elegant-green-medium' },
            ].map((stat, index) => (
              <motion.div
                key={index}
                className="text-center p-6 rounded-xl bg-[#0B1D3A] shadow-lg"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={whyChooseInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 0.6 + index * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
              >
                <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <stat.icon className="h-8 w-8 text-white" />
                </div>
                <div 
                  className="text-4xl font-black text-white mb-2" 
                  style={{ fontFamily: 'var(--font-inter-tight)' }}
                >
                  {loading ? '...' : stat.value.toLocaleString()}
                </div>
                <div 
                  className="text-white font-medium"
                  style={{ fontFamily: 'var(--font-inter-tight)' }}
                >
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Final CTA Section */}
      <motion.section
        className="relative py-32 overflow-hidden"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.8 }}
      >
        {/* Background Image */}
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: 'url(https://i.pinimg.com/1200x/34/ef/db/34efdbfee7989d49803ef1d5bc1adc3f.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        />
        
        {/* Overlay - More Opaque for Better Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B1D3A]/75 via-[#0B1D3A]/70 to-[#0B1D3A]/75" />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.h2
            className="text-5xl md:text-6xl font-black mb-6 tracking-tight"
            style={{
              backgroundImage: 'linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 255, 255, 0.85) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontFamily: 'var(--font-inter-tight)',
              textShadow: '0 2px 8px rgba(255, 255, 255, 0.3)',
            }}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            Ready to Connect?
          </motion.h2>
          <motion.p
            className="text-xl mb-12 max-w-2xl mx-auto font-medium"
            style={{
              backgroundImage: 'linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.8) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textShadow: '0 2px 6px rgba(255, 255, 255, 0.2)',
            }}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            Join the Erasmus+ Connect community and start building meaningful connections across Europe.
          </motion.p>
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
          >
            <Link
              href="/auth"
              className="group inline-flex items-center justify-center gap-3 bg-[#0B1D3A] text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-[#102949] transition-all duration-300 shadow-2xl hover:shadow-3xl hover:scale-105 border-2 border-white/20"
              style={{
                boxShadow: '0 8px 24px rgba(11, 29, 58, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
              }}
            >
              Join Now
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/events"
              className="inline-flex items-center justify-center gap-3 bg-[#D4AF37] text-[#0B1D3A] px-8 py-4 rounded-lg font-bold text-lg hover:bg-[#F4D03F] transition-all duration-300 shadow-2xl hover:shadow-3xl hover:scale-105 border-2 border-white/30"
              style={{
                boxShadow: '0 8px 24px rgba(212, 175, 55, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
              }}
            >
              Browse Events
            </Link>
          </motion.div>
        </div>
      </motion.section>
    </div>
  )
}
