# Scalp Levels + signals (rebuilt)

A Pine Script v6 indicator rebuilt from screenshots of the original's charts and tooltips, then checked against real 5m data. This is **not** the original source code.

This is a separate, extended build of the levels indicator. The simpler `../scalp/scalp_levels.pine` (levels and ⚠ markers only) is left as it was.

| File | What it is |
|---|---|
| `scalp_levels.pine` | The indicator: levels, A+ setups, ⚠ rejection warnings, SELL/BUY labels, RSI move stars and target stars |
| `RELEASE_NOTES.md` | What it does, how each rule was matched to the original, and what's still open |
| `research/replay_signals.py` | Python port of the SELL/BUY, star and target rules. It replays them on real 5m bars and reproduces the original's markers for TSLA, CVX and MSFT on 16 Oct 2026 |
| `research/test_setups_parser.py` | Python mirror of the "Pasted levels" parser, with the inputs it has to handle |

## Install

TradingView → Pine Editor → New → paste `scalp_levels.pine` → Save → Add to chart. After pasting a new version, open the indicator's settings and use **Reset settings** so the default levels load.

## Daily levels

Settings → **Pasted levels**. Paste the day's **A+ Scalp Setups** message over the old one, as is. It can be on one line or many, and emojis are fine. Plain `TICKER: bull, bull | bear, bear` lines can sit in the same box for tickers the message doesn't cover.

By default only the 🔼 Breakout (▲) and 🔻 Breakdown (▼) sets are drawn, like the original. Turn on "Use ❌ Rejection / 🔄 Bounce setups" to add those two.

## Research

```
cd research
python3 test_setups_parser.py   # parser checks
python3 replay_signals.py       # downloads 1 month of 5m bars into data/ and replays 16 Oct
python3 replay_signals.py MSFT 2026-10-16
```

Yahoo only serves about 60 days of 5m bars, so the 16 Oct replay works until mid-December 2026.
