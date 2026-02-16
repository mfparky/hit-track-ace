import { PlateDisciplineStats } from '@/lib/stats';
import { Eye, Crosshair, Gauge, Target, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlateDisciplineProps {
  stats: PlateDisciplineStats;
}

interface DisciplineBarProps {
  label: string;
  value: number;
  format?: string;
  color: string;
  benchmark?: { good: number; direction: 'higher' | 'lower' };
}

function DisciplineBar({ label, value, format, color, benchmark }: DisciplineBarProps) {
  const displayValue = format === 'decimal'
    ? value.toFixed(1)
    : `${value.toFixed(1)}%`;

  let quality: 'good' | 'ok' | 'needs-work' | undefined;
  if (benchmark) {
    const diff = benchmark.direction === 'higher'
      ? value - benchmark.good
      : benchmark.good - value;
    if (diff >= 0) quality = 'good';
    else if (diff >= -10) quality = 'ok';
    else quality = 'needs-work';
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-bold font-mono">{displayValue}</span>
          {quality && (
            <span className={cn(
              'w-2 h-2 rounded-full',
              quality === 'good' && 'bg-green-500',
              quality === 'ok' && 'bg-yellow-500',
              quality === 'needs-work' && 'bg-red-500',
            )} />
          )}
        </div>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${Math.min(value, 100)}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  );
}

export function PlateDiscipline({ stats }: PlateDisciplineProps) {
  if (stats.totalPitches === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No pitch data yet</p>
        <p className="text-sm mt-1">Use Live mode to track pitches for discipline stats</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-3 bg-card border border-border rounded-lg text-center">
          <p className="text-2xl font-bold font-mono">{stats.totalPitches}</p>
          <p className="text-[10px] uppercase text-muted-foreground tracking-wider">Pitches</p>
        </div>
        <div className="p-3 bg-card border border-border rounded-lg text-center">
          <p className="text-2xl font-bold font-mono">{stats.swings}</p>
          <p className="text-[10px] uppercase text-muted-foreground tracking-wider">Swings</p>
        </div>
        <div className="p-3 bg-card border border-border rounded-lg text-center">
          <p className="text-2xl font-bold font-mono">{stats.avgPitchesPerAB.toFixed(1)}</p>
          <p className="text-[10px] uppercase text-muted-foreground tracking-wider">Pitches/AB</p>
        </div>
      </div>

      {/* Approach section */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Eye className="w-4 h-4 text-blue-500" />
          <h4 className="text-sm font-semibold">Approach</h4>
        </div>
        <DisciplineBar
          label="Swing %"
          value={stats.swingPct}
          color="#3b82f6"
        />
        <DisciplineBar
          label="Chase Rate"
          value={stats.chasePct}
          color="#f97316"
          benchmark={{ good: 25, direction: 'lower' }}
        />
        <DisciplineBar
          label="Called Strike %"
          value={stats.calledStrikePct}
          color="#a855f7"
          benchmark={{ good: 15, direction: 'lower' }}
        />
      </div>

      {/* Contact section */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Crosshair className="w-4 h-4 text-green-500" />
          <h4 className="text-sm font-semibold">Contact Quality</h4>
        </div>
        <DisciplineBar
          label="Contact %"
          value={stats.contactPct}
          color="#22c55e"
          benchmark={{ good: 75, direction: 'higher' }}
        />
        <DisciplineBar
          label="Whiff Rate"
          value={stats.whiffRate}
          color="#ef4444"
          benchmark={{ good: 25, direction: 'lower' }}
        />
        <DisciplineBar
          label="Foul %"
          value={stats.foulPct}
          color="#eab308"
        />
      </div>

      {/* First pitch section */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Target className="w-4 h-4 text-accent" />
          <h4 className="text-sm font-semibold">First Pitch</h4>
        </div>
        <DisciplineBar
          label="First Pitch Swing %"
          value={stats.firstPitchSwingPct}
          color="#f97316"
        />
        <DisciplineBar
          label="First Pitch Hit %"
          value={stats.firstPitchHitPct}
          color="#22c55e"
        />
      </div>

      {/* Indicator legend */}
      <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          <span>Good</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-yellow-500" />
          <span>OK</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          <span>Work on it</span>
        </div>
      </div>
    </div>
  );
}
