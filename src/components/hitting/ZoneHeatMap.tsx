import { useMemo } from 'react';
import { Pitch } from '@/types/hitting';

interface ZoneHeatMapProps {
  pitches: Pitch[];
  size?: 'sm' | 'md' | 'lg';
}

const GRID_ROWS = 5;
const GRID_COLS = 5;

interface ZoneData {
  total: number;
  hits: number;
  hitRate: number;
}

export function ZoneHeatMap({ pitches, size = 'md' }: ZoneHeatMapProps) {
  const dimensions = {
    sm: { width: 160, height: 200 },
    md: { width: 200, height: 250 },
    lg: { width: 280, height: 350 },
  };

  const { width, height } = dimensions[size];
  
  // Zone extends beyond strike zone (like the reference image)
  // x: -1.5 to 1.5 (wider than strike zone -1 to 1)
  // y: -1.5 to 1.5 (taller than strike zone -1 to 1)
  const zoneRange = { minX: -1.5, maxX: 1.5, minY: -1.5, maxY: 1.5 };
  const cellWidth = width / GRID_COLS;
  const cellHeight = height / GRID_ROWS;

  const zoneData = useMemo(() => {
    const zones: ZoneData[][] = Array(GRID_ROWS).fill(null).map(() => 
      Array(GRID_COLS).fill(null).map(() => ({ total: 0, hits: 0, hitRate: 0 }))
    );

    pitches.forEach(pitch => {
      const { x, y } = pitch.location;
      
      // Map x,y to grid position
      const colIndex = Math.floor(((x - zoneRange.minX) / (zoneRange.maxX - zoneRange.minX)) * GRID_COLS);
      const rowIndex = Math.floor(((zoneRange.maxY - y) / (zoneRange.maxY - zoneRange.minY)) * GRID_ROWS);
      
      // Clamp to valid indices
      const col = Math.max(0, Math.min(GRID_COLS - 1, colIndex));
      const row = Math.max(0, Math.min(GRID_ROWS - 1, rowIndex));
      
      zones[row][col].total++;
      
      // Count hits (in_play_hit outcomes)
      if (pitch.outcome === 'in_play_hit') {
        zones[row][col].hits++;
      }
    });

    // Calculate hit rates
    zones.forEach(row => {
      row.forEach(cell => {
        cell.hitRate = cell.total > 0 ? (cell.hits / cell.total) : -1; // -1 means no data
      });
    });

    return zones;
  }, [pitches]);

  const getZoneColor = (hitRate: number, total: number): string => {
    if (total === 0) return 'hsl(var(--muted) / 0.3)'; // No data
    
    // Color gradient from blue (cold/0%) to white (50%) to red (hot/100%)
    if (hitRate <= 0.5) {
      // Blue to white (cold to neutral)
      const intensity = hitRate * 2; // 0 to 1
      const hue = 220; // Blue
      const saturation = 70 - (intensity * 50); // 70% to 20%
      const lightness = 30 + (intensity * 40); // 30% to 70%
      return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    } else {
      // White to red (neutral to hot)
      const intensity = (hitRate - 0.5) * 2; // 0 to 1
      const hue = 0; // Red
      const saturation = 20 + (intensity * 50); // 20% to 70%
      const lightness = 70 - (intensity * 30); // 70% to 40%
      return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    }
  };

  const strikeZoneMargin = {
    left: ((1 + zoneRange.minX) / (zoneRange.maxX - zoneRange.minX)) * width,
    right: ((zoneRange.maxX - 1) / (zoneRange.maxX - zoneRange.minX)) * width,
    top: ((zoneRange.maxY - 1) / (zoneRange.maxY - zoneRange.minY)) * height,
    bottom: ((1 + zoneRange.minY) / (zoneRange.maxY - zoneRange.minY)) * height,
  };

  const strikeZoneWidth = width - strikeZoneMargin.left - strikeZoneMargin.right;
  const strikeZoneHeight = height - strikeZoneMargin.top - strikeZoneMargin.bottom;

  return (
    <div className="flex flex-col items-center">
      <svg 
        width={width} 
        height={height} 
        viewBox={`0 0 ${width} ${height}`}
        className="overflow-visible"
      >
        {/* Grid cells with heat map colors */}
        {zoneData.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <g key={`${rowIndex}-${colIndex}`}>
              <rect
                x={colIndex * cellWidth}
                y={rowIndex * cellHeight}
                width={cellWidth}
                height={cellHeight}
                fill={getZoneColor(cell.hitRate, cell.total)}
                stroke="hsl(var(--border))"
                strokeWidth={0.5}
              />
              {/* Show percentage if there's data */}
              {cell.total > 0 && (
                <text
                  x={colIndex * cellWidth + cellWidth / 2}
                  y={rowIndex * cellHeight + cellHeight / 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-foreground font-semibold"
                  style={{ 
                    fontSize: size === 'lg' ? 14 : size === 'md' ? 12 : 10,
                    opacity: 0.9
                  }}
                >
                  {Math.round(cell.hitRate * 100)}%
                </text>
              )}
              {/* Show count below percentage */}
              {cell.total > 0 && size !== 'sm' && (
                <text
                  x={colIndex * cellWidth + cellWidth / 2}
                  y={rowIndex * cellHeight + cellHeight / 2 + (size === 'lg' ? 16 : 12)}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-muted-foreground"
                  style={{ 
                    fontSize: size === 'lg' ? 10 : 8,
                    opacity: 0.7
                  }}
                >
                  ({cell.total})
                </text>
              )}
            </g>
          ))
        )}

        {/* Strike zone outline */}
        <rect
          x={strikeZoneMargin.left}
          y={strikeZoneMargin.top}
          width={strikeZoneWidth}
          height={strikeZoneHeight}
          fill="none"
          stroke="hsl(var(--success))"
          strokeWidth={2}
        />
      </svg>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(220, 70%, 30%)' }} />
          <span>Cold</span>
        </div>
        <div className="w-16 h-3 rounded" style={{
          background: 'linear-gradient(to right, hsl(220, 70%, 30%), hsl(0, 0%, 70%), hsl(0, 70%, 40%))'
        }} />
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(0, 70%, 40%)' }} />
          <span>Hot</span>
        </div>
      </div>
    </div>
  );
}
