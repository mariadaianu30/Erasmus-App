'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Search, Calendar, MapPin, Users, Tag, Mail, Clock, X, SlidersHorizontal, Filter } from 'lucide-react'
import Link from 'next/link'

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
  created_at: string
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [countryFilter, setCountryFilter] = useState('')
  const [projectTypeFilter, setProjectTypeFilter] = useState('')
  const [deadlineFilter, setDeadlineFilter] = useState<'all' | 'active' | 'expired'>('all')

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
        .select('id, organization_id, project_title, organization_name, project_email, searching_partners_countries, begin_date, end_date, deadline_for_partner_request, number_of_partners_needed, short_description, full_description, project_type, tags, is_active, created_at')
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
    const matchesSearch = !query || (
      project.project_title.toLowerCase().includes(query) ||
      project.short_description?.toLowerCase().includes(query) ||
      project.full_description?.toLowerCase().includes(query) ||
      project.project_type?.toLowerCase().includes(query) ||
      project.tags.some(tag => tag.toLowerCase().includes(query)) ||
      project.searching_partners_countries.some(country => country.toLowerCase().includes(query)) ||
      project.organization_name?.toLowerCase().includes(query)
    )
    
    const matchesCountry = !countryFilter || 
      project.searching_partners_countries.some(country => 
        country.toLowerCase().includes(countryFilter.toLowerCase())
      )
    
    const matchesType = !projectTypeFilter || 
      project.project_type?.toLowerCase().includes(projectTypeFilter.toLowerCase())
    
    const matchesDeadline = deadlineFilter === 'all' ||
      (deadlineFilter === 'active' && !isDeadlinePassed(project.deadline_for_partner_request)) ||
      (deadlineFilter === 'expired' && isDeadlinePassed(project.deadline_for_partner_request))
    
    return matchesSearch && matchesCountry && matchesType && matchesDeadline
  })

  const clearFilters = () => {
    setSearchQuery('')
    setCountryFilter('')
    setProjectTypeFilter('')
    setDeadlineFilter('all')
    setShowFilters(false)
  }

  const hasActiveFilters = searchQuery || countryFilter || projectTypeFilter || deadlineFilter !== 'all'

  // Get unique project types and countries for filters
  const uniqueProjectTypes = [...new Set(projects.map(p => p.project_type).filter(Boolean))]
  const uniqueCountries = [...new Set(projects.flatMap(p => p.searching_partners_countries))]

  const handleContactPartner = async (project: Project) => {
    if (!user || !profile) {
      alert('Please log in to contact partners')
      return
    }

    // Use project_email if available, otherwise fallback to fetching from profile
    let contactEmail = project.project_email

    if (!contactEmail) {
      // Fallback: Get organization email from profile
      const { data: orgProfile } = await supabase
        .from('profiles')
        .select('email, organization_name')
        .eq('id', project.organization_id)
        .single()

      if (!orgProfile?.email) {
        alert('Organization email not found')
        return
      }
      contactEmail = orgProfile.email
    }

    // Create formal mailto link with professional draft email
    const subject = encodeURIComponent(`Partnership Collaboration Request: ${project.project_title}`)
    const body = encodeURIComponent(
      `Dear ${project.organization_name || 'Organization'} Team,\n\n` +
      `I hope this message finds you well. I am writing to express my organization's interest in collaborating on your project: "${project.project_title}".\n\n` +
      `My organization, ${profile.organization_name || 'N/A'}, is very interested in exploring partnership opportunities with you. We believe there is great potential for a mutually beneficial collaboration.\n\n` +
      `I would like to discuss how our organizations can work together on this initiative. Please let me know your availability for a conversation, and I would be happy to provide more information about our organization and how we might contribute to this project.\n\n` +
      `Thank you for your time and consideration. I look forward to hearing from you.\n\n` +
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

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 mb-6">
          <div className="space-y-4">
            {/* Main Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search projects by title, description, type, tags, countries, or organization..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="Clear search"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 px-4 py-3 border rounded-lg transition-colors ${
                    showFilters || hasActiveFilters
                      ? 'bg-blue-50 border-blue-300 text-blue-700'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                  aria-label="Toggle filters"
                >
                  <SlidersHorizontal className="h-5 w-5" />
                  <span className="hidden sm:inline">Filters</span>
                  {hasActiveFilters && (
                    <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-0.5">
                      {[searchQuery, countryFilter, projectTypeFilter, deadlineFilter !== 'all' ? deadlineFilter : null].filter(Boolean).length}
                    </span>
                  )}
                </button>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    aria-label="Clear all filters"
                  >
                    <X className="h-5 w-5" />
                    <span className="hidden sm:inline">Clear</span>
                  </button>
                )}
              </div>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="pt-4 border-t border-gray-200 animate-in slide-in-from-top-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="filter-country" className="block text-sm font-medium text-gray-700 mb-2">
                      Country
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                      <input
                        id="filter-country"
                        type="text"
                        placeholder="Filter by country..."
                        value={countryFilter}
                        onChange={(e) => setCountryFilter(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        list="countries-list"
                      />
                      <datalist id="countries-list">
                        {uniqueCountries.slice(0, 20).map(country => (
                          <option key={country} value={country} />
                        ))}
                      </datalist>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="filter-type" className="block text-sm font-medium text-gray-700 mb-2">
                      Project Type
                    </label>
                    <div className="relative">
                      <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                      <input
                        id="filter-type"
                        type="text"
                        placeholder="Filter by project type..."
                        value={projectTypeFilter}
                        onChange={(e) => setProjectTypeFilter(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        list="types-list"
                      />
                      <datalist id="types-list">
                        {uniqueProjectTypes.map(type => (
                          <option key={type} value={type || ''} />
                        ))}
                      </datalist>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="filter-deadline" className="block text-sm font-medium text-gray-700 mb-2">
                      Deadline Status
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                      <select
                        id="filter-deadline"
                        value={deadlineFilter}
                        onChange={(e) => setDeadlineFilter(e.target.value as 'all' | 'active' | 'expired')}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none bg-white"
                      >
                        <option value="all">All Deadlines</option>
                        <option value="active">Active Only</option>
                        <option value="expired">Expired Only</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Active Filters Display */}
            {hasActiveFilters && !showFilters && (
              <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
                {searchQuery && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    Search: {searchQuery}
                    <button onClick={() => setSearchQuery('')} className="hover:text-blue-900">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {countryFilter && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    Country: {countryFilter}
                    <button onClick={() => setCountryFilter('')} className="hover:text-blue-900">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {projectTypeFilter && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    Type: {projectTypeFilter}
                    <button onClick={() => setProjectTypeFilter('')} className="hover:text-blue-900">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {deadlineFilter !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    Deadline: {deadlineFilter}
                    <button onClick={() => setDeadlineFilter('all')} className="hover:text-blue-900">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Results Count */}
        {projects.length > 0 && (
          <div className="mb-4 text-sm text-gray-600">
            <span>
              Showing <span className="font-semibold text-blue-600">{filteredProjects.length}</span> of{' '}
              <span className="font-semibold text-gray-900">{projects.length}</span> projects
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="ml-2 text-blue-600 hover:text-blue-700 underline"
                >
                  Clear filters
                </button>
              )}
            </span>
          </div>
        )}

        {/* Projects List */}
        {filteredProjects.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            {hasActiveFilters ? (
              <>
                <p className="text-gray-500 text-lg mb-2">No projects match your filters</p>
                <button
                  onClick={clearFilters}
                  className="text-blue-600 hover:text-blue-700 underline"
                >
                  Clear all filters
                </button>
              </>
            ) : (
              <>
                <p className="text-gray-500 text-lg">No projects found</p>
                {profile?.user_type === 'organization' && (
                  <Link
                    href="/projects/create"
                    className="mt-4 inline-block text-blue-600 hover:text-blue-700"
                  >
                    Create the first project
                  </Link>
                )}
              </>
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

