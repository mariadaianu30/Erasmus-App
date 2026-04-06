'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { 
  Calendar, 
  MapPin, 
  Users, 
  ArrowLeft,
  Clock,
  AlertCircle,
  CheckCircle,
  X,
  Image as ImageIcon,
  DollarSign,
  Languages,
  UtensilsCrossed,
  Car,
  Upload,
  ChevronDown,
  Globe,
  Tag
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface User {
  id: string
  email?: string
}

interface Profile {
  user_type: 'participant' | 'organization'
  organization_name?: string
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
}

export default function CreateEventPage() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const [formData, setFormData] = useState({
    title: '',
    event_type: '',
    start_date: '',
    end_date: '',
    venue_place: '',
    city: '',
    country: '',
    short_description: '',
    full_description: '',
    is_funded: false,
    target_groups: [] as string[],
    group_size: 50,
    working_language: '',
    participation_fee: '',
    participation_fee_reason: '',
    accommodation_food_details: '',
    transport_details: ''
  })

  const eventTypes = [
    'Youth exchange',
    'Training Course',
    'Seminar',
    'Study visit',
    'Partnership - Building Activity',
    'Conference simpozion forum',
    'E-learning',
    'Other'
  ]

  const targetGroupOptions = [
    'Youth', 'Youth workers', 'Trainers', 'Youth leaders', 'Project managers',
    'Policy makers', 'Volunteering', 'Mentors', 'Coaches', 'Researchers', 'Authorities', 'Others'
  ]

  const countries = [
    'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaijan',
    'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi',
    'Cabo Verde', 'Cambodia', 'Cameroon', 'Canada', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo', 'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 'Czech Republic',
    'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic', 'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia',
    'Fiji', 'Finland', 'France', 'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana',
    'Haiti', 'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy', 'Jamaica', 'Japan', 'Jordan',
    'Kazakhstan', 'Kenya', 'Kiribati', 'Kosovo', 'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg',
    'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar',
    'Namibia', 'Nauru', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea', 'North Macedonia', 'Norway', 'Oman',
    'Pakistan', 'Palau', 'Palestine', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal', 'Qatar',
    'Romania', 'Russia', 'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 'Sao Tome and Principe', 'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa', 'South Korea', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria',
    'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Timor-Leste', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu',
    'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan', 'Vanuatu', 'Vatican City', 'Venezuela', 'Vietnam',
    'Yemen', 'Zambia', 'Zimbabwe'
  ].sort()

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
        .select('user_type, organization_name')
        .eq('id', session.user.id)
        .single()
      if (profileData?.user_type !== 'organization') {
        router.push('/dashboard')
        return
      }
      setProfile(profileData)
      setLoading(false)
    }
    getSession()
  }, [router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    setFormData(prev => ({ ...prev, [name]: newValue }))
  }

  const handleTargetGroupChange = (group: string) => {
    setFormData(prev => {
      const current = prev.target_groups
      const index = current.indexOf(group)
      if (index > -1) {
        return { ...prev, target_groups: current.filter(g => g !== group) }
      } else {
        return { ...prev, target_groups: [...current, group] }
      }
    })
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.type !== 'image/png') {
        setError('Please upload a PNG image.')
        return
      }
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => setImagePreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !profile || saving) return
    if (!formData.title || !formData.event_type || !formData.start_date || !formData.end_date) {
      setError('Please fill in all required fields.')
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      let uploadedPhotoUrl = null
      if (imageFile) {
        const fileExtension = imageFile.name.split('.').pop()
        const filePath = `events/${user.id}/${Date.now()}.${fileExtension}`
        const { error: uploadError } = await supabase.storage.from('event-images').upload(filePath, imageFile)
        if (uploadError) throw uploadError
        const { data: publicUrl } = supabase.storage.from('event-images').getPublicUrl(filePath)
        uploadedPhotoUrl = publicUrl.publicUrl
      }

      const eventData = {
        title: formData.title.trim(),
        event_type: formData.event_type,
        start_date: new Date(formData.start_date).toISOString(),
        end_date: new Date(formData.end_date).toISOString(),
        venue_place: formData.venue_place,
        city: formData.city,
        country: formData.country,
        short_description: formData.short_description,
        full_description: formData.full_description,
        description: formData.full_description || formData.short_description || formData.title,
        photo_url: uploadedPhotoUrl,
        is_funded: formData.is_funded,
        target_groups: formData.target_groups,
        max_participants: parseInt(formData.group_size.toString()),
        working_language: formData.working_language,
        participation_fee: formData.participation_fee ? parseFloat(formData.participation_fee.toString()) : 0,
        participation_fee_reason: formData.participation_fee_reason,
        accommodation_food_details: formData.accommodation_food_details,
        transport_details: formData.transport_details,
        organization_id: user.id,
        organization_name: profile.organization_name || 'Organization',
        is_published: true,
        location: `${formData.city}, ${formData.country}`,
        category: formData.event_type || 'Other'
      }

      const { data, error: insertError } = await supabase.from('events').insert(eventData).select()
      if (insertError) throw insertError

      setSuccess('Event created successfully!')
      setTimeout(() => router.push(`/events/${data[0].id}`), 2000)
    } catch (err: any) {
      setError(err.message || 'An error occurred while creating the event.')
    } finally {
      setSaving(false)
    }
  }

  const isFormValid = formData.title && formData.event_type && formData.start_date && formData.end_date

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFF] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1A6FE8]"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFF] pt-28 pb-10 font-dm-sans selection:bg-blue-100 selection:text-blue-900">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        
        {/* HEADER */}
        <div className="mb-10">
          <Link 
            href="/dashboard/organization" 
            className="inline-flex items-center text-[13px] font-medium text-[#6B7A99] hover:text-[#0D1B3E] transition-colors mb-4 group"
          >
            <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </Link>
          <h1 className="text-[28px] font-bold text-[#0D1B3E] tracking-tight mb-2">Create New Event</h1>
          <p className="text-[14px] text-gray-400 font-medium tracking-wide">Create a new opportunity for participants to join</p>
        </div>

        {/* TWO-COLUMN LAYOUT */}
        <div className="flex flex-col lg:flex-row gap-8 relative items-start">
          
          {/* LEFT COLUMN - FORM */}
          <div className="w-full lg:w-[60%] space-y-10 pb-32">
            
            {/* CARD 1 - EVENT INFORMATION */}
            <div className="space-y-4">
               <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Event Information</p>
               <div className="bg-white rounded-[24px] border border-[#E2ECFB] p-8 shadow-sm">
                 <div className="grid grid-cols-1 gap-6">
                    <div>
                      <label className="block text-[13px] font-bold text-[#6B7A99] mb-2 uppercase tracking-widest">Title of Event <span className="text-[#1A6FE8]">*</span></label>
                      <input 
                        type="text" name="title" value={formData.title} onChange={handleInputChange}
                        placeholder="e.g. Erasmus+ Training on Digital Literacy"
                        className="w-full h-[48px] px-5 bg-[#F8FAFF] border border-[#D0DCF5] rounded-xl text-[14px] font-medium focus:outline-none focus:ring-2 focus:ring-[#1A6FE8]/20 focus:border-[#1A6FE8] transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[13px] font-bold text-[#6B7A99] mb-2 uppercase tracking-widest">Event Type <span className="text-[#1A6FE8]">*</span></label>
                      <div className="relative">
                        <select 
                          name="event_type" value={formData.event_type} onChange={handleInputChange}
                          className="w-full h-[48px] px-5 bg-[#F8FAFF] border border-[#D0DCF5] rounded-xl text-[14px] font-medium focus:outline-none focus:ring-2 focus:ring-[#1A6FE8]/20 focus:border-[#1A6FE8] transition-all appearance-none cursor-pointer"
                        >
                          <option value="">Select event type</option>
                          {eventTypes.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-[13px] font-bold text-[#6B7A99] mb-2 uppercase tracking-widest">Begin Date <span className="text-[#1A6FE8]">*</span></label>
                        <input 
                          type="datetime-local" name="start_date" value={formData.start_date} onChange={handleInputChange}
                          className="w-full h-[48px] px-5 bg-[#F8FAFF] border border-[#D0DCF5] rounded-xl text-[14px] font-medium focus:outline-none focus:ring-2 focus:ring-[#1A6FE8]/20 focus:border-[#1A6FE8] transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-[13px] font-bold text-[#6B7A99] mb-2 uppercase tracking-widest">End Date <span className="text-[#1A6FE8]">*</span></label>
                        <input 
                          type="datetime-local" name="end_date" value={formData.end_date} onChange={handleInputChange}
                          className="w-full h-[48px] px-5 bg-[#F8FAFF] border border-[#D0DCF5] rounded-xl text-[14px] font-medium focus:outline-none focus:ring-2 focus:ring-[#1A6FE8]/20 focus:border-[#1A6FE8] transition-all"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[13px] font-bold text-[#6B7A99] mb-2 uppercase tracking-widest">Venue Place</label>
                      <input 
                        type="text" name="venue_place" value={formData.venue_place} onChange={handleInputChange}
                        placeholder="e.g. European Youth Centre"
                        className="w-full h-[48px] px-5 bg-[#F8FAFF] border border-[#D0DCF5] rounded-xl text-[14px] font-medium focus:outline-none focus:border-[#1A6FE8] transition-all"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-[13px] font-bold text-[#6B7A99] mb-2 uppercase tracking-widest">City</label>
                        <input 
                          type="text" name="city" value={formData.city} onChange={handleInputChange}
                          placeholder="e.g. Bucharest"
                          className="w-full h-[48px] px-5 bg-[#F8FAFF] border border-[#D0DCF5] rounded-xl text-[14px] font-medium focus:outline-none focus:border-[#1A6FE8] transition-all"
                        />
                      </div>
                      <div>
                         <label className="block text-[13px] font-bold text-[#6B7A99] mb-2 uppercase tracking-widest">Country</label>
                         <div className="relative">
                            <select 
                              name="country" value={formData.country} onChange={handleInputChange}
                              className="w-full h-[48px] px-5 bg-[#F8FAFF] border border-[#D0DCF5] rounded-xl text-[14px] font-medium focus:outline-none focus:border-[#1A6FE8] transition-all appearance-none cursor-pointer"
                            >
                              <option value="">Select country</option>
                              {countries.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                         </div>
                      </div>
                    </div>
                 </div>
               </div>
            </div>

            {/* CARD 2 - DESCRIPTION */}
            <div className="space-y-4">
               <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Description</p>
               <div className="bg-white rounded-[24px] border border-[#E2ECFB] p-8 shadow-sm">
                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <label className="block text-[13px] font-bold text-[#6B7A99] mb-2 uppercase tracking-widest">Short Description</label>
                      <textarea 
                        name="short_description" value={formData.short_description} onChange={handleInputChange} rows={3}
                        placeholder="A brief summary shown in event listings..."
                        className="w-full px-5 py-4 bg-[#F8FAFF] border border-[#D0DCF5] rounded-xl text-[14px] font-medium focus:outline-none focus:border-[#1A6FE8] transition-all resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[13px] font-bold text-[#6B7A99] mb-2 uppercase tracking-widest">Full Description</label>
                      <textarea 
                        name="full_description" value={formData.full_description} onChange={handleInputChange} rows={6}
                        placeholder="Detailed information about the event, programme, objectives..."
                        className="w-full px-5 py-4 bg-[#F8FAFF] border border-[#D0DCF5] rounded-xl text-[14px] font-medium focus:outline-none focus:border-[#1A6FE8] transition-all resize-none"
                      />
                    </div>
                  </div>
               </div>
            </div>

            {/* CARD 3 - EVENT COVER IMAGE */}
            <div className="space-y-4">
               <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Event Cover Image</p>
               <div className="bg-white rounded-[24px] border border-[#E2ECFB] p-8 shadow-sm">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative w-full h-[240px] border-2 border-dashed rounded-[20px] bg-[#F8FAFF] transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center group ${imagePreview ? 'border-blue-200' : 'border-[#D0DCF5] hover:border-[#1A6FE8]'}`}
                  >
                    <input ref={fileInputRef} type="file" className="hidden" accept="image/png" onChange={handleImageChange} />
                    
                    {imagePreview ? (
                      <div className="absolute inset-0">
                         <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                         <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="bg-white/20 backdrop-blur-md px-5 py-2.5 rounded-full text-white text-[12px] font-bold border border-white/30">Replace Image</div>
                         </div>
                         <button 
                            onClick={(e) => { e.stopPropagation(); setImageFile(null); setImagePreview(null); }}
                            className="absolute top-4 right-4 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-rose-500 shadow-lg hover:bg-rose-500 hover:text-white transition-all"
                          >
                           <X size={16} />
                         </button>
                      </div>
                    ) : (
                      <div className="text-center">
                         <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 text-[#1A6FE8] shadow-sm group-hover:scale-110 transition-transform">
                            <Upload size={24} />
                         </div>
                         <p className="text-[15px] font-bold text-[#0D1B3E] mb-1">Drag & drop your image here</p>
                         <p className="text-[13px] text-[#6B7A99]">or <span className="text-[#1A6FE8] font-bold">browse files</span></p>
                         <p className="mt-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Recommended: 1920×800px · PNG format</p>
                      </div>
                    )}
                  </div>
               </div>
            </div>

            {/* CARD 4 - PARTICIPANTS & LOGISTICS */}
            <div className="space-y-4">
               <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Participants & Logistics</p>
               <div className="bg-white rounded-[24px] border border-[#E2ECFB] p-8 shadow-sm">
                  <div className="grid grid-cols-1 gap-8">
                    <div className="flex items-center justify-between bg-[#F8FAFF] p-4 rounded-xl border border-[#F0F5FF]">
                      <div>
                        <p className="text-[14px] font-bold text-[#0D1B3E]">Funded Project</p>
                        <p className="text-[12px] text-gray-400">Is this project funded by Erasmus+ or similar programs?</p>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, is_funded: !prev.is_funded }))}
                        className={`w-14 h-8 rounded-full transition-all relative ${formData.is_funded ? 'bg-[#1A6FE8]' : 'bg-gray-200'}`}
                      >
                         <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-sm ${formData.is_funded ? 'left-7' : 'left-1'}`} />
                      </button>
                    </div>

                    <div>
                       <label className="block text-[13px] font-bold text-[#6B7A99] mb-4 uppercase tracking-widest">Target Groups</label>
                       <div className="flex flex-wrap gap-2">
                          {targetGroupOptions.map(group => (
                            <button 
                              key={group} type="button"
                              onClick={() => handleTargetGroupChange(group)}
                              className={`px-5 py-2.5 rounded-full text-[12px] font-bold transition-all border ${formData.target_groups.includes(group) ? 'bg-[#1A6FE8] text-white border-[#1A6FE8] shadow-md' : 'bg-white text-gray-500 border-[#E2ECFB] hover:border-blue-200'}`}
                            >
                               {group}
                            </button>
                          ))}
                       </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-[13px] font-bold text-[#6B7A99] mb-2 uppercase tracking-widest">Group Size <span className="text-[#1A6FE8]">*</span></label>
                        <div className="relative">
                          <input 
                            type="number" name="group_size" value={formData.group_size} onChange={handleInputChange}
                            className="w-full h-[48px] px-5 bg-[#F8FAFF] border border-[#D0DCF5] rounded-xl text-[14px] font-medium focus:outline-none focus:border-[#1A6FE8] transition-all"
                          />
                          <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[12px] font-black text-gray-400 uppercase tracking-widest pointer-events-none">Participants</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[13px] font-bold text-[#6B7A99] mb-2 uppercase tracking-widest">Working Language</label>
                        <input 
                          type="text" name="working_language" value={formData.working_language} onChange={handleInputChange}
                          placeholder="e.g. English, French"
                          className="w-full h-[48px] px-5 bg-[#F8FAFF] border border-[#D0DCF5] rounded-xl text-[14px] font-medium focus:outline-none focus:border-[#1A6FE8] transition-all"
                        />
                      </div>
                    </div>

                    <div>
                       <label className="block text-[13px] font-bold text-[#6B7A99] mb-2 uppercase tracking-widest">Participation Fee (€)</label>
                       <div className="relative">
                          <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400">€</span>
                          <input 
                            type="number" name="participation_fee" value={formData.participation_fee} onChange={handleInputChange}
                            placeholder="0"
                            className="w-full h-[48px] pl-10 pr-5 bg-[#F8FAFF] border border-[#D0DCF5] rounded-xl text-[14px] font-medium focus:outline-none focus:border-[#1A6FE8] transition-all"
                          />
                       </div>
                    </div>

                    <AnimatePresence>
                      {formData.participation_fee && parseFloat(formData.participation_fee.toString()) > 0 && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                           <label className="block text-[13px] font-bold text-[#6B7A99] mb-2 uppercase tracking-widest">Fee Reason <span className="text-[#1A6FE8]">*</span></label>
                           <textarea 
                             name="participation_fee_reason" value={formData.participation_fee_reason} onChange={handleInputChange} rows={2}
                             placeholder="Explain why this fee is necessary..."
                             className="w-full px-5 py-4 bg-[#F8FAFF] border border-[#D0DCF5] rounded-xl text-[14px] font-medium focus:outline-none focus:border-[#1A6FE8] transition-all resize-none"
                           />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
               </div>
            </div>

            {/* CARD 5 - ADDITIONAL DETAILS */}
            <div className="space-y-4">
               <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Additional Details</p>
               <div className="bg-white rounded-[24px] border border-[#E2ECFB] p-8 shadow-sm">
                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <label className="block text-[13px] font-bold text-[#6B7A99] mb-2 uppercase tracking-widest">Accommodation and Food</label>
                      <textarea 
                        name="accommodation_food_details" value={formData.accommodation_food_details} onChange={handleInputChange} rows={3}
                        placeholder="Details about dietary options, room types..."
                        className="w-full px-5 py-4 bg-[#F8FAFF] border border-[#D0DCF5] rounded-xl text-[14px] font-medium focus:outline-none focus:border-[#1A6FE8] transition-all resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[13px] font-bold text-[#6B7A99] mb-2 uppercase tracking-widest">Transport Details</label>
                      <textarea 
                        name="transport_details" value={formData.transport_details} onChange={handleInputChange} rows={3}
                        placeholder="Information about travel reimbursement, local transport..."
                        className="w-full px-5 py-4 bg-[#F8FAFF] border border-[#D0DCF5] rounded-xl text-[14px] font-medium focus:outline-none focus:border-[#1A6FE8] transition-all resize-none"
                      />
                    </div>
                  </div>
               </div>
            </div>
          </div>

          {/* RIGHT COLUMN - STICKY PREVIEW */}
          <div className="w-full lg:w-[40%] lg:sticky lg:top-32">
             <div className="bg-white rounded-[32px] border border-[#E2ECFB] shadow-xl overflow-hidden">
                <div className="p-6 border-b border-[#F8FAFF] bg-white">
                   <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Event Preview</p>
                   <p className="text-[12px] font-medium text-[#6B7A99]">How your event will appear to participants</p>
                </div>

                {/* PREVIEW BODY */}
                <div className="p-6">
                   <div className="relative rounded-[24px] overflow-hidden aspect-[1.8/1] bg-blue-50 mb-6">
                      {imagePreview ? (
                        <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#E8F1FD] to-blue-100">
                           <ImageIcon size={32} className="text-[#1A6FE8]/20" />
                        </div>
                      )}
                      
                      <div className="absolute top-4 left-4">
                         <span className="bg-[#1A6FE8] text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-lg">
                           {formData.event_type || 'Training Course'}
                         </span>
                      </div>
                   </div>

                   <div className="space-y-4">
                      <h3 className={`text-[20px] font-bold leading-tight ${formData.title ? 'text-[#0D1B3E]' : 'text-gray-300'}`}>
                        {formData.title || 'Event Title'}
                      </h3>
                      <p className="text-[13px] font-medium text-[#6B7A99]">by {profile?.organization_name || 'Example'}</p>
                      
                      <div className="flex flex-col gap-3 py-2">
                         <div className="flex items-center gap-3 text-[#6B7A99]">
                            <div className="w-8 h-8 rounded-lg bg-[#F8FAFF] flex items-center justify-center text-[#1A6FE8] shadow-sm">
                               <Calendar size={14} />
                            </div>
                            <span className={`text-[13px] font-bold ${formData.start_date ? 'text-[#0D1B3E]' : 'text-gray-300'}`}>
                               {formData.start_date ? new Date(formData.start_date).toLocaleDateString() : 'Dates not set'}
                               {formData.end_date && ` – ${new Date(formData.end_date).toLocaleDateString()}`}
                            </span>
                         </div>
                         <div className="flex items-center gap-3 text-[#6B7A99]">
                            <div className="w-8 h-8 rounded-lg bg-[#F8FAFF] flex items-center justify-center text-[#1A6FE8] shadow-sm">
                               <MapPin size={14} />
                            </div>
                            <span className={`text-[13px] font-bold ${formData.city || formData.country ? 'text-[#0D1B3E]' : 'text-gray-300'}`}>
                               {[formData.city, formData.country].filter(Boolean).join(', ') || 'Location TBD'}
                            </span>
                         </div>
                      </div>

                      <div className="h-px bg-[#F8FAFF] w-full" />

                      <p className={`text-[13px] leading-relaxed line-clamp-2 ${formData.short_description ? 'text-[#0D1B3E]/70' : 'text-gray-300'}`}>
                        {formData.short_description || 'Brief project description will appear here...'}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 pt-2">
                         <div className="flex items-center gap-2 bg-blue-50 text-[#1A6FE8] px-3.5 py-1.5 rounded-full text-[11px] font-bold border border-blue-100">
                            <Users size={12} /> {formData.group_size} participants
                         </div>
                         {formData.is_funded && (
                           <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-3.5 py-1.5 rounded-full text-[11px] font-bold border border-emerald-100">
                              Funded
                           </div>
                         )}
                      </div>

                      <div className="flex flex-wrap gap-1.5 pt-2">
                         {formData.target_groups.slice(0, 3).map(g => (
                           <span key={g} className="px-3 py-1 rounded-full border border-[#E2ECFB] text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                             {g}
                           </span>
                         ))}
                         {formData.target_groups.length > 3 && (
                           <span className="px-3 py-1 rounded-full text-[10px] font-black text-[#1A6FE8] uppercase tracking-wider">
                             +{formData.target_groups.length - 3} more
                           </span>
                         )}
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* STICKY BOTTOM BAR (LEFT Column) */}
        <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
           <div className="max-w-7xl mx-auto px-4 md:px-8">
              <div className="w-full lg:w-[60%] pointer-events-auto bg-white/80 backdrop-blur-lg border-t border-[#E2ECFB] p-6 rounded-t-[32px] shadow-[0_-12px_40px_rgba(13,27,62,0.06)] flex items-center justify-between">
                 <button 
                   onClick={() => router.back()}
                   className="px-6 py-4 rounded-xl text-[14px] font-bold text-[#6B7A99] hover:bg-gray-50 transition-all flex items-center gap-2"
                 >
                   Cancel
                 </button>
                 <div className="flex items-center gap-4">
                   {error && <span className="text-rose-500 text-[13px] font-bold hidden md:inline">{error}</span>}
                   <button 
                     disabled={!isFormValid || saving}
                     onClick={handleSubmit}
                     className={`px-8 py-4 rounded-2xl text-[14px] font-bold uppercase tracking-widest transition-all flex items-center gap-3 ${isFormValid && !saving ? 'bg-[#1A6FE8] text-white shadow-xl shadow-[#1A6FE8]/20 hover:-translate-y-1' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                   >
                     {saving ? (
                       <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                     ) : (
                       <>Create Event <CheckCircle size={18} /></>
                     )}
                   </button>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  )
}
