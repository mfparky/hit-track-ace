import {
  ReportCardData,
  CategoryGrade,
  MetricGrade,
  gradeColor,
  gradeBgClass,
} from '@/lib/grades';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { Zap, Crosshair, Eye, Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface ReportCardProps {
  data: ReportCardData;
  playerName: string;
}

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Power: Zap,
  Contact: Crosshair,
  Discipline: Eye,
};

const CATEGORY_COLORS: Record<string, string> = {
  Power: '#f97316',
  Contact: '#22c55e',
  Discipline: '#3b82f6',
};

function GradeBadge({ grade, size = 'md' }: { grade: string; size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-14 h-14 text-xl',
    xl: 'w-20 h-20 text-3xl',
  };

  return (
    <div
      className={cn(
        'rounded-lg border font-mono font-black flex items-center justify-center',
        gradeBgClass(grade as any),
        sizeClasses[size],
      )}
    >
      {grade}
    </div>
  );
}

function CategoryCard({ category }: { category: CategoryGrade }) {
  const Icon = CATEGORY_ICONS[category.label];
  const color = CATEGORY_COLORS[category.label];

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4" style={{ color }} />}
          <h4 className="text-sm font-semibold">{category.label}</h4>
        </div>
        <GradeBadge grade={category.grade} size="md" />
      </div>

      <div className="space-y-2">
        {category.metrics.map((metric) => (
          <MetricRow key={metric.label} metric={metric} />
        ))}
      </div>
    </div>
  );
}

function MetricRow({ metric }: { metric: MetricGrade }) {
  const color = gradeColor(metric.grade);

  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-muted-foreground flex-shrink-0">{metric.label}</span>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-sm font-mono font-bold">{metric.displayValue}</span>
        <div
          className={cn(
            'w-7 h-7 rounded text-[10px] font-mono font-bold flex items-center justify-center border',
            gradeBgClass(metric.grade),
          )}
        >
          {metric.grade}
        </div>
      </div>
    </div>
  );
}

export function ReportCard({ data, playerName }: ReportCardProps) {
  if (!data.hasEnoughData) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Award className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>Not enough data for a report card</p>
        <p className="text-sm mt-1">Log at least 5 at-bats to generate grades</p>
      </div>
    );
  }

  const radarData = [
    { category: 'Power', score: data.power.score, fullMark: 100 },
    { category: 'Contact', score: data.contact.score, fullMark: 100 },
    { category: 'Discipline', score: data.discipline.score, fullMark: 100 },
  ];

  return (
    <div className="space-y-4">
      {/* Overall Grade Hero */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center gap-5">
          <GradeBadge grade={data.overall.grade} size="xl" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Overall Grade
            </p>
            <p className="text-lg font-bold mt-0.5">{playerName}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="h-2 flex-1 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${data.overall.score}%`,
                    backgroundColor: gradeColor(data.overall.grade),
                  }}
                />
              </div>
              <span className="text-xs font-mono text-muted-foreground w-8 text-right">
                {data.overall.score.toFixed(0)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Radar Chart */}
      <div className="bg-card border border-border rounded-xl p-4">
        <ResponsiveContainer width="100%" height={220}>
          <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
            <PolarGrid stroke="hsl(var(--border))" />
            <PolarAngleAxis
              dataKey="category"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12, fontWeight: 600 }}
            />
            <Radar
              dataKey="score"
              stroke="hsl(var(--accent))"
              fill="hsl(var(--accent))"
              fillOpacity={0.2}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Category Breakdowns */}
      <CategoryCard category={data.power} />
      <CategoryCard category={data.contact} />
      {data.discipline.metrics.length > 0 && (
        <CategoryCard category={data.discipline} />
      )}

      {/* Grade Legend */}
      <div className="flex flex-wrap items-center justify-center gap-3 text-[10px] text-muted-foreground">
        {(['A', 'B', 'C', 'D', 'F'] as const).map((g) => (
          <div key={g} className="flex items-center gap-1">
            <div
              className="w-2.5 h-2.5 rounded-sm"
              style={{ backgroundColor: gradeColor(g as any) }}
            />
            <span>
              {g === 'A' && 'Elite'}
              {g === 'B' && 'Above Avg'}
              {g === 'C' && 'Average'}
              {g === 'D' && 'Below Avg'}
              {g === 'F' && 'Needs Work'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
