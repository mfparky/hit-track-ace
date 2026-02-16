import { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { OutingTrendPoint } from '@/lib/stats';
import { OutingType } from '@/types/hitting';
import { TrendingUp, Activity } from 'lucide-react';

type MetricKey = 'avg' | 'exitVelo' | 'barrelPct' | 'whiffRate' | 'contactPct';

const metrics: { key: MetricKey; label: string; format: (v: number) => string; color: string }[] = [
  { key: 'avg', label: 'AVG', format: (v) => `.${(v * 1000).toFixed(0).padStart(3, '0')}`, color: '#f97316' },
  { key: 'exitVelo', label: 'Exit Velo', format: (v) => v > 0 ? `${v.toFixed(1)}` : '--', color: '#eab308' },
  { key: 'barrelPct', label: 'Barrel %', format: (v) => `${v.toFixed(0)}%`, color: '#8b5cf6' },
  { key: 'contactPct', label: 'Contact %', format: (v) => `${v.toFixed(0)}%`, color: '#22c55e' },
  { key: 'whiffRate', label: 'Whiff %', format: (v) => `${v.toFixed(0)}%`, color: '#ef4444' },
];

const typeFilters: { key: OutingType | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'batting_practice', label: 'BP' },
  { key: 'cage_session', label: 'Cage' },
  { key: 'live_abs', label: 'Live' },
  { key: 'game', label: 'Game' },
];

interface ProgressionChartProps {
  data: OutingTrendPoint[];
}

export function ProgressionChart({ data }: ProgressionChartProps) {
  const [activeMetric, setActiveMetric] = useState<MetricKey>('avg');
  const [typeFilter, setTypeFilter] = useState<OutingType | 'all'>('all');

  const filtered = typeFilter === 'all' ? data : data.filter(d => d.type === typeFilter);
  const metric = metrics.find(m => m.key === activeMetric)!;

  // Calculate rolling average (3-session window)
  const chartData = filtered.map((point, i) => {
    const window = filtered.slice(Math.max(0, i - 2), i + 1);
    const rollingAvg = window.reduce((acc, w) => acc + w[activeMetric], 0) / window.length;
    return {
      ...point,
      value: point[activeMetric],
      rolling: rollingAvg,
    };
  });

  const avg = filtered.length > 0
    ? filtered.reduce((acc, d) => acc + d[activeMetric], 0) / filtered.length
    : 0;

  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No outing data yet</p>
        <p className="text-sm mt-1">Complete some sessions to see trends</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Type filter pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {typeFilters.map(f => (
          <button
            key={f.key}
            onClick={() => setTypeFilter(f.key)}
            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              typeFilter === f.key
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Metric selector */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {metrics.map(m => (
          <button
            key={m.key}
            onClick={() => setActiveMetric(m.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors border ${
              activeMetric === m.key
                ? 'border-current bg-card shadow-sm'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
            style={activeMetric === m.key ? { color: m.color } : undefined}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Chart */}
      {filtered.length > 0 ? (
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">{metric.label}</span>
            </div>
            <span className="text-xs text-muted-foreground">
              Avg: {metric.format(avg)}
            </span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
                width={35}
                tickFormatter={(v) => activeMetric === 'avg' ? `.${(v * 1000).toFixed(0)}` : `${v.toFixed(0)}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(value: number) => [metric.format(value), metric.label]}
                labelFormatter={(label) => label}
              />
              <ReferenceLine
                y={avg}
                stroke="hsl(var(--muted-foreground))"
                strokeDasharray="4 4"
                strokeOpacity={0.5}
              />
              {/* Rolling average line */}
              {filtered.length >= 3 && (
                <Line
                  type="monotone"
                  dataKey="rolling"
                  stroke={metric.color}
                  strokeWidth={2}
                  dot={false}
                  strokeOpacity={0.4}
                  name="3-session avg"
                />
              )}
              {/* Actual values */}
              <Line
                type="monotone"
                dataKey="value"
                stroke={metric.color}
                strokeWidth={2}
                dot={{ r: 4, fill: metric.color }}
                activeDot={{ r: 6 }}
                name={metric.label}
              />
            </LineChart>
          </ResponsiveContainer>
          {filtered.length >= 3 && (
            <p className="text-[10px] text-muted-foreground text-center mt-1">
              Faded line = 3-session rolling average
            </p>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground text-sm">
          No sessions for this filter
        </div>
      )}

      {/* Summary row */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 bg-card border border-border rounded-lg text-center">
            <p className="text-lg font-bold font-mono">{filtered.length}</p>
            <p className="text-[10px] uppercase text-muted-foreground tracking-wider">Sessions</p>
          </div>
          <div className="p-3 bg-card border border-border rounded-lg text-center">
            <p className="text-lg font-bold font-mono">
              {filtered.reduce((a, d) => a + d.hits, 0)}
            </p>
            <p className="text-[10px] uppercase text-muted-foreground tracking-wider">Total Hits</p>
          </div>
          <div className="p-3 bg-card border border-border rounded-lg text-center">
            <p className="text-lg font-bold font-mono">
              {filtered.reduce((a, d) => a + d.atBats, 0)}
            </p>
            <p className="text-[10px] uppercase text-muted-foreground tracking-wider">Total ABs</p>
          </div>
        </div>
      )}
    </div>
  );
}
