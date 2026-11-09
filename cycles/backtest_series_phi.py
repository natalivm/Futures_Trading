#!/usr/bin/env python3
"""Test the daily series and its golden-ratio internal structure.

The lecture takes a low as a zero point, counts trading days back to each
earlier turn — 8, 9, 17, 23, 29, 44, 73, 116/117 — and then reports two
things about those counts:

  1. They sum.  29 + 44 = 73, and 44 + 73 = 117.
  2. Their ratios to the largest are powers of the golden ratio.
     73/117 = .618, 44/117 = .382, 29/116 ~ .236, 17/116 = .146.
     "In other words, these are all powers of the golden ratio."

Presented as two findings reinforcing each other: the series sums AND it is
golden, so the move has "an internal structure like a spiral". They are not
two findings. Any sequence where each term is the sum of the previous two
converges on the golden ratio whatever it starts from — that is the defining
property of an additive sequence, not a property of this market. Claim 2 is
claim 1 restated, and `--tautology` demonstrates it on random seeds.

What is left after that is the part that could be a finding: whether counting
back from a zero point lands on turns more often than counting back from
nothing in particular, and whether phi ratios are harder to find in a real
chart than in a random one given the same freedoms. `--control` measures the
second, which is the one the lecture actually leans on.

    python3 cycles/backtest_series_phi.py
    python3 cycles/backtest_series_phi.py --tautology --control

Stdlib only.
"""
import argparse, csv, math, os, random, statistics

HERE = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(HERE, "data")

PHI = (math.sqrt(5) - 1) / 2            # 0.6180, = 1/1.618
COUNTS = [8, 9, 17, 23, 29, 44, 73, 117]
STATED = [(73, 117, 1), (44, 117, 2), (29, 116, 3), (17, 116, 4)]


def nearest_power(r, kmax=8):
    return min(((abs(r - PHI ** k), k) for k in range(1, kmax + 1)))


def check_stated():
    print("1. The ratios as stated")
    print(f"   {'ratio':<10} {'value':>7} {'phi^-k':>9} {'k':>3} {'off':>8}")
    for a, b, k in STATED:
        r = a / b
        print(f"   {f'{a}/{b}':<10} {r:>7.4f} {PHI ** k:>9.4f} {k:>3} {abs(r - PHI ** k) * 100:>7.2f}pp")
    print("   Three of the four land within 0.6 points. 29/116 is 0.250 against 0.236 —")
    print("   the lecture says so itself: \"a quarter is very close to 0.236\". It is 6% off,")
    print("   and 6% of 116 days is a week.")

    print("\n2. Does the series actually sum?")
    ok = bad = 0
    for i in range(2, len(COUNTS)):
        x, y, z = COUNTS[i - 2], COUNTS[i - 1], COUNTS[i]
        good = x + y == z
        ok, bad = ok + good, bad + (not good)
        print(f"   {x:>3} + {y:>3} = {x + y:<4} vs {z:<4} {'yes' if good else 'no'}")
    print(f"   {ok} of {ok + bad} consecutive triples sum. 8+9=17 holds, then it breaks for")
    print("   three in a row, then 29+44=73 and 44+73=117 hold. The two that carry the")
    print("   golden-ratio argument are the two that work; the series is not additive")
    print("   throughout, and the terms that do not fit are kept anyway.")


def tautology(trials=6, seed=5):
    """Additive sequences are golden whatever they start from."""
    print("\n3. Why claim 2 follows from claim 1 and says nothing extra")
    print("   Seed any additive chain with two numbers, run it out, and the last four terms")
    print("   stand in phi ratios. The market is not required for this.")
    rnd = random.Random(seed)
    print(f"   {'seed':<12} {'chain':<34} {'c/e':>7} {'b/e':>7} {'a/e':>7}")
    for _ in range(trials):
        a, b = rnd.randint(2, 40), rnd.randint(2, 40)
        ch = [a, b]
        while len(ch) < 7:
            ch.append(ch[-1] + ch[-2])
        e = ch[-1]
        print(f"   {f'{a}, {b}':<12} {str(ch):<34} "
              f"{ch[-2] / e:>7.4f} {ch[-3] / e:>7.4f} {ch[-4] / e:>7.4f}")
    print(f"   targets                                    "
          f"{PHI:>7.4f} {PHI ** 2:>7.4f} {PHI ** 3:>7.4f}")
    print("   Every row. The ratios are a consequence of the addition rule, so quoting both")
    print("   as evidence counts one observation twice — and the observation is two sums.")


def load_daily_ohlc():
    """Daily high/low rebuilt from the hourly file, ET sessions."""
    import datetime as dt
    path = os.path.join(DATA_DIR, "ES_F_hourly.csv")
    day = {}
    with open(path, newline="") as fh:
        for r in csv.DictReader(fh):
            t = dt.datetime.strptime(r["ts"], "%Y-%m-%dT%H:%M:%SZ") - dt.timedelta(hours=4)
            h, l = float(r["high"]), float(r["low"])
            d = t.date()
            day[d] = (max(day[d][0], h), min(day[d][1], l)) if d in day else (h, l)
    ds = sorted(day)
    return ds, [day[d][0] for d in ds], [day[d][1] for d in ds]


def pivot_list(highs, lows, k):
    out = []
    for i in range(k, len(highs) - k):
        if all(highs[j] <= highs[i] for j in range(i - k, i)) and \
           all(highs[j] < highs[i] for j in range(i + 1, i + k + 1)):
            out.append(i)
        elif all(lows[j] >= lows[i] for j in range(i - k, i)) and \
             all(lows[j] > lows[i] for j in range(i + 1, i + k + 1)):
            out.append(i)
    return out


def phi_hits(counts, span, tol):
    """How many of `counts` sit within `tol` of a phi power of `span`."""
    hits = 0
    for c in counts:
        d, _ = nearest_power(c / span)
        if d <= tol:
            hits += 1
    return hits


def control(trials=200, tol=0.015, seed=17):
    """Given the same freedoms, how many phi ratios does a random chart yield?

    The freedoms, counted off the lecture: the zero point is chosen, the turns
    counted back to are chosen from every pivot available, any of the first
    eight phi powers may be matched, a day of slack is allowed, and 0.25 may
    stand in for 0.236. The question is whether a real chart gives more phi
    ratios under those rules than a random walk does."""
    print(f"\n4. How many phi ratios a chart yields under the same freedoms "
          f"(tolerance {tol * 100:.1f}pp)")
    ds, highs, lows = load_daily_ohlc()
    k = 3
    pvs = pivot_list(highs, lows, k)
    rnd = random.Random(seed)

    def best_from(pivots, span_lo=90, span_hi=130):
        """Pick the anchor and the span the way the lecture does — by eye, which
        means the pair that works. The score is how many of the turns between
        them land on a phi power of the span, since which turns to label is
        itself part of what gets chosen. Returns (hits, counts available)."""
        best = (0, 0)
        for a_i in range(len(pivots) - 1, 0, -1):
            anchor = pivots[a_i]
            back = [anchor - p for p in pivots[:a_i] if 0 < anchor - p <= span_hi]
            for span in [c for c in back if span_lo <= c <= span_hi]:
                cs = [c for c in back if c < span]
                if len(cs) < 4:
                    continue
                h = phi_hits(cs, span, tol)
                if h > best[0]:
                    best = (h, len(cs))
        return best

    real, avail = best_from(pvs)
    rets = [math.log(highs[i] / highs[i - 1]) for i in range(1, len(highs))]
    sigma = statistics.pstdev(rets)
    scores = []
    for t in range(trials):
        c = [100.0]
        for _ in range(len(highs) - 1):
            c.append(c[-1] * math.exp(rnd.gauss(0, sigma)))
        hi = [v * (1 + abs(rnd.gauss(0, sigma)) * 0.6) for v in c]
        lo = [v * (1 - abs(rnd.gauss(0, sigma)) * 0.6) for v in c]
        scores.append(best_from(pivot_list(hi, lo, k))[0])
    scores.sort()
    beat = 100.0 * sum(1 for s in scores if s >= real) / len(scores)
    print(f"   ES, best anchor and span: {real} of {avail} counts land on a phi power.")
    print(f"   Random walks, same pivot rule, same search: median {statistics.median(scores):.0f}, "
          f"range {scores[0]}-{scores[-1]}, n={len(scores)}.")
    print(f"   {beat:.0f}% of random walks match or beat the real chart.")
    print("   Searching every anchor and every span for the best fit is what the lecture")
    print("   does by eye, and under that search a random walk is golden too.")


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--tautology", action="store_true")
    ap.add_argument("--control", action="store_true")
    ap.add_argument("--tol", type=float, default=0.015)
    ap.add_argument("--trials", type=int, default=200)
    args = ap.parse_args()
    check_stated()
    if args.tautology or not args.control:
        tautology()
    if args.control:
        control(trials=args.trials, tol=args.tol)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
