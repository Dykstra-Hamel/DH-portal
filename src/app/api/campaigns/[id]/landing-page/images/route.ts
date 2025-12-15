/**
 * Campaign Landing Page Image Upload API
 *
 * POST: Upload images for campaign landing pages
 * Returns public URLs for uploaded images
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { STORAGE_CONFIG, cleanCompanyName, getCompanyName, generateImagePath } from '@/lib/storage-utils';

const BUCKET_NAME = STORAGE_CONFIG.BUCKET_NAME; // 'brand-assets'
const MAX_FILE_SIZE = STORAGE_CONFIG.MAX_FILE_SIZE; // 10MB
const ALLOWED_TYPES = STORAGE_CONFIG.ALLOWED_TYPES;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params;
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    // Validate companyId is provided
    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'companyId is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify user has access to this company
    // Note: Campaign doesn't need to exist yet (we're allowing uploads during campaign creation)
    const { data: userCompany, error: companyError } = await supabase
      .from('user_companies')
      .select('id')
      .eq('user_id', user.id)
      .eq('company_id', companyId)
      .maybeSingle();

    if (companyError || !userCompany) {
      return NextResponse.json(
        { success: false, error: 'You do not have access to this company' },
        { status: 403 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!(ALLOWED_TYPES as readonly string[]).includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid file type. Allowed types: ${ALLOWED_TYPES.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        },
        { status: 400 }
      );
    }

    // Generate unique filename using brand-assets bucket structure
    // ALL campaign uploads go to {companyName}/image-library/ folder
    const companyName = await getCompanyName(supabase, companyId);
    const cleaned = cleanCompanyName(companyName);
    const fileName = await generateImagePath(cleaned, STORAGE_CONFIG.CATEGORIES.IMAGE_LIBRARY, file.name, supabase);

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Error uploading to storage:', uploadError);
      return NextResponse.json(
        { success: false, error: uploadError.message },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(uploadData.path);

    return NextResponse.json({
      success: true,
      data: {
        path: uploadData.path,
        url: publicUrlData.publicUrl,
        fileName: file.name,
        size: file.size,
        type: file.type,
      },
    });
  } catch (error) {
    console.error('Error in POST /api/campaigns/[id]/landing-page/images:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Remove an image from storage
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params;
    const { searchParams } = new URL(request.url);
    const imagePath = searchParams.get('path');
    const companyId = searchParams.get('companyId');

    if (!imagePath) {
      return NextResponse.json(
        { success: false, error: 'Image path is required' },
        { status: 400 }
      );
    }

    // Validate companyId is provided
    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'companyId is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify user has access to this company
    // Note: Campaign doesn't need to exist yet (we're allowing deletes during campaign creation)
    const { data: userCompany, error: companyError } = await supabase
      .from('user_companies')
      .select('id')
      .eq('user_id', user.id)
      .eq('company_id', companyId)
      .maybeSingle();

    if (companyError || !userCompany) {
      return NextResponse.json(
        { success: false, error: 'You do not have access to this company' },
        { status: 403 }
      );
    }

    // Delete from storage
    const { error: deleteError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([imagePath]);

    if (deleteError) {
      console.error('Error deleting from storage:', deleteError);
      return NextResponse.json(
        { success: false, error: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Image deleted successfully',
    });
  } catch (error) {
    console.error('Error in DELETE /api/campaigns/[id]/landing-page/images:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
