import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isAuthorizedAdmin } from '@/lib/auth-helpers';

// PUT /api/admin/project-categories/[id]/subtypes/[subtypeId] - Update a subtype
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; subtypeId: string }> }
) {
  try {
    const { subtypeId } = await params;
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

    // Parse request body
    const body = await request.json();
    const { name, description, sort_order } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (sort_order !== undefined) updateData.sort_order = sort_order;

    // Update subtype
    const { data: subtype, error } = await supabase
      .from('category_subtypes')
      .update(updateData)
      .eq('id', subtypeId)
      .select()
      .single();

    if (error) {
      console.error('Error updating subtype:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(subtype);
  } catch (error) {
    console.error('Error in PUT /api/admin/project-categories/[id]/subtypes/[subtypeId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/project-categories/[id]/subtypes/[subtypeId] - Delete a subtype
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; subtypeId: string }> }
) {
  try {
    const { subtypeId } = await params;
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

    // Delete subtype
    const { error } = await supabase
      .from('category_subtypes')
      .delete()
      .eq('id', subtypeId);

    if (error) {
      console.error('Error deleting subtype:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/admin/project-categories/[id]/subtypes/[subtypeId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
