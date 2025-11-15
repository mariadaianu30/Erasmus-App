'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Mail, Lock, Eye, EyeOff, User, ArrowRight, Users, UserCheck, Flag, MapPin, Briefcase, Languages, Calendar } from 'lucide-react'
import { countries } from '@/lib/countries'

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    userType: 'participant' as 'participant' | 'organization',
    organizationName: '',
    birth_date: '',
    // New participant fields
    gender: '' as 'female' | 'male' | 'undefined' | '',
    nationality: '',
    citizenships: [] as string[],
    residency_country: '',
    role_in_project: '' as 'participant' | 'group leader' | 'trainer or facilitator' | '',
    has_fewer_opportunities: false,
    fewer_opportunities_categories: [] as string[],
    languages: [] as Array<{language: string, level: string}>,
    participant_target_groups: [] as string[]
  })
  const [newLanguage, setNewLanguage] = useState({ language: '', level: '' })
  const [newCitizenship, setNewCitizenship] = useState('')
  
  const genderOptions = ['female', 'male', 'undefined']
  const roleOptions = ['participant', 'group leader', 'trainer or facilitator']
  const fewerOpportunitiesOptions = [
    'Discrimination',
    'Education',
    'Cultural',
    'Disabilities',
    'Economical',
    'Geographical',
    'Health',
    'Social'
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
    'Others'
  ]
  const languageLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'Native']
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  // Check if user is already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        router.push('/dashboard')
      }
    }
    checkAuth()
  }, [router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    
    setFormData(prev => {
      if (type === 'checkbox') {
        if (name === 'has_fewer_opportunities') {
          return { ...prev, [name]: checked }
        }
        // Handle checkbox arrays
        if (name.startsWith('fewer_opp_') || name.startsWith('target_group_')) {
          const key = name.startsWith('fewer_opp_') ? 'fewer_opportunities_categories' : 'participant_target_groups'
          const item = name.replace('fewer_opp_', '').replace('target_group_', '')
          const current = prev[key as keyof typeof prev] as string[]
          if (checked) {
            return { ...prev, [key]: [...current, item] }
          } else {
            return { ...prev, [key]: current.filter(i => i !== item) }
          }
        }
        return { ...prev, [name]: checked }
      }
      return { ...prev, [name]: value }
    })
  }

  const addLanguage = () => {
    if (newLanguage.language && newLanguage.level) {
      setFormData(prev => ({
        ...prev,
        languages: [...prev.languages, { language: newLanguage.language, level: newLanguage.level }]
      }))
      setNewLanguage({ language: '', level: '' })
    }
  }

  const removeLanguage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.filter((_, i) => i !== index)
    }))
  }

  const addCitizenship = () => {
    if (newCitizenship.trim()) {
      setFormData(prev => ({
        ...prev,
        citizenships: [...prev.citizenships, newCitizenship.trim()]
      }))
      setNewCitizenship('')
    }
  }

  const removeCitizenship = (index: number) => {
    setFormData(prev => ({
      ...prev,
      citizenships: prev.citizenships.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!isLogin) {
      // Registration validation
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match')
        setLoading(false)
        return
      }

      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters')
        setLoading(false)
        return
      }

      if (formData.userType === 'participant' && (!formData.firstName || !formData.lastName || !formData.birth_date)) {
        setError('Please fill in all required fields: First Name, Last Name, and Birth Date')
        setLoading(false)
        return
      }

      if (formData.userType === 'organization' && !formData.organizationName) {
        setError('Please enter your organization name')
        setLoading(false)
        return
      }

      // Registration logic
      try {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              first_name: formData.firstName,
              last_name: formData.lastName,
              user_type: formData.userType,
              organization_name: formData.organizationName,
              birth_date: formData.birth_date || null,
            }
          }
        })

        if (authError) {
          setError(authError.message)
          setLoading(false)
          return
        }

        // Create profile with all participant fields
        if (authData.user && formData.userType === 'participant') {
          const profileData: any = {
            id: authData.user.id,
            user_type: 'participant',
            first_name: formData.firstName,
            last_name: formData.lastName,
            email: formData.email,
            birthdate: formData.birth_date || null,
            gender: formData.gender || null,
            nationality: formData.nationality.trim() || null,
            citizenships: formData.citizenships.length > 0 ? formData.citizenships : null,
            residency_country: formData.residency_country.trim() || null,
            role_in_project: formData.role_in_project || null,
            has_fewer_opportunities: formData.has_fewer_opportunities,
            fewer_opportunities_categories: formData.fewer_opportunities_categories.length > 0 ? formData.fewer_opportunities_categories : null,
            languages: formData.languages.length > 0 ? formData.languages : null,
            participant_target_groups: formData.participant_target_groups.length > 0 ? formData.participant_target_groups : null
          }

          const { error: profileError } = await supabase
            .from('profiles')
            .upsert(profileData)

          if (profileError) {
            console.error('Profile creation error:', profileError)
            // Don't fail registration if profile creation fails - it can be created later
          }
        } else if (authData.user && formData.userType === 'organization') {
          // Create organization profile
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: authData.user.id,
              user_type: 'organization',
              organization_name: formData.organizationName
            })

          if (profileError) {
            console.error('Profile creation error:', profileError)
          }
        }

        router.push('/dashboard')
      } catch (error) {
        setError('An unexpected error occurred')
      } finally {
        setLoading(false)
      }
    } else {
      // Login logic
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        })

        if (error) {
          setError(error.message)
        } else {
          router.push('/dashboard')
        }
      } catch (error) {
        setError('An unexpected error occurred')
      } finally {
        setLoading(false)
      }
    }
  }

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      userType: 'participant',
      organizationName: '',
      birth_date: '',
      gender: '',
      nationality: '',
      citizenships: [],
      residency_country: '',
      role_in_project: '',
      has_fewer_opportunities: false,
      fewer_opportunities_categories: [],
      languages: [],
      participant_target_groups: []
    })
    setNewLanguage({ language: '', level: '' })
    setNewCitizenship('')
    setError('')
  }

  const toggleMode = () => {
    setIsLogin(!isLogin)
    resetForm()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Erasmus+ Connect</h1>
            <p className="text-sm text-gray-500">by Scout Society</p>
          </div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
            <User className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {isLogin ? 'Sign in to your account' : 'Create your account'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {isLogin ? (
              <>
                Or{' '}
                <button
                  type="button"
                  onClick={toggleMode}
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  create a new account
                </button>
              </>
            ) : (
              <>
                Join our community of young people and organizations across Europe
                <br />
                Or{' '}
                <button
                  type="button"
                  onClick={toggleMode}
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  sign in to your existing account
                </button>
              </>
            )}
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            {/* User Type Selection (only for registration) */}
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  I am a:
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <label className={`relative flex items-center p-4 border rounded-lg cursor-pointer ${
                    formData.userType === 'participant' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}>
                    <input
                      type="radio"
                      name="userType"
                      value="participant"
                      checked={formData.userType === 'participant'}
                      onChange={handleInputChange}
                      className="sr-only"
                    />
                    <div className="flex items-center">
                      <UserCheck className="h-5 w-5 text-blue-600 mr-2" />
                      <span className="text-sm font-medium">Participant</span>
                    </div>
                  </label>
                  
                  <label className={`relative flex items-center p-4 border rounded-lg cursor-pointer ${
                    formData.userType === 'organization' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}>
                    <input
                      type="radio"
                      name="userType"
                      value="organization"
                      checked={formData.userType === 'organization'}
                      onChange={handleInputChange}
                      className="sr-only"
                    />
                    <div className="flex items-center">
                      <Users className="h-5 w-5 text-blue-600 mr-2" />
                      <span className="text-sm font-medium">Organization</span>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="appearance-none relative block w-full pl-10 pr-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* Name fields for participants (registration only) */}
            {!isLogin && formData.userType === 'participant' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                      First name
                    </label>
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="First name"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                      Last name
                    </label>
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Last name"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="birth_date" className="block text-sm font-medium text-gray-700">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    Birth Date *
                  </label>
                  <input
                    id="birth_date"
                    name="birth_date"
                    type="date"
                    required
                    value={formData.birth_date}
                    onChange={handleInputChange}
                    max={new Date().toISOString().split('T')[0]}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                {/* Additional Participant Information Section */}
                <div className="border-t pt-4 mt-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Additional Information</h3>
                  
                  {/* Gender */}
                  <div className="mb-4">
                    <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
                      Gender
                    </label>
                    <select
                      id="gender"
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="">Select gender</option>
                      {genderOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>

                  {/* Nationality and Residency */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label htmlFor="nationality" className="block text-sm font-medium text-gray-700 mb-1">
                        <Flag className="h-4 w-4 inline mr-1" />
                        Nationality
                      </label>
                      <select
                        id="nationality"
                        name="nationality"
                        value={formData.nationality}
                        onChange={handleInputChange}
                        className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      >
                        <option value="">Select nationality</option>
                        {countries.map(country => (
                          <option key={country} value={country}>{country}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="residency_country" className="block text-sm font-medium text-gray-700 mb-1">
                        <MapPin className="h-4 w-4 inline mr-1" />
                        Residency Country
                      </label>
                      <select
                        id="residency_country"
                        name="residency_country"
                        value={formData.residency_country}
                        onChange={handleInputChange}
                        className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      >
                        <option value="">Select country</option>
                        {countries.map(country => (
                          <option key={country} value={country}>{country}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Citizenships */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Citizenships
                    </label>
                    <div className="flex gap-2 mb-2">
                      <select
                        value={newCitizenship}
                        onChange={(e) => setNewCitizenship(e.target.value)}
                        className="flex-1 appearance-none relative block px-3 py-2 border border-gray-300 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      >
                        <option value="">Select citizenship to add</option>
                        {countries.filter(c => !formData.citizenships.includes(c)).map(country => (
                          <option key={country} value={country}>{country}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={addCitizenship}
                        className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
                      >
                        Add
                      </button>
                    </div>
                    {formData.citizenships.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {formData.citizenships.map((citizenship, idx) => (
                          <span key={idx} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs flex items-center gap-1">
                            {citizenship}
                            <button
                              type="button"
                              onClick={() => removeCitizenship(idx)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Role in Project */}
                  <div className="mb-4">
                    <label htmlFor="role_in_project" className="block text-sm font-medium text-gray-700 mb-1">
                      <Briefcase className="h-4 w-4 inline mr-1" />
                      Role in Project
                    </label>
                    <select
                      id="role_in_project"
                      name="role_in_project"
                      value={formData.role_in_project}
                      onChange={handleInputChange}
                      className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="">Select role</option>
                      {roleOptions.map(role => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                  </div>

                  {/* Languages */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Languages className="h-4 w-4 inline mr-1" />
                      Languages
                    </label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={newLanguage.language}
                        onChange={(e) => setNewLanguage(prev => ({ ...prev, language: e.target.value }))}
                        placeholder="Language"
                        className="flex-1 appearance-none relative block px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                      <select
                        value={newLanguage.level}
                        onChange={(e) => setNewLanguage(prev => ({ ...prev, level: e.target.value }))}
                        className="px-3 py-2 border border-gray-300 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      >
                        <option value="">Level</option>
                        {languageLevels.map(level => (
                          <option key={level} value={level}>{level}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={addLanguage}
                        className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
                      >
                        Add
                      </button>
                    </div>
                    {formData.languages.length > 0 && (
                      <div className="space-y-1">
                        {formData.languages.map((lang, idx) => (
                          <div key={idx} className="bg-gray-50 px-2 py-1 rounded text-xs flex items-center justify-between">
                            <span className="text-gray-700">
                              {lang.language} - {lang.level}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeLanguage(idx)}
                              className="text-red-600 hover:text-red-800 ml-2"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Participant with Fewer Opportunities */}
                  <div className="mb-4">
                    <label className="flex items-center space-x-2 cursor-pointer mb-2">
                      <input
                        type="checkbox"
                        name="has_fewer_opportunities"
                        checked={formData.has_fewer_opportunities}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Participant with fewer opportunities</span>
                    </label>
                    
                    {formData.has_fewer_opportunities && (
                      <div className="ml-6 mt-2 p-3 bg-gray-50 rounded-lg">
                        <label className="block text-xs font-medium text-gray-700 mb-2">
                          Fewer Opportunities Categories (Select all that apply)
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {fewerOpportunitiesOptions.map(option => (
                            <label key={option} className="flex items-center space-x-1 cursor-pointer">
                              <input
                                type="checkbox"
                                name={`fewer_opp_${option}`}
                                checked={formData.fewer_opportunities_categories.includes(option)}
                                onChange={handleInputChange}
                                className="h-3 w-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                              <span className="text-xs text-gray-700">{option}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Target Groups */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Target Group for Participant (Select all that apply)
                    </label>
                    <div className="grid grid-cols-2 gap-2 p-3 border border-gray-300 rounded-lg bg-gray-50 max-h-40 overflow-y-auto">
                      {targetGroupOptions.map(group => (
                        <label key={group} className="flex items-center space-x-1 cursor-pointer">
                          <input
                            type="checkbox"
                            name={`target_group_${group}`}
                            checked={formData.participant_target_groups.includes(group)}
                            onChange={handleInputChange}
                            className="h-3 w-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-xs text-gray-700">{group}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Organization name for organizations (registration only) */}
            {!isLogin && formData.userType === 'organization' && (
              <div>
                <label htmlFor="organizationName" className="block text-sm font-medium text-gray-700">
                  Organization name
                </label>
                <input
                  id="organizationName"
                  name="organizationName"
                  type="text"
                  required
                  value={formData.organizationName}
                  onChange={handleInputChange}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Your organization name"
                />
              </div>
            )}

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="appearance-none relative block w-full pl-10 pr-10 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder={isLogin ? "Enter your password" : "Create a password"}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password (registration only) */}
            {!isLogin && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm password
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="appearance-none relative block w-full pl-10 pr-10 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Remember me (login only) */}
          {isLogin && (
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                  Forgot your password?
                </a>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  {isLogin ? 'Sign in' : 'Create account'}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

