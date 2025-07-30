import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import {
  sendVoicemailDrop,
  createVoicemailRequest,
  logVoicemailAttempt,
  getSlybroadcastConfig,
} from '@/lib/slybroadcast';

interface VoicemailRequest {
  customerPhone: string;
  customerName: string;
  pestType?: string;
  urgency?: string;
  address?: string;
  audioFile?: string;
  delayMinutes?: number;
  leadId?: string;
  companyId?: string;
}

// Handle CORS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

// Helper function to add CORS headers
const addCorsHeaders = (response: NextResponse) => {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return response;
};

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    console.log('🎤 Slybroadcast API: Received voicemail request');
    
    const voicemailRequest: VoicemailRequest = await request.json();
    console.log('📋 Request payload:', {
      ...voicemailRequest,
      customerPhone: voicemailRequest.customerPhone?.replace(/\d(?=\d{4})/g, '*') // Mask for privacy
    });

    // Validate required fields
    if (!voicemailRequest.customerPhone || !voicemailRequest.customerName) {
      console.log('❌ Validation failed: Missing required fields');
      return addCorsHeaders(
        NextResponse.json(
          { error: 'Customer phone and name are required' },
          { status: 400 }
        )
      );
    }

    // Check if Slybroadcast is enabled
    const config = getSlybroadcastConfig();
    console.log('⚙️ Slybroadcast config:', {
      enabled: config.enabled,
      hasUsername: !!config.username,
      hasPassword: !!config.password,
      hasDefaultAudio: !!config.defaultAudioFile
    });
    
    if (!config.enabled) {
      console.log('⚠️ Slybroadcast integration is disabled');
      return addCorsHeaders(
        NextResponse.json(
          { 
            success: false, 
            error: 'Slybroadcast integration is disabled',
            skipped: true 
          },
          { status: 200 }
        )
      );
    }

    // Create the voicemail drop request
    const dropRequest = createVoicemailRequest({
      customerPhone: voicemailRequest.customerPhone,
      customerName: voicemailRequest.customerName,
      pestType: voicemailRequest.pestType,
      urgency: voicemailRequest.urgency,
      address: voicemailRequest.address,
      audioFile: voicemailRequest.audioFile,
      delayMinutes: voicemailRequest.delayMinutes,
    });

    console.log('🔄 Created voicemail drop request:', {
      ...dropRequest,
      customerPhone: dropRequest.customerPhone?.replace(/\d(?=\d{4})/g, '*'),
      scheduleDate: dropRequest.scheduleDate?.toISOString()
    });

    // If delay is specified, schedule for later
    if (voicemailRequest.delayMinutes && voicemailRequest.delayMinutes > 0) {
      console.log(`⏰ Voicemail scheduled for ${voicemailRequest.delayMinutes} minutes delay`);
    } else {
      console.log('🚀 Sending voicemail immediately');
    }

    // Send the voicemail drop
    console.log('📞 Calling Slybroadcast API...');
    const apiCallStart = Date.now();
    const result = await sendVoicemailDrop(dropRequest);
    const apiCallDuration = Date.now() - apiCallStart;
    
    console.log(`📡 Slybroadcast API response (${apiCallDuration}ms):`, {
      success: result.success,
      sessionId: result.session_id,
      message: result.message,
      error: result.error
    });

    // Log the attempt
    logVoicemailAttempt(dropRequest, result, voicemailRequest.leadId);

    // If we have a leadId, we could update the lead record with voicemail status
    if (voicemailRequest.leadId && result.success) {
      try {
        const supabase = createAdminClient();
        
        // Get current lead comments first
        const { data: currentLead } = await supabase
          .from('leads')
          .select('comments')
          .eq('id', voicemailRequest.leadId)
          .single();
        
        // Add voicemail info to lead comments
        const voicemailNote = `\nVoicemail Drop: Sent successfully${result.session_id ? ` (Session: ${result.session_id})` : ''} at ${new Date().toLocaleString()}`;
        const updatedComments = (currentLead?.comments || '') + voicemailNote;
        
        const { error: updateError } = await supabase
          .from('leads')
          .update({
            comments: updatedComments,
            updated_at: new Date().toISOString(),
          })
          .eq('id', voicemailRequest.leadId);

        if (updateError) {
          console.error('Failed to update lead with voicemail status:', updateError);
          // Don't fail the request if lead update fails
        }
      } catch (error) {
        console.error('Error updating lead record:', error);
        // Don't fail the request if lead update fails
      }
    }

    const totalDuration = Date.now() - startTime;
    
    if (result.success) {
      console.log(`✅ Voicemail drop completed successfully (${totalDuration}ms total)`);
      return addCorsHeaders(
        NextResponse.json({
          success: true,
          message: result.message || 'Voicemail drop sent successfully',
          sessionId: result.session_id,
        })
      );
    } else {
      console.log(`❌ Voicemail drop failed (${totalDuration}ms total):`, result.error);
      return addCorsHeaders(
        NextResponse.json(
          {
            success: false,
            error: result.error || 'Failed to send voicemail drop',
          },
          { status: 400 }
        )
      );
    }
  } catch (error) {
    const totalDuration = Date.now() - startTime;
    console.error(`💥 Error in voicemail drop API (${totalDuration}ms total):`, error);
    
    return addCorsHeaders(
      NextResponse.json(
        { 
          success: false, 
          error: error instanceof Error ? error.message : 'Internal server error' 
        },
        { status: 500 }
      )
    );
  }
}

// GET endpoint to check Slybroadcast configuration status
export async function GET() {
  try {
    const config = getSlybroadcastConfig();
    
    return addCorsHeaders(
      NextResponse.json({
        enabled: config.enabled,
        configured: !!(config.username && config.password),
        hasDefaultAudio: !!config.defaultAudioFile,
      })
    );
  } catch (error) {
    console.error('Error checking Slybroadcast config:', error);
    return addCorsHeaders(
      NextResponse.json(
        { error: 'Failed to check configuration' },
        { status: 500 }
      )
    );
  }
}