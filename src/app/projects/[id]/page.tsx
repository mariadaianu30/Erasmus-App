'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Calendar, MapPin, Users, Tag, Mail, Clock, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface Project {
  id: string
  project_title: string
  organization_id: string
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

export default function ProjectDetailPage() {
  const params = useParams()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    checkUser()
    fetchProject()
  }, [params.id])

  const checkUser = async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (currentUser) {
      setUser(currentUser)
      const { data: profileData } = await supabase
        .from('profiles')
        .select('user_type, organization_name')
        .eq('id', currentUser.id)
        .single()
      setProfile(profileData)
    }
  }

  const fetchProject = async () => {
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
  }

  const handleContactPartner = async () => {
    if (!user || !profile || !project) {
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

    // Create mailto link
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <p className="text-gray-500 text-lg mb-4">Project not found</p>
            <Link
              href="/projects"
              className="text-blue-600 hover:text-blue-700"
            >
              Back to Projects
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/projects"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Projects
        </Link>

        <div className="bg-white rounded-lg shadow-sm border p-6 md:p-8">
          {/* Header */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <h1 className="text-3xl font-bold text-gray-900">{project.project_title}</h1>
              {project.project_type && (
                <span className="bg-purple-100 text-purple-800 text-sm font-medium px-4 py-2 rounded-full">
                  {project.project_type}
                </span>
              )}
            </div>
            <p className="text-gray-600">
              by <span className="font-medium">{project.organization_name || 'Unknown Organization'}</span>
            </p>
          </div>

          {/* Key Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            {project.searching_partners_countries.length > 0 && (
              <div className="flex items-start">
                <MapPin className="h-5 w-5 mr-3 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900 mb-1">Searching Partners In</p>
                  <p className="text-gray-700">{project.searching_partners_countries.join(', ')}</p>
                </div>
              </div>
            )}

            {project.begin_date && project.end_date && (
              <div className="flex items-start">
                <Calendar className="h-5 w-5 mr-3 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900 mb-1">Project Dates</p>
                  <p className="text-gray-700">
                    {formatDate(project.begin_date)} - {formatDate(project.end_date)}
                  </p>
                </div>
              </div>
            )}

            {project.deadline_for_partner_request && (
              <div className="flex items-start">
                <Clock className={`h-5 w-5 mr-3 mt-0.5 ${isDeadlinePassed(project.deadline_for_partner_request) ? 'text-red-600' : 'text-blue-600'}`} />
                <div>
                  <p className="font-medium text-gray-900 mb-1">Deadline for Partner Request</p>
                  <p className={`${isDeadlinePassed(project.deadline_for_partner_request) ? 'text-red-600' : 'text-gray-700'}`}>
                    {formatDate(project.deadline_for_partner_request)}
                    {isDeadlinePassed(project.deadline_for_partner_request) && (
                      <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded">Expired</span>
                    )}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-start">
              <Users className="h-5 w-5 mr-3 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900 mb-1">Partners Needed</p>
                <p className="text-gray-700">{project.number_of_partners_needed}</p>
              </div>
            </div>
          </div>

          {/* Tags */}
          {project.tags.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {project.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800"
                  >
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Short Description */}
          {project.short_description && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Overview</h3>
              <p className="text-gray-700 leading-relaxed">{project.short_description}</p>
            </div>
          )}

          {/* Full Description */}
          {project.full_description && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Full Description</h3>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {project.full_description}
              </p>
            </div>
          )}

          {/* Contact Button */}
          {user && profile?.user_type === 'organization' && (
            <div className="pt-6 border-t">
              <button
                onClick={handleContactPartner}
                className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Mail className="h-5 w-5 mr-2" />
                Contact Partner Organization
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

