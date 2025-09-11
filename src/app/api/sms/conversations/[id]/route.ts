import { NextRequest, NextResponse } from 'next/server';
import { smsService } from '@/lib/sms-service';
import { createAdminClient } from '@/lib/supabase/server-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();

    // Get conversation details
    const { data: conversation, error: conversationError } = await supabase
      .from('sms_conversations')
      .select('*')
      .eq('id', id)
      .single();

    if (conversationError || !conversation) {
      return NextResponse.json(
        { success: false, error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Get messages for this conversation
    const messages = await smsService.getConversationMessages(id);

    return NextResponse.json({
      success: true,
      conversation,
      messages,
      messageCount: messages.length
    });

  } catch (error) {
    console.error('Error fetching SMS conversation:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { status, endReason } = await request.json();

    if (!status || !['active', 'completed', 'failed'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Valid status is required (active, completed, failed)' },
        { status: 400 }
      );
    }

    const success = await smsService.updateConversationStatus(id, status, endReason);

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to update conversation status' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error updating SMS conversation:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}