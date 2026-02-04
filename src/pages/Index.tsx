import { useHitting } from '@/context/HittingContext';
import { BottomNav } from '@/components/hitting/BottomNav';
import { PageHeader } from '@/components/hitting/PageHeader';
import { StatCard } from '@/components/hitting/StatCard';
import { OutingCard } from '@/components/hitting/OutingCard';
import { SprayChart } from '@/components/hitting/SprayChart';
import { Target, Zap, TrendingUp, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SprayChartPoint } from '@/types/hitting';

const Index = () => {
  const { players, outings } = useHitting();
  const navigate = useNavigate();

  // Calculate aggregate stats
  const allSprayPoints: SprayChartPoint[] = outings.flatMap(o => 
    o.atBats.map(ab => ab.sprayPoint).filter((sp): sp is SprayChartPoint => !!sp)
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

  const barrels = allSprayPoints.filter(sp => sp.isBarrel).length;
  const barrelPct = allSprayPoints.length > 0 ? (barrels / allSprayPoints.length) * 100 : 0;

  const avgExitVelo = allSprayPoints.filter(sp => sp.exitVelocity).length > 0
    ? allSprayPoints.reduce((acc, sp) => acc + (sp.exitVelocity || 0), 0) / allSprayPoints.filter(sp => sp.exitVelocity).length
    : 0;

  const battingAvg = totalABs > 0 ? (totalHits / totalABs) : 0;

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
            <div>
              <p className="text-primary-foreground/70 text-sm font-medium">Team Average</p>
              <p className="text-5xl font-bold font-mono tracking-tight">
                .{battingAvg.toFixed(3).replace('0.', '')}
              </p>
              <p className="text-primary-foreground/70 text-sm mt-1">
                {totalHits} hits in {totalABs} ABs
              </p>
            </div>
            
            {/* Mini Spray Chart */}
            <div className="opacity-90">
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
            highlight={barrelPct > 10}
          />
          <StatCard
            label="Avg Exit Velo"
            value={avgExitVelo > 0 ? `${avgExitVelo.toFixed(1)}` : '--'}
            icon={Zap}
          />
          <StatCard
            label="Hard Hit %"
            value={`${((allSprayPoints.filter(sp => (sp.exitVelocity || 0) >= 95).length / (allSprayPoints.length || 1)) * 100).toFixed(1)}%`}
            icon={TrendingUp}
          />
          <StatCard
            label="Total Outings"
            value={outings.length}
            icon={Activity}
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
          <h2 className="text-lg font-semibold">Roster ({players.length})</h2>
          <button 
            onClick={() => navigate('/roster')}
            className="text-sm font-medium text-accent hover:underline"
          >
            Manage
          </button>
        </div>

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
      </div>

      <BottomNav />
    </div>
  );
};

export default Index;
