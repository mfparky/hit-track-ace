import { LocationPoint } from '@/types/hitting';
import { cn } from '@/lib/utils';

interface LocationChartProps {
  points: LocationPoint[];
  onAddPoint?: (x: number, y: number) => void;
  interactive?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const resultColors: Record<LocationPoint['result'], string> = {
  hit: 'bg-hit',
  whiff: 'bg-whiff',
  foul: 'bg-foul',
  ball: 'bg-ball',
};

export function LocationChart({ points, onAddPoint, interactive = false, size = 'md' }: LocationChartProps) {
  const sizes = {
    sm: 'w-40 h-48',
    md: 'w-52 h-64',
    lg: 'w-64 h-80',
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive || !onAddPoint) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = ((rect.bottom - e.clientY) / rect.height) * 2 - 1;
    
    onAddPoint(x, y);
  };

  return (
    <div
      className={cn(
        'relative bg-gradient-to-b from-muted/30 to-muted/50 rounded-lg border border-border overflow-hidden',
        sizes[size],
        interactive && 'cursor-crosshair'
      )}
      onClick={handleClick}
    >
      {/* Strike zone */}
      <div className="absolute inset-[15%] border-2 border-primary/40 bg-primary/5" />
      
      {/* Zone grid lines */}
      <div className="absolute inset-[15%] grid grid-cols-3 grid-rows-3">
        {[...Array(9)].map((_, i) => (
          <div key={i} className="border border-primary/10" />
        ))}
      </div>
      
      {/* Zone labels */}
      <div className="absolute top-1 left-1/2 -translate-x-1/2 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
        High
      </div>
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
        Low
      </div>
      <div className="absolute left-1 top-1/2 -translate-y-1/2 text-[10px] font-medium text-muted-foreground uppercase tracking-wider rotate-[-90deg]">
        In
      </div>
      <div className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] font-medium text-muted-foreground uppercase tracking-wider rotate-90">
        Out
      </div>
      
      {/* Location points */}
      {points.map((point) => {
        const px = ((point.x + 1) / 2) * 100;
        const py = ((1 - point.y) / 2) * 100;
        
        return (
          <div
            key={point.id}
            className={cn(
              'absolute w-3 h-3 rounded-full transform -translate-x-1/2 -translate-y-1/2 border-2 border-white shadow-md transition-transform hover:scale-150',
              resultColors[point.result],
              point.isBarrel && 'ring-2 ring-barrel ring-offset-1'
            )}
            style={{
              left: `${px}%`,
              top: `${py}%`,
            }}
            title={`${point.result.toUpperCase()}${point.exitVelocity ? ` - ${point.exitVelocity} mph` : ''}`}
          />
        );
      })}
    </div>
  );
}
