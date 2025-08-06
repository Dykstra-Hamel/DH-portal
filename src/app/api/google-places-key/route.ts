import { NextRequest } from 'next/server';
import { handleCorsPrelight, createCorsResponse, createCorsErrorResponse, validateOrigin } from '@/lib/cors';

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  return await handleCorsPrelight(request, 'widget');
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin');
  
  // Validate origin first
  const { isValid, origin: validatedOrigin, response } = await validateOrigin(request, 'widget');
  
  if (!isValid && response) {
    return response;
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  
  if (!apiKey) {
    return createCorsErrorResponse(
      'Google Places API key not configured',
      origin,
      'widget',
      500
    );
  }

  return createCorsResponse({ apiKey }, origin, 'widget');
}