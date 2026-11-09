#!/usr/bin/env python3
"""Fetch hourly bars for the symbols the short-term lunar work needs.

Separate from update_prices.py on purpose: that script guarantees a daily
closing series and guards it with `looks_daily`, and hourly rows would break
every one of those invariants. This writes its own files.

Yahoo serves `interval=60m` for roughly the last two years and no further, so
these files are a rolling window, not a history. Two years is about 26 lunar
months, which is enough to test a one-month overlay and nowhere near enough
to test anything annual. Nothing here should be used for the long cycles.

    python3 cycles/fetch_hourly.py                 # ES=F
    python3 cycles/fetch_hourly.py --symbols ES=F,QQQ
    python3 cycles/fetch_hourly.py --dry-run

Each file is cycles/data/<SLUG>_hourly.csv with `ts,open,high,low,close`,
oldest first. `ts` is UTC, ISO-8601 with a trailing Z. OHLC rather than close
alone because the technique being tested is about where the swing turned, and
a turn is a high or a low.
"""
import argparse, csv, json, os, time, urllib.parse, urllib.request
import datetime as dt

HERE = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(HERE, "data")

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
}

SYMBOLS = {
    "ES=F": "E-mini S&P 500 continuous futures",
    "QQQ":  "Invesco QQQ Trust",
    "GC=F": "Gold continuous futures",
}


def slug(symbol):
    return symbol.lstrip("^").replace("=", "_").replace(".", "_")


def fetch(symbol, timeout=60):
    """[(utc_iso, open, high, low, close)] oldest first, gaps dropped."""
    sym = urllib.parse.quote(symbol, safe="")
    url = (f"https://query1.finance.yahoo.com/v8/finance/chart/{sym}"
           f"?interval=60m&range=730d")
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=timeout) as fh:
        data = json.loads(fh.read().decode("utf-8", "replace"))
    result = (data.get("chart") or {}).get("result")
    if not result:
        raise ValueError(f"no chart data ({(data.get('chart') or {}).get('error')})")
    result = result[0]
    stamps = result.get("timestamp") or []
    q = ((result.get("indicators") or {}).get("quote") or [{}])[0]
    rows = []
    for i, ts in enumerate(stamps):
        o, h, l, c = (q.get(k, [None] * len(stamps))[i] for k in ("open", "high", "low", "close"))
        if None in (o, h, l, c):
            continue
        # Yahoo stamps the last bar at the time of the request, mid-hour. Floor
        # every stamp to the hour so a re-run overwrites that bar instead of
        # adding a second copy of it one minute along.
        ts = ts - (ts % 3600)
        stamp = dt.datetime.fromtimestamp(ts, dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        rows.append((stamp, float(o), float(h), float(l), float(c)))
    rows.sort()
    return rows


def merge(path, rows):
    """Union of what is on disk and what came back, keyed by timestamp."""
    have = {}
    if os.path.exists(path):
        with open(path, newline="") as fh:
            for r in csv.DictReader(fh):
                have[r["ts"]] = (r["ts"], float(r["open"]), float(r["high"]),
                                 float(r["low"]), float(r["close"]))
    before = len(have)
    for r in rows:
        have[r[0]] = r
    return sorted(have.values()), before


def write(path, rows):
    tmp = path + ".tmp"
    with open(tmp, "w", newline="") as fh:
        w = csv.writer(fh)
        w.writerow(["ts", "open", "high", "low", "close"])
        for r in rows:
            w.writerow([r[0]] + [f"{v:g}" for v in r[1:]])
    os.replace(tmp, path)


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--symbols", default="ES=F")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    os.makedirs(DATA_DIR, exist_ok=True)
    bad = 0
    for symbol in [s.strip() for s in args.symbols.split(",") if s.strip()]:
        path = os.path.join(DATA_DIR, f"{slug(symbol)}_hourly.csv")
        try:
            fresh = fetch(symbol)
        except Exception as e:                       # noqa: BLE001 - report, keep going
            print(f"{symbol}: fetch failed — {e}")
            bad += 1
            continue
        rows, before = merge(path, fresh)
        span = f"{rows[0][0]} → {rows[-1][0]}" if rows else "empty"
        print(f"{symbol}: {len(fresh)} fetched, {len(rows)} on file (+{len(rows) - before}), {span}")
        if not args.dry_run:
            write(path, rows)
    return 1 if bad else 0


if __name__ == "__main__":
    raise SystemExit(main())
