'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { countries } from '@/lib/countries'
import { calculateAge, formatNameField } from '@/lib/utils'
import { calculateProfileCompletion } from '@/lib/profile-completion'
import { 
  ArrowLeft, Check, ChevronDown, Plus, X, 
  Lock, Globe, User, Award, Languages, Target,
  AlertCircle, CheckCircle, Save
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface LanguageEntry {
  name: string
  level: string
}

interface Profile {
  id: string
  user_type: 'participant' | 'organization'
  first_name: string
  last_name: string
  organization_name?: string
  birth_date: string
  location: string
  gender: 'female' | 'male' | 'other' | 'undefined' | ''
  nationality: string
  residency_country: string
  citizenships: string[]
  role_in_project: string
  has_fewer_opportunities: boolean
  languages: LanguageEntry[]
  participant_target_groups: string[]
  bio: string
  website?: string
}

const TARGET_GROUPS = [
  'Youth', 'Youth workers', 'Trainers', 'Youth leaders', 
  'Project managers', 'Policy makers', 'Volunteering', 
  'Mentors', 'Coaches', 'Researchers', 'Authorities', 'Others'
]

const LANGUAGE_LEVELS = ['Native', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2']

const GENDER_OPTIONS = ['female', 'male', 'other', 'undefined']
const ROLE_OPTIONS = ['participant', 'group leader', 'trainer or facilitator']

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [successToast, setSuccessToast] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [profile, setProfile] = useState<Profile>({
    id: '',
    user_type: 'participant',
    first_name: '',
    last_name: '',
    birth_date: '',
    location: '',
    gender: '',
    nationality: '',
    residency_country: '',
    citizenships: [],
    role_in_project: '',
    has_fewer_opportunities: false,
    languages: [],
    participant_target_groups: [],
    bio: ''
  })

  // Language add state
  const [newLang, setNewLang] = useState<LanguageEntry>({ name: '', level: 'B2' })
  const [showAddLang, setShowAddLang] = useState(false)

  const router = useRouter()

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth')
        return
      }
      setUser(session.user)
      fetchProfile(session.user.id)
    }
    initAuth()
  }, [router])

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error && error.code !== 'PGRST116') throw error

      if (data) {
        setProfile({
          ...data,
          gender: data.gender || '',
          citizenships: Array.isArray(data.citizenships) ? data.citizenships : [],
          languages: Array.isArray(data.languages) ? data.languages : [],
          participant_target_groups: Array.isArray(data.participant_target_groups) ? data.participant_target_groups : [],
          bio: data.bio || ''
        })
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const updateData: any = {
        ...profile,
        first_name: formatNameField(profile.first_name),
        last_name: formatNameField(profile.last_name),
        birth_date: profile.birth_date || null,
        updated_at: new Date().toISOString()
      }

      // Handle dual naming convention if necessary (birth_date vs birthdate)
      if (updateData.birth_date) {
        updateData.birthdate = updateData.birth_date
      }

      const { error: saveError } = await supabase
        .from('profiles')
        .upsert(updateData)

      if (saveError) throw saveError

      setSuccessToast(true)
      setTimeout(() => setSuccessToast(false), 4000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const toggleTargetGroup = (group: string) => {
    setProfile(prev => ({
      ...prev,
      participant_target_groups: prev.participant_target_groups.includes(group)
        ? prev.participant_target_groups.filter(g => g !== group)
        : [...prev.participant_target_groups, group]
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFF]">
        <div className="w-12 h-12 border-4 border-blue-100 border-t-[#1A6FE8] rounded-full animate-spin" />
      </div>
    )
  }

  const completion = calculateProfileCompletion(profile, profile.user_type).percent

  return (
    <div className="min-h-screen bg-[#F8FAFF] font-dm-sans pb-32 selection:bg-[#1A6FE8] selection:text-white pt-[120px]">
      {/* TOP BAR */}
      <div className="bg-white border-b border-[#E2ECFB] sticky top-[110px] z-40">
        <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex flex-col">
            <Link href="/dashboard" className="flex items-center text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-[#1A6FE8] transition-colors mb-1">
              <ArrowLeft size={12} className="mr-2" /> Back to Dashboard
            </Link>
            <h1 className="text-xl font-bold text-[#0D1B3E]">Edit Profile</h1>
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-6 pt-12 space-y-12">
        {error && (
          <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 text-red-600">
            <AlertCircle size={18} />
            <p className="text-xs font-bold uppercase tracking-widest">{error}</p>
          </div>
        )}

        <div className="text-center mb-12">
          <h2 className="text-2xl font-black text-[#0D1B3E] mb-2">Refine Your Identity</h2>
           <p className="text-sm font-medium text-gray-400">Keep your information accurate to receive the best opportunity matches across Europe.</p>
        </div>

        {profile.user_type === 'organization' ? (
          /* ORGANIZATION UI (ADAPTED TO BOUTIQUE STYLE) */
          <div className="space-y-12">
             <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Organization Details</p>
                <div className="bg-white rounded-[24px] border border-[#E2ECFB] p-8 shadow-sm space-y-6">
                   <div className="space-y-2">
                      <label className="text-[11px] font-black uppercase tracking-widest text-[#1A6FE8] ml-1">Organization Name*</label>
                      <input 
                        type="text" 
                        value={profile.organization_name || ''} 
                        onChange={e => setProfile({...profile, organization_name: e.target.value})}
                        className="w-full h-[42px] px-4 border border-[#D0DCF5] rounded-xl text-[#0D1B3E] font-bold focus:ring-2 focus:ring-[#1A6FE8]/20 outline-none" 
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[11px] font-black uppercase tracking-widest text-[#1A6FE8] ml-1">Website</label>
                      <input 
                        type="url" 
                        value={profile.website || ''} 
                        onChange={e => setProfile({...profile, website: e.target.value})}
                        placeholder="https://example.org"
                        className="w-full h-[42px] px-4 border border-[#D0DCF5] rounded-xl text-[#0D1B3E] font-bold focus:ring-2 focus:ring-[#1A6FE8]/20 outline-none" 
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[11px] font-black uppercase tracking-widest text-[#1A6FE8] ml-1">Location*</label>
                      <input 
                        type="text" 
                        value={profile.location} 
                        onChange={e => setProfile({...profile, location: e.target.value})}
                        className="w-full h-[42px] px-4 border border-[#D0DCF5] rounded-xl text-[#0D1B3E] font-bold focus:ring-2 focus:ring-[#1A6FE8]/20 outline-none" 
                      />
                   </div>
                </div>
             </div>
          </div>
        ) : (
          /* PARTICIPANT UI (AS REQUESTED) */
          <>
            {/* SECTION 1 — PERSONAL INFO */}
            <div className="space-y-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Personal Info</p>
              <div className="bg-white rounded-[24px] border border-[#E2ECFB] p-8 shadow-sm space-y-6">
                <div className="space-y-2">
                   <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 ml-1">Email Access</label>
                   <div className="relative">
                      <input 
                        type="text" 
                        value={user?.email || ''} 
                        disabled 
                        className="w-full h-[42px] px-4 bg-gray-50 border border-[#D0DCF5] rounded-xl text-gray-400 cursor-not-allowed pl-10" 
                      />
                      <Lock size={14} className="absolute left-4 top-[14px] text-gray-300" />
                   </div>
                   <p className="text-[9px] text-gray-400 ml-1 italic">Email cannot be changed for security reasons</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-[#1A6FE8] ml-1">First Name*</label>
                    <input 
                      type="text" 
                      value={profile.first_name}
                      onChange={e => setProfile({...profile, first_name: e.target.value})}
                      className="w-full h-[42px] px-4 border border-[#D0DCF5] rounded-xl text-[#0D1B3E] font-bold focus:ring-2 focus:ring-[#1A6FE8]/20 outline-none" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-[#1A6FE8] ml-1">Last Name*</label>
                    <input 
                      type="text" 
                      value={profile.last_name}
                      onChange={e => setProfile({...profile, last_name: e.target.value})}
                      className="w-full h-[42px] px-4 border border-[#D0DCF5] rounded-xl text-[#0D1B3E] font-bold focus:ring-2 focus:ring-[#1A6FE8]/20 outline-none" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-[#1A6FE8] ml-1">Birth Date</label>
                    <input 
                      type="date" 
                      value={profile.birth_date}
                      onChange={e => setProfile({...profile, birth_date: e.target.value})}
                      className="w-full h-[42px] px-4 border border-[#D0DCF5] rounded-xl text-[#0D1B3E] font-bold focus:ring-2 focus:ring-[#1A6FE8]/20 outline-none" 
                    />
                    <p className="text-[9px] text-gray-400 ml-1">Age: {profile.birth_date ? calculateAge(profile.birth_date) : '—'} years old</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-[#1A6FE8] ml-1">Location*</label>
                    <input 
                      type="text" 
                      value={profile.location}
                      onChange={e => setProfile({...profile, location: e.target.value})}
                      placeholder="e.g. Bucharest, Romania"
                      className="w-full h-[42px] px-4 border border-[#D0DCF5] rounded-xl text-[#0D1B3E] font-bold focus:ring-2 focus:ring-[#1A6FE8]/20 outline-none" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                   <label className="text-[11px] font-black uppercase tracking-widest text-[#1A6FE8] ml-1">Gender*</label>
                   <select 
                     value={profile.gender}
                     onChange={e => setProfile({...profile, gender: e.target.value as any})}
                     className="w-full h-[42px] px-4 border border-[#D0DCF5] rounded-xl text-[#0D1B3E] font-bold focus:ring-2 focus:ring-[#1A6FE8]/20 outline-none appearance-none bg-no-repeat bg-[right_1rem_center] bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')]"
                    >
                     <option value="" disabled>Select gender</option>
                     {GENDER_OPTIONS.map(opt => <option key={opt} value={opt} className="capitalize">{opt}</option>)}
                   </select>
                </div>
              </div>
            </div>

            {/* SECTION 2 — NATIONALITY & RESIDENCY */}
            <div className="space-y-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Nationality & Residency</p>
              <div className="bg-white rounded-[24px] border border-[#E2ECFB] p-8 shadow-sm space-y-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-[#1A6FE8] ml-1">Nationality*</label>
                  <select 
                    value={profile.nationality}
                    onChange={e => setProfile({...profile, nationality: e.target.value})}
                    className="w-full h-[42px] px-4 border border-[#D0DCF5] rounded-xl text-[#0D1B3E] font-bold focus:ring-2 focus:ring-[#1A6FE8]/20 outline-none"
                  >
                    <option value="" disabled>Select nationality</option>
                    {countries.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-[#1A6FE8] ml-1">Residency Country*</label>
                  <select 
                    value={profile.residency_country}
                    onChange={e => setProfile({...profile, residency_country: e.target.value})}
                    className="w-full h-[42px] px-4 border border-[#D0DCF5] rounded-xl text-[#0D1B3E] font-bold focus:ring-2 focus:ring-[#1A6FE8]/20 outline-none"
                  >
                    <option value="" disabled>Select country</option>
                    {countries.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="text-[11px] font-black uppercase tracking-widest text-[#1A6FE8] ml-1">Citizenships*</label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {profile.citizenships.map(c => (
                      <span key={c} className="bg-[#E8F1FD] text-[#1A6FE8] px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                        {c}
                        <X size={12} className="cursor-pointer hover:text-red-500" onClick={() => setProfile({...profile, citizenships: profile.citizenships.filter(x => x !== c)})} />
                      </span>
                    ))}
                    {profile.citizenships.length === 0 && <p className="text-[10px] text-gray-300 italic py-2">No citizenships added</p>}
                  </div>
                  <select 
                    onChange={e => {
                       if (e.target.value && !profile.citizenships.includes(e.target.value)) {
                         setProfile({...profile, citizenships: [...profile.citizenships, e.target.value]})
                       }
                    }}
                    value=""
                    className="w-full h-[42px] px-4 border border-[#D0DCF5] rounded-xl text-[#0D1B3E] font-bold focus:ring-2 focus:ring-[#1A6FE8]/20 outline-none"
                  >
                    <option value="">+ Add Citizenship...</option>
                    {countries.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* SECTION 3 — ROLE & EXPERIENCE */}
            <div className="space-y-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Role & Experience</p>
              <div className="bg-white rounded-[24px] border border-[#E2ECFB] p-8 shadow-sm space-y-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-[#1A6FE8] ml-1">Role in Project*</label>
                  <select 
                    value={profile.role_in_project}
                    onChange={e => setProfile({...profile, role_in_project: e.target.value})}
                    className="w-full h-[42px] px-4 border border-[#D0DCF5] rounded-xl text-[#0D1B3E] font-bold focus:ring-2 focus:ring-[#1A6FE8]/20 outline-none"
                  >
                    <option value="" disabled>Select role</option>
                    {ROLE_OPTIONS.map(opt => <option key={opt} value={opt} className="capitalize">{opt}</option>)}
                  </select>
                </div>

                <label className="flex items-start gap-4 p-5 border border-[#E2ECFB] rounded-2xl cursor-pointer hover:bg-[#F8FAFF] transition-all group">
                   <div className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${profile.has_fewer_opportunities ? 'bg-[#1A6FE8] border-[#1A6FE8]' : 'border-[#D0DCF5] group-hover:border-[#1A6FE8]'}`}>
                      {profile.has_fewer_opportunities && <Check size={14} className="text-white" />}
                   </div>
                   <input 
                     type="checkbox" 
                     checked={profile.has_fewer_opportunities}
                     onChange={e => setProfile({...profile, has_fewer_opportunities: e.target.checked})}
                     className="hidden" 
                   />
                   <div>
                      <p className="text-sm font-bold text-[#0D1B3E]">Participant with fewer opportunities</p>
                      <p className="text-[10px] text-gray-400 leading-relaxed mt-1">This applies if you face social, economic, or geographical obstacles.</p>
                   </div>
                </label>
              </div>
            </div>

            {/* SECTION 4 — LANGUAGES */}
            <div className="space-y-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Languages</p>
              <div className="bg-white rounded-[24px] border border-[#E2ECFB] p-8 shadow-sm space-y-6">
                <div className="flex flex-wrap gap-3">
                  {profile.languages.map((l, i) => (
                    <span key={i} className="bg-white border border-[#E2ECFB] text-[#0D1B3E] px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-3">
                      {l.name} — {l.level}
                      <X size={12} className="text-gray-300 hover:text-red-500 cursor-pointer" onClick={() => setProfile({...profile, languages: profile.languages.filter((_, idx) => idx !== i)})} />
                    </span>
                  ))}
                  <button 
                    onClick={() => setShowAddLang(!showAddLang)}
                    className="px-4 py-2 border-2 border-dashed border-[#D0DCF5] text-[#1A6FE8] rounded-full text-[10px] font-black uppercase tracking-widest hover:border-[#1A6FE8] transition-all flex items-center gap-2"
                  >
                    <Plus size={14} /> Add Language
                  </button>
                </div>

                <AnimatePresence>
                  {showAddLang && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-6 bg-[#F8FAFF] rounded-2xl border border-[#D0DCF5] flex flex-col sm:flex-row gap-4 items-end">
                       <div className="flex-1 space-y-2 w-full">
                          <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Language Name</label>
                          <input type="text" value={newLang.name} onChange={e => setNewLang({...newLang, name: e.target.value})} className="w-full h-[42px] px-4 rounded-xl border border-[#D0DCF5] text-[#0D1B3E] outline-none" placeholder="e.g. English" />
                       </div>
                       <div className="flex-1 space-y-2 w-full">
                          <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Proficiency Level</label>
                          <select value={newLang.level} onChange={e => setNewLang({...newLang, level: e.target.value})} className="w-full h-[42px] px-4 rounded-xl border border-[#D0DCF5] text-[#0D1B3E] outline-none">
                            {LANGUAGE_LEVELS.map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
                          </select>
                       </div>
                       <button 
                        onClick={() => {
                          if (newLang.name) {
                            setProfile({...profile, languages: [...profile.languages, newLang]})
                            setNewLang({ name: '', level: 'B2' })
                            setShowAddLang(false)
                          }
                        }}
                        className="bg-[#1A6FE8] text-white px-6 h-[42px] rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-100"
                       >Add</button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* SECTION 5 — TARGET GROUPS */}
            <div className="space-y-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Target Group for Participant*</p>
              <div className="bg-white rounded-[24px] border border-[#E2ECFB] p-8 shadow-sm">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {TARGET_GROUPS.map(group => {
                    const isSelected = profile.participant_target_groups.includes(group)
                    return (
                      <button
                        key={group}
                        onClick={() => toggleTargetGroup(group)}
                        className={`px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all text-center ${
                          isSelected 
                          ? 'bg-[#1A6FE8] border-[#1A6FE8] text-white shadow-lg shadow-blue-100' 
                          : 'bg-white border-[#E2ECFB] text-gray-400 hover:border-[#1A6FE8]/30'
                        }`}
                      >
                        {group}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </>
        )}

        {/* SECTION 6 — BIO */}
        <div className="space-y-4">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Bio & Experience</p>
          <div className="bg-white rounded-[24px] border border-[#E2ECFB] p-8 shadow-sm space-y-4">
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-[#1A6FE8] ml-1">Short Bio</label>
              <textarea 
                rows={5}
                value={profile.bio}
                onChange={e => setProfile({...profile, bio: e.target.value.slice(0, 500)})}
                placeholder="Write a short bio about yourself..."
                className="w-full p-6 border border-[#D0DCF5] rounded-[20px] text-[#0D1B3E] font-medium focus:ring-2 focus:ring-[#1A6FE8]/20 outline-none leading-relaxed transition-all"
              />
              <div className="text-right">
                <span className={`text-[10px] font-black uppercase tracking-widest ${profile.bio.length >= 500 ? 'text-red-500' : 'text-gray-300'}`}>
                  {profile.bio.length} / 500
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* STICKY BOTTOM BAR */}
      <div className="fixed bottom-0 left-0 right-0 h-24 bg-white/80 backdrop-blur-md border-t border-[#E2ECFB] z-50 px-6 sm:px-12 flex items-center justify-center">
        <div className="max-w-4xl w-full flex items-center justify-end gap-6">
          <Link href="/dashboard" className="px-8 py-4 border-2 border-transparent text-gray-400 font-black text-xs uppercase tracking-widest hover:text-[#0D1B3E] transition-all">Cancel</Link>
          <button 
            onClick={() => handleSave()}
            disabled={saving}
            className="px-12 py-4 bg-[#1A6FE8] text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl hover:shadow-blue-200 hover:-translate-y-1 active:scale-95 transition-all disabled:opacity-50 disabled:translate-y-0"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* SUCCESS TOAST */}
      <AnimatePresence>
        {successToast && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-32 left-1/2 -translate-x-1/2 bg-[#047857] text-white px-8 py-4 rounded-2xl shadow-2xl z-[60] flex items-center gap-3"
          >
            <CheckCircle size={18} />
            <span className="text-[11px] font-black uppercase tracking-widest">Profile Updated Successfully</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}