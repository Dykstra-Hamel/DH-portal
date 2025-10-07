import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';

// GET: Fetch company pricing settings (intervals only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Fetch pricing settings for this company
    const { data: settings, error } = await supabase
      .from('company_pricing_settings')
      .select('*')
      .eq('company_id', id)
      .single();

    if (error) {
      // If no settings exist, create default settings
      if (error.code === 'PGRST116') {
        const { data: newSettings, error: insertError } = await supabase
          .from('company_pricing_settings')
          .insert({ company_id: id })
          .select()
          .single();

        if (insertError) {
          console.error('Error creating default pricing settings:', insertError);
          return NextResponse.json(
            { error: 'Failed to create pricing settings' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          data: newSettings,
        });
      }

      console.error('Error fetching pricing settings:', error);
      return NextResponse.json(
        { error: 'Failed to fetch pricing settings' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('Error in pricing settings GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT: Update company pricing settings
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      base_home_sq_ft,
      home_sq_ft_interval,
      max_home_sq_ft,
      base_yard_acres,
      yard_acres_interval,
      max_yard_acres,
    } = body;

    // Validate required fields
    if (
      base_home_sq_ft === undefined ||
      home_sq_ft_interval === undefined ||
      max_home_sq_ft === undefined ||
      base_yard_acres === undefined ||
      yard_acres_interval === undefined ||
      max_yard_acres === undefined
    ) {
      return NextResponse.json(
        { error: 'All pricing interval fields are required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Update or insert pricing settings
    const { data: settings, error } = await supabase
      .from('company_pricing_settings')
      .upsert(
        {
          company_id: id,
          base_home_sq_ft,
          home_sq_ft_interval,
          max_home_sq_ft,
          base_yard_acres,
          yard_acres_interval,
          max_yard_acres,
        },
        { onConflict: 'company_id' }
      )
      .select()
      .single();

    if (error) {
      console.error('Error updating pricing settings:', error);
      return NextResponse.json(
        { error: 'Failed to update pricing settings' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('Error in pricing settings PUT:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}