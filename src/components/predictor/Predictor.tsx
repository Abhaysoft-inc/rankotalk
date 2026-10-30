import { useEffect, useMemo, useState } from 'preact/hooks';
import type { FunctionalComponent } from 'preact';
import { predict } from './predict';
import { loadCutoffs } from './data';
import { STATES } from './states';
import { CATEGORIES } from './types';
import type { Category, Chance, Gender, PredictInput, PredictResult } from './types';

const CHANCE_LABEL: Record<Chance, string> = { safe: 'Safe', moderate: 'Moderate', reach: 'Reach' };
const CHANCES: Chance[] = ['safe', 'moderate', 'reach'];
const CATEGORY_LABEL: Record<Category, string> = {
  OPEN: 'General (OPEN)',
  EWS: 'General-EWS',
  'OBC-NCL': 'OBC-NCL',
  SC: 'SC',
  ST: 'ST',
};
const MAX_ROWS = 80;

function readParams(): { rank: string; category: Category; gender: Gender; state: string } {
  const empty = { rank: '', category: 'OPEN' as Category, gender: 'neutral' as Gender, state: '' };
  if (typeof window === 'undefined') return empty;
  const p = new URLSearchParams(window.location.search);
  const category = p.get('cat') as Category;
  return {
    rank: p.get('rank') ?? '',
    category: CATEGORIES.includes(category) ? category : 'OPEN',
    gender: p.get('gender') === 'female' ? 'female' : 'neutral',
    state: STATES.includes((p.get('state') ?? '') as (typeof STATES)[number]) ? (p.get('state') as string) : '',
  };
}

function writeParams(input: PredictInput) {
  const p = new URLSearchParams();
  p.set('rank', String(input.rank));
  p.set('cat', input.category);
  if (input.gender === 'female') p.set('gender', 'female');
  if (input.homeState) p.set('state', input.homeState);
  window.history.replaceState(null, '', `${window.location.pathname}?${p.toString()}`);
}

const Predictor: FunctionalComponent = () => {
  const [rank, setRank] = useState('');
  const [category, setCategory] = useState<Category>('OPEN');
  const [gender, setGender] = useState<Gender>('neutral');
  const [state, setState] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<PredictResult[] | null>(null);
  const [submitted, setSubmitted] = useState<PredictInput | null>(null);
  const [tab, setTab] = useState<Chance>('safe');
  const [branch, setBranch] = useState('');

  async function run(input: PredictInput) {
    setLoading(true);
    try {
      const rows = await loadCutoffs();
      const found = predict(input, rows);
      setResults(found);
      setSubmitted(input);
      setBranch('');
      const firstWithResults = CHANCES.find((c) => found.some((r) => r.chance === c)) ?? 'safe';
      setTab(firstWithResults);
      writeParams(input);
    } catch {
      setError('Could not load the results. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const initial = readParams();
    setRank(initial.rank);
    setCategory(initial.category);
    setGender(initial.gender);
    setState(initial.state);
    const n = Number(initial.rank);
    if (Number.isInteger(n) && n > 0) {
      run({ rank: n, category: initial.category, gender: initial.gender, homeState: initial.state || undefined });
    }
  }, []);

  function onSubmit(e: Event) {
    e.preventDefault();
    const n = Number(rank.replace(/,/g, ''));
    if (!Number.isInteger(n) || n < 1 || n > 2000000) {
      setError('Enter your rank as a whole number, for example 25000.');
      return;
    }
    setError('');
    run({ rank: n, category, gender, homeState: state || undefined });
  }

  const counts = useMemo(() => {
    const c: Record<Chance, number> = { safe: 0, moderate: 0, reach: 0 };
    (results ?? []).forEach((r) => (c[r.chance] += 1));
    return c;
  }, [results]);

  const branches = useMemo(
    () => Array.from(new Set((results ?? []).map((r) => r.program))).sort(),
    [results],
  );

  const visible = useMemo(
    () => (results ?? []).filter((r) => r.chance === tab && (!branch || r.program === branch)),
    [results, tab, branch],
  );

  return (
    <section class="tool" aria-labelledby="predictor-heading">
      <h2 id="predictor-heading">Predict your colleges</h2>
      <form onSubmit={onSubmit} noValidate>
        <div class="form-grid">
          <div class="field">
            <label for="rank">JEE Main rank</label>
            <input
              id="rank"
              name="rank"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder="e.g. 25000"
              value={rank}
              onInput={(e) => setRank((e.target as HTMLInputElement).value)}
              aria-describedby="rank-hint rank-error"
              aria-invalid={error ? 'true' : undefined}
            />
            <p class="hint" id="rank-hint">CRL rank if you are in the General category, otherwise your category rank.</p>
            {error && <p class="error" id="rank-error" role="alert">{error}</p>}
          </div>
          <div class="field">
            <label for="category">Category</label>
            <select id="category" value={category} onChange={(e) => setCategory((e.target as HTMLSelectElement).value as Category)}>
              {CATEGORIES.map((c) => <option value={c}>{CATEGORY_LABEL[c]}</option>)}
            </select>
          </div>
          <div class="field">
            <label for="gender">Gender</label>
            <select id="gender" value={gender} onChange={(e) => setGender((e.target as HTMLSelectElement).value as Gender)}>
              <option value="neutral">Male or gender-neutral</option>
              <option value="female">Female</option>
            </select>
          </div>
          <div class="field">
            <label for="state">Home state (state of Class 12)</label>
            <select id="state" value={state} onChange={(e) => setState((e.target as HTMLSelectElement).value)}>
              <option value="">Select state</option>
              {STATES.map((s) => <option value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div class="form-actions">
          <button type="submit" class="btn" disabled={loading}>{loading ? 'Predicting…' : 'Predict my colleges'}</button>
        </div>
      </form>

      <div aria-live="polite">
        {results && submitted && (
          <div class="results">
            <p class="results-summary">
              {results.length === 0
                ? <>No matches found for rank <strong>{submitted.rank.toLocaleString('en-IN')}</strong> in {CATEGORY_LABEL[submitted.category]}. Try a different category or check your rank.</>
                : <>Found <strong>{results.length}</strong> options for rank <strong>{submitted.rank.toLocaleString('en-IN')}</strong> in {CATEGORY_LABEL[submitted.category]}.</>}
            </p>

            {results.length > 0 && (
              <>
                <div class="tabs" role="tablist" aria-label="Chance of admission">
                  {CHANCES.map((c) => (
                    <button
                      type="button"
                      role="tab"
                      class="tab"
                      id={`tab-${c}`}
                      aria-selected={tab === c}
                      aria-controls="results-panel"
                      onClick={() => setTab(c)}
                    >
                      {CHANCE_LABEL[c]} ({counts[c]})
                    </button>
                  ))}
                </div>

                <div class="field results-filter">
                  <label for="branch">Filter by branch</label>
                  <select id="branch" value={branch} onChange={(e) => setBranch((e.target as HTMLSelectElement).value)}>
                    <option value="">All branches</option>
                    {branches.map((b) => <option value={b}>{b}</option>)}
                  </select>
                </div>

                <div id="results-panel" role="tabpanel" aria-labelledby={`tab-${tab}`}>
                  {visible.length === 0 ? (
                    <p>No {CHANCE_LABEL[tab].toLowerCase()} options for this branch. Try another tab or branch.</p>
                  ) : (
                    <div class="table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th scope="col">Institute</th>
                            <th scope="col">Branch</th>
                            <th scope="col">Type</th>
                            <th scope="col" class="num">Past closing rank</th>
                            <th scope="col">Chance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {visible.slice(0, MAX_ROWS).map((r) => (
                            <tr key={`${r.slug}-${r.program}-${r.category}`}>
                              <td>{r.institute}<br /><span class="hint">{r.state}</span></td>
                              <td>{r.program}</td>
                              <td>{r.type}</td>
                              <td class="num">{r.closingRank.toLocaleString('en-IN')}</td>
                              <td><span class={`tag tag-${r.chance}`}>{CHANCE_LABEL[r.chance]}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {visible.length > MAX_ROWS && (
                    <p class="disclaimer">Showing the first {MAX_ROWS} of {visible.length}. Use the branch filter to narrow the list.</p>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <p class="disclaimer">
        Results are estimates based on past closing ranks, not an official allotment. Cutoffs change every year with
        seats, exam difficulty and the number of candidates. Always confirm on the official JoSAA website.
        This tool covers NITs, IIITs and GFTIs; IITs admit through JEE Advanced.
      </p>
    </section>
  );
};

export default Predictor;
