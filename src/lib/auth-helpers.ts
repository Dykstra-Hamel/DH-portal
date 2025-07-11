import { NextRequest } from 'next/server'
import { supabase } from './supabase'

export async function verifyAuth(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { user: null, error: 'Missing or invalid authorization header' }
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      return { user: null, error: 'Invalid or expired token' }
    }

    return { user, error: null }
  } catch (error) {
    return { user: null, error: 'Authentication failed' }
  }
}

// For now, we'll allow any authenticated user to access admin routes
// In production, you might want to check for specific roles/permissions
export function isAuthorizedAdmin(user: any): boolean {
  return !!user // For now, any authenticated user can be admin
  // In production, you might check:
  // return user?.user_metadata?.role === 'admin' || user?.email?.endsWith('@yourdomain.com')
}