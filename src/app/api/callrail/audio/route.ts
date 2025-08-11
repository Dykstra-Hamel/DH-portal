import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const recordingUrl = searchParams.get('url');
    const companyId = searchParams.get('companyId');

    if (!recordingUrl || !companyId) {
      return NextResponse.json(
        { error: 'Recording URL and company ID are required' },
        { status: 400 }
      );
    }

    // Create supabase client
    const supabase = await createClient();

    // Get current user to verify access
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin first
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.role === 'admin';

    // Verify user has access to this company (admins have access to all companies)
    if (!isAdmin) {
      const { data: userCompany, error: accessError } = await supabase
        .from('user_companies')
        .select('company_id')
        .eq('user_id', user.id)
        .eq('company_id', companyId)
        .single();

      if (accessError || !userCompany) {
        return NextResponse.json(
          { error: 'Unauthorized access to company data' },
          { status: 403 }
        );
      }
    }

    // Get company's CallRail API token to authenticate the recording request
    const { data: callrailSetting, error: callrailError } = await supabase
      .from('company_settings')
      .select('setting_value')
      .eq('company_id', companyId)
      .eq('setting_key', 'callrail_api_token')
      .single();

    if (callrailError || !callrailSetting) {
      return NextResponse.json(
        { error: 'CallRail not configured for this company' },
        { status: 404 }
      );
    }

    const callrailApiToken = callrailSetting.setting_value;

    if (!callrailApiToken || callrailApiToken.trim() === '') {
      return NextResponse.json(
        { error: 'CallRail not configured for this company' },
        { status: 404 }
      );
    }

    // Fetch the recording info from CallRail (this returns JSON with the actual audio URL)
    console.log('Fetching recording info from:', recordingUrl);
    
    const recordingInfoResponse = await fetch(recordingUrl, {
      headers: {
        'Authorization': `Token token="${callrailApiToken}"`,
        'User-Agent': 'CallRail-Proxy/1.0',
      },
    });

    console.log('Recording info response status:', recordingInfoResponse.status);

    if (!recordingInfoResponse.ok) {
      const errorText = await recordingInfoResponse.text();
      console.error('Failed to fetch recording info from CallRail:', recordingInfoResponse.status, errorText);
      return NextResponse.json(
        { error: 'Failed to load recording info' },
        { status: recordingInfoResponse.status }
      );
    }

    // Parse the JSON response to get the actual audio file URL
    const recordingInfo = await recordingInfoResponse.json();
    console.log('Recording info response:', recordingInfo);

    // The actual audio file URL should be in the response
    const actualAudioUrl = recordingInfo.url || recordingInfo.recording_url || recordingInfo.file_url;
    
    if (!actualAudioUrl) {
      console.error('No audio URL found in CallRail response:', recordingInfo);
      return NextResponse.json(
        { error: 'No audio file URL found' },
        { status: 404 }
      );
    }

    console.log('Fetching actual audio from:', actualAudioUrl);

    // Now fetch the actual audio file
    const audioResponse = await fetch(actualAudioUrl, {
      headers: {
        'User-Agent': 'CallRail-Proxy/1.0',
      },
    });

    if (!audioResponse.ok) {
      console.error('Failed to fetch audio file:', audioResponse.status, audioResponse.statusText);
      return NextResponse.json(
        { error: 'Failed to load audio file' },
        { status: audioResponse.status }
      );
    }

    // Get the audio data
    const audioBuffer = await audioResponse.arrayBuffer();
    const contentType = audioResponse.headers.get('content-type') || 'audio/mpeg';

    // Return the audio with proper headers
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': audioBuffer.byteLength.toString(),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'private, max-age=3600', // Cache for 1 hour
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Range',
      },
    });

  } catch (error) {
    console.error('Error proxying CallRail audio:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}