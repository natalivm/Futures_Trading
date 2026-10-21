# Scalp Levels (clone) — release notes

Pine Script v6 · file: `scalp_levels.pine`

**After updating:** paste the new script, save, then use **Settings → Reset settings** (or remove and re-add the indicator) so the chart picks up the new default levels.

---

## What's new

### Levels
- Default levels for all Mag 7 plus MU, AMD, PLTR, NFLX and SPY:
  MSFT, GOOGL, AAPL, NVDA, META, AMZN, TSLA, MU, AMD, PLTR, NFLX, SPY.
- Format, one ticker per line: `TICKER: bull, bull | bear, bear`.

### A+ Scalp Setups (new level format)
- **Paste the daily "A+ Scalp Setups" message as is** into Pasted levels. It works on one line or many, with emojis and commas.
- Each ticker's four setups are read: ❌ Rejection, 🔻 Breakdown, 🔼 Breakout and 🔄 Bounce. Each has a trigger, targets, and a ⚠️ counter-trend flag when present.
- **Drawing** works like the original: just a mark and the price, no setup names.
  - **▲ price:** the Breakout trigger and its targets.
  - **▼ price:** the Breakdown trigger and its targets.
  - **❌ / 🔄:** the Rejection and Bounce setups are **off by default**, like the original, which only draws the ▲/▼ sets. Turn on "Use ❌ Rejection / 🔄 Bounce setups" to draw their triggers and fire their signals. Their targets are a separate tick box.
  - ⚠ warnings run on every drawn level, like the original.
  - A price used twice gets one combined label, e.g. "▼🔄 352.97".
  - Labels that sit close together are staggered sideways.
- **Parsing fix:** setups are found from the message structure (emoji, trigger, emoji, targets), so the names aren't needed. This fixes TSLA, where Breakdown and Breakout had merged into Rejection as T4–T11. The debug table shows what was parsed.
- **Bias:** the bottom-right panel shows the ticker's bias. It switches from the "before 10:00" text to the "after 10:00" text automatically.
- **Setup triggers** fire once per session:
  - Breakout / Breakdown: a close through the trigger.
  - Rejection: a wick reaches the trigger and the bar closes back under it.
  - Bounce: a wick reaches the trigger and the bar closes back over it.
  - After a trigger, ★ marks "T1/T2/T3 Complete" as each target is reached.
  - The trigger label's tooltip shows the targets, the counter-trend flag and the current bias.
- With setups loaded:
  - ⚠ rejection warnings and level-cross alerts only use the four triggers.
  - The confluence SELL/BUY target stars are replaced by the setup targets.
- The old simple format (`TICKER: bull | bear`) still works in the same box. If a ticker has both, its setups win.
- Defaults are the 20 Oct setups for SPY, TSLA, NVDA and QQQ, plus simple levels for MSFT, GOOGL, AAPL, MU, AMD, PLTR, META, AMZN and NFLX.

### Confluence SELL / BUY labels
- Fires on the **first 5m bar of an active 10-min RSI move** where all of these hold, **once per move**:
  - 5m RSI < 40 (BUY: > 60)
  - Opening range (9:30–9:45) break **or** a break of the last ARB (13:30–15:00). The ARB only counts if price crossed it during the session. Opening beyond it on a gap doesn't count.
  - Close beyond the 9 EMA
  - Below VWAP (BUY: above)
- Tooltip matches the original: `Confluence SELL — RSI<40, ORB/ARB break, EMA9 x2, <VWAP (aggressive 5m) @ HH:MM ET`.
- The extra early and duplicate SELL/BUY labels from earlier versions are gone.
- **Current session only** (on by default): SELL/BUY labels and all stars clear when a new regular session opens. Untick it to keep the full history.

### RSI move stars (10-min RSI)
- ★ **Gold star**: RSI tagged 30 (buy side: 70)
- ✸ **Flashing gold star**: RSI hit 25, then reclaimed 30 (move exhausted)
- ✸ **Flashing gold star**: RSI crossed back through 40 (move complete)
- ★ **Solid gold star**: RSI broke 30 again after the flashing star, then crossed back above 40 (move complete)
- Stars only show for moves that produced a SELL or BUY.
- Tooltip times use 5-minute bar times on every chart timeframe, like the original.
- The newest ✸ flashes on a live chart.

### Target stars
- After a SELL, T1/T2/T3 are the next levels below the signal bar's close (above for a BUY).
- ★ `T1 Complete: <close>` appears on the first bar that reaches each target.
- Targets reset on a new signal or a new session.

### Rejection warnings
- ⚠ **Buy Rejection at L**: the wick reached the level from below but the candle body stayed under it. Marker under the bar.
- ⚠ **Sell Rejection at L**: the wick reached the level from above but the body stayed over it. Marker above the bar.
- New confirmation markers (not in the original):
  - ▼ **Rejected**: a red follow-through bar within 3 bars of a Buy Rejection.
  - ▲ **Held**: a green follow-through bar within 3 bars of a Sell Rejection.
- Display modes:
  - **All today** (default)
  - **Latest level**: shows only the level tested most recently, like the original
  - **Off**
- Optional near-miss tolerance, as a % of the level.

### Tooltips
- Hover any star, ⚠, ▼ or ▲ to see what it is: the rule that fired and what it means. Example: "Momentum is fading — take profits, don't chase new shorts."
- Target stars also show which level was hit and the SELL/BUY price it was measured from.
- Markers now have an invisible background, so the hover works on the glyph itself.

### Less clutter
- **⚠ warnings fire once per approach to a level.** A level stays quiet until a bar closes more than 1× ATR away (setting: "Warn again after price moves away by × ATR"). On NVDA 19 Oct this cut 9 warnings to 5. The five repeats at 219.40 became one.
- **No more stacked labels.** A SELL/BUY and a setup trigger on the same bar and side merge into one label, e.g. "🔄 216.81 / BUY", with both tooltips.

### Code review fixes
- **❌ Rejection / 🔄 Bounce triggers** now need the candle body to stay on its side of the trigger, the same rule as ⚠. A candle slicing straight through no longer counts as a rejection.
- **No doubled markers:** no ⚠ on the bar where the same level's Rejection or Bounce setup fires.
- **Warning re-arm:** a warning only re-arms once a bar closes clear of the level without touching it.
- **Bias text:** words like VWAP, ORB or EMA in the setups text aren't mistaken for tickers.
- **Faster:**
  - The 10m RSI and 5m confluence each run one data request instead of two.
  - The daily request only runs when auto levels are possible.
  - Removed an array copy and a duplicate ATR calculation.

### Alerts
- `alert()` fires on SELL/BUY, every star, target hits, rejection warnings and confirmations, and bars that close across a level.
- To use it: create an alert on the indicator with "Any alert() function call".

### Removed
- ARB box, ARB High/Low lines and labels, and the ARB breakout alertconditions.
- The ARB range is still calculated internally for the SELL/BUY break rule. It just isn't drawn.

### Fixes
- Function writing to a global variable (compile error CE10088).
- Stars not showing on charts below 10m.
- Rejection names were inverted in one earlier build.

---

## How it was checked
All rules were replayed in Python on real 5m data for 16 Oct 2026. They reproduce the original's markers:

| Ticker | Matched |
|---|---|
| TSLA | SELL 11:05, 11:45 · ✸ 11:35 · ★ 13:05 · ✸ 13:25 · ★ 15:45 |
| CVX | BUY 12:30 · ★ 12:55 |
| MSFT | SELL 9:35, 10:05, 10:25, 10:55 · ✸ 9:45, 10:15, 10:35, 13:35 · T1 Complete 535.02 @ 10:30 · ★ 11:05, 11:25, 15:45 · ⚠ 15:50 |
| GOOGL | ⚠ Buy Rejection at 344.69 @ 11:40, 11:45 |
| META | ⚠ Buy Rejection at 713.19 @ 13:35 |

The Pine code couldn't be compiled outside TradingView. Report any compile error.

---

## Known gaps
- **Unexplained stars:** MSFT ★ at 9:35 and 10:55, and NFLX's ★ on a day with no SELL. Their tooltips would explain them.
- **"EMA9 x2":** the meaning of "x2" is unknown. The script uses one close beyond the EMA.
- **Levels to double-check:**
  - **Partly hidden in screenshots:** AAPL 340.33, NVDA 230.47.
  - **NVDA 229.85** is estimated from the chart.
- **Not decoded yet:** line colour and thickness changes, and the small red/green dots.
- **Levels need updating each session.** Pasting the original's `TICKER|Breakdown|…` format directly isn't supported yet.
