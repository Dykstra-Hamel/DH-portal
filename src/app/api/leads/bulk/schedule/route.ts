import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/api-utils';
import { sendEvent } from '@/lib/inngest/client';

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const authResult = await getAuthenticatedUser();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user, isGlobalAdmin, supabase } = authResult;

    // Parse request body
    const body = await request.json();
    const { companyId, fileName, scheduledFor, parsedData, totalRows } = body;

    // Validate required fields
    if (!companyId || !fileName || !scheduledFor || !parsedData || !totalRows) {
      return NextResponse.json(
        { error: 'Company ID, file name, scheduled time, parsed data, and total rows are required' },
        { status: 400 }
      );
    }

    // Verify user has access to this company
    if (!isGlobalAdmin) {
      const { data: userCompany } = await supabase
        .from('user_companies')
        .select('id')
        .eq('user_id', user.id)
        .eq('company_id', companyId)
        .single();

      if (!userCompany) {
        return NextResponse.json(
          { error: 'Access denied to this company' },
          { status: 403 }
        );
      }
    }

    // Create bulk upload record
    const { data: upload, error: uploadError } = await supabase
      .from('bulk_lead_uploads')
      .insert([
        {
          company_id: companyId,
          created_by: user.id,
          status: 'pending',
          file_name: fileName,
          scheduled_at: scheduledFor,
          parsed_data: parsedData,
          total_rows: totalRows,
        },
      ])
      .select()
      .single();

    if (uploadError || !upload) {
      console.error('Error creating bulk upload:', uploadError);
      return NextResponse.json(
        { error: 'Failed to create bulk upload' },
        { status: 500 }
      );
    }

    // Trigger Inngest event
    try {
      // DEBUG: Log environment state
      console.log('DEBUG - Environment check:', {
        hasEventKey: !!process.env.INNGEST_EVENT_KEY,
        eventKeyLength: process.env.INNGEST_EVENT_KEY?.length || 0,
        inngestDev: process.env.INNGEST_DEV,
        nodeEnv: process.env.NODE_ENV,
        dataSize: JSON.stringify(parsedData).length,
      });

      await sendEvent({
        name: 'bulk-lead-upload/scheduled',
        data: {
          uploadId: upload.id,
          companyId,
          createdBy: user.id,
          fileName,
          scheduledFor,
          totalRows,
          parsedData,
        },
      });
    } catch (inngestError) {
      console.error('Error triggering Inngest event:', inngestError);
      // Update upload status to failed
      await supabase
        .from('bulk_lead_uploads')
        .update({
          status: 'failed',
          error_message: 'Failed to schedule upload',
        })
        .eq('id', upload.id);

      return NextResponse.json(
        { error: 'Failed to schedule upload' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        upload: {
          id: upload.id,
          scheduledFor,
          totalRows,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in bulk schedule API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
