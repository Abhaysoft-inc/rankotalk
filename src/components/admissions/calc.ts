export type Fit = 'likely' | 'target' | 'reach';
export type TestType = 'sat' | 'act' | 'none';
export type Profile = 'below' | 'typical' | 'outstanding';
export type Position = 'above' | 'upper' | 'lower' | 'below' | 'far-below' | 'none';
export type Band = 'most' | 'highly' | 'selective' | 'less';

/** 2018 ACT/SAT concordance, Table A2 (ACT Composite to SAT Total): [ACT, SAT, SAT range low, SAT range high]. */
export const CONCORDANCE: [number, number, number, number][] = [
  [36, 1590, 1570, 1600],
  [35, 1540, 1530, 1560],
  [34, 1500, 1490, 1520],
  [33, 1460, 1450, 1480],
  [32, 1430, 1420, 1440],
  [31, 1400, 1390, 1410],
  [30, 1370, 1360, 1380],
  [29, 1340, 1330, 1350],
  [28, 1310, 1300, 1320],
  [27, 1280, 1260, 1290],
  [26, 1240, 1230, 1250],
  [25, 1210, 1200, 1220],
  [24, 1180, 1160, 1190],
  [23, 1140, 1130, 1150],
  [22, 1110, 1100, 1120],
  [21, 1080, 1060, 1090],
  [20, 1040, 1030, 1050],
  [19, 1010, 990, 1020],
  [18, 970, 960, 980],
  [17, 930, 920, 950],
  [16, 890, 880, 910],
  [15, 850, 830, 870],
  [14, 800, 780, 820],
  [13, 760, 730, 770],
  [12, 710, 690, 720],
  [11, 670, 650, 680],
  [10, 630, 620, 640],
  [9, 590, 590, 610],
];

const ACT_TO_SAT = new Map(CONCORDANCE.map(([act, sat]) => [act, sat]));

export interface Student {
  test: TestType;
  /** SAT total (400 to 1600) or ACT composite (1 to 36), matching `test`. */
  score?: number;
  /** Unweighted GPA on a 4.0 scale. */
  gpa?: number;
  profile: Profile;
}

export interface College {
  name: string;
  /** Percent of applicants admitted, 0 to 100. */
  acceptanceRate: number;
  /** 25th and 75th percentile scores, on the same test scale as the student. */
  low?: number;
  high?: number;
}

export interface Assessment {
  fit: Fit;
  band: Band;
  position: Position;
  reasons: string[];
}

export function actToSat(act: number): number | null {
  return ACT_TO_SAT.get(act) ?? null;
}

/** Puts any score on the SAT scale. Returns null for a value that is not a valid score. */
export function toSatScale(test: TestType, value: number | undefined): number | null {
  if (value === undefined || !Number.isFinite(value)) return null;
  if (test === 'sat') return value >= 400 && value <= 1600 ? value : null;
  if (test === 'act') return Number.isInteger(value) && value >= 1 && value <= 36 ? (value < 9 ? 590 : actToSat(value)) : null;
  return null;
}

export function selectivityBand(rate: number): Band {
  if (rate < 15) return 'most';
  if (rate < 30) return 'highly';
  if (rate < 60) return 'selective';
  return 'less';
}

export function scorePosition(score: number, low: number, high: number): Position {
  if (score >= high) return 'above';
  if (score >= (low + high) / 2) return 'upper';
  if (score >= low) return 'lower';
  const width = Math.max(high - low, 1);
  return score >= low - width / 2 ? 'below' : 'far-below';
}

/** Result by selectivity band and where the score sits in the college's middle 50% range. */
export const MATRIX: Record<Band, Record<Exclude<Position, 'none'>, Fit>> = {
  most: { above: 'reach', upper: 'reach', lower: 'reach', below: 'reach', 'far-below': 'reach' },
  highly: { above: 'target', upper: 'reach', lower: 'reach', below: 'reach', 'far-below': 'reach' },
  selective: { above: 'likely', upper: 'target', lower: 'target', below: 'reach', 'far-below': 'reach' },
  less: { above: 'likely', upper: 'likely', lower: 'likely', below: 'target', 'far-below': 'reach' },
};

/** Result when there is no score to compare (test-optional, or no range for the college). */
export const NO_SCORE: Record<Band, Fit> = { most: 'reach', highly: 'reach', selective: 'target', less: 'likely' };

const ORDER: Fit[] = ['reach', 'target', 'likely'];
const shift = (fit: Fit, steps: number): Fit =>
  ORDER[Math.max(0, Math.min(ORDER.length - 1, ORDER.indexOf(fit) + steps))];

const BAND_TEXT: Record<Band, string> = {
  most: 'most selective',
  highly: 'highly selective',
  selective: 'selective',
  less: 'less selective',
};

const POSITION_TEXT: Record<Exclude<Position, 'none'>, string> = {
  above: 'Your score is at or above the 75th percentile.',
  upper: 'Your score is in the upper half of the middle 50% range.',
  lower: 'Your score is in the lower half of the middle 50% range.',
  below: 'Your score is a little below the 25th percentile.',
  'far-below': 'Your score is well below the 25th percentile.',
};

export function assess(student: Student, college: College): Assessment {
  const band = selectivityBand(college.acceptanceRate);
  const reasons = [`Acceptance rate ${college.acceptanceRate}%: ${BAND_TEXT[band]}.`];

  const score = student.test === 'none' ? null : toSatScale(student.test, student.score);
  const low = toSatScale(student.test, college.low);
  const high = toSatScale(student.test, college.high);

  let position: Position = 'none';
  let fit: Fit;
  if (score !== null && low !== null && high !== null && low <= high) {
    position = scorePosition(score, low, high);
    fit = MATRIX[band][position];
    reasons.push(POSITION_TEXT[position]);
  } else {
    fit = NO_SCORE[band];
    reasons.push('No score comparison, so this is based on the acceptance rate.');
  }

  if (student.gpa !== undefined && student.gpa < 3.0) {
    fit = shift(fit, -1);
    reasons.push('A GPA below 3.0 lowers the result by one step.');
  }
  if (student.profile === 'below') {
    fit = shift(fit, -1);
    reasons.push('A weaker rest of application lowers the result by one step.');
  } else if (student.profile === 'outstanding') {
    fit = shift(fit, 1);
    reasons.push('An outstanding rest of application raises the result by one step.');
  }

  if (band === 'most' && fit !== 'reach') fit = 'reach';
  if (band === 'most') reasons.push('Below 15% acceptance, a college is a reach for every applicant.');
  if (band === 'highly' && fit === 'likely') fit = 'target';

  return { fit, band, position, reasons };
}

export function summarize(fits: Fit[]): string[] {
  const n = fits.length;
  const count = (f: Fit) => fits.filter((x) => x === f).length;
  const reach = count('reach');
  const likely = count('likely');
  const advice: string[] = [];

  if (n > 0 && n < 6) advice.push('If this is your full list, consider adding more. Many counselors suggest about 8 to 12 colleges.');
  if (n > 0 && likely === 0) advice.push('Add at least two colleges that come out as Likely and that you would be happy to attend.');
  if (n > 0 && reach > n / 2) advice.push('More than half of your list is Reach. Balance it with more Target and Likely colleges.');
  if (advice.length === 0 && n > 0) advice.push('Your list has a healthy mix of Reach, Target and Likely colleges.');
  return advice;
}
