import { google } from 'googleapis';
import { GATrafficData, GASourceData, GADeviceData, GAPageData } from './types';

export function createGA4Client() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GA_CLIENT_EMAIL,
      private_key: process.env.GA_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
  });

  return google.analyticsdata({ version: 'v1beta', auth });
}

export async function getTrafficData(
  propertyId: string, 
  startDate: string = '30daysAgo', 
  endDate: string = 'today'
): Promise<GATrafficData[]> {
  const analyticsDataClient = createGA4Client();
  
  try {
    const response = await analyticsDataClient.properties.runReport({
      property: `properties/${propertyId}`,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        metrics: [
          { name: 'sessions' },
          { name: 'screenPageViews' },
          { name: 'activeUsers' },
          { name: 'bounceRate' }
        ],
        dimensions: [{ name: 'date' }],
        orderBys: [{ dimension: { dimensionName: 'date' } }],
      }
    });

    if (!response.data.rows) {
      return [];
    }

    return response.data.rows.map((row: any) => ({
      date: row.dimensionValues?.[0]?.value || '',
      sessions: parseInt(row.metricValues?.[0]?.value || '0'),
      pageviews: parseInt(row.metricValues?.[1]?.value || '0'),
      users: parseInt(row.metricValues?.[2]?.value || '0'),
      bounceRate: parseFloat(row.metricValues?.[3]?.value || '0')
    }));
  } catch (error) {
    console.error('Error fetching traffic data:', error);
    throw new Error('Failed to fetch traffic data from Google Analytics');
  }
}

export async function getSourceData(
  propertyId: string, 
  startDate: string = '30daysAgo', 
  endDate: string = 'today'
): Promise<GASourceData[]> {
  const analyticsDataClient = createGA4Client();
  
  try {
    const response = await analyticsDataClient.properties.runReport({
      property: `properties/${propertyId}`,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        metrics: [{ name: 'sessions' }],
        dimensions: [{ name: 'sessionSource' }],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: '10',
      }
    });

    if (!response.data.rows) {
      return [];
    }

    const totalSessions = response.data.rows.reduce((sum: number, row: any) => 
      sum + parseInt(row.metricValues?.[0]?.value || '0'), 0
    );

    return response.data.rows.map((row: any) => {
      const sessions = parseInt(row.metricValues?.[0]?.value || '0');
      return {
        source: row.dimensionValues?.[0]?.value || 'Unknown',
        sessions,
        percentage: Math.round((sessions / totalSessions) * 100)
      };
    });
  } catch (error) {
    console.error('Error fetching source data:', error);
    throw new Error('Failed to fetch source data from Google Analytics');
  }
}

export async function getDeviceData(
  propertyId: string, 
  startDate: string = '30daysAgo', 
  endDate: string = 'today'
): Promise<GADeviceData[]> {
  const analyticsDataClient = createGA4Client();
  
  try {
    const response = await analyticsDataClient.properties.runReport({
      property: `properties/${propertyId}`,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        metrics: [{ name: 'sessions' }],
        dimensions: [{ name: 'deviceCategory' }],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      }
    });

    if (!response.data.rows) {
      return [];
    }

    const totalSessions = response.data.rows.reduce((sum: number, row: any) => 
      sum + parseInt(row.metricValues?.[0]?.value || '0'), 0
    );

    return response.data.rows.map((row: any) => {
      const sessions = parseInt(row.metricValues?.[0]?.value || '0');
      return {
        deviceCategory: row.dimensionValues?.[0]?.value || 'Unknown',
        sessions,
        percentage: Math.round((sessions / totalSessions) * 100)
      };
    });
  } catch (error) {
    console.error('Error fetching device data:', error);
    throw new Error('Failed to fetch device data from Google Analytics');
  }
}

export async function getPageData(
  propertyId: string, 
  startDate: string = '30daysAgo', 
  endDate: string = 'today'
): Promise<GAPageData[]> {
  const analyticsDataClient = createGA4Client();
  
  try {
    const response = await analyticsDataClient.properties.runReport({
      property: `properties/${propertyId}`,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        metrics: [
          { name: 'screenPageViews' },
          { name: 'sessions' }
        ],
        dimensions: [
          { name: 'pagePath' },
          { name: 'pageTitle' }
        ],
        orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
        limit: '10',
      }
    });

    if (!response.data.rows) {
      return [];
    }

    return response.data.rows.map((row: any) => ({
      pagePath: row.dimensionValues?.[0]?.value || '',
      pageTitle: row.dimensionValues?.[1]?.value || 'Unknown',
      pageviews: parseInt(row.metricValues?.[0]?.value || '0'),
      uniquePageviews: parseInt(row.metricValues?.[1]?.value || '0')
    }));
  } catch (error) {
    console.error('Error fetching page data:', error);
    throw new Error('Failed to fetch page data from Google Analytics');
  }
}