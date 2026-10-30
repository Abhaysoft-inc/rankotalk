export type Disbursal = 'upfront' | 'yearly';
export type StudyInterest = 'pay' | 'add';

export interface LoanInput {
  /** Total loan in rupees. */
  amount: number;
  /** Yearly interest rate, in percent. */
  ratePct: number;
  /** Years of study before repayment, including the internship. */
  studyYears: number;
  /** Months after the course before the first EMI. */
  graceMonths: number;
  /** Years to repay after the moratorium. */
  repayYears: number;
  /** All at once at the start, or in equal parts at the start of each study year. */
  disbursal: Disbursal;
  /** Pay the interest monthly while studying, or let it be added to the loan. */
  studyInterest: StudyInterest;
}

export interface LoanResult {
  moratoriumMonths: number;
  /** Simple interest that builds up before the first EMI. */
  studyInterest: number;
  /** Amount the EMIs repay. */
  repayPrincipal: number;
  emi: number;
  /** Interest paid through EMIs. */
  repayInterest: number;
  totalInterest: number;
  totalPaid: number;
}

export function emi(principal: number, ratePct: number, months: number): number {
  if (months <= 0) return 0;
  const r = ratePct / 100 / 12;
  if (r === 0) return principal / months;
  const f = Math.pow(1 + r, months);
  return (principal * r * f) / (f - 1);
}

export function calculateLoan(i: LoanInput): LoanResult {
  const moratoriumMonths = i.studyYears * 12 + i.graceMonths;
  const monthly = i.ratePct / 100 / 12;

  // Simple interest on each part of the loan from the month it is paid out until the first EMI.
  const parts = i.disbursal === 'upfront' ? 1 : Math.max(1, Math.ceil(i.studyYears));
  let studyInterest = 0;
  for (let k = 0; k < parts; k++) {
    const months = moratoriumMonths - k * 12;
    if (months > 0) studyInterest += (i.amount / parts) * monthly * months;
  }

  const repayPrincipal = i.studyInterest === 'add' ? i.amount + studyInterest : i.amount;
  const n = i.repayYears * 12;
  const e = emi(repayPrincipal, i.ratePct, n);
  const repayInterest = e * n - repayPrincipal;
  const totalInterest = studyInterest + repayInterest;
  return {
    moratoriumMonths,
    studyInterest,
    repayPrincipal,
    emi: e,
    repayInterest,
    totalInterest,
    totalPaid: i.amount + totalInterest,
  };
}
