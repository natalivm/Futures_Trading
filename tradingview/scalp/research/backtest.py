import sys, collections, csv, statistics as st
sys.path.insert(0, '.')
from engine import run
TICKERS = ['AAPL','MSFT','NVDA','AMZN','GOOGL','META','TSLA','AVGO','NFLX','AMD']
KEYS = ('arb','ema','vw','rsi')

def signals(rows, mode):
    out = []; prev = {1: False, -1: False}; fired = set()
    for i, r in enumerate(rows):
        d = r['t'].date()
        for side in (1, -1):
            ok = all(r[k] == side for k in KEYS)
            if mode == 'aplus': ok = ok and r['daily'] == side
            if ok and not prev[side] and (d, side) not in fired:
                out.append((i, side)); fired.add((d, side))
            prev[side] = ok
    return out

def arb_go(rows):
    """First close outside the finished ARB after 15:00; one per day."""
    out = []; fired = set(); prev = 0
    for i, r in enumerate(rows):
        d = r['t'].date(); after = (r['t'].hour, r['t'].minute) >= (15, 0)
        if after and r['arb'] != 0 and prev == 0 and d not in fired and r['arb_hi'] is not None:
            out.append((i, r['arb'])); fired.add(d)
        prev = r['arb'] if after else 0
    return out

def trade(rows, i, side, exit_rule, mins):
    j = i + 1
    if j >= len(rows) or rows[j]['t'].date() != rows[i]['t'].date(): return None
    entry = rows[j]['o']; day = rows[i]['t'].date(); k = j
    while True:
        nxt = k + 1
        last = nxt >= len(rows) or rows[nxt]['t'].date() != day
        r = rows[k]
        if exit_rule == 'ema' and ((side == 1 and r['c'] < r['e9']) or (side == -1 and r['c'] > r['e9'])): break
        if exit_rule == 'time' and (r['t'] - rows[j]['t']).total_seconds() / 60 + mins_per(rows) >= mins: break
        if last: break
        k = nxt
    seg = rows[j:k+1]
    mfe = max((x['h'] - entry) if side == 1 else (entry - x['l']) for x in seg) / entry * 100
    mae = max((entry - x['l']) if side == 1 else (x['h'] - entry) for x in seg) / entry * 100
    return dict(entry_t=rows[j]['t'], exit_t=rows[k]['t'], side=side, entry=entry, exit=rows[k]['c'],
                ret=(rows[k]['c'] - entry) / entry * 100 * side, mfe=mfe, mae=mae)

def mins_per(rows):
    return (rows[1]['t'] - rows[0]['t']).total_seconds() / 60

def stats(trs):
    if not trs: return dict(n=0)
    rets = [t['ret'] for t in trs]; w = [x for x in rets if x > 0]; l = [x for x in rets if x <= 0]
    return dict(n=len(rets), win=len(w) / len(rets) * 100, avg=st.mean(rets), med=st.median(rets),
                pf=(sum(w) / -sum(l)) if l and sum(l) < 0 else float('inf'), tot=sum(rets))

if __name__ == '__main__':
    allrows = {(tk, ch): run(tk, ch) for tk in TICKERS for ch in ('5m', '15m')}
    d0 = min(r['t'] for r in allrows[('AAPL','5m')]).date(); d1 = max(r['t'] for r in allrows[('AAPL','5m')]).date()
    ndays = len({r['t'].date() for r in allrows[('AAPL','5m')]})
    print(f'Period {d0} → {d1} ({ndays} sessions), {len(TICKERS)} tickers\n')
    log = []
    hdr = f"{'setup':34} {'exit':12} {'n':>4} {'win%':>6} {'avg%':>7} {'med%':>7} {'PF':>5} {'sum%':>7}"
    print(hdr); print('-' * len(hdr))
    for name, ch, gen in [('4 of 4 · 5m chart', '5m', lambda r: signals(r, 'all4')),
                          ('4 of 4 · 15m chart', '15m', lambda r: signals(r, 'all4')),
                          ('A+ (4/4 + daily) · 5m chart', '5m', lambda r: signals(r, 'aplus')),
                          ('A+ (4/4 + daily) · 15m chart', '15m', lambda r: signals(r, 'aplus')),
                          ('ARB GO after 15:00 · 5m chart', '5m', arb_go)]:
        for ex, mins, lab in [('time', 30, '30 min'), ('ema', 0, '9 EMA close'), ('eod', 0, 'end of day')]:
            trs = []
            for tk in TICKERS:
                rows = allrows[(tk, ch)]
                for i, side in gen(rows):
                    t = trade(rows, i, side, ex, mins)
                    if t: t.update(tk=tk, setup=name, exit_rule=lab); trs.append(t)
            for sub, f in [('', lambda t: True), (' · long', lambda t: t['side'] == 1), (' · short', lambda t: t['side'] == -1)]:
                s = stats([t for t in trs if f(t)])
                if s['n'] == 0: continue
                if sub and ex != 'eod': continue
                print(f"{name + sub:34} {lab:12} {s['n']:4d} {s['win']:6.1f} {s['avg']:7.3f} {s['med']:7.3f} {s['pf']:5.2f} {s['tot']:7.2f}")
            log += trs
        print()
    with open('trades.csv', 'w', newline='') as f:
        w = csv.DictWriter(f, fieldnames=['setup','exit_rule','tk','side','entry_t','exit_t','entry','exit','ret','mfe','mae'])
        w.writeheader(); [w.writerow({k: t[k] for k in w.fieldnames}) for t in log]
