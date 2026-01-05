export interface MetricData {
  title: string;
  value: number | string;
  comparisonValue: number;
  comparisonPeriod: string;
  trend: 'good' | 'bad';
}

export interface MetricsResponse {
  totalCalls: MetricData;
  avgCallDuration: MetricData;
  positiveSentimentRate: MetricData;
  salesCallsWon: MetricData;
}