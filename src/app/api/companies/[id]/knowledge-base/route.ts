import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RetellKnowledgeBaseSource {
  type: string
  source_id: string
  filename?: string
  file_url?: string
  text_content?: string
  url?: string
}

interface RetellKnowledgeBaseResponse {
  knowledge_base_id: string
  knowledge_base_name: string
  status: string
  knowledge_base_sources: RetellKnowledgeBaseSource[]
  enable_auto_refresh: boolean
  last_refreshed_timestamp?: number
}

// GET knowledge base settings and Retell AI items
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

    // Get Retell AI settings
    const { data: settings, error: settingsError } = await supabase
      .from('company_settings')
      .select('setting_key, setting_value, setting_type')
      .eq('company_id', id)
      .in('setting_key', ['retell_api_key', 'retell_knowledge_base_id'])

    const settingsObject: { [key: string]: any } = {}
    settings?.forEach(setting => {
      settingsObject[setting.setting_key] = setting.setting_value
    })

    return NextResponse.json({ 
      settings: settingsObject
    })
  } catch (error) {
    console.error('Error in knowledge base GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST new knowledge base item directly to Retell AI
export async function POST(
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

    // Get Retell API credentials
    const { data: apiKeySetting } = await supabase
      .from('company_settings')
      .select('setting_value')
      .eq('company_id', id)
      .eq('setting_key', 'retell_api_key')
      .single()

    const { data: kbSetting } = await supabase
      .from('company_settings')
      .select('setting_value')
      .eq('company_id', id)
      .eq('setting_key', 'retell_knowledge_base_id')
      .single()

    if (!apiKeySetting?.setting_value || !kbSetting?.setting_value) {
      return NextResponse.json(
        { error: 'Retell AI credentials not configured for this company' },
        { status: 400 }
      )
    }

    const itemData = await request.json()

    // Validate required fields
    if (!itemData.type || !itemData.name || !itemData.content) {
      return NextResponse.json(
        { error: 'Missing required fields: type, name, content' },
        { status: 400 }
      )
    }

    // Validate type
    if (!['url', 'file', 'text'].includes(itemData.type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be url, file, or text' },
        { status: 400 }
      )
    }

    // Sanitize and validate input lengths
    const name = String(itemData.name).trim().slice(0, 255)
    const content = String(itemData.content).trim().slice(0, 10000)
    
    if (!name || !content) {
      return NextResponse.json(
        { error: 'Name and content cannot be empty after sanitization' },
        { status: 400 }
      )
    }

    // Validate URL if type is url
    if (itemData.type === 'url') {
      try {
        const url = new URL(content)
        // Only allow HTTP and HTTPS protocols for security
        if (!['http:', 'https:'].includes(url.protocol)) {
          return NextResponse.json(
            { error: 'Only HTTP and HTTPS URLs are allowed' },
            { status: 400 }
          )
        }
      } catch {
        return NextResponse.json(
          { error: 'Invalid URL format' },
          { status: 400 }
        )
      }
    }

    // Add item directly to Retell AI
    const formData = new FormData()
    
    if (itemData.type === 'url') {
      formData.append('knowledge_base_urls', JSON.stringify([content]))
    } else if (itemData.type === 'text') {
      formData.append('knowledge_base_texts', JSON.stringify([{
        text: content,
        title: name
      }]))
    } else if (itemData.type === 'file') {
      // For file uploads, this should be handled by the upload endpoint
      return NextResponse.json(
        { error: 'File uploads should use the /upload endpoint' },
        { status: 400 }
      )
    }

    const response = await fetch(`https://api.retellai.com/add-knowledge-base-sources/${kbSetting.setting_value}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKeySetting.setting_value}`,
      },
      body: formData
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Retell AI API error:', errorText)
      // Don't expose detailed API errors to client for security
      return NextResponse.json(
        { error: 'Failed to add item to Retell AI. Please check your configuration and try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      message: 'Item added to Retell AI successfully' 
    })
  } catch (error) {
    console.error('Error in knowledge base POST:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE knowledge base item from Retell AI
export async function DELETE(
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

    const { searchParams } = new URL(request.url)
    const sourceId = searchParams.get('sourceId')

    if (!sourceId) {
      return NextResponse.json(
        { error: 'Source ID is required' },
        { status: 400 }
      )
    }

    // Get Retell API credentials
    const { data: apiKeySetting } = await supabase
      .from('company_settings')
      .select('setting_value')
      .eq('company_id', id)
      .eq('setting_key', 'retell_api_key')
      .single()

    const { data: kbSetting } = await supabase
      .from('company_settings')
      .select('setting_value')
      .eq('company_id', id)
      .eq('setting_key', 'retell_knowledge_base_id')
      .single()

    if (!apiKeySetting?.setting_value || !kbSetting?.setting_value) {
      return NextResponse.json(
        { error: 'Retell AI credentials not configured for this company' },
        { status: 400 }
      )
    }

    // Delete from Retell AI
    const response = await fetch(
      `https://api.retellai.com/delete-knowledge-base-source/${kbSetting.setting_value}/source/${sourceId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${apiKeySetting.setting_value}`,
        }
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Retell AI API error:', errorText)
      // Don't expose detailed API errors to client for security
      return NextResponse.json(
        { error: 'Failed to delete item from Retell AI. Please check your configuration and try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      message: 'Item deleted from Retell AI successfully' 
    })
  } catch (error) {
    console.error('Error in knowledge base DELETE:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}