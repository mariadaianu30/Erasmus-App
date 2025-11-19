'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Plus, Search, Calendar, MapPin, Users, Tag, Mail, Clock } from 'lucide-react'
import Link from 'next/link'

interface Project {
  id: string
  organization_id: string
  project_title: string
  organization_name: string | null
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

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    checkUser()
    fetchProjects()
  }, [])

  const checkUser = async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (currentUser) {
      setUser(currentUser)
      const { data: profileData } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', currentUser.id)
        .single()
      setProfile(profileData)
    }
  }

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, organization_id, project_title, organization_name, searching_partners_countries, begin_date, end_date, deadline_for_partner_request, number_of_partners_needed, short_description, full_description, project_type, tags, is_active, created_at')
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

  const filteredProjects = projects.filter((project) => {
    const query = searchQuery.toLowerCase()
    return (
      project.project_title.toLowerCase().includes(query) ||
      project.short_description?.toLowerCase().includes(query) ||
      project.full_description?.toLowerCase().includes(query) ||
      project.project_type?.toLowerCase().includes(query) ||
      project.tags.some(tag => tag.toLowerCase().includes(query)) ||
      project.searching_partners_countries.some(country => country.toLowerCase().includes(query))
    )
  })

  const handleContactPartner = async (project: Project) => {
    if (!user || !profile) {
      alert('Please log in to contact partners')
      return
    }

    // Get organization email from profile
    const { data: orgProfile } = await supabase
      .from('profiles')
      .select('email, organization_name')
      .eq('id', project.organization_id)
      .single()

    if (!orgProfile?.email) {
      alert('Organization email not found')
      return
    }

    // Create mailto link (for now - can be replaced with actual email service)
    const subject = encodeURIComponent(`Partnership Request: ${project.project_title}`)
    const body = encodeURIComponent(
      `Hello,\n\n` +
      `I am interested in partnering with you on your project: "${project.project_title}"\n\n` +
      `My organization: ${profile.organization_name || 'N/A'}\n` +
      `Please contact me to discuss partnership opportunities.\n\n` +
      `Best regards`
    )
    
    window.location.href = `mailto:${orgProfile.email}?subject=${subject}&body=${body}`
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-10 bg-gray-200 rounded w-full mb-6"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Partnership Projects</h1>
            <p className="text-gray-600">Find and connect with organizations looking for partners</p>
          </div>
          {profile?.user_type === 'organization' && (
            <Link
              href="/projects/create"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create Project
            </Link>
          )}
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search projects by title, description, type, tags, or countries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Projects List */}
        {filteredProjects.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <p className="text-gray-500 text-lg">No projects found</p>
            {profile?.user_type === 'organization' && (
              <Link
                href="/projects/create"
                className="mt-4 inline-block text-blue-600 hover:text-blue-700"
              >
                Create the first project
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow p-6"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {project.project_title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-2">
                      by <span className="font-medium">{project.organization_name || 'Unknown Organization'}</span>
                    </p>
                  </div>
                  {project.project_type && (
                    <span className="bg-purple-100 text-purple-800 text-xs font-medium px-3 py-1 rounded-full">
                      {project.project_type}
                    </span>
                  )}
                </div>

                {project.short_description && (
                  <p className="text-gray-700 mb-4 line-clamp-2">
                    {project.short_description}
                  </p>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {project.searching_partners_countries.length > 0 && (
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2 text-blue-600" />
                      <span className="font-medium mr-1">Searching partners in:</span>
                      <span>{project.searching_partners_countries.join(', ')}</span>
                    </div>
                  )}

                  {project.begin_date && project.end_date && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2 text-blue-600" />
                      <span>{formatDate(project.begin_date)} - {formatDate(project.end_date)}</span>
                    </div>
                  )}

                  {project.deadline_for_partner_request && (
                    <div className={`flex items-center text-sm ${isDeadlinePassed(project.deadline_for_partner_request) ? 'text-red-600' : 'text-gray-600'}`}>
                      <Clock className="h-4 w-4 mr-2" />
                      <span className="font-medium mr-1">Deadline:</span>
                      <span>{formatDate(project.deadline_for_partner_request)}</span>
                      {isDeadlinePassed(project.deadline_for_partner_request) && (
                        <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded">Expired</span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="h-4 w-4 mr-2 text-blue-600" />
                    <span className="font-medium mr-1">Partners needed:</span>
                    <span>{project.number_of_partners_needed}</span>
                  </div>
                </div>

                {project.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {project.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                      >
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                  <Link
                    href={`/projects/${project.id}`}
                    className="flex-1 text-center px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    View Details
                  </Link>
                  {user && profile?.user_type === 'organization' && (
                    <button
                      onClick={() => handleContactPartner(project)}
                      className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Contact Partner
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

