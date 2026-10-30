export interface CostInput {
  /** Whole years of the course, including the internship. */
  years: number;
  /** Rupees per one unit of the fee currency. 1 when fees are in rupees. */
  rate: number;
  /** Yearly amounts, in the fee currency. */
  tuition: number;
  hostel: number;
  living: number;
  insurance: number;
  /** Admission, registration, visa and other first-year fees, in the fee currency. */
  oneTimeForeign: number;
  /** Costs paid in India once: documents, attestation, consultancy, exam preparation after returning. */
  oneTimeInr: number;
  flightsPerYear: number;
  /** Rupees per round trip. */
  flightCostInr: number;
  /** Yearly rise in fees and living costs, in percent. */
  feeIncreasePct: number;
  /** Yearly fall of the rupee against the fee currency, in percent. */
  rupeeFallPct: number;
}

export interface YearCost {
  year: number;
  tuition: number;
  living: number;
  travel: number;
  oneTime: number;
  total: number;
}

export interface CostResult {
  years: YearCost[];
  tuition: number;
  living: number;
  travel: number;
  oneTime: number;
  total: number;
}

/** All amounts in the result are rupees. */
export function calculateCost(i: CostInput): CostResult {
  const years: YearCost[] = [];
  for (let y = 0; y < i.years; y++) {
    const growth = Math.pow(1 + i.feeIncreasePct / 100, y);
    const fx = i.rate * Math.pow(1 + i.rupeeFallPct / 100, y);
    const tuition = i.tuition * growth * fx;
    const living = (i.hostel + i.living + i.insurance) * growth * fx;
    const travel = i.flightsPerYear * i.flightCostInr;
    const oneTime = y === 0 ? i.oneTimeForeign * fx + i.oneTimeInr : 0;
    years.push({ year: y + 1, tuition, living, travel, oneTime, total: tuition + living + travel + oneTime });
  }
  const sum = (k: keyof Omit<YearCost, 'year'>) => years.reduce((s, y) => s + y[k], 0);
  return {
    years,
    tuition: sum('tuition'),
    living: sum('living'),
    travel: sum('travel'),
    oneTime: sum('oneTime'),
    total: sum('total'),
  };
}

/** Rupees to lakh, two decimals. */
export const toLakh = (rupees: number) => (rupees / 100000).toFixed(2);
