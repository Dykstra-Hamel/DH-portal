import { NextRequest, NextResponse } from 'next/server';
import { validateUnsubscribeToken, markTokenAsUsed } from '@/lib/suppression/tokens';
import { addToSuppressionList, addPhoneToSuppressionList } from '@/lib/suppression';
import { createAdminClient } from '@/lib/supabase/server-admin';

export const dynamic = 'force-dynamic';

/**
 * POST /api/unsubscribe/one-click?token=<token>
 *
 * RFC 8058 one-click unsubscribe endpoint.
 *
 * Email clients (Gmail, Outlook, Yahoo Mail) POST directly to this URL when
 * the user clicks the "Unsubscribe" button surfaced from the List-Unsubscribe
 * header. The token is supplied as a query parameter and the request body will
 * contain "List-Unsubscribe=One-Click" (application/x-www-form-urlencoded).
 *
 * This endpoint must:
 *  - Return 200 on success (email clients retry on non-2xx responses)
 *  - Perform the unsubscribe without any user interaction required
 *  - Be idempotent (re-posting the same token should not error)
 */
export async function POST(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const tokenResult = await validateUnsubscribeToken(token);

    if (!tokenResult.success || !tokenResult.data) {
      // Return 200 anyway — if the token is already used the unsubscribe
      // already happened; we don't want email clients to keep retrying.
      return NextResponse.json(
        { message: tokenResult.error || 'Token already processed' },
        { status: 200 }
      );
    }

    const { companyId, customerId, email, phoneNumber } = tokenResult.data;

    if (email) {
      await addToSuppressionList(
        email,
        companyId,
        'manual',
        'unsubscribe',
        null,
        'Unsubscribed via one-click (List-Unsubscribe header)',
        'marketing'
      );
    }

    if (phoneNumber) {
      await addPhoneToSuppressionList(
        phoneNumber,
        companyId,
        'marketing',
        'manual',
        'unsubscribe',
        'Unsubscribed via one-click (List-Unsubscribe header)'
      );
    }

    await markTokenAsUsed(token);

    if (customerId) {
      const supabase = createAdminClient();
      await supabase
        .from('customers')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', customerId);
    }

    return NextResponse.json({ success: true, message: 'Successfully unsubscribed' });
  } catch (error) {
    console.error('Error processing one-click unsubscribe:', error);
    return NextResponse.json(
      { error: 'Failed to process unsubscribe request' },
      { status: 500 }
    );
  }
}
