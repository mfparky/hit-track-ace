import { useRef, useState, useCallback, useEffect } from 'react';
import { Pencil, Undo2, Trash2, Minus, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

type Tool = 'pen' | 'line' | 'circle';

interface Stroke {
  tool: Tool;
  color: string;
  width: number;
  points: { x: number; y: number }[];
}

interface DrawingOverlayProps {
  active: boolean;
  onToggle: () => void;
}

const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#ffffff'];
const widths = [2, 4, 6];

export function DrawingOverlay({ active, onToggle }: DrawingOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [tool, setTool] = useState<Tool>('pen');
  const [color, setColor] = useState('#ef4444');
  const [width, setWidth] = useState(4);
  const isDrawing = useRef(false);

  const getPos = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) / rect.width,
      y: (clientY - rect.top) / rect.height,
    };
  }, []);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);

    ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

    const allStrokes = currentStroke ? [...strokes, currentStroke] : strokes;

    for (const stroke of allStrokes) {
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;

      if (stroke.tool === 'pen' && stroke.points.length > 1) {
        ctx.beginPath();
        ctx.moveTo(stroke.points[0].x * w, stroke.points[0].y * h);
        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo(stroke.points[i].x * w, stroke.points[i].y * h);
        }
        ctx.stroke();
      } else if (stroke.tool === 'line' && stroke.points.length >= 2) {
        const start = stroke.points[0];
        const end = stroke.points[stroke.points.length - 1];
        ctx.beginPath();
        ctx.moveTo(start.x * w, start.y * h);
        ctx.lineTo(end.x * w, end.y * h);
        ctx.stroke();
        // Arrow head
        const angle = Math.atan2(
          (end.y - start.y) * h,
          (end.x - start.x) * w
        );
        const headLen = 12;
        ctx.beginPath();
        ctx.moveTo(end.x * w, end.y * h);
        ctx.lineTo(
          end.x * w - headLen * Math.cos(angle - Math.PI / 6),
          end.y * h - headLen * Math.sin(angle - Math.PI / 6)
        );
        ctx.moveTo(end.x * w, end.y * h);
        ctx.lineTo(
          end.x * w - headLen * Math.cos(angle + Math.PI / 6),
          end.y * h - headLen * Math.sin(angle + Math.PI / 6)
        );
        ctx.stroke();
      } else if (stroke.tool === 'circle' && stroke.points.length >= 2) {
        const start = stroke.points[0];
        const end = stroke.points[stroke.points.length - 1];
        const rx = Math.abs(end.x - start.x) * w / 2;
        const ry = Math.abs(end.y - start.y) * h / 2;
        const cx = (start.x + end.x) / 2 * w;
        const cy = (start.y + end.y) / 2 * h;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }, [strokes, currentStroke]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  // Resize observer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const observer = new ResizeObserver(() => redraw());
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [redraw]);

  const handleStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!active) return;
    e.preventDefault();
    isDrawing.current = true;
    const pos = getPos(e);
    setCurrentStroke({ tool, color, width, points: [pos] });
  }, [active, tool, color, width, getPos]);

  const handleMove = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!isDrawing.current || !currentStroke) return;
    e.preventDefault();
    const pos = getPos(e);
    setCurrentStroke(prev => prev ? { ...prev, points: [...prev.points, pos] } : null);
  }, [currentStroke, getPos]);

  const handleEnd = useCallback(() => {
    if (!isDrawing.current || !currentStroke) return;
    isDrawing.current = false;
    if (currentStroke.points.length > 1) {
      setStrokes(prev => [...prev, currentStroke]);
    }
    setCurrentStroke(null);
  }, [currentStroke]);

  const handleUndo = useCallback(() => {
    setStrokes(prev => prev.slice(0, -1));
  }, []);

  const handleClear = useCallback(() => {
    setStrokes([]);
  }, []);

  return (
    <>
      {/* Drawing canvas - always present, only interactive when active */}
      <div
        ref={containerRef}
        className="absolute inset-0 z-20"
        style={{ pointerEvents: active ? 'auto' : 'none' }}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
        />
      </div>

      {/* Toggle button - always visible when in playback */}
      <button
        onClick={onToggle}
        className={cn(
          'absolute top-4 right-4 z-30 w-10 h-10 rounded-full flex items-center justify-center transition-all',
          active
            ? 'bg-accent text-accent-foreground'
            : 'bg-white/20 text-white hover:bg-white/30'
        )}
      >
        <Pencil className="w-5 h-5" />
      </button>

      {/* Toolbar - only when active */}
      {active && (
        <div className="absolute top-16 right-4 z-30 flex flex-col gap-2 bg-black/70 rounded-xl p-2">
          {/* Tools */}
          <div className="flex flex-col gap-1">
            {([
              { t: 'pen' as Tool, icon: Pencil, label: 'Draw' },
              { t: 'line' as Tool, icon: Minus, label: 'Arrow' },
              { t: 'circle' as Tool, icon: Circle, label: 'Circle' },
            ]).map(({ t, icon: Icon }) => (
              <button
                key={t}
                onClick={() => setTool(t)}
                className={cn(
                  'w-9 h-9 rounded-lg flex items-center justify-center',
                  tool === t ? 'bg-white/30' : 'hover:bg-white/10'
                )}
              >
                <Icon className="w-4 h-4 text-white" />
              </button>
            ))}
          </div>

          <div className="h-px bg-white/20" />

          {/* Colors */}
          <div className="flex flex-col gap-1 items-center">
            {colors.map(c => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={cn(
                  'w-6 h-6 rounded-full border-2 transition-transform',
                  color === c ? 'border-white scale-125' : 'border-transparent'
                )}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          <div className="h-px bg-white/20" />

          {/* Widths */}
          <div className="flex flex-col gap-1 items-center">
            {widths.map(w => (
              <button
                key={w}
                onClick={() => setWidth(w)}
                className={cn(
                  'w-9 h-9 rounded-lg flex items-center justify-center',
                  width === w ? 'bg-white/30' : 'hover:bg-white/10'
                )}
              >
                <div
                  className="rounded-full bg-white"
                  style={{ width: w * 2, height: w * 2 }}
                />
              </button>
            ))}
          </div>

          <div className="h-px bg-white/20" />

          {/* Actions */}
          <button
            onClick={handleUndo}
            disabled={strokes.length === 0}
            className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-white/10 disabled:opacity-30"
          >
            <Undo2 className="w-4 h-4 text-white" />
          </button>
          <button
            onClick={handleClear}
            disabled={strokes.length === 0}
            className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-white/10 disabled:opacity-30"
          >
            <Trash2 className="w-4 h-4 text-white" />
          </button>
        </div>
      )}
    </>
  );
}
