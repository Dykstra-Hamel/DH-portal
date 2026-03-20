import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { inngest } from '@/lib/inngest/client';
import { detectCampaignAttribution, hasRecentResponse } from '@/lib/campaigns/campaign-attribution';

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
  chat_analysis?: {
    user_sentiment?: 'positive' | 'negative' | 'neutral';
    chat_summary?: string;
    custom_analysis_data?: Record<string, any>;
  };
  retell_llm_dynamic_variables?: Record<string, any>;
}

export async function POST(request: NextRequest) {
  try {
    // AUTHENTICATION - Company-Specific (Bearer token method)
    const authHeader = request.headers.get('authorization');

    // Validate authorization header format
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('Retell SMS Webhook: Missing or invalid authorization header');
      return NextResponse.json(
        { error: 'Unauthorized - missing bearer token' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // Parse payload to identify company (needed before we can validate token)
    const payload: RetellSMSWebhookPayload = await request.json();

    // Extract agent ID to identify company
    const agentId = payload.agent_id;

    if (!agentId) {
      console.error('Retell SMS Webhook: No agent_id in payload');
      return NextResponse.json(
        { error: 'agent_id required in payload' },
        { status: 400 }
      );
    }

    // Look up company from agent ID
    const supabase = createAdminClient();
    const { data: agent } = await supabase
      .from('agents')
      .select('company_id')
      .eq('agent_id', agentId)
      .eq('is_active', true)
      .single();

    if (!agent?.company_id) {
      console.error(`Retell SMS Webhook: Company not found for agent: ${agentId}`);
      return NextResponse.json(
        { error: 'Company not found for agent ID' },
        { status: 404 }
      );
    }

    const companyId = agent.company_id;

    // Get company's Retell API key (which is also the webhook secret)
    const { data: apiKeySetting } = await supabase
      .from('company_settings')
      .select('setting_value')
      .eq('company_id', companyId)
      .eq('setting_key', 'retell_api_key')
      .single();

    if (!apiKeySetting?.setting_value) {
      console.error(`Retell SMS Webhook: Retell API key not configured for company: ${companyId}`);
      return NextResponse.json(
        { error: 'Retell API key not configured for company' },
        { status: 500 }
      );
    }

    // Validate token using constant-time comparison to prevent timing attacks
    const expectedToken = Buffer.from(apiKeySetting.setting_value, 'utf8');
    const providedToken = Buffer.from(token, 'utf8');

    // Ensure buffers are the same length to prevent length-based timing attacks
    if (expectedToken.length !== providedToken.length) {
      console.error(`Retell SMS Webhook: Invalid token for company: ${companyId}`);
      return NextResponse.json(
        { error: 'Unauthorized - invalid token' },
        { status: 401 }
      );
    }

    // Use crypto.timingSafeEqual for constant-time comparison
    const { timingSafeEqual } = await import('crypto');
    if (!timingSafeEqual(expectedToken, providedToken)) {
      console.error(`Retell SMS Webhook: Invalid token for company: ${companyId}`);
      return NextResponse.json(
        { error: 'Unauthorized - invalid token' },
        { status: 401 }
      );
    }

    console.log(`✅ Retell SMS Webhook: Token validated for company: ${companyId}`);
    
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

      case 'chat_analyzed':
        await handleChatAnalyzed(supabase, conversation, payload);
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
    console.log('Processing inbound SMS message:', {
      conversation_id: conversation.id,
      customer_number: conversation.customer_number,
      content_preview: message.content.substring(0, 50) + '...'
    });

    // Campaign attribution check for inbound SMS
    if (conversation.customer_id && conversation.company_id) {
      const attribution = await detectCampaignAttribution(
        supabase,
        conversation.customer_id,
        conversation.company_id
      );

      if (attribution) {
        const alreadyResponded = await hasRecentResponse(
          supabase,
          conversation.customer_id,
          attribution.campaignId
        );

        if (!alreadyResponded) {
          await inngest.send({
            name: 'campaign/response-detected',
            data: {
              conversationId: conversation.id,
              campaignId: attribution.campaignId,
              campaignName: attribution.campaignName,
              customerId: conversation.customer_id,
              companyId: conversation.company_id,
              responseType: 'sms',
            },
          });
        }
      }
    }

  } catch (error) {
    console.error('Error handling inbound message:', error);
  }
}

async function handleChatAnalyzed(
  supabase: any,
  conversation: any,
  payload: RetellSMSWebhookPayload
) {
  try {
    const chatAnalysis = payload.chat_analysis;
    const dynamicVariables = payload.retell_llm_dynamic_variables;

    const sentiment = chatAnalysis?.user_sentiment?.toLowerCase() || 'neutral';
    const summary = chatAnalysis?.chat_summary || '';

    // Store analysis in sms_conversations.metadata
    await supabase
      .from('sms_conversations')
      .update({
        status: 'completed',
        metadata: {
          ...conversation.metadata,
          chat_analysis: chatAnalysis || null,
          sentiment,
          summary,
          retell_variables: dynamicVariables || null,
          analyzed_at: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversation.id);

    // Update lead record if conversation is linked to a lead
    if (conversation.lead_id) {
      const { data: lead } = await supabase
        .from('leads')
        .select('id, comments, lead_status')
        .eq('id', conversation.lead_id)
        .single();

      if (lead) {
        const isQualified = dynamicVariables?.is_qualified;
        const updateData: any = {
          comments: lead.comments || '',
          updated_at: new Date().toISOString(),
        };

        if (summary) {
          updateData.comments =
            `${updateData.comments}\n\n💬 SMS Analysis: ${summary}`.trim();
        }

        if (isQualified === 'true' || isQualified === true) {
          updateData.lead_status = 'new';
          updateData.comments =
            `${updateData.comments}\n\n✅ AI Qualification: QUALIFIED - Ready for follow-up`.trim();
        } else if (isQualified === 'false' || isQualified === false) {
          updateData.lead_status = 'unqualified';
          updateData.comments =
            `${updateData.comments}\n\n❌ AI Qualification: UNQUALIFIED - Not a sales opportunity`.trim();
        }

        await supabase.from('leads').update(updateData).eq('id', lead.id);
      }
    }

    console.log('SMS chat analyzed:', {
      conversation_id: conversation.id,
      sentiment,
      has_summary: !!summary,
      has_qualification: !!dynamicVariables?.is_qualified,
    });
  } catch (error) {
    console.error('Error handling chat analyzed:', error);
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