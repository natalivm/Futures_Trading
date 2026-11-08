#!/usr/bin/env python3
"""
Run several named cycles at once and report where they agree.

Rule R5 in METHOD.md, and the lectures' own summary of the method: no single
cycle is the forecast. If the short cycles agree with the long one that the
next three months are up, the next three months are probably up. If they fight
each other you usually get nothing. If they all point down together you
usually get a decent decline.

So this does not pick a winner. It runs each named interval, projects each
one's analog forward, and reports the vote at 1, 3, 6 and 12 months —
weighting each cycle by how much its own scores say it deserves.

Usage:
    python3 cycles/composite.py --symbol ^GSPC --preset sp500
    python3 cycles/composite.py --symbol ^DJI --lag-years 60,28,4 --window 440
    python3 cycles/composite.py --all --json
"""

import argparse
import datetime as dt
import glob
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(HERE, "data")
WEB_DIR = os.path.join(os.path.dirname(HERE), "public", "cycles")

sys.path.insert(0, HERE)
from find_cycles import (  # noqa: E402
    PRESETS, TRADING_DAYS_PER_YEAR, correlation, load_series, log_returns,
    project, scan, stability,
)

# Where the vote is taken, in trading days.
HORIZONS = [("1 month", 21), ("3 months", 63), ("6 months", 126), ("12 months", 252)]

# A cycle's vote is worth what its scores say it is worth. Swing correlation
# and epoch stability are the two measures the controls showed can tell a
# cycle from a coincidence (R9), so they are the two that set the weight.
MIN_SWING = 0.15
MIN_HELD = 0.0


def weigh(swing, held_min):
    """0 for a cycle that fails R9, rising to 1 for one that passes it clearly.

    Deliberately not a function of the price correlation. A random walk scores
    0.947 on that, so paying for it would weight the noise most heavily.
    """
    if swing < MIN_SWING:
        return 0.0
    if held_min is not None and held_min < MIN_HELD:
        return 0.0
    swing_part = min(1.0, (swing - MIN_SWING) / (0.6 - MIN_SWING))
    if held_min is None:
        return round(0.5 * swing_part, 3)       # untestable epochs: half credit
    held_part = min(1.0, held_min / 0.6)
    return round(0.5 * swing_part + 0.5 * held_part, 3)


def run_cycle(closes, dates, years, window, horizon, epochs, epoch_years, swing_bars):
    """Score one named interval and project it forward. None if it does not fit."""
    n = len(closes)
    lag = int(round(years * TRADING_DAYS_PER_YEAR))
    if lag + window + 1 > n:
        return {"years": years, "skipped": f"needs {(lag + window) / TRADING_DAYS_PER_YEAR:.0f}y of history"}

    scored = scan(closes, window, lag, lag, 1)
    if not scored:
        return {"years": years, "skipped": "no score"}
    corr = scored[0][1]

    analog, _future, projected = project(closes, lag, window, horizon)
    swing = correlation(log_returns(analog, swing_bars),
                        log_returns(closes[-window:], swing_bars))
    epochs_out = stability(closes, lag, window, epochs, int(epoch_years * TRADING_DAYS_PER_YEAR), swing_bars)
    held = [e["corr"] for e in epochs_out]
    held_min = min(held) if held else None
    start = n - window - lag

    out = {
        "years": years,
        "corr": round(corr, 4),
        "swingCorr": round(swing, 4),
        "heldMinCorr": round(held_min, 4) if held_min is not None else None,
        "weight": weigh(swing, held_min),
        "analogStart": dates[start],
        "analogEnd": dates[start + window - 1],
        "path": [round(v, 2) for v in projected],
    }
    last = closes[-1]
    out["moves"] = {
        name: round((projected[bars - 1] / last - 1) * 100, 2)
        for name, bars in HORIZONS if len(projected) >= bars
    }
    return out


def vote(cycles):
    """The agreement at each horizon: who points where, and how strongly."""
    live = [c for c in cycles if c.get("weight", 0) > 0 and c.get("moves")]
    out = {}
    for name, _bars in HORIZONS:
        ups = [c for c in live if c["moves"].get(name, 0) > 0]
        downs = [c for c in live if c["moves"].get(name, 0) < 0]
        wu = sum(c["weight"] for c in ups)
        wd = sum(c["weight"] for c in downs)
        total = wu + wd
        if not total:
            out[name] = {"verdict": "no usable cycle", "up": 0, "down": 0, "score": 0.0, "movePct": None}
            continue
        lean = (wu - wd) / total
        # Fighting cycles are a forecast of nothing, which is the point of R5.
        verdict = "up" if lean >= 0.5 else "down" if lean <= -0.5 else "no agreement"
        weighted = sum(c["weight"] * c["moves"][name] for c in live if name in c["moves"]) / total
        out[name] = {
            "verdict": verdict,
            "up": len(ups),
            "down": len(downs),
            "score": round(lean, 3),
            "movePct": round(weighted, 2),
        }
    return out


def report(slug, dates, closes, args):
    cycles = [run_cycle(closes, dates, y, args.window, args.horizon,
                        args.epochs, args.epoch_years, args.swing)
              for y in args.lags]

    print(f"  {len(closes)} bars, {dates[0]} → {dates[-1]}, window {args.window}\n")
    print(f"  {'cycle':>8}  {'price':>7}{'swing':>8}{'worst':>8}{'weight':>8}   3-month")
    for c in cycles:
        if c.get("skipped"):
            print(f"  {c['years']:>7g}y  — {c['skipped']}")
            continue
        held = f"{c['heldMinCorr']:+.2f}" if c["heldMinCorr"] is not None else "   n/a"
        move = c["moves"].get("3 months")
        print(f"  {c['years']:>7g}y  {c['corr']:+.3f}  {c['swingCorr']:+.3f}  {held}  {c['weight']:>6.2f}   "
              + (f"{move:+.1f}%" if move is not None else "—"))

    agreement = vote(cycles)
    print("\n  Agreement")
    for name, _bars in HORIZONS:
        v = agreement[name]
        move = f"{v['movePct']:+.1f}%" if v["movePct"] is not None else "—"
        print(f"    {name:<10} {v['verdict']:<14} {v['up']} up / {v['down']} down   "
              f"lean {v['score']:+.2f}   weighted {move}")

    usable = [c for c in cycles if c.get("weight", 0) > 0]
    if not usable:
        print("\n  No cycle on this market clears the swing and epoch floors, so there is\n"
              "  no composite to read. That is a result, not a gap.")
    return {
        "symbol": slug,
        "generated": dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "window": args.window,
        "historyStart": dates[0],
        "historyEnd": dates[-1],
        "lastClose": round(closes[-1], 2),
        "cycles": cycles,
        "agreement": agreement,
    }


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--symbol", help="file slug or symbol, e.g. ^GSPC")
    ap.add_argument("--all", action="store_true", help="every series in cycles/data")
    ap.add_argument("--preset", choices=sorted(PRESETS), help="a named cycle set")
    ap.add_argument("--lag-years", help="explicit cycle lengths, e.g. 60,28,11.65")
    ap.add_argument("--window", type=int, default=440)
    ap.add_argument("--horizon", type=int, default=252)
    ap.add_argument("--swing", type=int, default=21)
    ap.add_argument("--epochs", type=int, default=5)
    ap.add_argument("--epoch-years", type=float, default=5)
    ap.add_argument("--as-of", help="pretend today is this date (YYYY-MM-DD)")
    ap.add_argument("--json", action="store_true", help="write public/cycles/<SLUG>_composite.json")
    args = ap.parse_args()

    if args.lag_years:
        args.lags = [float(x) for x in args.lag_years.split(",")]
    elif args.preset:
        args.lags = PRESETS[args.preset]
    else:
        args.lags = PRESETS["course"]

    if args.all:
        paths = sorted(glob.glob(os.path.join(DATA_DIR, "*.csv")))
    elif args.symbol:
        paths = [os.path.join(DATA_DIR, f"{args.symbol.lstrip('^').replace('=', '_')}.csv")]
    else:
        ap.error("pass --symbol or --all")

    missing = [p for p in paths if not os.path.exists(p)]
    if missing or not paths:
        print("No price data" + (": " + ", ".join(os.path.basename(p) for p in missing) if missing else ""))
        return 1

    for path in paths:
        slug = os.path.splitext(os.path.basename(path))[0]
        dates, closes = load_series(path)
        if args.as_of:
            keep = sum(1 for d in dates if d <= args.as_of)
            dates, closes = dates[:keep], closes[:keep]
        print(f"\n{slug}" + (f"  (as of {args.as_of})" if args.as_of else ""))
        if len(closes) < args.window + 50:
            print("  too little data")
            continue
        out = report(slug, dates, closes, args)
        if args.json:
            os.makedirs(WEB_DIR, exist_ok=True)
            with open(os.path.join(WEB_DIR, f"{slug}_composite.json"), "w") as fh:
                json.dump(out, fh, separators=(",", ":"))
            print(f"  wrote public/cycles/{slug}_composite.json")
    return 0


if __name__ == "__main__":
    sys.exit(main())
