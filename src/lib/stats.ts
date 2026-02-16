import { SprayChartPoint } from '@/types/hitting';

export function calcAvgExitVelo(points: SprayChartPoint[]): number {
  const withVelo = points.filter(sp => sp.exitVelocity);
  if (withVelo.length === 0) return 0;
  return withVelo.reduce((acc, sp) => acc + (sp.exitVelocity || 0), 0) / withVelo.length;
}

export function calcBarrelPct(points: SprayChartPoint[]): number {
  if (points.length === 0) return 0;
  return (points.filter(sp => sp.isBarrel).length / points.length) * 100;
}
