import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  // Only allow debug endpoints in non-production environments
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Debug endpoints not available in production' },
      { status: 404 }
    );
  }

  try {
    const { companyId, testEmail } = await request.json();

    if (!companyId || !testEmail) {
      return NextResponse.json(
        { error: 'companyId and testEmail are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check user access to company
    const { data: userCompany } = await supabase
      .from('user_companies')
      .select('role')
      .eq('user_id', user.id)
      .eq('company_id', companyId)
      .single();

    if (!userCompany) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get company data
    const { data: company } = await supabase
      .from('companies')
      .select('name, website, email, phone')
      .eq('id', companyId)
      .single();

    // Get brand data
    const { data: brand } = await supabase
      .from('brands')
      .select('logo_url')
      .eq('company_id', companyId)
      .single();

    // Create debug template HTML
    const debugHtml = createDebugTemplateHtml(company, brand);

    // Send debug email
    const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/email/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: testEmail,
        subject: `🔧 Email Image Debug Test - ${company?.name || 'Company'}`,
        html: debugHtml,
        text: `Email Image Debug Test for ${company?.name || 'Company'}`,
        companyId,
        source: 'debug_template'
      })
    });

    const emailResult = await emailResponse.json();

    // Extract image URLs from the template for testing
    const imageUrls = extractImageUrls(debugHtml);

    return NextResponse.json({
      success: true,
      emailSent: emailResult.success,
      emailResult,
      debugInfo: {
        companyName: company?.name,
        brandLogoUrl: brand?.logo_url,
        imageUrls,
        templateHtml: debugHtml
      },
      testInstructions: [
        '1. Check your email inbox for the debug template',
        '2. Look for any missing or broken images',
        '3. Use browser dev tools to inspect image URLs',
        '4. Test image URLs in the response using /api/email/test-images'
      ]
    });

  } catch (error) {
    console.error('Error creating debug template:', error);
    return NextResponse.json(
      { error: 'Failed to create debug template' },
      { status: 500 }
    );
  }
}

function createDebugTemplateHtml(company: any, brand: any): string {
  const logoUrl = brand?.logo_url || '/pcocentral-logo.png';
  const companyName = company?.name || 'Your Company';
  
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Image Debug Test</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #333;">🔧 Email Image Debug Test</h1>
    
    <div style="border: 2px solid #007bff; padding: 15px; margin: 20px 0; background-color: #f8f9fa;">
        <h2>Company Logo Test</h2>
        <p><strong>Logo URL:</strong> ${logoUrl}</p>
        <p><strong>Company:</strong> ${companyName}</p>
        
        <div style="border: 1px dashed #ccc; padding: 10px; text-align: center;">
            <p>Logo should appear below:</p>
            <img src="${logoUrl}" alt="${companyName} Logo" style="max-width: 200px; height: auto;" />
        </div>
    </div>

    <div style="border: 2px solid #28a745; padding: 15px; margin: 20px 0; background-color: #f8fff8;">
        <h2>Absolute URL Test (Should Work)</h2>
        <img src="https://via.placeholder.com/150x50/28a745/ffffff?text=ABSOLUTE+URL" 
             alt="Test Absolute URL" 
             style="max-width: 150px; height: auto;" />
        <p>✅ This image uses an absolute HTTPS URL and should display correctly.</p>
    </div>

    <div style="border: 2px solid #dc3545; padding: 15px; margin: 20px 0; background-color: #fff8f8;">
        <h2>Relative URL Test (Should Fail)</h2>
        <img src="/test-relative-image.png" 
             alt="Test Relative URL" 
             style="max-width: 150px; height: auto;" />
        <p>❌ This image uses a relative URL and will likely not display in email clients.</p>
    </div>

    <div style="border: 2px solid #ffc107; padding: 15px; margin: 20px 0; background-color: #fffcf0;">
        <h2>Template Variables Test</h2>
        <p><strong>Company Name:</strong> {{companyName}}</p>
        <p><strong>Company Logo:</strong> {{companyLogo}}</p>
        
        <div style="border: 1px dashed #ccc; padding: 10px; text-align: center;">
            <p>Variable-based logo ({{companyLogo}}):</p>
            <img src="{{companyLogo}}" alt="{{companyName}} Logo" style="max-width: 200px; height: auto;" />
        </div>
    </div>

    <div style="margin-top: 30px; padding: 15px; background-color: #e9ecef; border-radius: 5px;">
        <h3>Debug Information:</h3>
        <ul>
            <li><strong>Generated At:</strong> ${new Date().toISOString()}</li>
            <li><strong>Logo URL:</strong> ${logoUrl}</li>
            <li><strong>Company:</strong> ${companyName}</li>
        </ul>
        
        <h4>Image Troubleshooting:</h4>
        <ul>
            <li>If logo doesn't appear: Check if the URL is publicly accessible</li>
            <li>If variables show as {{variableName}}: Check variable replacement in workflow</li>
            <li>If relative URL works: Your email client is loading images from localhost</li>
        </ul>
    </div>
</body>
</html>`.trim();
}

function extractImageUrls(html: string): string[] {
  const imageRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  const urls: string[] = [];
  let match;
  
  while ((match = imageRegex.exec(html)) !== null) {
    urls.push(match[1]);
  }
  
  return urls;
}