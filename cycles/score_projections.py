#!/usr/bin/env python3
"""Score the overlay's past projections against what the market then did.

The weekly workflow rewrites public/cycles/*.json in place, so the projected
path on the page is always drawn from today and there is never anything to
check it against. Git keeps every earlier version, which means the record
exists — it just has to be read back.

This walks the history of <SLUG>_named.json, takes each snapshot's forward
path for each named cycle, and compares it with the prices that have arrived
since. A projection is scored on the part that has actually elapsed, so a
230-bar path made a fortnight ago is judged on its first ten bars and no more.

Three numbers per projection, in rising order of how much they tell you:

  * direction — did the net change over the elapsed window have the right
    sign? The coarsest test, and the one a forecast has to pass first.
  * daily correlation — do the projected day-to-day changes line up with the
    real ones? This is the one that is hard to pass by luck.
  * path correlation — the headline number, and the least informative: two
    series that both drift upward correlate at 0.9 without agreeing about
    anything. R9 in the rules puts it last for that reason.

The baseline for direction is not 50%. The market rises on most windows, so
the comparison printed beside every rate is what "always up" scores on the
same windows.

    python3 cycles/score_projections.py
    python3 cycles/score_projections.py --symbol ES_F --suffix _named
    python3 cycles/score_projections.py --verbose

Stdlib only. Needs a git checkout with history.
"""
import argparse, bisect, csv, json, os, statistics, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
DATA_DIR = os.path.join(HERE, "data")


def actual(slug):
    with open(os.path.join(DATA_DIR, f"{slug}.csv"), newline="") as fh:
        rows = list(csv.DictReader(fh))
    return [r["date"] for r in rows], [float(r["close"]) for r in rows]


def revisions(path):
    """(sha, date) for every commit touching the file, oldest first."""
    out = subprocess.run(["git", "log", "--format=%H|%ad", "--date=short", "--", path],
                         cwd=ROOT, capture_output=True, text=True, check=True)
    revs = []
    for line in out.stdout.strip().splitlines():
        if "|" in line:
            sha, day = line.split("|", 1)
            revs.append((sha.strip(), day.strip()))
    revs.reverse()
    return revs


def snapshot(sha, path):
    out = subprocess.run(["git", "show", f"{sha}:{path}"],
                         cwd=ROOT, capture_output=True, text=True)
    if out.returncode != 0:
        return None
    try:
        return json.loads(out.stdout)
    except json.JSONDecodeError:
        return None


def corr(xs, ys):
    if len(xs) < 3:
        return None
    mx, my = statistics.fmean(xs), statistics.fmean(ys)
    sx = sum((x - mx) ** 2 for x in xs) ** 0.5
    sy = sum((y - my) ** 2 for y in ys) ** 0.5
    if sx == 0 or sy == 0:
        return None
    return sum((x - mx) * (y - my) for x, y in zip(xs, ys)) / (sx * sy)


def score_one(match, anchor_close, dates, closes, last_day):
    """Compare a projection with the elapsed part of its own horizon."""
    fd = match.get("forecastDates") or []
    fc = match.get("forecastCloses") or []
    if not fd or len(fd) != len(fc):
        return None
    pairs = []
    for day, proj in zip(fd, fc):
        if day > last_day:
            break
        i = bisect.bisect_left(dates, day)
        if i < len(dates) and dates[i] == day:
            pairs.append((day, proj, closes[i]))
    if len(pairs) < 3:
        return None
    proj = [p for _, p, _ in pairs]
    real = [r for _, _, r in pairs]
    # Daily changes, with the anchor prepended so the first forecast bar's
    # move is scored too — it is the one the projection is most sure about.
    dproj = [proj[0] - anchor_close] + [proj[i] - proj[i - 1] for i in range(1, len(proj))]
    dreal = [real[0] - anchor_close] + [real[i] - real[i - 1] for i in range(1, len(real))]
    net_p = proj[-1] - anchor_close
    net_r = real[-1] - anchor_close
    return {
        "bars": len(pairs),
        "through": pairs[-1][0],
        "dates": [d for d, _, _ in pairs],
        "projected": [round(p, 2) for p in proj],
        "actualCloses": [round(r, 2) for r in real],
        "anchorClose": round(anchor_close, 2),
        "projPct": 100.0 * net_p / anchor_close,
        "realPct": 100.0 * net_r / anchor_close,
        "dirRight": (net_p > 0) == (net_r > 0),
        "realUp": net_r > 0,
        "dailyCorr": corr(dproj, dreal),
        "pathCorr": corr(proj, real),
    }


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--symbol", default="GSPC")
    ap.add_argument("--suffix", default="_named")
    ap.add_argument("--verbose", action="store_true")
    ap.add_argument("--archive", action="store_true",
                    help="write public/cycles/<SLUG>_scored.json for the site to draw")
    args = ap.parse_args()

    rel = f"public/cycles/{args.symbol}{args.suffix}.json"
    dates, closes = actual(args.symbol)
    last_day = dates[-1]
    revs = revisions(rel)
    if not revs:
        print(f"no history for {rel}")
        return 1
    print(f"{rel}: {len(revs)} snapshots, {revs[0][1]} → {revs[-1][1]}")
    print(f"actual prices through {last_day}\n")

    seen = set()
    rows = []
    for sha, day in revs:
        rep = snapshot(sha, rel)
        if not rep:
            continue
        made = rep.get("historyEnd")
        if not made or made in seen or made >= last_day:
            continue
        cur = rep.get("currentCloses") or []
        if not cur:
            continue
        seen.add(made)
        anchor = cur[-1]
        for m in rep.get("matches", []):
            sc = score_one(m, anchor, dates, closes, last_day)
            if sc:
                sc["made"] = made
                sc["lag"] = m.get("lagYears")
                sc["inverted"] = bool(m.get("inverted"))
                rows.append(sc)

    if not rows:
        print("no elapsed projections to score yet — the snapshots are all current.")
        return 0

    if args.verbose:
        print(f"{'made':<12} {'lag yr':>7} {'bars':>5} {'through':<12} "
              f"{'projected':>10} {'actual':>9} {'dir':>5} {'daily r':>8} {'path r':>7}")
        for r in sorted(rows, key=lambda r: (r["made"], r["lag"])):
            dc = f"{r['dailyCorr']:+.2f}" if r["dailyCorr"] is not None else "   —"
            pc = f"{r['pathCorr']:+.2f}" if r["pathCorr"] is not None else "   —"
            print(f"{r['made']:<12} {r['lag']:7.2f} {r['bars']:5d} {r['through']:<12} "
                  f"{r['projPct']:+9.1f}% {r['realPct']:+8.1f}% "
                  f"{'yes' if r['dirRight'] else 'no':>5} {dc:>8} {pc:>7}")
        print()

    print("By cycle, over every elapsed projection:")
    print(f"   {'lag yr':>7} {'n':>4} {'direction':>10} {'daily r':>9} {'path r':>8}")
    by_lag = {}
    for r in rows:
        by_lag.setdefault(r["lag"], []).append(r)
    for lag in sorted(by_lag):
        g = by_lag[lag]
        dirs = 100.0 * sum(1 for r in g if r["dirRight"]) / len(g)
        dc = [r["dailyCorr"] for r in g if r["dailyCorr"] is not None]
        pc = [r["pathCorr"] for r in g if r["pathCorr"] is not None]
        print(f"   {lag:7.2f} {len(g):4d} {dirs:9.0f}% "
              f"{statistics.fmean(dc) if dc else float('nan'):+9.2f} "
              f"{statistics.fmean(pc) if pc else float('nan'):+8.2f}")

    up = 100.0 * sum(1 for r in rows if r["realUp"]) / len(rows)
    allrate = 100.0 * sum(1 for r in rows if r["dirRight"]) / len(rows)
    alldc = [r["dailyCorr"] for r in rows if r["dailyCorr"] is not None]
    print(f"\n   all {len(rows)} projections: direction {allrate:.0f}%, "
          f"mean daily r {statistics.fmean(alldc):+.2f}")
    print(f"   \"always up\" on the same windows: {up:.0f}%")
    if up in (0.0, 100.0):
        print("   Every window scored so far went the same way, so that baseline is")
        print("   degenerate and the comparison means nothing yet. It becomes the number")
        print("   to beat once the record contains both up and down windows.")
    else:
        print("   A direction rate at or below that line is not forecasting anything —")
        print("   it is the market's drift, which a constant guess collects for free.")
    n_made = len(seen)
    print(f"\n   {n_made} distinct forecast date(s) scored. This is a running record, not a")
    print("   result: it needs many more weeks before the per-cycle rows mean anything.")

    if args.archive:
        out = os.path.join(ROOT, "public", "cycles", f"{args.symbol}{args.suffix}_scored.json")
        os.makedirs(os.path.dirname(out), exist_ok=True)
        payload = {
            "symbol": args.symbol,
            "actualThrough": last_day,
            "forecastDates": sorted(seen),
            "alwaysUpRate": round(up, 1),
            "projections": sorted(rows, key=lambda r: (r["made"], r["lag"])),
        }
        with open(out, "w") as fh:
            json.dump(payload, fh, separators=(",", ":"))
        print(f"\n   wrote {os.path.relpath(out, ROOT)} "
              f"({len(rows)} scored projections)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
