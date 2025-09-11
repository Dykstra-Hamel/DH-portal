import { NextRequest, NextResponse } from 'next/server';
import { smsService } from '@/lib/sms-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const status = searchParams.get('status') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0;

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'companyId parameter is required' },
        { status: 400 }
      );
    }

    const conversations = await smsService.getCompanyConversations(companyId, {
      status,
      limit,
      offset
    });

    return NextResponse.json({
      success: true,
      conversations,
      count: conversations.length
    });

  } catch (error) {
    console.error('Error fetching SMS conversations:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}