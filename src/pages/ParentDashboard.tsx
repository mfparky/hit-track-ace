import { useParams } from 'react-router-dom';
import { usePlayers } from '@/hooks/usePlayers';
import { useOutings } from '@/hooks/useOutings';
import { StatCard } from '@/components/hitting/StatCard';
import { SprayChart } from '@/components/hitting/SprayChart';
import { SprayChartLegend } from '@/components/hitting/SprayChartLegend';
import { ZoneHeatMap } from '@/components/hitting/ZoneHeatMap';
import { Target, Zap, TrendingUp, Activity, User, Loader2, Youtube, ExternalLink } from 'lucide-react';
import { SprayChartPoint, Pitch } from '@/types/hitting';
import { calcAvgExitVelo, calcBarrelPct } from '@/lib/stats';
import { Button } from '@/components/ui/button';

export default function ParentDashboard() {
  const { id } = useParams<{ id: string }>();
  const { players, isLoading } = usePlayers();
  const { outings } = useOutings();

  const player = players.find(p => p.id === id);
  const playerOutings = outings.filter(o => o.playerId === id);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

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

  const allPitches: Pitch[] = playerOutings.flatMap(o =>
    o.atBats.flatMap(ab => ab.pitches || [])
  );

  const totalABs = playerOutings.reduce((acc, o) =>
    acc + o.atBats.filter(ab => !['walk', 'hbp'].includes(ab.result)).length, 0
  );

  const totalHits = playerOutings.reduce((acc, o) =>
    acc + o.atBats.filter(ab => ['single', 'double', 'triple', 'hr'].includes(ab.result)).length, 0
  );

  const barrelPct = calcBarrelPct(allSprayPoints);
  const avgExitVelo = calcAvgExitVelo(allSprayPoints);

  const battingAvg = totalABs > 0 ? (totalHits / totalABs) : 0;

  return (
    <div className="min-h-screen bg-background pb-12">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-6">
        <div className="max-w-lg mx-auto flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground">
            {player.avatar ? (
              <img src={player.avatar} alt={player.name} className="w-full h-full rounded-full object-cover" />
            ) : (
              <User className="w-10 h-10" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{player.name}</h1>
            <p className="text-muted-foreground">
              #{player.number} • Bats {player.bats === 'S' ? 'Switch' : player.bats}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-3xl font-bold font-mono">
                .{battingAvg.toFixed(3).replace('0.', '')}
              </span>
              <span className="text-sm text-muted-foreground">AVG</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 max-w-lg mx-auto">
        {/* YouTube Playlist */}
        {player.youtubePlaylistUrl && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Swing Videos</h3>
            <a
              href={player.youtubePlaylistUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" className="w-full flex items-center gap-2">
                <Youtube className="w-5 h-5 text-red-500" />
                Watch Swing Playlist
                <ExternalLink className="w-4 h-4 ml-auto text-muted-foreground" />
              </Button>
            </a>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <StatCard label="Batting Avg" value={`.${battingAvg.toFixed(3).replace('0.', '')}`} icon={TrendingUp} iconColor="text-green-500" size="sm" />
          <StatCard label="Barrel %" value={`${barrelPct.toFixed(1)}%`} icon={Target} iconColor="text-accent" size="sm" />
          <StatCard label="Avg Exit Velo" value={avgExitVelo > 0 ? `${avgExitVelo.toFixed(1)}` : '--'} icon={Zap} iconColor="text-yellow-500" size="sm" />
          <StatCard label="Outings" value={playerOutings.length} icon={Activity} iconColor="text-blue-500" size="sm" />
        </div>

        {/* Spray Chart */}
        {allSprayPoints.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Spray Chart</h3>
            <div className="flex justify-center">
              <SprayChart points={allSprayPoints} size="lg" />
            </div>
            <SprayChartLegend />
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

        {/* Summary */}
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Summary</h3>
          <div className="grid grid-cols-2 gap-y-2 text-sm">
            <span className="text-muted-foreground">Hits</span>
            <span className="text-right font-medium">{totalHits}</span>
            <span className="text-muted-foreground">At Bats</span>
            <span className="text-right font-medium">{totalABs}</span>
            <span className="text-muted-foreground">Total Outings</span>
            <span className="text-right font-medium">{playerOutings.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}