'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { 
  Calendar, 
  Users, 
  FileText, 
  TrendingUp, 
  Plus,
  Edit,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Building,
  Globe,
  Mail,
  MapPin,
  X,
  Flag,
  Briefcase,
  Languages,
  ArrowLeft,
  Download,
  Trash2,
  ChevronRight,
  User,
  LogOut
} from 'lucide-react'
import Link from 'next/link'
import Notification from '@/components/Notification'
import { downloadCsvFile, participantToCsvRow, PARTICIPANT_CSV_HEADERS, ParticipantProfileForCsv } from '@/lib/csv'
import { signOutEverywhere } from '@/lib/auth-client'

interface Event {
  id: string
  title: string
  description: string
  start_date: string
  end_date: string
  location: string
  max_participants: number
  category: string
  is_published: boolean
  created_at: string
  organization_id?: string | null
  organization_name?: string | null
}

interface Application {
  application_id: string
  event_id: string
  participant_id: string
  status: 'pending' | 'accepted' | 'rejected'
  motivation_letter: string
  created_at: string
  first_name: string | null
  last_name: string | null
  email: string | null
  event_title: string | null
  organization_name: string | null
}

interface Profile {
  id: string
  first_name: string
  last_name: string
  organization_name: string
  bio: string
  website: string
  location: string
  email: string
}

interface AuthUser {
  id: string
  email?: string
}

export default function OrganizationDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [notification, setNotification] = useState<{type: 'success' | 'error' | 'warning', message: string} | null>(null)
  const [activeTab, setActiveTab] = useState<'events' | 'applications'>('events')
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalApplications: 0,
    pendingApplications: 0,
    acceptedApplications: 0,
    upcomingEvents: 0
  })

  const [signingOut, setSigningOut] = useState(false)

  const getInitials = (name: string | null) => {
    if (!name) return 'EX'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const handleSignOut = async () => {
    if (signingOut) return
    setSigningOut(true)
    try {
      await signOutEverywhere()
      router.push('/')
      router.refresh()
    } catch (error) {
      console.error('Error during sign out:', error)
    } finally {
      setSigningOut(false)
    }
  }

  const fetchDashboardData = useCallback(async (userId: string, orgName: string) => {
    try {
      // Fetch organization events
      const { data: eventsById } = await supabase
        .from('events')
        .select('*')
        .eq('organization_id', userId)
        .order('created_at', { ascending: false })

      const uniqueEvents = new Map<string, Event>()
      if (eventsById) eventsById.forEach((e: Event) => uniqueEvents.set(e.id, e))

      if (orgName) {
        const { data: eventsByName } = await supabase
          .from('events')
          .select('*')
          .ilike('organization_name', orgName)

        if (eventsByName) {
          eventsByName.forEach((e: Event) => {
            if (e.organization_id === userId || e.organization_name?.toLowerCase() === orgName.toLowerCase()) {
              uniqueEvents.set(e.id, e)
            }
          })
        }
      }

      const mergedEvents = Array.from(uniqueEvents.values()).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      setEvents(mergedEvents)

      // Fetch applications
      let applicationsData = []
      if (mergedEvents.length > 0) {
        const { data: appData } = await supabase
          .from('applications_with_details')
          .select('*')
          .in('event_id', mergedEvents.map(e => e.id))
          .order('created_at', { ascending: false })
        applicationsData = appData || []
      }
      setApplications(applicationsData)

      // Stats
      const upcoming = mergedEvents.filter((e: Event) => new Date(e.start_date) > new Date()).length
      const pending = applicationsData.filter((a: Application) => a.status === 'pending').length
      const accepted = applicationsData.filter((a: Application) => a.status === 'accepted').length

      setStats({
        totalEvents: mergedEvents.length,
        totalApplications: applicationsData.length,
        pendingApplications: pending,
        acceptedApplications: accepted,
        upcomingEvents: upcoming
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }, [applications])

  const handleUpdateStatus = async (applicationId: string, newStatus: 'accepted' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('applications')
        .update({ status: newStatus })
        .eq('id', applicationId)

      if (error) throw error

      const updatedApps = applications.map(app => 
        app.application_id === applicationId ? { ...app, status: newStatus } : app
      )
      setApplications(updatedApps)
      
      // Recalculate stats for immediate UI feedback
      const pending = updatedApps.filter(a => a.status === 'pending').length
      const accepted = updatedApps.filter(a => a.status === 'accepted').length
      
      setStats(prev => ({
        ...prev,
        pendingApplications: pending,
        acceptedApplications: accepted
      }))
      
      setNotification({ type: 'success', message: `Application ${newStatus} successfully!` })
    } catch (err: any) {
      console.error('Error updating status:', err)
      setNotification({ type: 'error', message: err.message })
    }
  }

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        router.push('/auth')
        return
      }
      setUser(session.user)

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (profileData?.user_type !== 'organization') {
        router.push('/dashboard')
        return
      }
      setProfile(profileData)
      fetchDashboardData(session.user.id, profileData.organization_name)
    }
    getSession()
  }, [router, fetchDashboardData])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFF]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1A6FE8]"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFF] pt-32 pb-20 selection:bg-blue-100 selection:text-blue-900 font-dm-sans">
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}
      
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        
        {/* PAGE HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
          <div>
            <p className="text-[12px] font-bold text-gray-400 uppercase tracking-widest mb-1">Organization Dashboard</p>
            <h1 className="text-[28px] font-bold text-[#0D1B3E] tracking-tight">
              Welcome back, {profile?.organization_name || 'Example'}
            </h1>
          </div>
          <Link
            href="/events/create"
            className="inline-flex items-center gap-3 px-7 py-4 bg-[#1A6FE8] text-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-blue-700 transition-all shadow-[0_8px_24px_rgba(26,111,232,0.25)] hover:-translate-y-0.5"
          >
            <Plus size={18} /> Create Event
          </Link>
        </div>

        {/* STATS ROW */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-10">
          {[
            { label: 'Total Events', val: stats.totalEvents },
            { label: 'Total Applications', val: stats.totalApplications },
            { label: 'Pending Applications', val: stats.pendingApplications },
            { label: 'Accepted Applications', val: stats.acceptedApplications },
            { label: 'Upcoming Events', val: stats.upcomingEvents }
          ].map((stat, i) => (
            <div key={i} className="bg-[#F4F7FF] rounded-xl p-5 md:px-6 md:py-6 transition-all hover:bg-[#E8F1FD]">
              <p className="text-[28px] font-bold text-[#1A6FE8] mb-1">{stat.val}</p>
              <p className="text-[12px] font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* MAIN CONTENT AREA (65%) */}
          <div className="lg:w-[65%] order-2 lg:order-1">
            
            {/* FILTER TABS */}
            <div className="flex items-center gap-3 mb-6">
              <button 
                onClick={() => setActiveTab('events')}
                className={`px-6 py-2.5 rounded-full text-[13px] font-bold transition-all ${activeTab === 'events' ? 'bg-[#1A6FE8] text-white shadow-md' : 'bg-white text-gray-500 border border-[#E2ECFB] hover:bg-gray-50'}`}
              >
                My Events
              </button>
              <button 
                onClick={() => setActiveTab('applications')}
                className={`px-6 py-2.5 rounded-full text-[13px] font-bold transition-all ${activeTab === 'applications' ? 'bg-[#1A6FE8] text-white shadow-md' : 'bg-white text-gray-500 border border-[#E2ECFB] hover:bg-gray-50'}`}
              >
                All Applications
              </button>
            </div>
            <div className="h-px bg-[#E2ECFB] w-full mb-8" />

            {activeTab === 'events' ? (
              <div className="space-y-4">
                {events.length === 0 ? (
                  <div className="flex flex-col items-center justify-center bg-white rounded-[24px] border border-[#E2ECFB] p-16 text-center shadow-sm">
                    <div className="w-[64px] h-[64px] bg-[#E8F1FD] text-[#1A6FE8] rounded-full flex items-center justify-center mb-6 text-[20px] font-black">
                      {getInitials(profile?.organization_name || null)}
                    </div>
                    <h3 className="text-[18px] font-bold text-[#0D1B3E] mb-2 uppercase tracking-tight">No events created yet</h3>
                    <p className="text-[14px] text-gray-400 mb-8 max-w-[280px]">Start by creating your first event to find participants.</p>
                    <Link 
                      href="/events/create"
                      className="px-8 py-3 border-2 border-[#1A6FE8] text-[#1A6FE8] rounded-xl text-[13px] font-bold hover:bg-blue-50 transition-all uppercase tracking-widest"
                    >
                      Create Your First Event
                    </Link>
                  </div>
                ) : (
                  events.map((event) => (
                    <div key={event.id} className="bg-white rounded-[20px] border border-[#E2ECFB] p-5 md:px-7 md:py-6 flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-xl hover:border-[#1A6FE8]/20 transition-all group">
                      <div className="flex flex-col gap-1 w-full md:w-auto">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="bg-blue-50 text-[#1A6FE8] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-blue-100/50">
                            {event.category || 'Erasmus+ Event'}
                          </span>
                        </div>
                        <h3 className="text-[17px] font-bold text-[#0D1B3E] group-hover:text-[#1A6FE8] transition-colors truncate max-w-[280px]">
                          {event.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-4 mt-1">
                          <div className="flex items-center gap-2 text-gray-400 text-[13px] font-medium">
                            <Calendar size={14} className="text-[#1A6FE8]" /> {formatDate(event.start_date)}
                          </div>
                          <div className="flex items-center gap-2 text-gray-400 text-[13px] font-medium">
                            <MapPin size={14} className="text-[#1A6FE8]" /> {event.location || 'Romania'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-[#F8FAFF]">
                        <div className="flex flex-row md:flex-col items-center gap-4 md:gap-1">
                          <div className="bg-blue-50 text-[#1A6FE8] px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-2 border border-blue-100">
                             {applications.filter(a => a.event_id === event.id).length} Applicants
                          </div>
                          <span className={`text-[10px] uppercase font-black tracking-widest ${event.is_published ? 'text-emerald-500' : 'text-amber-500'}`}>
                            {event.is_published ? 'Active' : 'Draft'}
                          </span>
                        </div>
                        <Link 
                          href={`/events/${event.id}`}
                          className="w-full md:w-auto px-6 py-2.5 bg-white border border-[#1A6FE8] text-[#1A6FE8] rounded-xl text-[12px] font-bold hover:bg-blue-50 transition-all text-center flex items-center justify-center gap-2"
                        >
                          View <ChevronRight size={14} />
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
                /* APPLICATIONS TAB CONTENT */
                <div className="bg-white rounded-[24px] border border-[#E2ECFB] overflow-hidden shadow-sm">
                   {applications.length === 0 ? (
                      <div className="p-16 text-center">
                        <div className="w-16 h-16 bg-[#F8FAFF] rounded-full flex items-center justify-center mx-auto mb-6">
                            <FileText size={24} className="text-[#1A6FE8]/20" />
                        </div>
                        <h3 className="text-[17px] font-bold text-[#0D1B3E] mb-2">No applications yet</h3>
                        <p className="text-[14px] text-gray-400">Applications will appear here once participants start applying.</p>
                      </div>
                   ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead className="bg-[#F8FAFF] border-b border-[#E2ECFB]">
                            <tr>
                              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Participant</th>
                              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Event</th>
                              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#F8FAFF]">
                            {applications.map((app) => (
                              <tr key={app.application_id} className="hover:bg-[#F8FAFF]/50 transition-all group">
                                <td className="px-6 py-5">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-50 text-[#1A6FE8] flex items-center justify-center text-[11px] font-black border border-blue-100">
                                      {getInitials(`${app.first_name || ''} ${app.last_name || ''}`)}
                                    </div>
                                    <div>
                                      <p className="text-[14px] font-bold text-[#0D1B3E] group-hover:text-[#1A6FE8] transition-colors">
                                        {app.first_name} {app.last_name}
                                      </p>
                                      <p className="text-[12px] text-gray-400">{app.email}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-5">
                                  <p className="text-[14px] font-medium text-gray-600 truncate max-w-[200px]">{app.event_title}</p>
                                </td>
                                <td className="px-6 py-5">
                                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                    app.status === 'accepted' ? 'bg-emerald-50 text-emerald-600' :
                                    app.status === 'rejected' ? 'bg-rose-50 text-rose-600' :
                                    'bg-amber-50 text-amber-600'
                                  }`}>
                                    {app.status}
                                  </span>
                                </td>
                                <td className="px-6 py-5">
                                   <div className="flex items-center gap-2">
                                      <button 
                                        onClick={() => router.push(`/applications/${app.application_id}`)}
                                        className="h-8 w-8 rounded-lg border border-[#E2ECFB] hover:bg-white hover:text-[#1A6FE8] transition-all flex items-center justify-center text-gray-400 shadow-sm"
                                        title="View Detail"
                                      >
                                        <Eye size={14} />
                                      </button>
                                      {app.status === 'pending' && (
                                        <div className="flex items-center gap-1">
                                          <button 
                                            onClick={() => handleUpdateStatus(app.application_id, 'accepted')}
                                            className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-center shadow-sm"
                                            title="Accept"
                                          >
                                            <CheckCircle size={14} />
                                          </button>
                                          <button 
                                            onClick={() => handleUpdateStatus(app.application_id, 'rejected')}
                                            className="h-8 w-8 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center shadow-sm"
                                            title="Reject"
                                          >
                                            <XCircle size={14} />
                                          </button>
                                        </div>
                                      )}
                                   </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                   )}
                </div>
            )}
          </div>

          {/* SIDEBAR (35%) */}
          <div className="lg:w-[35%] order-1 lg:order-2">
             <div className="bg-white rounded-[24px] border border-[#E2ECFB] p-8 shadow-sm h-fit top-32 sticky">
                <div className="flex flex-col items-center text-center mb-8">
                  <div className="w-[56px] h-[56px] bg-[#1A6FE8] text-white rounded-full flex items-center justify-center mb-6 text-[18px] font-black shadow-[0_8px_24px_rgba(26,111,232,0.25)]">
                    {getInitials(profile?.organization_name || null)}
                  </div>
                  <h3 className="text-[20px] font-bold text-[#0D1B3E] mb-1">{profile?.organization_name}</h3>
                  <div className="flex items-center gap-2 text-gray-400 text-[13px] font-medium">
                    <MapPin size={14} className="text-[#1A6FE8]" /> {profile?.location || 'Bucuresti'}
                  </div>
                </div>

                <div className="h-px bg-[#F8FAFF] w-full mb-8" />

                <div className="space-y-6 mb-8">
                  <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Contact Information</p>
                  
                  <div className="flex items-center gap-4 bg-[#F8FAFF] p-3 rounded-xl border border-[#F0F5FF]">
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-[#1A6FE8] shadow-sm">
                      <Mail size={14} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email Address</p>
                      <p className="text-[13px] font-bold text-[#0D1B3E] truncate">{profile?.email || 'contact@org.com'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 bg-[#F8FAFF] p-3 rounded-xl border border-[#F0F5FF]">
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-[#1A6FE8] shadow-sm">
                      <User size={14} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Contact Person</p>
                      <p className="text-[13px] font-bold text-[#0D1B3E] truncate">
                        {profile?.first_name} {profile?.last_name}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <Link 
                    href="/profile"
                    className="block w-full text-center py-4 border-2 border-[#1A6FE8] text-[#1A6FE8] rounded-2xl text-[13px] font-bold hover:bg-blue-50 transition-all uppercase tracking-widest"
                  >
                    Edit Profile
                  </Link>

                  <button 
                    onClick={handleSignOut}
                    disabled={signingOut}
                    className="flex items-center justify-center gap-2 w-full text-center py-4 bg-red-50 text-red-600 rounded-2xl text-[13px] font-bold hover:bg-red-100 transition-all uppercase tracking-widest border border-red-100 disabled:opacity-50"
                  >
                    {signingOut ? 'Signing out...' : <><LogOut size={16} /> Sign Out</>}
                  </button>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}
