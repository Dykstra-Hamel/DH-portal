import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();

    // Get conversation details to retrieve sms_id and company_id
    const { data: conversation, error: conversationError } = await supabase
      .from('sms_conversations')
      .select('id, sms_id, company_id')
      .eq('id', id)
      .single();

    if (conversationError || !conversation) {
      return NextResponse.json(
        { success: false, error: 'Conversation not found' },
        { status: 404 }
      );
    }

    if (!conversation.sms_id) {
      return NextResponse.json(
        { success: false, error: 'No Retell chat ID associated with this conversation' },
        { status: 404 }
      );
    }

    // Get Retell API key from company settings (stays server-side)
    const { data: apiKeySetting } = await supabase
      .from('company_settings')
      .select('setting_value')
      .eq('company_id', conversation.company_id)
      .eq('setting_key', 'retell_api_key')
      .single();

    if (!apiKeySetting?.setting_value) {
      return NextResponse.json(
        { success: false, error: 'Retell API key not configured for this company' },
        { status: 500 }
      );
    }

    // Fetch transcript from Retell API
    const retellResponse = await fetch(
      `https://api.retellai.com/get-chat/${conversation.sms_id}`,
      {
        headers: {
          Authorization: `Bearer ${apiKeySetting.setting_value}`,
        },
      }
    );

    if (!retellResponse.ok) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch transcript from Retell' },
        { status: retellResponse.status }
      );
    }

    const retellData = await retellResponse.json();

    return NextResponse.json({
      success: true,
      transcript: retellData.transcript ?? null,
      chat_analysis: retellData.chat_analysis ?? null,
      chat_status: retellData.chat_status ?? null,
      start_timestamp: retellData.start_timestamp ?? null,
      end_timestamp: retellData.end_timestamp ?? null,
    });
  } catch (error) {
    console.error('Error fetching SMS transcript:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
