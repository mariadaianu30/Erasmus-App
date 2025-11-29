'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import { countries } from '@/lib/countries'

export default function CreateProjectPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()

  const [formData, setFormData] = useState({
    project_title: '',
    project_email: '',
    searching_partners_countries: [] as string[],
    begin_date: '',
    end_date: '',
    deadline_for_partner_request: '',
    number_of_partners_needed: 1 as number | string,
    short_description: '',
    full_description: '',
    project_type: '',
    tags: [] as string[],
  })

  const [newTag, setNewTag] = useState('')

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) {
      router.push('/auth')
      return
    }

    setUser(currentUser)
    const { data: profileData } = await supabase
      .from('profiles')
      .select('user_type, organization_name, email')
      .eq('id', currentUser.id)
      .single()

    if (!profileData || profileData.user_type !== 'organization') {
      router.push('/projects')
      return
    }

    setProfile(profileData)
    // Set default project_email to organization's email
    if (profileData.email) {
      setFormData(prev => ({ ...prev, project_email: profileData.email }))
    }
    setLoading(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    if (name === 'number_of_partners_needed') {
      // Allow empty string for proper typing, only parse when there's a value
      if (value === '') {
        setFormData(prev => ({ ...prev, [name]: '' }))
      } else {
        const parsed = parseInt(value)
        setFormData(prev => ({ ...prev, [name]: isNaN(parsed) ? '' : parsed }))
      }
    } else if (name === 'begin_date') {
      // Auto-set end_date to be 1 day after begin_date if end_date is empty or before begin_date
      if (value) {
        setFormData(prev => {
          const beginDate = new Date(value)
          const currentEndDate = prev.end_date ? new Date(prev.end_date) : null
          if (!currentEndDate || currentEndDate <= beginDate) {
            const suggestedEndDate = new Date(beginDate)
            suggestedEndDate.setDate(suggestedEndDate.getDate() + 1)
            // Format as date (YYYY-MM-DD)
            const formattedEndDate = suggestedEndDate.toISOString().split('T')[0]
            return { ...prev, [name]: value, end_date: formattedEndDate }
          }
          return { ...prev, [name]: value }
        })
      } else {
        setFormData(prev => ({ ...prev, [name]: value }))
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleCountryToggle = (country: string) => {
    setFormData(prev => {
      const countries = prev.searching_partners_countries
      if (countries.includes(country)) {
        return { ...prev, searching_partners_countries: countries.filter(c => c !== country) }
      } else {
        return { ...prev, searching_partners_countries: [...countries, country] }
      }
    })
  }

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }))
      setNewTag('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const validateForm = () => {
    const errors: string[] = []
    if (!formData.project_title.trim()) errors.push('Project title is required')
    if (formData.searching_partners_countries.length === 0) errors.push('At least one country is required')
    if (!formData.begin_date) errors.push('Begin date is required')
    if (!formData.end_date) errors.push('End date is required')
    if (formData.begin_date && formData.end_date && formData.begin_date > formData.end_date) {
      errors.push('End date must be after begin date')
    }
    if (!formData.deadline_for_partner_request) errors.push('Deadline for partner request is required')
    const partnersNeeded = typeof formData.number_of_partners_needed === 'string' ? parseInt(formData.number_of_partners_needed) : formData.number_of_partners_needed
    if (!partnersNeeded || partnersNeeded < 1) errors.push('Number of partners must be at least 1')
    return errors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !profile) return

    const validationErrors = validateForm()
    if (validationErrors.length > 0) {
      setError(validationErrors.join('. ') + '.')
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      // Verify user is authenticated and refresh session
      const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser()
      if (authError || !currentUser) {
        setError('You are not logged in. Please log in and try again.')
        setSaving(false)
        return
      }

      // Refresh session to ensure auth token is valid
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !session) {
        setError('Session expired. Please log in again.')
        setSaving(false)
        return
      }

      // Verify user profile exists and is an organization (helps with RLS)
      const { data: userProfile, error: profileCheckError } = await supabase
        .from('profiles')
        .select('user_type, organization_name, email')
        .eq('id', currentUser.id)
        .single()

      if (profileCheckError || !userProfile) {
        setError('Profile not found. Please complete your profile setup first.')
        setSaving(false)
        return
      }

      if (userProfile.user_type !== 'organization') {
        setError('Only organizations can create projects. Please log in with an organization account.')
        setSaving(false)
        return
      }

      const projectData = {
        project_title: formData.project_title.trim(),
        organization_id: currentUser.id,
        organization_name: userProfile.organization_name || 'Unknown Organization',
        project_email: formData.project_email.trim() || userProfile.email || null,
        searching_partners_countries: formData.searching_partners_countries,
        begin_date: formData.begin_date || null,
        end_date: formData.end_date || null,
        deadline_for_partner_request: formData.deadline_for_partner_request || null,
        number_of_partners_needed: typeof formData.number_of_partners_needed === 'string' ? parseInt(formData.number_of_partners_needed) || 1 : formData.number_of_partners_needed,
        short_description: formData.short_description.trim() || null,
        full_description: formData.full_description.trim() || null,
        project_type: formData.project_type.trim() || null,
        tags: formData.tags,
        is_active: true,
        is_published: true,
      }

      console.log('=== PROJECT CREATION DEBUG ===')
      console.log('User ID:', currentUser.id)
      console.log('User email:', currentUser.email)
      console.log('Session valid:', !!session)
      console.log('Project data:', JSON.stringify(projectData, null, 2))
      console.log('=============================')

      // Insert with improved error handling
      console.log('Starting database insert...')
      const startTime = Date.now()

      const { data, error: insertError } = await supabase
        .from('projects')
        .insert(projectData)
        .select()

      const endTime = Date.now()
      console.log(`Insert completed in ${endTime - startTime}ms`)

      if (insertError) {
        console.error('Insert error:', insertError)
        console.error('Error code:', insertError.code)
        console.error('Error message:', insertError.message)
        console.error('Error details:', insertError.details)
        console.error('Error hint:', insertError.hint)

        // Provide user-friendly error messages
        if (insertError.code === '23514') {
          setError(`Data validation error: ${insertError.message || 'Please check all required fields are filled correctly.'}`)
        } else if (insertError.code === '42501' || insertError.message?.includes('permission') || insertError.message?.includes('policy')) {
          setError('Permission denied. Please ensure you are logged in as an organization account and your profile is set up correctly.')
        } else if (insertError.code === '23503') {
          setError('Invalid organization ID. Please log out and log back in, then try again.')
        } else if (insertError.message?.includes('timeout') || insertError.message?.includes('TIMEOUT')) {
          setError('Request timed out. Please check your internet connection and try again.')
        } else {
          setError(`Failed to create project: ${insertError.message || 'Unknown error'}. Please check the browser console for details.`)
        }
        setSaving(false)
        return
      }

      if (!data || data.length === 0) {
        console.error('No data returned from insert')
        setError('Project creation failed. No data returned from database.')
        setSaving(false)
        return
      }

      // Get the first (and should be only) item
      const createdProject = data[0]
      console.log('Project created successfully:', createdProject)

      setSuccess('Project created successfully!')
      setTimeout(() => {
        router.push(`/projects/${createdProject.id}`)
      }, 1500)
    } catch (error: any) {
      console.error('Project creation error:', error)
      setError(error.message || 'Failed to create project. Please try again.')
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Create Partnership Project</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Project Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Title *
              </label>
              <input
                type="text"
                name="project_title"
                value={formData.project_title}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter project title"
              />
            </div>

            {/* Project Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Contact Email
              </label>
              <input
                type="email"
                name="project_email"
                value={formData.project_email}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Email for project inquiries (defaults to your organization email)"
              />
              <p className="mt-1 text-sm text-gray-500">
                This email will be used by other organizations to contact you about this project. Defaults to your organization email.
              </p>
            </div>

            {/* Searching Partners in Countries */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Searching Partners in Countries * (Select at least one)
              </label>
              <div className="border border-gray-300 rounded-lg p-4 max-h-60 overflow-y-auto">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {countries.map((country) => (
                    <label
                      key={country}
                      className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={formData.searching_partners_countries.includes(country)}
                        onChange={() => handleCountryToggle(country)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{country}</span>
                    </label>
                  ))}
                </div>
              </div>
              {formData.searching_partners_countries.length > 0 && (
                <p className="mt-2 text-sm text-gray-600">
                  Selected: {formData.searching_partners_countries.join(', ')}
                </p>
              )}
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Begin Date *
                </label>
                <input
                  type="date"
                  name="begin_date"
                  value={formData.begin_date}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date *
                </label>
                <input
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleInputChange}
                  required
                  min={formData.begin_date || undefined}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {formData.begin_date && formData.end_date && (
                  <p className="mt-1 text-xs text-gray-500">
                    End date automatically set to 1 day after begin date. You can adjust it if needed.
                  </p>
                )}
              </div>
            </div>

            {/* Deadline */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deadline for Partner Request *
              </label>
              <input
                type="date"
                name="deadline_for_partner_request"
                value={formData.deadline_for_partner_request}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Number of Partners */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                How Many Partners? *
              </label>
              <input
                type="number"
                name="number_of_partners_needed"
                value={formData.number_of_partners_needed === '' ? '' : formData.number_of_partners_needed}
                onChange={handleInputChange}
                onBlur={(e) => {
                  // On blur, if empty, set to default value of 1
                  if (e.target.value === '' || parseInt(e.target.value) < 1) {
                    setFormData(prev => ({ ...prev, number_of_partners_needed: 1 }))
                  } else {
                    const val = parseInt(e.target.value)
                    if (!isNaN(val) && val >= 1) {
                      setFormData(prev => ({ ...prev, number_of_partners_needed: val }))
                    }
                  }
                }}
                min="1"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Short Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Short Description
              </label>
              <textarea
                name="short_description"
                value={formData.short_description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Brief overview of the project"
              />
            </div>

            {/* Full Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Description
              </label>
              <textarea
                name="full_description"
                value={formData.full_description}
                onChange={handleInputChange}
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Detailed description of the project, objectives, and partnership requirements"
              />
            </div>

            {/* Project Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What Type of Projects Do You Want to Do?
              </label>
              <input
                type="text"
                name="project_type"
                value={formData.project_type}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Youth Exchange, Training Course, Research Project"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddTag()
                    }
                  }}
                  placeholder="Add a tag and press Enter"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Add
                </button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Error/Success Messages */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                {success}
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end gap-4 pt-4">
              <Link
                href="/projects"
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="h-5 w-5 mr-2" />
                {saving ? 'Creating...' : 'Create Project'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

