#!/usr/bin/env python3
"""
Find repeating cycles in an index: the stretch of history that today's market
most closely rhymes with, and what that analog did next.

This is the synthesis / pattern-recognition approach from Market Forecast
Mastery Lesson 1 — not decomposition. It slides the recent window back through
every past offset, scores the fit, and keeps the offsets that fit best. The
DJIA "60-year cycle, 1962 vs 2022, 93% correlated" slide is exactly this with
window ≈ 445 trading days and the winning lag ≈ 60 years.

Usage:
    python3 cycles/find_cycles.py --all
    python3 cycles/find_cycles.py --symbol ^DJI --window 445 --top 5
    python3 cycles/find_cycles.py --symbol ^GSPC --min-years 40 --max-years 80
    python3 cycles/find_cycles.py --symbol ^DJI --svg          # overlay charts

Two scores are reported for every match, and they disagree often:

  corr      Pearson correlation of the two closing series. This is the number
            on the slides. It is invariant to the 0-100 rescaling the charts
            use, so "93% correlated" is this. It is also easy to score high on
            by accident: any two rising stretches correlate.
  retCorr   the same correlation computed on daily log returns. Trend is gone,
            so only genuine bar-by-bar rhythm survives. Expect it to be small.
            A match with a high corr and a retCorr near zero is a shape
            coincidence, not a cycle.

pctBetter says how many of the scanned offsets scored at least as high. A 0.93
that 8% of all offsets also beat is not evidence of a 60-year cycle; a 0.93
that nothing else comes near is worth looking at.
"""

import argparse
import csv
import datetime as dt
import glob
import json
import math
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(HERE, "data")
OUT_DIR = os.path.join(HERE, "out")
WEB_DIR = os.path.join(os.path.dirname(HERE), "public", "cycles")

TRADING_DAYS_PER_YEAR = 252

# The cycle lengths the lectures demonstrate, by market. A cycle belongs to a
# market: 60 and 78.5 years are the equity clocks, 17 and 19 are crude's,
# 24.5 is gold's. 19.08 is "19 years and 1 month" — the Metonic cycle, after
# which the solar and lunar calendars realign.
PRESETS = {
    "course":   [4, 6.8, 11.65, 17, 19.08, 22, 24.5, 27, 28, 56, 60, 78.5, 157, 314],
    "equities": [4, 28, 56, 60, 78.5, 157, 314],
    # The S&P examples: 22 years (2000 against 2022, the run that also repeated
    # the Fed's first 50bp rise in 22 years), 11.65 (230 and ~400-day windows)
    # and 6.8, which the course demonstrates on four-hour bars.
    "sp500":    [4, 6.8, 11.65, 22, 28],
    "crude":    [17, 19.08, 27],
    "gold":     [24.5],
}


# ── Data ──

def load_series(path):
    """Returns (dates, closes) oldest first."""
    dates, closes = [], []
    with open(path, newline="") as fh:
        reader = csv.reader(fh)
        header = next(reader, None)
        if header and header[0].lower() != "date":
            fh.seek(0)
            reader = csv.reader(fh)
        for row in reader:
            if len(row) < 2:
                continue
            try:
                close = float(row[1])
            except ValueError:
                continue
            if close > 0:
                dates.append(row[0])
                closes.append(close)
    pairs = sorted(zip(dates, closes))
    return [p[0] for p in pairs], [p[1] for p in pairs]


# ── Scoring ──

def _moments(xs):
    n = len(xs)
    mean = sum(xs) / n
    var = sum((x - mean) ** 2 for x in xs) / n
    return mean, math.sqrt(var)


def correlation(a, b):
    """Pearson. Returns 0.0 for a flat series rather than dividing by zero."""
    n = len(a)
    if n < 2 or n != len(b):
        return 0.0
    ma, sa = _moments(a)
    mb, sb = _moments(b)
    if sa == 0 or sb == 0:
        return 0.0
    return sum((a[i] - ma) * (b[i] - mb) for i in range(n)) / (n * sa * sb)


def log_returns(xs, step=1):
    """Log returns over `step` bars, non-overlapping.

    step=1 is day-by-day, which is a stricter test than the course claims.
    step=21 is roughly month-to-month: "the general direction and the general
    swing, not day by day perfect".
    """
    return [math.log(xs[i] / xs[i - step]) for i in range(step, len(xs), step)]


def stability(closes, lag, window, epochs, spacing, swing):
    """Score the same offset at earlier anchor points.

    The course's own check: the 60-year cycle was not only fitting in 2022, it
    still fitted when the window was moved 25 years back and compared with 60
    years before THAT. A real cycle holds across epochs. An offset that only
    won because it happened to fit the last two years does not, which is the
    one test the random-walk control cannot pass.
    """
    n = len(closes)
    out = []
    for e in range(1, epochs + 1):
        end = n - e * spacing
        start = end - window
        if start - lag < 0 or start < 0:
            break
        cur = closes[start:end]
        ana = closes[start - lag:end - lag]
        out.append({
            "barsBack": e * spacing,
            "corr": round(correlation(cur, ana), 4),
            "swingCorr": round(correlation(log_returns(cur, swing), log_returns(ana, swing)), 4),
        })
    return out


def scan(closes, window, min_lag, max_lag, step=1):
    """Correlate the last `window` closes against every earlier window.

    Returns [(lag, corr)] for every offset tried, unsorted. Uses prefix sums so
    each offset costs one dot product instead of a full pass for the moments.
    """
    n = len(closes)
    cur = closes[-window:]
    mc, sc = _moments(cur)
    if sc == 0:
        return []
    cz = [v - mc for v in cur]                    # centred: sum(x*cz) == covariance * window

    s1 = [0.0] * (n + 1)
    s2 = [0.0] * (n + 1)
    for i, v in enumerate(closes):
        s1[i + 1] = s1[i] + v
        s2[i + 1] = s2[i] + v * v

    out = []
    for lag in range(min_lag, max_lag + 1, step):
        start = n - window - lag
        if start < 0:
            break
        end = start + window
        total = s1[end] - s1[start]
        mean = total / window
        var = (s2[end] - s2[start]) / window - mean * mean
        if var <= 0:
            continue
        dot = 0.0
        for k in range(window):
            dot += closes[start + k] * cz[k]
        out.append((lag, dot / (window * math.sqrt(var) * sc)))
    return out


def pick(scored, top, min_sep):
    """Best-scoring offsets, keeping only one per neighbourhood.

    Adjacent lags score almost identically — without this the top 5 is the same
    cycle five times, one trading day apart.
    """
    chosen = []
    for lag, corr in sorted(scored, key=lambda p: -p[1]):
        if all(abs(lag - other) >= min_sep for other, _ in chosen):
            chosen.append((lag, corr))
        if len(chosen) >= top:
            break
    return chosen


# ── Projection ──

def business_days_after(last_date, count):
    """Approximate future session dates — weekdays only, holidays not modelled."""
    day = dt.date.fromisoformat(last_date)
    out = []
    while len(out) < count:
        day += dt.timedelta(days=1)
        if day.weekday() < 5:
            out.append(day.isoformat())
    return out


def project(closes, lag, window, horizon):
    """Rescale the analog's own future onto today's price, the way the slides overlay them.

    The analog window is stretched to the current window's range (that is the
    0-100 rescale), then shifted so the projection starts at today's close.
    Returns (analog_window, analog_future, projected) — projected is empty when
    the analog ran out of history.
    """
    n = len(closes)
    start = n - window - lag
    analog = closes[start:start + window]
    future = closes[start + window:min(start + window + horizon, n - window)]
    if not future:
        return analog, [], []

    lo_a, hi_a = min(analog), max(analog)
    lo_c, hi_c = min(closes[-window:]), max(closes[-window:])
    scale = (hi_c - lo_c) / (hi_a - lo_a) if hi_a > lo_a else 1.0
    shift = closes[-1] - (lo_c + (analog[-1] - lo_a) * scale)
    projected = [lo_c + (v - lo_a) * scale + shift for v in future]
    return analog, future, projected


def normalize(xs):
    """0-100, the axis the course slides use."""
    lo, hi = min(xs), max(xs)
    if hi == lo:
        return [50.0] * len(xs)
    return [(x - lo) * 100.0 / (hi - lo) for x in xs]


# ── Charts ──

def svg_overlay(path, title, current, analog, cur_label, ana_label):
    """Grey analog behind blue current, both rescaled 0-100 — the slide's chart."""
    w, h, pad = 1000, 420, 48
    plot_w, plot_h = w - pad * 2, h - pad * 2
    cur_n, ana_n = normalize(current), normalize(analog)
    span = max(len(cur_n), len(ana_n)) - 1 or 1

    def pts(series):
        return " ".join(
            f"{pad + i * plot_w / span:.1f},{h - pad - v * plot_h / 100:.1f}"
            for i, v in enumerate(series))

    grid = "".join(
        f'<line x1="{pad}" y1="{h - pad - v * plot_h / 100:.1f}" x2="{w - pad}" '
        f'y2="{h - pad - v * plot_h / 100:.1f}" stroke="#e3e7ec"/>'
        f'<text x="{pad - 8}" y="{h - pad - v * plot_h / 100 + 4:.1f}" text-anchor="end" '
        f'font-size="11" fill="#6b7785">{v}</text>'
        for v in (0, 20, 40, 60, 80, 100))

    return _write(path, f'''<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">
<rect width="{w}" height="{h}" fill="#ffffff"/>
<text x="{pad}" y="26" font-size="15" font-weight="600" fill="#1a2330" font-family="Inter,Arial,sans-serif">{title}</text>
{grid}
<polyline fill="none" stroke="#b8bfc8" stroke-width="1.6" points="{pts(ana_n)}"/>
<polyline fill="none" stroke="#1431d6" stroke-width="1.6" points="{pts(cur_n)}"/>
<text x="{pad}" y="{h - 14}" font-size="12" fill="#1431d6" font-family="Inter,Arial,sans-serif">{cur_label}</text>
<text x="{w - pad}" y="{h - 14}" font-size="12" fill="#6b7785" text-anchor="end" font-family="Inter,Arial,sans-serif">{ana_label}</text>
</svg>''')


def svg_forecast(path, title, current, projected, cur_label, proj_label):
    """Today's window in blue, the analog's own future carried forward in grey."""
    w, h, pad = 1000, 420, 48
    plot_w, plot_h = w - pad * 2, h - pad * 2
    everything = current + projected
    lo, hi = min(everything), max(everything)
    rng = hi - lo or 1.0
    span = len(everything) - 1 or 1

    def pts(series, offset):
        return " ".join(
            f"{pad + (offset + i) * plot_w / span:.1f},{h - pad - (v - lo) * plot_h / rng:.1f}"
            for i, v in enumerate(series))

    split_x = pad + (len(current) - 1) * plot_w / span
    grid = "".join(
        f'<line x1="{pad}" y1="{h - pad - f * plot_h:.1f}" x2="{w - pad}" y2="{h - pad - f * plot_h:.1f}" stroke="#e3e7ec"/>'
        f'<text x="{pad - 8}" y="{h - pad - f * plot_h + 4:.1f}" text-anchor="end" font-size="11" fill="#6b7785">'
        f'{lo + f * rng:,.0f}</text>'
        for f in (0, 0.25, 0.5, 0.75, 1.0))

    return _write(path, f'''<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">
<rect width="{w}" height="{h}" fill="#ffffff"/>
<text x="{pad}" y="26" font-size="15" font-weight="600" fill="#1a2330" font-family="Inter,Arial,sans-serif">{title}</text>
{grid}
<line x1="{split_x:.1f}" y1="{pad}" x2="{split_x:.1f}" y2="{h - pad}" stroke="#1a2330" stroke-dasharray="4 3"/>
<text x="{split_x + 5:.1f}" y="{pad + 12}" font-size="11" fill="#1a2330">today</text>
<polyline fill="none" stroke="#b8bfc8" stroke-width="1.6" points="{pts(projected, len(current) - 1)}"/>
<polyline fill="none" stroke="#1431d6" stroke-width="1.6" points="{pts(current, 0)}"/>
<text x="{pad}" y="{h - 14}" font-size="12" fill="#1431d6" font-family="Inter,Arial,sans-serif">{cur_label}</text>
<text x="{w - pad}" y="{h - 14}" font-size="12" fill="#6b7785" text-anchor="end" font-family="Inter,Arial,sans-serif">{proj_label}</text>
</svg>''')


def _write(path, text):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as fh:
        fh.write(text)
    return path


# ── Driver ──

def analyse(symbol, dates, closes, args):
    n = len(closes)
    window, horizon = args.window, args.horizon
    min_lag = max(window + horizon, int(args.min_years * TRADING_DAYS_PER_YEAR))
    max_lag = min(int(args.max_years * TRADING_DAYS_PER_YEAR), n - window - 1)
    if n < window + min_lag + 1:
        print(f"  not enough history: {n} rows, need {window + min_lag + 1} "
              f"for a {args.min_years}-year lag on a {window}-day window")
        return None

    if args.lags:
        # Pre-specified cycles are a far stronger test than the best of a
        # 10,000-offset search: named hypotheses, no multiple-comparison problem.
        scored, matches = [], []
        for years in args.lags:
            lag = int(round(years * TRADING_DAYS_PER_YEAR))
            if lag + window > n:
                print(f"  {years:g}y: not enough history "
                      f"({(n - window) / TRADING_DAYS_PER_YEAR:.1f}y available)")
                continue
            one = scan(closes, window, lag, lag, 1)
            if one:
                scored.extend(one)
                matches.append(one[0])
    else:
        scored = scan(closes, window, min_lag, max_lag, args.step)
        matches = pick(scored, args.top, args.min_sep or window // 2)
    if not scored or not matches:
        print("  no offsets scored")
        return None

    cur_dates = dates[-window:]
    cur_closes = closes[-window:]
    cur_returns = log_returns(cur_closes)
    cur_swing = log_returns(cur_closes, args.swing)
    out_matches = []

    for lag, corr in matches:
        start = n - window - lag
        analog, future, projected = project(closes, lag, window, horizon)
        ret_corr = correlation(log_returns(analog), cur_returns)
        swing_corr = correlation(log_returns(analog, args.swing), cur_swing)
        epochs = stability(closes, lag, window, args.epochs,
                           int(args.epoch_years * TRADING_DAYS_PER_YEAR), args.swing)
        held = [e["corr"] for e in epochs]
        # Meaningless when only one offset was tested — that is the point of --lag-years.
        better = None if args.lags else sum(1 for _, c in scored if c >= corr) / len(scored)
        years = lag / TRADING_DAYS_PER_YEAR
        out_matches.append({
            "lagTradingDays": lag,
            "lagYears": round(years, 2),
            "corr": round(corr, 4),
            "retCorr": round(ret_corr, 4),
            "swingCorr": round(swing_corr, 4),
            "pctBetter": round(better * 100, 2) if better is not None else None,
            "preSpecified": bool(args.lags),
            "stability": epochs,
            "heldMeanCorr": round(sum(held) / len(held), 4) if held else None,
            "heldMinCorr": round(min(held), 4) if held else None,
            "analogStart": dates[start],
            "analogEnd": dates[start + window - 1],
            "analogCloses": [round(v, 2) for v in analog],
            "forecastBars": len(projected),
            "forecastDates": business_days_after(dates[-1], len(projected)),
            "forecastCloses": [round(v, 2) for v in projected],
            "forecastChangePct": round((projected[-1] / closes[-1] - 1) * 100, 2) if projected else None,
        })
        held_txt = (f"held {sum(held) / len(held):+.2f} (worst {min(held):+.2f}) over {len(held)} earlier epochs"
                    if held else "no earlier epoch testable")
        rank_txt = "pre-specified" if better is None else f"top {better * 100:5.2f}%"
        print(f"  {years:6.1f}y back  corr {corr:+.3f}  swing {swing_corr:+.3f}  daily {ret_corr:+.3f}  "
              f"{rank_txt}  |  {held_txt}")
        print(f"            analog {dates[start]} → {dates[start + window - 1]}"
              + (f"   forecast {out_matches[-1]['forecastChangePct']:+.1f}% over {len(projected)} bars" if projected else ""))

    return {
        "symbol": symbol,
        "generated": dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "bars": n,
        "historyStart": dates[0],
        "historyEnd": dates[-1],
        "window": window,
        "horizon": horizon,
        "offsetsScanned": len(scored),
        "swingBars": args.swing,
        "scanYears": args.lags if args.lags else [args.min_years, round(max_lag / TRADING_DAYS_PER_YEAR, 1)],
        "mode": "named" if args.lags else "search",
        "currentStart": cur_dates[0],
        "currentEnd": cur_dates[-1],
        "currentCloses": [round(v, 2) for v in cur_closes],
        "matches": out_matches,
    }


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--symbol", help="file slug or symbol, e.g. ^DJI or DJI")
    ap.add_argument("--all", action="store_true", help="every series in cycles/data")
    ap.add_argument("--window", type=int, default=440, help="trading days compared (default 440 ≈ 22 months, the span on the DJIA slide)")
    ap.add_argument("--lag-years", help="test named cycle length(s) instead of searching, e.g. 60 or 60,78.5,28")
    ap.add_argument("--preset", choices=sorted(PRESETS),
                    help="a named cycle set from the lectures: course (all), equities, crude, gold")
    ap.add_argument("--swing", type=int, default=21, help="bars per swing-return block (default 21 ≈ monthly)")
    ap.add_argument("--epochs", type=int, default=5, help="earlier anchor points used to check the cycle held")
    ap.add_argument("--epoch-years", type=float, default=5, help="years between those anchor points")
    ap.add_argument("--horizon", type=int, default=230, help="trading days to project forward (default 230 ≈ 11 months)")
    ap.add_argument("--min-years", type=float, default=3, help="shortest cycle to consider")
    ap.add_argument("--max-years", type=float, default=100, help="longest cycle to consider")
    ap.add_argument("--step", type=int, default=1, help="offset step in trading days")
    ap.add_argument("--top", type=int, default=5, help="matches to keep")
    ap.add_argument("--min-sep", type=int, default=0, help="minimum gap between kept offsets (default: window/2)")
    ap.add_argument("--svg", action="store_true", help="also write overlay + forecast charts to cycles/out")
    ap.add_argument("--svg-top", type=int, default=1, help="how many matches to chart")
    ap.add_argument("--as-of", help="pretend today is this date (YYYY-MM-DD) — checks a published claim on its own terms")
    ap.add_argument("--json-dir", default=WEB_DIR, help="where the JSON goes (default public/cycles)")
    args = ap.parse_args()

    if args.preset and not args.lag_years:
        args.lag_years = ",".join(str(x) for x in PRESETS[args.preset])
    args.lags = [float(x) for x in args.lag_years.split(",")] if args.lag_years else []

    if args.all:
        paths = sorted(glob.glob(os.path.join(DATA_DIR, "*.csv")))
    elif args.symbol:
        name = args.symbol.lstrip("^").replace("=", "_")
        paths = [os.path.join(DATA_DIR, f"{name}.csv")]
    else:
        ap.error("pass --symbol or --all")

    missing = [p for p in paths if not os.path.exists(p)]
    if missing:
        print("No price data for: " + ", ".join(os.path.basename(p) for p in missing))
        print("Run `python3 cycles/update_prices.py` first.")
        return 1
    if not paths:
        print(f"No CSV files in {DATA_DIR}. Run `python3 cycles/update_prices.py` first.")
        return 1

    for path in paths:
        slug = os.path.splitext(os.path.basename(path))[0]
        dates, closes = load_series(path)
        if args.as_of:
            # A claim made in April 2022 is about the window ending in April
            # 2022. Scoring it against today tests something else entirely.
            keep = sum(1 for d in dates if d <= args.as_of)
            dates, closes = dates[:keep], closes[:keep]
        print(f"\n{slug}: {len(closes)} bars, {dates[0] if dates else '?'} → {dates[-1] if dates else '?'}"
              + (f"  (as of {args.as_of})" if args.as_of else ""))
        if len(closes) < 50:
            print("  too little data")
            continue
        report = analyse(slug, dates, closes, args)
        if not report:
            continue

        out = os.path.join(args.json_dir, f"{slug}.json")
        os.makedirs(args.json_dir, exist_ok=True)
        with open(out, "w") as fh:
            json.dump(report, fh, separators=(",", ":"))
        print(f"  wrote {os.path.relpath(out, os.path.dirname(HERE))}")

        if args.svg:
            for i, m in enumerate(report["matches"][:args.svg_top]):
                tag = f"{slug}_{m['lagYears']:.0f}y"
                svg_overlay(
                    os.path.join(OUT_DIR, f"{tag}_overlay.svg"),
                    f"{slug} — {m['lagYears']:.1f}-year cycle, corr {m['corr']:.2f} (returns {m['retCorr']:+.2f})",
                    report["currentCloses"], m["analogCloses"],
                    f"now: {report['currentStart']} → {report['currentEnd']}",
                    f"analog: {m['analogStart']} → {m['analogEnd']}")
                if m["forecastCloses"]:
                    svg_forecast(
                        os.path.join(OUT_DIR, f"{tag}_forecast.svg"),
                        f"{slug} — what the {m['lagYears']:.1f}-year analog did next ({m['forecastBars']} bars)",
                        report["currentCloses"], m["forecastCloses"],
                        f"now: {report['currentStart']} → {report['currentEnd']}",
                        f"projected from {m['analogEnd']} onward")
                print(f"  charts: cycles/out/{tag}_overlay.svg" + (f", {tag}_forecast.svg" if m["forecastCloses"] else ""))
                i += 0
    return 0


if __name__ == "__main__":
    sys.exit(main())
