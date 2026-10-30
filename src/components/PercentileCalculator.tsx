import { useState } from 'preact/hooks';
import type { FunctionalComponent } from 'preact';
import { percentileToRank, rankToPercentile } from '../lib/percentile';

const DEFAULT_CANDIDATES = '1200000';

const PercentileCalculator: FunctionalComponent = () => {
  const [mode, setMode] = useState<'p2r' | 'r2p'>('p2r');
  const [value, setValue] = useState('');
  const [candidates, setCandidates] = useState(DEFAULT_CANDIDATES);

  const n = Number(candidates.replace(/,/g, ''));
  const v = Number(value.replace(/,/g, ''));
  const validN = Number.isInteger(n) && n >= 1000;
  const validV = value.trim() !== '' && Number.isFinite(v) && (mode === 'p2r' ? v >= 0 && v <= 100 : Number.isInteger(v) && v >= 1 && validN && v <= n);

  let output = '';
  if (validN && validV) {
    output = mode === 'p2r'
      ? `Approximate rank: ${percentileToRank(v, n).toLocaleString('en-IN')}`
      : `Approximate percentile: ${rankToPercentile(v, n).toFixed(4)}`;
  }

  return (
    <section class="tool" aria-labelledby="calc-heading">
      <h2 id="calc-heading">Percentile and rank calculator</h2>
      <div class="tabs" role="group" aria-label="Conversion direction">
        <button type="button" class="tab" aria-pressed={mode === 'p2r'} onClick={() => { setMode('p2r'); setValue(''); }}>
          Percentile to rank
        </button>
        <button type="button" class="tab" aria-pressed={mode === 'r2p'} onClick={() => { setMode('r2p'); setValue(''); }}>
          Rank to percentile
        </button>
      </div>
      <div class="form-grid">
        <div class="field">
          <label for="calc-value">{mode === 'p2r' ? 'NTA percentile (0 to 100)' : 'JEE Main rank'}</label>
          <input
            id="calc-value"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            placeholder={mode === 'p2r' ? 'e.g. 97.5' : 'e.g. 30000'}
            value={value}
            onInput={(e) => setValue((e.target as HTMLInputElement).value)}
          />
        </div>
        <div class="field">
          <label for="calc-candidates">Candidates who appeared</label>
          <input
            id="calc-candidates"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={candidates}
            onInput={(e) => setCandidates((e.target as HTMLInputElement).value)}
            aria-describedby="calc-hint"
          />
          <p class="hint" id="calc-hint">Replace with the number in the NTA result notice for your year. 12,00,000 is a round example.</p>
        </div>
      </div>
      <div aria-live="polite">
        {output && <p class="results-summary" style={{ marginTop: '1.25rem' }}><strong>{output}</strong></p>}
        {value.trim() !== '' && !validV && <p class="error" style={{ marginTop: '1.25rem' }}>Check the value you entered.</p>}
      </div>
      <p class="disclaimer">
        This is an estimate. NTA publishes the final rank list, and your actual rank can differ because
        candidates with equal scores are ranked using tie-break rules.
      </p>
    </section>
  );
};

export default PercentileCalculator;
