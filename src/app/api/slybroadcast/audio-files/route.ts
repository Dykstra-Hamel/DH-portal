import { NextRequest, NextResponse } from 'next/server';
import { getAudioFileList } from '@/lib/slybroadcast';

// Handle CORS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

// Helper function to add CORS headers
const addCorsHeaders = (response: NextResponse) => {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return response;
};

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    console.log('🎵 Audio files API: Fetching available audio files');
    
    // Get audio file list from Slybroadcast
    const result = await getAudioFileList();
    const totalDuration = Date.now() - startTime;

    if (result.success) {
      console.log(`✅ Audio files fetched successfully (${totalDuration}ms total):`, {
        fileCount: result.files?.length || 0,
        files: result.files?.map(f => ({ id: f.id, name: f.name }))
      });
      
      return addCorsHeaders(
        NextResponse.json({
          success: true,
          files: result.files || [],
          count: result.files?.length || 0,
        })
      );
    } else {
      console.log(`❌ Audio files fetch failed (${totalDuration}ms total):`, result.error);
      return addCorsHeaders(
        NextResponse.json(
          {
            success: false,
            error: result.error || 'Failed to fetch audio files',
            raw_response: result.raw_response,
          },
          { status: 400 }
        )
      );
    }
  } catch (error) {
    const totalDuration = Date.now() - startTime;
    console.error(`💥 Error in audio files API (${totalDuration}ms total):`, error);
    
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