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
  
  // 5x5 grid where inner 3x3 is the strike zone
  // Outer cells represent off-plate areas
  const cellWidth = width / GRID_COLS;
  const cellHeight = height / GRID_ROWS;

  const zoneData = useMemo(() => {
    const zones: ZoneData[][] = Array(GRID_ROWS).fill(null).map(() => 
      Array(GRID_COLS).fill(null).map(() => ({ total: 0, hits: 0, hitRate: 0 }))
    );

    pitches.forEach(pitch => {
      const { x, y } = pitch.location;
      
      // Map coordinates to 5x5 grid
      // x: -1.5 to 1.5 maps to columns 0-4
      // y: 1.5 to -1.5 maps to rows 0-4 (inverted because y increases upward)
      const normalizedX = (x + 1.5) / 3; // 0 to 1
      const normalizedY = (1.5 - y) / 3; // 0 to 1 (inverted)
      
      const colIndex = Math.floor(normalizedX * GRID_COLS);
      const rowIndex = Math.floor(normalizedY * GRID_ROWS);
      
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
    
    // Color gradient from light blue (cold/0%) to white (50%) to red (hot/100%)
    if (hitRate <= 0.5) {
      // Light blue to white (cold to neutral)
      const intensity = hitRate * 2; // 0 to 1
      const hue = 200; // Light blue
      const saturation = 80 - (intensity * 60); // 80% to 20%
      const lightness = 55 + (intensity * 35); // 55% to 90%
      return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    } else {
      // White to red (neutral to hot)
      const intensity = (hitRate - 0.5) * 2; // 0 to 1
      const hue = 0; // Red
      const saturation = 20 + (intensity * 60); // 20% to 80%
      const lightness = 90 - (intensity * 45); // 90% to 45%
      return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    }
  };

  const getTextColor = (hitRate: number, total: number): string => {
    if (total === 0) return 'hsl(var(--muted-foreground))';
    // Dark text for light backgrounds, white for dark backgrounds
    if (hitRate < 0.3 || hitRate > 0.7) {
      return 'white';
    }
    return 'hsl(222, 47%, 15%)'; // Dark navy for middle tones
  };

  // Strike zone is the inner 3x3 grid (columns 1-3, rows 1-3)
  const strikeZoneX = cellWidth;
  const strikeZoneY = cellHeight;
  const strikeZoneWidth = cellWidth * 3;
  const strikeZoneHeight = cellHeight * 3;

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
                  fill={getTextColor(cell.hitRate, cell.total)}
                  fontWeight="700"
                  style={{ 
                    fontSize: size === 'lg' ? 14 : size === 'md' ? 12 : 10,
                    textShadow: '0 1px 2px rgba(0,0,0,0.3)'
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
                  fill={getTextColor(cell.hitRate, cell.total)}
                  style={{ 
                    fontSize: size === 'lg' ? 10 : 8,
                    opacity: 0.85,
                    textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                  }}
                >
                  ({cell.total})
                </text>
              )}
            </g>
          ))
        )}

        {/* Strike zone outline - inner 3x3 grid */}
        <rect
          x={strikeZoneX}
          y={strikeZoneY}
          width={strikeZoneWidth}
          height={strikeZoneHeight}
          fill="none"
          stroke="hsl(var(--foreground))"
          strokeWidth={2.5}
        />
      </svg>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(200, 80%, 55%)' }} />
          <span>Cold</span>
        </div>
        <div className="w-16 h-3 rounded" style={{
          background: 'linear-gradient(to right, hsl(200, 80%, 55%), hsl(0, 0%, 90%), hsl(0, 80%, 45%))'
        }} />
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(0, 80%, 45%)' }} />
          <span>Hot</span>
        </div>
      </div>
    </div>
  );
}
