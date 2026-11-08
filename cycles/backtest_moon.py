#!/usr/bin/env python3
"""Test the course's lunar-node claims against the price record.

Three claims, all checkable:

  1. "Buy when the moon is conjunct Ketu and you win about 70% of the time
     over the last 10 or 15 years."
  2. "The moon-Rahu conjunctions are more bearish than bullish."
  3. "One month ago, three months ago and five months ago tend to be opposite
     to what's happening now. Two, four, six and eight tend to be the same."

The first two need a control and the control is the whole test. A 70% win
rate means nothing on its own: over a fortnight in a market that rises most
fortnights, a coin flip wins most of the time too. So every rate here is
printed beside the rate a random entry achieves over the same horizon on the
same series, and beside a phase-shift control — the real node schedule slid
by a random offset, which keeps its spacing and destroys only its alignment
with the moon. If the signal is in the phase, that control finds it.

The third claim is an autocorrelation of month-by-month returns, which needs
no return baseline, only a null for the coefficient.
"""
import argparse, bisect, csv, math, os, random, statistics, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import moon

DATA_DIR = os.path.join(HERE, "data")


def load(slug):
    path = os.path.join(DATA_DIR, f"{slug}.csv")
    with open(path) as fh:
        rows = [r for r in csv.DictReader(fh)]
    return [r["date"] for r in rows], [float(r["close"]) for r in rows]


def idx_on_or_after(dates, day):
    i = bisect.bisect_left(dates, day)
    return i if i < len(dates) else None


def fwd(closes, i, bars):
    j = min(len(closes) - 1, i + bars)
    return (closes[j] - closes[i]) / closes[i] * 100.0


def rate(xs):
    return 100.0 * sum(1 for x in xs if x > 0) / len(xs) if xs else float("nan")


def entries(dates, crossings, kind):
    out = []
    for j, k in crossings:
        if k != kind:
            continue
        i = idx_on_or_after(dates, moon.date_str(j))
        if i is not None:
            out.append(i)
    return out


def shifted_control(dates, closes, n_entries, bars, trials, seed=3):
    """The node schedule slid by a random offset: same count, same even
    spacing, different phase. Anything the moon contributes is in the phase."""
    rnd = random.Random(seed)
    span = len(dates)
    gap = span / max(1, n_entries)
    rates = []
    for _ in range(trials):
        off = rnd.uniform(0, gap)
        idxs = [int(off + k * gap) for k in range(n_entries)]
        idxs = [i for i in idxs if 0 <= i < span]
        rates.append(rate([fwd(closes, i, bars) for i in idxs]))
    rates.sort()
    return rates


def claim_12(dates, closes, crossings, horizons, trials, label):
    print(f"\n=== {label}: what follows a node conjunction ===")
    allidx = list(range(len(closes)))
    print(f"{'horizon':>10} {'n':>5} | {'Ketu win':>9} {'mean':>7} | "
          f"{'Rahu win':>9} {'mean':>7} | {'any day':>8} | phase control (Ketu)")
    for name, bars in horizons:
        ke = entries(dates, crossings, "ketu")
        ra = entries(dates, crossings, "rahu")
        kr = [fwd(closes, i, bars) for i in ke]
        rr = [fwd(closes, i, bars) for i in ra]
        base = [fwd(closes, i, bars) for i in allidx[:-bars or None]]
        ctl = shifted_control(dates, closes, len(ke), bars, trials)
        above = sum(1 for v in ctl if v >= rate(kr)) / len(ctl) * 100
        print(f"{name:>10} {len(ke):>5} | {rate(kr):>8.1f}% {statistics.mean(kr):>+6.2f}% | "
              f"{rate(rr):>8.1f}% {statistics.mean(rr):>+6.2f}% | {rate(base):>7.1f}% | "
              f"median {statistics.median(ctl):.1f}%, beaten {above:.0f}% of the time")


def acf(xs, lag):
    n = len(xs)
    m = statistics.mean(xs)
    num = sum((xs[i] - m) * (xs[i - lag] - m) for i in range(lag, n))
    den = sum((x - m) ** 2 for x in xs)
    return num / den if den else 0.0


def claim_3(dates, closes, crossings, trials, label):
    """Month-on-month: is the draconic month opposite the one before it?"""
    rh = [i for i in entries(dates, crossings, "rahu")]
    rets = [(closes[rh[k + 1]] - closes[rh[k]]) / closes[rh[k]] * 100.0
            for k in range(len(rh) - 1)]
    print(f"\n=== {label}: is each draconic month the opposite of the last? ===")
    print(f"{len(rets)} months, Rahu to Rahu, {dates[rh[0]]} → {dates[rh[-1]]}")
    print(f"the claim: negative at odd lags, positive at even lags\n")
    print(f"{'lag':>4} {'months back':>12} {'autocorr':>9} {'sign agree':>11} "
          f"{'claim':>9}  {'verdict':>9}")
    rnd = random.Random(5)
    for lag in range(1, 9):
        a = acf(rets, lag)
        pairs = [(rets[i], rets[i - lag]) for i in range(lag, len(rets))]
        agree = 100.0 * sum(1 for x, y in pairs if (x > 0) == (y > 0)) / len(pairs)
        null = []
        for _ in range(trials):
            sh = rets[:]
            rnd.shuffle(sh)
            null.append(acf(sh, lag))
        null.sort()
        lo, hi = null[int(0.025 * trials)], null[int(0.975 * trials)]
        want = "opposite" if lag % 2 else "same"
        got = "opposite" if a < 0 else "same"
        inside = lo <= a <= hi
        verdict = "noise" if inside else ("HOLDS" if got == want else "AGAINST")
        print(f"{lag:>4} {('odd' if lag%2 else 'even'):>12} {a:>+9.3f} {agree:>10.1f}% "
              f"{want:>9}  {verdict:>9}")
    print(f"\n   'noise' = inside the 95% band of the same statistic on shuffled months.")

    # If the alternation survives, the next question decides whether it is
    # lunar at all: chop the same series into 27.21-day blocks starting at an
    # arbitrary phase and measure the same thing. Short-horizon returns mean-
    # revert for reasons that have nothing to do with the moon, and a result
    # the phase does not change is a result about the horizon.
    span_days = (len(closes) / len(rets)) if rets else 0
    blk = max(2, int(round(span_days)))
    rnd2 = random.Random(9)
    phase = []
    for _ in range(trials // 4):
        off = rnd2.randrange(blk)
        edges = list(range(off, len(closes), blk))
        br = [(closes[edges[k + 1]] - closes[edges[k]]) / closes[edges[k]] * 100.0
              for k in range(len(edges) - 1)]
        if len(br) > 10:
            phase.append(acf(br, 1))
    if phase:
        phase.sort()
        real = acf(rets, 1)
        inside = phase[int(0.025 * len(phase))] <= real <= phase[int(0.975 * len(phase))]
        print(f"\n   lag-1 again, on {blk}-bar blocks cut at an arbitrary phase "
              f"instead of at the node:")
        print(f"      median {statistics.median(phase):+.3f}, 95% band "
              f"[{phase[int(0.025*len(phase))]:+.3f}, {phase[int(0.975*len(phase))]:+.3f}]"
              f"   vs the lunar {real:+.3f}")
        print(f"      → the alternation is "
              + ("NOT specific to the moon; any block of this length does it"
                 if inside else "stronger at the node than at an arbitrary phase"))


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--symbol", default="GSPC", help="file slug in cycles/data")
    ap.add_argument("--from", dest="start", help="ignore data before this date")
    ap.add_argument("--trials", type=int, default=2000)
    args = ap.parse_args()

    dates, closes = load(args.symbol)
    if args.start:
        keep = [i for i, d in enumerate(dates) if d >= args.start]
        dates, closes = dates[keep[0]:], closes[keep[0]:]
    print(f"{args.symbol}: {len(closes)} bars, {dates[0]} → {dates[-1]}")

    y0, m0, d0 = (int(x) for x in dates[0].split("-"))
    y1, m1, d1 = (int(x) for x in dates[-1].split("-"))
    cr = moon.node_crossings(moon.jd_from_ymd(y0, m0, d0) - 2,
                             moon.jd_from_ymd(y1, m1, d1) + 2)
    print(f"node crossings in span: {len(cr)} "
          f"({sum(1 for _, k in cr if k == 'rahu')} Rahu, "
          f"{sum(1 for _, k in cr if k == 'ketu')} Ketu)")

    claim_12(dates, closes, cr,
             [("1 week", 5), ("2 weeks", 10), ("to next node", 14), ("4 weeks", 20)],
             args.trials, args.symbol)
    claim_3(dates, closes, cr, args.trials, args.symbol)


if __name__ == "__main__":
    main()
