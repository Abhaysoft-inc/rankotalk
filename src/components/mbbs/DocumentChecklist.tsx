import { useEffect, useState } from 'preact/hooks';
import type { FunctionalComponent } from 'preact';
import { ALL_IDS, STAGES, progress } from './documents';

const KEY = 'rankotalk-mbbs-documents';

function load(): Set<string> {
  try {
    const raw = localStorage.getItem(KEY);
    const ids = raw ? (JSON.parse(raw) as unknown) : [];
    return new Set(Array.isArray(ids) ? ids.filter((id): id is string => typeof id === 'string' && ALL_IDS.includes(id)) : []);
  } catch {
    return new Set();
  }
}

function save(done: Set<string>) {
  try {
    localStorage.setItem(KEY, JSON.stringify([...done]));
  } catch {
    // Storage can be unavailable (private mode); the checklist still works for this visit.
  }
}

const DocumentChecklist: FunctionalComponent = () => {
  const [done, setDone] = useState<Set<string>>(new Set());
  const [onlyCommon, setOnlyCommon] = useState(false);

  useEffect(() => setDone(load()), []);

  function toggle(id: string, checked: boolean) {
    setDone((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      save(next);
      return next;
    });
  }

  function reset() {
    const empty = new Set<string>();
    save(empty);
    setDone(empty);
  }

  const visibleIds = STAGES.flatMap((s) => s.items.filter((i) => !onlyCommon || !i.someCountries).map((i) => i.id));
  const pct = progress(done, visibleIds);

  return (
    <section class="tool" aria-labelledby="docs-heading">
      <h2 id="docs-heading">Your document checklist</h2>
      <p style={{ fontSize: '1rem', margin: 0 }}>
        <strong>{pct}% done</strong> ({visibleIds.filter((id) => done.has(id)).length} of {visibleIds.length}). Your ticks are
        saved in this browser only.
      </p>
      <div class="progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label="Checklist progress">
        <span style={{ width: `${pct}%` }} />
      </div>
      <div class="radio-row" style={{ marginTop: '.5rem' }}>
        <label>
          <input type="checkbox" checked={onlyCommon} onChange={(e) => setOnlyCommon((e.target as HTMLInputElement).checked)} />
          Hide items needed only in some countries
        </label>
      </div>

      {STAGES.map((stage) => {
        const items = stage.items.filter((i) => !onlyCommon || !i.someCountries);
        return (
          <fieldset key={stage.id}>
            <legend>{stage.title}</legend>
            <ul class="checklist">
              {items.map((item) => (
                <li key={item.id}>
                  <label>
                    <input type="checkbox" checked={done.has(item.id)} onChange={(e) => toggle(item.id, (e.target as HTMLInputElement).checked)} />
                    <span>
                      <strong>{item.label}</strong>
                      {item.someCountries && <span class="tag tag-moderate" style={{ marginLeft: '.5rem' }}>Some countries</span>}
                      <br />
                      <span class="hint">{item.note}</span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </fieldset>
        );
      })}

      <button type="button" class="btn-link" onClick={reset}>Clear all ticks</button>

      <p class="disclaimer">
        Every country and embassy sets its own list. Always check the current requirements on the embassy’s official website
        before you apply.
      </p>
    </section>
  );
};

export default DocumentChecklist;
