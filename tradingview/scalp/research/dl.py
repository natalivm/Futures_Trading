import json, datetime as dt
from zoneinfo import ZoneInfo
NY=ZoneInfo('America/New_York')
def bars(t,iv,rth=True):
    r=json.load(open(f'data/{t}_{iv}.json'))['chart']['result'][0]; q=r['indicators']['quote'][0]; out=[]
    for i,ts in enumerate(r['timestamp']):
        if q['close'][i] is None: continue
        d=dt.datetime.fromtimestamp(ts,NY)
        if rth and iv!='1d' and not ((9,30)<=(d.hour,d.minute)<(16,0)): continue
        out.append((d,q['open'][i],q['high'][i],q['low'][i],q['close'][i],q['volume'][i] or 0))
    return out
