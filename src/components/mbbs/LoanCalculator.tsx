import { useState } from 'preact/hooks';
import type { FunctionalComponent } from 'preact';
import { calculateLoan } from './loan';
import type { Disbursal, LoanResult, StudyInterest } from './loan';

const rupees = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;
const lakh = (n: number) => `₹${(n / 100000).toFixed(2)} lakh`;
const num = (s: string) => (s.trim() === '' ? NaN : Number(s.replace(/,/g, '')));

const LoanCalculator: FunctionalComponent = () => {
  const [amount, setAmount] = useState('');
  const [rate, setRate] = useState('');
  const [studyYears, setStudyYears] = useState('6');
  const [grace, setGrace] = useState('6');
  const [repayYears, setRepayYears] = useState('10');
  const [disbursal, setDisbursal] = useState<Disbursal>('yearly');
  const [studyInterest, setStudyInterest] = useState<StudyInterest>('add');
  const [error, setError] = useState('');
  const [result, setResult] = useState<LoanResult | null>(null);

  function onSubmit(e: Event) {
    e.preventDefault();
    const a = num(amount) * 100000;
    const r = num(rate);
    const sy = num(studyYears);
    const g = num(grace);
    const ry = num(repayYears);
    if (!(a > 0)) return setError('Enter the loan amount in lakh rupees, for example 20.');
    if (!(r >= 0 && r <= 30)) return setError('Enter the yearly interest rate your bank quotes, for example 10.5.');
    if (!(Number.isInteger(sy) && sy >= 1 && sy <= 10)) return setError('Enter the years of study as a whole number from 1 to 10.');
    if (!(Number.isInteger(g) && g >= 0 && g <= 24)) return setError('Enter the grace period in months, from 0 to 24.');
    if (!(Number.isInteger(ry) && ry >= 1 && ry <= 20)) return setError('Enter the repayment period in whole years, from 1 to 20.');
    setError('');
    setResult(calculateLoan({ amount: a, ratePct: r, studyYears: sy, graceMonths: g, repayYears: ry, disbursal, studyInterest }));
  }

  const input = (id: string, label: string, value: string, set: (v: string) => void, placeholder?: string, hint?: string) => (
    <div class="field">
      <label for={id}>{label}</label>
      <input id={id} type="text" inputMode="decimal" autoComplete="off" placeholder={placeholder} value={value}
        onInput={(e) => set((e.target as HTMLInputElement).value)} aria-describedby={hint ? `${id}-hint` : undefined} />
      {hint && <p class="hint" id={`${id}-hint`}>{hint}</p>}
    </div>
  );

  return (
    <section class="tool" aria-labelledby="loan-heading">
      <h2 id="loan-heading">Education loan calculator</h2>
      <form onSubmit={onSubmit} noValidate>
        <div class="form-grid">
          {input('loan-amount', 'Loan amount (₹ lakh)', amount, setAmount, 'e.g. 20')}
          {input('loan-rate', 'Interest rate (% a year)', rate, setRate, 'e.g. 10.5', 'Use the rate in your bank’s offer letter.')}
          {input('loan-study', 'Years of study, including internship', studyYears, setStudyYears)}
          {input('loan-grace', 'Grace period after the course (months)', grace, setGrace, undefined, 'Ask your bank how long it allows before the first EMI.')}
          {input('loan-repay', 'Repayment period (years)', repayYears, setRepayYears)}
          <div class="field">
            <label for="loan-disbursal">How the loan is paid out</label>
            <select id="loan-disbursal" value={disbursal} onChange={(e) => setDisbursal((e.target as HTMLSelectElement).value as Disbursal)}>
              <option value="yearly">In equal parts each year</option>
              <option value="upfront">All at the start</option>
            </select>
          </div>
          <div class="field">
            <label for="loan-interest">Interest while you study</label>
            <select id="loan-interest" value={studyInterest} onChange={(e) => setStudyInterest((e.target as HTMLSelectElement).value as StudyInterest)}>
              <option value="add">Added to the loan</option>
              <option value="pay">Paid every month by the family</option>
            </select>
          </div>
        </div>
        <div class="form-actions">
          <button type="submit" class="btn">Calculate EMI</button>
          {error && <p class="error" role="alert" style={{ marginTop: '.75rem' }}>{error}</p>}
        </div>
      </form>

      <div aria-live="polite">
        {result && (
          <div class="results">
            <p class="results-summary">
              Monthly EMI: <strong>{rupees(result.emi)}</strong> for {Number(repayYears) * 12} months, starting{' '}
              {result.moratoriumMonths} months after the first payout.
            </p>
            <div class="table-wrap">
              <table>
                <tbody>
                  <tr><th scope="row">Interest while studying</th><td class="num">{lakh(result.studyInterest)}</td></tr>
                  {studyInterest === 'pay' && (
                    <tr><th scope="row">Monthly interest paid while studying (first year)</th>
                      <td class="num">{rupees((Number(amount) * 100000 / (disbursal === 'upfront' ? 1 : Math.ceil(Number(studyYears)))) * Number(rate) / 100 / 12)}</td></tr>
                  )}
                  <tr><th scope="row">Amount the EMIs repay</th><td class="num">{lakh(result.repayPrincipal)}</td></tr>
                  <tr><th scope="row">Interest paid through EMIs</th><td class="num">{lakh(result.repayInterest)}</td></tr>
                  <tr><th scope="row">Total interest</th><td class="num">{lakh(result.totalInterest)}</td></tr>
                  <tr><th scope="row">Total you pay back</th><td class="num"><strong>{lakh(result.totalPaid)}</strong></td></tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <p class="disclaimer">
        Estimates use simple interest during study and a standard EMI afterwards. Banks differ in how they charge interest,
        fees and insurance, so compare the exact figures in each offer letter.
      </p>
    </section>
  );
};

export default LoanCalculator;
