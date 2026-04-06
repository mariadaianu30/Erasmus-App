'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { 
  Calendar, MapPin, Users, Clock, CheckCircle, 
  XCircle, AlertCircle, Eye, FileText, ChevronDown, 
  ChevronUp, ArrowLeft 
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface User {
  id: string
  email?: string
}

interface Application {
  id: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  motivation_letter?: string
  events: {
    id: string
    title: string
    description: string
    start_date: string
    end_date: string
    location: string
    category: string
    max_participants: number
  }
}

// Sub-component for Status Badge
const StatusBadge = ({ status }: { status: string }) => {
  const styles = {
    pending: 'bg-[#FFF9E5] text-[#D97706]', // Amber
    accepted: 'bg-[#E6FFFA] text-[#047857]', // Green
    rejected: 'bg-[#FFF5F5] text-[#C53030]', // Red
  }
  const labels = {
    pending: 'Under Review',
    accepted: 'Accepted',
    rejected: 'Not Selected',
  }
  const currentStyle = styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-600'
  const currentLabel = labels[status as keyof typeof labels] || status

  return (
    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${currentStyle}`}>
      {currentLabel}
    </span>
  )
}

// Sub-component for Application Card
const ApplicationCard = ({ app }: { app: Application }) => {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-[24px] border border-[#E2ECFB] p-8 shadow-sm hover:shadow-[0_8px_30px_rgba(26,111,232,0.06)] transition-all group"
    >
      <div className="flex flex-col space-y-6">
        {/* Top Header Labeling */}
        <div className="flex items-center justify-between">
          <StatusBadge status={app.status} />
          <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <Calendar size={12} className="text-[#1A6FE8]" />
            {new Date(app.events.start_date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })} — 
            {new Date(app.events.end_date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
          </div>
        </div>

        {/* Content Section */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-[#0D1B3E] group-hover:text-[#1A6FE8] transition-colors">
            {app.events.title}
          </h3>
          
          <div className="relative">
             <p className={`text-sm text-gray-500 leading-relaxed transition-all duration-300 ${!isExpanded ? 'line-clamp-3' : ''}`}>
              {app.events.description}
            </p>
            {app.events.description.length > 200 && (
              <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="mt-2 text-[10px] font-black text-[#1A6FE8] uppercase tracking-widest hover:underline flex items-center gap-1"
              >
                {isExpanded ? <>Show Less <ChevronUp size={12} /></> : <>Read More <ChevronDown size={12} /></>}
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-6 items-center pt-2">
            <div className="flex items-center text-xs font-bold text-gray-400 gap-2">
              <MapPin size={14} className="text-[#1A6FE8]" />
              {app.events.location}
            </div>
            <div className="flex items-center text-xs font-bold text-gray-400 gap-2">
              <Users size={14} className="text-[#1A6FE8]" />
              Max {app.events.max_participants} Participants
            </div>
          </div>
        </div>

        <div className="h-px bg-[#F0F4FA]" />

        {/* Status Message Block */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Applied on {new Date(app.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
            </span>
          </div>

          {app.status === 'pending' && (
            <div className="bg-[#E8F1FD] border-l-4 border-[#1A6FE8] p-5 rounded-r-2xl">
              <p className="text-sm font-bold text-[#0D1B3E]">Your application is being reviewed...</p>
              <p className="text-xs text-gray-500 mt-1">The organization will notify you as soon as a decision is reached.</p>
            </div>
          )}

          {app.status === 'accepted' && (
            <div className="bg-[#E6FFFA] border-l-4 border-[#047857] p-5 rounded-r-2xl">
              <p className="text-sm font-bold text-[#047857]">Congratulations! You&apos;ve been accepted.</p>
              <p className="text-xs text-[#047857]/70 mt-1">Check your email for boarding passes and instructions.</p>
            </div>
          )}

          {app.status === 'rejected' && (
            <div className="bg-[#FFF5F5] border-l-4 border-[#C53030] p-5 rounded-r-2xl">
              <p className="text-sm font-bold text-[#C53030]">Thank you for applying.</p>
              <p className="text-xs text-[#C53030]/70 mt-1">While you weren&apos;t selected this time, there are many more opportunities!</p>
            </div>
          )}

          {/* Motivation Preview */}
          {app.motivation_letter && (
            <div className="space-y-2 mt-2">
              <label className="text-[10px] font-black text-[#1A6FE8] uppercase tracking-widest ml-1">Motivation Letter Preview</label>
              <div className="bg-[#F8FAFF] rounded-2xl p-6 border border-[#E2ECFB] font-mono text-[11px] text-gray-500 leading-relaxed italic">
                &quot;{app.motivation_letter.slice(0, 150)}...&quot;
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 pt-2">
          <Link
            href={`/events/${app.events.id}`}
            className="px-6 py-3 border-2 border-[#1A6FE8] text-[#1A6FE8] text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-[#1A6FE8] hover:text-white transition-all flex items-center gap-2"
          >
            <Eye size={14} /> View Event
          </Link>
        </div>
      </div>
    </motion.div>
  )
}

export default function MyApplicationsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all')
  const router = useRouter()

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.user) {
        router.push('/auth')
        return
      }

      setUser(session.user)
      await fetchApplications(session.user.id)
      setLoading(false)
    }

    getSession()
  }, [router])

  const fetchApplications = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          id,
          status,
          created_at,
          motivation_letter,
          events!applications_event_id_fkey (
            id, title, description, start_date, end_date, location, category, max_participants
          )
        `)
        .eq('participant_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setApplications(data as any || [])
    } catch (error) {
      console.error('Error fetching applications:', error)
    }
  }

  const filteredApplications = applications.filter(app => {
    if (filter === 'all') return true
    return app.status === filter
  })

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFF]">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-100 border-t-[#1A6FE8] rounded-full animate-spin"></div>
        </div>
        <p className="mt-6 text-sm font-black text-[#0D1B3E] uppercase tracking-[0.2em]">Syncing Applications...</p>
      </div>
    )
  }

  const stats = [
    { label: 'Total', count: applications.length, color: 'text-blue-600' },
    { label: 'Pending', count: applications.filter(a => a.status === 'pending').length, color: 'text-[#D97706]' },
    { label: 'Accepted', count: applications.filter(a => a.status === 'accepted').length, color: 'text-[#047857]' },
    { label: 'Rejected', count: applications.filter(a => a.status === 'rejected').length, color: 'text-[#C53030]' }
  ]

  return (
    <div className="min-h-screen bg-[#F8FAFF] font-dm-sans pb-20 selection:bg-[#1A6FE8] selection:text-white pt-[116px]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
          <div className="space-y-2">
            <Link href="/dashboard" className="inline-flex items-center text-[10px] font-black text-[#1A6FE8] uppercase tracking-widest hover:gap-2 transition-all mb-4">
              <ArrowLeft size={14} className="mr-2" /> Back to Dashboard
            </Link>
            <h1 className="text-4xl font-black text-[#0D1B3E] tracking-tight">My Applications</h1>
            <p className="text-sm font-medium text-gray-400">Track and manage your opportunity applications across the map.</p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-3 mb-12">
          {['all', 'pending', 'accepted', 'rejected'].map((f) => {
            const count = f === 'all' ? applications.length : applications.filter(a => a.status === f).length
            const isActive = filter === f
            return (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`group flex items-center gap-3 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  isActive 
                  ? 'bg-[#1A6FE8] text-white shadow-xl shadow-blue-100' 
                  : 'bg-white text-gray-400 border border-[#E2ECFB] hover:border-[#1A6FE8]/30'
                }`}
              >
                {f}
                <span className={`px-2 py-0.5 rounded-lg text-[9px] ${
                  isActive ? 'bg-white/20 text-white' : 'bg-[#F0F4FA] text-gray-400'
                }`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Applications Feed */}
        <div className="space-y-8 min-h-[400px]">
          {filteredApplications.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-[32px] border border-[#E2ECFB] p-20 text-center shadow-sm">
              <FileText className="h-16 w-16 text-[#1A6FE8]/20 mx-auto mb-6" />
              <h3 className="text-xl font-bold text-[#0D1B3E] mb-2">No applications found</h3>
              <p className="text-gray-400 mb-8 max-w-sm mx-auto">It looks like you haven&apos;t applied to any programs matching this filter yet.</p>
              <Link
                href="/events"
                className="inline-block px-10 py-5 bg-[#1A6FE8] text-white font-black text-xs uppercase tracking-widest rounded-full shadow-lg hover:scale-105 transition-all"
              >
                Browse New Events
              </Link>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 gap-8">
              {filteredApplications.map((app) => (
                <ApplicationCard key={app.id} app={app} />
              ))}
            </div>
          )}
        </div>

        {/* Bottom Metrics Summary */}
        <div className="mt-20">
          <div className="h-px bg-[#E2ECFB] mb-12" />
          <h2 className="text-[10px] font-black text-[#1A6FE8] uppercase tracking-[0.3em] mb-8 text-center">Global Application Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((s, i) => (
              <div key={i} className="bg-[#F8FAFF] rounded-3xl p-8 text-center flex flex-col justify-center gap-2">
                <span className={`text-4xl font-black ${s.label === 'Total' ? 'text-[#0D1B3E]' : s.color}`}>{s.count}</span>
                <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-20 text-center pb-10">
           <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest flex items-center justify-center gap-2">
             <CheckCircle size={14} className="text-blue-200" /> All data is encrypted and managed by Antigravity EU
           </p>
        </div>
      </div>
    </div>
  )
}