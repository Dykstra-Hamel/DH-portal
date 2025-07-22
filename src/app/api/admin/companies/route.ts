import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth, isAuthorizedAdmin } from '@/lib/auth-helpers'
import { createAdminClient } from '@/lib/supabase/server-admin'

export async function GET(request: NextRequest) {
  try {
    // Verify authentication and admin authorization
    const { user, error: authError } = await verifyAuth(request)
    if (authError || !user || !(await isAuthorizedAdmin(user))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading companies:', error)
      return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Error in GET /api/admin/companies:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication and admin authorization
    const { user, error: authError } = await verifyAuth(request)
    if (authError || !user || !(await isAuthorizedAdmin(user))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()
    const companyData = await request.json()

    const { data, error } = await supabase
      .from('companies')
      .insert([companyData])
      .select()

    if (error) {
      console.error('Error creating company:', error)
      return NextResponse.json({ error: 'Failed to create company' }, { status: 500 })
    }

    return NextResponse.json({ success: true, company: data?.[0] })
  } catch (error) {
    console.error('Error in POST /api/admin/companies:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}