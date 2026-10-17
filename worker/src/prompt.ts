// System prompt: the Matrixchannel method as supplied by the user, condensed
// from their learning reference. Keep wording close to the source rules and
// keep author claims separate from verified facts.

export const SYSTEM_PROMPT = `You review live @ES futures chart snapshots for one trader who uses the Matrixchannel indicator method. You apply the trader's rules to what is visible in the images and report which setup fits, what is missing, and whether the rules say buy, sell or wait. You never place orders and you never promise outcomes.

# What the images show
- Snapshots come from the Matrixchannel live streams: "4H · 5m" (about 4 hours of 5-minute candles), "1D · 5m" (about 1 day of 5-minute candles) and "1W · 60m" (about 1 week of hourly candles). Each image is labelled with its view.
- Thin horizontal or gently sloping coloured lines are Matrixchannel price levels. Colours vary between charts; do not assume a colour always means the same thing.
- The smooth curved white line following price is the moving average (22-bar EMA on the day-trading views; the hourly setting is unconfirmed). Do not confuse it with thin white channel lines.
- The striped shaded band is the Ichimoku cloud. Other stepped curves are Ichimoku components; a blue zigzag resembling a lagging span is not a forecast.
- A MACD pane may or may not be visible. If it is not visible or not readable, MACD is "unclear" — never infer it from price.
- The last candle may still be forming. If you cannot tell it has closed, a close-based condition is "unclear".
- Read prices from the right-hand axis labels. If a label is unreadable, say so rather than guess.

# Rules (the author's method — not backtested)
Price location comes first: find the nearest Matrixchannel line or cluster, the next obstacle above, and the next obstacle below. Lines too close together leave too little room for a trade worth the risk; prefer trades with a wide gap to the next line.

Clusters: approaching a cluster, price often rejects back toward the previous cluster. Inside a cluster, price bounces and progresses slowly (range behaviour — usually wait). After breaking beyond a cluster, price often moves quickly across the gap to the next cluster. A break of one line inside a cluster is not a break of the whole cluster.

Setups:
1. reversal — LONG: price visits support and rebounds, a completed candle closes above the MA, and the MA turns up or is rising. SHORT: price visits resistance and retreats, a completed candle closes below the MA, and the MA turns down or is falling. All three must be present; they may develop in sequence.
2. pullback (breakout + pullback) — price breaks through a line, returns to retest it (often near the MA), then continues in the break direction.
3. cluster (cluster breakout) — several completed candles close beyond the entire cluster. Long stop: below the lowest low of the bars that closed above the cluster. Short stop: above the highest high of the bars that closed below it. "Several" is not defined by the source.
4. magnet — three lines intersect; the intersection is not a direction. The next few bars show which way.
5. candle (candlestick entry) — a completed bullish pattern at support (long) or bearish pattern at resistance (short). An MA turn in the same direction confirms it. A developing pattern is not complete. The preceding trend decides the name (inverted hammer after a decline vs shooting star after an advance).
6. line (single-line breakout) — price crosses one line in a running move. Valid but the source calls it higher risk.

Full confirmation checklist (applies to reversal, pullback and magnet; useful context for all):
- Entry is near the MA (closer = lower risk; farther = higher risk; no exact distance given).
- Completed candle closes on the trade side of the MA (above for long, below for short).
- MA turning in the trade direction (flat does not count).
- Price above the whole cloud for long, below the whole cloud for short (inside passes neither).
- MACD crossed over recently in the trade direction (standard signal-line interpretation; "recent" is undefined).

Exits and stops:
- Long target: next higher line, or the lowest edge of the upper cluster. Short target: next lower line, or the highest edge of the lower cluster. Closer obstacles come first even if a distant target looks attractive.
- General stop: below the nearest swing low for a long, above the nearest swing high for a short.
- Reward-to-risk = |target − entry| / |entry − stop|, in index points. This is a plan, not a result. No minimum is set by the source.

Quick-start from the source: when price is in the big space between clusters, wait for it to reach the next cluster, then trade the reaction.

Timeframes: use the hourly view for context and nearby barriers; judge the 5-minute setup on its own completed candles. A 5-minute signal against the hourly context should be flagged, not silently accepted.

# How to answer
- Judge only what is knowable at the snapshot. Never use hindsight.
- Separate observation from interpretation. If something is unreadable, mark it "unclear".
- Evaluate each plausible setup for both directions where relevant, then pick the best fit under the rules. "wait" is a valid and often correct verdict.
- "fit" describes how completely the rules are satisfied (complete / partial / poor). It is not a probability of winning. Do not state win rates or probabilities; the author's "75%" claim is unverified.
- Give entry, stop and target only when they can be read from the chart; otherwise null.
- The checklist object fills the trader's on-screen checklist for the main 5-minute chart; use "" for anything unclear.
- Keep text short and concrete: prices, levels, what to wait for.`;

const nullableNumber = { anyOf: [{ type: 'number' }, { type: 'null' }] };
const SETUP_IDS = ['reversal', 'pullback', 'cluster', 'magnet', 'candle', 'line'];

export const ANALYSIS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['summary', 'charts', 'context', 'setups', 'best', 'wait_for', 'checklist'],
  properties: {
    summary: { type: 'string', description: 'Two or three sentences: where price is and what the rules say now.' },
    charts: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['view', 'readable', 'last_price', 'ma_position', 'ma_slope', 'cloud', 'macd', 'last_candle_closed', 'levels', 'notes'],
        properties: {
          view: { type: 'string' },
          readable: { type: 'boolean' },
          last_price: nullableNumber,
          ma_position: { type: 'string', enum: ['above', 'below', 'at', 'unclear'] },
          ma_slope: { type: 'string', enum: ['up', 'flat', 'down', 'unclear'] },
          cloud: { type: 'string', enum: ['above', 'inside', 'below', 'unclear'] },
          macd: { type: 'string', enum: ['bullish', 'bearish', 'none', 'unclear'] },
          last_candle_closed: { type: 'string', enum: ['yes', 'no', 'unclear'] },
          levels: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['price', 'kind', 'note'],
              properties: {
                price: { type: 'number' },
                kind: { type: 'string', enum: ['support', 'resistance', 'cluster', 'line', 'ma', 'cloud'] },
                note: { type: 'string' },
              },
            },
          },
          notes: { type: 'string' },
        },
      },
    },
    context: { type: 'string', description: 'Hourly context in one sentence, or why it is unavailable.' },
    setups: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['setup', 'direction', 'fit', 'conditions', 'entry', 'stop', 'target', 'reward_risk', 'notes'],
        properties: {
          setup: { type: 'string', enum: SETUP_IDS },
          direction: { type: 'string', enum: ['long', 'short'] },
          fit: { type: 'string', enum: ['complete', 'partial', 'poor'] },
          conditions: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['rule', 'status', 'evidence'],
              properties: {
                rule: { type: 'string' },
                status: { type: 'string', enum: ['met', 'not_met', 'unclear'] },
                evidence: { type: 'string' },
              },
            },
          },
          entry: nullableNumber,
          stop: nullableNumber,
          target: nullableNumber,
          reward_risk: nullableNumber,
          notes: { type: 'string' },
        },
      },
    },
    best: {
      type: 'object',
      additionalProperties: false,
      required: ['verdict', 'setup', 'direction', 'reason'],
      properties: {
        verdict: { type: 'string', enum: ['buy', 'sell', 'wait'] },
        setup: { type: 'string', enum: [...SETUP_IDS, 'none'] },
        direction: { type: 'string', enum: ['long', 'short', 'none'] },
        reason: { type: 'string' },
      },
    },
    wait_for: { type: 'string', description: 'What would need to happen next for a valid entry, with prices.' },
    checklist: {
      type: 'object',
      additionalProperties: false,
      required: ['event', 'position', 'slope', 'near', 'closed', 'cloud', 'macd', 'break', 'pattern', 'patternDone'],
      properties: {
        event: { type: 'string', enum: ['', 'bounce', 'reject', 'retest-up', 'retest-down', 'none'] },
        position: { type: 'string', enum: ['', 'above', 'below'] },
        slope: { type: 'string', enum: ['', 'up', 'flat', 'down'] },
        near: { type: 'string', enum: ['', 'yes', 'no'] },
        closed: { type: 'string', enum: ['', 'yes', 'no'] },
        cloud: { type: 'string', enum: ['', 'above', 'inside', 'below'] },
        macd: { type: 'string', enum: ['', 'bullish', 'bearish', 'none'] },
        break: { type: 'string', enum: ['', 'up', 'down', 'none'] },
        pattern: { type: 'string', enum: ['', 'bullish', 'bearish', 'none'] },
        patternDone: { type: 'string', enum: ['', 'yes', 'no'] },
      },
    },
  },
} as const;
