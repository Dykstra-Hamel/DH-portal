import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/storage/signed-url-redirect
 * Get a signed URL and redirect to it (for inline image display)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bucket = searchParams.get('bucket');
    const path = searchParams.get('path');

    if (!bucket || !path) {
      return NextResponse.json(
        { error: 'Missing bucket or path parameter' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get current user for auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get signed URL (1 hour expiry)
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, 3600);

    if (error || !data) {
      console.error('Error creating signed URL:', error);
      return NextResponse.json(
        { error: 'Failed to create signed URL', details: error?.message },
        { status: 500 }
      );
    }

    // Redirect to the signed URL
    return NextResponse.redirect(data.signedUrl);
  } catch (error) {
    console.error('Error in signed URL redirect:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
