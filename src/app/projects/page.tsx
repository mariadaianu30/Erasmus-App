'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Search, Calendar, MapPin, Users, Tag, Mail, Clock, ChevronRight, Filter, X, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

interface Project {
  id: string
  organization_id: string
  project_title: string
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
  is_published?: boolean
  created_at: string
}



export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [typeFilter, setTypeFilter] = useState('All Types')
  const [countryFilter, setCountryFilter] = useState('All Countries')
  const [statusFilter, setStatusFilter] = useState('All Status')

  useEffect(() => {
    checkUser()
    fetchProjects()
  }, [])

  const checkUser = async () => {
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
  }

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('is_published', true)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      setProjects(data || [])
    } catch (error) {
      console.error('Error fetching projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const isDeadlinePassed = (deadline: string | null) => {
    if (!deadline) return false
    return new Date(deadline) < new Date()
  }

  const filteredProjects = projects.filter((project) => {
    const matchesSearch = project.project_title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          project.organization_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          project.short_description?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesType = typeFilter === 'All Types' || project.project_type === typeFilter
    const matchesCountry = countryFilter === 'All Countries' || project.searching_partners_countries.includes(countryFilter)
    const matchesStatus = statusFilter === 'All Status' || 
                          (statusFilter === 'Active' && !isDeadlinePassed(project.deadline_for_partner_request)) ||
                          (statusFilter === 'Expired' && isDeadlinePassed(project.deadline_for_partner_request))

    return matchesSearch && matchesType && matchesCountry && matchesStatus
  })

  const handleContactPartner = async (project: Project) => {
    if (!user || !profile) {
      alert('Please log in as an organization to contact partners')
      return
    }

    const contactEmail = project.project_email || 'info@erasmusplus.connect'
    const subject = encodeURIComponent(`Partnership collaboration request: ${project.project_title}`)
    const body = encodeURIComponent(
      `Hello ${project.organization_name},\n\n` +
      `We saw your project "${project.project_title}" on Antigravity and we are interested in collaborating with you.\n\n` +
      `Organization: ${profile.organization_name || 'Our Organization'}\n\n` +
      `Looking forward to hearing from you!`
    )
    
    window.location.href = `mailto:${contactEmail}?subject=${subject}&body=${body}`
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'TBA'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const uniqueTypes = ['All Types', ...new Set(projects.map(p => p.project_type).filter(Boolean))] as string[]
  const uniqueCountries = ['All Countries', ...new Set(projects.flatMap(p => p.searching_partners_countries))] as string[]

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFF] pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="h-8 bg-gray-200 rounded-md w-48 animate-pulse mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="h-64 bg-white rounded-3xl animate-pulse shadow-sm border border-[#E2ECFB]" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFF] pt-32 pb-20 selection:bg-blue-100 selection:text-blue-900 font-dm-sans">
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12">
        
        {/* PAGE HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-8">
          <div>
            <h1 className="text-[28px] font-bold text-[#0D1B3E] mb-2 tracking-tight">Partnership Projects</h1>
            <p className="text-sm text-gray-500 font-medium font-dm-sans">Find and connect with organizations looking for partners</p>
          </div>
          {profile?.user_type === 'organization' && (
            <Link 
              href="/projects/create"
              className="inline-flex items-center gap-3 px-7 py-4 bg-[#1A6FE8] text-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-blue-700 transition-all shadow-[0_8px_24px_rgba(26,111,232,0.25)] hover:-translate-y-0.5"
            >
              <Plus size={18} /> Create Project
            </Link>
          )}
        </div>

        {/* FILTERS BAR */}
        <div className="bg-white p-4 md:p-5 rounded-[24px] border border-[#E2ECFB] flex flex-col lg:flex-row items-center gap-4 mb-10 shadow-sm">
          <div className="relative flex-1 w-full lg:w-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-6 py-3.5 bg-[#F8FAFF] border border-[#E2ECFB] rounded-xl text-sm font-medium focus:outline-none focus:border-[#1A6FE8] transition-all"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <select 
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-[#F8FAFF] border border-[#E2ECFB] px-4 py-3 rounded-xl text-[13px] font-medium text-[#0D1B3E] focus:outline-none focus:border-[#1A6FE8] transition-all appearance-none cursor-pointer"
            >
              {uniqueTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select 
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="bg-[#F8FAFF] border border-[#E2ECFB] px-4 py-3 rounded-xl text-[13px] font-medium text-[#0D1B3E] focus:outline-none focus:border-[#1A6FE8] transition-all appearance-none cursor-pointer"
            >
              {uniqueCountries.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#F8FAFF] border border-[#E2ECFB] px-4 py-3 rounded-xl text-[13px] font-medium text-[#0D1B3E] focus:outline-none focus:border-[#1A6FE8] transition-all appearance-none cursor-pointer"
            >
              <option value="All Status">All Status</option>
              <option value="Active">Active Only</option>
              <option value="Expired">Expired Only</option>
            </select>
            <div className="flex-1 lg:flex-none text-right lg:ml-4">
              <span className="text-[12px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">
                {filteredProjects.length} {filteredProjects.length === 1 ? 'Project' : 'Projects'} Found
              </span>
            </div>
          </div>
        </div>

        {/* PROJECT GRID */}
        {filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[40px] border border-dashed border-[#E2ECFB]">
            <div className="w-20 h-20 bg-[#F8FAFF] rounded-full flex items-center justify-center mb-6">
              <Filter className="text-[#1A6FE8]/20" size={32} />
            </div>
            <h3 className="text-lg font-bold text-[#0D1B3E] mb-2">No projects found</h3>
            <p className="text-sm text-gray-500 mb-8">Try adjusting your filters to find more results</p>
            <button 
              onClick={() => {setSearchQuery(''); setTypeFilter('All Types'); setCountryFilter('All Countries'); setStatusFilter('All Status');}}
              className="text-[#1A6FE8] font-bold text-sm underline underline-offset-4 hover:opacity-80 transition-all"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <AnimatePresence mode="popLayout">
              {filteredProjects.map((project) => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={project.id}
                  className={`bg-white rounded-[28px] border border-[#E2ECFB] p-8 shadow-sm hover:shadow-xl hover:border-[#1A6FE8]/20 transition-all group relative ${isDeadlinePassed(project.deadline_for_partner_request) ? 'opacity-90 grayscale-[0.2]' : ''}`}
                  whileHover={{ y: -5 }}
                >
                  {/* TOP ROW */}
                  <div className="flex items-center justify-between mb-8">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${project.project_type === 'Training Course' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                      {project.project_type || 'Erasmus+ Event'}
                    </span>
                    {isDeadlinePassed(project.deadline_for_partner_request) && (
                      <span className="bg-rose-50 text-rose-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-2">
                        <Clock size={12} /> Expired
                      </span>
                    )}
                  </div>

                  {/* TITLE & ORG */}
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-[#0D1B3E] mb-1 group-hover:text-[#1A6FE8] transition-colors leading-tight truncate">
                      {project.project_title}
                    </h3>
                    <p className="text-[13px] font-medium text-gray-400">by {project.organization_name}</p>
                  </div>

                  {/* DESCRIPTION */}
                  <p className="text-[14px] leading-relaxed text-gray-500 mb-8 line-clamp-2 min-h-[44px]">
                    {project.short_description || 'Collaborative youth mobility project under Erasmus+ framework.'}
                  </p>

                  {/* PARTNERS COUNTRIES */}
                  <div className="mb-8">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Searching partners in:</p>
                    <div className="flex flex-wrap gap-2">
                      {project.searching_partners_countries.slice(0, 3).map((country, idx) => (
                        <span key={idx} className="bg-[#F8FAFF] px-3 py-1.5 rounded-lg text-[12px] font-semibold text-gray-600 border border-[#E2ECFB]">
                          {country}
                        </span>
                      ))}
                      {project.searching_partners_countries.length > 3 && (
                        <span className="bg-white px-3 py-1.5 rounded-lg text-[12px] font-bold text-[#1A6FE8] border border-blue-50">
                          +{project.searching_partners_countries.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* DATES & DEADLINE */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 bg-[#F8FAFF]/50 p-4 rounded-2xl border border-[#F0F5FF]">
                    <div className="flex items-center gap-3 text-gray-500">
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#1A6FE8] shadow-sm">
                        <Calendar size={14} />
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Duration</p>
                        <p className="text-[13px] font-bold text-[#0D1B3E]">{formatDate(project.begin_date)}</p>
                      </div>
                    </div>
                    <div className={`flex items-center gap-3 ${isDeadlinePassed(project.deadline_for_partner_request) ? 'text-rose-500' : 'text-gray-500'}`}>
                      <div className={`w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm ${isDeadlinePassed(project.deadline_for_partner_request) ? 'text-rose-600' : 'text-[#1A6FE8]'}`}>
                        <Clock size={14} />
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Deadline</p>
                        <p className="text-[13px] font-bold">{formatDate(project.deadline_for_partner_request)}</p>
                      </div>
                    </div>
                  </div>

                  {/* TOPIC TAGS */}
                  <div className="flex flex-wrap gap-2 mb-8">
                    {project.tags?.map((tag, idx) => (
                      <span key={idx} className="px-3 py-1 rounded-full border border-[#D0DCF5] text-[11px] font-bold text-gray-500 uppercase tracking-wider bg-white">
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* BOTTOM ROW */}
                  <div className="flex items-center justify-between pt-6 border-t border-[#F0F5FF]">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Users size={14} />
                      <span className="text-[12px] font-bold">{project.number_of_partners_needed} Needed</span>
                    </div>
                    <div className="flex gap-2">
                       <Link 
                        href={`/projects/${project.id}`}
                        className="px-5 py-2.5 bg-white border border-[#1A6FE8] text-[#1A6FE8] rounded-xl text-[12px] font-bold hover:bg-blue-50 transition-all flex items-center gap-2"
                       >
                         View Details
                       </Link>
                       <button 
                        onClick={() => handleContactPartner(project)}
                        className="px-5 py-2.5 bg-[#1A6FE8] text-white rounded-xl text-[12px] font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center gap-2"
                       >
                         Contact Partner <ArrowUpRight size={14} />
                       </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}
