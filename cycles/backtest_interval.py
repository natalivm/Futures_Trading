#!/usr/bin/env python3
"""Test a claimed cycle interval on a weekly series, out of sample.

The course states intervals as a number of weeks between same-type pivots —
"216 weeks, high to high to high to high". That is a checkable claim, and this
checks it three ways:

  1. Does it recur?  Count pivot pairs sitting the interval apart, upright
     (high-to-high, low-to-low) and mirrored (high-to-low).
  2. Is that more than chance?  The same count on random walks of the same
     length and volatility, with pivots found the same way. A cycle that
     random data reaches as often is not a finding.
  3. What followed each hit?  The course's claim about the 216-week bond cycle
     is not only that the highs recur but that the decline after each one is
     bigger than the last. Measured, not asserted.

And, given --as-of, what the series actually did after the lecture.

Stdlib only.
"""
import argparse, csv, math, os, random, statistics, sys

HERE = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(HERE, "data")


def load(path):
    with open(path) as fh:
        rows = [r for r in csv.DictReader(fh)]
    return ([r["date"] for r in rows],
            [float(r["open"]) for r in rows],
            [float(r["high"]) for r in rows],
            [float(r["low"]) for r in rows],
            [float(r["close"]) for r in rows])


def pivots(highs, lows, strength):
    """(index, is_high, price), chronological. A pivot needs `strength` bars
    on each side that do not exceed it — the same rule ta.pivothigh applies."""
    out = []
    n = len(highs)
    for i in range(strength, n - strength):
        hi = highs[i]
        if all(highs[j] <= hi for j in range(i - strength, i)) and \
           all(highs[j] < hi for j in range(i + 1, i + strength + 1)):
            out.append((i, True, hi))
            continue
        lo = lows[i]
        if all(lows[j] >= lo for j in range(i - strength, i)) and \
           all(lows[j] > lo for j in range(i + 1, i + strength + 1)):
            out.append((i, False, lo))
    return out


def hits(pvs, interval, tol):
    """Pivot pairs `interval` apart, split by whether the two match in type.

    Each pair is counted once. A long chain of n pivots on the same grid
    yields n-1 adjacent pairs plus the wider ones, so the pair count is a
    blunter measure than the chain length — `grid` below reports the chain."""
    up, mirror = [], []
    for a in range(len(pvs)):
        for b in range(a + 1, len(pvs)):
            gap = pvs[b][0] - pvs[a][0]
            if gap > interval + tol:
                break
            if abs(gap - interval) <= tol:
                (up if pvs[a][1] == pvs[b][1] else mirror).append((pvs[a], pvs[b]))
    return up, mirror


def grid(pvs, interval, tol, want_high=None):
    """The longest run of pivots each ~interval after the previous one —
    what "high to high to high to high" actually claims."""
    best = []
    for s in range(len(pvs)):
        if want_high is not None and pvs[s][1] != want_high:
            continue
        chain = [pvs[s]]
        while True:
            target = chain[-1][0] + interval
            cand = [p for p in pvs if abs(p[0] - target) <= tol
                    and (want_high is None or p[1] == want_high)]
            if not cand:
                break
            chain.append(min(cand, key=lambda p: abs(p[0] - target)))
        if len(chain) > len(best):
            best = chain
    return best


def random_walk(n, sigma, seed):
    rnd = random.Random(seed)
    c = [100.0]
    for _ in range(n - 1):
        c.append(c[-1] * math.exp(rnd.gauss(0, sigma)))
    # A weekly bar's high/low, so pivots are found on comparable shapes.
    hi = [v * (1 + abs(rnd.gauss(0, sigma)) * 0.6) for v in c]
    lo = [v * (1 - abs(rnd.gauss(0, sigma)) * 0.6) for v in c]
    return hi, lo


def control(n, sigma, strength, interval, tol, want_high, trials, seed=7):
    """How long a grid random walks reach. Also returns their pivot counts: a
    control that produces more pivots than the real series has an easier job,
    and comparing against it would understate the real finding."""
    lens, counts = [], []
    for t in range(trials):
        hi, lo = random_walk(n, sigma, seed + t)
        pv = pivots(hi, lo, strength)
        counts.append(len(pv))
        lens.append(len(grid(pv, interval, tol, want_high)))
    lens.sort()
    return lens, counts


def shuffle_control(pvs, interval, tol, want_high, trials, seed=11):
    """The tighter null: keep the real pivots — their number, their types and
    the distribution of gaps between them — and shuffle only the ORDER of
    those gaps. Everything the series is except the alignment survives, so a
    grid that still stands out is standing out for its alignment alone.

    A random walk is a weaker control here because it need not reproduce the
    pivot count, and pivot count alone moves the grid length a long way."""
    sel = [p for p in pvs if want_high is None or p[1] == want_high]
    if len(sel) < 3:
        return []
    gaps = [sel[i][0] - sel[i - 1][0] for i in range(1, len(sel))]
    rnd = random.Random(seed)
    lens = []
    for _ in range(trials):
        rnd.shuffle(gaps)
        pos, at = [], sel[0][0]
        for g in gaps:
            at += g
            pos.append(at)
        fake = [(sel[0][0], True, 0.0)] + [(x, True, 0.0) for x in pos]
        lens.append(len(grid(fake, interval, tol, True)))
    lens.sort()
    return lens


def pct(a, b):
    return (b - a) / a * 100.0


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--file", default="ZB_F_weekly", help="CSV in cycles/data (weekly OHLC)")
    ap.add_argument("--interval", type=int, required=True, help="claimed interval, in bars")
    ap.add_argument("--tol", type=int, default=4, help="bars of slack either side")
    ap.add_argument("--strength", type=int, default=8, help="bars each side of a pivot")
    ap.add_argument("--type", choices=["high", "low", "any"], default="high")
    ap.add_argument("--trials", type=int, default=300, help="random-walk control runs")
    ap.add_argument("--as-of", help="a date the claim was made; report what followed")
    ap.add_argument("--until", help="truncate the series here first — the chart the claim was made on")
    ap.add_argument("--after", type=int, default=26, help="bars to score after --as-of")
    args = ap.parse_args()

    path = os.path.join(DATA_DIR, f"{args.file}.csv")
    if not os.path.exists(path):
        sys.exit(f"no {path}")
    dates, o, h, l, c = load(path)
    if args.until:
        keep = sum(1 for d in dates if d <= args.until)
        dates, o, h, l, c = dates[:keep], o[:keep], h[:keep], l[:keep], c[:keep]
        print(f"truncated to {args.until} — only the chart the claim was made on")
    n = len(c)
    rets = [math.log(c[i] / c[i - 1]) for i in range(1, n) if c[i - 1] > 0]
    sigma = statistics.pstdev(rets)
    print(f"{args.file}: {n} bars, {dates[0]} → {dates[-1]}, weekly sigma {sigma*100:.2f}%")

    pvs = pivots(h, l, args.strength)
    nh = sum(1 for p in pvs if p[1])
    print(f"pivots at strength {args.strength}: {len(pvs)}  ({nh} highs, {len(pvs)-nh} lows)")

    want = None if args.type == "any" else (args.type == "high")
    up, mir = hits(pvs, args.interval, args.tol)
    print(f"\n{args.interval}-bar pairs (±{args.tol}): {len(up)} upright, {len(mir)} mirrored")

    chain = grid(pvs, args.interval, args.tol, want)
    label = {"high": "highs", "low": "lows", "any": "pivots"}[args.type]
    print(f"longest run of {label} on a {args.interval}-bar grid: {len(chain)}")
    for i, p in enumerate(chain):
        gap = "" if i == 0 else f"  (+{p[0]-chain[i-1][0]})"
        print(f"   {dates[p[0]]}  {'high' if p[1] else 'low '} {p[2]:8.3f}{gap}")

    if len(chain) >= 2:
        lens, pvcounts = control(n, sigma, args.strength, args.interval, args.tol, want, args.trials)
        at_least = sum(1 for v in lens if v >= len(chain)) / len(lens)
        print(f"\nrandom-walk control ({args.trials} runs, same length, same sigma, same pivot rule):")
        print(f"   its pivot count {statistics.median(pvcounts):.0f} vs the real {len(pvs)}"
              + ("   (comparable)" if abs(statistics.median(pvcounts) - len(pvs)) <= 0.25 * len(pvs)
                 else "   (NOT comparable — read the shuffle control instead)"))
        print(f"   median run {statistics.median(lens):.1f}, "
              f"95th percentile {lens[int(0.95*(len(lens)-1))]}, longest {max(lens)}")
        print(f"   reaches {len(chain)} or more in {at_least*100:.1f}% of runs"
              f"   → {'NOT significant' if at_least > 0.05 else 'beats the bar'}")

        sh = shuffle_control(pvs, args.interval, args.tol, want, max(args.trials, 1000))
        if sh:
            at_least2 = sum(1 for v in sh if v >= len(chain)) / len(sh)
            print(f"\nshuffled-gap control ({len(sh)} runs, the same pivots in a shuffled order):")
            print(f"   median run {statistics.median(sh):.1f}, "
                  f"95th percentile {sh[int(0.95*(len(sh)-1))]}, longest {max(sh)}")
            print(f"   reaches {len(chain)} or more in {at_least2*100:.1f}% of runs"
                  f"   → {'NOT significant' if at_least2 > 0.05 else 'beats the bar'}")

    # What followed each hit: the course's "each decline is bigger" claim.
    if len(chain) >= 2:
        print(f"\nwhat followed each one (worst move inside the next {args.interval//2} bars):")
        moves = []
        for p in chain:
            seg = range(p[0], min(n, p[0] + args.interval // 2))
            if p[1]:
                ext = min(l[i] for i in seg)
            else:
                ext = max(h[i] for i in seg)
            mv = pct(p[2], ext)
            moves.append(mv)
            print(f"   {dates[p[0]]}  {mv:+7.1f}%")
        rising = all(abs(moves[i]) > abs(moves[i - 1]) for i in range(1, len(moves)))
        print(f"   each bigger than the last: {'yes' if rising else 'no'}")

    if args.as_of:
        idx = max(i for i, d in enumerate(dates) if d <= args.as_of)
        end = min(n - 1, idx + args.after)
        seg = range(idx, end + 1)
        hi_i = max(seg, key=lambda i: h[i])
        lo_i = min(seg, key=lambda i: l[i])
        print(f"\nfrom {dates[idx]} (close {c[idx]:.3f}), the next {end-idx} bars:")
        print(f"   high {h[hi_i]:.3f} on {dates[hi_i]}  ({pct(c[idx], h[hi_i]):+.1f}%)")
        print(f"   low  {l[lo_i]:.3f} on {dates[lo_i]}  ({pct(c[idx], l[lo_i]):+.1f}%)")
        print(f"   close {c[end]:.3f} on {dates[end]}  ({pct(c[idx], c[end]):+.1f}%)")


if __name__ == "__main__":
    main()
