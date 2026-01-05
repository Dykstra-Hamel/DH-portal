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
    const { token } = body;

    // Validate required fields
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
    const { companyId, customerId, email, phoneNumber } = tokenData;

    // Log token data for debugging
    console.log('Unsubscribe request (marketing):', {
      tokenData: {
        companyId,
        customerId,
        hasEmail: !!email,
        hasPhone: !!phoneNumber,
      },
    });

    // Add to suppression list with 'marketing' communication type
    const results = {
      email: false,
      phone: false,
    };

    if (email) {
      const emailResult = await addToSuppressionList(
        email,
        companyId,
        'manual',
        'unsubscribe',
        null,
        'Unsubscribed from marketing communications via unsubscribe link',
        'marketing'
      );
      results.email = emailResult.success;
      console.log('Created email marketing suppression:', emailResult.success);
    }

    if (phoneNumber) {
      const phoneResult = await addPhoneToSuppressionList(
        phoneNumber,
        companyId,
        'marketing',
        'manual',
        'unsubscribe',
        'Unsubscribed from marketing communications via unsubscribe link'
      );
      results.phone = phoneResult.success;
      console.log('Created phone marketing suppression:', phoneResult.success);
    }

    console.log('Marketing suppression results:', results);

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
