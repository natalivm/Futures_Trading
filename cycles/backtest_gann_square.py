#!/usr/bin/env python3
"""Test the Gann calendar square — do market turns land on its divisions?

The AstroTimeCycles updates work from two of these. A span of N calendar days
is drawn from an anchor date, divided into eight "minor squares", and each of
those into quarters, giving a grid of candidate reversal dates:

  * a 64-day square of eight 8-day minor squares (anchor chosen by the author);
  * an 88-day square of eight 11-day minor squares, anchored on the equinox,
    where 88 = 8 x 11 = 4 x 22 and 22 is "the Master Time Factor".

"I generally assign the greatest weight to the quarter divisions as potential
reversal points. Prices also show reactions near the halfway subdivisions."

That is a testable claim and an unusually clean one, because the grid is pure
calendar arithmetic — no judgement, no curve fitting, nothing to slide. Given
an anchor, every division date for the next hundred years is already
determined. The equinox square is cleaner still: its anchor is astronomical,
so there is nothing discretionary in it at all.

The control is a phase shift. The same grid, the same number of dates, the
same spacing — anchored a random number of days away from the equinox. That
keeps everything the square is except its alignment with the sky, which is
the only thing being claimed. If turns cluster on the divisions because the
divisions are 11 days apart and turns happen every few days, the shifted grid
finds exactly as many.

    python3 cycles/backtest_gann_square.py
    python3 cycles/backtest_gann_square.py --span 64 --minor 8
    python3 cycles/backtest_gann_square.py --symbol ES_F --strength 5

Stdlib only.
"""
import argparse, bisect, csv, datetime as dt, os, random, statistics, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import moon

DATA_DIR = os.path.join(HERE, "data")


def load(slug):
    with open(os.path.join(DATA_DIR, f"{slug}.csv"), newline="") as fh:
        rows = list(csv.DictReader(fh))
    return [dt.date.fromisoformat(r["date"]) for r in rows], [float(r["close"]) for r in rows]


def pivots(closes, k):
    """Indices of swing turns on closes, `k` bars clear either side."""
    out = set()
    for i in range(k, len(closes) - k):
        w = closes[i - k:i + k + 1]
        if closes[i] == max(w) or closes[i] == min(w):
            out.add(i)
    return out


def cardinals(start_year, end_year):
    """Equinoxes and solstices: the sun's longitude at 0, 90, 180, 270."""
    out = []
    for target in (0.0, 90.0, 180.0, 270.0):
        def f(j, t=target):
            return ((moon.sun_longitude(j) - t + 180.0) % 360.0) - 180.0
        a = moon.jd_from_ymd(start_year, 1, 1)
        b = moon.jd_from_ymd(end_year, 12, 31)
        for j in moon._roots(f, a, b, 2.0):
            out.append((dt.date.fromisoformat(moon.date_str(j)), target))
    out.sort()
    return out


def divisions(anchor, span, minor):
    """The square's grid, as (date, weight) — 'quarter' or 'other'.

    Quarters are the 1/4, 1/2 and 3/4 points of the whole square: the ones the
    text says carry the greatest weight. The rest are the minor-square
    boundaries and their halfway subdivisions."""
    n_minor = span // minor
    quarters = {span // 4, span // 2, 3 * span // 4}
    offs = set(quarters)
    for k in range(n_minor + 1):
        offs.add(k * minor)                                   # minor boundaries
        if k < n_minor:
            # The halfway subdivision. For an odd minor square it falls on a
            # half day — the text says so itself, putting the 5.5-day point of
            # an 11-day square "around November 10-11" — so both sides count.
            h = k * minor + minor / 2
            offs.add(int(h))
            if h != int(h):
                offs.add(int(h) + 1)
    return [(anchor + dt.timedelta(days=d), "quarter" if d in quarters else "other")
            for d in sorted(offs)]


def hit_rate(dates, closes, pvs, grid, tol):
    """Share of grid dates within `tol` trading days of a pivot.

    A grid date on a weekend or holiday maps to the next session, which is
    what a chart does with it."""
    n = len(dates)
    hits = total = 0
    for day, _ in grid:
        i = bisect.bisect_left(dates, day)
        if i >= n or i < tol:
            continue
        total += 1
        if any((i + d) in pvs for d in range(-tol, tol + 1)):
            hits += 1
    return hits, total


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--symbol", default="GSPC")
    ap.add_argument("--span", type=int, default=88, help="calendar days in the full square")
    ap.add_argument("--minor", type=int, default=11, help="calendar days in a minor square")
    ap.add_argument("--strength", type=int, default=5, help="bars either side of a pivot")
    ap.add_argument("--tol", type=int, default=1, help="trading days a division may miss by")
    ap.add_argument("--trials", type=int, default=400, help="phase-shifted controls")
    ap.add_argument("--from-year", type=int, default=1928)
    args = ap.parse_args()

    dates, closes = load(args.symbol)
    lo = bisect.bisect_left(dates, dt.date(args.from_year, 1, 1))
    dates, closes = dates[lo:], closes[lo:]
    pvs = pivots(closes, args.strength)
    print(f"{args.symbol}: {len(dates)} sessions, {dates[0]} → {dates[-1]}")
    print(f"pivots at strength {args.strength}: {len(pvs)} "
          f"(one every {len(dates) / max(1, len(pvs)):.1f} sessions)")
    print(f"square: {args.span} calendar days, {args.span // args.minor} minor squares "
          f"of {args.minor} days, anchored on each equinox and solstice")

    anchors = [d for d, _ in cardinals(args.from_year - 1, dates[-1].year)]
    print(f"anchors: {len(anchors)} cardinal dates")
    print(f"a division counts as a hit within ±{args.tol} trading day(s) of a turn\n")

    def score(shift):
        h = t = 0
        hq = tq = 0
        for a in anchors:
            grid = divisions(a + dt.timedelta(days=shift), args.span, args.minor)
            x, y = hit_rate(dates, closes, pvs, grid, args.tol)
            h, t = h + x, t + y
            gq = [g for g in grid if g[1] == "quarter"]
            x, y = hit_rate(dates, closes, pvs, gq, args.tol)
            hq, tq = hq + x, tq + y
        return (100.0 * h / t if t else float("nan"), t,
                100.0 * hq / tq if tq else float("nan"), tq)

    real_all, n_all, real_q, n_q = score(0)
    rnd = random.Random(23)
    ctl_all, ctl_q = [], []
    for _ in range(args.trials):
        s = rnd.randint(1, args.span - 1)
        a, _, q, _ = score(s)
        ctl_all.append(a)
        ctl_q.append(q)
    ctl_all.sort(); ctl_q.sort()

    # The blunter baseline: dates drawn out of a hat, same count, same
    # tolerance. If the grid scores this too, the grid is doing no work.
    span_i = range(args.tol, len(dates) - args.tol)
    hat = []
    for _ in range(args.trials):
        picks = rnd.sample(list(span_i), min(n_all, len(span_i)))
        hat.append(100.0 * sum(1 for i in picks
                               if any((i + d) in pvs for d in range(-args.tol, args.tol + 1)))
                   / len(picks))
    hat.sort()

    def report(label, real, n, ctl):
        pr = 100.0 * sum(1 for v in ctl if v < real) / len(ctl)
        print(f"   {label:<22} {real:5.1f}%  n={n:<6} "
              f"shifted grids {statistics.fmean(ctl):5.1f}% "
              f"[{ctl[0]:.1f}–{ctl[-1]:.1f}]  rank {pr:3.0f}%")

    print("   division                 hit    sample   control")
    report("every division", real_all, n_all, ctl_all)
    report("quarter divisions", real_q, n_q, ctl_q)
    print(f"   {'random dates':<22} {statistics.fmean(hat):5.1f}%  "
          f"{'':<8} [{hat[0]:.1f}–{hat[-1]:.1f}]  \u2014 same count, drawn out of a hat")
    print(f"\n   {args.trials} controls, each the same grid anchored 1–{args.span - 1} days "
          f"off the cardinal date.")
    print("   A rank near 50% means the equinox anchor contributes nothing: the grid finds")
    print("   turns at that rate wherever it is nailed down, because the spacing alone")
    print("   guarantees it.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
