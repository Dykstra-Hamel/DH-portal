export type TimeRange = 'day' | 'week' | 'month' | 'year' | 'custom';

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface MetricData {
  title: string;
  value: number | string;
  comparisonValue?: number;
  comparisonPeriod?: string;
  trend?: 'good' | 'bad';
}

export interface ReportsResponse {
  totalLeads: MetricData;
  leadsWon: MetricData;
  leadsLost: MetricData;
  winRate: MetricData;
  pipelineValue: MetricData;
  totalOutboundCalls: MetricData;
  totalInboundCalls: MetricData;
  totalCalls: MetricData;
}

export function getDateRangeFromTimeRange(timeRange: TimeRange, customStart?: Date, customEnd?: Date): DateRange {
  const now = new Date();
  const endDate = new Date(now);
  let startDate = new Date(now);

  switch (timeRange) {
    case 'day':
      startDate.setDate(now.getDate() - 1);
      break;
    case 'week':
      startDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(now.getMonth() - 1);
      break;
    case 'year':
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    case 'custom':
      if (customStart && customEnd) {
        startDate = customStart;
        endDate.setTime(customEnd.getTime());
      }
      break;
  }

  return { startDate, endDate };
}

export function getPreviousPeriod(startDate: Date, endDate: Date): DateRange {
  const duration = endDate.getTime() - startDate.getTime();
  const previousEndDate = new Date(startDate);
  const previousStartDate = new Date(startDate.getTime() - duration);

  return { startDate: previousStartDate, endDate: previousEndDate };
}

export function getTimeRangeLabel(timeRange: TimeRange): string {
  switch (timeRange) {
    case 'day':
      return 'Last 24 hours';
    case 'week':
      return 'Last 7 days';
    case 'month':
      return 'Last 30 days';
    case 'year':
      return 'Last 365 days';
    case 'custom':
      return 'Custom range';
    default:
      return '';
  }
}

export function getComparisonLabel(timeRange: TimeRange): string {
  switch (timeRange) {
    case 'day':
      return 'vs previous day';
    case 'week':
      return 'vs previous week';
    case 'month':
      return 'vs previous month';
    case 'year':
      return 'vs previous year';
    case 'custom':
      return 'vs previous period';
    default:
      return '';
  }
}
