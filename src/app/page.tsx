'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Calendar, Users, ArrowRight, Star, CheckCircle, Globe, Award, TrendingUp } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Stats {
  totalEvents: number
  totalOrganizations: number
  totalParticipants: number
  totalApplications: number
  acceptedApplications: number
  pendingApplications: number
  upcomingEvents: number
}

export default function Home() {
  const [stats, setStats] = useState<Stats>({ 
    totalEvents: 0, 
    totalOrganizations: 0, 
    totalParticipants: 0, 
    totalApplications: 0,
    acceptedApplications: 0,
    pendingApplications: 0,
    upcomingEvents: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Add a small delay to improve initial page load performance
    const timer = setTimeout(() => {
      fetchStats()
    }, 100)
    
    return () => clearTimeout(timer)
  }, [])

  const fetchStats = async () => {
    try {
      console.log('Fetching home page statistics...')
      
      const [
        eventsResult, 
        orgsResult, 
        participantsResult, 
        applicationsResult,
        acceptedAppsResult,
        pendingAppsResult,
        upcomingEventsResult
      ] = await Promise.all([
        // Total published events
        supabase.from('events').select('id', { count: 'exact' }).eq('is_published', true),
        // Total organizations
        supabase.from('profiles').select('id', { count: 'exact' }).eq('user_type', 'organization'),
        // Total participants
        supabase.from('profiles').select('id', { count: 'exact' }).eq('user_type', 'participant'),
        // Total applications
        supabase.from('applications').select('id', { count: 'exact' }),
        // Accepted applications
        supabase.from('applications').select('id', { count: 'exact' }).eq('status', 'accepted'),
        // Pending applications
        supabase.from('applications').select('id', { count: 'exact' }).eq('status', 'pending'),
        // Upcoming events (future dates)
        supabase.from('events').select('id', { count: 'exact' }).eq('is_published', true).gte('start_date', new Date().toISOString())
      ])

      // Log results for debugging
      console.log('Statistics results:', {
        events: eventsResult,
        orgs: orgsResult,
        participants: participantsResult,
        applications: applicationsResult,
        acceptedApps: acceptedAppsResult,
        pendingApps: pendingAppsResult,
        upcomingEvents: upcomingEventsResult
      })

      setStats({
        totalEvents: eventsResult.count || 0,
        totalOrganizations: orgsResult.count || 0,
        totalParticipants: participantsResult.count || 0,
        totalApplications: applicationsResult.count || 0,
        acceptedApplications: acceptedAppsResult.count || 0,
        pendingApplications: pendingAppsResult.count || 0,
        upcomingEvents: upcomingEventsResult.count || 0
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      
      // Set fallback stats if there's an error
      setStats({
        totalEvents: 0,
        totalOrganizations: 0,
        totalParticipants: 0,
        totalApplications: 0,
        acceptedApplications: 0,
        pendingApplications: 0,
        upcomingEvents: 0
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mb-4">
              <span className="inline-block bg-blue-100 text-blue-800 text-sm font-semibold px-3 py-1 rounded-full mb-4">
                by Scout Society
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Erasmus+ Connect
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-3xl mx-auto px-4">
              Connect with verified opportunities, discover amazing events, and manage your applications with ease. 
              Join young people and organizations building meaningful connections across Europe.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth"
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors inline-flex items-center justify-center"
              >
                Join the Community
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href="/events"
                className="border border-blue-600 text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors inline-flex items-center justify-center"
              >
                Browse Opportunities
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Impact</h2>
            <p className="text-lg text-gray-600">Connecting communities across Europe</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {loading ? '...' : stats.upcomingEvents.toLocaleString()}
              </div>
              <div className="text-gray-600">Upcoming Opportunities</div>
              {!loading && stats.totalEvents > 0 && (
                <div className="text-sm text-gray-500 mt-1">
                  {stats.totalEvents} total opportunities
                </div>
              )}
            </div>
            
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-green-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {loading ? '...' : stats.totalParticipants.toLocaleString()}
              </div>
              <div className="text-gray-600">Active Participants</div>
              {!loading && stats.totalApplications > 0 && (
                <div className="text-sm text-gray-500 mt-1">
                  {stats.totalApplications} applications submitted
                </div>
              )}
            </div>
            
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="h-8 w-8 text-purple-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {loading ? '...' : stats.totalOrganizations.toLocaleString()}
              </div>
              <div className="text-gray-600">Verified Organizations</div>
              {!loading && stats.pendingApplications > 0 && (
                <div className="text-sm text-gray-500 mt-1">
                  {stats.pendingApplications} applications under review
                </div>
              )}
            </div>
            
            <div className="text-center">
              <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-orange-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {loading ? '...' : stats.acceptedApplications.toLocaleString()}
              </div>
              <div className="text-gray-600">Accepted Applications</div>
              {!loading && stats.totalApplications > 0 && (
                <div className="text-sm text-gray-500 mt-1">
                  {Math.round((stats.acceptedApplications / stats.totalApplications) * 100)}% acceptance rate
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Erasmus+ Connect?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We're committed to creating meaningful connections through verified opportunities and quality experiences.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="text-center p-6 rounded-lg bg-white border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Verified Opportunities</h3>
              <p className="text-gray-600">
                All opportunities are verified by Scout Society to ensure quality and authenticity. 
                Discover trusted opportunities that match your interests and goals.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center p-6 rounded-lg bg-white border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Globe className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">European Network</h3>
              <p className="text-gray-600">
                Connect with young people and organizations across Europe. 
                Build international friendships and professional networks.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center p-6 rounded-lg bg-white border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Easy Application Management</h3>
              <p className="text-gray-600">
                Track your applications, manage your profile, and stay updated on opportunities. 
                Everything you need in one intuitive platform.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How Erasmus+ Connect Works
            </h2>
            <p className="text-xl text-gray-600">
              Simple steps to join our European community
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* For Participants */}
            <div className="bg-gray-50 p-8 rounded-lg border">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">For Young People</h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="bg-blue-100 w-8 h-8 rounded-full flex items-center justify-center mr-4 mt-1">
                    <span className="text-blue-600 font-semibold text-sm">1</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Join Our Community</h4>
                    <p className="text-gray-600">Create your profile and tell us about your interests and goals.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-blue-100 w-8 h-8 rounded-full flex items-center justify-center mr-4 mt-1">
                    <span className="text-blue-600 font-semibold text-sm">2</span>
                  </div>
                  <div>
                  <h4 className="font-semibold text-gray-900">Discover Opportunities</h4>
                  <p className="text-gray-600">Browse verified opportunities that match your interests.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-blue-100 w-8 h-8 rounded-full flex items-center justify-center mr-4 mt-1">
                    <span className="text-blue-600 font-semibold text-sm">3</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Apply & Grow</h4>
                    <p className="text-gray-600">Submit applications and track your progress in building connections.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* For Organizations */}
            <div className="bg-gray-50 p-8 rounded-lg border">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">For Organizations</h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="bg-green-100 w-8 h-8 rounded-full flex items-center justify-center mr-4 mt-1">
                    <span className="text-green-600 font-semibold text-sm">1</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Get Verified</h4>
                    <p className="text-gray-600">Create your organization profile and get verified by Scout Society.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-green-100 w-8 h-8 rounded-full flex items-center justify-center mr-4 mt-1">
                    <span className="text-green-600 font-semibold text-sm">2</span>
                  </div>
                  <div>
                  <h4 className="font-semibold text-gray-900">Create Opportunities</h4>
                  <p className="text-gray-600">Design and publish opportunities with detailed descriptions and requirements.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-green-100 w-8 h-8 rounded-full flex items-center justify-center mr-4 mt-1">
                    <span className="text-green-600 font-semibold text-sm">3</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Build Your Community</h4>
                    <p className="text-gray-600">Review applications, connect with participants, and grow your network.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Connect?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join the Erasmus+ Connect community and start building meaningful connections across Europe.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth"
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors inline-flex items-center justify-center"
            >
              Join Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              href="/organizations"
              className="border border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors inline-flex items-center justify-center"
            >
              Explore Organizations
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
