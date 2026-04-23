'use client';

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export interface ChartSeries {
  key: string;
  label?: string;
  color?: string;
}

export interface ChartSpec {
  type: 'bar' | 'line' | 'pie' | 'area';
  xKey: string;
  series: ChartSeries[];
  data: Array<Record<string, string | number>>;
}

interface AdminChartProps {
  spec: ChartSpec;
  height?: number;
}

const DEFAULT_COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4',
  '#ec4899',
  '#84cc16',
];

function colorFor(series: ChartSeries, index: number): string {
  return series.color ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length];
}

export function AdminChart({ spec, height = 240 }: AdminChartProps) {
  if (!spec.data || spec.data.length === 0) {
    return null;
  }

  if (spec.type === 'pie') {
    const series = spec.series[0];
    if (!series) return null;
    return (
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={spec.data}
            dataKey={series.key}
            nameKey={spec.xKey}
            outerRadius={Math.min(height / 2 - 24, 96)}
            label
          >
            {spec.data.map((_, idx) => (
              <Cell
                key={`cell-${idx}`}
                fill={DEFAULT_COLORS[idx % DEFAULT_COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  if (spec.type === 'line') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={spec.data} margin={{ top: 12, right: 12, bottom: 0, left: -12 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey={spec.xKey} stroke="#6b7280" fontSize={11} />
          <YAxis stroke="#6b7280" fontSize={11} allowDecimals={false} />
          <Tooltip />
          <Legend />
          {spec.series.map((s, idx) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label ?? s.key}
              stroke={colorFor(s, idx)}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    );
  }

  if (spec.type === 'area') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={spec.data} margin={{ top: 12, right: 12, bottom: 0, left: -12 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey={spec.xKey} stroke="#6b7280" fontSize={11} />
          <YAxis stroke="#6b7280" fontSize={11} allowDecimals={false} />
          <Tooltip />
          <Legend />
          {spec.series.map((s, idx) => (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label ?? s.key}
              stroke={colorFor(s, idx)}
              fill={colorFor(s, idx)}
              fillOpacity={0.3}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={spec.data} margin={{ top: 12, right: 12, bottom: 0, left: -12 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey={spec.xKey} stroke="#6b7280" fontSize={11} />
        <YAxis stroke="#6b7280" fontSize={11} allowDecimals={false} />
        <Tooltip />
        <Legend />
        {spec.series.map((s, idx) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            name={s.label ?? s.key}
            fill={colorFor(s, idx)}
            radius={[4, 4, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
