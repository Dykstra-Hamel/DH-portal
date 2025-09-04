import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server-admin';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: companyId } = await params;
    const supabase = await createClient();

    // Check if user is authenticated
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has access to this company
    const { data: userCompany, error: accessError } = await supabase
      .from('user_companies')
      .select('company_id, role')
      .eq('user_id', user.id)
      .eq('company_id', companyId)
      .single();

    // Also check if user is global admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isGlobalAdmin = profile?.role === 'admin';
    const hasCompanyAccess = userCompany && !accessError;

    if (!isGlobalAdmin && !hasCompanyAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type (images only)
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size must be less than 10MB' }, { status: 400 });
    }

    // Get company name for folder structure
    const { data: company } = await supabase
      .from('companies')
      .select('name')
      .eq('id', companyId)
      .single();

    // Create clean filename with timestamp
    const fileExt = file.name.split('.').pop();
    const timestamp = Date.now();
    const finalFileName = `logo-override_${timestamp}.${fileExt}`;

    // Create company-specific path in brand-assets bucket
    const cleanCompanyName = (company?.name || 'company')
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    const filePath = `${cleanCompanyName}/email-logos/${finalFileName}`;

    // Upload file to storage
    const { error: uploadError } = await supabase.storage
      .from('brand-assets')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('brand-assets')
      .getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      path: filePath,
      message: 'Logo override uploaded successfully'
    });

  } catch (error) {
    console.error('Error uploading company logo override:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: companyId } = await params;
    const supabase = await createClient();

    // Check if user is authenticated
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has access to this company
    const { data: userCompany, error: accessError } = await supabase
      .from('user_companies')
      .select('company_id')
      .eq('user_id', user.id)
      .eq('company_id', companyId)
      .single();

    // Also check if user is global admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isGlobalAdmin = profile?.role === 'admin';
    const hasCompanyAccess = userCompany && !accessError;

    if (!isGlobalAdmin && !hasCompanyAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const { logoUrl } = body;

    if (!logoUrl) {
      return NextResponse.json({ error: 'No logo URL provided' }, { status: 400 });
    }

    // Extract file path from URL
    const urlParts = logoUrl.split('/storage/v1/object/public/brand-assets/');
    if (urlParts.length !== 2) {
      return NextResponse.json({ error: 'Invalid logo URL format' }, { status: 400 });
    }

    const filePath = urlParts[1];

    // Verify it&apos;s an email logo for this company (security check)
    const cleanCompanyName = await supabase
      .from('companies')
      .select('name')
      .eq('id', companyId)
      .single()
      .then(({ data }) => 
        (data?.name || 'company')
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim()
      );

    if (!filePath.startsWith(`${cleanCompanyName}/email-logos/`)) {
      return NextResponse.json({ error: 'Can only delete this company&apos;s email logo overrides' }, { status: 403 });
    }

    // Delete file from storage
    const { error: deleteError } = await supabase.storage
      .from('brand-assets')
      .remove([filePath]);

    if (deleteError) {
      console.error('Storage delete error:', deleteError);
      return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Logo override deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting company logo override:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}