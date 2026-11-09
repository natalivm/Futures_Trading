import { useEffect, useState } from 'react';
import { MARKETS, marketLabel } from '../../lib/markets';

interface Match {
  lagYears: number;
  corr: number;
  retCorr: number;
  swingCorr?: number;
  inverted?: boolean;
  heldMinCorr?: number | null;
  analogStart: string;
  analogEnd: string;
  analogCloses: number[];
  forecastCloses: number[];
  forecastChangePct?: number | null;
  /** Today's forward dates the projected path is drawn on. */
  forecastDates?: string[];
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

/** x of bar `i + offset`, in the plot area between the left pad and the axis. */
function xOf(i: number, w: number, padL: number, padR: number, span: number) {
  return padL + (i * (w - padL - padR)) / span;
}

/** y of a 0-100 value. Vertical padding is the same top and bottom. */
function yOf(v: number, h: number, pad: number) {
  return h - pad - (v * (h - pad * 2)) / 100;
}

function path(series: number[], w: number, h: number, padL: number, padR: number,
              pad: number, span: number, offset = 0) {
  return series
    .map((v, i) => `${xOf(i + offset, w, padL, padR, span).toFixed(1)},${yOf(v, h, pad).toFixed(1)}`)
    .join(' ');
}

/** Tick labels: cents under $100, one decimal to $1000, whole numbers above. */
function money(p: number) {
  return p >= 1000 ? p.toFixed(0) : p >= 100 ? p.toFixed(1) : p.toFixed(2);
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
  // An inverted repeat puts a low where a high was, so the analog is drawn
  // flipped: the shape agreement is real, the sign is not.
  const anaRaw = normalize(match.analogCloses);
  const ana = match.inverted ? anaRaw.map(v => 100 - v) : anaRaw;
  const forecast = match.forecastCloses ?? [];
  const combined = view === 'forecast' ? [...report.currentCloses, ...forecast] : [];
  const combinedNorm = combined.length ? normalize(combined) : [];
  const span = view === 'overlay'
    ? Math.max(cur.length, ana.length) - 1 || 1
    : combinedNorm.length - 1 || 1;
  const padL = pad;
  const padR = 58;                    // room for the price axis on the right
  const splitX = xOf(report.currentCloses.length - 1, w, padL, padR, span);

  // What the drawn line is worth in money. The forecast view draws one series
  // in today's prices, so its axis is exact. The overlay view rescales the two
  // windows independently — the same height is a different price on each — so
  // the axis belongs to the current line and the analog's own range goes in
  // the legend rather than pretending to share a scale.
  const priceSeries = view === 'forecast' && combined.length ? combined : report.currentCloses;
  const priceLo = Math.min(...priceSeries);
  const priceHi = Math.max(...priceSeries);
  const priceAt = (v: number) => priceLo + (v * (priceHi - priceLo)) / 100;
  const anaLo = Math.min(...match.analogCloses);
  const anaHi = Math.max(...match.analogCloses);

  // Where the projected path turns, in today's prices and on today's dates.
  // These are the analog's own highs and lows carried across, not a forecast
  // of size: the method calls timing and direction, and the magnitude comes
  // from the rescaling, so read them as levels to watch rather than targets.
  const turnAt = (pickMax: boolean) => {
    if (!forecast.length) return null;
    let best = 0;
    forecast.forEach((v, i) => {
      if (pickMax ? v > forecast[best] : v < forecast[best]) best = i;
    });
    return { i: best, price: forecast[best], date: match.forecastDates?.[best] };
  };
  const projHigh = view === 'forecast' ? turnAt(true) : null;
  const projLow = view === 'forecast' ? turnAt(false) : null;

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
          <g key={v}>
            <line x1={padL} x2={w - padR} y1={yOf(v, h, pad)} y2={yOf(v, h, pad)} className="kb-demo-grid" />
            <text className="kb-demo-axis" x={w - padR + 7} y={yOf(v, h, pad)} dominantBaseline="middle">
              {money(priceAt(v))}
            </text>
          </g>
        ))}
        {view === 'overlay' ? (
          <>
            <polyline className="kb-demo-analog" points={path(ana, w, h, padL, padR, pad, span)} />
            <polyline className="kb-demo-current" points={path(cur, w, h, padL, padR, pad, span)} />
          </>
        ) : (
          <>
            <line x1={splitX} x2={splitX} y1={pad} y2={h - pad} className="kb-demo-split" />
            <polyline className="kb-demo-analog"
                      points={path(combinedNorm.slice(report.currentCloses.length), w, h, padL, padR, pad, span,
                                   report.currentCloses.length)} />
            <polyline className="kb-demo-current"
                      points={path(combinedNorm.slice(0, report.currentCloses.length), w, h, padL, padR, pad, span)} />
            {[[projHigh, 'hi'], [projLow, 'lo']].map(([t, kind]) => {
              const turn = t as { i: number; price: number } | null;
              if (!turn) return null;
              const n = report.currentCloses.length;
              return (
                <circle key={kind as string} className={`kb-demo-turn ${kind}`} r={3.5}
                        cx={xOf(n + turn.i, w, padL, padR, span)}
                        cy={yOf(combinedNorm[n + turn.i], h, pad)} />
              );
            })}
          </>
        )}
      </svg>

      {view === 'forecast' && projHigh && projLow && (
        <p className="kb-demo-turns">
          Where this path turns, on today's scale: <strong className="hi">{money(projHigh.price)}</strong>
          {projHigh.date && <> around {projHigh.date}</>} and{' '}
          <strong className="lo">{money(projLow.price)}</strong>
          {projLow.date && <> around {projLow.date}</>}.
          <span className="muted"> Levels to watch, not targets — the analog's own swing rescaled to this
          window, and the method calls timing and direction, never size.</span>
        </p>
      )}

      <div className="kb-demo-side row">
        <p className="kb-demo-legend">
          <span className="swatch now" /> now: {report.currentStart} → {report.currentEnd}
          <span className="muted small"> · {money(Math.min(...report.currentCloses))}–{money(Math.max(...report.currentCloses))}</span>
          <br />
          <span className="swatch then" /> analog: {match.analogStart} → {match.analogEnd}
          <span className="muted small"> · {money(anaLo)}–{money(anaHi)}</span>
          {match.inverted && <span className="kb-inverted"> inverted</span>}
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
        {/* Short on purpose. The market is in the picker, the window and offset
            are in the spec beside the figure, the dates are in the legend, and
            a fallback already has its own note — restating any of that here is
            the duplication this caption used to be. */}
        {caption ?? 'The axis is this market’s own price. Overlay scales each window to its own range — ' +
                    'the way the course slides draw them — so the analog’s prices are the ones in the legend.'}
        {exact && !match.preSpecified &&
          ' Found by searching, so read the swing and worst-epoch scores first.'}
      </figcaption>
    </figure>
  );
}
