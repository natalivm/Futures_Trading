# A+ Scalp Dashboard + ARB, and Scalp Levels (rebuilt)

Two TradingView indicators rebuilt from screenshots of the originals and checked against real price data. This is **not** the original source code.

| File | What it does |
|---|---|
| `scalp_dashboard.pine` | **Dashboard + ORB/ARB.** The 5-row A+ table, opening-range (ORB) and afternoon-range (ARB) boxes, PrevD and PreM High/Low lines (only when recently touched), 😡 marker at the 200 EMA, 5 EMA, 9 EMA and VWAP. Fully automatic, so it works on any ticker |
| `scalp_levels.pine` | **Levels only.** Pasted per ticker (or the experimental auto formula), plus "Buy/Sell Rejection" ⚠ markers. Add it only on tickers you have levels for |

## Install

TradingView → Pine Editor → New → paste the file → Save → Add to chart. Do it once per file. Both run on intraday charts only.

## Pasting levels

The original (GOAT Scalp Levels) keeps every ticker's levels in one settings string, e.g. `SPY|Breakdown|778.07,776.43,775.3,774.15;SPY|Breakout|780.75,782.16,783.29,785.39;TSLA|…`. You can **paste that string as is**: Breakout levels become ▲, Breakdown levels become ▼. The simpler format below works too, and the two can be mixed.

Settings → *Pasted levels*. Use one ticker per line, with bull levels before the `|` and bear levels after it:

```
META: 733.63, 737.53, 741.62, 747.60 | 727.96, 723.72, 719.63, 713.19
NVDA: 190.10, 192.40, 195.00 | 187.20, 185.00, 182.75
```

## Dashboard rules, checked against 24 screenshots of the original

Cases: META, GOOGL, MSFT, AMZN, NVDA, ORCL, HPE and CRDO on 5m and 15m, NVDA and ORCL on 4h, ORCL 1h, TSLA 15m, NFLX 5m (all after the 16 Oct close), MU and AMD 4h pre-market on 19 Oct, and NVDA 5m live at 12:25 on 19 Oct (12 stocks, NASDAQ and NYSE, 5m to 4h). Every row below reproduces all 24. The one mismatch, the CRDO 15m 2-candle row, comes down to a 15:15 close only 4 cents above the 9 EMA in our data, which is within data noise.

| Row | Rule |
|---|---|
| 1. ORB / ARB | Follows the trading day. **Pre-market:** "ORB 5m: ⏳ Waiting for open" (MU, AMD), not counted. **From 9:30:** the **opening range**, drawn in yellow as "ORB1 5m High/Low" (first 5 min by default; 15 or 30 in settings). **From 13:30 ET:** the **afternoon range** (ARB) takes over as soon as its window opens; while it's still forming, the high/low of its **finished** candles is the range, so the live candle can already cross it (META Mon 14:55 ET: "Inside range"; TSLA Mon 14:58 ET: live wick above the 369.37 box top → "Crossing above range"). Weekend charts keep showing Friday's ARB. The window runs on New York time, so it stays right when clocks change: 13:30–15:00 ET is 20:30–22:00 in Kyiv now, 19:30–21:00 between 25 Oct and 1 Nov (Europe has changed clocks, the US hasn't), then 20:30–22:00 again. For either range: current 5m candle beyond it (a wick is enough) = "Crossing above/below range" (highlighted, not counted). Live price **and** the last closed 5m candle outside = "BREAKOUT ↑ GO" (highlighted, counted). Two or more closed candles outside = "Breakout ↑ held" (plain cell, counted). TSLA → GO; NVDA Mon, above since 10:20 → held; MSFT, HPE, CRDO → Crossing. A new day clears yesterday's boxes |
| 2. 9 EMA 2 Candle | Chart timeframe. Live price vs 9 EMA picks the side. If the **last two closed candles** are on the same side it reads "Price above/below, held", otherwise "Above/Below, needs 2 closes" |
| 3. VWAP | Session VWAP of **close** prices on the **chart's timeframe** vs live price, e.g. "Below $5.60". Confirmed on two charts where both indicators sat side by side: MU 910.02 vs the original's 909.87, AMD **546.94 vs 546.94**. hlc3 (the usual VWAP source) was off by $1–3 |
| 4. RSI 40/60 | RSI(14) of the **last closed bar**: <40 Weakness, >60 Strength, otherwise In between |
| 5. Daily Trend | Streak of **decisive** daily closes (completed days): a day counts only if it closed at least ~0.5% beyond the previous close. 2 or more in a row gives "N days trending up/down", otherwise "Mixed, no confirm". TSLA and HPE 4, NVDA 2; META (last day −0.11%) and CRDO (last day −0.41%) reset to Mixed. Anything from 0.42% to 0.74% fits all 10 stocks. Counts **finished days only**: during the session that's up to yesterday; pre-market it already includes the previous session (AMD Monday pre-market: 3 days down, Oct 14–16) |
| Footer | Count of rows **1–4** pointing the same way, e.g. "⏳ 2 of 4 short"; a tie counts as long. **All 4 = "🟢 GREEN LIGHT: LONG 4 of 4"** with a teal frame round the dashboard, whatever the daily row says (SPY Tue 20 Oct: daily "2 days trending down", still GREEN LIGHT). The short version ("🔴 GREEN LIGHT: SHORT 4 of 4", red frame) is a guess until we see one |
| PrevD High/Low | Drawn once price has **traded through the level recently**; distance doesn't decide it (AMZN 0.52% away shown, MSFT 0.43% hidden). Last touch: TSLA 15:55, GOOGL 15:55, AMZN 14:35 → shown; META 13:00, MSFT 11:45, NFLX 10:00 → hidden. Set to a 2-hour window; the data allows 80–175 min. PrevD High is red, PrevD Low green |
| PreM High/Low | Today's **pre-market** high/low as solid red lines, **only before the open** and only on charts with extended hours on (a regular-hours chart has no pre-market candles to measure from), same 2-hour rule, timed from the 5m candles even on 1h/4h charts. MU: high made 08:15 → shown at 08:24, low made 04:00 → hidden. AMD: high made 06:55 → shown at 08:32. NVDA at 12:25: not shown, although price was trading at it. Setting: "All day" |
| 😡 / 😇 at 200 EMA | Gray line at the chart-timeframe 200 EMA plus 😡 when price is **below** it or 😇 when **above** (tooltip "200 EMA"), only within ~1% of it. Shown at 0.80–0.87% under (NFLX, MSFT, NVDA 4h) and 0.33% over (NVDA 5m Mon); hidden from 1.22% away (AMZN, GOOGL, META, TSLA) |
| Lines | Same plots, names and order as the original's Style tab: VWAP 💧, 5 EMA (Fastest) 🟡, 9 EMA (Fast) ⚪, 20 EMA (Slow) 🟣, 200 EMA, each with a "dotted" twin. Like the original (its legend shows ∅ for them), the dotted twins and the 20/200 EMA are empty by default; a Display setting per line picks Solid, Dotted or Off |

The original doesn't draw BUY/SELL labels; the TSLA chart showed none where a 4-of-4 rule would have fired 3 times. The stars, red dots and the one SELL label on the META chart only appear when Scalp Levels is visible, so they most likely belong to the levels indicator.

## Still open

- **Hidden extras:** the original's settings list 4 timeframes (5 min, 15 min, 30 min, 5 min) and 11 line styles (8 solid, 2 dashed, 1 solid). The first three look like opening-range lengths. The 2 dashed lines are still unidentified; the PreM lines are solid. We haven't yet seen how the original draws its ORB box during the session.
- **Dashed lines and shaded zones** aren't from the dashboard. On NVDA, 217.15 is exactly the 17 Sep low and 219.34 the 17 Sep close; on ORCL, the red 133.49 is exactly the 16 Oct open, and there's a gray zone across both timeframes. They look like hand-drawn lines, zones or price alerts.
- **Fitted thresholds** are approximate: the 1% for 😡 and the 2-hour PrevD window. The PrevD rule could also be "touched since 13:30", the start of the ARB window, which fits every case too. A morning screenshot where price touched the previous-day high or low in the last hour would tell them apart.

## Backtest: does 4-of-4 alignment pay?

Setup: 10 megacaps (AAPL, MSFT, NVDA, AMZN, GOOGL, META, TSLA, AVGO, NFLX, AMD), 60 sessions (24 Jul to 16 Oct 2026). Entry at the next bar's open after all 4 rows align, at most one per direction per day. Results are before costs. This ran before the ARB "Crossing vs GO" rule was found, so ARB counted as soon as live price left the range.

| Setup | Exit | Trades | Win % | Avg / trade | t-stat |
|---|---|---|---|---|---|
| 4 of 4, 5m chart | first close back through 9 EMA | 763 | 43% | +0.058% | +2.2 |
| 4 of 4, 5m chart | 30 min | 763 | 53% | +0.048% | +2.0 |
| 4 of 4, 15m chart | any | 534 | 40–48% | −0.04% to 0% | ≈ 0 |
| A+ (4/4 + daily streak), 15m | 9 EMA close | 76 | 30% | −0.31% | −3.7 |
| ARB GO after 15:00 | any | 427 | 36–48% | ≈ 0% | ≈ 0 |

Verdict: **no tradable edge on its own.** The best case nets about +0.03% after a realistic 0.03% round-trip cost. Half of that comes from AMD (without AMD: +0.029% before costs), and it shrank every month (July +0.14%, October +0.03%). The daily-streak filter hurts: after several days in one direction, intraday moves tended to reverse. The dashboard works as a checklist alongside the levels, not as a standalone system.

## Level formula: research notes

The 8 levels are **not** classic, Fibonacci, Camarilla or Woodie pivots, ATR multiples, Gann square-of-9, or any single daily or weekly moving average or Bollinger band. About 7,000 candidates were tested; no candidate matched more than chance would predict.

What fits, on META:

1. **Center = daily 9 EMA including Friday's close = 730.80.** The two inner levels (733.63 ▲ / 727.96 ▼) sit at exactly 730.80 ± 2.835. This suggests those were the levels **for Mon 19 Oct**, calculated after Friday's close.
2. Offsets from that center, in units of the 15 Oct high–low range, are about 0.10 / 0.237 / 0.381 / 0.592 up and 0.10 / 0.249 / 0.393 / 0.620 down. That is close to Fibonacci ratios, but the two sides aren't mirror images.
3. Several levels land on real prior prices (747.60 = 6 Oct high, 713.19 = 28 Sep low), which suggests hand-picked adjustments.

**To solve it:** collect 5–10 level sets, each with its **date and ticker**.

## Research scripts

`research/` holds the Python used for the checks and the backtest (Python 3.9+, no extra packages):

```
cd research
python3 fetch_data.py   # 60 days of 5m/15m and 2 years of daily bars from Yahoo Finance into data/
python3 backtest.py     # prints the results table and writes trades.csv
```

`engine.py` is a Python port of the dashboard rules and `dl.py` loads the downloaded bars. The backtest predates the ORB/ARB "Crossing / GO / held" rules.
