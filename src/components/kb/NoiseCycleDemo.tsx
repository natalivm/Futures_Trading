import { useMemo, useState } from 'react';

/**
 * Find a cycle in pure noise.
 *
 * This runs the same scan `cycles/find_cycles.py` runs, in the browser, over a
 * random walk generated on the spot. There is no cycle in the data — it is
 * `Math.random` compounded — and the scan reliably finds one anyway, at a
 * price correlation in the nineties.
 *
 * It is the one lesson in the knowledge base that has to be felt rather than
 * read, which is why it is a toy you press rather than a paragraph.
 */

// The same shape as the control run in cycles/README.md: about 95 years of
// daily bars and the 440-day window the course slides use. Smaller settings
// make a friendlier toy and a dishonest one — with fewer offsets to search
// the price correlation lands lower than the real experiment, and with a
// shorter window the swing correlation is computed from so few observations
// that it swings wildly. One scan is ~25 ms, so there is no reason to cheat.
const BARS = 24000;
const WINDOW = 440;
const SWING = 21;

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Box–Muller, so the walk's steps are normal rather than uniform. */
function gauss(rand: () => number) {
  let u = 0;
  while (u === 0) u = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand());
}

function randomWalk(seed: number) {
  const rand = mulberry32(seed);
  const out = [100];
  for (let i = 1; i < BARS; i++) {
    out.push(Math.max(1, out[i - 1] * Math.exp(0.0002 + 0.011 * gauss(rand))));
  }
  return out;
}

function correlation(a: number[], b: number[]) {
  const n = a.length;
  if (n < 2 || n !== b.length) return 0;
  let ma = 0;
  let mb = 0;
  for (let i = 0; i < n; i++) { ma += a[i]; mb += b[i]; }
  ma /= n; mb /= n;
  let num = 0;
  let va = 0;
  let vb = 0;
  for (let i = 0; i < n; i++) {
    const da = a[i] - ma;
    const db = b[i] - mb;
    num += da * db; va += da * da; vb += db * db;
  }
  return va && vb ? num / Math.sqrt(va * vb) : 0;
}

/** Log returns over `step` bars, non-overlapping — the swing measure. */
function returns(xs: number[], step: number) {
  const out: number[] = [];
  for (let i = step; i < xs.length; i += step) out.push(Math.log(xs[i] / xs[i - step]));
  return out;
}

function normalize(xs: number[]) {
  const lo = Math.min(...xs);
  const hi = Math.max(...xs);
  return hi === lo ? xs.map(() => 50) : xs.map(x => ((x - lo) * 100) / (hi - lo));
}

function scan(closes: number[]) {
  const n = closes.length;
  const current = closes.slice(n - WINDOW);
  let bestLag = WINDOW;
  let bestCorr = -2;
  for (let lag = WINDOW; lag <= n - WINDOW - 1; lag++) {
    const start = n - WINDOW - lag;
    const c = correlation(current, closes.slice(start, start + WINDOW));
    if (c > bestCorr) { bestCorr = c; bestLag = lag; }
  }
  const analog = closes.slice(n - WINDOW - bestLag, n - bestLag);
  return {
    lag: bestLag,
    corr: bestCorr,
    swing: correlation(returns(current, SWING), returns(analog, SWING)),
    daily: correlation(returns(current, 1), returns(analog, 1)),
    current,
    analog,
  };
}

function path(series: number[], w: number, h: number, pad: number) {
  const span = series.length - 1 || 1;
  return series
    .map((v, i) => `${(pad + (i * (w - pad * 2)) / span).toFixed(1)},${(h - pad - (v * (h - pad * 2)) / 100).toFixed(1)}`)
    .join(' ');
}

export default function NoiseCycleDemo({ caption }: { caption?: string }) {
  const [seed, setSeed] = useState(1);
  const result = useMemo(() => scan(randomWalk(seed)), [seed]);

  const w = 760;
  const h = 260;
  const pad = 26;
  const cur = normalize(result.current);
  const ana = normalize(result.analog);
  const years = (result.lag / 252).toFixed(1);

  return (
    <figure className="kb-figure kb-demo">
      <div className="kb-figure-head">
        <span className="kb-figure-kind">Try it</span>
        <strong>Find a cycle in pure noise</strong>
        <button className="ghost kb-demo-roll" onClick={() => setSeed(s => s + 1)}>
          Generate another random market ↻
        </button>
      </div>

      <div className="kb-demo-body">
        <svg viewBox={`0 0 ${w} ${h}`} className="kb-demo-chart" role="img"
             aria-label={`A random walk's last ${WINDOW} days against the best-matching earlier stretch, correlation ${result.corr.toFixed(2)}`}>
          {[0, 25, 50, 75, 100].map(v => (
            <line key={v} x1={pad} x2={w - pad}
                  y1={h - pad - (v * (h - pad * 2)) / 100} y2={h - pad - (v * (h - pad * 2)) / 100}
                  className="kb-demo-grid" />
          ))}
          <polyline className="kb-demo-analog" points={path(ana, w, h, pad)} />
          <polyline className="kb-demo-current" points={path(cur, w, h, pad)} />
        </svg>

        <div className="kb-demo-side">
          <p className="kb-demo-legend">
            <span className="swatch now" /> the last {WINDOW} days
            <br />
            <span className="swatch then" /> the best match, {years} years earlier
          </p>
          <dl className="kb-demo-scores">
            <div className={result.corr >= 0.8 ? 'bad' : ''}>
              <dt>Price correlation</dt>
              <dd>{result.corr.toFixed(3)}</dd>
            </div>
            <div className="mid">
              <dt>Swing correlation</dt>
              <dd>{result.swing.toFixed(3)}</dd>
            </div>
            <div className={Math.abs(result.daily) < 0.2 ? 'good' : ''}>
              <dt>Daily correlation</dt>
              <dd>{result.daily.toFixed(3)}</dd>
            </div>
          </dl>
          <p className="muted small">
            These prices are <strong>random numbers</strong> — compounded coin flips, generated in your
            browser just now. No cycle was put in and none exists.
          </p>
        </div>
      </div>

      <figcaption>
        {caption ?? `The scan still finds a "${years}-year cycle", and the two paths still look alike, because a price correlation mostly measures whether both stretches drifted the same way. Press the button a few times and watch which numbers are stable: the price correlation lands near 0.9 almost every run, the daily correlation near zero almost every run, and the swing correlation wanders anywhere between — it is computed from only twenty observations, which is exactly why the real scanner also re-scores an offset at earlier epochs instead of trusting one window.`}
      </figcaption>
    </figure>
  );
}
