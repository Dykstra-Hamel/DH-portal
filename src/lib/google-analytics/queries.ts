import { 
  getTrafficData, 
  getSourceData, 
  getDeviceData, 
  getPageData 
} from './client';
import { GAAnalyticsResponse, GAMetricsSummary } from './types';

export async function getAnalyticsData(
  propertyId: string,
  days: number = 30
): Promise<GAAnalyticsResponse> {
  const startDate = `${days}daysAgo`;
  const endDate = 'today';
  
  // Previous period for comparison
  const previousStartDate = `${days * 2}daysAgo`;
  const previousEndDate = `${days + 1}daysAgo`;
  
  try {
    // Fetch all data in parallel
    const [
      traffic,
      sources,
      devices,
      pages,
      currentPeriodSummary,
      previousPeriodSummary
    ] = await Promise.all([
      getTrafficData(propertyId, startDate, endDate),
      getSourceData(propertyId, startDate, endDate),
      getDeviceData(propertyId, startDate, endDate),
      getPageData(propertyId, startDate, endDate),
      getTrafficData(propertyId, startDate, endDate),
      getTrafficData(propertyId, previousStartDate, previousEndDate),
    ]);

    // Calculate summary metrics
    const currentTotals = currentPeriodSummary.reduce(
      (acc, day) => ({
        sessions: acc.sessions + day.sessions,
        users: acc.users + day.users,
        pageviews: acc.pageviews + day.pageviews,
        bounceRateSum: acc.bounceRateSum + day.bounceRate,
        days: acc.days + 1
      }),
      { sessions: 0, users: 0, pageviews: 0, bounceRateSum: 0, days: 0 }
    );

    const previousTotals = previousPeriodSummary.reduce(
      (acc, day) => ({
        sessions: acc.sessions + day.sessions,
        users: acc.users + day.users
      }),
      { sessions: 0, users: 0 }
    );

    const summary: GAMetricsSummary = {
      totalSessions: currentTotals.sessions,
      totalUsers: currentTotals.users,
      totalPageviews: currentTotals.pageviews,
      averageBounceRate: currentTotals.days > 0 
        ? Math.round(currentTotals.bounceRateSum / currentTotals.days * 100) / 100 
        : 0,
      sessionsGrowth: previousTotals.sessions > 0 
        ? Math.round(((currentTotals.sessions - previousTotals.sessions) / previousTotals.sessions) * 100)
        : 0,
      usersGrowth: previousTotals.users > 0 
        ? Math.round(((currentTotals.users - previousTotals.users) / previousTotals.users) * 100)
        : 0,
    };

    return {
      traffic,
      sources,
      devices,
      pages,
      summary
    };
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    throw error;
  }
}