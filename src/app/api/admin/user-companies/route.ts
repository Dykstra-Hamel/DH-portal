import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server-admin'

export async function GET() {
  try {
    const supabase = createAdminClient()
    // Load relationships (without joins since foreign key isn't set up)
    const { data: relationshipsData, error: relError } = await supabase
      .from('user_companies')
      .select('*')
      .order('joined_at', { ascending: false })

    if (relError) {
      console.error('Error loading relationships:', relError)
      return NextResponse.json({ error: 'Failed to fetch relationships' }, { status: 500 })
    }

    // Load users from auth.users using admin API
    const { data: authUsers, error: usersError } = await supabase.auth.admin.listUsers()

    if (usersError) {
      console.error('Error loading users:', usersError)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    // Get profiles for users
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('*')

    if (profilesError) {
      console.error('Error loading profiles:', profilesError)
      return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 })
    }

    const usersWithProfiles = authUsers.users?.map(user => ({
      ...user,
      profiles: profilesData?.find(profile => profile.id === user.id)
    })) || []

    // Load companies
    const { data: companiesData, error: companiesError } = await supabase
      .from('companies')
      .select('id, name')
      .order('name')

    if (companiesError) {
      console.error('Error loading companies:', companiesError)
      return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 })
    }

    // Manually join the relationships with profiles and companies
    const relationshipsWithJoins = relationshipsData?.map(rel => ({
      ...rel,
      profiles: profilesData?.find(profile => profile.id === rel.user_id),
      companies: companiesData?.find(company => company.id === rel.company_id)
    })) || []

    return NextResponse.json({
      relationships: relationshipsWithJoins,
      users: usersWithProfiles,
      companies: companiesData || []
    })
  } catch (error) {
    console.error('Error in GET /api/admin/user-companies:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const relationshipData = await request.json()

    const { data, error } = await supabase
      .from('user_companies')
      .insert([relationshipData])
      .select()

    if (error) {
      console.error('Error creating relationship:', error)
      return NextResponse.json({ error: 'Failed to create relationship' }, { status: 500 })
    }

    return NextResponse.json({ success: true, relationship: data?.[0] })
  } catch (error) {
    console.error('Error in POST /api/admin/user-companies:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}