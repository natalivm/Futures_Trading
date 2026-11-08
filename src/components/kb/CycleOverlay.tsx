import { useEffect, useState } from 'react';
import { MARKETS, marketLabel } from '../../lib/markets';

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
 * The reader picks the market and which of the matched offsets to look at,
 * because "which index?" is the first question this chart raises and leaving
 * it fixed to one answer made the figure an illustration rather than a tool.
 *
 * Data comes from public/cycles/<SLUG>.json, written by the weekly workflow.
 * Until that has run for a market there is nothing to draw, and saying so
 * plainly beats an empty frame or an illustration mistakable for history.
 */
interface Props {
  series: string;
  label: string;
  /** The interval the surrounding passage is about, if it has one. */
  lagYears?: number;
  caption?: string;
}

/** Closest match to the requested interval, if the scan contains one near it. */
function nearest(matches: Match[], lagYears?: number) {
  if (lagYears === undefined) return { index: 0, exact: true };
  let best = 0;
  matches.forEach((m, i) => {
    if (Math.abs(m.lagYears - lagYears) < Math.abs(matches[best].lagYears - lagYears)) best = i;
  });
  // Within 5% of the asked-for interval counts as the same cycle.
  return { index: best, exact: Math.abs(matches[best].lagYears - lagYears) <= lagYears * 0.05 };
}

export default function CycleOverlay({ series, label, lagYears, caption }: Props) {
  const [slug, setSlug] = useState(series);
  const [report, setReport] = useState<Report | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'missing'>('loading');
  const [view, setView] = useState<'overlay' | 'forecast'>('overlay');
  const [pick, setPick] = useState(0);
  const [exact, setExact] = useState(true);

  useEffect(() => {
    let live = true;
    setState('loading');
    const base = import.meta.env.BASE_URL;
    // Prefer the pre-specified run: a passage about the 17-year cycle should
    // open on the 17-year overlay, not on whatever the open search liked best.
    const sources = lagYears !== undefined
      ? [`${base}cycles/${slug}_named.json`, `${base}cycles/${slug}.json`]
      : [`${base}cycles/${slug}.json`];

    (async () => {
      for (const url of sources) {
        try {
          const res = await fetch(url);
          if (!res.ok) continue;
          const data: Report = await res.json();
          if (!data?.matches?.length) continue;
          const { index, exact: hit } = nearest(data.matches, lagYears);
          if (lagYears !== undefined && !hit && url.endsWith('_named.json')) continue;
          if (!live) return;
          setReport(data);
          setPick(index);
          setExact(hit);
          setState('ready');
          return;
        } catch {
          // try the next source
        }
      }
      if (live) setState('missing');
    })();
    return () => { live = false; };
  }, [slug, lagYears]);

  const picker = (
    <label className="kb-figure-pick">
      <span className="visually-hidden">Market</span>
      <select value={slug} onChange={e => setSlug(e.target.value)}>
        {MARKETS.map(m => <option key={m.slug} value={m.slug}>{m.label}</option>)}
      </select>
    </label>
  );

  const w = 760;
  const h = 280;
  const pad = 26;

  if (state !== 'ready' || !report) {
    return (
      <figure className="kb-figure">
        <div className="kb-figure-head">
          <span className="kb-figure-kind">Cycle overlay</span>
          <strong>{label}</strong>
          {picker}
        </div>
        <div className="kb-figure-fallback">
          {state === 'loading' ? (
            <p className="muted">Loading the scan…</p>
          ) : (
            <>
              <p>No scan on file for <strong>{marketLabel(slug)}</strong> yet.</p>
              <p className="muted small">
                This chart draws itself from <code>public/cycles/{slug}.json</code>, written by the
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

  const match = report.matches[Math.min(pick, report.matches.length - 1)];
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
        {picker}
        <div className="kb-figure-toggle">
          <button className={view === 'overlay' ? 'on' : ''} onClick={() => setView('overlay')}>Overlay</button>
          <button className={view === 'forecast' ? 'on' : ''} onClick={() => setView('forecast')}
                  disabled={!forecast.length}>
            What happened next
          </button>
        </div>
      </div>

      {!exact && lagYears !== undefined && (
        <p className="kb-offset-note">
          No {lagYears}-year overlay for {marketLabel(slug)} yet — the history on file is too short to
          measure that interval. Showing the scanner’s nearest match, {match.lagYears.toFixed(1)} years,
          which is a different claim.
        </p>
      )}

      {report.matches.length > 1 && (
        <div className="kb-offsets" role="group" aria-label="Matched offsets">
          <span className="muted small">Offset:</span>
          {report.matches.map((m, i) => (
            <button key={m.lagYears} className={i === pick ? 'on' : ''}
                    onClick={() => { setPick(i); setExact(true); }}>
              {m.lagYears.toFixed(1)}y
            </button>
          ))}
        </div>
      )}

      <svg viewBox={`0 0 ${w} ${h}`} className="kb-demo-chart" role="img"
           aria-label={`${marketLabel(slug)}: the present window against a stretch ${match.lagYears.toFixed(1)} years earlier`}>
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
          {/* The random-walk control scored 0.449 on swing, so anything under
              that is not a pass — it is the band where noise lives. */}
          {match.swingCorr !== undefined && (
            <div className={match.swingCorr < 0.15 ? 'bad' : match.swingCorr < 0.5 ? 'mid' : 'good'}>
              <dt>Swing</dt><dd>{match.swingCorr.toFixed(3)}</dd>
            </div>
          )}
          {match.heldMinCorr != null && (
            <div className={match.heldMinCorr < 0 ? 'bad' : 'good'}>
              <dt>Worst epoch</dt><dd>{match.heldMinCorr.toFixed(3)}</dd>
            </div>
          )}
        </dl>
      </div>

      <figcaption>
        {caption ?? 'Both paths rescaled to 0–100, the way the course slides draw them.'}{' '}
        {marketLabel(slug)}, {report.historyStart} → {report.historyEnd}, {report.window}-day window.{' '}
        {match.preSpecified
          ? 'This offset was named in advance.'
          : 'This offset was found by searching, so read the swing and worst-epoch scores before the price correlation — a random walk scores about 0.95 on price alone.'}
      </figcaption>
    </figure>
  );
}
