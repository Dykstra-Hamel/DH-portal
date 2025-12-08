/**
 * Campaign Landing Page Data API
 *
 * GET: Public endpoint to fetch campaign, customer, and company data for landing pages.
 * POST: Protected endpoint to create landing page customization.
 * PUT: Protected endpoint to update landing page customization.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params;
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');

    // Check if this is an authenticated admin request (for editing) or public request (for viewing)
    const authSupabase = await createClient();
    const { data: { user } } = await authSupabase.auth.getUser();
    const isAdminRequest = !!user && (!customerId || customerId === 'preview');

    // For public requests, customerId is required
    if (!isAdminRequest && !customerId) {
      return NextResponse.json(
        { success: false, error: 'Customer ID is required' },
        { status: 400 }
      );
    }

    // Use service role client to bypass RLS for public campaign landing pages
    const supabase = createServiceRoleClient();

    // Fetch campaign with discount information and optional service plan link
    // Support both database id (for admin/internal use) and campaign_id (for public URLs)
    let campaign = null;
    let campaignError = null;

    // First, try looking up by database id (UUID format)
    const { data: campaignById, error: errorById } = await supabase
      .from('campaigns')
      .select(`
        id,
        campaign_id,
        name,
        description,
        company_id,
        discount_id,
        service_plan_id,
        company_discounts (
          id,
          discount_type,
          discount_value,
          discount_name
        )
      `)
      .eq('id', campaignId)
      .maybeSingle();

    if (campaignById) {
      // Found by database id (admin request)
      campaign = campaignById;
    } else {
      // Not found by database id, try campaign_id (public request)
      const { data: campaignByExternalId, error: errorByExternalId } = await supabase
        .from('campaigns')
        .select(`
          id,
          campaign_id,
          name,
          description,
          company_id,
          discount_id,
          service_plan_id,
          company_discounts (
            id,
            discount_type,
            discount_value,
            discount_name
          )
        `)
        .eq('campaign_id', campaignId)
        .single();

      campaign = campaignByExternalId;
      campaignError = errorByExternalId;
    }

    if (campaignError || !campaign) {
      console.error('Campaign lookup failed:', { campaignId, campaignError });
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Fetch customer with service address (or use mock data for admin requests)
    let customer;
    if (isAdminRequest) {
      // For admin requests, provide mock customer data for preview purposes
      customer = {
        id: 'admin-preview',
        first_name: 'John',
        last_name: 'Doe',
        email: 'customer@example.com',
        phone: '(555) 123-4567',
        customer_service_addresses: [{
          is_primary_address: true,
          service_addresses: {
            id: 'mock-address',
            street_address: '123 Main Street',
            city: 'Anytown',
            state: 'CA',
            zip_code: '12345',
          },
        }],
      };
    } else {
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select(`
          id,
          first_name,
          last_name,
          email,
          phone,
          customer_service_addresses (
            is_primary_address,
            service_addresses (
              id,
              street_address,
              city,
              state,
              zip_code
            )
          )
        `)
        .eq('id', customerId)
        .eq('company_id', campaign.company_id)
        .single();

      console.log('Customer query result:', { customer: customerData, customerError, customerId, companyId: campaign.company_id });

      if (customerError || !customerData) {
        console.error('Customer lookup failed:', { customerId, companyId: campaign.company_id, customerError });
        return NextResponse.json(
          { success: false, error: 'Customer not found' },
          { status: 404 }
        );
      }
      customer = customerData;
    }

    // Fetch company information (including phone for branding)
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, name, slug, phone, email')
      .eq('id', campaign.company_id)
      .single();

    if (companyError || !company) {
      return NextResponse.json(
        { success: false, error: 'Company not found' },
        { status: 404 }
      );
    }

    // Fetch landing page customization (optional)
    const { data: landingPageData } = await supabase
      .from('campaign_landing_pages')
      .select('*')
      .eq('campaign_id', campaign.id)
      .maybeSingle();

    // Fetch company branding (optional)
    const { data: brandData } = await supabase
      .from('brands')
      .select('logo_url, primary_color_hex, secondary_color_hex, font_primary_name, font_primary_url')
      .eq('company_id', campaign.company_id)
      .maybeSingle();

    // Fetch service plan if campaign is linked to one
    let servicePlan = null;
    let eligibleAddOns: any[] = [];
    if (campaign.service_plan_id) {
      const { data: planData } = await supabase
        .from('service_plans')
        .select('id, plan_name, plan_faqs, plan_features')
        .eq('id', campaign.service_plan_id)
        .maybeSingle();
      servicePlan = planData;

      // Fetch eligible add-ons for this service plan using the database function
      const { data: addOnsData } = await supabase
        .rpc('get_eligible_addons_for_plan', {
          p_service_plan_id: campaign.service_plan_id,
          p_company_id: campaign.company_id,
        });

      // Filter to only include eligible add-ons and fetch full details
      if (addOnsData) {
        const eligibleAddonIds = addOnsData
          .filter((addon: any) => addon.is_eligible)
          .map((addon: any) => addon.addon_id);

        if (eligibleAddonIds.length > 0) {
          const { data: fullAddOnsData } = await supabase
            .from('add_on_services')
            .select('id, addon_name, addon_description, addon_faqs, recurring_price, display_order')
            .in('id', eligibleAddonIds)
            .eq('is_active', true)
            .order('display_order', { ascending: true })
            .order('addon_name');

          eligibleAddOns = fullAddOnsData || [];
        }
      }
    }

    // Get primary service address (nested through junction table)
    const primaryAddressLink = Array.isArray(customer.customer_service_addresses)
      ? customer.customer_service_addresses.find((link: any) => link.is_primary_address) || customer.customer_service_addresses[0]
      : null;

    const primaryAddress = primaryAddressLink?.service_addresses || null;

    // Get discount data (Supabase returns array for relations)
    const discount = Array.isArray(campaign.company_discounts)
      ? campaign.company_discounts[0]
      : campaign.company_discounts;

    // For admin requests, skip customer authorization and provide mock redemption data
    let redemption;
    if (isAdminRequest) {
      // For authenticated admin users, verify they have access to this campaign's company
      const { data: userCompany } = await authSupabase
        .from('user_companies')
        .select('id')
        .eq('user_id', user!.id)
        .eq('company_id', campaign.company_id)
        .maybeSingle();

      if (!userCompany) {
        return NextResponse.json(
          { success: false, error: 'You do not have access to this campaign' },
          { status: 403 }
        );
      }

      // Mock redemption data for preview
      redemption = {
        redeemed_at: null,
        signed_at: null,
        requested_date: null,
        requested_time: null,
      };
    } else {
      // SECURITY: Validate customer is in campaign's contact lists (public requests only)
      // Query the new reusable contact list system
      const { data: contactListAssignments, error: assignmentsError } = await supabase
        .from('campaign_contact_list_assignments')
        .select('contact_list_id')
        .eq('campaign_id', campaign.id);

      if (assignmentsError) {
        console.error('Error fetching contact list assignments:', assignmentsError);
        return NextResponse.json(
          { success: false, error: 'Failed to verify campaign access' },
          { status: 500 }
        );
      }

      if (!contactListAssignments || contactListAssignments.length === 0) {
        return NextResponse.json(
          { success: false, error: 'No contact lists found for this campaign' },
          { status: 404 }
        );
      }

      const listIds = contactListAssignments.map(a => a.contact_list_id);

      // Check if customer is a member of any contact list for this campaign
      const { data: membership, error: membershipError } = await supabase
        .from('contact_list_members')
        .select('id, contact_list_id')
        .eq('customer_id', customerId)
        .in('contact_list_id', listIds)
        .maybeSingle();

      if (membershipError) {
        console.error('Error checking membership:', membershipError);
      }

      if (!membership) {
        return NextResponse.json(
          {
            success: false,
            error: 'You are not authorized to access this campaign. This link may have expired or is invalid.'
          },
          { status: 403 }
        );
      }

      // Get campaign-specific tracking data (status, redemption info)
      const { data: memberRecord, error: trackingError } = await supabase
        .from('campaign_contact_list_members')
        .select('id, status, redeemed_at, signed_at, requested_date, requested_time')
        .eq('customer_id', customerId)
        .eq('contact_list_id', membership.contact_list_id)
        .eq('campaign_id', campaign.id)
        .maybeSingle();

      if (trackingError) {
        console.error('Error checking campaign tracking:', trackingError);
      }

      // Check if member status is valid (not excluded or unsubscribed)
      if (memberRecord?.status === 'excluded' || memberRecord?.status === 'unsubscribed') {
        return NextResponse.json(
          {
            success: false,
            error: 'You have been unsubscribed from this campaign.'
          },
          { status: 403 }
        );
      }

      // Build redemption object from member record (may be null if not tracked yet)
      redemption = memberRecord ? {
        redeemed_at: memberRecord.redeemed_at,
        signed_at: memberRecord.signed_at,
        requested_date: memberRecord.requested_date,
        requested_time: memberRecord.requested_time,
      } : {
        redeemed_at: null,
        signed_at: null,
        requested_date: null,
        requested_time: null,
    };
    }

    // Build branding object with hierarchy (landing page overrides > brand > company > defaults)
    const branding = {
      logoUrl: landingPageData?.override_logo_url || brandData?.logo_url || null,
      primaryColor: landingPageData?.override_primary_color || brandData?.primary_color_hex || '#00529B',
      secondaryColor: landingPageData?.override_secondary_color || brandData?.secondary_color_hex || '#00B142',
      phoneNumber: landingPageData?.override_phone || company.phone || null,
      email: company.email || null,
      companyName: company.name,
      accentColorPreference: landingPageData?.accent_color_preference || 'primary',
      fontPrimaryName: brandData?.font_primary_name || null,
      fontPrimaryUrl: brandData?.font_primary_url || null,
    };

    // Build landing page object with defaults
    const landingPage = {
      hero: {
        title: landingPageData?.hero_title || 'Quarterly Pest Control starting at only $44/mo',
        subtitle: landingPageData?.hero_subtitle || 'Special Offer',
        description: landingPageData?.hero_description || null,
        buttonText: landingPageData?.hero_button_text || 'Upgrade Today!',
        // Use single hero image (hero_image_url) or fall back to first image from old array format
        imageUrl: landingPageData?.hero_image_url || landingPageData?.hero_image_urls?.[0] || null,
      },
      pricing: {
        displayPrice: landingPageData?.display_price || '$44/mo',
        originalPrice: landingPageData?.display_original_price || null,
        savings: landingPageData?.display_savings || null,
      },
      letter: {
        show: landingPageData?.show_letter ?? true,
        content: landingPageData?.letter_content || null,
        signatureText: landingPageData?.letter_signature_text || 'The Team',
        imageUrl: landingPageData?.letter_image_url || null,
      },
      features: {
        heading: landingPageData?.feature_heading || 'No initial cost to get started',
        // Use service plan features if linked, otherwise use landing page config
        bullets: servicePlan?.plan_features || landingPageData?.feature_bullets || [],
        imageUrl: landingPageData?.feature_image_url || null,
      },
      additionalServices: {
        show: landingPageData?.show_additional_services ?? true,
        heading: landingPageData?.additional_services_heading || 'And thats not all, we offer additional add-on programs as well including:',
        services: landingPageData?.additional_services || [],
        imageUrl: landingPageData?.additional_services_image_url || null,
      },
      addons: eligibleAddOns.map(addon => ({
        id: addon.id,
        name: addon.addon_name,
        description: addon.addon_description,
        faqs: addon.addon_faqs || [],
        price: addon.recurring_price,
      })),
      faq: {
        show: landingPageData?.show_faq ?? true,
        heading: landingPageData?.faq_heading || 'Frequently Asked Questions',
        serviceName: servicePlan?.plan_name || 'Quarterly Services',
        serviceFaqs: servicePlan?.plan_faqs || landingPageData?.faq_items || [],
        addonFaqs: eligibleAddOns.map(addon => ({
          addonId: addon.id,
          addonName: addon.addon_name,
          faqs: addon.addon_faqs || [],
        })),
      },
      header: {
        primaryButtonText: landingPageData?.header_primary_button_text || 'Upgrade Now',
        secondaryButtonText: landingPageData?.header_secondary_button_text || 'Call (888) 888-8888',
        showCta: landingPageData?.show_header_cta ?? true,
      },
      footer: {
        tagline: landingPageData?.footer_company_tagline || 'Personal. Urgent. Reliable.',
        links: landingPageData?.footer_links || [],
      },
      terms: {
        content: landingPageData?.terms_content || null,
      },
      redemptionCard: {
        heading: landingPageData?.redemption_card_heading || null,
        disclaimer: landingPageData?.redemption_card_disclaimer || null,
      },
      branding,
    };

    // Return formatted data
    return NextResponse.json({
      success: true,
      data: {
        campaign: {
          id: campaign.id,
          campaign_id: campaign.campaign_id,
          name: campaign.name,
          description: campaign.description,
          discount: discount ? {
            id: discount.id,
            discount_type: discount.discount_type,
            discount_value: discount.discount_value,
            name: discount.discount_name,
          } : null,
        },
        customer: {
          id: customer.id,
          first_name: customer.first_name,
          last_name: customer.last_name,
          email: customer.email,
          phone_number: customer.phone,
          service_address: primaryAddress,
        },
        company: {
          id: company.id,
          name: company.name,
          slug: company.slug,
        },
        redemption: {
          isRedeemed: !!redemption.redeemed_at,
          redeemedAt: redemption.redeemed_at,
          requestedDate: redemption.requested_date,
          requestedTime: redemption.requested_time,
        },
        landingPage,
      },
    });
  } catch (error) {
    console.error('Error fetching campaign landing page data:', error);
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
 * POST - Create landing page customization for a campaign
 * Requires authentication and campaign access
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params;
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get campaign to verify ownership
    // Support both database id (for admin/internal use) and campaign_id (for public URLs)
    let campaign = null;
    let campaignError = null;

    // First, try looking up by database id (UUID format)
    const { data: campaignById } = await supabase
      .from('campaigns')
      .select('id, campaign_id, company_id')
      .eq('id', campaignId)
      .maybeSingle();

    if (campaignById) {
      campaign = campaignById;
    } else {
      // Not found by database id, try campaign_id
      const { data: campaignByExternalId, error: errorByExternalId } = await supabase
        .from('campaigns')
        .select('id, campaign_id, company_id')
        .eq('campaign_id', campaignId)
        .single();

      campaign = campaignByExternalId;
      campaignError = errorByExternalId;
    }

    if (campaignError || !campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Verify user has access to this company
    const { data: userCompany, error: companyError } = await supabase
      .from('user_companies')
      .select('id')
      .eq('user_id', user.id)
      .eq('company_id', campaign.company_id)
      .maybeSingle();

    if (companyError || !userCompany) {
      return NextResponse.json(
        { success: false, error: 'You do not have access to this campaign' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate required fields
    if (!body.hero_title || !body.display_price) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: hero_title and display_price are required' },
        { status: 400 }
      );
    }

    // Check if landing page already exists for this campaign
    const { data: existingPage } = await supabase
      .from('campaign_landing_pages')
      .select('id')
      .eq('campaign_id', campaign.id)
      .maybeSingle();

    if (existingPage) {
      return NextResponse.json(
        { success: false, error: 'Landing page already exists for this campaign. Use PUT to update.' },
        { status: 409 }
      );
    }

    // Insert landing page data
    const { data: landingPage, error: insertError } = await supabase
      .from('campaign_landing_pages')
      .insert({
        campaign_id: campaign.id,

        // Hero section
        hero_title: body.hero_title,
        hero_subtitle: body.hero_subtitle || 'Special Offer',
        hero_description: body.hero_description || null,
        hero_button_text: body.hero_button_text || 'Upgrade Today!',
        hero_image_url: body.hero_image_url || null,

        // Pricing
        display_price: body.display_price,
        display_original_price: body.display_original_price || null,
        display_savings: body.display_savings || null,

        // Letter
        show_letter: body.show_letter ?? true,
        letter_content: body.letter_content || null,
        letter_signature_text: body.letter_signature_text || 'The Team',
        letter_image_url: body.letter_image_url || null,

        // Features
        feature_heading: body.feature_heading || 'No initial cost to get started',
        feature_bullets: body.feature_bullets || [],
        feature_image_url: body.feature_image_url || null,

        // Additional Services
        show_additional_services: body.show_additional_services ?? true,
        additional_services_heading: body.additional_services_heading || 'And thats not all, we offer additional add-on programs as well including:',
        additional_services: body.additional_services || [],
        additional_services_image_url: body.additional_services_image_url || null,

        // FAQ
        show_faq: body.show_faq ?? true,
        faq_heading: body.faq_heading || 'Frequently Asked Questions',
        faq_items: body.faq_items || [],

        // Header
        header_primary_button_text: body.header_primary_button_text || 'Upgrade Now',
        header_secondary_button_text: body.header_secondary_button_text || 'Call (888) 888-8888',
        show_header_cta: body.show_header_cta ?? true,

        // Brand overrides
        override_logo_url: body.override_logo_url || null,
        override_primary_color: body.override_primary_color || null,
        override_secondary_color: body.override_secondary_color || null,
        override_phone: body.override_phone || null,
        accent_color_preference: body.accent_color_preference || 'primary',

        // Footer
        footer_company_tagline: body.footer_company_tagline || 'Personal. Urgent. Reliable.',
        footer_links: body.footer_links || [],

        // Terms
        terms_content: body.terms_content || null,

        // Redemption Card
        redemption_card_heading: body.redemption_card_heading || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating landing page:', insertError);
      return NextResponse.json(
        { success: false, error: insertError.message },
        { status: 500 }
      );
    }

    // Also update service_plan_id on campaigns table if provided
    if (body.service_plan_id !== undefined) {
      const { error: campaignUpdateError } = await supabase
        .from('campaigns')
        .update({ service_plan_id: body.service_plan_id })
        .eq('campaign_id', campaignId);

      if (campaignUpdateError) {
        console.error('Error updating service_plan_id:', campaignUpdateError);
        // Don't fail the whole request, just log it
      }
    }

    return NextResponse.json({
      success: true,
      data: landingPage,
    });
  } catch (error) {
    console.error('Error in POST /api/campaigns/[id]/landing-page:', error);
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
 * PUT - Update landing page customization for a campaign
 * Requires authentication and campaign access
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params;
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get campaign to verify ownership
    // Support both database id (for admin/internal use) and campaign_id (for public URLs)
    let campaign = null;
    let campaignError = null;

    // First, try looking up by database id (UUID format)
    const { data: campaignById } = await supabase
      .from('campaigns')
      .select('id, campaign_id, company_id')
      .eq('id', campaignId)
      .maybeSingle();

    if (campaignById) {
      campaign = campaignById;
    } else {
      // Not found by database id, try campaign_id
      const { data: campaignByExternalId, error: errorByExternalId } = await supabase
        .from('campaigns')
        .select('id, campaign_id, company_id')
        .eq('campaign_id', campaignId)
        .single();

      campaign = campaignByExternalId;
      campaignError = errorByExternalId;
    }

    if (campaignError || !campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Verify user has access to this company
    const { data: userCompany, error: companyError } = await supabase
      .from('user_companies')
      .select('id')
      .eq('user_id', user.id)
      .eq('company_id', campaign.company_id)
      .maybeSingle();

    if (companyError || !userCompany) {
      return NextResponse.json(
        { success: false, error: 'You do not have access to this campaign' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Build update object with only provided fields
    const updateData: Record<string, any> = {};

    // Hero section
    if (body.hero_title !== undefined) updateData.hero_title = body.hero_title;
    if (body.hero_subtitle !== undefined) updateData.hero_subtitle = body.hero_subtitle;
    if (body.hero_description !== undefined) updateData.hero_description = body.hero_description;
    if (body.hero_button_text !== undefined) updateData.hero_button_text = body.hero_button_text;
    if (body.hero_image_url !== undefined) updateData.hero_image_url = body.hero_image_url;

    // Pricing
    if (body.display_price !== undefined) updateData.display_price = body.display_price;
    if (body.display_original_price !== undefined) updateData.display_original_price = body.display_original_price;
    if (body.display_savings !== undefined) updateData.display_savings = body.display_savings;

    // Letter
    if (body.show_letter !== undefined) updateData.show_letter = body.show_letter;
    if (body.letter_content !== undefined) updateData.letter_content = body.letter_content;
    if (body.letter_signature_text !== undefined) updateData.letter_signature_text = body.letter_signature_text;
    if (body.letter_image_url !== undefined) updateData.letter_image_url = body.letter_image_url;

    // Features
    if (body.feature_heading !== undefined) updateData.feature_heading = body.feature_heading;
    if (body.feature_bullets !== undefined) updateData.feature_bullets = body.feature_bullets;
    if (body.feature_image_url !== undefined) updateData.feature_image_url = body.feature_image_url;

    // Additional Services
    if (body.show_additional_services !== undefined) updateData.show_additional_services = body.show_additional_services;
    if (body.additional_services_heading !== undefined) updateData.additional_services_heading = body.additional_services_heading;
    if (body.additional_services !== undefined) updateData.additional_services = body.additional_services;
    if (body.additional_services_image_url !== undefined) updateData.additional_services_image_url = body.additional_services_image_url;

    // FAQ
    if (body.show_faq !== undefined) updateData.show_faq = body.show_faq;
    if (body.faq_heading !== undefined) updateData.faq_heading = body.faq_heading;
    if (body.faq_items !== undefined) updateData.faq_items = body.faq_items;

    // Header
    if (body.header_primary_button_text !== undefined) updateData.header_primary_button_text = body.header_primary_button_text;
    if (body.header_secondary_button_text !== undefined) updateData.header_secondary_button_text = body.header_secondary_button_text;
    if (body.show_header_cta !== undefined) updateData.show_header_cta = body.show_header_cta;

    // Brand overrides
    if (body.override_logo_url !== undefined) updateData.override_logo_url = body.override_logo_url;
    if (body.override_primary_color !== undefined) updateData.override_primary_color = body.override_primary_color;
    if (body.override_secondary_color !== undefined) updateData.override_secondary_color = body.override_secondary_color;
    if (body.override_phone !== undefined) updateData.override_phone = body.override_phone;
    if (body.accent_color_preference !== undefined) updateData.accent_color_preference = body.accent_color_preference;

    // Footer
    if (body.footer_company_tagline !== undefined) updateData.footer_company_tagline = body.footer_company_tagline;
    if (body.footer_links !== undefined) updateData.footer_links = body.footer_links;

    // Terms
    if (body.terms_content !== undefined) updateData.terms_content = body.terms_content;

    // Redemption Card
    if (body.redemption_card_heading !== undefined) updateData.redemption_card_heading = body.redemption_card_heading;

    // Add updated_at timestamp
    updateData.updated_at = new Date().toISOString();

    // Update landing page data
    const { data: landingPage, error: updateError } = await supabase
      .from('campaign_landing_pages')
      .update(updateData)
      .eq('campaign_id', campaign.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating landing page:', updateError);
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 }
      );
    }

    // Also update service_plan_id on campaigns table if provided
    if (body.service_plan_id !== undefined) {
      const { error: campaignUpdateError } = await supabase
        .from('campaigns')
        .update({ service_plan_id: body.service_plan_id })
        .eq('campaign_id', campaignId);

      if (campaignUpdateError) {
        console.error('Error updating service_plan_id:', campaignUpdateError);
        // Don't fail the whole request, just log it
      }
    }

    return NextResponse.json({
      success: true,
      data: landingPage,
    });
  } catch (error) {
    console.error('Error in PUT /api/campaigns/[id]/landing-page:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
