import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { CreateQuoteRequest } from '@/types/quote';

/**
 * Ensures a quote exists for a lead. Creates one if missing.
 * Used when lead reaches 'quoted' status.
 */
async function ensureQuoteExists(leadId: string) {
  const supabase = createAdminClient();

  // Check if quote already exists
  const { data: existingQuote } = await supabase
    .from('quotes')
    .select('id')
    .eq('lead_id', leadId)
    .single();

  if (existingQuote) {
    return { success: true, quoteId: existingQuote.id, created: false };
  }

  // Fetch lead data
  const { data: lead, error: leadError } = await supabase
    .from('leads')
    .select(`
      id,
      company_id,
      customer_id,
      service_address_id,
      pest_type,
      additional_pests,
      primary_service_address:service_addresses(
        id,
        home_size_range,
        yard_size_range
      )
    `)
    .eq('id', leadId)
    .single();

  if (leadError || !lead) {
    console.error('Error fetching lead for quote creation:', leadError);
    return { success: false, error: 'Lead not found' };
  }

  // Create minimal quote
  const serviceAddress = Array.isArray(lead.primary_service_address)
    ? lead.primary_service_address[0]
    : lead.primary_service_address;

  const { data: newQuote, error: createError } = await supabase
    .from('quotes')
    .insert({
      lead_id: leadId,
      company_id: lead.company_id,
      customer_id: lead.customer_id,
      service_address_id: lead.service_address_id,
      primary_pest: lead.pest_type,
      additional_pests: lead.additional_pests || [],
      home_size_range: serviceAddress?.home_size_range,
      yard_size_range: serviceAddress?.yard_size_range,
      total_initial_price: 0,
      total_recurring_price: 0,
      quote_status: 'draft',
    })
    .select()
    .single();

  if (createError) {
    console.error('Error creating quote:', createError);
    return { success: false, error: 'Failed to create quote' };
  }

  return { success: true, quoteId: newQuote.id, created: true };
}

// GET: Fetch quote for a lead
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Lead ID is required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Fetch the quote with line items
    const { data: quote, error } = await supabase
      .from('quotes')
      .select(`
        *,
        line_items:quote_line_items(*)
      `)
      .eq('lead_id', id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No quote found - check if lead is in quoted status and auto-create
        const { data: lead } = await supabase
          .from('leads')
          .select('lead_status')
          .eq('id', id)
          .single();

        if (lead && lead.lead_status === 'quoted') {
          // Auto-create quote
          const result = await ensureQuoteExists(id);
          if (result.success && result.quoteId) {
            // Fetch the newly created quote
            const { data: newQuote } = await supabase
              .from('quotes')
              .select(`
                *,
                line_items:quote_line_items(*)
              `)
              .eq('id', result.quoteId)
              .single();

            return NextResponse.json({
              success: true,
              data: newQuote,
              message: 'Quote created automatically',
            });
          }
        }

        return NextResponse.json({
          success: true,
          data: null,
          message: 'No quote found for this lead',
        });
      }

      console.error('Error fetching quote:', error);
      return NextResponse.json(
        { error: 'Failed to fetch quote' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: quote,
    });
  } catch (error) {
    console.error('Error in quote GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Create or update quote for a lead
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: leadId } = await params;
    const body: CreateQuoteRequest = await request.json();

    if (!leadId) {
      return NextResponse.json(
        { error: 'Lead ID is required' },
        { status: 400 }
      );
    }

    if (!body.service_plans || body.service_plans.length === 0) {
      return NextResponse.json(
        { error: 'At least one service plan is required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Fetch the lead with related data
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select(`
        id,
        company_id,
        customer_id,
        service_address_id,
        pest_type,
        additional_pests,
        primary_service_address:service_addresses(
          id,
          home_size_range,
          yard_size_range
        )
      `)
      .eq('id', leadId)
      .single();

    if (leadError || !lead) {
      console.error('Error fetching lead:', leadError);
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    // Fetch service plans with pricing
    const planIds = body.service_plans.map(p => p.service_plan_id);
    const { data: servicePlans, error: plansError } = await supabase
      .from('service_plans')
      .select('*')
      .in('id', planIds);

    if (plansError || !servicePlans || servicePlans.length === 0) {
      console.error('Error fetching service plans:', plansError);
      return NextResponse.json(
        { error: 'Service plans not found' },
        { status: 404 }
      );
    }

    // Calculate total pricing and prepare line items
    let totalInitialPrice = 0;
    let totalRecurringPrice = 0;

    const lineItems = body.service_plans.map((planRequest, index) => {
      const plan = servicePlans.find(p => p.id === planRequest.service_plan_id);
      if (!plan) {
        throw new Error(`Service plan ${planRequest.service_plan_id} not found`);
      }

      const initialPrice = plan.initial_price || 0;
      const recurringPrice = plan.recurring_price || 0;

      // Apply discounts
      const discountAmount = planRequest.discount_amount || 0;
      const discountPercentage = planRequest.discount_percentage || 0;

      // Calculate final prices
      let finalInitialPrice = initialPrice - discountAmount;
      if (discountPercentage > 0) {
        finalInitialPrice = finalInitialPrice * (1 - discountPercentage / 100);
      }

      let finalRecurringPrice = recurringPrice - discountAmount;
      if (discountPercentage > 0) {
        finalRecurringPrice = finalRecurringPrice * (1 - discountPercentage / 100);
      }

      // Ensure prices don't go negative
      finalInitialPrice = Math.max(0, finalInitialPrice);
      finalRecurringPrice = Math.max(0, finalRecurringPrice);

      totalInitialPrice += finalInitialPrice;
      totalRecurringPrice += finalRecurringPrice;

      return {
        service_plan_id: plan.id,
        plan_name: plan.plan_name,
        plan_description: plan.plan_description,
        initial_price: initialPrice,
        recurring_price: recurringPrice,
        billing_frequency: plan.billing_frequency,
        discount_percentage: discountPercentage,
        discount_amount: discountAmount,
        final_initial_price: finalInitialPrice,
        final_recurring_price: finalRecurringPrice,
        display_order: index,
      };
    });

    // Check if quote already exists
    const { data: existingQuote } = await supabase
      .from('quotes')
      .select('id')
      .eq('lead_id', leadId)
      .single();

    let quote;

    // Extract service address from array
    const serviceAddress = Array.isArray(lead.primary_service_address)
      ? lead.primary_service_address[0]
      : lead.primary_service_address;

    if (existingQuote) {
      // Update existing quote
      const { data: updatedQuote, error: updateError } = await supabase
        .from('quotes')
        .update({
          primary_pest: lead.pest_type,
          additional_pests: lead.additional_pests || [],
          home_size_range: serviceAddress?.home_size_range,
          yard_size_range: serviceAddress?.yard_size_range,
          total_initial_price: totalInitialPrice,
          total_recurring_price: totalRecurringPrice,
        })
        .eq('id', existingQuote.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating quote:', updateError);
        return NextResponse.json(
          { error: 'Failed to update quote' },
          { status: 500 }
        );
      }

      // Delete old line items
      await supabase
        .from('quote_line_items')
        .delete()
        .eq('quote_id', existingQuote.id);

      quote = updatedQuote;
    } else {
      // Create new quote
      const { data: newQuote, error: createError } = await supabase
        .from('quotes')
        .insert({
          lead_id: leadId,
          company_id: lead.company_id,
          customer_id: lead.customer_id,
          service_address_id: lead.service_address_id,
          primary_pest: lead.pest_type,
          additional_pests: lead.additional_pests || [],
          home_size_range: serviceAddress?.home_size_range,
          yard_size_range: serviceAddress?.yard_size_range,
          total_initial_price: totalInitialPrice,
          total_recurring_price: totalRecurringPrice,
          quote_status: 'draft',
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating quote:', createError);
        return NextResponse.json(
          { error: 'Failed to create quote' },
          { status: 500 }
        );
      }

      quote = newQuote;
    }

    // Insert line items
    const lineItemsWithQuoteId = lineItems.map(item => ({
      ...item,
      quote_id: quote.id,
    }));

    const { error: lineItemsError } = await supabase
      .from('quote_line_items')
      .insert(lineItemsWithQuoteId);

    if (lineItemsError) {
      console.error('Error creating line items:', lineItemsError);
      return NextResponse.json(
        { error: 'Failed to create quote line items' },
        { status: 500 }
      );
    }

    // Fetch the complete quote with line items
    const { data: completeQuote } = await supabase
      .from('quotes')
      .select(`
        *,
        line_items:quote_line_items(*)
      `)
      .eq('id', quote.id)
      .single();

    return NextResponse.json({
      success: true,
      data: completeQuote,
      message: existingQuote ? 'Quote updated successfully' : 'Quote created successfully',
    });
  } catch (error) {
    console.error('Error in quote POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}