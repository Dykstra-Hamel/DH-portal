import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const featured = searchParams.get('featured');
    const search = searchParams.get('search');
    const industry = searchParams.get('industry');
    const pestType = searchParams.get('pestType');

    // Build query for active public templates
    let query = supabase
      .from('email_template_library')
      .select(`
        id,
        name,
        description,
        template_category,
        industry_tags,
        pest_type_tags,
        subject_line,
        variables,
        is_featured,
        usage_count,
        performance_score,
        created_at,
        updated_at
      `)
      .eq('is_active', true)
      .order('is_featured', { ascending: false })
      .order('usage_count', { ascending: false });

    // Apply filters
    if (category && category !== 'all') {
      query = query.eq('template_category', category);
    }

    if (featured === 'true') {
      query = query.eq('is_featured', true);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (industry) {
      query = query.contains('industry_tags', [industry]);
    }

    if (pestType) {
      query = query.contains('pest_type_tags', [pestType]);
    }

    const { data: templates, error } = await query;

    if (error) {
      return NextResponse.json({ 
        error: 'Failed to fetch public templates' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      templates: templates || [],
      total: templates?.length || 0
    });

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}