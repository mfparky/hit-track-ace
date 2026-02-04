import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useHitting } from '@/context/HittingContext';
import { PageHeader } from '@/components/hitting/PageHeader';
import { SprayChart } from '@/components/hitting/SprayChart';
import { LocationChart } from '@/components/hitting/LocationChart';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { AtBat, SprayChartPoint, LocationPoint, HitType } from '@/types/hitting';
import { Check, X, Plus, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

const resultButtons = [
  { value: 'strikeout', label: 'K', color: 'bg-destructive' },
  { value: 'walk', label: 'BB', color: 'bg-muted' },
  { value: 'hbp', label: 'HBP', color: 'bg-muted' },
  { value: 'out', label: 'Out', color: 'bg-spray-out' },
  { value: 'single', label: '1B', color: 'bg-spray-single' },
  { value: 'double', label: '2B', color: 'bg-spray-double' },
  { value: 'triple', label: '3B', color: 'bg-spray-triple' },
  { value: 'hr', label: 'HR', color: 'bg-spray-hr' },
];

const hitTypes: { value: HitType; label: string }[] = [
  { value: 'ground_ball', label: 'GB' },
  { value: 'line_drive', label: 'LD' },
  { value: 'fly_ball', label: 'FB' },
  { value: 'popup', label: 'PU' },
];

export default function LiveOuting() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { players, outings, updateOuting } = useHitting();

  const outing = outings.find(o => o.id === id);
  const player = players.find(p => p.id === outing?.playerId);

  const [currentAB, setCurrentAB] = useState<Partial<AtBat>>({
    pitchCount: 0,
    locations: [],
  });
  const [sprayPoint, setSprayPoint] = useState<Partial<SprayChartPoint> | null>(null);
  const [showExitVelo, setShowExitVelo] = useState(false);
  const [exitVelo, setExitVelo] = useState('');
  const [isBarrel, setIsBarrel] = useState(false);
  const [hitType, setHitType] = useState<HitType>('line_drive');

  if (!outing || !player) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Outing not found</p>
      </div>
    );
  }

  const handleLocationClick = (x: number, y: number) => {
    const newPoint: LocationPoint = {
      id: Date.now().toString(),
      x,
      y,
      result: 'ball', // Default, will update with result
    };
    setCurrentAB({
      ...currentAB,
      pitchCount: (currentAB.pitchCount || 0) + 1,
      locations: [...(currentAB.locations || []), newPoint],
    });
  };

  const handleSprayClick = (x: number, y: number) => {
    setSprayPoint({
      id: Date.now().toString(),
      x,
      y,
      hitType,
      exitVelocity: exitVelo ? Number(exitVelo) : undefined,
      isBarrel,
    });
  };

  const handleResult = (result: AtBat['result']) => {
    const ab: AtBat = {
      id: Date.now().toString(),
      pitchCount: currentAB.pitchCount || 1,
      result,
      locations: currentAB.locations || [],
      sprayPoint: sprayPoint && ['single', 'double', 'triple', 'hr', 'out'].includes(result)
        ? {
            ...sprayPoint,
            result: result as SprayChartPoint['result'],
            exitVelocity: exitVelo ? Number(exitVelo) : undefined,
            isBarrel,
          } as SprayChartPoint
        : undefined,
    };

    const updatedOuting = {
      ...outing,
      atBats: [...outing.atBats, ab],
    };

    updateOuting(updatedOuting);

    // Reset for next AB
    setCurrentAB({ pitchCount: 0, locations: [] });
    setSprayPoint(null);
    setExitVelo('');
    setIsBarrel(false);
  };

  const handleEndOuting = () => {
    updateOuting({ ...outing, isComplete: true });
    navigate(`/outing/${outing.id}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Live Tracking"
        subtitle={`${player.name} • AB ${outing.atBats.length + 1}`}
        showBack
        action={
          <Button variant="ghost" size="sm" onClick={handleEndOuting} className="text-accent">
            End
          </Button>
        }
      />

      <div className="px-4 py-4 max-w-lg mx-auto space-y-6">
        {/* Current At-Bat Info */}
        <div className="flex items-center justify-center gap-6 py-2">
          <div className="text-center">
            <p className="stat-label">Pitch</p>
            <p className="text-3xl font-bold font-mono">{currentAB.pitchCount || 0}</p>
          </div>
          <div className="text-center">
            <p className="stat-label">At-Bat</p>
            <p className="text-3xl font-bold font-mono">{outing.atBats.length + 1}</p>
          </div>
        </div>

        {/* Charts Side by Side */}
        <div className="flex gap-4 justify-center">
          <div className="text-center">
            <p className="text-xs font-medium text-muted-foreground mb-2">Pitch Location</p>
            <LocationChart
              points={currentAB.locations || []}
              onAddPoint={handleLocationClick}
              interactive
              size="sm"
            />
          </div>
          <div className="text-center">
            <p className="text-xs font-medium text-muted-foreground mb-2">Spray Chart</p>
            <SprayChart
              points={sprayPoint ? [{ ...sprayPoint, result: 'single' } as SprayChartPoint] : []}
              onAddPoint={handleSprayClick}
              interactive
              size="sm"
            />
          </div>
        </div>

        {/* Hit Type */}
        <div>
          <Label className="text-xs mb-2 block">Hit Type</Label>
          <div className="flex gap-2">
            {hitTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => setHitType(type.value)}
                className={cn(
                  'flex-1 py-2 rounded-lg font-semibold text-sm transition-all',
                  hitType === type.value
                    ? 'bg-accent text-accent-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Exit Velo Toggle */}
        <div className="flex items-center justify-between">
          <Label htmlFor="showExitVelo">Track Exit Velocity</Label>
          <Switch
            id="showExitVelo"
            checked={showExitVelo}
            onCheckedChange={setShowExitVelo}
          />
        </div>

        {showExitVelo && (
          <div className="flex gap-4 animate-fade-in">
            <div className="flex-1">
              <Label htmlFor="exitVelo" className="text-xs">Exit Velo (mph)</Label>
              <Input
                id="exitVelo"
                type="number"
                placeholder="e.g., 95"
                value={exitVelo}
                onChange={(e) => setExitVelo(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setIsBarrel(!isBarrel)}
                className={cn(
                  'h-10 px-4 rounded-lg font-semibold text-sm transition-all',
                  isBarrel
                    ? 'bg-barrel text-white'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                Barrel
              </button>
            </div>
          </div>
        )}

        {/* Result Buttons */}
        <div>
          <Label className="text-xs mb-2 block">Result</Label>
          <div className="grid grid-cols-4 gap-2">
            {resultButtons.map((btn) => (
              <button
                key={btn.value}
                onClick={() => handleResult(btn.value as AtBat['result'])}
                className={cn(
                  'py-3 rounded-lg font-bold text-white transition-all active:scale-95',
                  btn.color
                )}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* Previous At-Bats Summary */}
        {outing.atBats.length > 0 && (
          <div className="border-t border-border pt-4">
            <Label className="text-xs mb-2 block">This Outing</Label>
            <div className="flex flex-wrap gap-2">
              {outing.atBats.map((ab, idx) => (
                <span
                  key={ab.id}
                  className={cn(
                    'px-3 py-1 rounded-full text-sm font-semibold text-white',
                    resultButtons.find(b => b.value === ab.result)?.color || 'bg-muted'
                  )}
                >
                  {resultButtons.find(b => b.value === ab.result)?.label || ab.result}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
