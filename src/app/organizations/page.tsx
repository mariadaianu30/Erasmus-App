'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Building, MapPin, Globe, Calendar, Search, Users, Award } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Organization {
  id: string
  organization_name: string
  organization_website: string | null
  location: string | null
  bio: string | null
  website: string | null
  first_name: string | null
  last_name: string | null
  source?: string
  is_verified?: boolean
}

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchOrganizations()
  }, [])

  const fetchOrganizations = async () => {
    try {
      const { data, error } = await supabase
        .from('organization_view')
        .select('*')
        .order('organization_name', { ascending: true })

      if (error) {
        console.log('Organizations query error:', error)
        setOrganizations([])
        return
      }

      // Use verification status from database
      const organizationsWithStatus = (data || []).map(org => ({
        ...org,
        is_verified: org.is_verified || false // Use database value or default to false
      }))

      setOrganizations(organizationsWithStatus)
    } catch (error) {
      console.log('Organizations fetch error (non-critical):', error)
      setOrganizations([])
    } finally {
      setLoading(false)
    }
  }

  const filteredOrganizations = organizations.filter(org => {
    return org.organization_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           (org.bio && org.bio.toLowerCase().includes(searchTerm.toLowerCase())) ||
           (org.location && org.location.toLowerCase().includes(searchTerm.toLowerCase()))
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-20 bg-gray-200 rounded mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Organizations</h1>
          <p className="text-gray-600 mb-8">Discover organizations creating opportunities across Europe</p>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search organizations by name, description, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Organizations Grid */}
        {filteredOrganizations.length === 0 ? (
          <div className="text-center py-12">
            <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No organizations found</h3>
            <p className="text-gray-500">
              {searchTerm 
                ? 'Try adjusting your search criteria'
                : 'No organizations are currently available. Check back soon!'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOrganizations.map((org) => (
              <div key={org.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{org.organization_name}</h3>
                    <div className="flex items-center ml-2">
                      {org.is_verified ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <Award className="h-3 w-3 mr-1" />
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Unverified
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {(org.bio || org.website) && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {org.bio || `Contact: ${org.first_name} ${org.last_name}`}
                    </p>
                  )}
                  
                  <div className="space-y-2 mb-4">
                    {org.location && (
                      <div className="flex items-center text-sm text-gray-500">
                        <MapPin className="h-4 w-4 mr-2" />
                        {org.location}
                      </div>
                    )}
                    {(org.organization_website || org.website) && (
                      <div className="flex items-center text-sm text-gray-500">
                        <Globe className="h-4 w-4 mr-2" />
                        <a 
                          href={(org.organization_website || org.website) || '#'} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 truncate"
                        >
                          {(org.organization_website || org.website)?.replace(/^https?:\/\//, '')}
                        </a>
                      </div>
                    )}
                    {org.first_name && org.last_name && (
                      <div className="flex items-center text-sm text-gray-500">
                        <Users className="h-4 w-4 mr-2" />
                        Contact: {org.first_name} {org.last_name}
                      </div>
                    )}
                  </div>
                  
                  <Link
                    href={`/organizations/${org.organization_name.toLowerCase().replace(/\s+/g, '-')}`}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors text-center block"
                  >
                    View Organization
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Results count */}
        {filteredOrganizations.length > 0 && (
          <div className="text-center mt-8 text-gray-500">
            Showing {filteredOrganizations.length} of {organizations.length} verified organizations
          </div>
        )}
      </div>
    </div>
  )
}
