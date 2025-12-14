'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Calendar, MapPin, Users, Clock, CheckCircle, XCircle, AlertCircle, Eye, FileText } from 'lucide-react'

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
      
      // Check if profile exists first
      const { error: profileError } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', session.user.id)
        .single()

      if (profileError && (profileError.code === 'PGRST116' || profileError.message?.includes('No rows found'))) {
        try {
          // Get user metadata to extract names - use getSession() to avoid AuthSessionMissingError
          const { data: { session } } = await supabase.auth.getSession()
          if (!session?.user) {
            return
          }
          const userMeta = session.user.user_metadata || {}
          
          const { error: insertError } = await supabase
            .from('profiles')
            .upsert({
              id: session.user.id,
              user_type: (userMeta.user_type || 'participant') as any,
              first_name: userMeta.first_name || '',
              last_name: userMeta.last_name || '',
              age: userMeta.age || 18,
              organization_name: userMeta.organization_name || null
            })
          
          if (insertError) {
            console.error('Failed to create profile:', insertError)
          }
        } catch (createError) {
          console.error('Exception creating profile:', createError)
        }
      }
      
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
            id,
            title,
            description,
            start_date,
            end_date,
            location,
            category,
            max_participants
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-600" />
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const filteredApplications = applications.filter(app => {
    if (filter === 'all') return true
    return app.status === filter
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-4">You need to be logged in to view your applications.</p>
          <button
            onClick={() => router.push('/auth')}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">My Applications</h1>
          <p className="text-gray-600">Track and manage your opportunity applications.</p>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex flex-wrap sm:flex-nowrap overflow-x-auto px-4 sm:px-6 scrollbar-hide">
              {[
                { key: 'all', label: 'All', count: applications.length },
                { key: 'pending', label: 'Pending', count: applications.filter(app => app.status === 'pending').length },
                { key: 'accepted', label: 'Accepted', count: applications.filter(app => app.status === 'accepted').length },
                { key: 'rejected', label: 'Rejected', count: applications.filter(app => app.status === 'rejected').length },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key as any)}
                  className={`py-4 px-3 sm:px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                    filter === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label}</span>
                  {tab.count > 0 && (
                    <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${ 
                      filter === tab.key ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Applications List */}
        <div className="space-y-6">
          {filteredApplications.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {filter === 'all' ? 'No applications yet' : `No ${filter} applications`}
              </h3>
              <p className="text-gray-500 mb-6">
                {filter === 'all' 
                  ? "You haven&apos;t applied to any events yet. Start exploring!"
                  : `You don&apos;t have any ${filter} applications at the moment.`
                }
              </p>
              {filter === 'all' && (
                <Link
                  href="/events"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Browse Events
                </Link>
              )}
            </div>
          ) : (
            filteredApplications.map((application) => (
              <div key={application.id} className="bg-white rounded-lg shadow-sm border">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        {getStatusIcon(application.status)}
                        <span className={`ml-2 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(application.status)}`}>
                          {application.status === 'pending' ? 'Under Review' : 
                           application.status === 'accepted' ? 'Accepted!' : 
                           'Not Selected'}
                        </span>
                      </div>
                      
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {application.events.title}
                      </h3>
                      
                      <p className="text-gray-600 mb-4 line-clamp-2">
                        {application.events.description}
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                          <span>
                            {new Date(application.events.start_date).toLocaleDateString()} - {new Date(application.events.end_date).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                          <span>{application.events.location}</span>
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-600">
                          <Users className="h-4 w-4 mr-2 text-gray-400" />
                          <span>Max {application.events.max_participants} participants</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-500 mb-4">
                        <Clock className="h-4 w-4 mr-2" />
                        <span>Applied on {new Date(application.created_at).toLocaleDateString()}</span>
                      </div>

                      {/* Status-specific messages */}
                      {application.status === 'accepted' && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                          <div className="flex items-center">
                            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                            <div>
                              <p className="text-sm font-medium text-green-800">
                                🎉 Congratulations! You&apos;ve been accepted to this event.
                              </p>
                              <p className="text-xs text-green-700 mt-1">
                                The organization will contact you with further details.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {application.status === 'rejected' && (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
                          <div className="flex items-center">
                            <XCircle className="h-5 w-5 text-gray-600 mr-2" />
                            <div>
                              <p className="text-sm font-medium text-gray-800">
                                Thank you for your interest in this opportunity.
                              </p>
                              <p className="text-xs text-gray-700 mt-1">
                                Keep applying to other events that match your interests!
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {application.status === 'pending' && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                          <div className="flex items-center">
                            <Clock className="h-5 w-5 text-blue-600 mr-2" />
                            <div>
                              <p className="text-sm font-medium text-blue-800">
                                Your application is being reviewed by the organization.
                              </p>
                              <p className="text-xs text-blue-700 mt-1">
                                You&apos;ll be notified once a decision is made.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {application.motivation_letter && (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center mb-2">
                            <FileText className="h-4 w-4 mr-2 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">Motivation Letter</span>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-3">
                            {application.motivation_letter}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="ml-6 flex flex-col space-y-2">
                      <Link
                        href={`/events/${application.events.id}`}
                        className="flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Event
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Stats Summary */}
        {applications.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{applications.length}</div>
                <div className="text-sm text-gray-600">Total Applications</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {applications.filter(app => app.status === 'pending').length}
                </div>
                <div className="text-sm text-gray-600">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {applications.filter(app => app.status === 'accepted').length}
                </div>
                <div className="text-sm text-gray-600">Accepted</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {applications.filter(app => app.status === 'rejected').length}
                </div>
                <div className="text-sm text-gray-600">Rejected</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}