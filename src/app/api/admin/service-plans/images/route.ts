import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get('companyId');

  if (!companyId) {
    return NextResponse.json({ error: 'companyId is required' }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: company } = await supabase
    .from('companies')
    .select('slug')
    .eq('id', companyId)
    .single();

  if (!company?.slug) {
    return NextResponse.json({ images: [] });
  }

  const folder = `${company.slug}/service-plans`;

  const { data, error } = await supabase.storage
    .from('brand-assets')
    .list(folder, { sortBy: { column: 'created_at', order: 'desc' } });

  if (error) {
    return NextResponse.json({ images: [] });
  }

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
        .getPublicUrl(`${folder}/${item.name}`);
      return { fileName: item.name, publicUrl: urlData.publicUrl };
    });

  return NextResponse.json({ images });
}
