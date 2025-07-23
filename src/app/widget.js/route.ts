import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function GET(request: NextRequest) {
  try {
    // Read the widget script file
    const filePath = join(process.cwd(), 'public', 'widget', 'embed.js');
    const fileContent = await readFile(filePath, 'utf8');

    // Return the JavaScript file with proper headers
    return new NextResponse(fileContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/javascript',
        'Cache-Control': 'public, max-age=30', // Cache for 30 seconds (dev mode)
        'Access-Control-Allow-Origin': '*', // Allow cross-origin requests
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('Error serving widget script:', error);
    return new NextResponse('Widget script not found', { status: 404 });
  }
}
