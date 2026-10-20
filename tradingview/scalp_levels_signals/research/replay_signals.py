"""Replay the Scalp Levels signal rules on real 5m bars, to check them against the original's charts.

Python port of the SELL/BUY confluence, the 10-min RSI move stars and the T1/T2/T3 target stars in
../scalp_levels.pine, with the settings the script ships with:
  - RSI move: 10-min RSI(14), start below 40 / tag 30 / exhaust 25 (buy side mirrored around 50),
    carried over from the previous session; each 10m value lands on the last 5m bar of its 10m bar
  - SELL/BUY: the first 5m bar of an active move where 5m RSI(14) < 40 (> 60), the close is beyond the
    opening range (9:30-9:45) or beyond the last ARB (13:30-15:00) *after crossing it today*, the close
    is beyond the 9 EMA, and price is below (above) VWAP; once per move
  - stars only for moves that produced a SELL/BUY; targets = next levels past the signal's close

Usage:
  python3 replay_signals.py                 # downloads 1 month of 5m bars into data/ if missing
  python3 replay_signals.py TSLA 2026-10-16

Expected for 16 Oct 2026 (all matched the original's markers):
  TSLA  SELL 11:05, 11:45 · ✸ 11:35 · ★ 13:05 · ✸ 13:25 · ★ 15:45
  CVX   BUY 12:30 · ★ 12:55
  MSFT  SELL 9:35, 10:05, 10:25, 10:55 · ✸ 9:45, 10:15, 10:35, 13:35 · T1 Complete 535.02 @ 10:30 ·
        ★ 11:05 (T1 of the 10:55 SELL), 11:25 (tag), 15:45
"""
import datetime as dt, json, os, sys, urllib.request
from zoneinfo import ZoneInfo

NY = ZoneInfo("America/New_York")
# levels on the original's charts that day (16 Oct 2026)
LEVELS = {
    "MSFT": [539.53, 543.16, 544.98, 553.72, 536.30, 534.70, 532.89, 528.77],
    "TSLA": [384.74, 386.50, 388.17, 390.04, 380.80, 379.31, 377.64, 373.30],
    "GOOGL": [352.00, 353.22, 354.61, 357.00, 349.62, 348.40, 347.01, 344.69],
    "NFLX": [71.46, 72.09, 72.36, 73.76, 71.02, 70.34, 70.07, 69.18],
    "CVX": [],
}


def load(sym):
    path = f"data/{sym}_5m.json"
    if not os.path.exists(path):
        os.makedirs("data", exist_ok=True)
        url = f"https://query1.finance.yahoo.com/v8/finance/chart/{sym}?interval=5m&range=1mo&includePrePost=false"
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=30) as r, open(path, "wb") as f:
            f.write(r.read())
    r = json.load(open(path))["chart"]["result"][0]
    q = r["indicators"]["quote"][0]
    bars = []
    for i, t in enumerate(r["timestamp"]):
        if q["close"][i] is None:
            continue
        d = dt.datetime.fromtimestamp(t, NY)
        bars.append(dict(t=t, d=d.date(), hm=d.hour * 100 + d.minute, o=q["open"][i], h=q["high"][i],
                         l=q["low"][i], c=q["close"][i], v=q["volume"][i] or 0))
    return bars


def rsi(closes, n=14):
    out, g, l = [None] * len(closes), 0.0, 0.0
    for i in range(1, len(closes)):
        ch = closes[i] - closes[i - 1]
        up, dn = max(ch, 0), max(-ch, 0)
        if i <= n:
            g += up
            l += dn
            if i == n:
                g, l = g / n, l / n
                out[i] = 100 - 100 / (1 + g / l) if l else 100
        else:
            g, l = (g * (n - 1) + up) / n, (l * (n - 1) + dn) / n
            out[i] = 100 - 100 / (1 + g / l) if l else 100
    return out


class Move:
    """One side's 10-min RSI move; x is RSI for sells, 100 - RSI for buys."""

    def __init__(self):
        self.state, self.armed, self.rebroke, self.prev, self.id, self.fired_id = 0, False, False, None, 0, -1

    def step(self, x, entry=40, tag=30, arm=25):
        s, ev = self.state, []
        if s == 0 and self.prev is not None and self.prev >= entry and x < entry:
            ev.append("start")
            self.state, self.id = 1, self.id + 1
        if self.state == 1:
            if x <= tag:
                ev.append("★ tagged")
                self.state, self.armed = 2, x <= arm
            elif s == 1 and x >= entry:
                ev.append("✸ complete")
                self.state = 0
        elif s == 2:
            if x <= arm:
                self.armed = True
            if self.armed and x >= tag:
                ev.append("✸ exhausted")
                self.state, self.armed, self.rebroke = 3, False, False
            elif x >= entry:
                ev.append("✸ complete")
                self.state, self.armed = 0, False
        elif s == 3:
            if x < tag:
                self.rebroke = True
            if x >= entry:
                ev.append("★ solid complete" if self.rebroke else "✸ complete")
                self.state, self.rebroke = 0, False
        self.prev = x
        return [(e, self.id) for e in ev]

    def can_fire(self):
        return self.state >= 1 and self.fired_id != self.id


def replay(sym, day):
    B = load(sym)
    levels = LEVELS.get(sym, [])
    r5 = rsi([b["c"] for b in B])
    ema = None
    for i, b in enumerate(B):
        ema = b["c"] if ema is None else 0.2 * b["c"] + 0.8 * ema   # EMA(9)
        b["ema"], b["r5"] = ema, r5[i] if r5[i] is not None else 50
    # 10m bars from pairs of 5m bars; each value lands on the 10m bar's last 5m bar
    groups = {}
    for i, b in enumerate(B):
        groups.setdefault(b["t"] - b["t"] % 600, []).append(i)
    keys = sorted(groups)
    r10 = rsi([B[groups[k][-1]]["c"] for k in keys])
    land = {groups[k][-1]: r10[j] for j, k in enumerate(keys)}

    sell, buy = Move(), Move()
    cur = arb = arb_build = tgt = None
    pv = vv = 0.0
    orb = [None, None]
    dn = up = 0
    in_lo = in_hi = False          # a close inside the ARB since the day / ARB started
    out = []
    for i, b in enumerate(B):
        if b["d"] != cur:
            cur, pv, vv, orb, in_lo, in_hi = b["d"], 0.0, 0.0, [None, None], False, False
            tgt = None
        tp = (b["h"] + b["l"] + b["c"]) / 3
        pv, vv = pv + tp * b["v"], vv + b["v"]
        vwap = pv / vv if vv else b["c"]
        in_orb, in_arb = 930 <= b["hm"] < 945, 1330 <= b["hm"] < 1500
        if in_orb:
            orb = [max(orb[0] or -1e9, b["h"]), min(orb[1] or 1e9, b["l"])]
        if in_arb:
            arb_build = [b["h"], b["l"]] if b["hm"] == 1330 else [max(arb_build[0], b["h"]), min(arb_build[1], b["l"])]
        elif arb_build and 1500 <= b["hm"] < 1505:
            arb, in_lo, in_hi = list(arb_build), False, False
        dn = dn + 1 if b["c"] < b["ema"] else 0
        up = up + 1 if b["c"] > b["ema"] else 0
        orb_done = not in_orb and orb[0] is not None
        brk_dn = (orb_done and b["c"] < orb[1]) or (arb is not None and b["c"] < arb[1] and in_lo)
        brk_up = (orb_done and b["c"] > orb[0]) or (arb is not None and b["c"] > arb[0] and in_hi)
        if arb is not None:
            in_lo = in_lo or b["c"] >= arb[1]
            in_hi = in_hi or b["c"] <= arb[0]
        sell_c = b["r5"] < 40 and brk_dn and dn >= 1 and b["c"] < vwap
        buy_c = b["r5"] > 60 and brk_up and up >= 1 and b["c"] > vwap

        marks = []
        # targets of the latest signal, checked from the bar after it
        if tgt:
            side, lv, k = tgt
            while k < len(lv) and ((side == "s" and b["l"] <= lv[k]) or (side == "b" and b["h"] >= lv[k])):
                marks.append(f"T{k + 1} Complete: {b['c']:.2f} (level {lv[k]})")
                k += 1
            tgt = (side, lv, k)
        ev_s = ev_b = []
        if i in land and land[i] is not None:
            ev_s, ev_b = sell.step(land[i]), buy.step(100 - land[i])
        if sell.can_fire() and sell_c:
            sell.fired_id = sell.id
            marks.append("SELL")
            tgt = ("s", sorted([x for x in levels if x < b["c"]], reverse=True)[:3], 0)
        if buy.can_fire() and buy_c:
            buy.fired_id = buy.id
            marks.append("BUY")
            tgt = ("b", sorted([x for x in levels if x > b["c"]])[:3], 0)
        marks += ["sell " + e for e, mid in ev_s if e != "start" and mid == sell.fired_id]
        marks += ["buy " + e for e, mid in ev_b if e != "start" and mid == buy.fired_id]
        if b["d"] == day and marks:
            out.append(f"{b['hm'] // 100:02d}:{b['hm'] % 100:02d}  " + " | ".join(marks))
    return out


if __name__ == "__main__":
    cases = [(sys.argv[1], dt.date.fromisoformat(sys.argv[2]))] if len(sys.argv) > 2 else \
        [(s, dt.date(2026, 10, 16)) for s in ("TSLA", "CVX", "MSFT")]
    for sym, day in cases:
        print(f"== {sym} {day}")
        for line in replay(sym, day):
            print("  ", line)
