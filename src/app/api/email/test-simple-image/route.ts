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
    const { to, companyId } = await request.json();

    if (!to || !companyId) {
      return NextResponse.json(
        { error: 'to and companyId are required' },
        { status: 400 }
      );
    }

    // Test with different image URLs to isolate the issue
    const testImages = [
      {
        name: 'Simple HTTPS Image',
        url: 'https://via.placeholder.com/200x80/0066cc/ffffff?text=TEST+LOGO',
        description: 'Simple placeholder service image'
      },
      {
        name: 'Short CDN Image', 
        url: 'https://i.imgur.com/7drHiqr.png',
        description: 'Short imgur URL'
      },
      {
        name: 'Original Supabase URL',
        url: 'https://cwmckkfkcjxznkpdxgie.supabase.co/storage/v1/object/public/brand-assets/northwest-exterminating/logos/logo_1754942268344.png',
        description: 'Your current Supabase storage URL'
      }
    ];

    const testHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Image URL Test</title>
</head>
<body style="font-family: Arial, sans-serif; padding: 20px;">
    <h1>🔬 Image URL Test Results</h1>
    <p>This email tests different image URL formats to identify the issue:</p>
    
    ${testImages.map((img, index) => `
    <div style="border: 2px solid #ddd; margin: 20px 0; padding: 15px;">
        <h3>${index + 1}. ${img.name}</h3>
        <p><strong>URL:</strong> <code style="word-break: break-all; font-size: 12px;">${img.url}</code></p>
        <p><strong>Description:</strong> ${img.description}</p>
        <div style="border: 1px dashed #999; padding: 10px; text-align: center; background: #f9f9f9;">
            <p>Image should appear below:</p>
            <img src="${img.url}" alt="${img.name}" style="max-width: 200px; height: auto; border: 1px solid #ccc;" />
        </div>
    </div>
    `).join('')}
    
    <div style="margin-top: 30px; padding: 15px; background: #e7f3ff; border-left: 4px solid #0066cc;">
        <h3>What to Look For:</h3>
        <ul>
            <li><strong>All images display:</strong> Email client is working fine</li>
            <li><strong>Only short URLs work:</strong> URL length might be an issue</li>
            <li><strong>Only non-Supabase URLs work:</strong> Supabase storage configuration issue</li>
            <li><strong>No images display:</strong> Email client blocking all external images</li>
        </ul>
    </div>
    
    <div style="margin-top: 20px; font-size: 12px; color: #666;">
        <p><strong>Test sent at:</strong> ${new Date().toISOString()}</p>
        <p><strong>Company ID:</strong> ${companyId}</p>
    </div>
</body>
</html>`;

    // Send test email
    const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/email/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to,
        subject: '🔬 Image URL Format Test',
        html: testHtml,
        text: `Image URL Test - Check your email client for image display results.`,
        companyId,
        source: 'image_url_test'
      })
    });

    const emailResult = await emailResponse.json();

    return NextResponse.json({
      success: true,
      emailSent: emailResult.success,
      emailResult,
      testImages,
      instructions: [
        '1. Check your email for the test results',
        '2. Note which images display correctly',
        '3. Compare image URL formats that work vs fail',
        '4. Check browser dev tools to see actual src attributes'
      ],
      nextSteps: {
        allWork: 'Email client is fine - issue is in template processing',
        onlyShortWork: 'URL length limit - need to use CDN or shorter URLs',
        onlyNonSupabaseWork: 'Supabase storage access issue',
        noneWork: 'Email client blocking all external images - check email client settings'
      }
    });

  } catch (error) {
    console.error('Error sending image test email:', error);
    return NextResponse.json(
      { error: 'Failed to send test email' },
      { status: 500 }
    );
  }
}