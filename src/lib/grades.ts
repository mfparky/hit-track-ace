import { PlateDisciplineStats } from './stats';

// --- Grade Scale ---

export type LetterGrade = 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D' | 'F';

const GRADE_THRESHOLDS: { min: number; grade: LetterGrade }[] = [
  { min: 97, grade: 'A+' },
  { min: 93, grade: 'A' },
  { min: 90, grade: 'A-' },
  { min: 87, grade: 'B+' },
  { min: 83, grade: 'B' },
  { min: 80, grade: 'B-' },
  { min: 77, grade: 'C+' },
  { min: 73, grade: 'C' },
  { min: 70, grade: 'C-' },
  { min: 60, grade: 'D' },
  { min: 0, grade: 'F' },
];

export function scoreToGrade(score: number): LetterGrade {
  for (const t of GRADE_THRESHOLDS) {
    if (score >= t.min) return t.grade;
  }
  return 'F';
}

export function gradeColor(grade: LetterGrade): string {
  if (grade.startsWith('A')) return '#22c55e'; // green
  if (grade.startsWith('B')) return '#3b82f6'; // blue
  if (grade.startsWith('C')) return '#eab308'; // yellow
  if (grade === 'D') return '#f97316';         // orange
  return '#ef4444';                             // red
}

export function gradeBgClass(grade: LetterGrade): string {
  if (grade.startsWith('A')) return 'bg-green-500/15 text-green-500 border-green-500/30';
  if (grade.startsWith('B')) return 'bg-blue-500/15 text-blue-500 border-blue-500/30';
  if (grade.startsWith('C')) return 'bg-yellow-500/15 text-yellow-500 border-yellow-500/30';
  if (grade === 'D') return 'bg-orange-500/15 text-orange-500 border-orange-500/30';
  return 'bg-red-500/15 text-red-500 border-red-500/30';
}

// --- Metric Scoring ---
// Linear interpolation between benchmark checkpoints.
// Each checkpoint is [metricValue, score]. Must be sorted by metricValue ascending.

type Checkpoint = [number, number];

function interpolateScore(value: number, checkpoints: Checkpoint[]): number {
  if (value <= checkpoints[0][0]) return checkpoints[0][1];
  if (value >= checkpoints[checkpoints.length - 1][0]) return checkpoints[checkpoints.length - 1][1];

  for (let i = 0; i < checkpoints.length - 1; i++) {
    const [v1, s1] = checkpoints[i];
    const [v2, s2] = checkpoints[i + 1];
    if (value >= v1 && value <= v2) {
      const t = (value - v1) / (v2 - v1);
      return s1 + t * (s2 - s1);
    }
  }
  return 50;
}

// Higher-is-better metrics
const BARREL_PCT_CHECKPOINTS: Checkpoint[] = [
  [0, 35], [2, 55], [5, 65], [8, 75], [12, 85], [15, 95], [20, 100],
];

const EXIT_VELO_CHECKPOINTS: Checkpoint[] = [
  [40, 30], [50, 50], [55, 60], [60, 70], [65, 80], [70, 88], [75, 95], [85, 100],
];

const CONTACT_PCT_CHECKPOINTS: Checkpoint[] = [
  [50, 30], [60, 45], [65, 55], [70, 65], [75, 72], [80, 80], [85, 88], [90, 95], [95, 100],
];

const BATTING_AVG_CHECKPOINTS: Checkpoint[] = [
  [0, 20], [.100, 35], [.150, 45], [.200, 58], [.250, 70], [.300, 80], [.350, 90], [.400, 97], [.500, 100],
];

const PITCHES_PER_AB_CHECKPOINTS: Checkpoint[] = [
  [2.0, 35], [2.5, 50], [3.0, 60], [3.5, 72], [4.0, 82], [4.5, 90], [5.0, 97], [5.5, 100],
];

// Lower-is-better metrics (checkpoints still sorted by value ascending, but score descends)
const WHIFF_RATE_CHECKPOINTS: Checkpoint[] = [
  [5, 100], [10, 95], [15, 88], [20, 80], [25, 70], [30, 60], [35, 50], [45, 30],
];

const CHASE_RATE_CHECKPOINTS: Checkpoint[] = [
  [10, 100], [15, 95], [20, 88], [25, 78], [30, 68], [35, 58], [40, 48], [50, 30],
];

const CALLED_STRIKE_CHECKPOINTS: Checkpoint[] = [
  [5, 100], [10, 93], [15, 85], [20, 75], [25, 65], [30, 55], [40, 35],
];

// --- Category Scores ---

export interface MetricGrade {
  label: string;
  value: number;     // raw metric value
  displayValue: string;
  score: number;     // 0-100
  grade: LetterGrade;
}

export interface CategoryGrade {
  label: string;
  score: number;
  grade: LetterGrade;
  metrics: MetricGrade[];
}

export interface ReportCardData {
  overall: { score: number; grade: LetterGrade };
  power: CategoryGrade;
  contact: CategoryGrade;
  discipline: CategoryGrade;
  hasEnoughData: boolean;
}

interface ReportCardInput {
  barrelPct: number;
  avgExitVelo: number;
  contactPct: number;
  whiffRate: number;
  battingAvg: number;
  chasePct: number;
  calledStrikePct: number;
  avgPitchesPerAB: number;
  totalAtBats: number;
  totalPitches: number;
}

const MIN_AT_BATS = 5;

export function calcReportCard(input: ReportCardInput): ReportCardData {
  const hasEnoughData = input.totalAtBats >= MIN_AT_BATS;

  // Score individual metrics
  const barrelScore = interpolateScore(input.barrelPct, BARREL_PCT_CHECKPOINTS);
  const exitVeloScore = input.avgExitVelo > 0
    ? interpolateScore(input.avgExitVelo, EXIT_VELO_CHECKPOINTS)
    : null;
  const contactScore = input.totalPitches > 0
    ? interpolateScore(input.contactPct, CONTACT_PCT_CHECKPOINTS)
    : null;
  const whiffScore = input.totalPitches > 0
    ? interpolateScore(input.whiffRate, WHIFF_RATE_CHECKPOINTS)
    : null;
  const avgScore = interpolateScore(input.battingAvg, BATTING_AVG_CHECKPOINTS);
  const chaseScore = input.totalPitches > 0
    ? interpolateScore(input.chasePct, CHASE_RATE_CHECKPOINTS)
    : null;
  const calledStrikeScore = input.totalPitches > 0
    ? interpolateScore(input.calledStrikePct, CALLED_STRIKE_CHECKPOINTS)
    : null;
  const pitchesPerABScore = input.totalPitches > 0
    ? interpolateScore(input.avgPitchesPerAB, PITCHES_PER_AB_CHECKPOINTS)
    : null;

  // Build Power category
  const powerMetrics: MetricGrade[] = [
    {
      label: 'Barrel %',
      value: input.barrelPct,
      displayValue: `${input.barrelPct.toFixed(1)}%`,
      score: barrelScore,
      grade: scoreToGrade(barrelScore),
    },
  ];
  if (exitVeloScore !== null) {
    powerMetrics.push({
      label: 'Exit Velo',
      value: input.avgExitVelo,
      displayValue: `${input.avgExitVelo.toFixed(1)} mph`,
      score: exitVeloScore,
      grade: scoreToGrade(exitVeloScore),
    });
  }
  const powerScore = avg(powerMetrics.map(m => m.score));

  // Build Contact category
  const contactMetrics: MetricGrade[] = [
    {
      label: 'Batting Avg',
      value: input.battingAvg,
      displayValue: `.${(input.battingAvg * 1000).toFixed(0).padStart(3, '0')}`,
      score: avgScore,
      grade: scoreToGrade(avgScore),
    },
  ];
  if (contactScore !== null) {
    contactMetrics.push({
      label: 'Contact %',
      value: input.contactPct,
      displayValue: `${input.contactPct.toFixed(1)}%`,
      score: contactScore,
      grade: scoreToGrade(contactScore),
    });
  }
  if (whiffScore !== null) {
    contactMetrics.push({
      label: 'Whiff Rate',
      value: input.whiffRate,
      displayValue: `${input.whiffRate.toFixed(1)}%`,
      score: whiffScore,
      grade: scoreToGrade(whiffScore),
    });
  }
  const contactCatScore = avg(contactMetrics.map(m => m.score));

  // Build Discipline category
  const disciplineMetrics: MetricGrade[] = [];
  if (chaseScore !== null) {
    disciplineMetrics.push({
      label: 'Chase Rate',
      value: input.chasePct,
      displayValue: `${input.chasePct.toFixed(1)}%`,
      score: chaseScore,
      grade: scoreToGrade(chaseScore),
    });
  }
  if (calledStrikeScore !== null) {
    disciplineMetrics.push({
      label: 'Called Strike %',
      value: input.calledStrikePct,
      displayValue: `${input.calledStrikePct.toFixed(1)}%`,
      score: calledStrikeScore,
      grade: scoreToGrade(calledStrikeScore),
    });
  }
  if (pitchesPerABScore !== null) {
    disciplineMetrics.push({
      label: 'Pitches / AB',
      value: input.avgPitchesPerAB,
      displayValue: input.avgPitchesPerAB.toFixed(1),
      score: pitchesPerABScore,
      grade: scoreToGrade(pitchesPerABScore),
    });
  }
  const disciplineScore = disciplineMetrics.length > 0
    ? avg(disciplineMetrics.map(m => m.score))
    : 50;

  // Overall: weighted composite
  const overallScore = weightedAvg([
    [powerScore, 0.30],
    [contactCatScore, 0.35],
    [disciplineScore, 0.35],
  ]);

  return {
    overall: { score: overallScore, grade: scoreToGrade(overallScore) },
    power: {
      label: 'Power',
      score: powerScore,
      grade: scoreToGrade(powerScore),
      metrics: powerMetrics,
    },
    contact: {
      label: 'Contact',
      score: contactCatScore,
      grade: scoreToGrade(contactCatScore),
      metrics: contactMetrics,
    },
    discipline: {
      label: 'Discipline',
      score: disciplineScore,
      grade: scoreToGrade(disciplineScore),
      metrics: disciplineMetrics,
    },
    hasEnoughData,
  };
}

function avg(values: number[]): number {
  if (values.length === 0) return 50;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function weightedAvg(pairs: [number, number][]): number {
  const totalWeight = pairs.reduce((sum, [, w]) => sum + w, 0);
  return pairs.reduce((sum, [v, w]) => sum + v * w, 0) / totalWeight;
}
