'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Calendar, MapPin, Users, Tag, Mail, Clock, ArrowLeft, Share2, Globe, Heart } from 'lucide-react'
import Link from 'next/link'
import ShareOpportunity from '@/components/ShareOpportunity'
import { motion } from 'framer-motion'

interface Project {
  id: string
  project_title: string
  organization_id: string
  organization_name: string | null
  project_email: string | null
  searching_partners_countries: string[]
  begin_date: string | null
  end_date: string | null
  deadline_for_partner_request: string | null
  number_of_partners_needed: number
  short_description: string | null
  full_description: string | null
  project_type: string | null
  tags: string[]
  is_active: boolean
  created_at: string
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" }
  }
}

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)

  const checkUser = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUser(session.user)
        const { data: profileData } = await supabase
          .from('profiles')
          .select('user_type, organization_name')
          .eq('id', session.user.id)
          .single()
        setProfile(profileData)
      }
    } catch (error) {
      console.error('Error checking user:', error)
    }
  }, [])

  const fetchProject = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error) throw error
      setProject(data)
    } catch (error) {
      console.error('Error fetching project:', error)
    } finally {
      setLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    checkUser()
    fetchProject()
  }, [checkUser, fetchProject])

  const handleContactPartner = async () => {
    if (!user || !profile || !project) {
      alert('Please log in as an organization to contact partners')
      return
    }

    const contactEmail = project.project_email || 'info@erasmusplus.connect'
    const subject = encodeURIComponent(`Partnership Collaboration Request: ${project.project_title}`)
    const body = encodeURIComponent(
      `Dear ${project.organization_name || 'Organization'} Team,\n\n` +
      `I hope this message finds you well. I am writing to express my organization's interest in collaborating on your project: "${project.project_title}".\n\n` +
      `My organization, ${profile.organization_name || 'N/A'}, is very interested in exploring partnership opportunities with you.\n\n` +
      `Thank you for your time and consideration.\n\n` +
      `Best regards,\n` +
      `${profile.organization_name || 'Organization Representative'}`
    )
    
    window.location.href = `mailto:${contactEmail}?subject=${subject}&body=${body}`
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not specified'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const isDeadlinePassed = (deadline: string | null) => {
    if (!deadline) return false
    return new Date(deadline) < new Date()
  }

  const getInitials = (name: string | null) => {
    if (!name) return 'UN'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white pt-24">
        <div className="max-w-[780px] mx-auto px-6 py-12 animate-pulse">
          <div className="h-4 bg-gray-100 rounded w-24 mb-12"></div>
          <div className="h-40 bg-gray-50 rounded-2xl mb-8"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-50 rounded-2xl"></div>
            <div className="h-64 bg-gray-50 rounded-2xl"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-white pt-24 px-6">
        <div className="max-w-[780px] mx-auto py-32 text-center">
            <h2 className="text-2xl font-bold text-[#0D1B3E] mb-4">Project detail not found</h2>
            <Link href="/projects" className="text-[#1A6FE8] font-bold hover:underline">Back to Partnership Projects</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white pt-24 pb-20 selection:bg-blue-100 selection:text-blue-900 font-dm-sans">
      <motion.div 
        className="max-w-[780px] mx-auto px-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* 1. BREADCRUMB + ACTIONS BAR */}
        <motion.div variants={itemVariants} className="flex items-center justify-between mb-6">
          <Link
            href="/projects"
            className="flex items-center text-[13px] font-medium text-[#6B7A99] hover:text-[#0D1B3E] transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Partnership Projects
          </Link>
          <ShareOpportunity 
            title={project.project_title} 
            url={typeof window !== 'undefined' ? window.location.href : `/projects/${project.id}`} 
            type="project" 
          />
        </motion.div>

        {/* 2. PROJECT HERO SECTION */}
        <motion.div variants={itemVariants} className="mb-8">
          <div className="inline-flex items-center bg-blue-50 text-[#1A6FE8] px-3 py-1 rounded-full text-[12px] font-bold uppercase tracking-wider mb-6">
            {project.project_type || 'Training Course'}
          </div>
          <h1 className="text-[32px] md:text-[36px] font-bold text-[#0D1B3E] leading-[1.1] mb-4 tracking-tight">
            {project.project_title}
          </h1>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 rounded-full bg-[#1A6FE8] text-white flex items-center justify-center text-[11px] font-black">
              {getInitials(project.organization_name)}
            </div>
            <span className="text-[14px] font-medium text-[#6B7A99]">by {project.organization_name?.toLowerCase()}</span>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-blue-50 text-[#1A6FE8] px-4 py-1.5 rounded-full text-[12px] font-bold whitespace-nowrap border border-blue-100/50">
              <Users size={14} /> Partners Needed: {project.number_of_partners_needed}
            </div>
            <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[12px] font-bold whitespace-nowrap border ${isDeadlinePassed(project.deadline_for_partner_request) ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-gray-50 text-[#6B7A99] border-gray-100'}`}>
               <Clock size={14} /> Deadline: {formatDate(project.deadline_for_partner_request)} 
               {isDeadlinePassed(project.deadline_for_partner_request) && <span className="ml-1 opacity-60 text-[10px] uppercase font-black">Expired</span>}
            </div>
            {project.tags?.slice(0, 3).map((tag, i) => (
              <div key={i} className="flex items-center gap-2 bg-white text-[#6B7A99] border border-[#E2ECFB] px-4 py-1.5 rounded-full text-[12px] font-bold whitespace-nowrap">
                {tag}
              </div>
            ))}
          </div>
        </motion.div>

        {/* 3. KEY INFO GRID */}
        <motion.div variants={itemVariants} className="bg-[#F0F6FF] rounded-[24px] p-6 md:p-8 mb-12 border border-blue-100/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-white text-[#1A6FE8] shadow-sm flex items-center justify-center flex-shrink-0">
                <Globe size={18} />
              </div>
              <div>
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1.5">Searching Partners In</p>
                <div className="flex flex-wrap gap-1.5">
                  {project.searching_partners_countries.map((c, i) => (
                    <span key={i} className="bg-white px-2.5 py-1 rounded-lg text-[12px] font-bold text-[#0D1B3E] shadow-sm">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-white text-[#1A6FE8] shadow-sm flex items-center justify-center flex-shrink-0">
                <Calendar size={18} />
              </div>
              <div>
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1.5">Project Dates</p>
                <p className="text-[14px] font-bold text-[#0D1B3E]">{formatDate(project.begin_date)} – {formatDate(project.end_date)}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center flex-shrink-0">
                <Clock size={18} className={isDeadlinePassed(project.deadline_for_partner_request) ? 'text-rose-500' : 'text-[#1A6FE8]'} />
              </div>
              <div>
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1.5">Deadline</p>
                <div className="flex items-center gap-2">
                  <p className={`text-[14px] font-bold ${isDeadlinePassed(project.deadline_for_partner_request) ? 'text-rose-600' : 'text-[#0D1B3E]'}`}>
                    {formatDate(project.deadline_for_partner_request)}
                  </p>
                  {isDeadlinePassed(project.deadline_for_partner_request) && (
                    <span className="bg-[#FEE2E2] text-[#DC2626] px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider">
                      Expired
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-white text-[#1A6FE8] shadow-sm flex items-center justify-center flex-shrink-0">
                <Users size={18} />
              </div>
              <div>
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1.5">Partners Needed</p>
                <p className="text-[14px] font-bold text-[#0D1B3E]">{project.number_of_partners_needed} organizations</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 4. CONTENT SECTIONS */}
        <div className="space-y-12 mb-16">
          <motion.section variants={itemVariants}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-[3px] h-4 bg-[#1A6FE8] rounded-full" />
              <h4 className="text-[11px] font-black text-[#6B7A99] uppercase tracking-[0.2em]">Overview</h4>
            </div>
            <p className="text-[16px] leading-relaxed text-[#0D1B3E]/80 selection:bg-blue-50">
              {project.short_description || "Detailed project summary regarding youth mobility goals and training objectives."}
            </p>
          </motion.section>

          <motion.section variants={itemVariants}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-[3px] h-4 bg-[#1A6FE8] rounded-full" />
              <h4 className="text-[11px] font-black text-[#6B7A99] uppercase tracking-[0.2em]">Full Description</h4>
            </div>
            <div className="bg-[#F8FAFF] rounded-[20px] p-6 md:p-8 border border-[#F0F5FF]">
              <p className="text-[15px] leading-relaxed text-[#0D1B3E]/80 whitespace-pre-line selection:bg-white">
                {project.full_description || "No detailed description provided by the organizing team yet."}
              </p>
            </div>
          </motion.section>
        </div>

        {/* 5. CONTACT CTA SECTION */}
        <motion.div 
          variants={itemVariants}
          className="bg-white rounded-[24px] border border-[#E2ECFB] p-8 md:p-10 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8"
        >
          <div className="text-center md:text-left">
            <h3 className="text-[20px] font-bold text-[#0D1B3E] mb-2">Interested in partnering?</h3>
            <p className="text-sm text-[#6B7A99] font-medium max-w-[320px]">Reach out to the organizing team to express your interest.</p>
          </div>
          <button 
            onClick={handleContactPartner}
            className="w-full md:w-auto px-8 py-4 bg-[#1A6FE8] text-white rounded-2xl text-[13px] font-bold uppercase tracking-widest hover:bg-blue-700 transition-all shadow-[0_12px_24px_rgba(26,111,232,0.15)] hover:-translate-y-0.5 flex items-center justify-center gap-3"
          >
           <Mail size={18} /> Contact Partner Organization
          </button>
        </motion.div>
      </motion.div>
    </div>
  )
}
