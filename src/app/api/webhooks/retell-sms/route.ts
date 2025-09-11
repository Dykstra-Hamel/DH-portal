import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';

interface RetellSMSWebhookPayload {
  event: string;
  chat_id: string; // Retell uses chat_id for SMS conversations
  agent_id?: string;
  customer_number?: string;
  retell_number?: string;
  message?: {
    id: string;
    content: string;
    direction: 'inbound' | 'outbound';
    sender: string;
    recipient: string;
    timestamp: string;
    status?: 'sent' | 'delivered' | 'failed';
    error_message?: string;
  };
  conversation?: {
    status: 'active' | 'completed' | 'failed';
    ended_at?: string;
    end_reason?: string;
  };
  metadata?: Record<string, any>;
}

export async function POST(request: NextRequest) {
  try {
    // Verify the webhook is from Retell with proper authentication
    const authHeader = request.headers.get('authorization');
    const retellWebhookSecret = process.env.RETELL_WEBHOOK_SECRET;
    
    if (!retellWebhookSecret) {
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }
    
    // Validate authorization header
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('Retell SMS Webhook: Missing or invalid authorization header');
      return NextResponse.json(
        { error: 'Unauthorized - missing bearer token' },
        { status: 401 }
      );
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    // Use constant-time comparison to prevent timing attacks
    const expectedToken = Buffer.from(retellWebhookSecret, 'utf8');
    const providedToken = Buffer.from(token, 'utf8');
    
    // Ensure buffers are the same length to prevent length-based timing attacks
    if (expectedToken.length !== providedToken.length) {
      console.error('Retell SMS Webhook: Invalid webhook secret');
      return NextResponse.json(
        { error: 'Unauthorized - invalid token' },
        { status: 401 }
      );
    }
    
    // Use crypto.timingSafeEqual for constant-time comparison
    const { timingSafeEqual } = await import('crypto');
    if (!timingSafeEqual(expectedToken, providedToken)) {
      console.error('Retell SMS Webhook: Invalid webhook secret');
      return NextResponse.json(
        { error: 'Unauthorized - invalid token' },
        { status: 401 }
      );
    }

    const payload: RetellSMSWebhookPayload = await request.json();
    const supabase = createAdminClient();
    
    console.log('Received Retell SMS webhook:', payload.event, payload.chat_id);

    // Validate required fields
    if (!payload.event || !payload.chat_id) {
      console.error('Invalid webhook payload: missing event or chat_id');
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Find the conversation in our database
    const { data: conversation, error: conversationError } = await supabase
      .from('sms_conversations')
      .select('*')
      .eq('sms_id', payload.chat_id)
      .single();

    if (conversationError) {
      console.error('Conversation not found for SMS ID:', payload.chat_id);
      // Still log the event even if we don't have the conversation record
      await logSMSEvent(supabase, null, payload);
      return NextResponse.json({ status: 'conversation_not_found' }, { status: 200 });
    }

    // Log the webhook event
    await logSMSEvent(supabase, conversation.id, payload);

    // Handle different event types
    switch (payload.event) {
      case 'chat_message':
        await handleSMSMessage(supabase, conversation, payload);
        break;
      
      case 'chat_started':
        await handleConversationStarted(supabase, conversation, payload);
        break;
      
      case 'chat_ended':
        await handleConversationEnded(supabase, conversation, payload);
        break;
      
      case 'message_delivery_status':
        await handleDeliveryStatus(supabase, conversation, payload);
        break;
      
      default:
        console.log('Unknown SMS event type:', payload.event);
    }

    return NextResponse.json({ status: 'success' }, { status: 200 });

  } catch (error) {
    console.error('Error processing Retell SMS webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

async function handleSMSMessage(
  supabase: any, 
  conversation: any, 
  payload: RetellSMSWebhookPayload
) {
  if (!payload.message) {
    console.error('SMS message event missing message data');
    return;
  }

  const message = payload.message;
  
  try {
    // Insert message into database
    const { error: messageError } = await supabase
      .from('sms_messages')
      .insert([
        {
          conversation_id: conversation.id,
          direction: message.direction,
          content: message.content,
          message_id: message.id,
          sender_number: message.sender,
          recipient_number: message.recipient,
          status: message.status || 'sent',
          error_message: message.error_message || null,
          created_at: new Date(message.timestamp).toISOString(),
          delivered_at: message.status === 'delivered' ? new Date().toISOString() : null,
          failed_at: message.status === 'failed' ? new Date().toISOString() : null,
        },
      ]);

    if (messageError) {
      console.error('Error inserting SMS message:', messageError);
    } else {
      console.log('SMS message saved:', {
        conversation_id: conversation.id,
        direction: message.direction,
        content_length: message.content.length
      });
    }

    // Update conversation's updated_at timestamp
    await supabase
      .from('sms_conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversation.id);

    // Handle inbound messages (future: could trigger automations here)
    if (message.direction === 'inbound') {
      await handleInboundMessage(supabase, conversation, message);
    }

  } catch (error) {
    console.error('Error handling SMS message:', error);
  }
}

async function handleConversationStarted(
  supabase: any, 
  conversation: any, 
  payload: RetellSMSWebhookPayload
) {
  try {
    // Update conversation status if needed
    if (conversation.status !== 'active') {
      await supabase
        .from('sms_conversations')
        .update({ 
          status: 'active',
          updated_at: new Date().toISOString() 
        })
        .eq('id', conversation.id);
    }

    console.log('SMS conversation started:', conversation.id);
  } catch (error) {
    console.error('Error handling conversation started:', error);
  }
}

async function handleConversationEnded(
  supabase: any, 
  conversation: any, 
  payload: RetellSMSWebhookPayload
) {
  try {
    const endedAt = payload.conversation?.ended_at 
      ? new Date(payload.conversation.ended_at).toISOString()
      : new Date().toISOString();

    // Update conversation status
    await supabase
      .from('sms_conversations')
      .update({ 
        status: payload.conversation?.status || 'completed',
        ended_at: endedAt,
        updated_at: new Date().toISOString(),
        metadata: {
          ...conversation.metadata,
          end_reason: payload.conversation?.end_reason,
        }
      })
      .eq('id', conversation.id);

    console.log('SMS conversation ended:', {
      conversation_id: conversation.id,
      end_reason: payload.conversation?.end_reason
    });
  } catch (error) {
    console.error('Error handling conversation ended:', error);
  }
}

async function handleDeliveryStatus(
  supabase: any, 
  conversation: any, 
  payload: RetellSMSWebhookPayload
) {
  if (!payload.message?.id) {
    console.error('Delivery status event missing message ID');
    return;
  }

  try {
    // Update message status
    const updateData: any = {
      status: payload.message.status,
    };

    if (payload.message.status === 'delivered') {
      updateData.delivered_at = new Date().toISOString();
    } else if (payload.message.status === 'failed') {
      updateData.failed_at = new Date().toISOString();
      updateData.error_message = payload.message.error_message;
    }

    await supabase
      .from('sms_messages')
      .update(updateData)
      .eq('message_id', payload.message.id)
      .eq('conversation_id', conversation.id);

    console.log('Message delivery status updated:', {
      message_id: payload.message.id,
      status: payload.message.status
    });
  } catch (error) {
    console.error('Error handling delivery status:', error);
  }
}

async function handleInboundMessage(
  supabase: any, 
  conversation: any, 
  message: any
) {
  try {
    // Future: Implement inbound message handling logic
    // This could include:
    // - Notifying team members
    // - Analyzing message content for keywords
    // - Triggering follow-up automations
    
    console.log('Processing inbound SMS message:', {
      conversation_id: conversation.id,
      customer_number: conversation.customer_number,
      content_preview: message.content.substring(0, 50) + '...'
    });

  } catch (error) {
    console.error('Error handling inbound message:', error);
  }
}

async function logSMSEvent(
  supabase: any, 
  conversationId: string | null, 
  payload: RetellSMSWebhookPayload
) {
  try {
    await supabase
      .from('sms_logs')
      .insert([
        {
          conversation_id: conversationId,
          event_type: payload.event,
          payload: payload,
        },
      ]);
  } catch (error) {
    console.error('Error logging SMS event:', error);
  }
}

// GET method for webhook verification (if needed)
export async function GET(request: NextRequest) {
  // This can be used for webhook verification if Retell requires it
  const searchParams = request.nextUrl.searchParams;
  const challenge = searchParams.get('challenge');
  
  if (challenge) {
    return NextResponse.json({ challenge }, { status: 200 });
  }
  
  return NextResponse.json({ status: 'SMS webhook endpoint is active' }, { status: 200 });
}