import { useState } from 'preact/hooks';
import type { FunctionalComponent } from 'preact';
import { checkAdmission, checkFmg, overall } from './eligibility';
import type { AdmissionInput, Category, Check, CheckStatus, FmgInput, Overall } from './eligibility';
import type { YesNo } from './check';

type Mode = 'before' | 'after';

const STATUS_TAG: Record<CheckStatus, [string, string]> = {
  pass: ['tag-safe', 'Meets'],
  confirm: ['tag-moderate', 'Confirm'],
  pending: ['tag-moderate', 'To do'],
  fail: ['tag-reach', 'Does not meet'],
};

const OVERALL_TEXT: Record<Mode, Record<Overall, string>> = {
  before: {
    eligible: 'You meet the main rules to study MBBS abroad.',
    check: 'You may be eligible. Sort out the items marked Confirm or To do first.',
    'not-eligible': 'You do not meet at least one rule yet. See the details below.',
  },
  after: {
    eligible: 'Your course meets the FMGL 2021 checks. Next: NExT or the screening test, then a supervised internship in India.',
    check: 'Nothing breaks a rule so far, but some answers need confirming.',
    'not-eligible': 'At least one answer conflicts with NMC’s FMGL 2021 rules. See the details below.',
  },
};

const YES_NO: [YesNo, string][] = [['yes', 'Yes'], ['no', 'No'], ['unsure', 'Not sure']];
const thisYear = new Date().getFullYear();
const num = (s: string) => (s.trim() === '' || !Number.isFinite(Number(s)) ? undefined : Number(s));

function Results({ checks, mode }: { checks: Check[]; mode: Mode }) {
  const o = overall(checks);
  return (
    <div class="results">
      <p class="results-summary">
        <span class={`tag ${o === 'eligible' ? 'tag-safe' : o === 'check' ? 'tag-moderate' : 'tag-reach'}`}>
          {o === 'eligible' ? 'Eligible' : o === 'check' ? 'Check first' : 'Not eligible yet'}
        </span>{' '}
        {OVERALL_TEXT[mode][o]}
      </p>
      <div class="table-wrap">
        <table>
          <thead><tr><th scope="col">Rule</th><th scope="col">Result</th><th scope="col">Details</th></tr></thead>
          <tbody>
            {checks.map((c) => (
              <tr>
                <td>{c.label}</td>
                <td><span class={`tag ${STATUS_TAG[c.status][0]}`}>{STATUS_TAG[c.status][1]}</span></td>
                <td>{c.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const EligibilityChecker: FunctionalComponent = () => {
  const [mode, setMode] = useState<Mode>('before');

  const [a, setA] = useState({
    dob: '', admissionYear: String(thisYear), physics: true, chemistry: true, biology: true, english: true,
    pcb: '', category: 'general' as Category, neet: 'yes' as AdmissionInput['neet'], passport: 'yes' as AdmissionInput['passport'],
  });
  const [f, setF] = useState({
    joinedAfterFmgl: 'yes' as YesNo, course: '', internship: '', internshipSame: 'unsure' as YesNo, english: 'unsure' as YesNo,
    licence: 'unsure' as YesNo, sameInstitution: 'unsure' as YesNo, practicalsInPerson: 'unsure' as YesNo, within10Years: 'unsure' as YesNo,
  });
  const [checks, setChecks] = useState<{ mode: Mode; list: Check[] } | null>(null);

  const select = <T extends string>(id: string, label: string, value: T, options: [T, string][], onChange: (v: T) => void) => (
    <div class="field">
      <label for={id}>{label}</label>
      <select id={id} value={value} onChange={(e) => onChange((e.target as HTMLSelectElement).value as T)}>
        {options.map(([v, l]) => <option value={v}>{l}</option>)}
      </select>
    </div>
  );

  function submitBefore(e: Event) {
    e.preventDefault();
    const input: AdmissionInput = {
      dob: a.dob || undefined,
      admissionYear: Number(a.admissionYear),
      physics: a.physics, chemistry: a.chemistry, biology: a.biology, english: a.english,
      pcbPercent: num(a.pcb), category: a.category, neet: a.neet, passport: a.passport,
    };
    setChecks({ mode: 'before', list: checkAdmission(input) });
  }

  function submitAfter(e: Event) {
    e.preventDefault();
    const input: FmgInput = {
      joinedAfterFmgl: f.joinedAfterFmgl, courseMonths: num(f.course), internshipMonths: num(f.internship),
      internshipSame: f.internshipSame, english: f.english, licence: f.licence, sameInstitution: f.sameInstitution,
      practicalsInPerson: f.practicalsInPerson, within10Years: f.within10Years,
    };
    setChecks({ mode: 'after', list: checkFmg(input) });
  }

  const tab = (m: Mode, label: string) => (
    <button type="button" role="tab" class="tab" id={`tab-${m}`} aria-selected={mode === m} aria-controls={`panel-${m}`}
      onClick={() => { setMode(m); setChecks(null); }}>
      {label}
    </button>
  );

  return (
    <section class="tool" aria-labelledby="elig-heading">
      <h2 id="elig-heading">Check your eligibility</h2>
      <div class="tabs" role="tablist" aria-label="Which check">
        {tab('before', 'Before you go: can I study MBBS abroad?')}
        {tab('after', 'After you graduate: can I practise in India?')}
      </div>

      {mode === 'before' ? (
        <form id="panel-before" role="tabpanel" aria-labelledby="tab-before" onSubmit={submitBefore} noValidate>
          <div class="form-grid">
            <div class="field">
              <label for="dob">Date of birth</label>
              <input id="dob" type="date" value={a.dob} onInput={(e) => setA({ ...a, dob: (e.target as HTMLInputElement).value })} />
            </div>
            {select('year', 'Year you want to start', a.admissionYear, [String(thisYear), String(thisYear + 1), String(thisYear + 2)].map((y) => [y, y] as [string, string]), (v) => setA({ ...a, admissionYear: v }))}
            {select<Category>('category', 'Category', a.category, [['general', 'General or EWS'], ['reserved', 'OBC-NCL, SC or ST'], ['pwd', 'Person with benchmark disability (General or EWS)']], (v) => setA({ ...a, category: v }))}
            <div class="field">
              <label for="pcb">Class 12 Physics, Chemistry and Biology aggregate (%)</label>
              <input id="pcb" type="text" inputMode="decimal" autoComplete="off" placeholder="e.g. 68" value={a.pcb}
                onInput={(e) => setA({ ...a, pcb: (e.target as HTMLInputElement).value })} />
            </div>
            {select('neet', 'NEET-UG', a.neet, [['yes', 'Qualified'], ['awaiting', 'Waiting for the result'], ['no', 'Not qualified']], (v) => setA({ ...a, neet: v }))}
            {select('passport', 'Passport', a.passport, [['yes', 'I have a valid passport'], ['applied', 'Applied for one'], ['no', 'Not yet']], (v) => setA({ ...a, passport: v }))}
          </div>
          <fieldset style={{ marginTop: '1rem' }}>
            <legend>Subjects you passed in Class 12</legend>
            <div class="radio-row">
              {([['physics', 'Physics'], ['chemistry', 'Chemistry'], ['biology', 'Biology or Biotechnology'], ['english', 'English']] as const).map(([k, l]) => (
                <label>
                  <input type="checkbox" checked={a[k]} onChange={(e) => setA({ ...a, [k]: (e.target as HTMLInputElement).checked })} />
                  {l}
                </label>
              ))}
            </div>
          </fieldset>
          <div class="form-actions"><button type="submit" class="btn">Check eligibility</button></div>
        </form>
      ) : (
        <form id="panel-after" role="tabpanel" aria-labelledby="tab-after" onSubmit={submitAfter} noValidate>
          <div class="form-grid">
            {select<YesNo>('joined', 'Did you join on or after 18 November 2021?', f.joinedAfterFmgl, YES_NO, (v) => setF({ ...f, joinedAfterFmgl: v }))}
            <div class="field">
              <label for="course">Course length in months, without internship</label>
              <input id="course" type="text" inputMode="numeric" autoComplete="off" placeholder="e.g. 60" value={f.course}
                onInput={(e) => setF({ ...f, course: (e.target as HTMLInputElement).value })} />
            </div>
            <div class="field">
              <label for="internship">Internship length in months</label>
              <input id="internship" type="text" inputMode="numeric" autoComplete="off" placeholder="e.g. 12" value={f.internship}
                onInput={(e) => setF({ ...f, internship: (e.target as HTMLInputElement).value })} />
            </div>
            {select<YesNo>('intern-same', 'Internship at the same university?', f.internshipSame, YES_NO, (v) => setF({ ...f, internshipSame: v }))}
            {select<YesNo>('english', 'Whole course taught in English?', f.english, YES_NO, (v) => setF({ ...f, english: v }))}
            {select<YesNo>('licence', 'Can you get a licence to practise in that country?', f.licence, YES_NO, (v) => setF({ ...f, licence: v }))}
            {select<YesNo>('same', 'Whole course at one university, with no transfer?', f.sameInstitution, YES_NO, (v) => setF({ ...f, sameInstitution: v }))}
            {select<YesNo>('practicals', 'Practical and clinical training done in person?', f.practicalsInPerson, YES_NO, (v) => setF({ ...f, practicalsInPerson: v }))}
            {select<YesNo>('ten', 'Will you finish within 10 years of joining?', f.within10Years, YES_NO, (v) => setF({ ...f, within10Years: v }))}
          </div>
          <div class="form-actions"><button type="submit" class="btn">Check my degree</button></div>
        </form>
      )}

      <div aria-live="polite">{checks && checks.mode === mode && <Results checks={checks.list} mode={mode} />}</div>

      <p class="disclaimer">
        This checker compares your answers with NMC’s published rules. It is not an official decision. Confirm your case with
        the current NMC regulations and notices.
      </p>
    </section>
  );
};

export default EligibilityChecker;
