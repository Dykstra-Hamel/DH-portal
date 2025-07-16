import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createAdminClient();
    const { id } = await params;
    
    const { data: project, error } = await supabase
      .from('projects')
      .select(`
        *,
        company:companies(
          id,
          name
        )
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching project:', error);
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Get profiles for the users involved in this project
    const userIds = [project.requested_by];
    if (project.assigned_to) {
      userIds.push(project.assigned_to);
    }

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email')
      .in('id', userIds);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return NextResponse.json({ error: 'Failed to fetch user profiles' }, { status: 500 });
    }

    // Create profile map and enhance project
    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
    const enhancedProject = {
      ...project,
      requested_by_profile: profileMap.get(project.requested_by) || null,
      assigned_to_profile: project.assigned_to ? profileMap.get(project.assigned_to) || null : null
    };
    
    return NextResponse.json(enhancedProject);
  } catch (error) {
    console.error('Error in project GET:', error);
    return NextResponse.json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createAdminClient();
    const { id } = await params;
    const body = await request.json();
    
    const {
      name,
      description,
      project_type,
      assigned_to,
      status,
      priority,
      due_date,
      start_date,
      completion_date,
      estimated_hours,
      actual_hours,
      budget_amount,
      tags,
      notes,
      primary_file_path
    } = body;
    
    // Validate required fields
    if (!name || !project_type || !due_date) {
      return NextResponse.json({ 
        error: 'Missing required fields: name, project_type, due_date' 
      }, { status: 400 });
    }
    
    const { data: project, error } = await supabase
      .from('projects')
      .update({
        name,
        description,
        project_type,
        assigned_to: assigned_to || null,
        status,
        priority,
        due_date,
        start_date: start_date || null,
        completion_date: completion_date || null,
        estimated_hours,
        actual_hours,
        budget_amount,
        tags,
        notes,
        primary_file_path: primary_file_path || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        company:companies(
          id,
          name
        )
      `)
      .single();
    
    if (error) {
      console.error('Error updating project:', error);
      return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
    }

    // Get profiles for the users involved in this project
    const userIds = [project.requested_by];
    if (project.assigned_to) {
      userIds.push(project.assigned_to);
    }

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email')
      .in('id', userIds);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return NextResponse.json({ error: 'Failed to fetch user profiles' }, { status: 500 });
    }

    // Create profile map and enhance project
    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
    const enhancedProject = {
      ...project,
      requested_by_profile: profileMap.get(project.requested_by) || null,
      assigned_to_profile: project.assigned_to ? profileMap.get(project.assigned_to) || null : null
    };
    
    return NextResponse.json(enhancedProject);
  } catch (error) {
    console.error('Error in project PUT:', error);
    return NextResponse.json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createAdminClient();
    const { id } = await params;
    
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting project:', error);
      return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
    }
    
    return NextResponse.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error in project DELETE:', error);
    return NextResponse.json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}