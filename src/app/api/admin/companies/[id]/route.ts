import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, isAuthorizedAdmin } from '@/lib/auth-helpers';
import { createAdminClient } from '@/lib/supabase/server-admin';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication and admin authorization
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user || !(await isAuthorizedAdmin(user))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();
    const companyData = await request.json();
    const resolvedParams = await params;
    const companyId = resolvedParams.id;

    // If slug is being updated, check for uniqueness
    if (companyData.slug) {
      const { data: existingCompany } = await supabase
        .from('companies')
        .select('id')
        .eq('slug', companyData.slug.trim())
        .neq('id', companyId)
        .single();

      if (existingCompany) {
        return NextResponse.json(
          { error: 'Slug already in use by another company' },
          { status: 400 }
        );
      }
    }

    // Sanitize and prepare data - handle website array format
    const sanitizedData = {
      ...companyData
    };

    // Handle website as either array (new format) or string (backward compatibility)
    if (sanitizedData.website !== undefined) {
      if (Array.isArray(sanitizedData.website)) {
        sanitizedData.website = sanitizedData.website
          .filter((url: string) => url && typeof url === 'string' && url.trim().length > 0)
          .map((url: string) => url.trim().replace(/\/+$/, '')); // Strip trailing slashes
      } else if (typeof sanitizedData.website === 'string') {
        sanitizedData.website = sanitizedData.website.trim() ? [sanitizedData.website.trim().replace(/\/+$/, '')] : []; // Strip trailing slashes
      } else {
        sanitizedData.website = [];
      }
    }

    const { error } = await supabase
      .from('companies')
      .update(sanitizedData)
      .eq('id', companyId);

    if (error) {
      console.error('Error updating company:', error);
      return NextResponse.json(
        { error: 'Failed to update company' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in PUT /api/admin/companies/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication and admin authorization
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user || !(await isAuthorizedAdmin(user))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();
    const resolvedParams = await params;
    const companyId = resolvedParams.id;

    const { error } = await supabase
      .from('companies')
      .delete()
      .eq('id', companyId);

    if (error) {
      console.error('Error deleting company:', error);
      return NextResponse.json(
        { error: 'Failed to delete company' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/admin/companies/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
