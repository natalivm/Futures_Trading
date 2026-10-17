# Futures Desk

Live Matrixchannel @ES chart streams with a buy/sell decision checklist and a signal log.

- **Live desk** — the three streams (4H·5m, 1D·5m, 1W·60m) in large tabs (keys `1` `2` `3`, `F` for focus mode), with the decision panel beside them: direction, setup, checklist, stop/target/R:R and a BUY / SELL / WAIT verdict.
- **Signal log** — every logged decision with the full chart observation, the hourly context and the plan. Fill in the result later; export CSV/JSON as the dataset for a future indicator.
- **Rules** — how and when to buy or sell under the method.

Data is saved in the browser (localStorage). Export regularly.

Streams and method: [Trade Forecast Mastery — Matrixchannel Indicator](https://tradeforecastmastery.com/matrixchannel-indicator-info).

```bash
npm install
npm run dev
```

Deployed to GitHub Pages on every push to `main`.
