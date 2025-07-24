import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST file upload directly to Retell AI
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

    const formData = await request.formData()
    const file = formData.get('knowledge_base_files') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file size (50MB limit)
    if (file.size > 52428800) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 50MB.' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/csv',
      'text/markdown',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/epub+zip',
      'text/html',
      'application/rtf',
      'text/xml',
      'application/xml'
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Supported types: PDF, DOC, DOCX, TXT, CSV, MD, XLS, XLSX, EPUB, HTML, RTF, XML' },
        { status: 400 }
      )
    }

    // Sanitize filename to prevent path traversal and injection attacks
    const sanitizedFilename = file.name
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/_{2,}/g, '_')
      .slice(0, 255)
    
    if (!sanitizedFilename) {
      return NextResponse.json(
        { error: 'Invalid filename' },
        { status: 400 }
      )
    }

    // Create FormData for Retell AI
    const retellFormData = new FormData()
    retellFormData.append('knowledge_base_files', file)

    // Upload directly to Retell AI
    const response = await fetch(`https://api.retellai.com/add-knowledge-base-sources/${kbSetting.setting_value}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKeySetting.setting_value}`,
      },
      body: retellFormData
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Retell AI API error:', errorText)
      // Don't expose detailed API errors to client for security
      return NextResponse.json(
        { error: 'Failed to upload file to Retell AI. Please check your configuration and try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      message: 'File uploaded to Retell AI successfully' 
    })
  } catch (error) {
    console.error('Error in file upload:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}