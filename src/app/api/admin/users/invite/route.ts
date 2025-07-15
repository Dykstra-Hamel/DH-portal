import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server-admin'
import { verifyAuth, isAuthorizedAdmin } from '@/lib/auth-helpers'
import { validateUserInput, sanitizeString, validateUUID } from '@/lib/validation'

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const { user, error: authError } = await verifyAuth(request)
    if (authError || !user || !(await isAuthorizedAdmin(user))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()
    const body = await request.json()
    
    // Validate and sanitize input
    const userData = {
      email: sanitizeString(body.email || ''),
      first_name: sanitizeString(body.first_name || ''),
      last_name: sanitizeString(body.last_name || ''),
      company_id: sanitizeString(body.company_id || ''),
      role: sanitizeString(body.role || 'member')
    }

    // Validate required fields
    const validation = validateUserInput({
      email: userData.email,
      first_name: userData.first_name,
      last_name: userData.last_name
    })
    
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.errors.join(', ') }, { status: 400 })
    }

    if (!userData.company_id || !validateUUID(userData.company_id)) {
      return NextResponse.json({ error: 'Valid company ID is required' }, { status: 400 })
    }

    // Verify company exists
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, name')
      .eq('id', userData.company_id)
      .single()

    if (companyError || !company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 400 })
    }

    // Send invitation using Supabase auth admin
    const { data, error } = await supabase.auth.admin.inviteUserByEmail(
      userData.email,
      {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
        data: {
          first_name: userData.first_name,
          last_name: userData.last_name,
          company_id: userData.company_id,
          company_name: company.name,
          role: userData.role
        }
      }
    )

    if (error) {
      console.error('Error sending invitation:', error)
      return NextResponse.json({ error: 'Failed to send invitation' }, { status: 500 })
    }

    // If user was successfully invited, create a profile and company relationship
    if (data.user) {
      // Create profile
      await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          first_name: userData.first_name,
          last_name: userData.last_name,
          email: userData.email
        })

      // Create user-company relationship
      await supabase
        .from('user_companies')
        .insert({
          user_id: data.user.id,
          company_id: userData.company_id,
          role: userData.role,
          is_primary: true // First company is primary
        })
    }

    return NextResponse.json({ 
      success: true, 
      message: `Invitation sent to ${userData.email}`,
      user: data.user ? { 
        id: data.user.id, 
        email: data.user.email,
        company: company.name,
        role: userData.role
      } : null 
    })
  } catch (error) {
    console.error('Error in POST /api/admin/users/invite:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}