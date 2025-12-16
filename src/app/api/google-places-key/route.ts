import { NextRequest } from 'next/server';
import { handleCorsPrelight, createCorsResponse, createCorsErrorResponse, validateOrigin } from '@/lib/cors';

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  return await handleCorsPrelight(request, 'widget');
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin');
  const appUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  // Skip CORS validation for same-origin requests (quote pages, internal pages)
  // Only validate for cross-origin requests (embedded widgets on third-party sites)
  const isSameOrigin = !origin || origin === appUrl || origin === new URL(appUrl).origin;

  if (!isSameOrigin) {
    // Only validate CORS for cross-origin requests
    const { isValid, response } = await validateOrigin(request, 'widget');

    if (!isValid && response) {
      return response;
    }
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