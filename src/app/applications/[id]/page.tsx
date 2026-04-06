'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { 
  ArrowLeft, 
  User, 
  Mail, 
  MapPin, 
  Calendar, 
  Globe, 
  FileText, 
  Download, 
  ShieldAlert, 
  ChevronRight, 
  Plus,
  CheckCircle,
  XCircle,
  AlertCircle,
  Languages,
  Target,
  Briefcase,
  Clock,
  ExternalLink
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { calculateAge, formatDate } from '@/lib/utils'
import Notification from '@/components/Notification'

interface Application {
  id: string
  participant_id: string
  event_id: string
  status: 'pending' | 'accepted' | 'rejected'
  motivation_letter: string
  cv_url?: string | null
  created_at: string
}

interface Profile {
  id: string
  first_name: string
  last_name: string
  email: string
  birth_date: string
  gender: string
  nationality: string
  residency_country: string
  location: string
  role_in_project: string
  languages: { name: string; level: string }[]
  participant_target_groups: string[]
  bio: string
}

interface Event {
  id: string
  title: string
  organization_id: string
}

export default function ApplicationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [application, setApplication] = useState<Application | null>(null)
  const [participant, setParticipant] = useState<Profile | null>(null)
  const [event, setEvent] = useState<Event | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [authorized, setAuthorized] = useState(true)

  const fetchApplicationDetails = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth')
        return
      }

      // 1. Fetch Application
      const { data: appData, error: appError } = await supabase
        .from('applications')
        .select('*')
        .eq('id', params.id)
        .single()

      if (appError) throw appError
      setApplication(appData)

      // 2. Fetch Event (to check authorization)
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('id, title, organization_id')
        .eq('id', appData.event_id)
        .single()

      if (eventError) throw eventError
      setEvent(eventData)

      // Authorization check: Only the owning organization can view
      if (eventData.organization_id !== session.user.id) {
        setAuthorized(false)
        setLoading(false)
        return
      }

      // 3. Fetch Participant Profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', appData.participant_id)
        .single()

      if (profileError) throw profileError
      setParticipant(profileData)

    } catch (err: any) {
      console.error('Error fetching application:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [params.id, router])

  useEffect(() => {
    fetchApplicationDetails()
  }, [fetchApplicationDetails])

  const handleStatusUpdate = async (newStatus: 'accepted' | 'rejected') => {
    if (!application || updating) return
    setUpdating(true)
    setError(null)
    setSuccess(null)

    try {
      const { error: updateError } = await supabase
        .from('applications')
        .update({ status: newStatus })
        .eq('id', application.id)

      if (updateError) throw updateError

      setApplication(prev => prev ? { ...prev, status: newStatus } : null)
      setSuccess(`Application marked as ${newStatus} successfully!`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFF]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1A6FE8]"></div>
      </div>
    )
  }

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFF] px-6">
        <div className="max-w-md w-full bg-white rounded-[32px] border border-[#E2ECFB] p-10 text-center shadow-xl">
           <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <XCircle size={32} />
           </div>
           <h1 className="text-[22px] font-bold text-[#0D1B3E] mb-3">Unauthorized Access</h1>
           <p className="text-gray-400 text-sm mb-8 leading-relaxed">You don't have permission to view this application information.</p>
           <button onClick={() => router.push('/dashboard/organization')} className="w-full py-4 bg-[#1A6FE8] text-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
              Back to Dashboard
           </button>
        </div>
      </div>
    )
  }

  if (error && !application) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFF]">
        <div className="text-center">
          <p className="text-rose-500 mb-4">{error}</p>
          <button onClick={() => router.back()} className="text-[#1A6FE8] font-bold underline">Go Back</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFF] pt-32 pb-40 font-dm-sans selection:bg-blue-100 selection:text-blue-900">
      <AnimatePresence>
        {success && <Notification type="success" message={success} onClose={() => setSuccess(null)} />}
        {error && <Notification type="error" message={error} onClose={() => setError(null)} />}
      </AnimatePresence>

      <div className="max-w-5xl mx-auto px-4 md:px-8">
        
        {/* HEADER SECTION */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
           <div className="space-y-4">
              <Link href="/dashboard/organization" className="inline-flex items-center text-[12px] font-black text-gray-400 uppercase tracking-widest hover:text-[#1A6FE8] transition-colors group">
                 <ArrowLeft size={14} className="mr-2 group-hover:-translate-x-1 transition-transform" /> Back to All Applications
              </Link>
              <div>
                <h1 className="text-[28px] font-bold text-[#0D1B3E] tracking-tight mb-2">
                  {participant?.first_name} {participant?.last_name}
                </h1>
                <p className="text-sm font-medium text-gray-400">
                  Applied for <span className="text-[#1A6FE8] font-bold">{event?.title}</span>
                </p>
              </div>
           </div>

           <div className="flex items-center gap-4">
              <div className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                application?.status === 'accepted' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                application?.status === 'rejected' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                'bg-amber-50 text-amber-600 border-amber-100'
              }`}>
                {application?.status} Status
              </div>
              <div className="text-[11px] font-bold text-gray-300">
                Applied on {formatDate(application?.created_at || '')}
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT: PARTICIPANT PROFILE CARD (4 columns) */}
          <div className="lg:col-span-4 space-y-6">
             <div className="bg-white rounded-[32px] border border-[#E2ECFB] shadow-sm overflow-hidden p-8 sticky top-32">
                <div className="flex flex-col items-center text-center mb-8">
                   <div className="w-20 h-20 bg-[#F4F7FF] rounded-[24px] flex items-center justify-center mb-4 text-[24px] font-black text-[#1A6FE8] border border-[#E2ECFB]">
                      {participant?.first_name?.[0]}{participant?.last_name?.[0]}
                   </div>
                   <h2 className="text-lg font-bold text-[#0D1B3E] mb-1">{participant?.first_name} {participant?.last_name}</h2>
                   <p className="text-xs font-bold text-gray-400 flex items-center gap-1">
                      <Mail size={12} className="text-[#1A6FE8]" /> {participant?.email}
                   </p>
                </div>

                <div className="h-px bg-[#F8FAFF] w-full mb-8" />

                <div className="space-y-6">
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                         <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Age</p>
                         <p className="text-[13px] font-bold text-[#0D1B3E]">{participant?.birth_date ? calculateAge(participant.birth_date) : 'N/A'} yrs</p>
                      </div>
                      <div>
                         <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Gender</p>
                         <p className="text-[13px] font-bold text-[#0D1B3E] capitalize">{participant?.gender || 'N/A'}</p>
                      </div>
                   </div>

                   <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Location</p>
                      <div className="flex items-center gap-2 text-[13px] font-bold text-[#0D1B3E]">
                         <MapPin size={12} className="text-[#1A6FE8]" /> {participant?.location}
                      </div>
                      <p className="text-[11px] font-medium text-gray-400 mt-1">{participant?.nationality} Nationality</p>
                   </div>

                   <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Role in Project</p>
                      <div className="flex items-center gap-2 text-[13px] font-bold text-[#0D1B3E]">
                         <Briefcase size={12} className="text-[#1A6FE8]" /> {participant?.role_in_project || 'Participant'}
                      </div>
                   </div>

                   <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Languages</p>
                      <div className="flex flex-wrap gap-2">
                         {participant?.languages?.map((lang, idx) => (
                           <span key={idx} className="bg-[#F8FAFF] text-[#1A6FE8] px-3 py-1 rounded-full text-[10px] font-bold border border-[#E2ECFB]">
                             {lang.name} — {lang.level}
                           </span>
                         ))}
                         {(!participant?.languages || participant.languages.length === 0) && <p className="text-[11px] text-gray-300 font-medium italic">No languages listed</p>}
                      </div>
                   </div>
                </div>
             </div>
          </div>

          {/* RIGHT: MOTIVATION & CV (8 columns) */}
          <div className="lg:col-span-8 space-y-8 pb-40">
             
             {/* MOTIVATION LETTER CARD */}
             <div className="bg-white rounded-[32px] border border-[#E2ECFB] shadow-sm p-10 space-y-8">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-50 text-[#1A6FE8] rounded-xl flex items-center justify-center">
                         <FileText size={20} />
                      </div>
                      <h3 className="text-lg font-bold text-[#0D1B3E]">Motivation Letter</h3>
                   </div>
                </div>

                <div className="prose prose-blue max-w-none">
                   <p className="text-[15px] leading-relaxed text-[#0D1B3E]/80 whitespace-pre-wrap font-medium">
                      {application?.motivation_letter}
                   </p>
                </div>
             </div>

             {/* ATTACHMENTS CARD */}
             <div className="bg-white rounded-[32px] border border-[#E2ECFB] shadow-sm p-10 space-y-8">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                      <Calendar size={20} />
                   </div>
                   <h3 className="text-lg font-bold text-[#0D1B3E]">Attachments</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className={`p-6 rounded-[24px] border border-[#E2ECFB] flex items-center justify-between transition-all group ${application?.cv_url ? 'bg-[#F8FAFF] hover:border-[#1A6FE8]/20' : 'bg-gray-50 opacity-60'}`}>
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-[#1A6FE8] shadow-sm">
                            <FileText size={20} />
                         </div>
                         <div>
                            <p className="text-[13px] font-bold text-[#0D1B3E]">Curriculum Vitae</p>
                            <p className="text-[11px] font-medium text-gray-400">PDF Document</p>
                         </div>
                      </div>
                      
                      {application?.cv_url ? (
                        <a 
                          href={application.cv_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="w-10 h-10 bg-[#1A6FE8] text-white rounded-xl flex items-center justify-center hover:scale-105 transition-all shadow-[0_4px_12px_rgba(26,111,232,0.2)]"
                        >
                           <ExternalLink size={16} />
                        </a>
                      ) : (
                        <div className="w-10 h-10 bg-gray-200 text-gray-400 rounded-xl flex items-center justify-center cursor-not-allowed">
                           <Download size={16} />
                        </div>
                      )}
                   </div>

                   <div className="p-6 rounded-[24px] border border-[#E2ECFB] bg-white flex items-center justify-between opacity-40">
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 shadow-sm">
                            <Plus size={20} />
                         </div>
                         <div>
                            <p className="text-[13px] font-bold text-[#0D1B3E]">Support Document</p>
                            <p className="text-[11px] font-medium text-gray-400">Not provided</p>
                         </div>
                      </div>
                   </div>
                </div>
             </div>

             {/* BIO SECTION */}
             {participant?.bio && (
               <div className="bg-white rounded-[32px] border border-[#E2ECFB] shadow-sm p-10 space-y-6">
                  <h3 className="text-lg font-bold text-[#0D1B3E]">Participant Bio</h3>
                  <p className="text-[14px] leading-relaxed text-gray-500 font-medium italic">
                    "{participant.bio}"
                  </p>
               </div>
             )}
          </div>
        </div>
      </div>

      {/* STICKY BOTTOM ACTION BAR */}
      <AnimatePresence>
        {application?.status === 'pending' && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-0 left-0 right-0 h-24 bg-white/80 backdrop-blur-lg border-t border-[#E2ECFB] z-50 flex items-center justify-center px-6"
          >
            <div className="max-w-5xl w-full flex items-center justify-end gap-6">
               <button 
                onClick={() => handleStatusUpdate('rejected')}
                disabled={updating}
                className="px-8 py-4 border-2 border-rose-500 text-rose-500 rounded-2xl text-[12px] font-bold uppercase tracking-widest hover:bg-rose-50 transition-all flex items-center gap-2 disabled:opacity-50"
               >
                 <XCircle size={18} /> Reject Application
               </button>
               <button 
                onClick={() => handleStatusUpdate('accepted')}
                disabled={updating}
                className="px-12 py-4 bg-[#1A6FE8] text-white rounded-2xl text-[12px] font-bold uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 flex items-center gap-2 disabled:opacity-50"
               >
                 {updating ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                 ) : (
                    <><CheckCircle size={18} /> Accept Application</>
                 )}
               </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
