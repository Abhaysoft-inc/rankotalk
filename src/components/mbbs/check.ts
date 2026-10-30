export type YesNo = 'yes' | 'no' | 'unsure';
export type Medium = 'english' | 'mixed' | 'unsure';
export type InternshipPlace = 'same' | 'elsewhere' | 'unsure';
export type Level = 'fail' | 'unknown' | 'warn';
export type Status = 'meets' | 'check' | 'fails';

export interface University {
  name: string;
  country: string;
  /** Course length in months, not counting the internship. */
  courseMonths?: number;
  internshipMonths?: number;
  internshipPlace: InternshipPlace;
  medium: Medium;
  /** Graduates can get a licence to practise in that country, at par with its citizens. */
  licence: YesNo;
  /** The whole course and internship happen at this one institution, with no transfer or split. */
  sameInstitution: YesNo;
  /** Listed in the World Directory of Medical Schools. */
  wdoms: YesNo;
  /** NMC has issued an advisory or warning about this university. */
  nmcAdvisory: YesNo;
  /** Total cost for the whole course in lakh rupees: tuition, hostel, food, travel, insurance. */
  totalCostLakh?: number;
}

export interface Issue {
  level: Level;
  text: string;
}

export interface CheckResult {
  status: Status;
  issues: Issue[];
  overBudget: boolean | null;
}

export const MIN_COURSE_MONTHS = 54;
export const MIN_INTERNSHIP_MONTHS = 12;

export function checkUniversity(u: University, budgetLakh?: number): CheckResult {
  const issues: Issue[] = [];
  const fail = (text: string) => issues.push({ level: 'fail', text });
  const unknown = (text: string) => issues.push({ level: 'unknown', text });
  const warn = (text: string) => issues.push({ level: 'warn', text });

  if (u.courseMonths === undefined) unknown('Confirm the course length. NMC needs at least 54 months, not counting the internship.');
  else if (u.courseMonths < MIN_COURSE_MONTHS) fail(`The course is ${u.courseMonths} months. NMC needs at least 54 months, not counting the internship.`);

  if (u.internshipMonths === undefined) unknown('Confirm the internship length. NMC needs at least 12 months.');
  else if (u.internshipMonths < MIN_INTERNSHIP_MONTHS) fail(`The internship is ${u.internshipMonths} months. NMC needs at least 12 months.`);

  if (u.internshipPlace === 'elsewhere') fail('The internship must be done at the same foreign institution that awards the degree.');
  else if (u.internshipPlace === 'unsure') unknown('Confirm that the internship is done at the same institution.');

  if (u.medium === 'mixed') fail('NMC requires the course to be taught in English. A course taught partly in another language can be rejected.');
  else if (u.medium === 'unsure') unknown('Confirm in writing that the whole course is taught in English.');

  if (u.licence === 'no') fail('Graduates must be able to get a licence to practise in that country, at par with its own citizens.');
  else if (u.licence === 'unsure') unknown('Confirm that foreign graduates can get a licence to practise in that country.');

  if (u.sameInstitution === 'no') fail('The whole course, training and internship must be at the same foreign institution. Transfers and split programmes are not allowed.');
  else if (u.sameInstitution === 'unsure') unknown('Confirm there is no transfer, split campus or part of the course in another country.');

  if (u.nmcAdvisory === 'yes') fail('NMC has warned students about this university. Do not apply without reading that notice.');
  else if (u.nmcAdvisory === 'unsure') unknown('Check NMC public notices for any warning about this university.');

  if (u.wdoms === 'no') warn('Not found in the World Directory of Medical Schools. Ask the university why before going further.');
  else if (u.wdoms === 'unsure') unknown('Search for the university in the World Directory of Medical Schools.');

  const overBudget =
    u.totalCostLakh === undefined || budgetLakh === undefined ? null : u.totalCostLakh > budgetLakh;
  if (overBudget) warn(`The total cost of ₹${u.totalCostLakh} lakh is above your budget of ₹${budgetLakh} lakh.`);

  const status: Status = issues.some((i) => i.level === 'fail')
    ? 'fails'
    : issues.some((i) => i.level === 'unknown')
      ? 'check'
      : 'meets';

  return { status, issues, overBudget };
}

const STATUS_ORDER: Record<Status, number> = { meets: 0, check: 1, fails: 2 };

/** Best options first: rule status, then within budget, then lower cost. */
export function rank<T extends { result: CheckResult; uni: University }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const s = STATUS_ORDER[a.result.status] - STATUS_ORDER[b.result.status];
    if (s !== 0) return s;
    const ob = Number(a.result.overBudget === true) - Number(b.result.overBudget === true);
    if (ob !== 0) return ob;
    return (a.uni.totalCostLakh ?? Infinity) - (b.uni.totalCostLakh ?? Infinity);
  });
}
