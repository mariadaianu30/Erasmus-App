'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import {
  ArrowLeft,
  Calendar,
  CalendarCheck,
  CheckCircle,
  Loader2,
  Save,
  Trash2,
} from 'lucide-react'
import { countries } from '@/lib/countries'

const eventTypes = [
  'Youth exchange',
  'Training Course',
  'Seminar',
  'Study visit',
  'Partnership - Building Activity',
  'Conference simpozion forum',
  'E-learning',
  'Other',
]

const targetGroupOptions = [
  'Youth',
  'Youth workers',
  'Trainers',
  'Youth leaders',
  'Project managers',
  'Policy makers',
  'Volunteering',
  'Mentors',
  'Coaches',
  'Researchers',
  'Authorities',
  'Others',
]

interface User {
  id: string
  email?: string
}

interface EventFormState {
  title: string
  event_type: string
  start_date: string
  end_date: string
  venue_place: string
  city: string
  country: string
  short_description: string
  full_description: string
  photo_url: string
  is_funded: boolean
  is_published: boolean
  target_groups: string[]
  group_size: number
  working_language: string
  participation_fee: string
  participation_fee_reason: string
  accommodation_food_details: string
  transport_details: string
}

export default function EditEventPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const eventId = params?.id

  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null) // Initial load errors (full-page)
  const [formError, setFormError] = useState<string | null>(null) // Form validation/save errors (inline)
  const [success, setSuccess] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(null)
  const [formData, setFormData] = useState<EventFormState>({
    title: '',
    event_type: '',
    start_date: '',
    end_date: '',
    venue_place: '',
    city: '',
    country: '',
    short_description: '',
    full_description: '',
    photo_url: '',
    is_funded: false,
    is_published: true,
    target_groups: [],
    group_size: 50,
    working_language: '',
    participation_fee: '',
    participation_fee_reason: '',
    accommodation_food_details: '',
    transport_details: '',
  })

  useEffect(() => {
    const fetchEvent = async () => {
      console.log('Edit page - useEffect triggered, eventId:', eventId)
      if (!eventId) {
        console.error('Edit page - No eventId provided')
        setError('Event ID is missing.')
        setLoading(false)
        return
      }

      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) {
          console.log('Edit page - No session, redirecting to auth')
          router.push('/auth')
          return
        }
        console.log('Edit page - User authenticated:', session.user.id)
        setUser(session.user)

        const { data: profileRow } = await supabase
          .from('profiles')
          .select('user_type, organization_name')
          .eq('id', session.user.id)
          .single()

        if (profileRow?.user_type !== 'organization') {
          setError('Only organization accounts can edit events.')
          setLoading(false)
          return
        }

        const { data: event, error: eventError } = await supabase
          .from('events')
          .select('*')
          .eq('id', eventId)
          .single()

        if (eventError || !event) {
          setError('Event not found.')
          setLoading(false)
          return
        }

        const normalizeName = (value?: string | null) =>
          value?.trim().toLowerCase().replace(/\s+/g, ' ') || null

        const eventOrgName = normalizeName(event.organization_name)
        const userOrgName = normalizeName(profileRow?.organization_name)

        console.log('Edit page - Ownership check:', {
          eventId: eventId,
          eventOrgId: event.organization_id,
          userId: session.user.id,
          eventOrgName: event.organization_name,
          userOrgName: profileRow?.organization_name,
          normalizedEventName: eventOrgName,
          normalizedUserName: userOrgName
        })

        const ownsEvent = event.organization_id
          ? event.organization_id === session.user.id
          : Boolean(eventOrgName && userOrgName && eventOrgName === userOrgName)

        console.log('Edit page - Owns event?', ownsEvent)

        if (!ownsEvent) {
          console.error('Edit page - Ownership check failed, redirecting')
          setError(`You can only edit events created by your organization. Event org: ${event.organization_name || 'none'}, Your org: ${profileRow?.organization_name || 'none'}`)
          setLoading(false)
          return
        }

        if (!event.organization_id) {
          await supabase
            .from('events')
            .update({
              organization_id: session.user.id,
              organization_name: profileRow?.organization_name || event.organization_name
            })
            .eq('id', eventId)
          event.organization_id = session.user.id
        }

        console.log('Edit page - Event loaded successfully, populating form')
        setFormData({
          title: event.title || '',
          event_type: event.event_type || '',
          start_date: event.start_date ? event.start_date.slice(0, 16) : '',
          end_date: event.end_date ? event.end_date.slice(0, 16) : '',
          venue_place: event.venue_place || '',
          city: event.city || '',
          country: event.country || '',
          short_description: event.short_description || '',
          full_description: event.full_description || '',
          photo_url: event.photo_url || '',
          is_funded: Boolean(event.is_funded),
          is_published: event.is_published !== false,
          target_groups: event.target_groups || [],
          group_size: event.group_size || 50,
          working_language: event.working_language || '',
          participation_fee: event.participation_fee ? String(event.participation_fee) : '',
          participation_fee_reason: event.participation_fee_reason || '',
          accommodation_food_details: event.accommodation_food_details || '',
          transport_details: event.transport_details || '',
        })
        setExistingPhotoUrl(event.photo_url || null)
        console.log('Edit page - Form populated, setting loading to false')
      } catch (err) {
        console.error(err)
        setError('Failed to load event. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    if (eventId) {
      fetchEvent()
    }
  }, [eventId, router])

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview)
      }
    }
  }, [imagePreview])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    setFormData((prev) => {
      if (type === 'checkbox') {
        if (name === 'is_funded' || name === 'is_published') {
          return { ...prev, [name]: checked }
        }
        return prev
      }
      if (name === 'group_size') {
        return { ...prev, [name]: parseInt(value) || 1 }
      }
      if (name === 'participation_fee') {
        return { ...prev, [name]: value }
      }
      return { ...prev, [name]: value }
    })
  }

  const handleTargetGroupChange = (group: string) => {
    setFormData((prev) => {
      const exists = prev.target_groups.includes(group)
      return {
        ...prev,
        target_groups: exists
          ? prev.target_groups.filter((g) => g !== group)
          : [...prev.target_groups, group],
      }
    })
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) {
      setImageFile(null)
      setImagePreview(null)
      return
    }

    if (file.type !== 'image/png') {
      setFormError('Please upload a PNG image.')
      setImageFile(null)
      setImagePreview(null)
      return
    }

    setFormError(null)
    setImageFile(file)
    const previewUrl = URL.createObjectURL(file)
    setImagePreview(previewUrl)
  }

  const validateForm = () => {
    if (!formData.title.trim()) return 'Event title is required.'
    if (!formData.event_type) return 'Event type is required.'
    if (!formData.start_date) return 'Start date is required.'
    if (!formData.end_date) return 'End date is required.'
    if (formData.start_date && formData.end_date) {
      if (new Date(formData.start_date) >= new Date(formData.end_date)) {
        return 'End date must be after the start date.'
      }
    }
    if (formData.participation_fee && parseFloat(formData.participation_fee) > 0 && !formData.participation_fee_reason.trim()) {
      return 'Please provide a reason for the participation fee.'
    }
    if (formData.group_size < 1) return 'Group size must be at least 1.'
    if (formData.group_size > 1000) return 'Group size cannot exceed 1000.'
    return null
  }

  const uploadImageIfNeeded = async (): Promise<string | null> => {
    if (!imageFile || !user) return existingPhotoUrl
    const fileExtension = imageFile.name.split('.').pop() || 'png'
    const filePath = `organizations/${user.id}/events/${eventId}-${Date.now()}.${fileExtension}`
    const { error: uploadError } = await supabase.storage
      .from('event-images')
      .upload(filePath, imageFile, {
        cacheControl: '3600',
        upsert: true,
      })

    if (uploadError) {
      console.error('Image upload error:', uploadError)
      throw new Error(uploadError.message || 'Failed to upload image. Please try again.')
    }

    const { data } = supabase.storage.from('event-images').getPublicUrl(filePath)
    return data.publicUrl
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setSuccess(null)

    const validationError = validateForm()
    if (validationError) {
      setFormError(validationError)
      return
    }

    setSaving(true)
    try {
      const photoUrl = await uploadImageIfNeeded()

      const eventPayload: any = {
        title: formData.title.trim(),
        event_type: formData.event_type || null,
        start_date: formData.start_date,
        end_date: formData.end_date,
        venue_place: formData.venue_place.trim() || null,
        city: formData.city.trim() || null,
        country: formData.country.trim() || null,
        short_description: formData.short_description.trim() || null,
        full_description: formData.full_description.trim() || null,
        photo_url: photoUrl,
        is_funded: formData.is_funded,
        is_published: formData.is_published,
        target_groups: formData.target_groups.length ? formData.target_groups : null,
        group_size: formData.group_size,
        working_language: formData.working_language.trim() || null,
        participation_fee: formData.participation_fee ? parseFloat(formData.participation_fee) : null,
        participation_fee_reason: formData.participation_fee_reason.trim() || null,
        accommodation_food_details: formData.accommodation_food_details.trim() || null,
        transport_details: formData.transport_details.trim() || null,
        // Skip updating description field - it's a legacy/computed field that may have constraints
        // The description is computed from full_description, short_description, or title
        // Updating it directly may violate database constraints, so we leave it as-is
        location: [formData.venue_place, formData.city, formData.country].filter(Boolean).join(', ') || 'Location TBD',
        updated_at: new Date().toISOString(),
      }

      console.log('Event payload being sent (without description field):', eventPayload)

      const { error: updateError } = await supabase
        .from('events')
        .update(eventPayload)
        .eq('id', eventId)

      if (updateError) {
        console.error('Update error object:', JSON.stringify(updateError, null, 2))
        console.error('Update error keys:', Object.keys(updateError))
        console.error('Update error message:', updateError.message)
        console.error('Update error details:', updateError.details)
        console.error('Update error hint:', updateError.hint)
        console.error('Update error code:', updateError.code)
        // Extract detailed error message from Supabase error
        let errorMsg = updateError.message || 'Failed to update event in database.'
        if (updateError.details) {
          errorMsg += ` Details: ${updateError.details}`
        }
        if (updateError.hint) {
          errorMsg += ` Hint: ${updateError.hint}`
        }
        if (updateError.code) {
          errorMsg += ` Code: ${updateError.code}`
        }
        throw new Error(errorMsg)
      }

      setSuccess('Event updated successfully. Redirecting you to your dashboard...')
      setExistingPhotoUrl(photoUrl)
      setImageFile(null)
      setImagePreview(null)

      setTimeout(() => {
        router.push('/dashboard/organization')
      }, 1800)
    } catch (err: any) {
      console.error('Error updating event:', err)
      // Extract meaningful error message
      let errorMessage = 'Failed to update event.'
      if (err?.message) {
        errorMessage = err.message
      } else if (typeof err === 'string') {
        errorMessage = err
      } else if (err?.error?.message) {
        errorMessage = err.error.message
      } else if (err?.details) {
        errorMessage = err.details
      } else if (err?.hint) {
        errorMessage = `${err.message || 'Error'}: ${err.hint}`
      }
      setFormError(errorMessage)
      // Don't redirect on error - stay on page so user can fix issues
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white border border-red-200 rounded-lg p-6 max-w-md text-center">
          <p className="text-gray-700 mb-4">{error}</p>
          <Link href="/dashboard/organization" className="text-blue-600 hover:text-blue-800 inline-block">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/events/manage" className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Manage Events
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 mt-3">Edit Event</h1>
            <p className="text-gray-600">
              Update the information participants will see on the public event page.
            </p>
          </div>
          <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${formData.is_published ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
            <CalendarCheck className="h-4 w-4" />
            {formData.is_published ? 'Published' : 'Draft'}
          </span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Event Details</h2>
            <label className="inline-flex items-center text-sm text-gray-700 gap-2">
              <input
                type="checkbox"
                name="is_published"
                checked={formData.is_published}
                onChange={handleInputChange}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Published
            </label>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter event title"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Type *</label>
                <select
                  name="event_type"
                  value={formData.event_type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select event type</option>
                  {eventTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                <div className="relative">
                  <Calendar className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="datetime-local"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                <div className="relative">
                  <Calendar className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="datetime-local"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Venue</label>
                <input
                  type="text"
                  name="venue_place"
                  value={formData.venue_place}
                  onChange={handleInputChange}
                  placeholder="Venue name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <select
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select country</option>
                    {countries.map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Short Description</label>
              <textarea
                name="short_description"
                value={formData.short_description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="Brief summary for listings"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Description</label>
              <textarea
                name="full_description"
                value={formData.full_description}
                onChange={handleInputChange}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="Detailed description shown on the event page"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cover Image (PNG)</label>
              <div className="flex flex-col gap-3">
                <input
                  type="file"
                  accept="image/png"
                  onChange={handleImageChange}
                  className="w-full px-3 py-2 border border-dashed border-gray-300 rounded-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500">Recommended 1200×630px PNG.</p>
                {(imagePreview || existingPhotoUrl) && (
                  <div>
                    <img
                      src={imagePreview || existingPhotoUrl || ''}
                      alt="Event preview"
                      className="w-full h-48 object-cover rounded-lg border border-gray-200"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  name="is_funded"
                  checked={formData.is_funded}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                Funded project
              </label>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Working Language</label>
                <input
                  type="text"
                  name="working_language"
                  value={formData.working_language}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., English"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Groups</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-4 border border-gray-200 rounded-lg">
                {targetGroupOptions.map((group) => (
                  <label key={group} className="flex items-center text-sm text-gray-700 gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.target_groups.includes(group)}
                      onChange={() => handleTargetGroupChange(group)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    {group}
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Group Size *</label>
                <input
                  type="number"
                  name="group_size"
                  value={formData.group_size}
                  onChange={handleInputChange}
                  min={1}
                  max={1000}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Participation Fee ($)</label>
                <input
                  type="number"
                  name="participation_fee"
                  value={formData.participation_fee}
                  onChange={handleInputChange}
                  min={0}
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {Number(formData.participation_fee || 0) > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Participation Fee Reason *</label>
                <textarea
                  name="participation_fee_reason"
                  value={formData.participation_fee_reason}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="Explain why there is a participation fee"
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Accommodation & Food</label>
                <textarea
                  name="accommodation_food_details"
                  value={formData.accommodation_food_details}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transport Details</label>
                <textarea
                  name="transport_details"
                  value={formData.transport_details}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                {formError}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                {success}
              </div>
            )}

            <div className="flex flex-wrap gap-3 justify-end">
              <button
                type="button"
                onClick={() => router.push('/events/manage')}
                className="px-4 py-2 border border-gray-200 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white border rounded-lg p-4 flex items-start gap-3">
          <Trash2 className="h-5 w-5 text-red-500 mt-1" />
          <div>
            <p className="text-sm text-gray-700">
              Need to cancel the project entirely? Contact the Scout Society support team so we can remove it from the public listings.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}




