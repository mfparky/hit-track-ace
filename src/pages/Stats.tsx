import { useHitting } from '@/context/HittingContext';
import { usePlayers } from '@/hooks/usePlayers';
import { BottomNav } from '@/components/hitting/BottomNav';
import { PageHeader } from '@/components/hitting/PageHeader';
import { StatCard } from '@/components/hitting/StatCard';
import { OutingCard } from '@/components/hitting/OutingCard';
import { SprayChart } from '@/components/hitting/SprayChart';
import { Target, Zap, TrendingUp, Activity, Award, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SprayChartPoint } from '@/types/hitting';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Stats() {
  const { outings } = useHitting();
  const { players } = usePlayers();
  const navigate = useNavigate();

  // Calculate aggregate stats
  const allSprayPoints: SprayChartPoint[] = outings.flatMap(o => 
    o.atBats.map(ab => ab.sprayPoint).filter((sp): sp is SprayChartPoint => !!sp)
  );

  const totalABs = outings.reduce((acc, o) => 
    acc + o.atBats.filter(ab => !['walk', 'hbp'].includes(ab.result)).length, 0
  );
  
  const totalHits = outings.reduce((acc, o) => 
    acc + o.atBats.filter(ab => ['single', 'double', 'triple', 'hr'].includes(ab.result)).length, 0
  );

  const homeRuns = outings.reduce((acc, o) => 
    acc + o.atBats.filter(ab => ab.result === 'hr').length, 0
  );

  const barrels = allSprayPoints.filter(sp => sp.isBarrel).length;
  const barrelPct = allSprayPoints.length > 0 ? (barrels / allSprayPoints.length) * 100 : 0;

  const avgExitVelo = allSprayPoints.filter(sp => sp.exitVelocity).length > 0
    ? allSprayPoints.reduce((acc, sp) => acc + (sp.exitVelocity || 0), 0) / allSprayPoints.filter(sp => sp.exitVelocity).length
    : 0;

  const battingAvg = totalABs > 0 ? (totalHits / totalABs) : 0;
  

  const sortedOutings = [...outings].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader title="Stats & Analytics" />

      <div className="px-4 py-4 max-w-lg mx-auto">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full grid grid-cols-3 mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="spray">Spray</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 animate-fade-in">
            {/* Hero Stat */}
            <div className="text-center py-6 bg-gradient-to-br from-primary to-primary/80 rounded-xl text-primary-foreground">
              <p className="text-sm font-medium opacity-70 mb-1">Team Batting Average</p>
              <p className="text-6xl font-bold font-mono tracking-tight">
                .{battingAvg.toFixed(3).replace('0.', '')}
              </p>
              <p className="text-sm opacity-70 mt-2">
                {totalHits} hits in {totalABs} at-bats
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                label="Home Runs"
                value={homeRuns}
                icon={Award}
                iconColor="text-purple-500"
              />
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
              <StatCard
                label="Players"
                value={players.length}
                icon={BarChart3}
                iconColor="text-pink-500"
              />
            </div>
          </TabsContent>

          <TabsContent value="spray" className="space-y-6 animate-fade-in">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-4">All Batted Balls</h3>
              <div className="flex justify-center">
                <SprayChart points={allSprayPoints} size="lg" />
              </div>
              <div className="flex justify-center gap-4 mt-4 text-xs">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-spray-single" /> 1B
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-spray-double" /> 2B
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-spray-triple" /> 3B
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-spray-hr" /> HR
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-spray-out" /> Out
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-4 bg-card border border-border rounded-lg text-center">
                <p className="stat-value text-spray-single">{allSprayPoints.filter(p => p.result === 'single').length}</p>
                <p className="stat-label">Singles</p>
              </div>
              <div className="p-4 bg-card border border-border rounded-lg text-center">
                <p className="stat-value text-spray-double">{allSprayPoints.filter(p => p.result === 'double').length}</p>
                <p className="stat-label">Doubles</p>
              </div>
              <div className="p-4 bg-card border border-border rounded-lg text-center">
                <p className="stat-value text-spray-hr">{allSprayPoints.filter(p => p.result === 'hr').length}</p>
                <p className="stat-label">Home Runs</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-3 animate-fade-in">
            {sortedOutings.length > 0 ? (
              sortedOutings.map((outing) => {
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
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <BottomNav />
    </div>
  );
}
