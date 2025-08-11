import { GAAnalyticsResponse } from '@/lib/google-analytics/types';

// Generate demo analytics data that looks realistic
export function generateDemoAnalyticsData(days: number = 30): GAAnalyticsResponse {
  const today = new Date();
  const startDate = new Date(today.getTime() - (days * 24 * 60 * 60 * 1000));

  // Generate traffic data for the period
  const traffic = [];
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate.getTime() + (i * 24 * 60 * 60 * 1000));
    const dayOfWeek = date.getDay();
    
    // Simulate realistic traffic patterns (higher on weekdays)
    const baseTraffic = dayOfWeek === 0 || dayOfWeek === 6 ? 150 : 250; // Lower on weekends
    const randomVariation = Math.random() * 100 - 50;
    const trendGrowth = Math.sin((i / days) * Math.PI) * 50; // Some trend over time
    
    const sessions = Math.max(50, Math.round(baseTraffic + randomVariation + trendGrowth));
    const users = Math.round(sessions * (0.7 + Math.random() * 0.2)); // 70-90% of sessions are unique users
    const pageviews = Math.round(sessions * (1.5 + Math.random() * 1.0)); // 1.5-2.5 pages per session
    const bounceRate = 35 + Math.random() * 20; // Random bounce rate between 35% and 55%
    
    traffic.push({
      date: date.toISOString().split('T')[0].replace(/-/g, ''),
      sessions,
      users,
      pageviews,
      bounceRate: Math.round(bounceRate * 10) / 10,
    });
  }

  // Generate device breakdown
  const devices = [
    { 
      deviceCategory: 'mobile', 
      sessions: Math.round(traffic.reduce((sum, day) => sum + day.sessions, 0) * 0.6), // 60% mobile
      percentage: 60
    },
    { 
      deviceCategory: 'desktop', 
      sessions: Math.round(traffic.reduce((sum, day) => sum + day.sessions, 0) * 0.35), // 35% desktop
      percentage: 35
    },
    { 
      deviceCategory: 'tablet', 
      sessions: Math.round(traffic.reduce((sum, day) => sum + day.sessions, 0) * 0.05), // 5% tablet
      percentage: 5
    }
  ];

  // Generate traffic sources
  const totalSessions = traffic.reduce((sum, day) => sum + day.sessions, 0);
  const sources = [
    { source: 'google', sessions: Math.round(totalSessions * 0.45), percentage: 45 }, // 45% organic search
    { source: 'direct', sessions: Math.round(totalSessions * 0.25), percentage: 25 }, // 25% direct
    { source: 'facebook', sessions: Math.round(totalSessions * 0.15), percentage: 15 }, // 15% social
    { source: 'bing', sessions: Math.round(totalSessions * 0.08), percentage: 8 }, // 8% other search
    { source: 'referral', sessions: Math.round(totalSessions * 0.07), percentage: 7 }, // 7% referrals
  ];

  // Generate page views
  const totalPageviews = traffic.reduce((sum, day) => sum + day.pageviews, 0);
  const pages = [
    { 
      pageTitle: 'Home - Pest Control Services', 
      pagePath: '/', 
      pageviews: Math.round(totalPageviews * 0.35),
      uniquePageviews: Math.round(totalPageviews * 0.35 * 0.85) // ~85% are unique
    },
    { 
      pageTitle: 'Services - Professional Pest Control', 
      pagePath: '/services', 
      pageviews: Math.round(totalPageviews * 0.20),
      uniquePageviews: Math.round(totalPageviews * 0.20 * 0.90)
    },
    { 
      pageTitle: 'Contact Us - Get Free Quote', 
      pagePath: '/contact', 
      pageviews: Math.round(totalPageviews * 0.15),
      uniquePageviews: Math.round(totalPageviews * 0.15 * 0.92)
    },
    { 
      pageTitle: 'About Us - Local Pest Experts', 
      pagePath: '/about', 
      pageviews: Math.round(totalPageviews * 0.12),
      uniquePageviews: Math.round(totalPageviews * 0.12 * 0.88)
    },
    { 
      pageTitle: 'Service Areas - Coverage Map', 
      pagePath: '/areas', 
      pageviews: Math.round(totalPageviews * 0.10),
      uniquePageviews: Math.round(totalPageviews * 0.10 * 0.86)
    },
    { 
      pageTitle: 'Blog - Pest Prevention Tips', 
      pagePath: '/blog', 
      pageviews: Math.round(totalPageviews * 0.08),
      uniquePageviews: Math.round(totalPageviews * 0.08 * 0.94)
    }
  ];

  // Calculate summary metrics
  const totalUsers = traffic.reduce((sum, day) => sum + day.users, 0);
  const uniqueSessions = traffic.reduce((sum, day) => sum + day.sessions, 0);
  
  // Simulate growth compared to previous period
  const sessionsGrowth = 8.5 + Math.random() * 10 - 5; // Random growth between 3.5% and 13.5%
  const usersGrowth = 6.2 + Math.random() * 8 - 4; // Random growth between 2.2% and 10.2%
  const bounceRate = 35 + Math.random() * 20; // Random bounce rate between 35% and 55%

  const summary = {
    totalSessions: uniqueSessions,
    totalUsers,
    totalPageviews,
    averageBounceRate: bounceRate,
    sessionsGrowth: Math.round(sessionsGrowth * 10) / 10,
    usersGrowth: Math.round(usersGrowth * 10) / 10,
  };

  return {
    traffic,
    devices,
    sources,
    pages,
    summary,
  };
}