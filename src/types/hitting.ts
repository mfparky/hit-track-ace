export type OutingType = 'game' | 'batting_practice' | 'cage_session' | 'live_abs';

export type HitResult = 'hit' | 'whiff' | 'foul' | 'ball';

export type HitType = 'ground_ball' | 'line_drive' | 'fly_ball' | 'popup';

export type PitchType = 'fastball' | 'curveball' | 'slider' | 'changeup' | 'cutter' | 'sinker' | 'splitter' | 'other';

export type PitchOutcome = 
  | 'ball' 
  | 'strike_looking' 
  | 'strike_swinging' 
  | 'foul' 
  | 'foul_tip'
  | 'in_play_out' 
  | 'in_play_hit';

export interface Pitch {
  id: string;
  location: { x: number; y: number };
  pitchType?: PitchType;
  outcome: PitchOutcome;
  sprayPoint?: SprayChartPoint;
  exitVelocity?: number;
  isBarrel?: boolean;
}

export interface Player {
  id: string;
  name: string;
  number: string;
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
  pitches: Pitch[];
  result: 'strikeout' | 'walk' | 'hbp' | 'single' | 'double' | 'triple' | 'hr' | 'out';
  sprayPoint?: SprayChartPoint;
  exitVelocity?: number;
  isBarrel?: boolean;
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
