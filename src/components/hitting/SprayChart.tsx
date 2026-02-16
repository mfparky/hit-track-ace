import { SprayChartPoint } from '@/types/hitting';
import { cn } from '@/lib/utils';

interface SprayChartProps {
  points: SprayChartPoint[];
  onAddPoint?: (x: number, y: number) => void;
  interactive?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
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
    sm: 'w-40 h-40',
    md: 'w-72 h-72',
    lg: 'w-[340px] h-[340px]',
    xl: 'w-[400px] h-[400px]',
  };

  const pointSizes = {
    sm: 'w-2 h-2',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
    xl: 'w-5 h-5',
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
        viewBox="0 0 300 300"
        className={cn(
          'w-full h-full',
          interactive && 'cursor-crosshair'
        )}
        onClick={handleClick}
      >
        {/* Field background */}
        <defs>
          <linearGradient id="fieldGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(142 50% 38%)" />
            <stop offset="100%" stopColor="hsl(142 45% 30%)" />
          </linearGradient>
          <linearGradient id="infieldGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(30 45% 50%)" />
            <stop offset="100%" stopColor="hsl(30 40% 42%)" />
          </linearGradient>
          <clipPath id="fieldClip">
            <path d="M 150 270 L 15 135 Q 150 15 285 135 Z" />
          </clipPath>
        </defs>
        
        {/* Outfield grass */}
        <path
          d="M 150 270 L 15 135 Q 150 15 285 135 Z"
          fill="url(#fieldGradient)"
          className="drop-shadow-lg"
        />

        {/* Outfield zones - subtle arc lines */}
        <path d="M 40 110 Q 150 30 260 110" fill="none" stroke="hsl(142 40% 32%)" strokeWidth="1" opacity="0.5" />
        <path d="M 60 130 Q 150 60 240 130" fill="none" stroke="hsl(142 40% 32%)" strokeWidth="1" opacity="0.5" />
        <path d="M 80 150 Q 150 90 220 150" fill="none" stroke="hsl(142 40% 32%)" strokeWidth="1" opacity="0.5" />
        
        {/* Radial field lines */}
        <line x1="150" y1="270" x2="60" y2="100" stroke="hsl(142 40% 32%)" strokeWidth="1" opacity="0.3" />
        <line x1="150" y1="270" x2="105" y2="75" stroke="hsl(142 40% 32%)" strokeWidth="1" opacity="0.3" />
        <line x1="150" y1="270" x2="150" y2="60" stroke="hsl(142 40% 32%)" strokeWidth="1" opacity="0.3" />
        <line x1="150" y1="270" x2="195" y2="75" stroke="hsl(142 40% 32%)" strokeWidth="1" opacity="0.3" />
        <line x1="150" y1="270" x2="240" y2="100" stroke="hsl(142 40% 32%)" strokeWidth="1" opacity="0.3" />

        {/* Warning track */}
        <path
          d="M 22 128 Q 150 8 278 128"
          fill="none"
          stroke="hsl(30 35% 40%)"
          strokeWidth="12"
          opacity="0.6"
        />
        
        {/* Outfield wall */}
        <path
          d="M 15 135 Q 150 15 285 135"
          fill="none"
          stroke="hsl(30 30% 25%)"
          strokeWidth="3"
        />
        
        {/* Infield grass cutout */}
        <circle cx="150" cy="200" r="60" fill="url(#fieldGradient)" />
        
        {/* Infield dirt */}
        <path
          d="M 150 270 L 82 202 Q 150 134 218 202 Z"
          fill="url(#infieldGradient)"
        />
        
        {/* Pitcher's mound */}
        <circle cx="150" cy="210" r="8" fill="hsl(30 40% 48%)" />
        <circle cx="150" cy="210" r="3" fill="white" opacity="0.8" />
        
        {/* Base paths */}
        <line x1="150" y1="270" x2="82" y2="202" stroke="white" strokeWidth="1.5" opacity="0.6" />
        <line x1="150" y1="270" x2="218" y2="202" stroke="white" strokeWidth="1.5" opacity="0.6" />
        <line x1="82" y1="202" x2="150" y2="134" stroke="white" strokeWidth="1.5" opacity="0.6" />
        <line x1="218" y1="202" x2="150" y2="134" stroke="white" strokeWidth="1.5" opacity="0.6" />
        
        {/* Batter's box area */}
        <rect x="140" y="260" width="20" height="8" fill="hsl(30 40% 48%)" rx="1" />
        
        {/* Bases */}
        <rect x="147" y="267" width="6" height="6" fill="white" transform="rotate(45 150 270)" />
        <rect x="79" y="199" width="6" height="6" fill="white" transform="rotate(45 82 202)" />
        <rect x="215" y="199" width="6" height="6" fill="white" transform="rotate(45 218 202)" />
        <rect x="147" y="131" width="6" height="6" fill="white" transform="rotate(45 150 134)" />
        
        {/* Foul lines */}
        <line x1="150" y1="270" x2="15" y2="135" stroke="white" strokeWidth="2" opacity="0.8" />
        <line x1="150" y1="270" x2="285" y2="135" stroke="white" strokeWidth="2" opacity="0.8" />
        
        {/* Foul territory labels */}
        <text x="35" y="175" fill="white" opacity="0.4" fontSize="10" fontWeight="500">LF</text>
        <text x="145" y="55" fill="white" opacity="0.4" fontSize="10" fontWeight="500">CF</text>
        <text x="255" y="175" fill="white" opacity="0.4" fontSize="10" fontWeight="500">RF</text>
      </svg>
      
      {/* Hit points overlay */}
      {points.map((point) => {
        const px = ((point.x + 1) / 2) * 100;
        const py = (1 - point.y) * 100;
        
        return (
          <div
            key={point.id}
            className={cn(
              'absolute rounded-full transform -translate-x-1/2 -translate-y-1/2 border-2 border-white shadow-lg transition-transform hover:scale-125',
              pointSizes[size],
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
