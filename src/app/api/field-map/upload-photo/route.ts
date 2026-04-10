import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server-admin';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const companyId = formData.get('companyId') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
    }

    const ext = file.name.split('.').pop() ?? 'jpg';
    const folder = companyId ? `${companyId}/${user.id}` : user.id;
    const path = `${folder}/${crypto.randomUUID()}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const adminClient = createAdminClient();
    const { error: uploadError } = await adminClient.storage
      .from('field-map-photos')
      .upload(path, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // Use a signed URL (10-year expiry) so images are accessible regardless of bucket public setting
    const { data: signedData, error: signedError } = await adminClient.storage
      .from('field-map-photos')
      .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);

    if (signedError || !signedData?.signedUrl) {
      return NextResponse.json({ error: 'Failed to generate image URL' }, { status: 500 });
    }

    return NextResponse.json({ url: signedData.signedUrl, path });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
