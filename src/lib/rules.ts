// Matrixchannel entry rules, ported from the companion's engine.
// Observations are stored as absolute chart facts (MA slope up/down, price
// above/below cloud...) so the same record can be re-scored for long or short
// and reused later as indicator training data.

export type Direction = 'long' | 'short';
export type SetupId = 'reversal' | 'pullback' | 'cluster' | 'magnet' | 'candle' | 'line';
export type CheckState = 'met' | 'not' | 'unknown';

export interface Observation {
  event: string;
  position: string;
  slope: string;
  near: string;
  closed: string;
  cloud: string;
  macd: string;
  break: string;
  bars: string;
  required: string;
  intersection: string;
  follow: string;
  pattern: string;
  patternDone: string;
}

export type ObsField = keyof Observation;

export const UNKNOWN = '';

export function freshObservation(): Observation {
  return {
    event: '', position: '', slope: '', near: '', closed: '', cloud: '', macd: '',
    break: '', bars: '', required: '', intersection: '', follow: '', pattern: '', patternDone: '',
  };
}

export const SETUPS: Record<SetupId, { name: string; short: string; risk: 'standard' | 'higher' }> = {
  reversal: { name: 'Reversal', short: 'Bounce off support / rejection at resistance', risk: 'standard' },
  pullback: { name: 'Breakout + pullback', short: 'Break a line, retest it, continue', risk: 'standard' },
  cluster: { name: 'Cluster breakout', short: 'Several closes beyond the whole cluster', risk: 'standard' },
  magnet: { name: 'Magnet', short: 'Three lines meet — next bars show direction', risk: 'standard' },
  candle: { name: 'Candlestick', short: 'Completed pattern at a level', risk: 'standard' },
  line: { name: 'Single-line break', short: 'Immediate break of one line', risk: 'higher' },
};

// Choices offered for each observation field. Values are what gets stored.
export const FIELD_OPTIONS: Record<Exclude<ObsField, 'bars' | 'required'>, [string, string][]> = {
  event: [['bounce', 'Bounced off support'], ['reject', 'Rejected at resistance'], ['retest-up', 'Up-break, retest held'], ['retest-down', 'Down-break, retest failed'], ['none', 'No reaction']],
  position: [['above', 'Above'], ['below', 'Below']],
  slope: [['up', 'Up'], ['flat', 'Flat'], ['down', 'Down']],
  near: [['yes', 'Yes'], ['no', 'No']],
  closed: [['yes', 'Closed'], ['no', 'Forming']],
  cloud: [['above', 'Above'], ['inside', 'Inside'], ['below', 'Below']],
  macd: [['bullish', 'Bull cross'], ['bearish', 'Bear cross'], ['none', 'None']],
  break: [['up', 'Up'], ['down', 'Down'], ['none', 'None']],
  intersection: [['yes', 'Yes'], ['no', 'No']],
  follow: [['up', 'Up'], ['flat', 'Sideways'], ['down', 'Down']],
  pattern: [['bullish', 'Bullish'], ['bearish', 'Bearish'], ['none', 'None']],
  patternDone: [['yes', 'Complete'], ['no', 'Developing']],
};

export interface CheckRow {
  key: ObsField;
  label: string;
  state: CheckState;
  help: string;
}

export interface Evaluation {
  rows: CheckRow[];
  counts: Record<CheckState, number>;
  aligned: boolean;
}

function match(value: string, expected: string): CheckState {
  if (!value) return 'unknown';
  return value === expected ? 'met' : 'not';
}

export function evaluate(o: Observation, direction: Direction, setup: SetupId, full = true): Evaluation {
  const long = direction === 'long';
  const side = long ? 'above' : 'below';
  const slope = long ? 'up' : 'down';
  const expanded = full || setup === 'pullback' || setup === 'magnet';
  const rows: CheckRow[] = [];
  const add = (key: ObsField, label: string, state: CheckState, help: string) => rows.push({ key, label, state, help });

  if (setup === 'reversal')
    add('event', long ? 'Bounced off support' : 'Rejected at resistance', match(o.event, long ? 'bounce' : 'reject'),
      'Touching a level only starts the assessment. Look for a reaction away from it.');
  if (setup === 'pullback')
    add('event', long ? 'Broke up, retest held' : 'Broke down, retest failed', match(o.event, long ? 'retest-up' : 'retest-down'),
      'Break a level, return toward it, then continue in the break direction.');
  if (setup === 'cluster' || setup === 'line')
    add('break', long ? 'Broke above the whole level / cluster' : 'Broke below the whole level / cluster', match(o.break, long ? 'up' : 'down'),
      setup === 'cluster' ? 'Crossing one line inside the group is not a break beyond the whole cluster.' : 'Immediate single-line entries are higher risk.');
  if (setup === 'cluster') {
    const n = Number(o.bars);
    const required = Number(o.required);
    const known = o.bars !== '' && o.required !== '' && Number.isInteger(n) && Number.isInteger(required) && required >= 2 && n >= 0;
    add('bars', 'Several closes beyond the cluster', known ? (n >= required ? 'met' : 'not') : 'unknown',
      'The source never defines "several". Set your own threshold (2+).');
  }
  if (setup === 'magnet') {
    add('intersection', 'Three lines intersect', match(o.intersection, 'yes'), 'The intersection is where to watch, not a direction.');
    add('follow', long ? 'Next bars move up' : 'Next bars move down', match(o.follow, slope), 'The next few bars reveal direction.');
  }
  if (setup === 'candle') {
    add('event', long ? 'Pattern at support' : 'Pattern at resistance', match(o.event, long ? 'bounce' : 'reject'), 'Location and preceding trend are part of the pattern.');
    add('pattern', long ? 'Bullish pattern' : 'Bearish pattern', match(o.pattern, long ? 'bullish' : 'bearish'), 'See the candlestick list on the Rules page.');
    add('patternDone', 'Pattern completed', match(o.patternDone, 'yes'), 'A developing pattern can still change.');
  }
  const maRequired = setup === 'reversal' || expanded;
  if (maRequired) {
    add('position', long ? 'Candle closes above white MA' : 'Candle closes below white MA', match(o.position, side), 'Use the same timeframe as the setup.');
    add('slope', long ? 'MA rising / turning up' : 'MA falling / turning down', match(o.slope, slope), 'Flat does not count as a turn.');
  }
  if (expanded) {
    add('near', 'Entry near the moving average', match(o.near, 'yes'), 'Closer to the MA = lower risk. No exact distance is given.');
    add('cloud', long ? 'Price above the whole cloud' : 'Price below the whole cloud', match(o.cloud, side), 'Inside the cloud passes neither direction.');
    add('macd', long ? 'Recent bullish MACD cross' : 'Recent bearish MACD cross', match(o.macd, long ? 'bullish' : 'bearish'), 'No MACD pane visible? Leave it unset.');
  }
  if (maRequired)
    add('closed', 'Signal candle has closed', match(o.closed, 'yes'), 'A forming candle cannot confirm a close condition.');

  const counts = rows.reduce((a, r) => (a[r.state]++, a), { met: 0, not: 0, unknown: 0 } as Record<CheckState, number>);
  return { rows, counts, aligned: counts.not === 0 && counts.unknown === 0 };
}

export function trendContext(o: Observation): { label: string; tone: 'good' | 'bad' | 'warn'; bias: Direction | null } {
  if (o.position === 'above' && o.slope === 'up' && o.cloud === 'above') return { label: 'Up', tone: 'good', bias: 'long' };
  if (o.position === 'below' && o.slope === 'down' && o.cloud === 'below') return { label: 'Down', tone: 'bad', bias: 'short' };
  if (!o.position && !o.slope && !o.cloud) return { label: 'Not set', tone: 'warn', bias: null };
  return { label: 'Mixed', tone: 'warn', bias: null };
}

export interface PlanInput {
  entry: string;
  stop: string;
  target: string;
  costs: string;
  minRR: string;
}

export type Plan =
  | { valid: false; error: string }
  | { valid: true; risk: number; reward: number; rr: number; meets: boolean | null };

export function riskPlan(p: PlanInput, direction: Direction): Plan {
  const num = (v: string) => (v.trim() === '' ? NaN : Number(v));
  const entry = num(p.entry), stop = num(p.stop), target = num(p.target);
  if (![entry, stop, target].every(Number.isFinite)) return { valid: false, error: 'Add entry, stop and target.' };
  const sign = direction === 'long' ? 1 : -1;
  const risk = (entry - stop) * sign;
  const reward = (target - entry) * sign;
  if (risk <= 0) return { valid: false, error: direction === 'long' ? 'Long stop must be below entry.' : 'Short stop must be above entry.' };
  if (reward <= 0) return { valid: false, error: direction === 'long' ? 'Long target must be above entry.' : 'Short target must be below entry.' };
  const costs = p.costs.trim() === '' ? 0 : Number(p.costs);
  if (!Number.isFinite(costs) || costs < 0) return { valid: false, error: 'Costs must be 0 or more points.' };
  const rr = (reward - costs) / (risk + costs);
  const min = num(p.minRR);
  return { valid: true, risk: risk + costs, reward: reward - costs, rr, meets: Number.isFinite(min) && min > 0 ? rr >= min : null };
}

export type VerdictTone = 'go' | 'wait' | 'stop';

export function verdict(ev: Evaluation, plan: Plan, direction: Direction): { tone: VerdictTone; title: string; detail: string } {
  const side = direction === 'long' ? 'BUY' : 'SELL';
  if (ev.counts.not > 0)
    return { tone: 'stop', title: `No ${side}`, detail: `${ev.counts.not} condition${ev.counts.not > 1 ? 's' : ''} against the setup.` };
  if (ev.counts.unknown > 0)
    return { tone: 'wait', title: 'Wait', detail: `${ev.counts.unknown} check${ev.counts.unknown > 1 ? 's' : ''} still to confirm.` };
  if (!plan.valid) return { tone: 'wait', title: `${side} setup — plan it`, detail: plan.error };
  if (plan.meets === false) return { tone: 'stop', title: `No ${side}`, detail: `R:R ${plan.rr.toFixed(2)} is below your minimum.` };
  return { tone: 'go', title: `${side} setup valid`, detail: `All checks met · R:R ${plan.rr.toFixed(2)}` };
}
