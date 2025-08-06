import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { createClient } from '@/lib/supabase/server';

interface UpdateDomainsRequest {
  domains: string[];
}

// Get current global widget domains
export async function GET() {
  try {
    // Check authentication first
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - authentication required' },
        { status: 401 }
      );
    }
    
    // Use admin client for database operations
    const adminSupabase = createAdminClient();

    // Ensure the setting exists first - only insert if it doesn't exist
    const { error: insertError } = await adminSupabase
      .from('system_settings')
      .insert({
        key: 'widget_allowed_domains',
        value: [],
        description: 'Global whitelist of domains allowed to embed widgets. Any domain in this list can embed widgets for any company.'
      })
      .select()
      .single();
    
    // Ignore duplicate key error - that means the row already exists
    if (insertError && !insertError.message.includes('duplicate key')) {
      console.error('Failed to ensure widget_allowed_domains exists:', insertError);
    }

    const { data: settings, error } = await adminSupabase
      .from('system_settings')
      .select('value, updated_at')
      .eq('key', 'widget_allowed_domains')
      .single();

    if (error) {
      console.error('Error fetching widget domains:', error);
      return NextResponse.json(
        { error: 'Failed to fetch domains' },
        { status: 500 }
      );
    }

    const domains = settings?.value ? (Array.isArray(settings.value) ? settings.value : JSON.parse(settings.value)) : [];

    return NextResponse.json({
      success: true,
      domains: domains.filter(Boolean),
      lastUpdated: settings?.updated_at
    });
  } catch (error) {
    console.error('Error in widget domains GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update global widget domains
export async function POST(request: NextRequest) {
  try {
    // Check authentication first
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - authentication required' },
        { status: 401 }
      );
    }
    
    const { domains }: UpdateDomainsRequest = await request.json();

    if (!Array.isArray(domains)) {
      return NextResponse.json(
        { error: 'Domains must be an array' },
        { status: 400 }
      );
    }

    // Validate each domain
    const validatedDomains: string[] = [];
    const errors: string[] = [];

    for (const domain of domains) {
      const trimmed = domain.trim();
      if (!trimmed) continue;

      // Basic URL validation
      try {
        const url = new URL(trimmed);
        if (url.protocol !== 'http:' && url.protocol !== 'https:') {
          errors.push(`Invalid protocol for ${trimmed} - must be http or https`);
          continue;
        }
        validatedDomains.push(trimmed.toLowerCase());
      } catch (e) {
        errors.push(`Invalid URL format: ${trimmed}`);
      }
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { error: 'Validation errors', details: errors },
        { status: 400 }
      );
    }

    // Remove duplicates
    const uniqueDomains = [...new Set(validatedDomains)];

    const adminSupabase = createAdminClient();
    
    const { data, error } = await adminSupabase
      .from('system_settings')
      .update({
        value: uniqueDomains,
        updated_at: new Date().toISOString()
      })
      .eq('key', 'widget_allowed_domains')
      .select();


    if (error) {
      console.error('Error updating widget domains:', error);
      return NextResponse.json(
        { error: 'Failed to update domains' },
        { status: 500 }
      );
    }

    // No caching - changes take effect immediately

    return NextResponse.json({
      success: true,
      domains: uniqueDomains,
      message: `Updated widget domain whitelist with ${uniqueDomains.length} domains`
    });
  } catch (error) {
    console.error('Error in widget domains POST:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}