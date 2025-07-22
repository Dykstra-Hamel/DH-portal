'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { adminAPI } from '@/lib/api-client'
import Dashboard from '@/components/Dashboard/Dashboard'

interface Profile {
  id: string
  first_name: string
  last_name: string
  email: string
  role?: string
}

interface Company {
  id: string
  name: string
}

interface UserCompany {
  id: string
  user_id: string
  company_id: string
  role: string
  is_primary: boolean
  companies: Company
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [userCompanies, setUserCompanies] = useState<UserCompany[]>([])
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    
    const getSessionAndData = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.user) {
        router.push('/login')
        return
      }

      setUser(session.user)

      // Get user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (!profileError && profileData) {
        setProfile(profileData)
      }

      // Check if user is admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

      const isAdmin = profile?.role === 'admin'

      if (isAdmin) {
        // Admin users can see all companies
        try {
          const allCompanies = await adminAPI.getCompanies()
          const companiesData = allCompanies.map((company: any) => ({
            companies: company,
            is_primary: false
          }))
          setUserCompanies(companiesData)
          
          // Set first company as selected for admin
          if (companiesData.length > 0) {
            setSelectedCompany(companiesData[0].companies)
          }
        } catch (error) {
          console.error('Error fetching companies for admin:', error)
        }
      } else {
        // Regular users only see their associated companies
        const { data: companiesData, error: companiesError } = await supabase
          .from('user_companies')
          .select(`
            *,
            companies (
              id,
              name
            )
          `)
          .eq('user_id', session.user.id)

        if (!companiesError && companiesData) {
          setUserCompanies(companiesData)
          
          // Set primary company as selected, or first company if no primary
          const primaryCompany = companiesData.find(uc => uc.is_primary)
          if (primaryCompany) {
            setSelectedCompany(primaryCompany.companies)
          } else if (companiesData.length > 0) {
            setSelectedCompany(companiesData[0].companies)
          }
        }
      }

      setLoading(false)
    }

    getSessionAndData()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_, session) => {
        if (!session?.user) {
          router.push('/login')
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [router])

  if (loading) {
    return <div>Loading...</div>
  }

  if (!user || !profile) {
    return <div>Redirecting...</div>
  }

  return (
    <Dashboard
      user={user}
      profile={profile}
      userCompanies={userCompanies}
      selectedCompany={selectedCompany}
      onCompanyChange={setSelectedCompany}
    />
  )
}