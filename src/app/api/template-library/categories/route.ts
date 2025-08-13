import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server-admin';

export async function GET() {
  try {
    // Use admin client for read-only public data access
    // This bypasses RLS for reading public template categories
    const supabase = createAdminClient();

    // Get distinct categories, industry tags, and pest type tags
    const { data: templates, error } = await supabase
      .from('email_template_library')
      .select('template_category, industry_tags, pest_type_tags')
      .eq('is_active', true);

    if (error) {
      return NextResponse.json({ 
        error: 'Failed to fetch template categories' 
      }, { status: 500 });
    }

    // Process the data to extract unique categories and tags
    const categories = new Set<string>();
    const industryTags = new Set<string>();
    const pestTypeTags = new Set<string>();

    templates?.forEach(template => {
      if (template.template_category) {
        categories.add(template.template_category);
      }

      if (template.industry_tags) {
        template.industry_tags.forEach((tag: string) => industryTags.add(tag));
      }

      if (template.pest_type_tags) {
        template.pest_type_tags.forEach((tag: string) => pestTypeTags.add(tag));
      }
    });

    return NextResponse.json({
      success: true,
      categories: Array.from(categories).sort(),
      industry_tags: Array.from(industryTags).sort(),
      pest_type_tags: Array.from(pestTypeTags).sort()
    });

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}