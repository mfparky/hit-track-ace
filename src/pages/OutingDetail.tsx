import { useParams, useNavigate } from 'react-router-dom';
import { useHitting } from '@/context/HittingContext';
import { PageHeader } from '@/components/hitting/PageHeader';
import { BottomNav } from '@/components/hitting/BottomNav';
import { SprayChart } from '@/components/hitting/SprayChart';
import { StatCard } from '@/components/hitting/StatCard';
import { Button } from '@/components/ui/button';
import { SprayChartPoint, OutingType } from '@/types/hitting';
import { Target, Zap, TrendingUp, Trash2, Calendar, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
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

const outingTypeLabels: Record<OutingType, string> = {
  game: 'Game',
  batting_practice: 'Batting Practice',
  cage_session: 'Cage Session',
  live_abs: 'Live ABs',
};

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

export default function OutingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { players, outings, deleteOuting } = useHitting();

  const outing = outings.find(o => o.id === id);
  const player = players.find(p => p.id === outing?.playerId);

  if (!outing || !player) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Outing not found</p>
      </div>
    );
  }

  const sprayPoints: SprayChartPoint[] = outing.atBats
    .map(ab => ab.sprayPoint)
    .filter((sp): sp is SprayChartPoint => !!sp);

  const totalABs = outing.atBats.filter(ab => !['walk', 'hbp'].includes(ab.result)).length;
  const hits = outing.atBats.filter(ab => 
    ['single', 'double', 'triple', 'hr'].includes(ab.result)
  ).length;
  const battingAvg = totalABs > 0 ? hits / totalABs : 0;

  const barrels = sprayPoints.filter(sp => sp.isBarrel).length;
  const barrelPct = sprayPoints.length > 0 ? (barrels / sprayPoints.length) * 100 : 0;

  const avgExitVelo = sprayPoints.filter(sp => sp.exitVelocity).length > 0
    ? sprayPoints.reduce((acc, sp) => acc + (sp.exitVelocity || 0), 0) / sprayPoints.filter(sp => sp.exitVelocity).length
    : 0;

  const handleDelete = () => {
    deleteOuting(outing.id);
    navigate(-1);
  };

  const handleResume = () => {
    navigate(`/live/${outing.id}`);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader
        title={outingTypeLabels[outing.type]}
        subtitle={player.name}
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
                <AlertDialogTitle>Delete Outing</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this outing? This action cannot be undone.
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

      <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
        {/* Meta Info */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {format(new Date(outing.date), 'MMMM d, yyyy')}
          </span>
          {outing.opponent && (
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              vs {outing.opponent}
            </span>
          )}
        </div>

        {/* Live indicator */}
        {!outing.isComplete && (
          <div className="flex items-center justify-between p-4 bg-warning/10 border border-warning/30 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-warning animate-pulse" />
              <span className="font-medium text-warning">In Progress</span>
            </div>
            <Button size="sm" onClick={handleResume} className="bg-warning hover:bg-warning/90 text-warning-foreground">
              Resume
            </Button>
          </div>
        )}

        {/* Big AVG */}
        <div className="text-center py-4">
          <p className="text-5xl font-bold font-mono">
            .{battingAvg.toFixed(3).replace('0.', '')}
          </p>
          <p className="text-muted-foreground mt-1">
            {hits}-{totalABs} ({outing.atBats.length} PA)
          </p>
        </div>

        {/* Spray Chart */}
        {sprayPoints.length > 0 && (
          <div className="flex justify-center">
            <SprayChart points={sprayPoints} size="lg" />
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            label="Barrel %"
            value={`${barrelPct.toFixed(0)}%`}
            icon={Target}
            size="sm"
            highlight={barrelPct > 10}
          />
          <StatCard
            label="Exit Velo"
            value={avgExitVelo > 0 ? avgExitVelo.toFixed(0) : '--'}
            icon={Zap}
            size="sm"
          />
          <StatCard
            label="Hard Hit"
            value={`${((sprayPoints.filter(sp => (sp.exitVelocity || 0) >= 95).length / (sprayPoints.length || 1)) * 100).toFixed(0)}%`}
            icon={TrendingUp}
            size="sm"
          />
        </div>

        {/* At-Bats List */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">At-Bats</h3>
          <div className="space-y-2">
            {outing.atBats.map((ab, idx) => {
              const resultInfo = resultLabels[ab.result] || { label: ab.result, color: 'bg-muted' };
              const pitchCount = ab.pitches?.length || 0;
              return (
                <div
                  key={ab.id}
                  className="flex items-center justify-between p-3 bg-card border border-border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono text-muted-foreground w-6">#{idx + 1}</span>
                    <span
                      className={cn(
                        'px-3 py-1 rounded-full text-sm font-bold text-white',
                        resultInfo.color
                      )}
                    >
                      {resultInfo.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {ab.sprayPoint?.exitVelocity && (
                      <span className="font-mono">{ab.sprayPoint.exitVelocity} mph</span>
                    )}
                    {ab.sprayPoint?.isBarrel && (
                      <span className="text-barrel font-semibold">🛢️</span>
                    )}
                    {pitchCount > 0 && <span>{pitchCount} pitches</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
