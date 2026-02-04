export type OutingType = 'game' | 'batting_practice' | 'cage_session' | 'live_abs';

export type HitResult = 'hit' | 'whiff' | 'foul' | 'ball';

export type HitType = 'ground_ball' | 'line_drive' | 'fly_ball' | 'popup';

export interface Player {
  id: string;
  name: string;
  number: string;
  position: string;
  bats: 'L' | 'R' | 'S';
  avatar?: string;
}

export interface SprayChartPoint {
  id: string;
  x: number; // -1 to 1 (left field to right field)
  y: number; // 0 to 1 (home to outfield)
  result: 'single' | 'double' | 'triple' | 'hr' | 'out';
  hitType: HitType;
  exitVelocity?: number;
  isBarrel?: boolean;
}

export interface LocationPoint {
  id: string;
  x: number; // -1 to 1 (inside to outside)
  y: number; // -1 to 1 (low to high)
  result: HitResult;
  exitVelocity?: number;
  isBarrel?: boolean;
}

export interface AtBat {
  id: string;
  pitchCount: number;
  result: 'strikeout' | 'walk' | 'hbp' | 'single' | 'double' | 'triple' | 'hr' | 'out';
  locations: LocationPoint[];
  sprayPoint?: SprayChartPoint;
  notes?: string;
}

export interface Outing {
  id: string;
  playerId: string;
  type: OutingType;
  date: string;
  opponent?: string;
  atBats: AtBat[];
  notes?: string;
  isComplete: boolean;
}

export interface HittingStats {
  atBats: number;
  hits: number;
  singles: number;
  doubles: number;
  triples: number;
  homeRuns: number;
  strikeouts: number;
  walks: number;
  avg: number;
  slg: number;
  barrelPct: number;
  avgExitVelo: number;
  hardHitPct: number;
}
