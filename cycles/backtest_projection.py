#!/usr/bin/env python3
"""Does the indicator's forward projection land on turns?

The summation panel's one forward-looking output is "Projection step: N bars".
Two readings of how to project were in the code and its comment at once:

  constant  the widest gap in the chain, repeated — anchor + step, +2*step, ...
  mirror    the chain's own terms counted forward — anchor + 11, +27, +38, ...

Both are scored here against pivots that only exist later, walking forward so
nothing is fitted on data it then predicts.

The control is the whole test, and it has to be matched on TOLERANCE. A hit
allows 2% of the offset, so a 427-bar projection gets a +/-8 bar window while
an 11-bar one gets +/-1. With a pivot every nine bars the wide window catches
something almost regardless — which is exactly how the constant step first
measured 89% and looked excellent. Each projection is therefore compared
against random future bars judged at its own tolerance.

What counts as a turn is swept too: a strength-5 pivot is a wiggle, and the
claim is about turns, so the test is repeated against progressively more
major ones.
"""
import argparse, bisect, csv, os, random, statistics, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from backtest_interval import pivots

DATA_DIR = os.path.join(HERE, "data")


def load_close(slug):
    with open(os.path.join(DATA_DIR, f"{slug}.csv")) as fh:
        rows = list(csv.DictReader(fh))
    c = [float(r["close"]) for r in rows]
    return [r["date"] for r in rows], c


def tol_for(x):
    return max(1, round(x * 2.0 / 100.0))


def near(sorted_bars, b, tol):
    i = bisect.bisect_left(sorted_bars, b - tol)
    return i < len(sorted_bars) and sorted_bars[i] <= b + tol


def nearest_idx(counts, target):
    best, bd = -1, tol_for(target) + 1
    for i, c in enumerate(counts):
        d = abs(c - target)
        if d <= tol_for(target) and d < bd:
            bd, best = d, i
    return best


def best_chain(counts, min_chain=5):
    MAXL = 24
    bestA = [-1] * MAXL
    bestB = [-1] * MAXL
    bestM = [1e9] * MAXL
    m = len(counts)
    for a in range(m - 1):
        for b in range(a + 1, m):
            x, y = counts[a], counts[b]
            if y <= x:
                continue
            ln, err = 2, 0.0
            while True:
                k = nearest_idx(counts, x + y)
                if k >= 0 and counts[k] > y:
                    err += abs(counts[k] - (x + y))
                    ln += 1
                    x, y = y, counts[k]
                else:
                    break
            if 3 <= ln < MAXL:
                me = err / (ln - 2)
                if me < bestM[ln]:
                    bestM[ln], bestA[ln], bestB[ln] = me, a, b
    longest = max((L for L in range(3, MAXL) if bestA[L] >= 0), default=0)
    pick = longest
    if longest >= 4 and bestA[longest - 1] >= 0 and bestM[longest - 1] < bestM[longest]:
        pick = longest - 1
    if pick < 3:
        return []
    a, b = bestA[pick], bestB[pick]
    chain = [a, b]
    x, y = counts[a], counts[b]
    while True:
        k = nearest_idx(counts, x + y)
        if k >= 0 and counts[k] > y:
            chain.append(k)
            x, y = y, counts[k]
        else:
            break
    return chain if len(chain) >= min_chain else []


def run(slug, target, every, maxp, strength, draws, seed=11):
    dates, c = load_close(slug)
    n = len(c)
    chain_pv = pivots(c, c, strength)
    turn_bars = sorted(p[0] for p in pivots(c, c, target))
    rnd = random.Random(seed)
    hit = {"constant": [0, 0], "mirror": [0, 0]}
    ctl = {"constant": [0, 0], "mirror": [0, 0]}
    for T in range(600, n - 500, every):
        pv = [p for p in chain_pv if p[0] <= T - strength][-maxp:]
        if len(pv) < 20:
            continue
        abar = pv[-1][0]
        counts = sorted(set(abar - p[0] + 1 for p in pv[:-1]))
        ch = best_chain(counts)
        if not ch:
            continue
        terms = [counts[i] for i in ch]
        proj = {"constant": [abar + (terms[-1] - terms[-2]) * k for k in (1, 2, 3)],
                "mirror": [abar + t for t in terms]}
        for kind, bars in proj.items():
            for b in bars:
                if b <= T or b >= n:          # it has to be a real forecast
                    continue
                tol = tol_for(b - abar)
                hit[kind][0] += near(turn_bars, b, tol)
                hit[kind][1] += 1
                for _ in range(draws):
                    r = rnd.randrange(T + 1, n)
                    ctl[kind][0] += near(turn_bars, r, tol)
                    ctl[kind][1] += 1
    return hit, ctl, len(turn_bars), n


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--symbols", default="GSPC,DJI,ES_F,IXIC")
    ap.add_argument("--targets", default="5,13,21,34", help="pivot strengths that count as a turn")
    ap.add_argument("--every", type=int, default=60, help="bars between evaluation points")
    ap.add_argument("--maxp", type=int, default=80)
    ap.add_argument("--strength", type=int, default=5, help="pivot strength the chain is built from")
    ap.add_argument("--draws", type=int, default=25, help="control draws per projection")
    args = ap.parse_args()

    print(f"chain from strength-{args.strength} pivots, {args.draws} control draws per projection\n")
    pooled = {"constant": [0, 0, 0, 0], "mirror": [0, 0, 0, 0]}
    for slug in args.symbols.split(","):
        print(f"{slug}")
        print(f"{'turn strength':>14} {'turns':>7} | "
              f"{'constant: hit vs chance':>26} | {'mirror: hit vs chance':>26}")
        for tgt in (int(x) for x in args.targets.split(",")):
            hit, ctl, nt, n = run(slug, tgt, args.every, args.maxp, args.strength, args.draws)
            row = f"{tgt:>14} {nt:>7} |"
            for kind in ("constant", "mirror"):
                h, t = hit[kind]
                ch, ct = ctl[kind]
                if t and ct:
                    e = 100 * h / t - 100 * ch / ct
                    row += f" {100*h/t:5.1f}% vs {100*ch/ct:5.1f}%  {e:+5.1f} |"
                    pooled[kind][0] += h
                    pooled[kind][1] += t
                    pooled[kind][2] += ch
                    pooled[kind][3] += ct
            print(row)
        print()
    print("pooled over every symbol and every definition of a turn:")
    for kind in ("constant", "mirror"):
        h, t, ch, ct = pooled[kind]
        print(f"   {kind:<9} {100*h/t:5.1f}% vs {100*ch/ct:5.1f}% chance   "
              f"{100*h/t - 100*ch/ct:+5.1f} points, on {t} projections")


if __name__ == "__main__":
    main()
