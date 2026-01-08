import { createAdminClient } from '@/lib/supabase/server-admin';
import { getDefaultAgentConfig } from '@/lib/retell-config';
import { getSMSAgents } from '@/lib/agent-utils';

export interface SMSConversationOptions {
  companyId: string;
  customerNumber: string; // E.164 format
  agentId: string;
  retellNumber?: string;
  metadata?: Record<string, any>;
  forceNew?: boolean; // Skip existing conversation check and create new conversation
  dynamicVariables?: Record<string, any>; // Dynamic variables for Retell LLM personalization
}

export interface SMSConversation {
  id: string;
  company_id: string;
  agent_id: string;
  customer_number: string;
  retell_number: string;
  sms_id: string;
  status: 'active' | 'completed' | 'failed';
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  ended_at?: string;
}

export interface SMSMessage {
  id: string;
  conversation_id: string;
  direction: 'inbound' | 'outbound';
  content: string;
  message_id?: string;
  sender_number: string;
  recipient_number: string;
  status: 'sent' | 'delivered' | 'failed' | 'pending';
  error_message?: string;
  created_at: string;
  delivered_at?: string;
  failed_at?: string;
}

export class SMSService {
  private supabase = createAdminClient();

  /**
   * Create a new SMS conversation via Retell API
   */
  async createConversation(options: SMSConversationOptions): Promise<{
    success: boolean;
    conversationId?: string;
    smsId?: string;
    error?: string;
    isExisting?: boolean;
  }> {
    try {
      // Validate phone number format
      if (!this.isValidPhoneNumber(options.customerNumber)) {
        return {
          success: false,
          error:
            'Invalid phone number format. Must be in E.164 format (e.g., +1234567890)',
        };
      }

      // Check for existing active conversation (unless forceNew is specified)
      if (!options.forceNew) {
        const existingConversation = await this.getActiveConversation(
          options.companyId,
          options.customerNumber
        );

        if (existingConversation) {
          // Check the actual status on Retell's end
          const retellStatus = await this.getRetellChatStatus(
            options.companyId,
            existingConversation.sms_id
          );
          
          if (retellStatus.success) {
            if (retellStatus.status === 'ongoing') {
              // Conversation is still active on Retell, reuse it
              return {
                success: true,
                conversationId: existingConversation.id,
                smsId: existingConversation.sms_id,
                isExisting: true,
              };
            } else if (retellStatus.status === 'ended') {
              // Conversation ended on Retell, update our database and create new one
              console.log(`Conversation ${existingConversation.id} ended on Retell, updating status and creating new conversation`);
              await this.updateConversationStatus(existingConversation.id, 'completed', 'ended_on_retell');
              // Continue to create new conversation below
            }
          } else {
            // Retell API error - fallback to existing behavior for reliability
            console.warn(`Failed to check Retell status for conversation ${existingConversation.id}: ${retellStatus.error}`);
            console.log('Falling back to local database status check');
            
            // Use existing conversation as fallback
            return {
              success: true,
              conversationId: existingConversation.id,
              smsId: existingConversation.sms_id,
              isExisting: true,
            };
          }
        }
      }

      // Get SMS-specific Retell phone number if not provided
      let retellNumber = options.retellNumber;
      if (!retellNumber) {
        const agentConfig = await getDefaultAgentConfig(
          options.companyId,
          'sms',
          'outbound'
        );
        if (agentConfig.config?.phoneNumber) {
          retellNumber = agentConfig.config.phoneNumber;
        } else {
          return {
            success: false,
            error:
              'No outbound SMS agent with phone number configured for this company. Please configure agents in Agent Management.',
          };
        }
      }

      // Get SMS-specific agent configuration
      let finalAgentId = options.agentId;
      if (!finalAgentId) {
        const agentConfig = await getDefaultAgentConfig(
          options.companyId,
          'sms',
          'outbound'
        );
        if (agentConfig.config?.agentId) {
          finalAgentId = agentConfig.config.agentId;
        } else {
          return {
            success: false,
            error:
              'No outbound SMS agent configured for this company. Please configure agents in Agent Management.',
          };
        }
      }

      // Create conversation via Retell API
      const retellResult = await this.callRetellSMSAPI(
        options.companyId,
        {
          from_number: retellNumber,
          to_number: options.customerNumber,
          override_agent_id: finalAgentId,
          metadata: {
            ...options.metadata,
            company_id: options.companyId,
            source: 'dh_portal',
          },
          retell_llm_dynamic_variables: options.dynamicVariables || {},
        }
      );

      if (!retellResult.success) {
        return retellResult;
      }

      // Create conversation record in database
      const { data: conversation, error: conversationError } =
        await this.supabase
          .from('sms_conversations')
          .insert([
            {
              company_id: options.companyId,
              agent_id: finalAgentId,
              customer_number: options.customerNumber,
              retell_number: retellNumber,
              sms_id: retellResult.smsId!,
              status: 'active',
              metadata: options.metadata || {},
            },
          ])
          .select('*')
          .single();

      if (conversationError) {
        console.error(
          'Error creating SMS conversation record:',
          conversationError
        );
        // Even if DB insertion fails, the SMS was created successfully
        return {
          success: true,
          smsId: retellResult.smsId,
          error: 'SMS created but database record failed',
        };
      }

      // Log the creation event
      await this.logEvent(conversation.id, 'conversation_created', {
        retell_response: retellResult,
        request_options: options,
      });

      return {
        success: true,
        conversationId: conversation.id,
        smsId: conversation.sms_id,
        isExisting: false,
      };
    } catch (error) {
      console.error('Error creating SMS conversation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get conversation by SMS ID
   */
  async getConversationBySMSId(smsId: string): Promise<SMSConversation | null> {
    try {
      const { data, error } = await this.supabase
        .from('sms_conversations')
        .select('*')
        .eq('sms_id', smsId)
        .single();

      if (error) {
        console.error('Error fetching SMS conversation:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getConversationBySMSId:', error);
      return null;
    }
  }

  /**
   * Get conversation messages
   */
  async getConversationMessages(conversationId: string): Promise<SMSMessage[]> {
    try {
      const { data, error } = await this.supabase
        .from('sms_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching SMS messages:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getConversationMessages:', error);
      return [];
    }
  }

  /**
   * Get all conversations for a company
   */
  async getCompanyConversations(
    companyId: string,
    options: {
      limit?: number;
      offset?: number;
      status?: string;
    } = {}
  ): Promise<SMSConversation[]> {
    try {
      let query = this.supabase
        .from('sms_conversations')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (options.status) {
        query = query.eq('status', options.status);
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.offset) {
        query = query.range(
          options.offset,
          options.offset + (options.limit || 10) - 1
        );
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching company conversations:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getCompanyConversations:', error);
      return [];
    }
  }

  /**
   * End a conversation both on Retell and in our database
   */
  async endConversation(conversationId: string, reason?: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // Get the conversation to find the SMS ID and company ID
      const { data: conversation, error } = await this.supabase
        .from('sms_conversations')
        .select('sms_id, status, company_id')
        .eq('id', conversationId)
        .single();

      if (error || !conversation) {
        return {
          success: false,
          error: 'Conversation not found'
        };
      }

      if (conversation.status !== 'active') {
        return {
          success: false,
          error: 'Conversation is not active'
        };
      }

      // End the conversation on Retell
      const retellResult = await this.endRetellChat(
        conversation.company_id,
        conversation.sms_id
      );
      
      if (!retellResult.success) {
        console.warn(`Failed to end conversation on Retell: ${retellResult.error}`);
        // Continue to update local status even if Retell fails
      }

      // Update local database status
      const updateSuccess = await this.updateConversationStatus(
        conversationId, 
        'completed', 
        reason || 'manually_ended'
      );

      if (!updateSuccess) {
        return {
          success: false,
          error: 'Failed to update conversation status in database'
        };
      }

      // Log the ending event
      await this.logEvent(conversationId, 'conversation_ended', {
        reason: reason || 'manually_ended',
        retell_result: retellResult
      });

      return {
        success: true
      };
      
    } catch (error) {
      console.error('Error ending conversation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Update conversation status
   */
  async updateConversationStatus(
    conversationId: string,
    status: 'active' | 'completed' | 'failed',
    endReason?: string
  ): Promise<boolean> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (status !== 'active') {
        updateData.ended_at = new Date().toISOString();
        if (endReason) {
          updateData.metadata = { end_reason: endReason };
        }
      }

      const { error } = await this.supabase
        .from('sms_conversations')
        .update(updateData)
        .eq('id', conversationId);

      if (error) {
        console.error('Error updating conversation status:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateConversationStatus:', error);
      return false;
    }
  }

  /**
   * Private helper methods
   */
  private isValidPhoneNumber(phoneNumber: string): boolean {
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(phoneNumber);
  }

  private async getActiveConversation(
    companyId: string,
    customerNumber: string
  ): Promise<SMSConversation | null> {
    try {
      const { data, error } = await this.supabase
        .from('sms_conversations')
        .select('*')
        .eq('company_id', companyId)
        .eq('customer_number', customerNumber)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        return null; // No active conversation found
      }

      return data;
    } catch (error) {
      return null;
    }
  }

  /**
   * Check the actual status of a chat conversation on Retell
   */
  private async getRetellChatStatus(
    companyId: string,
    chatId: string
  ): Promise<{
    success: boolean;
    status?: 'ongoing' | 'ended' | string;
    error?: string;
  }> {
    try {
      // Get company's Retell API key from database
      const { data: apiKeySetting } = await this.supabase
        .from('company_settings')
        .select('setting_value')
        .eq('company_id', companyId)
        .eq('setting_key', 'retell_api_key')
        .single();

      if (!apiKeySetting?.setting_value) {
        return {
          success: false,
          error: 'Retell API key not configured for company'
        };
      }

      const retellApiKey = apiKeySetting.setting_value;

      const response = await fetch(`https://api.retellai.com/get-chat/${chatId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${retellApiKey}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Retell get-chat API error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorData,
        });
        
        return {
          success: false,
          error: `Retell API error: ${response.status} - ${response.statusText}`
        };
      }

      const result = await response.json();
      
      return {
        success: true,
        status: result.chat_status
      };
    } catch (error) {
      console.error('Error checking Retell chat status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  /**
   * End a chat conversation on Retell
   */
  private async endRetellChat(
    companyId: string,
    chatId: string
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // Get company's Retell API key from database
      const { data: apiKeySetting } = await this.supabase
        .from('company_settings')
        .select('setting_value')
        .eq('company_id', companyId)
        .eq('setting_key', 'retell_api_key')
        .single();

      if (!apiKeySetting?.setting_value) {
        return {
          success: false,
          error: 'Retell API key not configured for company'
        };
      }

      const retellApiKey = apiKeySetting.setting_value;

      const response = await fetch('https://api.retellai.com/end-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${retellApiKey}`,
        },
        body: JSON.stringify({
          chat_id: chatId
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Retell end-chat API error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorData,
        });
        
        return {
          success: false,
          error: `Retell API error: ${response.status} - ${response.statusText}`
        };
      }

      return {
        success: true
      };
    } catch (error) {
      console.error('Error ending Retell chat:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  private async callRetellSMSAPI(
    companyId: string,
    payload: {
      from_number: string;
      to_number: string;
      override_agent_id: string;
      metadata?: Record<string, any>;
      retell_llm_dynamic_variables?: Record<string, any>;
    }
  ): Promise<{
    success: boolean;
    smsId?: string;
    error?: string;
  }> {
    try {
      // Get company's Retell API key from database
      const { data: apiKeySetting } = await this.supabase
        .from('company_settings')
        .select('setting_value')
        .eq('company_id', companyId)
        .eq('setting_key', 'retell_api_key')
        .single();

      if (!apiKeySetting?.setting_value) {
        return {
          success: false,
          error: 'Retell API key not configured for company'
        };
      }

      const retellApiKey = apiKeySetting.setting_value;

      const response = await fetch('https://api.retellai.com/create-sms-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${retellApiKey}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Retell SMS API error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorData,
        });

        return {
          success: false,
          error: `Retell API error: ${response.status} - ${response.statusText}`,
        };
      }

      const result = await response.json();

      if (!result.chat_id) {
        return {
          success: false,
          error: 'Invalid response from Retell API - no SMS ID returned',
        };
      }

      return {
        success: true,
        smsId: result.chat_id,
      };
    } catch (error) {
      console.error('Error calling Retell SMS API:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  private async logEvent(
    conversationId: string,
    eventType: string,
    payload: Record<string, any>
  ): Promise<void> {
    try {
      await this.supabase.from('sms_logs').insert([
        {
          conversation_id: conversationId,
          event_type: eventType,
          payload: payload,
        },
      ]);
    } catch (error) {
      console.warn('Failed to log SMS event (non-critical):', error);
    }
  }
}

// Export singleton instance
export const smsService = new SMSService();
