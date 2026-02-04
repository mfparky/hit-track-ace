import { Outing, OutingType } from '@/types/hitting';
import { cn } from '@/lib/utils';
import { ChevronRight, Calendar, Target } from 'lucide-react';
import { format } from 'date-fns';

interface OutingCardProps {
  outing: Outing;
  playerName?: string;
  onClick?: () => void;
}

const outingTypeLabels: Record<OutingType, string> = {
  game: 'Game',
  batting_practice: 'BP',
  cage_session: 'Cage',
  live_abs: 'Live ABs',
};

const outingTypeColors: Record<OutingType, string> = {
  game: 'bg-accent text-accent-foreground',
  batting_practice: 'bg-success text-success-foreground',
  cage_session: 'bg-primary text-primary-foreground',
  live_abs: 'bg-warning text-warning-foreground',
};

export function OutingCard({ outing, playerName, onClick }: OutingCardProps) {
  const hits = outing.atBats.filter(ab => 
    ['single', 'double', 'triple', 'hr'].includes(ab.result)
  ).length;
  const totalABs = outing.atBats.filter(ab => 
    !['walk', 'hbp'].includes(ab.result)
  ).length;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-4 p-4 bg-card border border-border rounded-lg',
        'transition-all hover:shadow-md hover:border-accent/50 active:scale-[0.99]',
        'text-left group'
      )}
    >
      {/* Type badge */}
      <div className={cn(
        'px-3 py-2 rounded-lg font-semibold text-sm',
        outingTypeColors[outing.type]
      )}>
        {outingTypeLabels[outing.type]}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {playerName && (
            <h3 className="font-semibold text-foreground truncate">{playerName}</h3>
          )}
          {outing.opponent && (
            <span className="text-sm text-muted-foreground">vs {outing.opponent}</span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {format(new Date(outing.date), 'MMM d, yyyy')}
          </span>
          <span className="flex items-center gap-1">
            <Target className="w-3.5 h-3.5" />
            {hits}/{totalABs} ({totalABs > 0 ? ((hits / totalABs) * 1000).toFixed(0) : '---'})
          </span>
        </div>
      </div>

      {/* Status & Arrow */}
      <div className="flex items-center gap-2">
        {!outing.isComplete && (
          <span className="px-2 py-1 text-xs font-medium bg-warning/20 text-warning rounded-full animate-pulse">
            Live
          </span>
        )}
        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-accent transition-colors" />
      </div>
    </button>
  );
}
