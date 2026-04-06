'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { calculateAge, formatNameField } from '@/lib/utils'
import { signOutEverywhere } from '@/lib/auth-client'
import { 
  Calendar, Users, User, LogOut, Plus, Settings, TrendingUp, 
  Clock, CheckCircle, XCircle, AlertCircle, Edit, Award, 
  Flag, MapPin, Briefcase, Languages, Mail, FileText, 
  Heart, Camera, Upload, ExternalLink, ChevronRight, MoreHorizontal 
} from 'lucide-react'
import { countries } from '@/lib/countries'
import { calculateProfileCompletion } from '@/lib/profile-completion'
import { motion, AnimatePresence } from 'framer-motion'

interface Application {
  id: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  events: {
    id: string
    title: string
    start_date: string
    end_date: string
    location: string
    category: string
    organization_name: string | null
    organization_id: string | null
  }
}

interface ApplicationStats {
  total: number
  pending: number
  accepted: number
  rejected: number
}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [applicationStats, setApplicationStats] = useState<ApplicationStats>({ total: 0, pending: 0, accepted: 0, rejected: 0 })
  const [favoriteEvents, setFavoriteEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadMessage, setUploadMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null)
  const [visibleFavorites, setVisibleFavorites] = useState(4)
  const router = useRouter()

  const log = useCallback((msg: string) => {
    console.log(`[DASHBOARD OPTIMIZED]: ${msg}`)
  }, [])

  // Optimized Fetch Functions
  const fetchApplications = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select(`
            id, status, created_at,
            events (id, title, start_date, end_date, location, category, organization_id)
          `)
        .eq('participant_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error

      if (data) {
        const organizationIds = [...new Set(data.map((app: any) => app.events?.organization_id).filter(Boolean))]
        if (organizationIds.length > 0) {
           const { data: orgProfiles } = await supabase.from('profiles').select('id, organization_name').in('id', organizationIds)
           const orgMap: Record<string, string> = {}
           orgProfiles?.forEach(p => orgMap[p.id] = p.organization_name || '')
           
           const apps = data.map((app: any) => ({
             ...app,
             events: app.events ? { ...app.events, organization_name: orgMap[app.events.organization_id] || null } : null
           }))
           setApplications(apps)
           setApplicationStats({
             total: apps.length,
             pending: apps.filter(a => a.status === 'pending').length,
             accepted: apps.filter(a => a.status === 'accepted').length,
             rejected: apps.filter(a => a.status === 'rejected').length
           })
        } else {
           setApplications(data as any[])
        }
      }
    } catch (err: any) { log(`Apps fetch error: ${err.message}`) }
  }, [log])

  const fetchFavorites = useCallback(async () => {
    const saved = localStorage.getItem('favorite_events')
    if (saved) {
      try {
        const ids = JSON.parse(saved)
        if (ids.length > 0) {
          const { data } = await supabase.from('events').select('*').in('id', ids)
          setFavoriteEvents(data || [])
        }
      } catch (e) { log('Favorites parse error') }
    }
  }, [log])

// Fetch profile data function
const fetchProfileData = useCallback(async (userId: string) => {
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (profileData) {
    setProfile(profileData)
    setAvatarUrl(profileData.photo_url || null)
    if (profileData.user_type === 'organization') {
      router.push('/dashboard/organization')
      return
    }
  } else {
    const defaultProfile = {
      id: userId,
      user_type: 'participant',
      first_name: 'User',
      last_name: '',
      location: 'European Nomad'
    }
    setProfile(defaultProfile)
    supabase.from('profiles').upsert(defaultProfile).then(({ error }) => {
      if (error) log(`Upsert error: ${error.message}`)
    })
  }
  setLoading(false)
}, [router, log])

  // Core Initialization Logic
  useEffect(() => {
    const safetyTimeout = setTimeout(() => {
      if (loading) {
        log('SAFETY TRIGGER: Forcing hydration.')
        setLoading(false)
      }
    }, 4500) // Reduced from 8s to 4.5s

    // 1. Auth Listener for faster detection
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      log(`Auth event: ${event}`)
      if (event === 'SIGNED_OUT') {
        router.push('/auth')
        return
      }

      if (session?.user) {
        setUser(session.user)
        
        // 2. Parallel Profile Fetching
        fetchProfileData(session.user.id)
        fetchApplications(session.user.id)
        fetchFavorites()
      } else if (event !== 'INITIAL_SESSION') {
         // If no session after initial check and it's not the very first event
         router.push('/auth')
      }
    })

    // Initial session check in case listener missed it
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user && !user) {
        setUser(session.user)
        // Fetch data for the existing session user
        fetchProfileData(session.user.id)
        fetchApplications(session.user.id)
        fetchFavorites()
      } else if (!session && !loading) {
        router.push('/auth')
      }
    })

    return () => {
      subscription.unsubscribe()
      clearTimeout(safetyTimeout)
    }
  }, [router, log, fetchApplications, fetchFavorites, fetchProfileData])

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setIsUploading(true)
    try {
      const { error: uploadError } = await supabase.storage.from('avatars').upload(`${user.id}-${Date.now()}`, file)
      if (uploadError) {
        setUploadMessage({ text: 'Storage Error: Missing "avatars" bucket of file conflict.', type: 'error' })
        return
      }
      setUploadMessage({ text: 'Success! Profile image will update on refresh.', type: 'success' })
    } catch (err: any) { log(`Upload failed: ${err.message}`) }
    finally { setIsUploading(false) }
  }

  const handleSignOut = async () => {
    await signOutEverywhere()
    router.push('/')
  }

  // Merge loading and auth-check to prevent intermediate flickering
  if (loading || (!user && !profile)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFF]">
        <div className="relative">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-16 h-16 border-4 border-blue-100 border-t-[#1A6FE8] rounded-full" />
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="w-2 h-2 bg-[#1A6FE8] rounded-full animate-ping" />
          </div>
        </div>
      </div>
    )
  }

  const completion = profile ? calculateProfileCompletion(profile, profile.user_type).percent : 0

  return (
    <div className="min-h-screen bg-[#F8FAFF] font-dm-sans pb-20 pt-5 selection:bg-[#1A6FE8] selection:text-white">
      {/* BOUTIQUE HERO SECTION */}
      <div className="bg-white border-b border-[#E2ECFB] pt-24 pb-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-blue-50/30 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row items-center md:items-end gap-8 md:gap-12"
          >
            {/* AVATAR WITH STAR RATING/DECORATION */}
            <div className="relative group">
               {/* ROTATING STAR RING */}
               <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="absolute inset-[-15px] opacity-40 pointer-events-none">
                 <svg viewBox="0 0 100 100" className="w-full h-full">
                    {[...Array(8)].map((_, i) => (
                      <path key={i} d="M50 5 L53 14 L62 14 L55 20 L58 29 L50 23 L42 29 L45 20 L38 14 L47 14 Z" fill="#1A6FE8" transform={`rotate(${i * 45} 50 50)`} />
                    ))}
                 </svg>
               </motion.div>

               <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-[6px] border-white shadow-[0_12px_40px_rgba(26,111,232,0.15)] overflow-hidden relative bg-[#F0F5FF] z-10">
                 {avatarUrl ? (
                   <img src={avatarUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                 ) : (
                   <div className="w-full h-full flex items-center justify-center text-[#1A6FE8]/20"><User size={64} /></div>
                 )}
                 <label className="absolute inset-0 bg-[#0D1B3E]/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center cursor-pointer backdrop-blur-[2px] z-20">
                   <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                   <Camera className="text-white w-8 h-8 md:w-10 md:h-10 transform scale-90 group-hover:scale-100 transition-transform" />
                 </label>
               </div>
            </div>

            <div className="flex-1 text-center md:text-left">
               <h1 className="text-4xl md:text-5xl font-black text-[#0D1B3E] tracking-tight mb-3">
                 {profile.first_name || 'Youth Member'} {profile.last_name || ''}
               </h1>
               <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-8">
                  <span className="bg-[#1A6FE8] text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg shadow-blue-200">Participant</span>
                  <span className="flex items-center gap-2 text-sm font-bold text-gray-400">
                    <MapPin className="w-4 h-4 text-[#1A6FE8]" />
                    {profile.location || 'Location missing'}
                  </span>
               </div>
               <div className="max-w-md">
                  <div className="flex justify-between items-end mb-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Profile Strength</p>
                    <p className="text-sm font-black text-[#1A6FE8]">{completion}%</p>
                  </div>
                  <div className="h-3 bg-blue-50 rounded-full overflow-hidden border border-blue-100/50">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${completion}%` }} transition={{ duration: 1.5, ease: "easeOut" }} className="h-full bg-gradient-to-r from-[#1A6FE8] to-[#63A3FF] rounded-full shadow-[0_0_12px_rgba(26,111,232,0.4)]" />
                  </div>
               </div>
            </div>

            <div className="flex gap-4">
               <Link href="/profile" className="px-8 py-4 bg-[#1A6FE8] text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl hover:shadow-blue-200 hover:-translate-y-1 active:scale-95 transition-all flex items-center gap-3">
                 <Edit size={16} /> Edit Profile
               </Link>
               <button onClick={handleSignOut} className="p-4 bg-white border border-red-50 rounded-2xl text-red-400 shadow-sm hover:bg-red-50 transition-all">
                 <LogOut className="w-5 h-5" />
               </button>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 grid grid-cols-1 lg:grid-cols-10 gap-12">
        <div className="lg:col-span-6 space-y-12">
           <div className="grid grid-cols-3 gap-6">
              {[
                { label: 'Applications', val: applicationStats.total, icon: FileText, color: 'text-blue-500' },
                { label: 'Accepted', val: applicationStats.accepted, icon: CheckCircle, color: 'text-emerald-500' },
                { label: 'Saved', val: favoriteEvents.length, icon: Heart, color: 'text-rose-500' }
              ].map((s, i) => (
                <div key={i} className="bg-white p-6 rounded-3xl border border-[#E2ECFB] shadow-sm hover:shadow-md transition-all group">
                  <s.icon className={`w-6 h-6 ${s.color} mb-3 group-hover:scale-110 transition-transform`} />
                  <p className="text-3xl font-black text-[#0D1B3E]">{s.val}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">{s.label}</p>
                </div>
              ))}
           </div>

           {uploadMessage && (
             <div className={`p-6 rounded-3xl border ${uploadMessage.type === 'error' ? 'bg-red-50 border-red-100 text-red-600' : 'bg-blue-50 border-blue-100 text-blue-600'} flex items-start gap-4 shadow-sm`}>
               {uploadMessage.type === 'error' ? <XCircle size={24} /> : <CheckCircle size={24} />}
               <div>
                  <p className="text-[10px] font-black uppercase tracking-widest mb-1">{uploadMessage.type === 'error' ? 'Storage Error' : 'Success'}</p>
                  <p className="text-sm font-medium">{uploadMessage.text}</p>
               </div>
             </div>
           )}

           <div className="space-y-12">
              <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                  <h2 className="text-2xl font-black text-[#0D1B3E] tracking-tight">Recent Applications</h2>
                  <Link href="/my-applications" className="text-sm font-black text-[#1A6FE8] uppercase tracking-widest flex items-center gap-2 hover:gap-3 transition-all">See All <ChevronRight className="w-4 h-4" /></Link>
                </div>
                <div className="bg-white rounded-[32px] border border-[#E2ECFB] overflow-hidden shadow-sm divide-y divide-[#F0F4FA]">
                  {applications.length === 0 ? (
                    <div className="p-20 text-center text-gray-300 font-bold italic">Refreshing applications...</div>
                  ) : (
                    applications.slice(0, 5).map(app => (
                      <div key={app.id} className="p-8 hover:bg-[#F8FAFF] transition-all group border-l-[6px] border-transparent hover:border-[#1A6FE8]">
                         <div className="flex items-center justify-between gap-6">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-lg font-black text-[#0D1B3E] group-hover:text-[#1A6FE8] transition-colors truncate">{app.events?.title || 'Event Loading...'}</h4>
                              <p className="text-sm font-bold text-gray-400 mt-1">{app.events?.organization_name || 'Organization...'} • {new Date(app.created_at).toLocaleDateString()}</p>
                            </div>
                            <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${app.status === 'accepted' ? 'bg-[#E6FFFA] text-[#047857]' : app.status === 'rejected' ? 'bg-[#FFF5F5] text-[#C53030]' : 'bg-[#FFF9E5] text-[#D97706]'}`}>{app.status}</div>
                         </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="space-y-8">
                <div className="flex items-center justify-between px-2">
                  <h2 className="text-2xl font-black text-[#0D1B3E] tracking-tight">Saved Events</h2>
                  {favoriteEvents.length > visibleFavorites && (
                    <button onClick={() => setVisibleFavorites(prev => prev + 4)} className="text-sm font-black text-[#1A6FE8] uppercase tracking-widest hover:underline">Load More</button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {favoriteEvents.length === 0 ? (
                    <div className="col-span-full py-16 text-center bg-white border border-[#E2ECFB] rounded-3xl border-dashed">
                       <Heart className="w-10 h-10 text-gray-100 mx-auto mb-4" />
                       <p className="text-sm font-bold text-gray-300 italic">Syncing saved highlights...</p>
                    </div>
                  ) : (
                    favoriteEvents.slice(0, visibleFavorites).map((event) => (
                      <Link key={event.id} href={`/events/${event.id}`} className="block group">
                        <div className="bg-white p-5 rounded-[28px] border border-[#E2ECFB] shadow-sm hover:shadow-xl hover:border-[#1A6FE8]/20 transition-all flex gap-5 h-full">
                           <div className="w-20 h-20 rounded-2xl overflow-hidden bg-blue-50 flex-shrink-0 relative group-hover:scale-95 transition-transform">
                              {event.photo_url ? (
                                <img src={event.photo_url} className="w-full h-full object-cover" alt="" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-blue-200"><Calendar size={32} /></div>
                              )}
                           </div>
                           <div className="flex-1 min-w-0 pr-2 pt-1">
                              <h4 className="text-sm font-black text-[#0D1B3E] group-hover:text-[#1A6FE8] transition-colors truncate">{event.title}</h4>
                              <p className="text-[10px] font-bold text-gray-400 mt-0.5 truncate">{event.organization_name}</p>
                              <div className="flex items-center gap-1.5 mt-4 text-[10px] font-black text-[#1A6FE8] uppercase tracking-widest">Explore <ChevronRight size={14} /></div>
                           </div>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </div>
           </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
           <div className="bg-white rounded-[40px] p-10 text-[#0D1B3E] shadow-xl border border-[#E2ECFB] relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 opacity-50" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#1A6FE8] mb-10">Youth Identity</h3>
              <div className="space-y-8 relative z-10">
                 <div className="relative pl-8 before:content-[''] before:absolute before:left-0 before:top-2 before:w-1.5 before:h-1.5 before:bg-[#1A6FE8] before:rounded-full">
                    <p className="text-[9px] font-black uppercase tracking-widest text-[#1A6FE8]/40 mb-1">Passport Name</p>
                    <p className="text-lg font-black text-[#0D1B3E]">{profile.first_name || 'Member'} {profile.last_name || ''}</p>
                 </div>
                 <div className="relative pl-8 before:content-[''] before:absolute before:left-0 before:top-2 before:w-1.5 before:h-1.5 before:bg-[#1A6FE8] before:rounded-full">
                    <p className="text-[9px] font-black uppercase tracking-widest text-[#1A6FE8]/40 mb-1">Email Access</p>
                    <p className="text-sm font-bold text-[#1A6FE8] truncate">{user?.email}</p>
                 </div>
                 <div className="relative pl-8 before:content-[''] before:absolute before:left-0 before:top-2 before:w-1.5 before:h-1.5 before:bg-[#1A6FE8] before:rounded-full">
                    <p className="text-[9px] font-black uppercase tracking-widest text-[#1A6FE8]/40 mb-1">Bio</p>
                    <p className="text-sm font-medium text-gray-500 line-clamp-3 leading-relaxed">{profile.bio || 'Building a better future...'}</p>
                 </div>
                 <div className="relative pl-8 before:content-[''] before:absolute before:left-0 before:top-2 before:w-1.5 before:h-1.5 before:bg-[#1A6FE8] before:rounded-full">
                    <p className="text-[9px] font-black uppercase tracking-widest text-[#1A6FE8]/40 mb-1">Age</p>
                    <p className="text-sm font-bold text-[#0D1B3E]">{profile.birth_date ? `${calculateAge(profile.birth_date)} Years` : 'TBA'}</p>
                 </div>
              </div>
              <div className="mt-12 pt-10 border-t border-gray-50 flex gap-4">
                 <Link href="/profile" className="p-3 bg-[#F8FAFF] rounded-2xl hover:bg-[#1A6FE8] hover:text-white transition-all text-[#1A6FE8] border border-[#E2ECFB]"><Settings size={18} /></Link>
                 <button onClick={handleSignOut} className="p-3 bg-[#F8FAFF] rounded-2xl hover:bg-red-500 hover:text-white transition-all text-red-400 border border-red-50"><LogOut size={18} /></button>
              </div>
           </div>
           <div className="px-10 py-6 text-[10px] font-black text-gray-300 uppercase tracking-widest flex justify-between">
              <span>© 2026 Antigravity EU</span>
              <Link href="/organizations" className="hover:text-[#1A6FE8] transition-colors">Organizations</Link>
           </div>
        </div>
      </div>
    </div>
  )
}
