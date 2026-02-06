import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayers } from '@/hooks/usePlayers';
import { useOutings } from '@/hooks/useOutings';
import { PageHeader } from '@/components/hitting/PageHeader';
import { BottomNav } from '@/components/hitting/BottomNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Outing, OutingType } from '@/types/hitting';
import { Zap, ClipboardList, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const outingTypes: { value: OutingType; label: string; description: string }[] = [
  { value: 'game', label: 'Game', description: 'Competitive game at-bats' },
  { value: 'batting_practice', label: 'Batting Practice', description: 'BP session with coach' },
  { value: 'cage_session', label: 'Cage Session', description: 'Indoor cage work' },
  { value: 'live_abs', label: 'Live ABs', description: 'Live pitching practice' },
];

export default function NewOuting() {
  const navigate = useNavigate();
  const { addOuting } = useOutings();
  const { players, isLoading } = usePlayers();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isCreating, setIsCreating] = useState(false);
  const [outingData, setOutingData] = useState({
    playerId: '',
    type: '' as OutingType,
    opponent: '',
  });

  const handleStartLive = async () => {
    if (!outingData.playerId || !outingData.type || isCreating) return;

    setIsCreating(true);
    try {
      const outing = await addOuting({
        playerId: outingData.playerId,
        type: outingData.type,
        date: new Date().toISOString().split('T')[0],
        opponent: outingData.opponent || undefined,
        atBats: [],
        isComplete: false,
      });
      navigate(`/live/${outing.id}`);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create outing. Please try again.',
        variant: 'destructive',
      });
      setIsCreating(false);
    }
  };

  const handleStartLog = async () => {
    if (!outingData.playerId || !outingData.type || isCreating) return;

    setIsCreating(true);
    try {
      const outing = await addOuting({
        playerId: outingData.playerId,
        type: outingData.type,
        date: new Date().toISOString().split('T')[0],
        opponent: outingData.opponent || undefined,
        atBats: [],
        isComplete: false,
      });
      navigate(`/log/${outing.id}`);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create outing. Please try again.',
        variant: 'destructive',
      });
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader title="New Outing" showBack />

      <div className="px-4 py-6 max-w-lg mx-auto">
        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <Label className="text-base font-semibold mb-3 block">Select Player</Label>
              <Select
                value={outingData.playerId}
                onValueChange={(value) => setOutingData({ ...outingData, playerId: value })}
              >
                <SelectTrigger className="h-14">
                  <SelectValue placeholder={isLoading ? "Loading players..." : "Choose a player..."} />
                </SelectTrigger>
                <SelectContent>
                  {isLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : players.length === 0 ? (
                    <div className="py-4 text-center text-muted-foreground text-sm">
                      No players yet. Add players in the Roster first.
                    </div>
                  ) : (
                    players.map((player) => (
                      <SelectItem key={player.id} value={player.id}>
                        <span className="flex items-center gap-2">
                          <span className="font-mono text-accent">#{player.number}</span>
                          <span>{player.name}</span>
                        </span>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-base font-semibold mb-3 block">Outing Type</Label>
              <RadioGroup
                value={outingData.type}
                onValueChange={(value: OutingType) => setOutingData({ ...outingData, type: value })}
                className="grid grid-cols-2 gap-3"
              >
                {outingTypes.map((type) => (
                  <Label
                    key={type.value}
                    htmlFor={type.value}
                    className={`flex flex-col p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      outingData.type === type.value
                        ? 'border-accent bg-accent/5'
                        : 'border-border hover:border-accent/50'
                    }`}
                  >
                    <RadioGroupItem value={type.value} id={type.value} className="sr-only" />
                    <span className="font-semibold">{type.label}</span>
                    <span className="text-xs text-muted-foreground mt-1">{type.description}</span>
                  </Label>
                ))}
              </RadioGroup>
            </div>

            {outingData.type === 'game' && (
              <div className="animate-fade-in">
                <Label htmlFor="opponent">Opponent (optional)</Label>
                <Input
                  id="opponent"
                  placeholder="e.g., Eagles"
                  value={outingData.opponent}
                  onChange={(e) => setOutingData({ ...outingData, opponent: e.target.value })}
                  className="mt-1"
                />
              </div>
            )}

            <Button
              className="w-full h-14 bg-accent hover:bg-accent/90 text-accent-foreground text-lg font-semibold"
              onClick={() => setStep(2)}
              disabled={!outingData.playerId || !outingData.type}
            >
              Continue
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="text-xl font-bold text-center mb-6">How do you want to track?</h2>

            <button
              onClick={handleStartLive}
              className="w-full p-6 rounded-xl border-2 border-accent bg-accent/5 hover:bg-accent/10 transition-all text-left group"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-accent text-accent-foreground">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg group-hover:text-accent transition-colors">Live Mode</h3>
                  <p className="text-muted-foreground text-sm mt-1">
                    Track at-bats in real-time as they happen. Chart pitches and results live.
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={handleStartLog}
              className="w-full p-6 rounded-xl border-2 border-border hover:border-accent/50 transition-all text-left group"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-muted text-muted-foreground">
                  <ClipboardList className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg group-hover:text-accent transition-colors">Log Mode</h3>
                  <p className="text-muted-foreground text-sm mt-1">
                    Enter at-bats after the session. Great for reviewing and logging completed outings.
                  </p>
                </div>
              </div>
            </button>

            <Button
              variant="ghost"
              className="w-full mt-4"
              onClick={() => setStep(1)}
            >
              Back
            </Button>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
