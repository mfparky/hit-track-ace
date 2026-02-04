import { Player } from '@/types/hitting';
import { cn } from '@/lib/utils';
import { ChevronRight, User } from 'lucide-react';

interface PlayerCardProps {
  player: Player;
  onClick?: () => void;
  stats?: {
    avg?: number;
    outings?: number;
  };
}

export function PlayerCard({ player, onClick, stats }: PlayerCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-4 p-4 bg-card border border-border rounded-lg',
        'transition-all hover:shadow-md hover:border-accent/50 active:scale-[0.99]',
        'text-left group'
      )}
    >
      {/* Avatar */}
      <div className="relative">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground font-bold text-lg">
          {player.avatar ? (
            <img src={player.avatar} alt={player.name} className="w-full h-full rounded-full object-cover" />
          ) : (
            <User className="w-6 h-6" />
          )}
        </div>
        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-accent text-accent-foreground text-xs font-bold flex items-center justify-center border-2 border-card">
          {player.number}
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-foreground truncate">{player.name}</h3>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{player.position}</span>
          <span>•</span>
          <span>Bats {player.bats === 'S' ? 'Switch' : player.bats}</span>
        </div>
        {stats && (
          <div className="flex items-center gap-3 mt-1">
            {stats.avg !== undefined && (
              <span className="text-xs font-mono font-medium text-accent">
                .{stats.avg.toString().replace('0.', '')}
              </span>
            )}
            {stats.outings !== undefined && (
              <span className="text-xs text-muted-foreground">
                {stats.outings} outing{stats.outings !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Arrow */}
      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-accent transition-colors" />
    </button>
  );
}
