"""Python port of the A+ dashboard logic, emulating what the live indicator shows at each bar close."""
import sys, collections
sys.path.insert(0, '.')
from dl import bars

def ema_series(xs, n):
    a = 2 / (n + 1); out = []; e = None
    for x in xs:
        e = x if e is None else a * x + (1 - a) * e; out.append(e)
    return out

def rsi_series(xs, n=14):
    out = [None] * len(xs); ag = al = 0.0
    for i in range(1, len(xs)):
        g = max(xs[i] - xs[i-1], 0); l = max(xs[i-1] - xs[i], 0)
        if i <= n:
            ag += g / n; al += l / n
            if i == n: out[i] = 100 - 100 / (1 + ag / al) if al else 100
        else:
            ag = (ag * (n-1) + g) / n; al = (al * (n-1) + l) / n
            out[i] = 100 - 100 / (1 + ag / al) if al else 100
    return out

def hm(t): return (t.hour, t.minute)

def run(tk, chart='5m', ema_tf_min=15, ema_len=9, rsi_lo=40, rsi_hi=60, streak_min=3):
    m5 = bars(tk, '5m'); ch = bars(tk, chart); d = bars(tk, '1d')
    # daily lower/higher-close streak as of each date (completed days only)
    dclose = {b[0].date(): b[4] for b in d}; ddates = sorted(dclose)
    streak = {}
    for k, day in enumerate(ddates):
        s = 0; j = k - 1
        if j >= 1:
            sign = 1 if dclose[ddates[j]] > dclose[ddates[j-1]] else -1
            while j >= 1 and (dclose[ddates[j]] > dclose[ddates[j-1]]) == (sign == 1) and dclose[ddates[j]] != dclose[ddates[j-1]]:
                s += sign; j -= 1
        streak[day] = s
    # ARB (13:30-15:00) completed ranges by date, and running range per 5m bar
    arb = {}
    for b in m5:
        if (13, 30) <= hm(b[0]) < (15, 0):
            h, l = arb.get(b[0].date(), (-1e18, 1e18)); arb[b[0].date()] = (max(h, b[2]), min(l, b[3]))
    arb_days = sorted(arb)
    # 15m (ema_tf) bars for the 2-candle rule, built from 5m
    grp = collections.OrderedDict()
    for b in m5:
        t = b[0]; key = (t.date(), (t.hour * 60 + t.minute - 570) // ema_tf_min)
        g = grp.get(key)
        grp[key] = (b[0], b[1], b[2], b[3], b[4]) if g is None else (g[0], g[1], max(g[2], b[2]), min(g[3], b[3]), b[4])
    keys = list(grp); c15 = [grp[k][4] for k in keys]; e15 = ema_series(c15, ema_len)
    idx15 = {k: i for i, k in enumerate(keys)}
    a = 2 / (ema_len + 1)
    c = [b[4] for b in ch]; rs = rsi_series(c); e9 = ema_series(c, 9)
    rows = []; cv = vv = 0.0; last_day = None
    for i, b in enumerate(ch):
        t = b[0]; day = t.date()
        if day != last_day: cv = vv = 0.0; last_day = day
        cv += (b[2] + b[3] + b[4]) / 3 * b[5]; vv += b[5]; vwap = cv / vv if vv else b[4]
        close = b[4]
        bar_end_min = t.hour * 60 + t.minute + (5 if chart == '5m' else 15)
        # ARB: finished window = any earlier day, or today once 15:00 has passed
        done = [x for x in arb_days if x < day or (x == day and bar_end_min > 15 * 60)]
        forming = 13 * 60 + 30 < bar_end_min <= 15 * 60
        if forming or not done: arb_dir = 0; ah = al_ = None
        else:
            ah, al_ = arb[done[-1]]; arb_dir = 1 if close > ah else -1 if close < al_ else 0
        # 2-candle EMA on the chart TF: live side + last two closed candles on that side
        ab1 = close > e9[i]
        if i < 2: ema_dir = 0
        else:
            c1 = c[i-1] > e9[i-1]; c2 = c[i-2] > e9[i-2]
            ema_dir = 1 if ab1 and c1 and c2 else -1 if (not ab1 and not c1 and not c2) else 0
        vw_dir = 1 if close > vwap else -1 if close < vwap else 0
        r1 = rs[i-1] if i else None
        rsi_dir = 0 if r1 is None else 1 if r1 > rsi_hi else -1 if r1 < rsi_lo else 0
        st = streak.get(day, 0); day_dir = 1 if st >= streak_min else -1 if st <= -streak_min else 0
        rows.append(dict(t=t, o=b[1], h=b[2], l=b[3], c=close, vwap=vwap, arb=arb_dir, arb_hi=ah, arb_lo=al_,
                         ema=ema_dir, ema_above=ab1, vw=vw_dir, rsi=rsi_dir, rsi1=r1, daily=day_dir, streak=st, e9=e9[i]))
    return rows
