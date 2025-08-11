export interface GATrafficData {
  date: string;
  sessions: number;
  pageviews: number;
  users: number;
  bounceRate: number;
}

export interface GASourceData {
  source: string;
  sessions: number;
  percentage: number;
}

export interface GADeviceData {
  deviceCategory: string;
  sessions: number;
  percentage: number;
}

export interface GAPageData {
  pagePath: string;
  pageTitle: string;
  pageviews: number;
  uniquePageviews: number;
}

export interface GAMetricsSummary {
  totalSessions: number;
  totalUsers: number;
  totalPageviews: number;
  averageBounceRate: number;
  sessionsGrowth: number;
  usersGrowth: number;
}

export interface GAAnalyticsResponse {
  traffic: GATrafficData[];
  sources: GASourceData[];
  devices: GADeviceData[];
  pages: GAPageData[];
  summary: GAMetricsSummary;
}