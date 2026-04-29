import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { generateQuoteUrl, generateQuoteToken } from '@/lib/quote-utils';

/**
 * Public endpoint to fetch quote data for customer viewing
 * No authentication required - uses RLS policy that allows public access for quotes with quote_url
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Quote ID is required' },
        { status: 400 }
      );
    }

    // Extract and validate token and companySlug from query params
    const url = new URL(request.url);
    const token = url.searchParams.get('token');
    const companySlug = url.searchParams.get('companySlug');

    if (!token) {
      return NextResponse.json(
        { error: 'Access token is required' },
        { status: 403 }
      );
    }

    const supabase = createAdminClient();

    // Fetch the quote with all related data
    const { data: quote, error } = await supabase
      .from('quotes')
      .select(
        `
        *,
        line_items:quote_line_items(
          *,
          service_plan:service_plans(
            plan_features,
            plan_faqs,
            plan_image_url,
            plan_disclaimer,
            plan_name,
            plan_terms,
            plan_video_url,
            plan_pest_coverage(pest_id)
          ),
          addon_service:add_on_services(
            addon_description,
            addon_name,
            addon_terms,
            addon_faqs
          ),
          bundle_plan:bundle_plans(
            bundle_features,
            bundle_image_url,
            bundle_description,
            bundled_service_plans
          )
        ),
        customer:customers(
          id,
          first_name,
          last_name,
          email,
          phone
        ),
        service_address:service_addresses(
          id,
          street_address,
          apartment_unit,
          address_line_2,
          city,
          state,
          zip_code,
          latitude,
          longitude,
          home_size_range,
          yard_size_range
        ),
        lead:leads(
          id,
          lead_status,
          service_type,
          comments,
          requested_date,
          requested_time,
          map_plot_data
        ),
        company:companies(
          id,
          name,
          slug,
          email,
          phone,
          website
        )
      `
      )
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
      }

      console.error('Error fetching public quote:', error);
      return NextResponse.json(
        { error: 'Failed to fetch quote' },
        { status: 500 }
      );
    }

    // Validate token matches quote
    if (quote.quote_token !== token) {
      return NextResponse.json(
        { error: 'Invalid access token' },
        { status: 403 }
      );
    }

    // Check if token has expired
    if (quote.token_expires_at) {
      const expiryDate = new Date(quote.token_expires_at);
      if (expiryDate < new Date()) {
        return NextResponse.json(
          { error: 'Access token has expired' },
          { status: 403 }
        );
      }
    }

    // Generate quote_url path if it doesn't exist (for quotes created before this feature)
    if (!quote.quote_url && quote.company?.slug) {
      // Generate token if it doesn't exist
      const token = quote.quote_token || generateQuoteToken();
      const quoteUrlPath = generateQuoteUrl(quote.company.slug, id, token);

      // Update the quote with the generated path and token
      await supabase
        .from('quotes')
        .update({ quote_url: quoteUrlPath, quote_token: token })
        .eq('id', id);

      // Update the quote object for the response
      quote.quote_url = quoteUrlPath;
      quote.quote_token = token;
    }

    // Optional: Validate company slug from query params if provided
    if (companySlug && quote.company?.slug !== companySlug) {
      return NextResponse.json(
        { error: 'Quote not found for this company' },
        { status: 404 }
      );
    }

    // For bundle line items, fetch the bundled service plans with their FAQs
    if (quote.line_items) {
      for (const lineItem of quote.line_items) {
        if (lineItem.bundle_plan && lineItem.bundle_plan.bundled_service_plans) {
          const bundledServicePlanIds = lineItem.bundle_plan.bundled_service_plans
            .map((sp: any) => sp.service_plan_id)
            .filter(Boolean);

          if (bundledServicePlanIds.length > 0) {
            const { data: bundledPlans } = await supabase
              .from('service_plans')
              .select('id, plan_name, plan_faqs, plan_features')
              .in('id', bundledServicePlanIds);

            if (bundledPlans) {
              lineItem.bundle_plan.bundled_plans_with_faqs = bundledPlans;
            }
          }
        }
      }
    }

    // Transform line items from DB format to QuoteLineItem format with embedded planContent
    const transformedLineItems = (quote.line_items || []).map((item: any) => {
      let catalogItemKind: 'plan' | 'addon' | 'bundle' | 'product' | 'specialty-line' | 'custom' = 'custom';
      let catalogItemId: string | undefined;

      if (item.product_id) {
        catalogItemKind = 'product';
        catalogItemId = item.product_id;
      } else if (item.addon_service_id) {
        catalogItemKind = 'addon';
        catalogItemId = item.addon_service_id;
      } else if (item.bundle_plan_id) {
        catalogItemKind = 'bundle';
        catalogItemId = item.bundle_plan_id;
      } else if (item.service_plan_id && item.parent_line_item_id) {
        // Specialty-line: inherits parent plan's service_plan_id but has a parent pointer
        catalogItemKind = 'specialty-line';
        catalogItemId = item.service_plan_id;
      } else if (item.parent_line_item_id) {
        // Fallback: child item with a parent pointer but service_plan_id was not saved.
        // Mirrors the ServiceWizard.tsx fallback: item.parent_line_item_id ? 'specialty-line'
        catalogItemKind = 'specialty-line';
      } else if (item.service_plan_id) {
        catalogItemKind = 'plan';
        catalogItemId = item.service_plan_id;
      }

      let planContent: Record<string, any> | null = null;
      if (item.service_plan) {
        planContent = {
          plan_name: item.service_plan.plan_name,
          plan_features: item.service_plan.plan_features ?? [],
          plan_faqs: item.service_plan.plan_faqs ?? [],
          plan_image_url: item.service_plan.plan_image_url ?? null,
          plan_video_url: item.service_plan.plan_video_url ?? null,
          plan_disclaimer: item.service_plan.plan_disclaimer ?? null,
          plan_terms: item.service_plan.plan_terms ?? null,
          pest_coverage: (item.service_plan.plan_pest_coverage ?? []).map(
            (c: any) => ({ pest_id: c.pest_id })
          ),
        };
      } else if (item.addon_service) {
        planContent = {
          plan_name: item.addon_service.addon_name,
          addon_description: item.addon_service.addon_description ?? null,
          addon_terms: item.addon_service.addon_terms ?? null,
          addon_faqs: item.addon_service.addon_faqs ?? [],
        };
      } else if (item.bundle_plan) {
        planContent = {
          plan_name: item.plan_name,
          bundle_description: item.bundle_plan.bundle_description ?? null,
          bundle_features: item.bundle_plan.bundle_features ?? [],
          bundle_image_url: item.bundle_plan.bundle_image_url ?? null,
          bundled_plans_with_faqs: item.bundle_plan.bundled_plans_with_faqs ?? [],
        };
      }

      return {
        id: item.id,
        type: 'plan-addon' as const,
        catalogItemKind,
        catalogItemId,
        catalogItemName: item.plan_name,
        coveredPestIds: [] as string[],
        coveredPestLabels: [] as string[],
        initialCost: item.initial_price ?? 0,
        recurringCost: item.recurring_price ?? 0,
        frequency: item.billing_frequency ?? 'monthly',
        isPrimary: item.is_primary ?? true,
        isSelected: item.is_selected ?? true,
        isRecommended: item.is_recommended ?? undefined,
        parentLineItemId: item.parent_line_item_id ?? null,
        planContent,
        // Keep service_plan reference for terms modal backward compat
        service_plan: item.service_plan ?? null,
        addon_service: item.addon_service ?? null,
      };
    });

    // Fetch featured plans not already in the quote
    const quotedPlanIds = new Set(
      (quote.line_items || [])
        .filter((i: any) => i.service_plan_id && !i.parent_line_item_id)
        .map((i: any) => i.service_plan_id as string)
    );

    const { data: featuredPlans } = await supabase
      .from('service_plans')
      .select('id, plan_name, billing_frequency, initial_price, recurring_price, plan_description, plan_features, plan_image_url')
      .eq('company_id', quote.company.id)
      .eq('is_active', true)
      .eq('is_featured', true);

    const filteredFeaturedPlans = (featuredPlans ?? []).filter(
      (p: any) => !quotedPlanIds.has(p.id)
    );

    return NextResponse.json({
      success: true,
      data: { ...quote, line_items: transformedLineItems, featured_plans: filteredFeaturedPlans },
    });
  } catch (error) {
    console.error('Error in public quote GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
