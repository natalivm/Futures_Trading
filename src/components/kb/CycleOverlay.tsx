import { useEffect, useState } from 'react';

interface Match {
  lagYears: number;
  corr: number;
  retCorr: number;
  swingCorr?: number;
  heldMinCorr?: number | null;
  analogStart: string;
  analogEnd: string;
  analogCloses: number[];
  forecastCloses: number[];
  forecastChangePct?: number | null;
  preSpecified?: boolean;
}

interface Report {
  symbol: string;
  historyStart: string;
  historyEnd: string;
  window: number;
  currentStart: string;
  currentEnd: string;
  currentCloses: number[];
  matches: Match[];
}

function normalize(xs: number[]) {
  const lo = Math.min(...xs);
  const hi = Math.max(...xs);
  return hi === lo ? xs.map(() => 50) : xs.map(x => ((x - lo) * 100) / (hi - lo));
}

function path(series: number[], w: number, h: number, pad: number, span: number, offset = 0) {
  return series
    .map((v, i) =>
      `${(pad + ((i + offset) * (w - pad * 2)) / span).toFixed(1)},${(h - pad - (v * (h - pad * 2)) / 100).toFixed(1)}`)
    .join(' ');
}

/**
 * The present window against the analog the scanner matched it to — the
 * course's own chart, drawn from our own data rather than from a slide.
 *
 * The data is written by the weekly workflow into public/cycles/<SERIES>.json.
 * Until that has run there is nothing to draw, and saying so plainly beats an
 * empty frame or, worse, an illustration that could be mistaken for history.
 */
export default function CycleOverlay({ series, label, caption }: { series: string; label: string; caption?: string }) {
  const [report, setReport] = useState<Report | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'missing'>('loading');
  const [view, setView] = useState<'overlay' | 'forecast'>('overlay');

  useEffect(() => {
    let live = true;
    fetch(`${import.meta.env.BASE_URL}cycles/${series}.json`)
      .then(r => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: Report) => {
        if (!live) return;
        if (!data?.matches?.length) { setState('missing'); return; }
        setReport(data);
        setState('ready');
      })
      .catch(() => live && setState('missing'));
    return () => { live = false; };
  }, [series]);

  const w = 760;
  const h = 280;
  const pad = 26;

  if (state !== 'ready' || !report) {
    return (
      <figure className="kb-figure">
        <div className="kb-figure-head">
          <span className="kb-figure-kind">Cycle overlay</span>
          <strong>{label}</strong>
        </div>
        <div className="kb-figure-fallback">
          {state === 'loading' ? (
            <p className="muted">Loading the scan…</p>
          ) : (
            <>
              <p>No scan on file for <code>{series}</code> yet.</p>
              <p className="muted small">
                This chart draws itself from <code>public/cycles/{series}.json</code>, written by the
                “Update prices and rescan cycles” workflow. Run it once and the overlay appears here —
                real history, not an illustration.
              </p>
            </>
          )}
        </div>
        {caption && <figcaption>{caption}</figcaption>}
      </figure>
    );
  }

  const match = report.matches[0];
  const cur = normalize(report.currentCloses);
  const ana = normalize(match.analogCloses);
  const forecast = match.forecastCloses ?? [];
  const combined = view === 'forecast' ? [...report.currentCloses, ...forecast] : [];
  const combinedNorm = combined.length ? normalize(combined) : [];
  const span = view === 'overlay'
    ? Math.max(cur.length, ana.length) - 1 || 1
    : combinedNorm.length - 1 || 1;

  const splitX = pad + ((report.currentCloses.length - 1) * (w - pad * 2)) / span;

  return (
    <figure className="kb-figure">
      <div className="kb-figure-head">
        <span className="kb-figure-kind">Cycle overlay</span>
        <strong>{label}</strong>
        <span className="muted small">{match.lagYears.toFixed(1)}-year offset</span>
        <div className="kb-figure-toggle">
          <button className={view === 'overlay' ? 'on' : ''} onClick={() => setView('overlay')}>Overlay</button>
          <button className={view === 'forecast' ? 'on' : ''} onClick={() => setView('forecast')}
                  disabled={!forecast.length}>
            What happened next
          </button>
        </div>
      </div>

      <svg viewBox={`0 0 ${w} ${h}`} className="kb-demo-chart" role="img"
           aria-label={`${label}: the present window against a stretch ${match.lagYears.toFixed(1)} years earlier`}>
        {[0, 25, 50, 75, 100].map(v => (
          <line key={v} x1={pad} x2={w - pad}
                y1={h - pad - (v * (h - pad * 2)) / 100} y2={h - pad - (v * (h - pad * 2)) / 100}
                className="kb-demo-grid" />
        ))}
        {view === 'overlay' ? (
          <>
            <polyline className="kb-demo-analog" points={path(ana, w, h, pad, span)} />
            <polyline className="kb-demo-current" points={path(cur, w, h, pad, span)} />
          </>
        ) : (
          <>
            <line x1={splitX} x2={splitX} y1={pad} y2={h - pad} className="kb-demo-split" />
            <polyline className="kb-demo-analog"
                      points={path(combinedNorm.slice(report.currentCloses.length), w, h, pad, span,
                                   report.currentCloses.length)} />
            <polyline className="kb-demo-current"
                      points={path(combinedNorm.slice(0, report.currentCloses.length), w, h, pad, span)} />
          </>
        )}
      </svg>

      <div className="kb-demo-side row">
        <p className="kb-demo-legend">
          <span className="swatch now" /> now: {report.currentStart} → {report.currentEnd}
          <br />
          <span className="swatch then" /> analog: {match.analogStart} → {match.analogEnd}
        </p>
        <dl className="kb-demo-scores">
          <div><dt>Price</dt><dd>{match.corr.toFixed(3)}</dd></div>
          {match.swingCorr !== undefined && (
            <div><dt>Swing</dt><dd>{match.swingCorr.toFixed(3)}</dd></div>
          )}
          {match.heldMinCorr != null && (
            <div><dt>Worst epoch</dt><dd>{match.heldMinCorr.toFixed(3)}</dd></div>
          )}
        </dl>
      </div>

      <figcaption>
        {caption ?? `Both paths rescaled to 0–100, the way the course slides draw them. ${
          match.preSpecified ? 'The offset was named in advance.' : 'The offset was found by searching, so read the swing and epoch scores before the price correlation.'
        }`}
      </figcaption>
    </figure>
  );
}
