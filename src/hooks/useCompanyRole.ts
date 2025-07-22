'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface UserCompany {
  id: string
  user_id: string
  company_id: string
  role: string
  is_primary: boolean
  companies: {
    id: string
    name: string
  }
}

interface UseCompanyRoleReturn {
  role: string | null
  isCompanyAdmin: boolean
  isLoading: boolean
  error: string | null
  userCompanies: UserCompany[]
  refetch: () => Promise<void>
}

export function useCompanyRole(companyId?: string): UseCompanyRoleReturn {
  const [role, setRole] = useState<string | null>(null)
  const [userCompanies, setUserCompanies] = useState<UserCompany[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUserCompanies = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const supabase = createClient()
      
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        setError('Not authenticated')
        setRole(null)
        setUserCompanies([])
        return
      }

      // Fetch user's company associations
      const { data: companies, error: companiesError } = await supabase
        .from('user_companies')
        .select(`
          *,
          companies (
            id,
            name
          )
        `)
        .eq('user_id', user.id)

      if (companiesError) {
        console.error('Error fetching user companies:', companiesError)
        setError('Failed to fetch company information')
        return
      }

      setUserCompanies(companies || [])

      // Find role for specific company if provided
      if (companyId) {
        const userCompany = companies?.find(uc => uc.company_id === companyId)
        setRole(userCompany?.role || null)
      } else {
        // If no specific company, set role to null
        setRole(null)
      }
    } catch (err) {
      console.error('Error in useCompanyRole:', err)
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUserCompanies()
  }, [companyId])

  const isCompanyAdmin = role ? ['admin', 'manager', 'owner'].includes(role) : false

  return {
    role,
    isCompanyAdmin,
    isLoading,
    error,
    userCompanies,
    refetch: fetchUserCompanies
  }
}

// Helper hook to check if user is admin for any company
export function useIsCompanyAdminAny(): { 
  isAdminForAnyCompany: boolean
  isLoading: boolean
  error: string | null
  adminCompanies: UserCompany[]
} {
  const { userCompanies, isLoading, error } = useCompanyRole()
  
  const adminCompanies = userCompanies.filter(uc => 
    ['admin', 'manager', 'owner'].includes(uc.role)
  )
  
  return {
    isAdminForAnyCompany: adminCompanies.length > 0,
    isLoading,
    error,
    adminCompanies
  }
}

// Helper hook to get user role for currently selected company
export function useCurrentCompanyRole(selectedCompany: { id: string } | null): UseCompanyRoleReturn {
  return useCompanyRole(selectedCompany?.id)
}