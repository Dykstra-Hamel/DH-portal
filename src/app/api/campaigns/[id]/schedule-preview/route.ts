import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, getSupabaseClient } from '@/lib/api-utils';
import { fetchCompanyBusinessHours, isWorkingDay, getBusinessHoursForDate } from '@/lib/campaigns/business-hours';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get authenticated user
    const authResult = await getAuthenticatedUser();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user, isGlobalAdmin, supabase } = authResult;

    // Use admin client for global admins to bypass RLS
    const queryClient = getSupabaseClient(isGlobalAdmin, supabase);

    // Get campaign details
    const { data: campaign, error: campaignError } = await queryClient
      .from('campaigns')
      .select(`
        *,
        company:companies(id, name)
      `)
      .eq('id', id)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Check user has access to campaign's company (skip for global admins)
    if (!isGlobalAdmin) {
      const { data: userCompany } = await supabase
        .from('user_companies')
        .select('company_id')
        .eq('user_id', user.id)
        .eq('company_id', campaign.company_id)
        .single();

      if (!userCompany) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    // Get business hours settings
    const businessHours = await fetchCompanyBusinessHours(campaign.company_id);

    // Calculate schedule preview
    const batchSize = campaign.batch_size || 10;
    const dailyLimit = campaign.daily_limit || 500;
    const batchIntervalMinutes = campaign.batch_interval_minutes || 10;

    // Get total contacts - use campaign.total_contacts if set, otherwise count from contact lists
    let totalContacts = campaign.total_contacts || 0;

    if (totalContacts === 0) {
      // Count actual contacts from contact lists
      const { data: contactLists } = await queryClient
        .from('campaign_contact_lists')
        .select('id')
        .eq('campaign_id', id);

      if (contactLists && contactLists.length > 0) {
        const { count } = await queryClient
          .from('campaign_contact_list_members')
          .select('id', { count: 'exact', head: true })
          .in('contact_list_id', contactLists.map(l => l.id));

        totalContacts = count || 0;
      }
    }

    if (totalContacts === 0) {
      return NextResponse.json({
        success: true,
        schedule: [],
        summary: {
          totalDays: 0,
          totalBatches: 0,
          contactsPerDay: 0,
        },
      });
    }

    // Generate day-by-day schedule
    const schedule: any[] = [];
    let remainingContacts = totalContacts;
    // eslint-disable-next-line prefer-const
    let currentDate = new Date(campaign.start_datetime);
    let dayIndex = 0;
    const maxDays = 365; // Safety limit

    while (remainingContacts > 0 && dayIndex < maxDays) {
      // Check if this is a working day
      if (!campaign.respect_business_hours || isWorkingDay(currentDate, businessHours)) {
        const dayHours = getBusinessHoursForDate(currentDate, businessHours);
        const contactsThisDay = Math.min(remainingContacts, dailyLimit);
        const batchesThisDay = Math.ceil(contactsThisDay / batchSize);

        schedule.push({
          date: currentDate.toISOString().split('T')[0],
          dayOfWeek: currentDate.toLocaleDateString('en-US', { weekday: 'long' }),
          contactsCount: contactsThisDay,
          batchesCount: batchesThisDay,
          batchSize,
          businessHours: dayHours || { enabled: true, start: '09:00', end: '17:00' },
          estimatedStartTime: dayHours?.start || '09:00',
          estimatedEndTime: calculateEndTime(
            dayHours?.start || '09:00',
            batchesThisDay,
            batchIntervalMinutes
          ),
        });

        remainingContacts -= contactsThisDay;
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
      dayIndex++;
    }

    // Calculate summary
    const summary = {
      totalDays: schedule.length,
      totalBatches: schedule.reduce((sum: number, day: any) => sum + day.batchesCount, 0),
      contactsPerDay: schedule.length > 0 ? Math.round(totalContacts / schedule.length) : 0,
      estimatedCompletionDate: schedule.length > 0 ? schedule[schedule.length - 1].date : null,
      respectsBusinessHours: campaign.respect_business_hours,
      businessHoursSettings: {
        timezone: businessHours.timezone,
        workingDays: Object.entries(businessHours.businessHoursByDay)
          .filter(([_, hours]) => hours.enabled)
          .map(([day]) => day),
      },
    };

    return NextResponse.json({
      success: true,
      schedule,
      summary,
      campaign: {
        id: campaign.id,
        name: campaign.name,
        totalContacts,
        batchSize,
        dailyLimit,
        batchIntervalMinutes,
      },
    });

  } catch (error) {
    console.error('Error generating campaign schedule preview:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Calculates estimated end time for a day's batches
 */
function calculateEndTime(startTime: string, batchesCount: number, intervalMinutes: number): string {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const totalMinutes = startHour * 60 + startMin + (batchesCount * intervalMinutes);
  const endHour = Math.floor(totalMinutes / 60) % 24;
  const endMin = totalMinutes % 60;

  return `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;
}
