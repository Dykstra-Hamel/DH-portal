/**
 * Company Image Library API
 *
 * Manages company-wide reusable images for campaign landing pages.
 *
 * GET: List company images with pagination and filtering
 * POST: Upload new image to company library
 * DELETE: Delete image from library (if not in use)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { STORAGE_CONFIG, cleanCompanyName, getCompanyName, generateImagePath } from '@/lib/storage-utils';

const BUCKET_NAME = STORAGE_CONFIG.BUCKET_NAME; // 'brand-assets'
const MAX_FILE_SIZE = STORAGE_CONFIG.MAX_FILE_SIZE; // 10MB
const ALLOWED_TYPES = STORAGE_CONFIG.ALLOWED_TYPES;

interface CompanyImage {
  id: string;
  company_id: string;
  file_path: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  width: number | null;
  height: number | null;
  aspect_ratio: number | null;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
  alt_text: string | null;
  tags: string[] | null;
  usage_count: number;
  last_used_at: string | null;
}

/**
 * GET - List company images with pagination and filtering
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: companyId } = await params;
    const { searchParams } = new URL(request.url);

    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const offset = (page - 1) * pageSize;

    // Filter parameters
    const search = searchParams.get('search') || '';
    const tag = searchParams.get('tag') || '';
    const folder = searchParams.has('folder') ? searchParams.get('folder') : null;

    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user has access to this company
    const { data: userCompany, error: companyError } = await supabase
      .from('user_companies')
      .select('id')
      .eq('user_id', user.id)
      .eq('company_id', companyId)
      .maybeSingle();

    if (companyError || !userCompany) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // If folder parameter is in query string, list from storage instead of company_images table
    if (folder !== null) {
      const companyName = await getCompanyName(supabase, companyId);
      const cleaned = cleanCompanyName(companyName);

      // If folder is empty string, fetch from ALL folders
      if (folder === '') {
        const allFolders = ['image-library', 'icon-logos', 'alternate-logos', 'logos', 'photography', 'email-logos'];
        let allImages: any[] = [];

        // Fetch from each folder
        for (const folderName of allFolders) {
          const folderPath = `${cleaned}/${folderName}`;
          const { data: files } = await supabase.storage
            .from(BUCKET_NAME)
            .list(folderPath, {
              sortBy: { column: 'created_at', order: 'desc' }
            });

          if (files) {
            const formattedFiles = files.map(file => ({
              ...file,
              folderPath,
              folderName
            }));
            allImages = allImages.concat(formattedFiles);
          }
        }

        // Apply search filter if provided
        if (search) {
          allImages = allImages.filter(file =>
            file.name.toLowerCase().includes(search.toLowerCase())
          );
        }

        // Sort all images by created_at
        allImages.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        // Apply pagination
        const total = allImages.length;
        const paginatedImages = allImages.slice(offset, offset + pageSize);

        // Format response
        const formattedImages = paginatedImages.map(file => {
          const filePath = `${file.folderPath}/${file.name}`;
          const { data: publicUrlData } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(filePath);

          return {
            id: file.id,
            fileName: file.name,
            filePath: filePath,
            publicUrl: publicUrlData.publicUrl,
            width: null,
            height: null,
            aspectRatio: null,
            fileSize: file.metadata?.size || 0,
            mimeType: file.metadata?.mimetype || 'image/jpeg',
            altText: null,
            tags: [],
            uploadedBy: null,
            createdAt: file.created_at,
            usageCount: 0,
            lastUsedAt: null,
          };
        });

        return NextResponse.json({
          success: true,
          data: {
            images: formattedImages,
            pagination: {
              page,
              pageSize,
              total,
              totalPages: Math.ceil(total / pageSize),
            },
          },
        });
      }

      // Fetch from specific folder
      const folderPath = `${cleaned}/${folder}`;

      // Fetch all files from folder (need all for search filtering)
      const { data: allFiles, error: storageError } = await supabase.storage
        .from(BUCKET_NAME)
        .list(folderPath, {
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (storageError) {
        console.error('Error listing storage files:', storageError);
        return NextResponse.json({ error: 'Failed to list images' }, { status: 500 });
      }

      let filteredFiles = allFiles || [];

      // Apply search filter if provided
      if (search) {
        filteredFiles = filteredFiles.filter(file =>
          file.name.toLowerCase().includes(search.toLowerCase())
        );
      }

      // Apply pagination
      const total = filteredFiles.length;
      const paginatedFiles = filteredFiles.slice(offset, offset + pageSize);

      // Format response
      const formattedImages = paginatedFiles.map(file => {
        const filePath = `${folderPath}/${file.name}`;
        const { data: publicUrlData } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(filePath);

        return {
          id: file.id,
          fileName: file.name,
          filePath: filePath,
          publicUrl: publicUrlData.publicUrl,
          width: null, // Load on-demand client-side
          height: null,
          aspectRatio: null,
          fileSize: file.metadata?.size || 0,
          mimeType: file.metadata?.mimetype || 'image/jpeg',
          altText: null,
          tags: [],
          uploadedBy: null,
          createdAt: file.created_at,
          usageCount: 0,
          lastUsedAt: null,
        };
      }) || [];

      return NextResponse.json({
        success: true,
        data: {
          images: formattedImages,
          pagination: {
            page,
            pageSize,
            total,
            totalPages: Math.ceil(total / pageSize),
          },
        },
      });
    }

    // Build query (existing company_images logic)
    let query = supabase
      .from('company_images')
      .select('*', { count: 'exact' })
      .eq('company_id', companyId);

    // Apply search filter
    if (search) {
      query = query.or(`file_name.ilike.%${search}%,alt_text.ilike.%${search}%`);
    }

    // Apply tag filter
    if (tag) {
      query = query.contains('tags', [tag]);
    }

    // Apply pagination and ordering
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    const { data: images, error: imagesError, count } = await query;

    if (imagesError) {
      console.error('Error fetching company images:', imagesError);
      return NextResponse.json(
        { error: 'Failed to fetch images' },
        { status: 500 }
      );
    }

    // Fetch uploader names for each image
    const uploaderIds = images
      ?.map((img: CompanyImage) => img.uploaded_by)
      .filter(Boolean) || [];

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', uploaderIds);

    const profilesMap = new Map(
      profiles?.map(p => [p.id, p.full_name]) || []
    );

    // Format response with public URLs and thumbnails
    const formattedImages = images?.map((image: CompanyImage) => {
      const { data: publicUrlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(image.file_path);

      return {
        id: image.id,
        fileName: image.file_name,
        filePath: image.file_path,
        publicUrl: publicUrlData.publicUrl,
        width: image.width,
        height: image.height,
        aspectRatio: image.aspect_ratio,
        fileSize: image.file_size,
        mimeType: image.mime_type,
        altText: image.alt_text,
        tags: image.tags || [],
        uploadedBy: image.uploaded_by
          ? {
              id: image.uploaded_by,
              name: profilesMap.get(image.uploaded_by) || 'Unknown',
            }
          : null,
        createdAt: image.created_at,
        usageCount: image.usage_count,
        lastUsedAt: image.last_used_at,
      };
    }) || [];

    return NextResponse.json({
      success: true,
      data: {
        images: formattedImages,
        pagination: {
          page,
          pageSize,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / pageSize),
        },
      },
    });
  } catch (error) {
    console.error('Error in GET /api/companies/[id]/images:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST - Upload new image to company library
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: companyId } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user has access to this company
    const { data: userCompany, error: companyError } = await supabase
      .from('user_companies')
      .select('id')
      .eq('user_id', user.id)
      .eq('company_id', companyId)
      .maybeSingle();

    if (companyError || !userCompany) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const altText = formData.get('altText') as string | null;
    const tagsString = formData.get('tags') as string | null;
    const tags = tagsString ? tagsString.split(',').map(t => t.trim()) : [];

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!(ALLOWED_TYPES as readonly string[]).includes(file.type)) {
      return NextResponse.json(
        {
          error: `Invalid file type. Allowed types: ${ALLOWED_TYPES.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        },
        { status: 400 }
      );
    }

    // Generate unique filename for library using brand-assets bucket structure
    const companyName = await getCompanyName(supabase, companyId);
    const cleaned = cleanCompanyName(companyName);
    const fileName = await generateImagePath(cleaned, STORAGE_CONFIG.CATEGORIES.IMAGE_LIBRARY, file.name, supabase);

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Get image dimensions
    let width: number | null = null;
    let height: number | null = null;
    let aspectRatio: number | null = null;

    try {
      // Create a simple check for image dimensions using a canvas approach
      // Note: In production, you might want to use a library like 'sharp' for server-side processing
      const blob = new Blob([buffer], { type: file.type });
      const imageBitmap = await createImageBitmap(blob);
      width = imageBitmap.width;
      height = imageBitmap.height;
      aspectRatio = width / height;
      imageBitmap.close();
    } catch (err) {
      console.warn('Could not extract image dimensions:', err);
      // Continue without dimensions - they're optional
    }

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
        { error: uploadError.message },
        { status: 500 }
      );
    }

    // Create database record
    const { data: imageRecord, error: dbError } = await supabase
      .from('company_images')
      .insert({
        company_id: companyId,
        file_path: uploadData.path,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        width,
        height,
        aspect_ratio: aspectRatio,
        uploaded_by: user.id,
        alt_text: altText,
        tags: tags.length > 0 ? tags : null,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Error creating image record:', dbError);
      // Attempt to clean up uploaded file
      await supabase.storage.from(BUCKET_NAME).remove([uploadData.path]);
      return NextResponse.json(
        { error: 'Failed to create image record' },
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
        id: imageRecord.id,
        fileName: file.name,
        filePath: uploadData.path,
        publicUrl: publicUrlData.publicUrl,
        width,
        height,
        aspectRatio,
        fileSize: file.size,
        mimeType: file.type,
        altText,
        tags,
        createdAt: imageRecord.created_at,
      },
    });
  } catch (error) {
    console.error('Error in POST /api/companies/[id]/images:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Remove image from library (only if not in use)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: companyId } = await params;
    const { searchParams } = new URL(request.url);
    const imageId = searchParams.get('imageId');

    if (!imageId) {
      return NextResponse.json(
        { error: 'imageId is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user has access to this company
    const { data: userCompany, error: companyError } = await supabase
      .from('user_companies')
      .select('id')
      .eq('user_id', user.id)
      .eq('company_id', companyId)
      .maybeSingle();

    if (companyError || !userCompany) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get image record
    const { data: image, error: imageError } = await supabase
      .from('company_images')
      .select('*')
      .eq('id', imageId)
      .eq('company_id', companyId)
      .single();

    if (imageError || !image) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }

    // Check if image is in use
    const { data: usageData, error: usageError } = await supabase
      .from('campaign_image_usage')
      .select('id')
      .eq('company_image_id', imageId)
      .limit(1);

    if (usageError) {
      console.error('Error checking image usage:', usageError);
      return NextResponse.json(
        { error: 'Failed to check image usage' },
        { status: 500 }
      );
    }

    if (usageData && usageData.length > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete image that is currently in use by campaigns',
          inUse: true,
        },
        { status: 409 }
      );
    }

    // Delete from storage
    const { error: deleteStorageError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([image.file_path]);

    if (deleteStorageError) {
      console.error('Error deleting from storage:', deleteStorageError);
      return NextResponse.json(
        { error: 'Failed to delete image file' },
        { status: 500 }
      );
    }

    // Delete from database
    const { error: deleteDbError } = await supabase
      .from('company_images')
      .delete()
      .eq('id', imageId);

    if (deleteDbError) {
      console.error('Error deleting image record:', deleteDbError);
      return NextResponse.json(
        { error: 'Failed to delete image record' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Image deleted successfully',
    });
  } catch (error) {
    console.error('Error in DELETE /api/companies/[id]/images:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
