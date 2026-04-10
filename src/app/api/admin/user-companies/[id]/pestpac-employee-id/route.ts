import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createAdminClient();
    const { pestpac_employee_id } = await request.json();
    const resolvedParams = await params;
    const relationshipId = resolvedParams.id;

    const { error } = await supabase
      .from('user_companies')
      .update({ pestpac_employee_id: pestpac_employee_id ?? null })
      .eq('id', relationshipId);

    if (error) {
      console.error('Error updating PestPac employee ID:', error);
      return NextResponse.json(
        { error: 'Failed to update PestPac employee ID' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in PATCH /api/admin/user-companies/[id]/pestpac-employee-id:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
