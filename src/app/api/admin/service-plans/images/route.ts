import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';

export async function GET() {
  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase.storage
      .from('brand-assets')
      .list('service-plans', { sortBy: { column: 'created_at', order: 'desc' } });

    if (error) throw error;

    const imageExtensions = /\.(jpe?g|png|gif|webp|avif|svg)$/i;

    const images = (data ?? [])
      .filter(
        (item) =>
          !item.id?.endsWith('/') &&
          item.name !== '.emptyFolderPlaceholder' &&
          imageExtensions.test(item.name)
      )
      .map((item) => {
        const { data: urlData } = supabase.storage
          .from('brand-assets')
          .getPublicUrl(`service-plans/${item.name}`);
        return { fileName: item.name, publicUrl: urlData.publicUrl };
      });

    return NextResponse.json({ images });
  } catch (error) {
    console.error('Error listing service plan images:', error);
    return NextResponse.json({ error: 'Failed to list images' }, { status: 500 });
  }
}
