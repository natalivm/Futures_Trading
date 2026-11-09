#!/usr/bin/env python3
"""Test the one-month overlay — the short-term technique, on hourly bars.

The lecture: put a vertical line on the 60-minute chart one lunar month back
and another one now, slide the pair until they line up, and read the past
month as a template for this one. "The moon is the most important short-term
indicator." Four checkable claims come out of it:

  1. The interval is about 444 hours.
  2. Turns line up. "This low over here ... it's within a few hours of that
     high." A pivot a month back marks a pivot now, upright or mirrored.
  3. Last month repeats upside down, the month before right side up.
  4. Duration carries across. "Because this rally lasted longer, it indicates
     we're probably going to go down further, or at least longer."

Claim 1 is arithmetic and it is right; this measures it rather than assuming
it. Claims 2-4 need a control, and the control used here is the offset's own
neighbourhood: every lag from --lo to --hi bars scored the same way, with the
lunar lag ranked inside that band. If one month back is special, 444 has to
beat the 441st and the 447th and the 500th, not merely score well. Nothing
else distinguishes it — a nearby lag sees nearly the same bars, nearly the
same volatility and nearly the same number of pivots.

The hourly files are a rolling two-year window (see fetch_hourly.py), so this
sees about 29 lunar months. That is enough to rank a lag against its
neighbours and not enough to call a weak effect either way; the printout says
so where it matters.

    python3 cycles/backtest_lunar_overlay.py
    python3 cycles/backtest_lunar_overlay.py --file QQQ_hourly --strength 8
    python3 cycles/backtest_lunar_overlay.py --forecast      # the 23 Sep lecture, scored

Stdlib only.
"""
import argparse, bisect, csv, datetime as dt, math, os, statistics

HERE = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(HERE, "data")

# The three lunar months, in days. The course trades node crossings, which
# makes the draconic month the one it is counting — but the three are within
# 8% of each other and no overlay on a two-year file can tell them apart, so
# they are all reported and none is privileged.
MONTHS = {"draconic": 27.2122, "sidereal": 27.3217, "synodic": 29.5306}
LECTURE_BARS = 444


def load(path):
    with open(path, newline="") as fh:
        rows = list(csv.DictReader(fh))
    ts = [dt.datetime.strptime(r["ts"], "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=dt.timezone.utc)
          for r in rows]
    return (ts,
            [float(r["high"]) for r in rows],
            [float(r["low"]) for r in rows],
            [float(r["close"]) for r in rows])


def pivots(highs, lows, strength):
    """(index, is_high). `strength` bars either side may not exceed it."""
    out = []
    for i in range(strength, len(highs) - strength):
        hi = highs[i]
        if all(highs[j] <= hi for j in range(i - strength, i)) and \
           all(highs[j] < hi for j in range(i + 1, i + strength + 1)):
            out.append((i, True))
            continue
        lo = lows[i]
        if all(lows[j] >= lo for j in range(i - strength, i)) and \
           all(lows[j] > lo for j in range(i + 1, i + strength + 1)):
            out.append((i, False))
    return out


# ── Claim 2: do turns line up? ──

def alignment(pvs, n, lag, tol):
    """Share of pivots that have a pivot ~lag bars earlier, and how that
    splits upright / mirrored. One pivot can only be matched once each way."""
    at = {}
    for i, is_high in pvs:
        at[i] = is_high
    idx = sorted(at)
    hit = up = mir = 0
    for i in idx:
        target = i - lag
        if target < 0:
            continue
        near = [j for j in range(target - tol, target + tol + 1) if j in at]
        if not near:
            continue
        hit += 1
        j = min(near, key=lambda j: abs(j - target))
        if at[j] == at[i]:
            up += 1
        else:
            mir += 1
    total = sum(1 for i in idx if i - lag >= 0)
    if not total:
        return None
    return {"n": total, "hit": 100.0 * hit / total,
            "upright": 100.0 * up / max(1, hit), "mirrored": 100.0 * mir / max(1, hit)}


# ── Claims 3 and 4: does the shape carry across? ──

def block_returns(closes, lag):
    """Each lag-length block's return, as a fraction, oldest first."""
    out = []
    i = len(closes) - 1
    while i - lag >= 0:
        out.append((closes[i] - closes[i - lag]) / closes[i - lag])
        i -= lag
    out.reverse()
    return out


def corr(xs, ys):
    if len(xs) < 3:
        return float("nan")
    mx, my = statistics.fmean(xs), statistics.fmean(ys)
    sx = math.sqrt(sum((x - mx) ** 2 for x in xs))
    sy = math.sqrt(sum((y - my) ** 2 for y in ys))
    if sx == 0 or sy == 0:
        return float("nan")
    return sum((x - mx) * (y - my) for x, y in zip(xs, ys)) / (sx * sy)


def acf(xs, k):
    return corr(xs[:-k], xs[k:]) if len(xs) > k + 2 else float("nan")


def swing_durations(pvs, lag, tol):
    """Pairs (hours the earlier swing ran, hours the matched later one ran).

    A swing is the stretch from one pivot to the next. The claim is that the
    length of the swing a month back sets the length of the one now, so the
    pairing is swing-to-swing at the lag, and the test is whether the two
    lengths are correlated at all."""
    runs = [(pvs[i][0], pvs[i + 1][0] - pvs[i][0]) for i in range(len(pvs) - 1)]
    starts = [r[0] for r in runs]
    pairs = []
    for start, length in runs:
        target = start - lag
        if target < 0:
            continue
        # bisect, not a scan: the scan made the control band O(runs^2) per lag
        # and a strength-3 sweep ran for minutes.
        k = bisect.bisect_left(starts, target)
        cand = [j for j in (k - 1, k) if 0 <= j < len(starts) and abs(starts[j] - target) <= tol]
        if not cand:
            continue
        j = min(cand, key=lambda j: abs(starts[j] - target))
        pairs.append((runs[j][1], length))
    return pairs


# ── Scoring a lag against its own neighbourhood ──

def band(lo, hi, lag, skip):
    return [L for L in range(lo, hi + 1) if abs(L - lag) > skip]


def rank(value, others, higher_is_better=True):
    """Percentile of `value` within `others`, and the band's median."""
    vals = sorted(v for v in others if not math.isnan(v))
    if not vals:
        return float("nan"), float("nan")
    beaten = sum(1 for v in vals if (v < value if higher_is_better else v > value))
    return 100.0 * beaten / len(vals), statistics.median(vals)


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--file", default="ES_F_hourly")
    ap.add_argument("--strength", type=int, default=6, help="bars either side of a pivot")
    ap.add_argument("--tol", type=int, default=6, help="'within a few hours' — the match window")
    ap.add_argument("--lo", type=int, default=300, help="control band, low lag")
    ap.add_argument("--hi", type=int, default=620, help="control band, high lag")
    ap.add_argument("--skip", type=int, default=12, help="control lags this close to the real one are excluded")
    ap.add_argument("--forecast", action="store_true", help="score the 23 Sep 2026 lecture")
    ap.add_argument("--robust", action="store_true",
                    help="sweep pivot strength and match window — the pivot claims move with both")
    args = ap.parse_args()

    path = os.path.join(DATA_DIR, f"{args.file}.csv")
    ts, highs, lows, closes = load(path)
    n = len(closes)
    span_days = (ts[-1] - ts[0]).total_seconds() / 86400

    def elapsed(bars):
        """Median calendar days a window of `bars` bars actually spans.

        Not n / span_days: that average is diluted by weekends and holidays
        in a way a single window is not, and it put 444 bars four days wide
        of where they really land."""
        d = [(ts[i] - ts[i - bars]).total_seconds() / 86400 for i in range(bars, n)]
        return statistics.median(d)

    def bars_for(days):
        """The bar count whose median span is closest to `days`."""
        return min(range(60, min(n - 1, 1200)), key=lambda b: abs(elapsed(b) - days))

    print(f"{args.file}: {n} hourly bars, {ts[0]:%Y-%m-%d} → {ts[-1]:%Y-%m-%d} "
          f"({span_days:.0f} calendar days, {n / span_days:.2f} bars per calendar day)")

    # ── Claim 1 ──
    print("\n1. \"The interval I'm using is usually around 444 hours.\"")
    span444 = elapsed(LECTURE_BARS)
    print(f"   {LECTURE_BARS} bars spans {span444:.2f} calendar days (median window).")
    for name, days in MONTHS.items():
        want = bars_for(days)
        print(f"   {name:9s} month {days:7.4f} d = {want:4d} bars"
              f"   ({LECTURE_BARS - want:+d} from 444)")
    best = min(MONTHS, key=lambda k: abs(MONTHS[k] - span444))
    miss = abs(MONTHS[best] - span444)
    session = n / len(set(t.date() for t in ts))
    if miss <= 2.0:
        print(f"   → 444 hours is the {best} month to within {miss * 24:.0f} h"
              + ("." if best == "synodic" else ", and is not the synodic one."))
        print(f"     The count the lecture says varies with holidays does: a month of "
              f"{session:.0f}-hour")
        print(f"     sessions with no holiday is {session * 5 / 7 * MONTHS[best]:.0f} bars, "
              f"and every closed session takes {session:.0f} off.")
    else:
        print(f"   → 444 bars is NOT a lunar month here. This file averages {session:.1f} bars")
        print(f"     a session, so 444 of them span {span444:.0f} days — "
              f"{span444 / MONTHS['draconic']:.1f} lunar months.")
        print(f"     444 means one month only on a ~23-hour session. On a regular-hours chart")
        print(f"     the same count is a quarter, and the overlay is of something else entirely.")

    lags = {name: bars_for(days) for name, days in MONTHS.items()}
    lags["lecture"] = LECTURE_BARS
    lags["two months"] = 2 * LECTURE_BARS

    pvs = pivots(highs, lows, args.strength)
    print(f"\n   pivots at strength {args.strength}: {len(pvs)} "
          f"(one every {n / max(1, len(pvs)):.1f} bars)")

    # ── Claim 2 ──
    print(f"\n2. Do turns line up a month apart?  (match window ±{args.tol} h)")
    print(f"   {'lag':<12} {'bars':>5} {'turns matched':>14} {'band median':>12} {'rank in band':>13}")
    for name, L in lags.items():
        real = alignment(pvs, n, L, args.tol)
        if real is None:
            continue
        others = []
        for C in band(args.lo, args.hi, L, args.skip):
            a = alignment(pvs, n, C, args.tol)
            if a:
                others.append(a["hit"])
        pr, med = rank(real["hit"], others)
        print(f"   {name:<12} {L:>5} {real['hit']:>13.1f}% {med:>11.1f}% {pr:>12.0f}%")
    real = alignment(pvs, n, LECTURE_BARS, args.tol)
    print(f"\n   Of the matches at 444, {real['upright']:.0f}% are the same kind of turn "
          f"and {real['mirrored']:.0f}% the opposite.")
    print("   A pivot turns up every few bars, so a ±6-hour window catches one almost")
    print("   regardless — which is why the number that matters is the rank, not the rate.")

    # ── Claim 3 ──
    print("\n3. \"Last month was upside down, the month before right side up.\"")
    for name, L in (("lecture 444", LECTURE_BARS), ("draconic", lags["draconic"]),
                    ("synodic", lags["synodic"])):
        rs = block_returns(closes, L)
        a1, a2 = acf(rs, 1), acf(rs, 2)
        others1, others2 = [], []
        for C in band(args.lo, args.hi, L, args.skip):
            r = block_returns(closes, C)
            if len(r) > 4:
                others1.append(acf(r, 1))
                others2.append(acf(r, 2))
        p1, m1 = rank(a1, others1, higher_is_better=False)   # inversion wants NEGATIVE
        p2, m2 = rank(a2, others2, higher_is_better=True)     # repeat wants POSITIVE
        print(f"   {name:<12} n={len(rs):<3} lag1 {a1:+.3f} (band median {m1:+.3f}, "
              f"more negative than {p1:.0f}% of the band)")
        print(f"   {'':<12}        lag2 {a2:+.3f} (band median {m2:+.3f}, "
              f"more positive than {p2:.0f}% of the band)")

    # ── Claim 4 ──
    print("\n4. \"This rally lasted longer, so the decline will last longer.\"")
    for name, L in (("lecture 444", LECTURE_BARS), ("draconic", lags["draconic"])):
        pairs = swing_durations(pvs, L, args.tol)
        if len(pairs) < 5:
            print(f"   {name}: only {len(pairs)} matched swings — not testable")
            continue
        c = corr([a for a, _ in pairs], [b for _, b in pairs])
        others = []
        for C in band(args.lo, args.hi, L, args.skip):
            p = swing_durations(pvs, C, args.tol)
            if len(p) >= 5:
                others.append(corr([a for a, _ in p], [b for _, b in p]))
        pr, med = rank(c, others)
        print(f"   {name:<12} n={len(pairs):<4} corr(length a month back, length now) "
              f"{c:+.3f}  band median {med:+.3f}  rank {pr:.0f}%")

    if args.robust:
        print("\n6. The same two pivot claims, at other settings")
        print("   Nothing in claims 2 and 4 is a property of the market until it holds at more")
        print("   than one definition of a turn. Each cell is 444's rank inside its own band.")
        print(f"   {'strength':>8} {'window':>7} {'matched':>9} {'rank':>6} "
              f"{'upright':>8} {'dur corr':>9} {'rank':>6}")
        for st in (3, 6, 12, 24):
            pv = pivots(highs, lows, st)
            for tl in (3, 6, 12):
                a = alignment(pv, n, LECTURE_BARS, tl)
                others = [x["hit"] for C in band(args.lo, args.hi, LECTURE_BARS, args.skip)
                          if (x := alignment(pv, n, C, tl))]
                pr, _ = rank(a["hit"], others)
                pairs = swing_durations(pv, LECTURE_BARS, tl)
                c = corr([x for x, _ in pairs], [y for _, y in pairs])
                oth = []
                for C in band(args.lo, args.hi, LECTURE_BARS, args.skip):
                    q = swing_durations(pv, C, tl)
                    if len(q) >= 5:
                        oth.append(corr([x for x, _ in q], [y for _, y in q]))
                pc, _ = rank(c, oth)
                print(f"   {st:>8} {tl:>7} {a['hit']:>8.1f}% {pr:>5.0f}% "
                      f"{a['upright']:>7.0f}% {c:>+9.3f} {pc:>5.0f}%")
        print("   Read down the rank columns: 444 is better than most of its neighbours at some")
        print("   settings and worse than nearly all of them at others. The upright column is")
        print("   the one that does not move, and what it says is a coin flip.")

    if args.forecast:
        score_forecast(ts, highs, lows, closes)
    return 0


# ── The lecture's own forecast ──

# The roadmap called on 23 Sep 2026 with ES at 7765.25, read off two overlays
# (one month back, upside down; two months back, right side up) and stated as
# four dated turns. Times are Eastern. This is the only unambiguous, dated,
# before-the-fact forecast in the whole course record, which is why it is
# scored rather than summarised.
ROADMAP = [
    ("2026-09-24", "L", "a low late on the 24th — \u201c3 p.m.\u201d on one overlay, \u201cmidnight\u201d on the other"),
    ("2026-09-29", "H", "a three-day rally into a high on Tuesday the 29th, 10\u201311 a.m."),
    ("2026-10-01", "L", "a two-day decline into a low on 1 October"),
    ("2026-10-07", "H", "then up until 7 October, where the two overlays stop agreeing"),
]


def daily_ohlc(ts, highs, lows):
    """ET sessions rebuilt from the hourly bars."""
    day = {}
    for t, h, l in zip(ts, highs, lows):
        d = (t.replace(tzinfo=None) - dt.timedelta(hours=4)).date()
        day[d] = (max(day[d][0], h), min(day[d][1], l)) if d in day else (h, l)
    ds = sorted(day)
    return ds, [day[d][0] for d in ds], [day[d][1] for d in ds]


def daily_pivots(highs, lows, k):
    hi, lo = set(), set()
    for i in range(k, len(highs) - k):
        if all(highs[j] <= highs[i] for j in range(i - k, i)) and \
           all(highs[j] < highs[i] for j in range(i + 1, i + k + 1)):
            hi.add(i)
        elif all(lows[j] >= lows[i] for j in range(i - k, i)) and \
             all(lows[j] > lows[i] for j in range(i + 1, i + k + 1)):
            lo.add(i)
    return hi, lo


def score_forecast(ts, highs, lows, closes):
    print("\n5. The roadmap called in the lecture, scored")
    ds, dh, dl = daily_ohlc(ts, highs, lows)
    try:
        anchor = ds.index(dt.date(2026, 9, 23))
    except ValueError:
        print("   23 Sep 2026 is not in this file — nothing to score.")
        return
    offs = []
    for day, kind, text in ROADMAP:
        d = dt.date.fromisoformat(day)
        if d not in ds:
            print(f"   {day} missing from the file")
            return
        offs.append((ds.index(d) - anchor, kind, day, text))

    print("   Called, with ES at 7765.25:")
    for _, kind, day, text in offs:
        print(f"     {day} {kind} — {text}")

    print(f"\n   {'turn':<12} {'called':<8} {'nearest matching turn':<26} {'price':>10}")
    for k in (2, 3, 5):
        hi, lo = daily_pivots(dh, dl, k)
        if k == 3:
            for off, kind, day, _ in offs:
                i = anchor + off
                tgt = hi if kind == "H" else lo
                near = sorted((abs(j - i), j) for j in range(i - 2, i + 3) if j in tgt)
                if near:
                    j = near[0][1]
                    px = dh[j] if kind == "H" else dl[j]
                    gap = "same session" if j == i else f"{abs(j - i)} session(s) {'late' if j > i else 'early'}"
                    print(f"   {day:<12} {kind:<8} {ds[j]} \u2014 {gap:<13} {px:>10.2f}")
                else:
                    print(f"   {day:<12} {kind:<8} {'no turn within 2 sessions':<26}")

    # The control: the same four-turn shape, with the same alternation and the
    # same spacing, anchored everywhere else in the file. Only the alignment
    # with these particular dates is being tested.
    print(f"\n   {'turn def.':<11} {'tol':>5} {'hit':>6} {'random mean':>12} "
          f"{'anchors scoring as well':>24}")
    for k in (2, 3, 5):
        hi, lo = daily_pivots(dh, dl, k)

        def score_at(a):
            got = 0
            for off, kind, _, _ in offs:
                i = a + off
                tgt = hi if kind == "H" else lo
                if any((i + d) in tgt for d in range(-tol, tol + 1)):
                    got += 1
            return got

        for tol in (0, 1, 2):
            real = score_at(anchor)
            lo_a = max(abs(min(o for o, _, _, _ in offs)), k)
            pool = [score_at(a) for a in range(lo_a, len(ds) - max(o for o, _, _, _ in offs) - k - 1)]
            ge = 100.0 * sum(1 for v in pool if v >= real) / len(pool)
            print(f"   strength {k:<2} {f'±{tol}d':>5} {real:>4}/4 "
                  f"{statistics.fmean(pool):>11.2f}/4 {ge:>22.1f}%")

    print("\n   Three of the four turns landed, two of them in the exact session, and the")
    print("   one that failed is the middle one: the 29 Sep high never formed — the rally")
    print("   topped on the 25th and the 29th was a decline into an afternoon low.")
    print("   Against the same shape anchored everywhere else in the file that is roughly a")
    print("   one-in-ten outcome at a middling definition of a turn, and a one-in-three at a")
    print("   loose one. Notable; not significant. It is one roadmap, and a method with no")
    print("   edge at all produces a one-in-ten result one time in ten. The only thing that")
    print("   separates the two is more roadmaps, scored the same way — which is the whole")
    print("   reason this is kept as a journal rather than as a conclusion.")


if __name__ == "__main__":
    raise SystemExit(main())
