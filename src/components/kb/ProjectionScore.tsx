import { useEffect, useState } from 'react';

interface Scored {
  made: string;
  lag: number;
  bars: number;
  through: string;
  anchorClose: number;
  dates: string[];
  projected: number[];
  actualCloses: number[];
  projPct: number;
  realPct: number;
  dirRight: boolean;
  dailyCorr: number | null;
  pathCorr: number | null;
}

interface Payload {
  symbol: string;
  actualThrough: string;
  forecastDates: string[];
  projections: Scored[];
}

/**
 * What the overlay projected, against what arrived.
 *
 * The weekly workflow rewrites the scan in place, so the projected path on
 * every other figure is always drawn from today and can never be wrong yet.
 * cycles/score_projections.py reads the earlier versions back out of git and
 * scores them; this draws the result.
 *
 * Deliberately plain: two lines from a common anchor, the projection dashed
 * and the market solid, with the cycle picked by the reader. A projection
 * that has not elapsed yet is not drawn at all — there is nothing to say
 * about it, and drawing it would be the illustration problem again.
 */
export default function ProjectionScore({ series = 'GSPC', caption }:
  { series?: string; caption?: string }) {
  const [data, setData] = useState<Payload | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'missing'>('loading');
  const [made, setMade] = useState<string>('');

  useEffect(() => {
    let live = true;
    setState('loading');
    fetch(`${import.meta.env.BASE_URL}cycles/${series}_named_scored.json`)
      .then(r => (r.ok ? r.json() : Promise.reject(new Error('no file'))))
      .then((d: Payload) => {
        if (!live || !d?.projections?.length) return setState('missing');
        setData(d);
        setMade(d.forecastDates[d.forecastDates.length - 1]);
        setState('ready');
      })
      .catch(() => live && setState('missing'));
    return () => { live = false; };
  }, [series]);

  if (state !== 'ready' || !data) {
    return (
      <figure className="kb-figure">
        <div className="kb-figure-head">
          <span className="kb-figure-kind">Projection scorecard</span>
          <strong>Projected against actual</strong>
        </div>
        <div className="kb-figure-fallback">
          {state === 'loading'
            ? <p className="muted">Loading the scorecard…</p>
            : <p className="muted small">
                No scored projections yet. They appear once
                <code> python3 cycles/score_projections.py --archive </code>
                has run against a scan old enough to have elapsed.
              </p>}
        </div>
        {caption && <figcaption>{caption}</figcaption>}
      </figure>
    );
  }

  const rows = data.projections.filter(p => p.made === made).sort((a, b) => a.lag - b.lag);
  const w = 760, h = 230, pad = 24, padR = 56;
  // Both lines share the anchor close, so they share a scale: this chart is
  // about the gap between them, which a per-series rescale would hide.
  const all = rows.flatMap(r => [...r.projected, ...r.actualCloses, r.anchorClose]);
  const lo = Math.min(...all), hi = Math.max(...all);
  const n = Math.max(...rows.map(r => r.dates.length));
  const x = (i: number) => pad + (i * (w - pad - padR)) / Math.max(1, n);
  const y = (v: number) => h - pad - ((v - lo) * (h - pad * 2)) / (hi - lo || 1);
  const pts = (xs: number[]) =>
    [`${x(0).toFixed(1)},${y(rows[0].anchorClose).toFixed(1)}`]
      .concat(xs.map((v, i) => `${x(i + 1).toFixed(1)},${y(v).toFixed(1)}`)).join(' ');
  const actual = rows[0];

  return (
    <figure className="kb-figure">
      <div className="kb-figure-head">
        <span className="kb-figure-kind">Projection scorecard</span>
        <strong>Projected on {made}, against what arrived</strong>
        <label className="kb-figure-pick">
          <span className="visually-hidden">Forecast date</span>
          <select value={made} onChange={e => setMade(e.target.value)}>
            {data.forecastDates.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </label>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} role="img"
           aria-label={`Cycle projections made on ${made} against actual prices through ${actual.through}`}>
        <line x1={pad} y1={y(actual.anchorClose)} x2={w - padR} y2={y(actual.anchorClose)}
              stroke="currentColor" strokeOpacity="0.18" strokeDasharray="2 3" />
        {rows.map(r => (
          <polyline key={r.lag} points={pts(r.projected)} fill="none"
                    stroke="currentColor" strokeOpacity="0.32" strokeWidth="1.2"
                    strokeDasharray="4 3" />
        ))}
        <polyline points={pts(actual.actualCloses)} fill="none"
                  stroke="var(--accent, #4ea1ff)" strokeWidth="2.4" />
        <text x={w - padR + 6} y={y(hi) + 4} fontSize="10" fill="currentColor" opacity="0.6">
          {hi.toFixed(0)}
        </text>
        <text x={w - padR + 6} y={y(lo) + 4} fontSize="10" fill="currentColor" opacity="0.6">
          {lo.toFixed(0)}
        </text>
      </svg>
      <div className="kb-figure-legend">
        <span>— actual, to {actual.through}</span>
        <span className="muted">- - - each named cycle’s projection from {made}</span>
      </div>
      {/* The same wrapper every other table on the page uses: without it this
          one set a 401px floor and forced the whole document to scroll
          sideways on a phone. */}
      <div className="kb-table-wrap">
        <table className="kb-table">
          <thead>
            <tr><th>Cycle</th><th>Projected</th><th>Actual</th><th>Direction</th><th>Daily r</th></tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.lag}>
                <th scope="row">{r.lag.toFixed(2)} yr</th>
                <td>{r.projPct >= 0 ? '+' : ''}{r.projPct.toFixed(1)}%</td>
                <td>{r.realPct >= 0 ? '+' : ''}{r.realPct.toFixed(1)}%</td>
                <td>{r.dirRight ? 'right' : 'wrong'}</td>
                <td>{r.dailyCorr === null ? '—'
                     : `${r.dailyCorr >= 0 ? '+' : ''}${r.dailyCorr.toFixed(2)}`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
