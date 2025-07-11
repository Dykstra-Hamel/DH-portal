import { NextRequest } from 'next/server'
import { supabaseAdmin } from './supabase-admin'

export async function verifyAuth(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { user: null, error: 'Missing or invalid authorization header' }
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Try to verify with admin client first (more reliable for API routes)
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)

    if (error || !user) {
      return { user: null, error: 'Invalid or expired token' }
    }

    return { user, error: null }
  } catch (error) {
    return { user: null, error: 'Authentication failed' }
  }
}

// Check if user has admin role
export async function isAuthorizedAdmin(user: any): Promise<boolean> {
  if (!user) return false
  
  // Check if user has admin role in their profile using admin client
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
    
  return profile?.role === 'admin'
}

// Synchronous version for cases where we already have the profile
export function isAuthorizedAdminSync(profile: any): boolean {
  return profile?.role === 'admin'
}