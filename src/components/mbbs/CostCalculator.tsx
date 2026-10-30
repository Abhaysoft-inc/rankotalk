import { useState } from 'preact/hooks';
import type { FunctionalComponent } from 'preact';
import { calculateCost, toLakh } from './cost';
import type { CostInput, CostResult } from './cost';

type Currency = 'inr' | 'usd' | 'other';

const FIELDS = {
  years: '6',
  rate: '',
  tuition: '',
  hostel: '',
  living: '',
  insurance: '',
  oneTimeForeign: '',
  oneTimeInr: '',
  flightsPerYear: '1',
  flightCostInr: '',
  feeIncreasePct: '0',
  rupeeFallPct: '0',
  budget: '',
};
type Field = keyof typeof FIELDS;

const num = (s: string) => {
  if (s.trim() === '') return 0;
  const n = Number(s.replace(/,/g, ''));
  return Number.isFinite(n) && n >= 0 ? n : NaN;
};

const CostCalculator: FunctionalComponent = () => {
  const [currency, setCurrency] = useState<Currency>('usd');
  const [v, setV] = useState({ ...FIELDS });
  const [error, setError] = useState('');
  const [result, setResult] = useState<CostResult | null>(null);
  const [budget, setBudget] = useState<number | null>(null);

  const set = (k: Field) => (e: Event) => setV((s) => ({ ...s, [k]: (e.target as HTMLInputElement).value }));
  const unit = currency === 'inr' ? '₹' : currency === 'usd' ? 'US$' : 'fee currency';

  function onSubmit(e: Event) {
    e.preventDefault();
    const years = num(v.years);
    const rate = currency === 'inr' ? 1 : num(v.rate);
    if (!Number.isInteger(years) || years < 1 || years > 10) {
      setError('Enter the course length as whole years, from 1 to 10.');
      return;
    }
    if (!(rate > 0)) {
      setError('Enter the exchange rate: how many rupees one unit of the fee currency costs today.');
      return;
    }
    const input: CostInput = {
      years,
      rate,
      tuition: num(v.tuition),
      hostel: num(v.hostel),
      living: num(v.living),
      insurance: num(v.insurance),
      oneTimeForeign: num(v.oneTimeForeign),
      oneTimeInr: num(v.oneTimeInr),
      flightsPerYear: num(v.flightsPerYear),
      flightCostInr: num(v.flightCostInr),
      feeIncreasePct: num(v.feeIncreasePct),
      rupeeFallPct: num(v.rupeeFallPct),
    };
    if (Object.values(input).some((x) => Number.isNaN(x))) {
      setError('Use plain numbers without letters or symbols.');
      return;
    }
    if (input.tuition === 0) {
      setError('Enter at least the yearly tuition fee.');
      return;
    }
    const b = num(v.budget);
    setBudget(v.budget.trim() === '' || Number.isNaN(b) ? null : b);
    setError('');
    setResult(calculateCost(input));
  }

  const field = (k: Field, label: string, hint?: string, placeholder?: string) => (
    <div class="field">
      <label for={`cost-${k}`}>{label}</label>
      <input id={`cost-${k}`} type="text" inputMode="decimal" autoComplete="off" placeholder={placeholder} value={v[k]}
        onInput={set(k)} aria-describedby={hint ? `cost-${k}-hint` : undefined} />
      {hint && <p class="hint" id={`cost-${k}-hint`}>{hint}</p>}
    </div>
  );

  const share = (x: number) => (result && result.total > 0 ? Math.round((x / result.total) * 100) : 0);

  return (
    <section class="tool" aria-labelledby="cost-heading">
      <h2 id="cost-heading">Calculate the total cost</h2>
      <form onSubmit={onSubmit} noValidate>
        <fieldset>
          <legend>Course and currency</legend>
          <div class="form-grid">
            {field('years', 'Course length in years, including internship', 'Courses that meet NMC rules usually take about 6 years.')}
            <div class="field">
              <label for="cost-currency">Currency the fees are charged in</label>
              <select id="cost-currency" value={currency} onChange={(e) => setCurrency((e.target as HTMLSelectElement).value as Currency)}>
                <option value="usd">US dollars</option>
                <option value="other">Another currency</option>
                <option value="inr">Indian rupees</option>
              </select>
            </div>
            {currency !== 'inr' &&
              field('rate', `Rupees for 1 ${currency === 'usd' ? 'US dollar' : 'unit of that currency'}`, 'Use today’s rate from your bank or a currency converter.')}
          </div>
        </fieldset>

        <fieldset>
          <legend>Yearly costs ({unit})</legend>
          <div class="form-grid">
            {field('tuition', 'Tuition fee per year')}
            {field('hostel', 'Hostel per year')}
            {field('living', 'Food and living per year')}
            {field('insurance', 'Insurance, visa renewal and other yearly fees')}
          </div>
        </fieldset>

        <fieldset>
          <legend>One-time costs and travel</legend>
          <div class="form-grid">
            {field('oneTimeForeign', `Admission, registration and visa fees (${unit})`)}
            {field('oneTimeInr', 'Costs in India (₹)', 'Documents, attestation, medical tests, consultancy, and exam preparation after you return.')}
            {field('flightsPerYear', 'Trips home per year')}
            {field('flightCostInr', 'Cost per round trip (₹)')}
          </div>
        </fieldset>

        <fieldset>
          <legend>Assumptions</legend>
          <div class="form-grid">
            {field('feeIncreasePct', 'Yearly rise in fees and living costs (%)', 'Ask the university how much fees have risen in recent years.')}
            {field('rupeeFallPct', 'Yearly fall of the rupee (%)', 'Set to 0 for a steady rate. A higher value shows the risk if the rupee weakens.')}
            {field('budget', 'Your total budget (₹ lakh, optional)')}
          </div>
        </fieldset>

        <div class="form-actions">
          <button type="submit" class="btn">Calculate total cost</button>
          {error && <p class="error" role="alert" style={{ marginTop: '.75rem' }}>{error}</p>}
        </div>
      </form>

      <div aria-live="polite">
        {result && (
          <div class="results">
            <p class="results-summary">
              Total cost for the whole course: <strong>₹{toLakh(result.total)} lakh</strong>
              {budget !== null && (
                result.total / 100000 > budget
                  ? <> — <span class="tag tag-reach">₹{toLakh(result.total - budget * 100000)} lakh over budget</span></>
                  : <> — <span class="tag tag-safe">within your budget</span></>
              )}
            </p>
            <div class="table-wrap">
              <table>
                <caption>Where the money goes</caption>
                <thead><tr><th scope="col">Item</th><th scope="col" class="num">₹ lakh</th><th scope="col" class="num">Share</th></tr></thead>
                <tbody>
                  <tr><td>Tuition</td><td class="num">{toLakh(result.tuition)}</td><td class="num">{share(result.tuition)}%</td></tr>
                  <tr><td>Hostel, food, insurance and yearly fees</td><td class="num">{toLakh(result.living)}</td><td class="num">{share(result.living)}%</td></tr>
                  <tr><td>Travel</td><td class="num">{toLakh(result.travel)}</td><td class="num">{share(result.travel)}%</td></tr>
                  <tr><td>One-time costs</td><td class="num">{toLakh(result.oneTime)}</td><td class="num">{share(result.oneTime)}%</td></tr>
                </tbody>
              </table>
            </div>
            <div class="table-wrap" style={{ marginTop: '1rem' }}>
              <table>
                <caption>Year by year</caption>
                <thead><tr><th scope="col">Year</th><th scope="col" class="num">₹ lakh</th></tr></thead>
                <tbody>
                  {result.years.map((y) => <tr><td>Year {y.year}</td><td class="num">{toLakh(y.total)}</td></tr>)}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <p class="disclaimer">
        The result is only as good as the figures you enter. Get the university’s full fee schedule in writing, including
        hostel and other charges for every year, before you pay.
      </p>
    </section>
  );
};

export default CostCalculator;
