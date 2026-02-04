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
import { AtBat, SprayChartPoint, Pitch, PitchType, PitchOutcome, HitType } from '@/types/hitting';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

type Step = 'location' | 'pitch_type' | 'outcome' | 'spray' | 'exit_velo';

const pitchTypes: { value: PitchType; label: string; abbr: string }[] = [
  { value: 'fastball', label: 'Fastball', abbr: 'FB' },
  { value: 'curveball', label: 'Curveball', abbr: 'CB' },
  { value: 'slider', label: 'Slider', abbr: 'SL' },
  { value: 'changeup', label: 'Changeup', abbr: 'CH' },
  { value: 'cutter', label: 'Cutter', abbr: 'CUT' },
  { value: 'sinker', label: 'Sinker', abbr: 'SI' },
  { value: 'splitter', label: 'Splitter', abbr: 'SPL' },
  { value: 'other', label: 'Other', abbr: '?' },
];

const outcomes: { value: PitchOutcome; label: string; color: string; endsAB?: AtBat['result'] }[] = [
  { value: 'ball', label: 'Ball', color: 'bg-ball' },
  { value: 'strike_looking', label: 'Strike Looking', color: 'bg-warning' },
  { value: 'strike_swinging', label: 'Strike Swinging', color: 'bg-destructive' },
  { value: 'foul', label: 'Foul', color: 'bg-foul' },
  { value: 'foul_tip', label: 'Foul Tip', color: 'bg-foul' },
  { value: 'in_play_out', label: 'In Play - Out', color: 'bg-spray-out' },
  { value: 'in_play_hit', label: 'In Play - Hit', color: 'bg-spray-single' },
];

const hitTypes: { value: HitType; label: string }[] = [
  { value: 'ground_ball', label: 'GB' },
  { value: 'line_drive', label: 'LD' },
  { value: 'fly_ball', label: 'FB' },
  { value: 'popup', label: 'PU' },
];

const hitResults: { value: SprayChartPoint['result']; label: string; color: string }[] = [
  { value: 'single', label: '1B', color: 'bg-spray-single' },
  { value: 'double', label: '2B', color: 'bg-spray-double' },
  { value: 'triple', label: '3B', color: 'bg-spray-triple' },
  { value: 'hr', label: 'HR', color: 'bg-spray-hr' },
  { value: 'out', label: 'Out', color: 'bg-spray-out' },
];

export default function LiveOuting() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { players, outings, updateOuting } = useHitting();

  const outing = outings.find(o => o.id === id);
  const player = players.find(p => p.id === outing?.playerId);

  // Current pitch state
  const [step, setStep] = useState<Step>('location');
  const [currentPitch, setCurrentPitch] = useState<Partial<Pitch>>({});
  const [currentABPitches, setCurrentABPitches] = useState<Pitch[]>([]);
  const [hitType, setHitType] = useState<HitType>('line_drive');
  const [hitResult, setHitResult] = useState<SprayChartPoint['result']>('single');
  const [sprayLocation, setSprayLocation] = useState<{ x: number; y: number } | null>(null);
  const [showExitVelo, setShowExitVelo] = useState(false);
  const [exitVelo, setExitVelo] = useState('');
  const [isBarrel, setIsBarrel] = useState(false);

  if (!outing || !player) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Outing not found</p>
      </div>
    );
  }

  // Only track count for games and live ABs
  const tracksCount = outing.type === 'game' || outing.type === 'live_abs';

  // Count balls and strikes in current AB
  const balls = currentABPitches.filter(p => p.outcome === 'ball').length;
  const strikes = currentABPitches.filter(p => 
    ['strike_looking', 'strike_swinging', 'foul', 'foul_tip'].includes(p.outcome)
  ).length;
  const displayStrikes = Math.min(strikes, 2); // Cap at 2 for display (3rd strike ends AB)

  const handleLocationClick = (x: number, y: number) => {
    setCurrentPitch({ ...currentPitch, location: { x, y } });
    setStep('pitch_type');
  };

  const handlePitchType = (type: PitchType | 'skip') => {
    if (type === 'skip') {
      setStep('outcome');
    } else {
      setCurrentPitch({ ...currentPitch, pitchType: type });
      setStep('outcome');
    }
  };

  const handleOutcome = (outcome: PitchOutcome) => {
    const pitch: Pitch = {
      id: Date.now().toString(),
      location: currentPitch.location || { x: 0, y: 0 },
      pitchType: currentPitch.pitchType,
      outcome,
    };

    const updatedPitches = [...currentABPitches, pitch];
    
    // Check if AB ends
    const newBalls = updatedPitches.filter(p => p.outcome === 'ball').length;
    const newStrikes = updatedPitches.filter(p => 
      ['strike_looking', 'strike_swinging'].includes(p.outcome)
    ).length;

    // Auto-end at-bats only for count-tracking outing types
    if (tracksCount) {
      // Walk
      if (newBalls >= 4) {
        finishAtBat(updatedPitches, 'walk');
        return;
      }

      // Strikeout (need 3 actual strikes, not fouls)
      if (newStrikes >= 3) {
        finishAtBat(updatedPitches, 'strikeout');
        return;
      }
    }

    // In play - need spray chart
    if (outcome === 'in_play_hit' || outcome === 'in_play_out') {
      setCurrentABPitches(updatedPitches);
      setHitResult(outcome === 'in_play_hit' ? 'single' : 'out');
      setStep('spray');
      return;
    }

    // Continue AB
    setCurrentABPitches(updatedPitches);
    resetForNextPitch();
  };

  const handleSprayClick = (x: number, y: number) => {
    setSprayLocation({ x, y });
  };

  const handleFinishSpray = () => {
    if (showExitVelo && !exitVelo) {
      setStep('exit_velo');
      return;
    }
    
    const sprayPoint: SprayChartPoint = {
      id: Date.now().toString(),
      x: sprayLocation?.x || 0,
      y: sprayLocation?.y || 0.5,
      result: hitResult,
      hitType,
      exitVelocity: exitVelo ? Number(exitVelo) : undefined,
      isBarrel,
    };

    // Update the last pitch with spray point
    const updatedPitches = [...currentABPitches];
    if (updatedPitches.length > 0) {
      updatedPitches[updatedPitches.length - 1] = {
        ...updatedPitches[updatedPitches.length - 1],
        sprayPoint,
        exitVelocity: exitVelo ? Number(exitVelo) : undefined,
        isBarrel,
      };
    }

    // Determine AB result
    let abResult: AtBat['result'];
    if (hitResult === 'out') {
      abResult = 'out';
    } else {
      abResult = hitResult as AtBat['result'];
    }

    finishAtBat(updatedPitches, abResult, sprayPoint);
  };

  const finishAtBat = (pitches: Pitch[], result: AtBat['result'], sprayPoint?: SprayChartPoint) => {
    const atBat: AtBat = {
      id: Date.now().toString(),
      pitches,
      result,
      sprayPoint,
      exitVelocity: exitVelo ? Number(exitVelo) : undefined,
      isBarrel,
    };

    const updatedOuting = {
      ...outing,
      atBats: [...outing.atBats, atBat],
    };

    updateOuting(updatedOuting);
    
    // Reset everything for next AB
    setCurrentPitch({});
    setCurrentABPitches([]);
    setSprayLocation(null);
    setExitVelo('');
    setIsBarrel(false);
    setStep('location');
  };

  const resetForNextPitch = () => {
    setCurrentPitch({});
    setStep('location');
  };

  const handleUndo = () => {
    if (step === 'pitch_type') {
      setCurrentPitch({});
      setStep('location');
    } else if (step === 'outcome') {
      setStep('pitch_type');
    } else if (step === 'spray') {
      // Remove the last pitch and go back
      setCurrentABPitches(prev => prev.slice(0, -1));
      setStep('location');
    } else if (currentABPitches.length > 0) {
      setCurrentABPitches(prev => prev.slice(0, -1));
    }
  };

  const handleEndOuting = () => {
    updateOuting({ ...outing, isComplete: true });
    navigate(`/outing/${outing.id}`);
  };

  const stepTitles: Record<Step, string> = {
    location: 'Tap pitch location',
    pitch_type: 'Select pitch type',
    outcome: 'What happened?',
    spray: 'Where did it go?',
    exit_velo: 'Exit velocity',
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title={`AB ${outing.atBats.length + 1}`}
        subtitle={player.name}
        showBack
        action={
          <Button variant="ghost" size="sm" onClick={handleEndOuting} className="text-accent font-semibold">
            End
          </Button>
        }
      />

      <div className="px-4 py-4 max-w-lg mx-auto">
        {/* Count Display - only show for games and live ABs */}
        {tracksCount ? (
          <div className="flex items-center justify-center gap-8 py-4 mb-4 bg-card rounded-xl border border-border">
            <div className="text-center">
              <p className="text-4xl font-bold font-mono">{balls}-{displayStrikes}</p>
              <p className="text-xs text-muted-foreground mt-1">Count</p>
            </div>
            <div className="h-12 w-px bg-border" />
            <div className="text-center">
              <p className="text-4xl font-bold font-mono text-accent">{currentABPitches.length + (step !== 'location' ? 1 : 0)}</p>
              <p className="text-xs text-muted-foreground mt-1">Pitches</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-4 mb-4 bg-card rounded-xl border border-border">
            <div className="text-center">
              <p className="text-4xl font-bold font-mono text-accent">{currentABPitches.length + (step !== 'location' ? 1 : 0)}</p>
              <p className="text-xs text-muted-foreground mt-1">Swings</p>
            </div>
          </div>
        )}

        {/* Step Indicator */}
        <div className="text-center mb-4">
          <p className="text-lg font-semibold">{stepTitles[step]}</p>
        </div>

        {/* Step Content */}
        <div className="animate-fade-in">
          {step === 'location' && (
            <div className="flex flex-col items-center gap-4">
              <LocationChart
                points={currentABPitches.map(p => ({
                  id: p.id,
                  x: p.location.x,
                  y: p.location.y,
                  result: p.outcome === 'ball' ? 'ball' : 
                          p.outcome.includes('strike') ? 'whiff' : 
                          p.outcome === 'foul' || p.outcome === 'foul_tip' ? 'foul' : 'hit',
                }))}
                onAddPoint={handleLocationClick}
                interactive
                size="lg"
              />
              
              {/* Previous pitches in this AB */}
              {currentABPitches.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center">
                  {currentABPitches.map((p, idx) => (
                    <span
                      key={p.id}
                      className={cn(
                        'px-2 py-1 rounded text-xs font-semibold',
                        p.outcome === 'ball' && 'bg-ball text-white',
                        p.outcome === 'strike_looking' && 'bg-warning text-white',
                        p.outcome === 'strike_swinging' && 'bg-destructive text-white',
                        (p.outcome === 'foul' || p.outcome === 'foul_tip') && 'bg-foul text-white',
                      )}
                    >
                      {idx + 1}: {p.pitchType ? pitchTypes.find(pt => pt.value === p.pitchType)?.abbr : ''} {p.outcome.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 'pitch_type' && (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-2">
                {pitchTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => handlePitchType(type.value)}
                    className="py-4 rounded-lg bg-card border-2 border-border hover:border-accent transition-all font-semibold"
                  >
                    <span className="text-lg">{type.abbr}</span>
                    <span className="block text-[10px] text-muted-foreground mt-1">{type.label}</span>
                  </button>
                ))}
              </div>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => handlePitchType('skip')}
              >
                Skip (unknown)
              </Button>
            </div>
          )}

          {step === 'outcome' && (
            <div className="space-y-3">
              {outcomes.map((outcome) => (
                <button
                  key={outcome.value}
                  onClick={() => handleOutcome(outcome.value)}
                  className={cn(
                    'w-full py-4 rounded-lg font-bold text-white transition-all active:scale-[0.98]',
                    outcome.color
                  )}
                >
                  {outcome.label}
                </button>
              ))}
            </div>
          )}

          {step === 'spray' && (
            <div className="space-y-4">
              {/* Hit Type */}
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

              {/* Hit Result */}
              <div className="flex gap-2">
                {hitResults.map((result) => (
                  <button
                    key={result.value}
                    onClick={() => setHitResult(result.value)}
                    className={cn(
                      'flex-1 py-2 rounded-lg font-semibold text-sm transition-all border-2',
                      hitResult === result.value
                        ? `${result.color} text-white border-transparent`
                        : 'bg-card border-border hover:border-accent/50'
                    )}
                  >
                    {result.label}
                  </button>
                ))}
              </div>

              {/* Spray Chart */}
              <div className="flex justify-center">
                <SprayChart
                  points={sprayLocation ? [{
                    id: 'current',
                    x: sprayLocation.x,
                    y: sprayLocation.y,
                    result: hitResult,
                    hitType,
                  }] : []}
                  onAddPoint={handleSprayClick}
                  interactive
                  size="lg"
                />
              </div>

              {/* Exit Velo Toggle */}
              <div className="flex items-center justify-between p-3 bg-card rounded-lg border border-border">
                <Label htmlFor="showExitVelo">Track Exit Velocity</Label>
                <Switch
                  id="showExitVelo"
                  checked={showExitVelo}
                  onCheckedChange={setShowExitVelo}
                />
              </div>

              {showExitVelo && (
                <div className="flex gap-3 animate-fade-in">
                  <div className="flex-1">
                    <Input
                      type="number"
                      placeholder="Exit velo (mph)"
                      value={exitVelo}
                      onChange={(e) => setExitVelo(e.target.value)}
                    />
                  </div>
                  <button
                    onClick={() => setIsBarrel(!isBarrel)}
                    className={cn(
                      'px-4 rounded-lg font-semibold text-sm transition-all',
                      isBarrel
                        ? 'bg-barrel text-white'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    🛢️ Barrel
                  </button>
                </div>
              )}

              <Button
                className="w-full h-14 bg-accent hover:bg-accent/90 text-accent-foreground text-lg font-semibold"
                onClick={handleFinishSpray}
                disabled={!sprayLocation}
              >
                Complete At-Bat
              </Button>
            </div>
          )}
        </div>

        {/* Undo Button */}
        {(step !== 'location' || currentABPitches.length > 0) && (
          <div className="mt-6 flex justify-center">
            <Button variant="ghost" size="sm" onClick={handleUndo} className="text-muted-foreground">
              <RotateCcw className="w-4 h-4 mr-2" />
              Undo
            </Button>
          </div>
        )}

        {/* This Session Summary */}
        {outing.atBats.length > 0 && (
          <div className="mt-8 pt-4 border-t border-border">
            <p className="text-sm font-semibold text-muted-foreground mb-3">This Outing</p>
            <div className="flex flex-wrap gap-2">
              {outing.atBats.map((ab) => {
                const resultLabels: Record<string, { label: string; color: string }> = {
                  strikeout: { label: 'K', color: 'bg-destructive' },
                  walk: { label: 'BB', color: 'bg-muted text-foreground' },
                  hbp: { label: 'HBP', color: 'bg-muted text-foreground' },
                  out: { label: 'Out', color: 'bg-spray-out' },
                  single: { label: '1B', color: 'bg-spray-single' },
                  double: { label: '2B', color: 'bg-spray-double' },
                  triple: { label: '3B', color: 'bg-spray-triple' },
                  hr: { label: 'HR', color: 'bg-spray-hr' },
                };
                const info = resultLabels[ab.result] || { label: ab.result, color: 'bg-muted' };
                return (
                  <span
                    key={ab.id}
                    className={cn('px-3 py-1 rounded-full text-sm font-bold text-white', info.color)}
                  >
                    {info.label}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
