const ROUTINE: [string, string][] = [
  ['Read the hourly context', 'On 1W · 60m: is price above or below the white MA, is the MA rising or falling, is price above, inside or below the cloud?'],
  ['Map the room', 'On the 5m chart, find the nearest Matrixchannel line or cluster, the next one above and the next one below. Lines too close together = not enough room.'],
  ['Wait for the setup', 'Let price reach a level and react. Touching a line is not a signal — the reaction is.'],
  ['Confirm on closed candles', 'Run the checklist. A forming candle can still change; "?" is never a pass.'],
  ['Plan before entering', 'Set stop, target and R:R first. If the room to target is small versus the stop, skip it.'],
  ['Act, then log', 'Buy, sell, or wait — and log it either way. Fill in the result when the trade ends.'],
];

const SETUPS: [string, string, string][] = [
  ['Reversal', 'Price bounces off support (buy) or is rejected at resistance (sell), a candle closes across the white MA, and the MA turns in the trade direction. All three must be present.', ''],
  ['Breakout + pullback', 'Price breaks through a line, comes back to retest it (often near the MA), then continues in the break direction.', ''],
  ['Cluster breakout', 'Several completed candles close beyond the whole cluster. Stop: below the lowest bar that closed above it (long) or above the highest bar that closed below it (short).', ''],
  ['Magnet', 'Three lines intersect. The intersection is not a direction — the next few bars show which way to trade.', ''],
  ['Candlestick', 'A completed bullish pattern at support (buy) or bearish pattern at resistance (sell). An MA turn in the same direction confirms it.', ''],
  ['Single-line break', 'Price crosses one line in a running move. Valid, but the source calls it higher risk. Entries closer to the MA are lower risk.', 'higher risk'],
];

const CANDLES: [string, 'bull' | 'bear' | 'neutral', string][] = [
  ['Hammer', 'bull', 'long lower wick after a decline'],
  ['Inverted hammer', 'bull', 'long upper wick after a decline'],
  ['Bullish engulfing', 'bull', 'green body engulfs the prior red one'],
  ['Piercing line', 'bull', 'closes above the midpoint of the prior red body'],
  ['Morning star', 'bull', '3-candle bottom reversal'],
  ['Three inside / outside up', 'bull', 'harami / engulfing + confirming candle'],
  ['Shooting star', 'bear', 'long upper wick after an advance'],
  ['Hanging man', 'bear', 'long lower wick after an advance'],
  ['Bearish engulfing', 'bear', 'red body engulfs the prior green one'],
  ['Evening star', 'bear', '3-candle top reversal'],
  ['Advance block', 'bear', 'rising candles losing momentum'],
  ['Doji', 'neutral', 'indecision — no direction alone'],
];

const OPEN_QUESTIONS = [
  'How many closes count as "several" beyond a cluster?',
  'How close is "near the moving average" (points)?',
  'How recent is a "recent" MACD cross (bars)?',
  'How far apart can lines be and still form one cluster?',
  'Minimum R:R and risk per trade.',
  'Moving-average type and period on the hourly chart.',
];

export default function RulesView() {
  return (
    <section className="rules">
      <h1>How and when to buy or sell</h1>
      <p className="muted lead">The Matrixchannel method in one page. The checklist on the Live desk applies these rules.</p>

      <h2>The routine</h2>
      <ol className="routine">
        {ROUTINE.map(([t, d]) => (
          <li key={t}><strong>{t}</strong><span>{d}</span></li>
        ))}
      </ol>

      <div className="two-col">
        <article className="rule-card buy">
          <h2>▲ Buy (long) when</h2>
          <ul>
            <li>Price falls into a support line or cluster and <strong>bounces off it</strong></li>
            <li>A candle <strong>closes above</strong> the white moving average</li>
            <li>The moving average is <strong>turning up</strong> or already rising</li>
            <li>Price is <strong>above the whole cloud</strong></li>
            <li>MACD <strong>crossed up</strong> recently</li>
            <li>Entry is near the MA, with room to the next line above</li>
          </ul>
          <p><strong>Stop</strong> below the nearest swing low. <strong>Target</strong> the next line up, or the lowest edge of the upper cluster.</p>
        </article>
        <article className="rule-card sell">
          <h2>▼ Sell (short) when</h2>
          <ul>
            <li>Price rises into a resistance line or cluster and <strong>is rejected</strong></li>
            <li>A candle <strong>closes below</strong> the white moving average</li>
            <li>The moving average is <strong>turning down</strong> or already falling</li>
            <li>Price is <strong>below the whole cloud</strong></li>
            <li>MACD <strong>crossed down</strong> recently</li>
            <li>Entry is near the MA, with room to the next line below</li>
          </ul>
          <p><strong>Stop</strong> above the nearest swing high. <strong>Target</strong> the next line down, or the highest edge of the lower cluster.</p>
        </article>
      </div>

      <article className="rule-card wait">
        <h2>Wait (don't trade) when</h2>
        <ul>
          <li>Price is inside a cluster, bouncing between lines — that is range behaviour</li>
          <li>The next line is too close to pay for the stop</li>
          <li>The signal candle hasn't closed yet</li>
          <li>Price is inside the cloud, or the MA is flat</li>
          <li>Price is far from the MA (higher risk)</li>
          <li>Any checklist item is unknown — a missing MACD pane stays "?"</li>
        </ul>
        <p className="muted">Quick start from the source: when price is in the big space between clusters, wait for it to reach the next cluster, then trade the reaction.</p>
      </article>

      <h2>The six setups</h2>
      <div className="setup-grid">
        {SETUPS.map(([t, d, tag]) => (
          <article key={t} className="card">
            <h3>{t} {tag && <span className="tag">{tag}</span>}</h3>
            <p>{d}</p>
          </article>
        ))}
      </div>

      <h2>How clusters behave</h2>
      <div className="setup-grid three">
        <article className="card"><h3>Approaching</h3><p>Often rejects and heads back to the previous cluster.</p></article>
        <article className="card"><h3>Inside</h3><p>Slow, choppy — bounces between lines and takes time to get through.</p></article>
        <article className="card"><h3>Broken through</h3><p>Often moves fast across the gap to the next cluster.</p></article>
      </div>

      <h2>Candlestick patterns</h2>
      <div className="candles">
        {CANDLES.map(([n, b, d]) => (
          <div key={n} className={`candle ${b}`}><strong>{n}</strong><span>{d}</span></div>
        ))}
      </div>
      <p className="muted small">The preceding trend decides the name: the same upper-wick shape is an inverted hammer after a decline and a shooting star after an advance.</p>

      <h2>Rules the source leaves open</h2>
      <p className="muted">Decide these yourself and keep them fixed. They become the parameters of the buy/sell indicator, and the signal log is how you'll test them.</p>
      <ul className="open-q">
        {OPEN_QUESTIONS.map(q => <li key={q}>{q}</li>)}
      </ul>

      <p className="muted small source">
        Method and live streams from <a href="https://tradeforecastmastery.com/matrixchannel-indicator-info" target="_blank" rel="noopener noreferrer">Trade Forecast Mastery — Matrixchannel Indicator</a>.
        These are the author's suggested rules; they have not been backtested here, and claims like "75% of the time" are unverified.
        This site never places orders.
      </p>
    </section>
  );
}
