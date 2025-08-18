import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, isAuthorizedAdmin } from '@/lib/auth-helpers';
import { createAdminClient } from '@/lib/supabase/server-admin';

interface BillingReportData {
  companyName: string;
  period: string;
  totalCalls: number;
  totalBillableMinutes: number;
  totalBillableHours: number;
}

export async function GET(request: NextRequest) {
  try {
    // Verify authentication and admin authorization
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user || !(await isAuthorizedAdmin(user))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Validate required parameters
    if (!companyId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required parameters: companyId, startDate, endDate' },
        { status: 400 }
      );
    }

    // Validate date format and range
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD format.' },
        { status: 400 }
      );
    }

    if (start >= end) {
      return NextResponse.json(
        { error: 'Start date must be before end date' },
        { status: 400 }
      );
    }

    // Check if date range is reasonable (max 1 year)
    const maxDate = new Date(start);
    maxDate.setFullYear(maxDate.getFullYear() + 1);
    if (end > maxDate) {
      return NextResponse.json(
        { error: 'Date range cannot exceed 1 year' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Get company information
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('name')
      .eq('id', companyId)
      .single();

    if (companyError || !company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    // Get call records for the specified company and date range
    // Include both active and archived calls for complete billing picture
    const { data: calls, error: callsError } = await supabase
      .from('call_records')
      .select(`
        id,
        start_timestamp,
        billable_duration_seconds,
        leads (
          company_id
        ),
        customers (
          company_id
        )
      `)
      .gte('start_timestamp', start.toISOString())
      .lte('start_timestamp', end.toISOString())
      .not('billable_duration_seconds', 'is', null);

    if (callsError) {
      return NextResponse.json(
        { error: 'Failed to fetch call records' },
        { status: 500 }
      );
    }

    // Filter calls for the specific company
    const companyCalls = calls?.filter(call => {
      const leadCompanyId = (call.leads as any)?.company_id;
      const customerCompanyId = (call.customers as any)?.company_id;
      return leadCompanyId === companyId || customerCompanyId === companyId;
    }) || [];

    // Group calls by month for breakdown
    const monthlyData = new Map<string, { calls: number; billableSeconds: number }>();
    
    companyCalls.forEach(call => {
      const callDate = new Date(call.start_timestamp);
      const monthKey = `${callDate.getFullYear()}-${String(callDate.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, { calls: 0, billableSeconds: 0 });
      }
      
      const monthData = monthlyData.get(monthKey)!;
      monthData.calls += 1;
      monthData.billableSeconds += call.billable_duration_seconds || 0;
    });

    // Convert to report format
    const reportData: BillingReportData[] = [];
    
    // Add monthly breakdown
    Array.from(monthlyData.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([month, data]) => {
        const billableMinutes = Math.round(data.billableSeconds / 60 * 100) / 100;
        const billableHours = Math.round(data.billableSeconds / 3600 * 100) / 100;
        
        reportData.push({
          companyName: company.name,
          period: month,
          totalCalls: data.calls,
          totalBillableMinutes: billableMinutes,
          totalBillableHours: billableHours
        });
      });

    // Add grand total
    const totalCalls = companyCalls.length;
    const totalBillableSeconds = companyCalls.reduce(
      (sum, call) => sum + (call.billable_duration_seconds || 0),
      0
    );
    const totalBillableMinutes = Math.round(totalBillableSeconds / 60 * 100) / 100;
    const totalBillableHours = Math.round(totalBillableSeconds / 3600 * 100) / 100;

    reportData.push({
      companyName: company.name,
      period: 'TOTAL',
      totalCalls,
      totalBillableMinutes,
      totalBillableHours
    });

    return NextResponse.json({
      success: true,
      data: {
        companyName: company.name,
        dateRange: {
          start: startDate,
          end: endDate
        },
        summary: {
          totalCalls,
          totalBillableMinutes,
          totalBillableHours
        },
        breakdown: reportData
      }
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}