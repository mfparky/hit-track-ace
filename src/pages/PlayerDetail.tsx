import { useParams, useNavigate } from 'react-router-dom';
import { useHitting } from '@/context/HittingContext';
import { BottomNav } from '@/components/hitting/BottomNav';
import { PageHeader } from '@/components/hitting/PageHeader';
import { StatCard } from '@/components/hitting/StatCard';
import { OutingCard } from '@/components/hitting/OutingCard';
import { SprayChart } from '@/components/hitting/SprayChart';
import { ZoneHeatMap } from '@/components/hitting/ZoneHeatMap';
import { Button } from '@/components/ui/button';
import { Target, Zap, TrendingUp, Activity, Trash2, User } from 'lucide-react';
import { SprayChartPoint, Pitch } from '@/types/hitting';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function PlayerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { players, outings, deletePlayer } = useHitting();

  const player = players.find(p => p.id === id);
  const playerOutings = outings.filter(o => o.playerId === id);

  if (!player) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Player not found</p>
      </div>
    );
  }

  const allSprayPoints: SprayChartPoint[] = playerOutings.flatMap(o => 
    o.atBats.map(ab => ab.sprayPoint).filter((sp): sp is SprayChartPoint => !!sp)
  );

  // Collect all pitches for heat map
  const allPitches: Pitch[] = playerOutings.flatMap(o => 
    o.atBats.flatMap(ab => ab.pitches || [])
  );

  const totalABs = playerOutings.reduce((acc, o) => 
    acc + o.atBats.filter(ab => !['walk', 'hbp'].includes(ab.result)).length, 0
  );
  
  const totalHits = playerOutings.reduce((acc, o) => 
    acc + o.atBats.filter(ab => ['single', 'double', 'triple', 'hr'].includes(ab.result)).length, 0
  );

  const barrels = allSprayPoints.filter(sp => sp.isBarrel).length;
  const barrelPct = allSprayPoints.length > 0 ? (barrels / allSprayPoints.length) * 100 : 0;

  const avgExitVelo = allSprayPoints.filter(sp => sp.exitVelocity).length > 0
    ? allSprayPoints.reduce((acc, sp) => acc + (sp.exitVelocity || 0), 0) / allSprayPoints.filter(sp => sp.exitVelocity).length
    : 0;

  const battingAvg = totalABs > 0 ? (totalHits / totalABs) : 0;

  const handleDelete = () => {
    deletePlayer(player.id);
    navigate('/roster');
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader
        title={player.name}
        subtitle={`#${player.number} • ${player.position}`}
        showBack
        action={
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="icon" variant="ghost" className="text-destructive">
                <Trash2 className="w-5 h-5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="max-w-sm mx-4">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Player</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete {player.name}? This will also delete all their outings.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        }
      />

      <div className="px-4 py-6 max-w-lg mx-auto">
        {/* Player Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground">
            {player.avatar ? (
              <img src={player.avatar} alt={player.name} className="w-full h-full rounded-full object-cover" />
            ) : (
              <User className="w-10 h-10" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold font-mono">
                .{battingAvg.toFixed(3).replace('0.', '')}
              </span>
              <span className="text-sm text-muted-foreground">AVG</span>
            </div>
            <p className="text-muted-foreground">
              Bats {player.bats === 'S' ? 'Switch' : player.bats} • {playerOutings.length} outings
            </p>
          </div>
        </div>

        {/* Spray Chart */}
        {allSprayPoints.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Spray Chart</h3>
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
        )}

        {/* Zone Heat Map */}
        {allPitches.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Zone Heat Map</h3>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex justify-center">
                <ZoneHeatMap pitches={allPitches} size="lg" />
              </div>
              <p className="text-center text-xs text-muted-foreground mt-2">
                Hit rate by zone • Green outline = strike zone
              </p>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <StatCard
            label="Barrel %"
            value={`${barrelPct.toFixed(1)}%`}
            icon={Target}
            iconColor="text-accent"
            size="sm"
          />
          <StatCard
            label="Avg Exit Velo"
            value={avgExitVelo > 0 ? `${avgExitVelo.toFixed(1)}` : '--'}
            icon={Zap}
            iconColor="text-yellow-500"
            size="sm"
          />
          <StatCard
            label="Hits"
            value={totalHits}
            icon={TrendingUp}
            iconColor="text-green-500"
            size="sm"
          />
          <StatCard
            label="At Bats"
            value={totalABs}
            icon={Activity}
            iconColor="text-blue-500"
            size="sm"
          />
        </div>

        {/* Outings */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Outings</h3>
          <div className="space-y-3">
            {playerOutings.length > 0 ? (
              playerOutings.map((outing) => (
                <OutingCard
                  key={outing.id}
                  outing={outing}
                  onClick={() => navigate(`/outing/${outing.id}`)}
                />
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No outings yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
