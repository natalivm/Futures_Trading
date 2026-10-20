"""Download the Yahoo Finance bars backtest.py reads into data/: 60 days of 5m and 15m, 2 years of daily."""
import os, sys, urllib.request

TICKERS = sys.argv[1:] or ['AAPL', 'MSFT', 'NVDA', 'AMZN', 'GOOGL', 'META', 'TSLA', 'AVGO', 'NFLX', 'AMD']
SPECS = [('5m', '60d'), ('15m', '60d'), ('1d', '2y')]

os.makedirs('data', exist_ok=True)
for t in TICKERS:
    for iv, rng in SPECS:
        url = f'https://query1.finance.yahoo.com/v8/finance/chart/{t}?interval={iv}&range={rng}&includePrePost=false'
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=30) as r, open(f'data/{t}_{iv}.json', 'wb') as f:
            f.write(r.read())
    print(t, 'ok')
