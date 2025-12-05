import { NextRequest, NextResponse } from 'next/server';
import { validateUnsubscribeToken, markTokenAsUsed } from '@/lib/suppression/tokens';
import { addToSuppressionList, addPhoneToSuppressionList } from '@/lib/suppression';
import { createAdminClient } from '@/lib/supabase/server-admin';

export const dynamic = 'force-dynamic';

/**
 * POST /api/unsubscribe
 *
 * Public endpoint for processing unsubscribe requests
 * No authentication required - uses secure token validation
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, preferences } = body;

    // Validate required fields
    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    if (!preferences || typeof preferences !== 'object') {
      return NextResponse.json(
        { error: 'Preferences are required' },
        { status: 400 }
      );
    }

    // Validate the token
    const tokenResult = await validateUnsubscribeToken(token);

    if (!tokenResult.success || !tokenResult.data) {
      return NextResponse.json(
        { error: tokenResult.error || 'Invalid or expired token' },
        { status: 400 }
      );
    }

    const tokenData = tokenResult.data;
    const { companyId, customerId, email, phoneNumber } = tokenData;

    // Log token data for debugging
    console.log('Unsubscribe request:', {
      preferences,
      tokenData: {
        companyId,
        customerId,
        hasEmail: !!email,
        hasPhone: !!phoneNumber,
      },
    });

    // Process unsubscribe preferences
    const results = {
      email: false,
      phone: false,
      sms: false,
      all: false,
    };

    // Unsubscribe from email communications
    if (preferences.email && email) {
      const result = await addToSuppressionList(
        email,
        companyId,
        'manual',
        'unsubscribe',
        null,
        'Unsubscribed via unsubscribe link',
        'email'
      );
      results.email = result.success;
      console.log('Created email suppression:', result.success);
    }

    // Unsubscribe from phone calls
    if (preferences.phone && phoneNumber) {
      const result = await addPhoneToSuppressionList(
        phoneNumber,
        companyId,
        'phone',
        'manual',
        'unsubscribe',
        'Unsubscribed via unsubscribe link'
      );
      results.phone = result.success;
    }

    // Unsubscribe from SMS
    if (preferences.sms && phoneNumber) {
      const result = await addPhoneToSuppressionList(
        phoneNumber,
        companyId,
        'sms',
        'manual',
        'unsubscribe',
        'Unsubscribed via unsubscribe link'
      );
      results.sms = result.success;
    }

    // Unsubscribe from all communications
    if (preferences.all) {
      if (email) {
        const emailResult = await addToSuppressionList(
          email,
          companyId,
          'manual',
          'unsubscribe',
          null,
          'Unsubscribed from all communications via unsubscribe link',
          'all'
        );
        results.email = emailResult.success;
        console.log('Created email suppression (all):', emailResult.success);
      }

      if (phoneNumber) {
        const phoneResult = await addPhoneToSuppressionList(
          phoneNumber,
          companyId,
          'all',
          'manual',
          'unsubscribe',
          'Unsubscribed from all communications via unsubscribe link'
        );
        results.phone = phoneResult.success;
        results.sms = phoneResult.success;
        console.log('Created phone suppression (all):', phoneResult.success);
      } else {
        console.log('No phone number in token - skipping phone suppression');
      }

      results.all = true;
    }

    console.log('Suppression results:', results);

    // Mark token as used
    await markTokenAsUsed(token);

    // Log the unsubscribe action (optional - for audit trail)
    const supabase = createAdminClient();

    // Update customer record to indicate unsubscribe (if customer_id exists)
    if (customerId) {
      await supabase
        .from('customers')
        .update({
          updated_at: new Date().toISOString(),
        })
        .eq('id', customerId);
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully unsubscribed',
      results,
    });

  } catch (error) {
    console.error('Error processing unsubscribe:', error);
    return NextResponse.json(
      { error: 'Failed to process unsubscribe request' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/unsubscribe?token=xyz
 *
 * Validate a token and return associated data
 * Used by the unsubscribe page to display customer info
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    // Validate the token
    const tokenResult = await validateUnsubscribeToken(token);

    if (!tokenResult.success || !tokenResult.data) {
      return NextResponse.json(
        { error: tokenResult.error || 'Invalid or expired token' },
        { status: 400 }
      );
    }

    const tokenData = tokenResult.data;

    // Get customer name if customer_id exists
    let customerName = null;
    if (tokenData.customerId) {
      const supabase = createAdminClient();
      const { data: customer } = await supabase
        .from('customers')
        .select('first_name, last_name')
        .eq('id', tokenData.customerId)
        .single();

      if (customer) {
        customerName = `${customer.first_name} ${customer.last_name}`.trim();
      }
    }

    // Return safe token data (don't expose sensitive info)
    return NextResponse.json({
      success: true,
      data: {
        email: tokenData.email,
        phoneNumber: tokenData.phoneNumber,
        customerName,
        source: tokenData.source,
      },
    });

  } catch (error) {
    console.error('Error validating unsubscribe token:', error);
    return NextResponse.json(
      { error: 'Failed to validate token' },
      { status: 500 }
    );
  }
}
