'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { isAuthorizedAdminSync } from '@/lib/auth-helpers'
import AdminDashboard from '@/components/Admin/AdminDashboard'

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.user) {
        router.push('/login')
        return
      }

      setUser(session.user)

      // Get user profile to check admin status
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (profileError) {
        console.error('Error fetching profile:', profileError)
        router.push('/login')
        return
      }

      setProfile(profileData)
      const adminStatus = isAuthorizedAdminSync(profileData)
      setIsAdmin(adminStatus)

      // Redirect non-admin users away from admin page
      if (!adminStatus) {
        router.push('/')
        return
      }

      setLoading(false)
    }

    getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
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

  if (!user || !profile || !isAdmin) {
    return <div>Redirecting...</div>
  }

  return <AdminDashboard user={user} />
}