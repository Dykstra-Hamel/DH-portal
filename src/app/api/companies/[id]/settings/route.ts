import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET company settings
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Get the current user from the session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has access to this company
    const { data: userCompany, error: userCompanyError } = await supabase
      .from('user_companies')
      .select('role')
      .eq('user_id', user.id)
      .eq('company_id', id)
      .single()

    // Also check if user is global admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isGlobalAdmin = profile?.role === 'admin'
    const hasCompanyAccess = userCompany && !userCompanyError

    if (!isGlobalAdmin && !hasCompanyAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Fetch company settings
    const { data: settings, error: settingsError } = await supabase
      .from('company_settings')
      .select('*')
      .eq('company_id', id)
      .order('setting_key')

    if (settingsError) {
      console.error('Error fetching company settings:', settingsError)
      return NextResponse.json(
        { error: 'Failed to fetch settings' },
        { status: 500 }
      )
    }

    // Convert settings array to key-value object for easier frontend use
    const settingsObject: { [key: string]: any } = {}
    settings?.forEach(setting => {
      let value = setting.setting_value
      
      // Convert values based on type
      if (setting.setting_type === 'boolean') {
        value = value === 'true'
      } else if (setting.setting_type === 'number') {
        value = parseFloat(value) || 0
      } else if (setting.setting_type === 'json') {
        try {
          value = JSON.parse(value)
        } catch {
          value = null
        }
      }
      
      settingsObject[setting.setting_key] = {
        value,
        type: setting.setting_type,
        description: setting.description
      }
    })

    return NextResponse.json({ settings: settingsObject })
  } catch (error) {
    console.error('Error in company settings GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT/PATCH company settings
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Get the current user from the session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has admin access to this company
    const { data: userCompany, error: userCompanyError } = await supabase
      .from('user_companies')
      .select('role')
      .eq('user_id', user.id)
      .eq('company_id', id)
      .single()

    // Also check if user is global admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isGlobalAdmin = profile?.role === 'admin'
    const isCompanyAdmin = userCompany && ['admin', 'manager', 'owner'].includes(userCompany.role)

    if (!isGlobalAdmin && !isCompanyAdmin) {
      return NextResponse.json({ 
        error: 'Access denied. Company admin privileges required.' 
      }, { status: 403 })
    }

    const { settings } = await request.json()

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { error: 'Invalid settings data' },
        { status: 400 }
      )
    }

    // Update each setting
    const updatePromises = Object.entries(settings).map(async ([key, data]: [string, any]) => {
      const settingData = data as { value: any; type?: string }
      let stringValue = String(settingData.value)

      // Handle different data types
      if (settingData.type === 'boolean') {
        stringValue = Boolean(settingData.value).toString()
      } else if (settingData.type === 'json') {
        stringValue = JSON.stringify(settingData.value)
      }

      // Upsert the setting
      const { error } = await supabase
        .from('company_settings')
        .upsert({
          company_id: id,
          setting_key: key,
          setting_value: stringValue,
          setting_type: settingData.type || 'string',
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'company_id,setting_key'
        })

      if (error) {
        console.error(`Error updating setting ${key}:`, error)
        throw error
      }
    })

    await Promise.all(updatePromises)

    return NextResponse.json({ 
      success: true,
      message: 'Settings updated successfully' 
    })
  } catch (error) {
    console.error('Error in company settings PUT:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}