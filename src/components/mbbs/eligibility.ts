import { checkUniversity } from './check';
import type { YesNo } from './check';

export type CheckStatus = 'pass' | 'fail' | 'pending' | 'confirm';
export type Overall = 'eligible' | 'check' | 'not-eligible';
export type Category = 'general' | 'reserved' | 'pwd';

export interface Check {
  label: string;
  status: CheckStatus;
  detail: string;
}

/** Commonly stated minimum Physics, Chemistry and Biology aggregate in Class 12. Users are told to confirm it. */
export const MIN_PCB: Record<Category, number> = { general: 50, reserved: 40, pwd: 45 };

export interface AdmissionInput {
  /** Date of birth, YYYY-MM-DD. */
  dob?: string;
  admissionYear: number;
  physics: boolean;
  chemistry: boolean;
  biology: boolean;
  english: boolean;
  pcbPercent?: number;
  category: Category;
  neet: 'yes' | 'awaiting' | 'no';
  passport: 'yes' | 'applied' | 'no';
}

/** Age in completed years on 31 December of the given year. */
export function ageOnDec31(dob: string, year: number): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dob);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  // On 31 December, everyone born in or before December of (year - n) has turned n.
  return year - y;
}

export function checkAdmission(i: AdmissionInput): Check[] {
  const checks: Check[] = [];

  const age = i.dob ? ageOnDec31(i.dob, i.admissionYear) : null;
  if (age === null) checks.push({ label: 'Age', status: 'pending', detail: 'Enter your date of birth to check the age rule.' });
  else if (age >= 17) checks.push({ label: 'Age', status: 'pass', detail: `You will be ${age} on 31 December ${i.admissionYear}. The minimum is 17.` });
  else checks.push({ label: 'Age', status: 'fail', detail: `You will be ${age} on 31 December ${i.admissionYear}. You must be at least 17 by then.` });

  const missing = [
    !i.physics && 'Physics',
    !i.chemistry && 'Chemistry',
    !i.biology && 'Biology or Biotechnology',
    !i.english && 'English',
  ].filter(Boolean) as string[];
  if (missing.length === 0) checks.push({ label: 'Class 12 subjects', status: 'pass', detail: 'You have Physics, Chemistry, Biology and English.' });
  else checks.push({ label: 'Class 12 subjects', status: 'fail', detail: `Missing: ${missing.join(', ')}. All four are needed for NEET-UG and MBBS.` });

  const min = MIN_PCB[i.category];
  if (i.pcbPercent === undefined) checks.push({ label: 'Class 12 marks', status: 'pending', detail: `Enter your Physics, Chemistry and Biology aggregate. The commonly stated minimum for your category is ${min}%.` });
  else if (i.pcbPercent >= min) checks.push({ label: 'Class 12 marks', status: 'pass', detail: `${i.pcbPercent}% meets the commonly stated minimum of ${min}% for your category.` });
  else checks.push({ label: 'Class 12 marks', status: 'confirm', detail: `${i.pcbPercent}% is below the commonly stated minimum of ${min}% for your category. Confirm the current rule with NMC before you apply.` });

  if (i.neet === 'yes') checks.push({ label: 'NEET-UG', status: 'pass', detail: 'You have qualified NEET-UG. Keep your scorecard safe; you will need it again later.' });
  else if (i.neet === 'awaiting') checks.push({ label: 'NEET-UG', status: 'pending', detail: 'You can apply only after you qualify NEET-UG. Do not pay large fees before the result.' });
  else checks.push({ label: 'NEET-UG', status: 'fail', detail: 'Indian students must qualify NEET-UG to study MBBS abroad and later practise in India.' });

  if (i.passport === 'yes') checks.push({ label: 'Passport', status: 'pass', detail: 'Check that it stays valid for well beyond your first year abroad.' });
  else checks.push({ label: 'Passport', status: 'pending', detail: i.passport === 'applied' ? 'You need the passport before you can apply for the visa.' : 'Apply for a passport now. You need it for the visa, and it takes time.' });

  return checks;
}

export interface FmgInput {
  /** Joined the foreign course on or after 18 November 2021, when FMGL 2021 came into force. */
  joinedAfterFmgl: YesNo;
  courseMonths?: number;
  internshipMonths?: number;
  internshipSame: YesNo;
  english: YesNo;
  licence: YesNo;
  sameInstitution: YesNo;
  /** Practical and clinical training done in person; online classes were for theory only. */
  practicalsInPerson: YesNo;
  within10Years: YesNo;
}

const yn = (v: YesNo, pass: string, fail: string, ask: string, label: string): Check =>
  v === 'yes' ? { label, status: 'pass', detail: pass } : v === 'no' ? { label, status: 'fail', detail: fail } : { label, status: 'confirm', detail: ask };

export function checkFmg(i: FmgInput): Check[] {
  if (i.joinedAfterFmgl === 'no') {
    return [{
      label: 'Which rules apply',
      status: 'confirm',
      detail: 'FMGL 2021 does not apply to students who joined before 18 November 2021. The earlier regulations apply to you, and you still need to pass the screening test. Check the current NMC notices for your case.',
    }];
  }
  const checks: Check[] = [];
  if (i.joinedAfterFmgl === 'unsure') {
    checks.push({ label: 'Which rules apply', status: 'confirm', detail: 'Check your date of joining. FMGL 2021 applies if you joined on or after 18 November 2021.' });
  }

  const course = checkUniversity({
    name: '',
    country: '',
    courseMonths: i.courseMonths,
    internshipMonths: i.internshipMonths,
    internshipPlace: i.internshipSame === 'yes' ? 'same' : i.internshipSame === 'no' ? 'elsewhere' : 'unsure',
    medium: i.english === 'yes' ? 'english' : i.english === 'no' ? 'mixed' : 'unsure',
    licence: i.licence,
    sameInstitution: i.sameInstitution,
    wdoms: 'yes',
    nmcAdvisory: 'no',
  });
  if (course.issues.length === 0) checks.push({ label: 'Course and internship', status: 'pass', detail: 'Course length, internship, language, licence and single institution all meet FMGL 2021.' });
  for (const issue of course.issues) {
    checks.push({ label: 'Course and internship', status: issue.level === 'fail' ? 'fail' : 'confirm', detail: issue.text });
  }

  checks.push(yn(i.practicalsInPerson, 'Practical and clinical training was done in person.',
    'NMC allows online classes for theory only. Practical and clinical training must be done in person at the university and its hospital.',
    'Confirm that all practical and clinical training was done in person, with a certificate of completion.', 'Practical training'));
  checks.push(yn(i.within10Years, 'The course will be completed within 10 years of joining.',
    'The whole course must be completed within 10 years of the date you joined.',
    'Check that you will finish within 10 years of joining.', 'Time limit'));
  return checks;
}

export function overall(checks: Check[]): Overall {
  if (checks.some((c) => c.status === 'fail')) return 'not-eligible';
  if (checks.some((c) => c.status !== 'pass')) return 'check';
  return 'eligible';
}
