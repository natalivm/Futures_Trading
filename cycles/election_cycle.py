#!/usr/bin/env python3
"""
Test the four-year presidential cycle against the actual price history.

The claim from the lectures: going back about a hundred years, the third year
after a presidential election is up roughly 94% of the time — only two misses,
and the usual shape is a high around the election and a low around the
midterms. This script computes it rather than taking it on trust, and names
every year that broke the pattern.

Year numbering, the convention the lecture uses:
    year 1  the year after the election      2025
    year 2  the midterm year                 2026
    year 3  the pre-election year            2027   <- the claim
    year 4  the election year                2028

Usage:
    python3 cycles/election_cycle.py --symbol ^DJI
    python3 cycles/election_cycle.py --symbol ^GSPC --from 1926
    python3 cycles/election_cycle.py --all --json
"""

import argparse
import glob
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(HERE, "data")
WEB_DIR = os.path.join(os.path.dirname(HERE), "public", "cycles")

sys.path.insert(0, HERE)
from find_cycles import load_series  # noqa: E402  (same folder, shared loader)

LABELS = {1: "post-election", 2: "midterm", 3: "pre-election", 4: "election"}


def cycle_year(year):
    """2024 -> 4 (election), 2025 -> 1, 2026 -> 2, 2027 -> 3."""
    return ((year - 1) % 4) + 1


def yearly_returns(dates, closes, first_year=None):
    """Calendar-year % change on the last close of each year. Skips partial first/last years."""
    last = {}
    for date, close in zip(dates, closes):
        last[int(date[:4])] = (date, close)
    years = sorted(last)
    out = []
    for year in years[1:]:
        if year - 1 not in last:
            continue
        if first_year and year < first_year:
            continue
        prev_close = last[year - 1][1]
        date, close = last[year]
        if prev_close <= 0:
            continue
        out.append({
            "year": year,
            "cycleYear": cycle_year(year),
            "label": LABELS[cycle_year(year)],
            "changePct": round((close / prev_close - 1) * 100, 2),
            "lastSession": date,
        })
    return out


def summarise(rows):
    """Hit rate and average move per cycle year, plus every down year."""
    out = {}
    for cy in (1, 2, 3, 4):
        years = [r for r in rows if r["cycleYear"] == cy]
        if not years:
            continue
        up = [r for r in years if r["changePct"] > 0]
        down = [r for r in years if r["changePct"] <= 0]
        changes = sorted(r["changePct"] for r in years)
        mid = len(changes) // 2
        out[cy] = {
            "label": LABELS[cy],
            "years": len(years),
            "up": len(up),
            "upRatePct": round(len(up) * 100 / len(years), 1),
            "meanPct": round(sum(changes) / len(changes), 2),
            "medianPct": round(changes[mid] if len(changes) % 2 else (changes[mid - 1] + changes[mid]) / 2, 2),
            "worstPct": changes[0],
            "bestPct": changes[-1],
            "downYears": [{"year": r["year"], "changePct": r["changePct"]} for r in down],
        }
    return out


def report(slug, dates, closes, first_year):
    rows = yearly_returns(dates, closes, first_year)
    if len(rows) < 8:
        print(f"  only {len(rows)} full calendar years — not enough to say anything")
        return None
    stats = summarise(rows)
    span = f"{rows[0]['year']}–{rows[-1]['year']}"
    print(f"  {len(rows)} full years, {span}\n")
    print(f"  {'cycle year':<16}{'n':>4}{'up':>5}{'up rate':>9}{'mean':>9}{'median':>9}{'worst':>9}")
    for cy in (1, 2, 3, 4):
        if cy not in stats:
            continue
        s = stats[cy]
        print(f"  {str(cy) + ' ' + s['label']:<16}{s['years']:>4}{s['up']:>5}{s['upRatePct']:>8.0f}%"
              f"{s['meanPct']:>8.1f}%{s['medianPct']:>8.1f}%{s['worstPct']:>8.1f}%")

    third = stats.get(3)
    if third:
        misses = ", ".join(f"{d['year']} ({d['changePct']:+.1f}%)" for d in third["downYears"]) or "none"
        print(f"\n  Pre-election years up {third['upRatePct']:.0f}% of the time "
              f"({third['up']}/{third['years']}). Down years: {misses}")
    return {"symbol": slug, "span": span, "years": rows, "byCycleYear": stats}


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--symbol", help="file slug or symbol, e.g. ^DJI")
    ap.add_argument("--all", action="store_true", help="every series in cycles/data")
    ap.add_argument("--from", dest="first_year", type=int, help="ignore years before this")
    ap.add_argument("--json", action="store_true", help="also write public/cycles/<SLUG>_election.json")
    args = ap.parse_args()

    if args.all:
        paths = sorted(glob.glob(os.path.join(DATA_DIR, "*.csv")))
    elif args.symbol:
        paths = [os.path.join(DATA_DIR, f"{args.symbol.lstrip('^').replace('=', '_')}.csv")]
    else:
        ap.error("pass --symbol or --all")

    missing = [p for p in paths if not os.path.exists(p)]
    if missing or not paths:
        print("No price data" + (": " + ", ".join(os.path.basename(p) for p in missing) if missing else ""))
        print("Run `python3 cycles/update_prices.py` first.")
        return 1

    for path in paths:
        slug = os.path.splitext(os.path.basename(path))[0]
        dates, closes = load_series(path)
        print(f"\n{slug}")
        out = report(slug, dates, closes, args.first_year)
        if out and args.json:
            os.makedirs(WEB_DIR, exist_ok=True)
            with open(os.path.join(WEB_DIR, f"{slug}_election.json"), "w") as fh:
                json.dump(out, fh, separators=(",", ":"))
            print(f"  wrote public/cycles/{slug}_election.json")
    return 0


if __name__ == "__main__":
    sys.exit(main())
