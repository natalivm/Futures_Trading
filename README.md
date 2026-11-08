# Futures Desk

A landing page over two halves of the same desk: the live Matrixchannel @ES charts where trades are decided, and the knowledge base that holds the Market Forecast Mastery course behind them.

- **Home** — the landing page: Futures trading on one side, Knowledge base on the other, with quick links to the log and the rules.
- **Knowledge base** — Market Forecast Mastery (Gann · Baumring · Reminick) — the premise, the two ways to forecast, the three techniques (series & sequences, the Slide Technique, Momentum Balance), and the Matrixchannel/risk/journal sections. Articles live in `src/lib/kb.ts`: add a `KbArticle` to a category's `articles` array and it appears on the page.
- **Live desk** — the three streams (4H·5m, 1D·5m, 1W·60m) in large tabs (keys `1` `2` `3`, `F` for focus mode), with the decision panel beside them: direction, setup, checklist, stop/target/R:R and a BUY / SELL / WAIT verdict.
- **Signal log** — every logged decision with the full chart observation, the hourly context and the plan. Fill in the result later; export CSV/JSON as the dataset for a future indicator.
- **Rules** — how and when to buy or sell under the method.
- **AI check** — snapshots of the live charts are sent to Claude (via a small Cloudflare Worker in `worker/`) for a buy / sell / wait reading against the rules, on demand or at scheduled times. Setup: [docs/AI_SETUP.md](docs/AI_SETUP.md).

Data is saved in the browser (localStorage). Export regularly.

Streams and method: [Trade Forecast Mastery — Matrixchannel Indicator](https://tradeforecastmastery.com/matrixchannel-indicator-info).

```bash
npm install
npm run dev
```

The site deploys to GitHub Pages on every push to `main`; the AI server deploys from `worker/` once its secrets are set.
