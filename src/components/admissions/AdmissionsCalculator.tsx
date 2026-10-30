import { useState } from 'preact/hooks';
import type { FunctionalComponent } from 'preact';
import { assess, summarize } from './calc';
import type { Assessment, Fit, Profile, Student, TestType } from './calc';

interface Row {
  id: number;
  name: string;
  rate: string;
  low: string;
  high: string;
}

interface RowResult {
  label: string;
  result?: Assessment;
  error?: string;
}

const FIT_LABEL: Record<Fit, string> = { reach: 'Reach', target: 'Target', likely: 'Likely' };
const FIT_TAG: Record<Fit, string> = { reach: 'tag-reach', target: 'tag-moderate', likely: 'tag-safe' };
const MAX_ROWS = 12;

const num = (s: string) => (s.trim() === '' ? undefined : Number(s.replace(/,/g, '')));

let nextId = 3;
const emptyRow = (id: number): Row => ({ id, name: '', rate: '', low: '', high: '' });

const AdmissionsCalculator: FunctionalComponent = () => {
  const [test, setTest] = useState<TestType>('sat');
  const [score, setScore] = useState('');
  const [gpa, setGpa] = useState('');
  const [profile, setProfile] = useState<Profile>('typical');
  const [rows, setRows] = useState<Row[]>([emptyRow(1), emptyRow(2)]);
  const [error, setError] = useState('');
  const [results, setResults] = useState<RowResult[] | null>(null);

  const isAct = test === 'act';
  const scoreMax = isAct ? 36 : 1600;
  const scoreMin = isAct ? 1 : 400;
  const scaleName = isAct ? 'ACT' : 'SAT';

  function update(id: number, field: keyof Omit<Row, 'id'>, value: string) {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  }

  function validScore(v: number | undefined) {
    return v !== undefined && Number.isFinite(v) && v >= scoreMin && v <= scoreMax && (!isAct || Number.isInteger(v));
  }

  function onSubmit(e: Event) {
    e.preventDefault();
    const s = num(score);
    const g = num(gpa);
    if (test !== 'none' && !validScore(s)) {
      setError(`Enter your ${scaleName} score between ${scoreMin} and ${scoreMax}, or choose "No test score".`);
      return;
    }
    if (g !== undefined && (!Number.isFinite(g) || g < 0 || g > 4)) {
      setError('Enter an unweighted GPA between 0 and 4.0, or leave it blank.');
      return;
    }
    setError('');

    const student: Student = { test, score: s, gpa: g, profile };
    const out: RowResult[] = [];
    rows.forEach((r, i) => {
      if (!r.name.trim() && !r.rate.trim() && !r.low.trim() && !r.high.trim()) return;
      const label = r.name.trim() || `College ${i + 1}`;
      const rate = num(r.rate);
      if (rate === undefined || !Number.isFinite(rate) || rate <= 0 || rate > 100) {
        out.push({ label, error: 'Enter the acceptance rate as a percent, for example 42.' });
        return;
      }
      const low = num(r.low);
      const high = num(r.high);
      const hasRange = low !== undefined || high !== undefined;
      if (test !== 'none' && hasRange && (!validScore(low) || !validScore(high) || (low as number) > (high as number))) {
        out.push({ label, error: `Enter both ${scaleName} percentiles (25th, then 75th), or leave both blank.` });
        return;
      }
      out.push({ label, result: assess(student, { name: label, acceptanceRate: rate, low, high }) });
    });

    if (out.length === 0) {
      setError('Add at least one college with its acceptance rate.');
      setResults(null);
      return;
    }
    setResults(out);
  }

  const fits = (results ?? []).flatMap((r) => (r.result ? [r.result.fit] : []));
  const advice = summarize(fits);
  const count = (f: Fit) => fits.filter((x) => x === f).length;

  return (
    <section class="tool" aria-labelledby="calc-heading">
      <h2 id="calc-heading">Check your chances</h2>
      <form onSubmit={onSubmit} noValidate>
        <fieldset>
          <legend>Your profile</legend>
          <div class="radio-row" role="radiogroup" aria-label="Test score type">
            {(['sat', 'act', 'none'] as TestType[]).map((t) => (
              <label>
                <input type="radio" name="test" value={t} checked={test === t} onChange={() => setTest(t)} />
                {t === 'sat' ? 'SAT' : t === 'act' ? 'ACT' : 'No test score'}
              </label>
            ))}
          </div>
          <div class="form-grid" style={{ marginTop: '.75rem' }}>
            {test !== 'none' && (
              <div class="field">
                <label for="score">Your {scaleName} score</label>
                <input id="score" type="text" inputMode="numeric" autoComplete="off" placeholder={isAct ? 'e.g. 29' : 'e.g. 1340'}
                  value={score} onInput={(e) => setScore((e.target as HTMLInputElement).value)} />
              </div>
            )}
            <div class="field">
              <label for="gpa">Unweighted GPA (optional)</label>
              <input id="gpa" type="text" inputMode="decimal" autoComplete="off" placeholder="e.g. 3.7"
                value={gpa} onInput={(e) => setGpa((e.target as HTMLInputElement).value)} aria-describedby="gpa-hint" />
              <p class="hint" id="gpa-hint">On a 4.0 scale. Leave blank if your school does not use GPA.</p>
            </div>
            <div class="field">
              <label for="profile">Rest of your application</label>
              <select id="profile" value={profile} onChange={(e) => setProfile((e.target as HTMLSelectElement).value as Profile)} aria-describedby="profile-hint">
                <option value="below">Weaker than most applicants</option>
                <option value="typical">Typical</option>
                <option value="outstanding">Outstanding</option>
              </select>
              <p class="hint" id="profile-hint">Course rigor, essays, activities and recommendations. Be honest.</p>
            </div>
          </div>
        </fieldset>

        {rows.map((r, i) => (
          <fieldset key={r.id}>
            <legend>College {i + 1}</legend>
            <div class="form-grid">
              <div class="field">
                <label for={`name-${r.id}`}>College name</label>
                <input id={`name-${r.id}`} type="text" autoComplete="off" value={r.name}
                  onInput={(e) => update(r.id, 'name', (e.target as HTMLInputElement).value)} />
              </div>
              <div class="field">
                <label for={`rate-${r.id}`}>Acceptance rate (%)</label>
                <input id={`rate-${r.id}`} type="text" inputMode="decimal" autoComplete="off" placeholder="e.g. 42" value={r.rate}
                  onInput={(e) => update(r.id, 'rate', (e.target as HTMLInputElement).value)} />
              </div>
              {test !== 'none' && (
                <>
                  <div class="field">
                    <label for={`low-${r.id}`}>{scaleName} 25th percentile</label>
                    <input id={`low-${r.id}`} type="text" inputMode="numeric" autoComplete="off" placeholder={isAct ? 'e.g. 26' : 'e.g. 1220'} value={r.low}
                      onInput={(e) => update(r.id, 'low', (e.target as HTMLInputElement).value)} />
                  </div>
                  <div class="field">
                    <label for={`high-${r.id}`}>{scaleName} 75th percentile</label>
                    <input id={`high-${r.id}`} type="text" inputMode="numeric" autoComplete="off" placeholder={isAct ? 'e.g. 31' : 'e.g. 1410'} value={r.high}
                      onInput={(e) => update(r.id, 'high', (e.target as HTMLInputElement).value)} />
                  </div>
                </>
              )}
            </div>
            {rows.length > 1 && (
              <div class="row-actions">
                <button type="button" class="btn-link" onClick={() => setRows((rs) => rs.filter((x) => x.id !== r.id))}>
                  Remove college {i + 1}
                </button>
              </div>
            )}
          </fieldset>
        ))}

        {rows.length < MAX_ROWS && (
          <button type="button" class="btn btn-secondary" onClick={() => setRows((rs) => [...rs, emptyRow(nextId++)])}>
            Add another college
          </button>
        )}

        <div class="form-actions">
          <button type="submit" class="btn">Calculate my chances</button>
          {error && <p class="error" role="alert" style={{ marginTop: '.75rem' }}>{error}</p>}
        </div>
      </form>

      <div aria-live="polite">
        {results && (
          <div class="results">
            {fits.length > 0 && (
              <p class="results-summary">
                <strong>{count('reach')}</strong> Reach, <strong>{count('target')}</strong> Target, <strong>{count('likely')}</strong> Likely
              </p>
            )}
            <div class="table-wrap">
              <table>
                <thead>
                  <tr><th scope="col">College</th><th scope="col">Result</th><th scope="col">Why</th></tr>
                </thead>
                <tbody>
                  {results.map((r) => (
                    <tr>
                      <td>{r.label}</td>
                      <td>{r.result ? <span class={`tag ${FIT_TAG[r.result.fit]}`}>{FIT_LABEL[r.result.fit]}</span> : '–'}</td>
                      <td>{r.error ? <span class="error">{r.error}</span> : r.result!.reasons.join(' ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {advice.length > 0 && (
              <ul class="advice">
                {advice.map((a) => <li>{a}</li>)}
              </ul>
            )}
          </div>
        )}
      </div>

      <p class="disclaimer">
        This is a rule-of-thumb estimate from test scores, GPA and acceptance rates. Colleges also weigh essays,
        activities, recommendations and context, so no calculator can predict a decision.
      </p>
    </section>
  );
};

export default AdmissionsCalculator;
