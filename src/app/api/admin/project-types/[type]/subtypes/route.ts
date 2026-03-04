import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isAuthorizedAdmin } from '@/lib/auth-helpers';

// GET /api/admin/project-types/[type]/subtypes - Get subtypes for a project type
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const { type: projectType } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin authorization
    const adminAuthorized = await isAuthorizedAdmin(user);
    if (!adminAuthorized) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Validate project type
    const validTypes = ['WEB', 'SOC', 'EML', 'PRT', 'VEH', 'DIG', 'ADS', 'CAM', 'SFT'];
    if (!validTypes.includes(projectType.toUpperCase())) {
      return NextResponse.json({ error: 'Invalid project type' }, { status: 400 });
    }

    // Fetch subtypes for this project type
    const { data: subtypes, error } = await supabase
      .from('project_type_subtypes')
      .select('*')
      .eq('project_type', projectType.toUpperCase())
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching subtypes:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(subtypes || []);
  } catch (error) {
    console.error('Error in GET /api/admin/project-types/[type]/subtypes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/project-types/[type]/subtypes - Create a new subtype
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const { type: projectType } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin authorization
    const adminAuthorized = await isAuthorizedAdmin(user);
    if (!adminAuthorized) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Validate project type
    const validTypes = ['WEB', 'SOC', 'EML', 'PRT', 'VEH', 'DIG', 'ADS', 'CAM', 'SFT'];
    if (!validTypes.includes(projectType.toUpperCase())) {
      return NextResponse.json({ error: 'Invalid project type' }, { status: 400 });
    }

    // Parse request body
    const body = await request.json();
    const { name, description, sort_order } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Insert new subtype
    const { data: subtype, error } = await supabase
      .from('project_type_subtypes')
      .insert({
        project_type: projectType.toUpperCase(),
        name,
        description: description || null,
        sort_order: sort_order || 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating subtype:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(subtype, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/admin/project-types/[type]/subtypes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
