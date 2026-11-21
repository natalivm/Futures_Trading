#!/usr/bin/env python3
"""Grade the pre-registered calls in cycles/calls.json.

The journal's standing complaint about every forecast it has scored is that
none of them said what would prove them wrong. This file is the fix, applied
to ourselves as well: a call is written down with its levels and its dates
BEFORE its window opens, and from then on it is graded mechanically. Nothing
here reads prose or exercises judgement, which is the point — a check that
needs interpreting is a check that can be reinterpreted afterwards.

Four primitives cover what the forecasts on this record actually assert:

  close_below / close_above  a level, at any close on or before a date
  net_change                 the sign of the move from a level to a date
  turn_on                    a swing turn of the named kind on a date, ±tol

Each check carries a role. A `prediction` is the forecast proper. A
`confirmation` is a level that would settle it early. An `invalidation` is the
line that voids it — and it is scored like everything else, so a call whose
invalidation tripped cannot quietly be remembered as merely early.

    python3 cycles/score_calls.py
    python3 cycles/score_calls.py --json      # for the site

Stdlib only.
"""
import argparse, bisect, csv, datetime as dt, json, os

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
DATA_DIR = os.path.join(HERE, "data")


def load(symbol):
    with open(os.path.join(DATA_DIR, f"{symbol}.csv"), newline="") as fh:
        rows = list(csv.DictReader(fh))
    return [r["date"] for r in rows], [float(r["close"]) for r in rows]


def load_intraday(symbol, tz_offset=4):
    """Daily highs and lows rebuilt from the hourly file, or None if absent.

    A forecast read off an hourly chart names intraday turns, so scoring it on
    closes asks it a different question than the one it answered. Which basis
    is used changes the answer — see the journal — so the basis is recorded on
    the call and printed with the result rather than chosen silently."""
    path = os.path.join(DATA_DIR, f"{symbol}_hourly.csv")
    if not os.path.exists(path):
        return None
    day = {}
    with open(path, newline="") as fh:
        for r in csv.DictReader(fh):
            t = dt.datetime.strptime(r["ts"], "%Y-%m-%dT%H:%M:%SZ") - dt.timedelta(hours=tz_offset)
            d = t.date().isoformat()
            h, l = float(r["high"]), float(r["low"])
            day[d] = (max(day[d][0], h), min(day[d][1], l)) if d in day else (h, l)
    ds = sorted(day)
    return ds, [day[d][0] for d in ds], [day[d][1] for d in ds]


def window(dates, made, by):
    """Index range strictly after the call was made, up to and including `by`."""
    lo = bisect.bisect_right(dates, made)
    hi = bisect.bisect_right(dates, by) - 1
    return lo, hi


def turns(closes, k=3):
    hi, lo = set(), set()
    for i in range(k, len(closes) - k):
        w = closes[i - k:i + k + 1]
        if closes[i] == max(w):
            hi.add(i)
        elif closes[i] == min(w):
            lo.add(i)
    return hi, lo


def turns_ohlc(highs, lows, k=3):
    hi, lo = set(), set()
    for i in range(k, len(highs) - k):
        if all(highs[j] <= highs[i] for j in range(i - k, i)) and \
           all(highs[j] < highs[i] for j in range(i + 1, i + k + 1)):
            hi.add(i)
        elif all(lows[j] >= lows[i] for j in range(i - k, i)) and \
             all(lows[j] > lows[i] for j in range(i + 1, i + k + 1)):
            lo.add(i)
    return hi, lo


def grade(check, dates, closes, made, last_day, intraday=None):
    """-> (status, detail). status is hit / missed / pending / no-data."""
    by = check.get("by") or check.get("date")
    if by is None:
        return "no-data", "no date on the check"
    lo, hi = window(dates, made, by)
    elapsed = last_day >= by
    kind = check["type"]

    if kind in ("close_below", "close_above"):
        level = check["level"]
        want = check.get("expect", True)
        seg = closes[lo:hi + 1]
        if not seg:
            return "pending", "no sessions yet"
        happened = (min(seg) < level) if kind == "close_below" else (max(seg) > level)
        where = None
        for i in range(lo, hi + 1):
            if (closes[i] < level) if kind == "close_below" else (closes[i] > level):
                where = dates[i]
                break
        if happened:
            # The event settles the check the moment it occurs, either way.
            return ("hit" if want else "missed", f"{where} ({'below' if kind=='close_below' else 'above'} {level:,.2f})")
        if not elapsed:
            return "pending", f"not yet, {len(seg)} sessions in"
        return ("missed" if want else "hit", f"never through {by}")

    if kind == "net_change":
        if not elapsed:
            return "pending", f"resolves {by}"
        if hi < lo:
            return "no-data", "no sessions in window"
        end = closes[hi]
        up = end > check["from"]
        want_up = check.get("expect", "up") == "up"
        return ("hit" if up == want_up else "missed",
                f"{dates[hi]} {end:,.2f} ({'up' if up else 'down'} from {check['from']:,.2f})")

    if kind == "turn_on":
        tol = int(check.get("tol", 1))
        want_high = check["turn"] == "high"
        i = bisect.bisect_left(dates, check["date"])
        if i >= len(dates):
            return "pending", "date not reached"
        if last_day < check["date"]:
            return "pending", f"resolves {check['date']}"
        if intraday:
            ds, hh, ll = intraday
            i = bisect.bisect_left(ds, check["date"])
            hs, ls = turns_ohlc(hh, ll)
            labels = ds
        else:
            hs, ls = turns(closes)
            labels = dates
        tgt = hs if want_high else ls
        near = [j for j in range(i - tol, i + tol + 1) if j in tgt]
        if near:
            j = min(near, key=lambda j: abs(j - i))
            gap = "same session" if j == i else f"{abs(j-i)} session(s) {'late' if j>i else 'early'}"
            return "hit", f"{labels[j]}, {gap}"
        return "missed", f"no {check['turn']} within {tol} session(s)"

    return "no-data", f"unknown check type {kind}"


MARK = {"hit": "✓", "missed": "✗", "pending": "·", "no-data": "?"}


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--file", default=os.path.join(HERE, "calls.json"))
    ap.add_argument("--json", action="store_true", help="write public/cycles/calls_scored.json")
    args = ap.parse_args()

    with open(args.file) as fh:
        reg = json.load(fh)

    out = []
    for call in reg["calls"]:
        dates, closes = load(call["symbol"])
        last_day = dates[-1]
        basis = call.get("basis", "close")
        intraday = load_intraday(call["symbol"]) if basis == "intraday" else None
        if basis == "intraday" and intraday is None:
            basis = "close (no hourly file)"
        rows = []
        for ch in call["checks"]:
            status, detail = grade(ch, dates, closes, call["made"], last_day, intraday)
            rows.append({**ch, "status": status, "detail": detail})
            # A turn call scored both ways, because the two disagree and
            # picking one quietly would be the thing this file exists to stop.
            if ch["type"] == "turn_on" and intraday is not None:
                alt, altd = grade(ch, dates, closes, call["made"], last_day, None)
                rows[-1]["altBasis"] = {"basis": "close", "status": alt, "detail": altd}
        preds = [r for r in rows if r["role"] == "prediction"]
        done = [r for r in preds if r["status"] in ("hit", "missed")]
        score = f"{sum(1 for r in done if r['status']=='hit')} of {len(done)}" if done else "open"
        voided = any(r["role"] == "invalidation" and r["status"] == "missed" for r in rows)
        alt_done = [r for r in preds if r.get("altBasis", {}).get("status") in ("hit", "missed")]
        alt_score = (f"{sum(1 for r in alt_done if r['altBasis']['status']=='hit')} of {len(alt_done)}"
                     if alt_done else None)
        out.append({**{k: v for k, v in call.items() if k != "checks"},
                    "checks": rows, "score": score, "altScore": alt_score,
                    "basis": basis, "voided": voided, "pricesThrough": last_day})

        print(f"\n{call['made']}  {call['symbol']}  — {call['by']}   [basis: {basis}]")
        print(f"  {call['summary']}")
        for r in rows:
            tag = r["role"][:4]
            print(f"   {MARK[r['status']]} [{tag}] {r['desc']}")
            print(f"       {r['status']}: {r['detail']}")
            if r.get("altBasis"):
                a = r["altBasis"]
                print(f"       on closes: {a['status']} — {a['detail']}")
        print(f"   predictions scored: {score}"
              + (f"   (on closes: {alt_score})" if alt_score and alt_score != score else "")
              + ("   — INVALIDATION TRIPPED" if voided else ""))

    print(f"\n{len(out)} call(s) on the register. A call is graded from the file it was")
    print("written into; nothing here re-reads what anyone meant.")

    if args.json:
        p = os.path.join(ROOT, "public", "cycles", "calls_scored.json")
        os.makedirs(os.path.dirname(p), exist_ok=True)
        with open(p, "w") as fh:
            json.dump({"calls": out}, fh, separators=(",", ":"))
        print(f"wrote {os.path.relpath(p, ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
