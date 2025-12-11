import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/api-utils';

/**
 * POST /api/campaigns/[id]/clone
 *
 * Clones an existing campaign with all configuration, landing page, and optionally contact list assignments.
 * Resets IDs, counters, timestamps, and execution state.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sourceCampaignId } = await params;

    // Authentication & Authorization
    const authResult = await getAuthenticatedUser();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user, isGlobalAdmin, supabase } = authResult;

    // Parse request body
    const body = await request.json();
    const {
      new_name,
      new_campaign_id,
      copy_contact_lists = false, // Don't copy contact lists by default
    } = body;

    // Load source campaign
    const { data: sourceCampaign, error: fetchError } = await supabase
      .from('campaigns')
      .select(
        `
        *,
        workflow:automation_workflows(id),
        discount:company_discounts(id),
        service_plan:service_plans(id)
      `
      )
      .eq('id', sourceCampaignId)
      .single();

    if (fetchError || !sourceCampaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Check user has access to source campaign's company (skip for global admins)
    if (!isGlobalAdmin) {
      const { data: userCompany } = await supabase
        .from('user_companies')
        .select('role')
        .eq('user_id', user.id)
        .eq('company_id', sourceCampaign.company_id)
        .single();

      if (!userCompany) {
        return NextResponse.json(
          { error: 'Unauthorized - user not associated with company' },
          { status: 403 }
        );
      }

      // Require admin, manager, or owner role to clone campaigns
      if (!['admin', 'manager', 'owner'].includes(userCompany.role)) {
        return NextResponse.json(
          {
            error: 'Unauthorized - insufficient permissions to clone campaigns',
          },
          { status: 403 }
        );
      }
    }

    // Generate unique identifiers with auto-increment for default names
    let clonedName = new_name;
    let attempt = 0;
    const maxAttempts = 50;

    if (!new_name) {
      // Auto-generate and auto-increment name only if not provided by user
      const baseName = `${sourceCampaign.name} (Copy)`;

      while (attempt < maxAttempts) {
        clonedName =
          attempt === 0
            ? baseName
            : `${sourceCampaign.name} (Copy ${attempt + 1})`;

        const { data: conflict } = await supabase
          .from('campaigns')
          .select('id')
          .eq('company_id', sourceCampaign.company_id)
          .eq('name', clonedName)
          .maybeSingle();

        if (!conflict) break;
        attempt++;
      }

      if (attempt >= maxAttempts) {
        // Fallback to timestamp-based name
        clonedName = `${sourceCampaign.name} (Copy ${Date.now()})`;
      }
    } else {
      // User provided custom name - check uniqueness only once, return error if conflict
      const { data: conflict } = await supabase
        .from('campaigns')
        .select('id')
        .eq('company_id', sourceCampaign.company_id)
        .eq('name', clonedName)
        .maybeSingle();

      if (conflict) {
        return NextResponse.json(
          {
            success: false,
            error: 'Campaign name already exists in this company',
            suggestions: [
              `${clonedName} 2`,
              `${clonedName} ${new Date().toISOString().split('T')[0]}`,
            ],
          },
          { status: 400 }
        );
      }
    }

    let clonedCampaignId = new_campaign_id;

    // If no campaign_id provided, generate from name
    if (!clonedCampaignId) {
      // Generate ID from name: uppercase, remove special chars, add timestamp
      const baseName = clonedName
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .substring(0, 15);
      const timestamp = Date.now().toString().substring(-6);
      clonedCampaignId = `${baseName}${timestamp}`;
    }

    // Validate uniqueness of campaign_id (global)
    const { data: idConflict } = await supabase
      .from('campaigns')
      .select('id')
      .eq('campaign_id', clonedCampaignId)
      .single();

    if (idConflict) {
      return NextResponse.json(
        {
          success: false,
          error: 'Campaign ID already exists',
          suggestions: [
            `${clonedCampaignId}_COPY`,
            `${clonedCampaignId}_${Date.now().toString().substring(-4)}`,
          ],
        },
        { status: 400 }
      );
    }

    // Clone campaign record
    const { data: clonedCampaign, error: cloneError } = await supabase
      .from('campaigns')
      .insert({
        // Copy configuration fields
        company_id: sourceCampaign.company_id,
        name: clonedName,
        campaign_id: clonedCampaignId,
        description: sourceCampaign.description,
        campaign_type: sourceCampaign.campaign_type,
        workflow_id: sourceCampaign.workflow_id,
        discount_id: sourceCampaign.discount_id,
        service_plan_id: sourceCampaign.service_plan_id,
        target_audience_type: sourceCampaign.target_audience_type,
        audience_filter_criteria: sourceCampaign.audience_filter_criteria,
        batch_size: sourceCampaign.batch_size,
        batch_interval_minutes: sourceCampaign.batch_interval_minutes,
        daily_limit: sourceCampaign.daily_limit,
        respect_business_hours: sourceCampaign.respect_business_hours,
        exclude_weekends: sourceCampaign.exclude_weekends,

        // Reset/Generate new fields
        status: 'draft', // Always start as draft
        start_datetime: sourceCampaign.start_datetime, // Copy from source (user can change in editor)
        end_datetime: sourceCampaign.end_datetime,
        total_contacts: 0,
        processed_contacts: 0,
        successful_contacts: 0,
        failed_contacts: 0,
        estimated_days: null,
        current_batch: 0,
        last_batch_sent_at: null,
        contacts_sent_today: 0,
        current_day_date: null,
        created_by: user.id,
        // created_at and updated_at set by database
      })
      .select(
        `
        *,
        workflow:automation_workflows(
          id,
          name,
          workflow_type
        ),
        discount:company_discounts(
          id,
          discount_name,
          discount_type,
          discount_value
        )
      `
      )
      .single();

    if (cloneError) {
      console.error('Error cloning campaign:', cloneError);
      return NextResponse.json(
        {
          error: 'Failed to clone campaign',
          details: cloneError.message,
        },
        { status: 500 }
      );
    }

    const warnings: string[] = [];

    // Clone landing page (if exists)
    try {
      const { data: sourceLandingPage } = await supabase
        .from('campaign_landing_pages')
        .select('*')
        .eq('campaign_id', sourceCampaign.id)
        .single();

      if (sourceLandingPage) {
        // Remove id, campaign_id, created_at, updated_at from source data
        const {
          id: _,
          campaign_id: __,
          created_at: ___,
          updated_at: ____,
          ...landingPageFields
        } = sourceLandingPage;

        const { error: lpError } = await supabase
          .from('campaign_landing_pages')
          .insert({
            ...landingPageFields,
            campaign_id: clonedCampaign.id, // Link to cloned campaign using UUID
          });

        if (lpError) {
          console.error('Error cloning landing page:', lpError);
          warnings.push(
            'Landing page could not be cloned. You can set it up manually.'
          );
        }
      }
    } catch (lpCatchError) {
      console.error('Error in landing page cloning process:', lpCatchError);
      warnings.push(
        'Landing page could not be cloned. You can set it up manually.'
      );
    }

    // Clone contact list assignments (if requested)
    if (copy_contact_lists) {
      try {
        const { data: sourceAssignments } = await supabase
          .from('campaign_contact_list_assignments')
          .select('contact_list_id')
          .eq('campaign_id', sourceCampaign.id);

        if (sourceAssignments && sourceAssignments.length > 0) {
          // Insert assignments for cloned campaign
          const assignmentsToInsert = sourceAssignments.map(
            (assignment: { contact_list_id: string }) => ({
              campaign_id: clonedCampaign.id,
              contact_list_id: assignment.contact_list_id,
              assigned_by: user.id,
              // assigned_at set by database
            })
          );

          const { error: assignError } = await supabase
            .from('campaign_contact_list_assignments')
            .insert(assignmentsToInsert);

          if (assignError) {
            console.error(
              'Error cloning contact list assignments:',
              assignError
            );
            warnings.push(
              'Contact lists could not be linked. You can add them manually.'
            );
          }
        }
      } catch (clCatchError) {
        console.error('Error in contact list cloning process:', clCatchError);
        warnings.push(
          'Contact lists could not be linked. You can add them manually.'
        );
      }
    }

    // Return success response
    return NextResponse.json(
      {
        success: true,
        campaign: clonedCampaign,
        warnings: warnings.length > 0 ? warnings : undefined,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in campaign clone endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
