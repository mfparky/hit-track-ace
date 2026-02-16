import { SprayChartPoint, Outing, Pitch, AtBat } from '@/types/hitting';

export function calcAvgExitVelo(points: SprayChartPoint[]): number {
  const withVelo = points.filter(sp => sp.exitVelocity);
  if (withVelo.length === 0) return 0;
  return withVelo.reduce((acc, sp) => acc + (sp.exitVelocity || 0), 0) / withVelo.length;
}

export function calcBarrelPct(points: SprayChartPoint[]): number {
  if (points.length === 0) return 0;
  return (points.filter(sp => sp.isBarrel).length / points.length) * 100;
}

// Plate discipline calculations from pitch-level data

export interface PlateDisciplineStats {
  totalPitches: number;
  swings: number;
  takes: number;
  swingPct: number;
  whiffRate: number;       // swings & misses / total swings
  chasePct: number;        // swings at balls / total pitches outside zone
  calledStrikePct: number; // called strikes / total takes
  foulPct: number;         // fouls / total swings
  contactPct: number;      // contact / total swings
  firstPitchSwingPct: number;
  firstPitchHitPct: number;
  avgPitchesPerAB: number;
}

function isInZone(pitch: Pitch): boolean {
  const { x, y } = pitch.location;
  return Math.abs(x) <= 1 && y >= -1 && y <= 1;
}

function isSwing(outcome: Pitch['outcome']): boolean {
  return ['strike_swinging', 'foul', 'foul_tip', 'in_play_out', 'in_play_hit'].includes(outcome);
}

function isContact(outcome: Pitch['outcome']): boolean {
  return ['foul', 'foul_tip', 'in_play_out', 'in_play_hit'].includes(outcome);
}

export function calcPlateDiscipline(outings: Outing[]): PlateDisciplineStats {
  const allPitches: Pitch[] = outings.flatMap(o =>
    o.atBats.flatMap(ab => ab.pitches || [])
  );

  const allAtBats: AtBat[] = outings.flatMap(o => o.atBats);
  const atBatsWithPitches = allAtBats.filter(ab => ab.pitches && ab.pitches.length > 0);

  const totalPitches = allPitches.length;
  if (totalPitches === 0) {
    return {
      totalPitches: 0, swings: 0, takes: 0,
      swingPct: 0, whiffRate: 0, chasePct: 0, calledStrikePct: 0,
      foulPct: 0, contactPct: 0, firstPitchSwingPct: 0,
      firstPitchHitPct: 0, avgPitchesPerAB: 0,
    };
  }

  const swings = allPitches.filter(p => isSwing(p.outcome)).length;
  const takes = totalPitches - swings;
  const whiffs = allPitches.filter(p => p.outcome === 'strike_swinging').length;
  const fouls = allPitches.filter(p => ['foul', 'foul_tip'].includes(p.outcome)).length;
  const contacts = allPitches.filter(p => isContact(p.outcome)).length;
  const calledStrikes = allPitches.filter(p => p.outcome === 'strike_looking').length;

  // Chase: swings on pitches outside the zone
  const outsideZone = allPitches.filter(p => !isInZone(p));
  const chasePitches = outsideZone.filter(p => isSwing(p.outcome)).length;

  // First pitch stats
  const firstPitches = atBatsWithPitches.map(ab => ab.pitches[0]).filter(Boolean);
  const firstPitchSwings = firstPitches.filter(p => isSwing(p.outcome)).length;
  const firstPitchHits = firstPitches.filter(p => p.outcome === 'in_play_hit').length;

  const avgPitchesPerAB = atBatsWithPitches.length > 0
    ? atBatsWithPitches.reduce((acc, ab) => acc + ab.pitches.length, 0) / atBatsWithPitches.length
    : 0;

  return {
    totalPitches,
    swings,
    takes,
    swingPct: (swings / totalPitches) * 100,
    whiffRate: swings > 0 ? (whiffs / swings) * 100 : 0,
    chasePct: outsideZone.length > 0 ? (chasePitches / outsideZone.length) * 100 : 0,
    calledStrikePct: takes > 0 ? (calledStrikes / takes) * 100 : 0,
    foulPct: swings > 0 ? (fouls / swings) * 100 : 0,
    contactPct: swings > 0 ? (contacts / swings) * 100 : 0,
    firstPitchSwingPct: firstPitches.length > 0 ? (firstPitchSwings / firstPitches.length) * 100 : 0,
    firstPitchHitPct: firstPitches.length > 0 ? (firstPitchHits / firstPitches.length) * 100 : 0,
    avgPitchesPerAB,
  };
}

// Progression: per-outing stats for trend charts

export interface OutingTrendPoint {
  date: string;
  label: string;
  type: Outing['type'];
  avg: number;
  hits: number;
  atBats: number;
  strikeouts: number;
  walks: number;
  exitVelo: number;
  barrelPct: number;
  whiffRate: number;
  contactPct: number;
}

export function calcOutingTrends(outings: Outing[]): OutingTrendPoint[] {
  const sorted = [...outings].sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return sorted.map(o => {
    const abs = o.atBats;
    const officialABs = abs.filter(ab => !['walk', 'hbp'].includes(ab.result));
    const hits = abs.filter(ab => ['single', 'double', 'triple', 'hr'].includes(ab.result));
    const strikeouts = abs.filter(ab => ab.result === 'strikeout').length;
    const walks = abs.filter(ab => ab.result === 'walk').length;

    const sprayPoints = abs.map(ab => ab.sprayPoint).filter((sp): sp is SprayChartPoint => !!sp);
    const exitVelo = calcAvgExitVelo(sprayPoints);
    const barrelPct = calcBarrelPct(sprayPoints);

    const pitches = abs.flatMap(ab => ab.pitches || []);
    const swings = pitches.filter(p => isSwing(p.outcome)).length;
    const whiffs = pitches.filter(p => p.outcome === 'strike_swinging').length;
    const contacts = pitches.filter(p => isContact(p.outcome)).length;

    const typeLabels: Record<string, string> = {
      game: 'Game',
      batting_practice: 'BP',
      cage_session: 'Cage',
      live_abs: 'Live AB',
    };

    return {
      date: o.date,
      label: `${typeLabels[o.type] || o.type} ${new Date(o.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
      type: o.type,
      avg: officialABs.length > 0 ? hits.length / officialABs.length : 0,
      hits: hits.length,
      atBats: officialABs.length,
      strikeouts,
      walks,
      exitVelo,
      barrelPct,
      whiffRate: swings > 0 ? (whiffs / swings) * 100 : 0,
      contactPct: swings > 0 ? (contacts / swings) * 100 : 0,
    };
  });
}
