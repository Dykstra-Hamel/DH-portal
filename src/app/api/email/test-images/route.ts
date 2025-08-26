import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // Only allow test endpoints in non-production environments
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Test endpoints not available in production' },
      { status: 404 }
    );
  }

  try {
    const { imageUrls } = await request.json();

    if (!imageUrls || !Array.isArray(imageUrls)) {
      return NextResponse.json(
        { error: 'imageUrls array is required' },
        { status: 400 }
      );
    }

    const results = await Promise.all(
      imageUrls.map(async (url: string) => {
        try {
          // Test if image URL is accessible
          const response = await fetch(url, {
            method: 'HEAD', // Only get headers, not full image
          });

          return {
            url,
            accessible: response.ok,
            status: response.status,
            statusText: response.statusText,
            contentType: response.headers.get('content-type'),
            contentLength: response.headers.get('content-length'),
            issues: analyzeImageUrl(url, response)
          };
        } catch (error) {
          return {
            url,
            accessible: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            issues: analyzeImageUrl(url, null)
          };
        }
      })
    );

    // Provide overall recommendations
    const recommendations = generateRecommendations(results);

    return NextResponse.json({
      success: true,
      results,
      recommendations,
      summary: {
        total: results.length,
        accessible: results.filter(r => r.accessible).length,
        failed: results.filter(r => !r.accessible).length
      }
    });

  } catch (error) {
    console.error('Error testing image URLs:', error);
    return NextResponse.json(
      { error: 'Failed to test image URLs' },
      { status: 500 }
    );
  }
}

function analyzeImageUrl(url: string, response: Response | null): string[] {
  const issues: string[] = [];

  // Check for common issues
  if (url.startsWith('/')) {
    issues.push('RELATIVE_URL: URL starts with "/" - email clients cannot resolve relative URLs');
  }

  if (url.includes('localhost') || url.includes('127.0.0.1')) {
    issues.push('LOCALHOST: URL points to localhost - not accessible from email clients');
  }

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    issues.push('NO_PROTOCOL: URL missing http:// or https:// protocol');
  }

  if (url.startsWith('http://')) {
    issues.push('INSECURE_PROTOCOL: URL uses http:// - some email clients block insecure images');
  }

  if (!response || !response.ok) {
    issues.push('NOT_ACCESSIBLE: Image URL is not accessible from external requests');
  }

  if (response && response.ok) {
    const contentType = response.headers.get('content-type');
    if (contentType && !contentType.startsWith('image/')) {
      issues.push(`WRONG_CONTENT_TYPE: Content-Type is "${contentType}", should be image/*`);
    }
  }

  return issues;
}

function generateRecommendations(results: any[]): string[] {
  const recommendations: string[] = [];
  
  const hasRelativeUrls = results.some(r => r.url.startsWith('/'));
  const hasLocalhostUrls = results.some(r => r.url.includes('localhost'));
  const hasHttpUrls = results.some(r => r.url.startsWith('http://'));
  const hasInaccessibleUrls = results.some(r => !r.accessible);

  if (hasRelativeUrls) {
    recommendations.push(
      'CONVERT_TO_ABSOLUTE: Convert relative URLs (starting with /) to absolute URLs with full domain (https://yourdomain.com/image.png)'
    );
  }

  if (hasLocalhostUrls) {
    recommendations.push(
      'UPLOAD_TO_CDN: Images pointing to localhost should be uploaded to a CDN or public hosting service'
    );
  }

  if (hasHttpUrls) {
    recommendations.push(
      'USE_HTTPS: Convert http:// URLs to https:// for better email client compatibility'
    );
  }

  if (hasInaccessibleUrls) {
    recommendations.push(
      'CHECK_ACCESSIBILITY: Ensure all image URLs are publicly accessible without authentication'
    );
  }

  recommendations.push(
    'EMAIL_CLIENT_TESTING: Test emails in multiple email clients (Gmail, Outlook, Apple Mail) as image handling varies'
  );

  recommendations.push(
    'ADD_ALT_TEXT: Always include alt text in <img> tags for accessibility and fallback when images are blocked'
  );

  return recommendations;
}