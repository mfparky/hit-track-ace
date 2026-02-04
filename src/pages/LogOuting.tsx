import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useHitting } from '@/context/HittingContext';
import { PageHeader } from '@/components/hitting/PageHeader';
import { SprayChart } from '@/components/hitting/SprayChart';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { AtBat, SprayChartPoint, HitType } from '@/types/hitting';
import { Plus, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const resultOptions: { value: AtBat['result']; label: string; color: string }[] = [
  { value: 'strikeout', label: 'K', color: 'bg-destructive' },
  { value: 'walk', label: 'BB', color: 'bg-muted text-foreground' },
  { value: 'hbp', label: 'HBP', color: 'bg-muted text-foreground' },
  { value: 'out', label: 'Out', color: 'bg-spray-out' },
  { value: 'single', label: '1B', color: 'bg-spray-single' },
  { value: 'double', label: '2B', color: 'bg-spray-double' },
  { value: 'triple', label: '3B', color: 'bg-spray-triple' },
  { value: 'hr', label: 'HR', color: 'bg-spray-hr' },
];

const hitTypes: { value: HitType; label: string }[] = [
  { value: 'ground_ball', label: 'Ground Ball' },
  { value: 'line_drive', label: 'Line Drive' },
  { value: 'fly_ball', label: 'Fly Ball' },
  { value: 'popup', label: 'Popup' },
];

export default function LogOuting() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { players, outings, updateOuting } = useHitting();

  const outing = outings.find(o => o.id === id);
  const player = players.find(p => p.id === outing?.playerId);

  const [atBats, setAtBats] = useState<AtBat[]>(outing?.atBats || []);
  const [currentAB, setCurrentAB] = useState<{
    result: AtBat['result'] | '';
    pitchCount: number;
    sprayPoint: { x: number; y: number } | null;
    hitType: HitType;
    exitVelo: string;
    isBarrel: boolean;
  }>({
    result: '',
    pitchCount: 0,
    sprayPoint: null,
    hitType: 'line_drive',
    exitVelo: '',
    isBarrel: false,
  });
  const [showExitVelo, setShowExitVelo] = useState(false);

  if (!outing || !player) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Outing not found</p>
      </div>
    );
  }

  const handleSprayClick = (x: number, y: number) => {
    setCurrentAB({ ...currentAB, sprayPoint: { x, y } });
  };

  const handleAddAB = () => {
    if (!currentAB.result) return;

    const isBallInPlay = ['single', 'double', 'triple', 'hr', 'out'].includes(currentAB.result);

    const newAB: AtBat = {
      id: Date.now().toString(),
      pitchCount: currentAB.pitchCount || 1,
      result: currentAB.result as AtBat['result'],
      locations: [],
      sprayPoint: isBallInPlay && currentAB.sprayPoint ? {
        id: Date.now().toString(),
        x: currentAB.sprayPoint.x,
        y: currentAB.sprayPoint.y,
        result: currentAB.result as SprayChartPoint['result'],
        hitType: currentAB.hitType,
        exitVelocity: currentAB.exitVelo ? Number(currentAB.exitVelo) : undefined,
        isBarrel: currentAB.isBarrel,
      } : undefined,
    };

    setAtBats([...atBats, newAB]);
    setCurrentAB({
      result: '',
      pitchCount: 0,
      sprayPoint: null,
      hitType: 'line_drive',
      exitVelo: '',
      isBarrel: false,
    });
  };

  const handleSave = () => {
    updateOuting({ ...outing, atBats, isComplete: true });
    navigate(`/outing/${outing.id}`);
  };

  const allSprayPoints: SprayChartPoint[] = atBats
    .map(ab => ab.sprayPoint)
    .filter((sp): sp is SprayChartPoint => !!sp);

  const isBallInPlay = ['single', 'double', 'triple', 'hr', 'out'].includes(currentAB.result);

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader
        title="Log Outing"
        subtitle={`${player.name} • ${atBats.length} ABs`}
        showBack
        action={
          <Button variant="ghost" size="sm" onClick={handleSave} className="text-accent">
            <Check className="w-5 h-5 mr-1" /> Save
          </Button>
        }
      />

      <div className="px-4 py-4 max-w-lg mx-auto space-y-6">
        {/* Spray Chart Preview */}
        <div className="flex justify-center">
          <SprayChart
            points={[
              ...allSprayPoints,
              ...(currentAB.sprayPoint && currentAB.result && isBallInPlay
                ? [{
                    id: 'preview',
                    x: currentAB.sprayPoint.x,
                    y: currentAB.sprayPoint.y,
                    result: currentAB.result as SprayChartPoint['result'],
                    hitType: currentAB.hitType,
                  }]
                : []),
            ]}
            onAddPoint={handleSprayClick}
            interactive={isBallInPlay}
            size="md"
          />
        </div>

        {/* Result Selection */}
        <div>
          <Label className="text-xs mb-2 block">Result</Label>
          <div className="grid grid-cols-4 gap-2">
            {resultOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setCurrentAB({ ...currentAB, result: opt.value })}
                className={cn(
                  'py-3 rounded-lg font-bold transition-all border-2',
                  currentAB.result === opt.value
                    ? `${opt.color} text-white border-transparent`
                    : 'bg-card border-border text-foreground hover:border-accent/50'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Hit Type (only for balls in play) */}
        {isBallInPlay && (
          <div className="animate-fade-in">
            <Label className="text-xs mb-2 block">Hit Type</Label>
            <div className="grid grid-cols-2 gap-2">
              {hitTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setCurrentAB({ ...currentAB, hitType: type.value })}
                  className={cn(
                    'py-2 rounded-lg font-medium text-sm transition-all border-2',
                    currentAB.hitType === type.value
                      ? 'bg-accent text-accent-foreground border-transparent'
                      : 'bg-card border-border hover:border-accent/50'
                  )}
                >
                  {type.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Tap the field above to place the hit location
            </p>
          </div>
        )}

        {/* Pitch Count */}
        <div>
          <Label htmlFor="pitchCount" className="text-xs">Pitch Count</Label>
          <Input
            id="pitchCount"
            type="number"
            placeholder="e.g., 5"
            value={currentAB.pitchCount || ''}
            onChange={(e) => setCurrentAB({ ...currentAB, pitchCount: Number(e.target.value) })}
            className="mt-1"
          />
        </div>

        {/* Exit Velo Toggle */}
        {isBallInPlay && (
          <>
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
                    value={currentAB.exitVelo}
                    onChange={(e) => setCurrentAB({ ...currentAB, exitVelo: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => setCurrentAB({ ...currentAB, isBarrel: !currentAB.isBarrel })}
                    className={cn(
                      'h-10 px-4 rounded-lg font-semibold text-sm transition-all',
                      currentAB.isBarrel
                        ? 'bg-barrel text-white'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    Barrel
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Add AB Button */}
        <Button
          className="w-full h-12 bg-accent hover:bg-accent/90 text-accent-foreground"
          onClick={handleAddAB}
          disabled={!currentAB.result}
        >
          <Plus className="w-5 h-5 mr-2" />
          Add At-Bat
        </Button>

        {/* Logged At-Bats */}
        {atBats.length > 0 && (
          <div className="border-t border-border pt-4">
            <Label className="text-xs mb-2 block">Logged At-Bats ({atBats.length})</Label>
            <div className="flex flex-wrap gap-2">
              {atBats.map((ab, idx) => (
                <span
                  key={ab.id}
                  className={cn(
                    'px-3 py-1 rounded-full text-sm font-semibold text-white',
                    resultOptions.find(o => o.value === ab.result)?.color || 'bg-muted'
                  )}
                >
                  {resultOptions.find(o => o.value === ab.result)?.label || ab.result}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
