import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RetellKnowledgeBaseSource {
  type: string
  source_id: string
  filename?: string
  file_url?: string
  text_content?: string
  title?: string
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

// GET knowledge base items from Retell AI
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

    // Get company-specific Retell API key
    const { data: apiKeySetting, error: apiKeyError } = await supabase
      .from('company_settings')
      .select('setting_value')
      .eq('company_id', id)
      .eq('setting_key', 'retell_api_key')
      .single()

    if (apiKeyError || !apiKeySetting?.setting_value) {
      return NextResponse.json(
        { error: 'Retell AI API key not configured for this company' },
        { status: 400 }
      )
    }

    // Get knowledge base ID
    const { data: kbSetting, error: kbError } = await supabase
      .from('company_settings')
      .select('setting_value')
      .eq('company_id', id)
      .eq('setting_key', 'retell_knowledge_base_id')
      .single()

    if (kbError || !kbSetting?.setting_value) {
      return NextResponse.json(
        { error: 'Retell AI Knowledge Base ID not configured for this company' },
        { status: 400 }
      )
    }

    const retellApiKey = apiKeySetting.setting_value
    const knowledgeBaseId = kbSetting.setting_value

    // Fetch knowledge base from Retell AI
    const response = await fetch(`https://api.retellai.com/get-knowledge-base/${knowledgeBaseId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${retellApiKey}`,
        'Content-Type': 'application/json',
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Retell AI API error:', errorText)
      return NextResponse.json(
        { error: 'Failed to fetch knowledge base from Retell AI' },
        { status: 500 }
      )
    }

    const kbData: RetellKnowledgeBaseResponse = await response.json()
    const sources = kbData.knowledge_base_sources || []

    // Transform Retell AI sources to our format
    const items = sources.map((source, index) => {
      let type: 'url' | 'file' | 'text' = 'text'
      let name = `Item ${index + 1}`
      let content = ''

      // Check if it's a URL
      if (source.type === 'url' && source.url) {
        type = 'url'
        name = new URL(source.url).hostname
        content = source.url
      }
      // Check if it's a file (either explicitly marked as file, or has a filename)
      else if (source.type === 'file' || source.filename) {
        type = 'file'
        name = source.filename || `File ${index + 1}`
        // For files, store the filename as content for display purposes
        content = source.filename || source.file_url || ''
      }
      // Check if it's text content
      else if (source.type === 'text' && source.text_content && !source.filename) {
        type = 'text'
        name = source.title || `Text Snippet ${index + 1}`
        content = source.text_content || ''
      }
      // Fallback: if it has a filename, it's probably a file
      else if (source.filename) {
        type = 'file'
        name = source.filename
        content = source.file_url || source.filename
      }
      // Final fallback: treat as text
      else {
        type = 'text'
        name = source.title || `Text Snippet ${index + 1}`
        content = source.text_content || ''
      }

      return {
        id: source.source_id,
        type,
        name,
        content,
        source_id: source.source_id
      }
    })

    return NextResponse.json({ 
      items,
      knowledge_base_id: knowledgeBaseId,
      knowledge_base_name: kbData.knowledge_base_name,
      status: kbData.status,
      total_sources: sources.length,
      stats: {
        urls: items.filter(item => item.type === 'url').length,
        files: items.filter(item => item.type === 'file').length,
        texts: items.filter(item => item.type === 'text').length,
        total: items.length
      }
    })
  } catch (error) {
    console.error('Error fetching Retell AI knowledge base:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}