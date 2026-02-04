import { SprayChartPoint } from '@/types/hitting';
import { cn } from '@/lib/utils';

interface SprayChartProps {
  points: SprayChartPoint[];
  onAddPoint?: (x: number, y: number) => void;
  interactive?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const resultColors: Record<SprayChartPoint['result'], string> = {
  single: 'bg-spray-single',
  double: 'bg-spray-double',
  triple: 'bg-spray-triple',
  hr: 'bg-spray-hr',
  out: 'bg-spray-out',
};

export function SprayChart({ points, onAddPoint, interactive = false, size = 'md' }: SprayChartProps) {
  const sizes = {
    sm: 'w-48 h-48',
    md: 'w-64 h-64',
    lg: 'w-80 h-80',
  };

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!interactive || !onAddPoint) return;
    
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = 1 - (e.clientY - rect.top) / rect.height;
    
    if (y > 0.1) {
      onAddPoint(x, y);
    }
  };

  return (
    <div className={cn('relative', sizes[size])}>
      <svg
        viewBox="0 0 200 200"
        className={cn(
          'w-full h-full',
          interactive && 'cursor-crosshair'
        )}
        onClick={handleClick}
      >
        {/* Field background */}
        <defs>
          <linearGradient id="fieldGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(142 50% 35%)" />
            <stop offset="100%" stopColor="hsl(142 45% 28%)" />
          </linearGradient>
          <clipPath id="fieldClip">
            <path d="M 100 180 L 10 90 Q 100 10 190 90 Z" />
          </clipPath>
        </defs>
        
        {/* Outfield grass */}
        <path
          d="M 100 180 L 10 90 Q 100 10 190 90 Z"
          fill="url(#fieldGradient)"
          className="drop-shadow-md"
        />
        
        {/* Infield dirt */}
        <path
          d="M 100 180 L 55 135 Q 100 90 145 135 Z"
          fill="hsl(30 40% 55%)"
          opacity="0.8"
        />
        
        {/* Base paths */}
        <line x1="100" y1="180" x2="55" y2="135" stroke="white" strokeWidth="1" opacity="0.5" />
        <line x1="100" y1="180" x2="145" y2="135" stroke="white" strokeWidth="1" opacity="0.5" />
        <line x1="55" y1="135" x2="100" y2="90" stroke="white" strokeWidth="1" opacity="0.5" />
        <line x1="145" y1="135" x2="100" y2="90" stroke="white" strokeWidth="1" opacity="0.5" />
        
        {/* Bases */}
        <rect x="97" y="177" width="6" height="6" fill="white" transform="rotate(45 100 180)" />
        <rect x="52" y="132" width="6" height="6" fill="white" transform="rotate(45 55 135)" />
        <rect x="142" y="132" width="6" height="6" fill="white" transform="rotate(45 145 135)" />
        <rect x="97" y="87" width="6" height="6" fill="white" transform="rotate(45 100 90)" />
        
        {/* Foul lines */}
        <line x1="100" y1="180" x2="10" y2="90" stroke="white" strokeWidth="1.5" opacity="0.7" />
        <line x1="100" y1="180" x2="190" y2="90" stroke="white" strokeWidth="1.5" opacity="0.7" />
        
        {/* Warning track arc */}
        <path
          d="M 15 85 Q 100 5 185 85"
          fill="none"
          stroke="hsl(30 40% 45%)"
          strokeWidth="8"
          opacity="0.5"
        />
      </svg>
      
      {/* Hit points overlay */}
      {points.map((point) => {
        const px = ((point.x + 1) / 2) * 100;
        const py = (1 - point.y) * 100;
        
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
