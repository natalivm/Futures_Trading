#!/usr/bin/env python3
"""
Fetch daily closing prices for the major indexes, crude and gold, and keep
cycles/data/*.csv up to date.

No external dependencies — standard library only, same approach as the
IsItaBUY_helper price updater.

Two sources, used in this order:
  1. Stooq  — long history (DJIA back to 1896, S&P back to 1789 as a spliced
              series). This is what makes 60-year cycle work possible at all;
              Yahoo only serves ^DJI from 1992.
  2. Yahoo  — the last few sessions, to top the file up with today's close.

Usage:
    python3 cycles/update_prices.py                 # update every index
    python3 cycles/update_prices.py --symbols ^DJI,^GSPC
    python3 cycles/update_prices.py --source yahoo  # skip the long-history pull
    python3 cycles/update_prices.py --dry-run       # fetch and report, write nothing

Each file is cycles/data/<SLUG>.csv with a `date,close` header, one row per
trading day, oldest first. Close only: the cycle work compares closing series,
and OHLC would triple the size of a 33,000-row file in git.
"""

import argparse
import csv
import io
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(HERE, "data")

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
}

# symbol -> (display name, stooq code or None)
# Commodities are here because the cycles the course demonstrates are
# market-specific: 60 and 78.5 years are equity cycles, 17 and 19 belong to
# crude, 24.5 to gold. A cycle is a property of a market, not of time.
INDEXES = {
    "^DJI":  ("Dow Jones Industrial Average", "^dji"),
    "^GSPC": ("S&P 500", "^spx"),
    "^IXIC": ("Nasdaq Composite", "^ndq"),
    "^NDX":  ("Nasdaq 100", "^ndx"),
    "^RUT":  ("Russell 2000", "^rut"),
    "ES=F":  ("E-mini S&P 500 continuous futures", "es.f"),
    "CL=F":  ("WTI crude oil continuous futures", "cl.f"),
    "GC=F":  ("Gold continuous futures", "gc.f"),
}


def slug(symbol):
    """^DJI -> DJI, ES=F -> ES_F. The file name, and the id the web app uses."""
    return symbol.lstrip("^").replace("=", "_").replace(".", "_")


def _get(url, timeout=30):
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=timeout) as fh:
        return fh.read().decode("utf-8", "replace")


# ── Sources ──

# Stooq serves the same CSV from two hosts, and rate-limits by IP. A shared
# runner can be over the limit on one and fine on the other.
STOOQ_HOSTS = ("https://stooq.com", "https://stooq.pl")


def fetch_stooq(code):
    """Full daily history from Stooq. Returns [(YYYY-MM-DD, close)] oldest first."""
    problems = []
    text = None
    for host in STOOQ_HOSTS:
        try:
            body = _get(f"{host}/q/d/l/?s={code}&i=d")
        except Exception as e:                      # noqa: BLE001 - try the other host
            problems.append(f"{host}: {e}")
            continue
        if body.lstrip().lower().startswith("date"):
            text = body
            break
        # Stooq answers 200 with a plain-text refusal, so the body is the error.
        problems.append(f"{host}: {body.strip()[:120]!r}")
    if text is None:
        raise ValueError("; ".join(problems) or "no response")
    rows = []
    for row in csv.DictReader(io.StringIO(text)):
        close = row.get("Close")
        date = row.get("Date")
        if not date or close in (None, "", "N/A"):
            continue
        try:
            rows.append((date, float(close)))
        except ValueError:
            continue
    rows.sort()
    return rows


def fetch_yahoo(symbol, period1=None):
    """Daily history from Yahoo's chart API. Returns [(YYYY-MM-DD, close)] oldest first.

    `period1=None` asks for `range=max` rather than a start timestamp. Unix
    time starts in 1970, so `period1=0` is not "everything" — it is "since
    1970", and it quietly cut the S&P 500 off at 1970 when its history runs
    back to 1927. There is no timestamp that means "the beginning"; the range
    parameter is the only way to ask for it.
    """
    sym = urllib.parse.quote(symbol, safe="")
    window = ("range=max" if period1 is None
              else f"period1={int(period1)}&period2={int(time.time()) + 86400}")
    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{sym}?{window}&interval=1d"
    data = json.loads(_get(url))
    result = (data.get("chart") or {}).get("result")
    if not result:
        err = (data.get("chart") or {}).get("error")
        raise ValueError(f"no chart data ({err})")
    result = result[0]
    stamps = result.get("timestamp") or []
    quote = (result.get("indicators") or {}).get("quote") or [{}]
    closes = quote[0].get("close") or []
    rows = []
    for ts, close in zip(stamps, closes):
        if close is None:
            continue
        rows.append((time.strftime("%Y-%m-%d", time.gmtime(ts)), float(close)))
    rows.sort()
    return rows


# ── Storage ──

def load_csv(path):
    if not os.path.exists(path):
        return []
    with open(path, newline="") as fh:
        reader = csv.reader(fh)
        header = next(reader, None)
        if header and header[0].lower() != "date":   # headerless legacy file
            fh.seek(0)
            reader = csv.reader(fh)
        rows = []
        for row in reader:
            if len(row) < 2:
                continue
            try:
                rows.append((row[0], float(row[1])))
            except ValueError:
                continue
    rows.sort()
    return rows


def save_csv(path, rows):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    tmp = path + ".tmp"
    with open(tmp, "w", newline="") as fh:
        fh.write("date,close\n")
        for date, close in rows:
            fh.write(f"{date},{f'{close:.4f}'.rstrip('0').rstrip('.')}\n")
    os.replace(tmp, path)


def merge(*series):
    """Later series win on a date collision — Yahoo's fresh close beats a stale Stooq row."""
    out = {}
    for rows in series:
        for date, close in rows:
            out[date] = close
    return sorted(out.items())


# ── Update ──

def update_symbol(symbol, source, dry_run):
    name, stooq_code = INDEXES[symbol]
    path = os.path.join(DATA_DIR, f"{slug(symbol)}.csv")
    existing = load_csv(path)
    pulled, problems = [], []

    if source in ("both", "stooq") and stooq_code:
        try:
            rows = fetch_stooq(stooq_code)
            pulled.append(rows)
            print(f"  stooq: {len(rows)} rows ({rows[0][0]} → {rows[-1][0]})" if rows else "  stooq: empty")
        except Exception as e:
            problems.append(f"stooq {stooq_code}: {e}")

    if source in ("both", "yahoo"):
        # Only the recent tail is needed when we already hold history.
        period1 = None if not existing and not pulled else time.time() - 120 * 86400
        try:
            rows = fetch_yahoo(symbol, period1)
            pulled.append(rows)
            print(f"  yahoo: {len(rows)} rows ({rows[0][0]} → {rows[-1][0]})" if rows else "  yahoo: empty")
        except Exception as e:
            problems.append(f"yahoo {symbol}: {e}")

    for p in problems:
        print(f"  ! {p}")
    if not pulled:
        return False, f"{symbol}: no source answered"

    merged = merge(existing, *pulled)
    added = len(merged) - len(existing)
    changed = merged != existing
    span = f"{merged[0][0]} → {merged[-1][0]}" if merged else "empty"
    print(f"  {name}: {len(merged)} rows ({span}), {added:+d} new")

    if changed and not dry_run:
        save_csv(path, merged)
    return changed, None


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--symbols", help="comma-separated subset, e.g. ^DJI,^GSPC")
    ap.add_argument("--source", choices=["both", "stooq", "yahoo"], default="both")
    ap.add_argument("--dry-run", action="store_true", help="fetch and report, write nothing")
    args = ap.parse_args()

    symbols = [s.strip() for s in args.symbols.split(",")] if args.symbols else list(INDEXES)
    unknown = [s for s in symbols if s not in INDEXES]
    if unknown:
        ap.error(f"unknown symbol(s): {', '.join(unknown)}. Known: {', '.join(INDEXES)}")

    failures, changes = [], 0
    for symbol in symbols:
        print(f"\n{symbol}")
        try:
            changed, err = update_symbol(symbol, args.source, args.dry_run)
        except Exception as e:                      # noqa: BLE001 - report and carry on
            changed, err = False, f"{symbol}: {e}"
        if err:
            failures.append(err)
        changes += bool(changed)

    print(f"\n{changes} file(s) {'would change' if args.dry_run else 'updated'}.")
    if failures:
        print("Failed:")
        for f in failures:
            print(f"  - {f}")
    # Partial success is still success: one dead source should not fail the nightly run.
    return 1 if failures and changes == 0 else 0


if __name__ == "__main__":
    sys.exit(main())
