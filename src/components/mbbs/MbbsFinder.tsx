import { useState } from 'preact/hooks';
import type { FunctionalComponent } from 'preact';
import { checkUniversity, rank } from './check';
import type { CheckResult, InternshipPlace, Medium, Status, University, YesNo } from './check';

type Neet = 'yes' | 'no' | 'awaiting';

interface Row {
  id: number;
  name: string;
  country: string;
  courseMonths: string;
  internshipMonths: string;
  internshipPlace: InternshipPlace;
  medium: Medium;
  licence: YesNo;
  sameInstitution: YesNo;
  wdoms: YesNo;
  nmcAdvisory: YesNo;
  cost: string;
}

const STATUS_LABEL: Record<Status, string> = { meets: 'Meets NMC rules', check: 'Check before you apply', fails: 'Breaks an NMC rule' };
const STATUS_TAG: Record<Status, string> = { meets: 'tag-safe', check: 'tag-moderate', fails: 'tag-reach' };
const MAX_ROWS = 10;

const num = (s: string) => {
  if (s.trim() === '') return undefined;
  const n = Number(s.replace(/,/g, ''));
  return Number.isFinite(n) && n >= 0 ? n : undefined;
};

let nextId = 2;
const emptyRow = (id: number): Row => ({
  id,
  name: '',
  country: '',
  courseMonths: '',
  internshipMonths: '',
  internshipPlace: 'unsure',
  medium: 'unsure',
  licence: 'unsure',
  sameInstitution: 'unsure',
  wdoms: 'unsure',
  nmcAdvisory: 'unsure',
  cost: '',
});

const YES_NO_UNSURE: [YesNo, string][] = [['yes', 'Yes'], ['no', 'No'], ['unsure', 'Not sure']];

const MbbsFinder: FunctionalComponent = () => {
  const [neet, setNeet] = useState<Neet>('yes');
  const [budget, setBudget] = useState('');
  const [rows, setRows] = useState<Row[]>([emptyRow(1)]);
  const [error, setError] = useState('');
  const [results, setResults] = useState<{ uni: University; result: CheckResult }[] | null>(null);
  const [checkedNeet, setCheckedNeet] = useState<Neet>('yes');

  function update<K extends keyof Row>(id: number, field: K, value: Row[K]) {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  }

  function onSubmit(e: Event) {
    e.preventDefault();
    const budgetLakh = num(budget);
    if (budget.trim() !== '' && budgetLakh === undefined) {
      setError('Enter your budget as a number in lakh rupees, for example 35.');
      return;
    }
    const filled = rows.filter((r) => r.name.trim() || r.country.trim() || r.courseMonths.trim() || r.cost.trim());
    if (filled.length === 0) {
      setError('Add at least one university with its name.');
      setResults(null);
      return;
    }
    setError('');
    const items = filled.map((r, i) => {
      const uni: University = {
        name: r.name.trim() || `University ${i + 1}`,
        country: r.country.trim(),
        courseMonths: num(r.courseMonths),
        internshipMonths: num(r.internshipMonths),
        internshipPlace: r.internshipPlace,
        medium: r.medium,
        licence: r.licence,
        sameInstitution: r.sameInstitution,
        wdoms: r.wdoms,
        nmcAdvisory: r.nmcAdvisory,
        totalCostLakh: num(r.cost),
      };
      return { uni, result: checkUniversity(uni, budgetLakh) };
    });
    setCheckedNeet(neet);
    setResults(rank(items));
  }

  const select = <T extends string>(id: string, label: string, value: T, options: [T, string][], onChange: (v: T) => void) => (
    <div class="field">
      <label for={id}>{label}</label>
      <select id={id} value={value} onChange={(e) => onChange((e.target as HTMLSelectElement).value as T)}>
        {options.map(([v, l]) => <option value={v}>{l}</option>)}
      </select>
    </div>
  );

  const count = (s: Status) => (results ?? []).filter((r) => r.result.status === s).length;

  return (
    <section class="tool" aria-labelledby="finder-heading">
      <h2 id="finder-heading">Check your universities</h2>
      <form onSubmit={onSubmit} noValidate>
        <fieldset>
          <legend>About you</legend>
          <div class="form-grid">
            {select<Neet>('neet', 'Have you qualified NEET-UG?', neet, [['yes', 'Yes'], ['awaiting', 'Waiting for the result'], ['no', 'No']], setNeet)}
            <div class="field">
              <label for="budget">Total budget (₹ lakh, optional)</label>
              <input id="budget" type="text" inputMode="decimal" autoComplete="off" placeholder="e.g. 35" value={budget}
                onInput={(e) => setBudget((e.target as HTMLInputElement).value)} aria-describedby="budget-hint" />
              <p class="hint" id="budget-hint">For the whole course: tuition, hostel, food, travel and insurance.</p>
            </div>
          </div>
        </fieldset>

        {rows.map((r, i) => (
          <fieldset key={r.id}>
            <legend>University {i + 1}</legend>
            <div class="form-grid">
              <div class="field">
                <label for={`name-${r.id}`}>University name</label>
                <input id={`name-${r.id}`} type="text" autoComplete="off" value={r.name}
                  onInput={(e) => update(r.id, 'name', (e.target as HTMLInputElement).value)} />
              </div>
              <div class="field">
                <label for={`country-${r.id}`}>Country</label>
                <input id={`country-${r.id}`} type="text" autoComplete="off" value={r.country}
                  onInput={(e) => update(r.id, 'country', (e.target as HTMLInputElement).value)} />
              </div>
              <div class="field">
                <label for={`course-${r.id}`}>Course length in months, without internship</label>
                <input id={`course-${r.id}`} type="text" inputMode="numeric" autoComplete="off" placeholder="e.g. 60" value={r.courseMonths}
                  onInput={(e) => update(r.id, 'courseMonths', (e.target as HTMLInputElement).value)} />
              </div>
              <div class="field">
                <label for={`intern-${r.id}`}>Internship length in months</label>
                <input id={`intern-${r.id}`} type="text" inputMode="numeric" autoComplete="off" placeholder="e.g. 12" value={r.internshipMonths}
                  onInput={(e) => update(r.id, 'internshipMonths', (e.target as HTMLInputElement).value)} />
              </div>
              {select<InternshipPlace>(`place-${r.id}`, 'Where is the internship done?', r.internshipPlace,
                [['same', 'At the same university'], ['elsewhere', 'Somewhere else (India or another country)'], ['unsure', 'Not sure']],
                (v) => update(r.id, 'internshipPlace', v))}
              {select<Medium>(`medium-${r.id}`, 'Language of teaching', r.medium,
                [['english', 'English for the whole course'], ['mixed', 'Partly in another language'], ['unsure', 'Not sure']],
                (v) => update(r.id, 'medium', v))}
              {select<YesNo>(`licence-${r.id}`, 'Can foreign graduates get a licence to practise there?', r.licence, YES_NO_UNSURE,
                (v) => update(r.id, 'licence', v))}
              {select<YesNo>(`same-${r.id}`, 'Is the whole course at this one university?', r.sameInstitution, YES_NO_UNSURE,
                (v) => update(r.id, 'sameInstitution', v))}
              {select<YesNo>(`wdoms-${r.id}`, 'Listed in the World Directory of Medical Schools?', r.wdoms, YES_NO_UNSURE,
                (v) => update(r.id, 'wdoms', v))}
              {select<YesNo>(`nmc-${r.id}`, 'Any NMC warning about this university?', r.nmcAdvisory, YES_NO_UNSURE,
                (v) => update(r.id, 'nmcAdvisory', v))}
              <div class="field">
                <label for={`cost-${r.id}`}>Total cost for the course (₹ lakh)</label>
                <input id={`cost-${r.id}`} type="text" inputMode="decimal" autoComplete="off" placeholder="e.g. 32" value={r.cost}
                  onInput={(e) => update(r.id, 'cost', (e.target as HTMLInputElement).value)} />
              </div>
            </div>
            {rows.length > 1 && (
              <div class="row-actions">
                <button type="button" class="btn-link" onClick={() => setRows((rs) => rs.filter((x) => x.id !== r.id))}>
                  Remove university {i + 1}
                </button>
              </div>
            )}
          </fieldset>
        ))}

        {rows.length < MAX_ROWS && (
          <button type="button" class="btn btn-secondary" onClick={() => setRows((rs) => [...rs, emptyRow(nextId++)])}>
            Add another university
          </button>
        )}

        <div class="form-actions">
          <button type="submit" class="btn">Check my universities</button>
          {error && <p class="error" role="alert" style={{ marginTop: '.75rem' }}>{error}</p>}
        </div>
      </form>

      <div aria-live="polite">
        {results && (
          <div class="results">
            {checkedNeet === 'no' && (
              <div class="callout" style={{ marginTop: 0, marginBottom: '1rem', borderLeftColor: 'var(--color-reach)' }}>
                <p>
                  <strong>You need to qualify NEET-UG first.</strong> Indian students must qualify NEET-UG to study MBBS
                  abroad and later practise in India, whichever university you choose.
                </p>
              </div>
            )}
            <p class="results-summary">
              <strong>{count('meets')}</strong> meet the rules, <strong>{count('check')}</strong> need checking,{' '}
              <strong>{count('fails')}</strong> break a rule. Best options are listed first.
            </p>
            <div class="table-wrap">
              <table>
                <thead>
                  <tr><th scope="col">University</th><th scope="col">Result</th><th scope="col" class="num">Cost (₹ lakh)</th><th scope="col">What to do</th></tr>
                </thead>
                <tbody>
                  {results.map(({ uni, result }) => (
                    <tr>
                      <td>{uni.name}{uni.country && <><br /><span class="hint">{uni.country}</span></>}</td>
                      <td><span class={`tag ${STATUS_TAG[result.status]}`}>{STATUS_LABEL[result.status]}</span></td>
                      <td class="num">{uni.totalCostLakh ?? '–'}</td>
                      <td>
                        {result.issues.length === 0
                          ? 'Every rule you entered is met. Get the details in writing before you pay.'
                          : <ul class="advice" style={{ marginTop: 0 }}>{result.issues.map((i) => <li>{i.text}</li>)}</ul>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <p class="disclaimer">
        This finder checks the answers you enter against NMC’s Foreign Medical Graduate Licentiate Regulations, 2021. It
        cannot confirm facts about a university for you, and it is not legal advice. Get every answer in writing from the
        university and check NMC public notices before paying any fee.
      </p>
    </section>
  );
};

export default MbbsFinder;
