import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createAdminClient();
    const { role, is_primary } = await request.json();
    const resolvedParams = await params;
    const relationshipId = resolvedParams.id;

    const { error } = await supabase
      .from('user_companies')
      .update({ role, is_primary })
      .eq('id', relationshipId);

    if (error) {
      console.error('Error updating relationship:', error);
      return NextResponse.json(
        { error: 'Failed to update relationship' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in PUT /api/admin/user-companies/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createAdminClient();
    const resolvedParams = await params;
    const relationshipId = resolvedParams.id;

    const { error } = await supabase
      .from('user_companies')
      .delete()
      .eq('id', relationshipId);

    if (error) {
      console.error('Error deleting relationship:', error);
      return NextResponse.json(
        { error: 'Failed to delete relationship' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/admin/user-companies/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
