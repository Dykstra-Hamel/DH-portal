export interface MetricData {
  title: string;
  value: number | string;
  comparisonValue: number;
  comparisonPeriod: string;
  trend: 'good' | 'bad';
}

export interface MetricsResponse {
  totalCalls: MetricData;
  totalForms: MetricData;
  avgTimeToAssign: MetricData;
  hangupCalls: MetricData;
  customerServiceCalls: MetricData;
}