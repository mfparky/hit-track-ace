import { useState, useEffect, useMemo } from 'react';
import { usePlayers } from '@/hooks/usePlayers';
import { useOutings } from '@/hooks/useOutings';
import { BottomNav } from '@/components/hitting/BottomNav';
import { PageHeader } from '@/components/hitting/PageHeader';
import { StatCard } from '@/components/hitting/StatCard';
import { OutingCard } from '@/components/hitting/OutingCard';
import { SprayChart } from '@/components/hitting/SprayChart';
import { Target, Zap, TrendingUp, Activity, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SprayChartPoint } from '@/types/hitting';
import { calcAvgExitVelo, calcBarrelPct } from '@/lib/stats';

interface FunFact {
  label: string;
  value: string | number;
  subtitle: string;
  emoji: string;
}

const Index = () => {
  const { outings } = useOutings();
  const { players, isLoading } = usePlayers();
  const navigate = useNavigate();
  const [factIndex, setFactIndex] = useState(0);

  // Calculate aggregate stats
  const allSprayPoints: SprayChartPoint[] = outings.flatMap(o => 
    o.atBats.map(ab => ab.sprayPoint).filter((sp): sp is SprayChartPoint => !!sp)
  );

  const totalPitches = outings.reduce((acc, o) => 
    acc + o.atBats.reduce((abAcc, ab) => abAcc + (ab.pitches?.length || 0), 0), 0
  );

  const recentOutings = [...outings]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const totalABs = outings.reduce((acc, o) => 
    acc + o.atBats.filter(ab => !['walk', 'hbp'].includes(ab.result)).length, 0
  );
  
  const totalHits = outings.reduce((acc, o) => 
    acc + o.atBats.filter(ab => ['single', 'double', 'triple', 'hr'].includes(ab.result)).length, 0
  );

  const totalHomeRuns = outings.reduce((acc, o) => 
    acc + o.atBats.filter(ab => ab.result === 'hr').length, 0
  );

  const barrels = allSprayPoints.filter(sp => sp.isBarrel).length;
  const barrelPct = calcBarrelPct(allSprayPoints);
  const avgExitVelo = calcAvgExitVelo(allSprayPoints);

  // Build fun facts array
  const funFacts: FunFact[] = useMemo(() => {
    const facts: FunFact[] = [];
    
    if (totalPitches > 0) {
      facts.push({
        label: 'Pitches Seen',
        value: totalPitches.toLocaleString(),
        subtitle: 'Total pitches tracked',
        emoji: '⚾'
      });
    }
    
    if (barrels > 0) {
      facts.push({
        label: 'Barrels',
        value: barrels,
        subtitle: 'Sweet spot contact!',
        emoji: '🛢️'
      });
    }
    
    if (totalHits > 0) {
      facts.push({
        label: 'Total Hits',
        value: totalHits,
        subtitle: `Across ${totalABs} at-bats`,
        emoji: '💥'
      });
    }
    
    if (totalHomeRuns > 0) {
      facts.push({
        label: 'Home Runs',
        value: totalHomeRuns,
        subtitle: 'Going yard!',
        emoji: '🚀'
      });
    }
    
    if (outings.length > 0) {
      facts.push({
        label: 'Sessions Logged',
        value: outings.length,
        subtitle: 'Keep grinding!',
        emoji: '📊'
      });
    }

    if (allSprayPoints.length > 0) {
      facts.push({
        label: 'Balls in Play',
        value: allSprayPoints.length,
        subtitle: 'Making contact!',
        emoji: '🎯'
      });
    }
    
    // Default if no data yet
    if (facts.length === 0) {
      facts.push({
        label: 'Ready to Track',
        value: '0',
        subtitle: 'Start your first session!',
        emoji: '⚡'
      });
    }
    
    return facts;
  }, [totalPitches, barrels, totalHits, totalABs, totalHomeRuns, outings.length, allSprayPoints.length]);

  // Rotate facts every 4 seconds
  useEffect(() => {
    if (funFacts.length <= 1) return;
    
    const interval = setInterval(() => {
      setFactIndex((prev) => (prev + 1) % funFacts.length);
    }, 4000);
    
    return () => clearInterval(interval);
  }, [funFacts.length]);

  const currentFact = funFacts[factIndex] || funFacts[0];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary via-primary to-primary/90 text-primary-foreground">
        <PageHeader 
          title="Hit Tracker" 
          className="bg-transparent border-transparent text-primary-foreground"
        />
        
        <div className="px-4 pb-8 max-w-lg mx-auto">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-primary-foreground/70 text-sm font-medium flex items-center gap-2">
                <span className="text-lg">{currentFact.emoji}</span>
                {currentFact.label}
              </p>
              <p className="text-5xl font-bold font-mono tracking-tight animate-fade-in" key={factIndex}>
                {currentFact.value}
              </p>
              <p className="text-primary-foreground/70 text-sm mt-1">
                {currentFact.subtitle}
              </p>
              {/* Dots indicator */}
              {funFacts.length > 1 && (
                <div className="flex gap-1.5 mt-3">
                  {funFacts.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setFactIndex(i)}
                      aria-label={`Go to fact ${i + 1} of ${funFacts.length}`}
                      className={`w-1.5 h-1.5 rounded-full transition-all ${
                        i === factIndex
                          ? 'bg-primary-foreground w-4'
                          : 'bg-primary-foreground/40 hover:bg-primary-foreground/60'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
            
            {/* Mini Spray Chart */}
            <div className="opacity-90 flex-shrink-0">
              <SprayChart points={allSprayPoints.slice(0, 10)} size="sm" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="px-4 -mt-4 max-w-lg mx-auto">
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="Barrel %"
            value={`${barrelPct.toFixed(1)}%`}
            icon={Target}
            iconColor="text-accent"
          />
          <StatCard
            label="Avg Exit Velo"
            value={avgExitVelo > 0 ? `${avgExitVelo.toFixed(1)}` : '--'}
            icon={Zap}
            iconColor="text-yellow-500"
          />
          <StatCard
            label="Total Hits"
            value={totalHits}
            icon={TrendingUp}
            iconColor="text-green-500"
          />
          <StatCard
            label="Total Outings"
            value={outings.length}
            icon={Activity}
            iconColor="text-blue-500"
          />
        </div>
      </div>

      {/* Recent Outings */}
      <div className="px-4 mt-8 max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Outings</h2>
          <button 
            onClick={() => navigate('/stats')}
            className="text-sm font-medium text-accent hover:underline"
          >
            View All
          </button>
        </div>

        <div className="space-y-3">
          {recentOutings.length > 0 ? (
            recentOutings.map((outing) => {
              const player = players.find(p => p.id === outing.playerId);
              return (
                <OutingCard
                  key={outing.id}
                  outing={outing}
                  playerName={player?.name}
                  onClick={() => navigate(`/outing/${outing.id}`)}
                />
              );
            })
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No outings yet</p>
              <p className="text-sm mt-1">Tap + to start tracking</p>
            </div>
          )}
        </div>
      </div>

      {/* Roster Preview */}
      <div className="px-4 mt-8 max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Roster ({isLoading ? '...' : players.length})</h2>
          <button 
            onClick={() => navigate('/roster')}
            className="text-sm font-medium text-accent hover:underline"
          >
            Manage
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {players.map((player) => (
              <button
                key={player.id}
                onClick={() => navigate(`/player/${player.id}`)}
                className="flex-shrink-0 flex flex-col items-center gap-2 p-3 bg-card border border-border rounded-xl hover:border-accent/50 transition-all"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground font-bold">
                  {player.number}
                </div>
                <span className="text-sm font-medium truncate max-w-[80px]">
                  {player.name.split(' ')[0]}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Index;
