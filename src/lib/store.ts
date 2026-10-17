import { useEffect, useState } from 'react';
import type { Direction, Observation, PlanInput, SetupId } from './rules';
import type { Timeframe } from './streams';

// Bump when the shape of a LogEntry changes so later indicator work can
// migrate older records instead of guessing.
export const SCHEMA_VERSION = 1;

export type Decision = 'took' | 'skipped' | 'watching';
export type Result = 'open' | 'target' | 'stop' | 'manual' | 'not-taken';

export interface LogEntry {
  schema: number;
  id: string;
  createdAt: string;
  symbol: string;
  view: string;
  timeframe: Timeframe;
  price: string;
  direction: Direction;
  setup: SetupId;
  fullChecklist: boolean;
  observation: Observation;
  context60m: Observation;
  checks: { met: number; not: number; unknown: number };
  verdict: string;
  plan: PlanInput;
  rr: number | null;
  decision: Decision;
  result: Result;
  exitPrice: string;
  closedAt: string;
  note: string;
}

export function useStored<T>(key: string, initial: T): [T, (v: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return initial;
      const parsed = JSON.parse(raw);
      if (Array.isArray(initial)) return (Array.isArray(parsed) ? parsed : initial) as T;
      return { ...initial, ...parsed };
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // storage full or blocked — state still works for this session
    }
  }, [key, value]);
  return [value, setValue];
}

export function outcome(e: LogEntry): { points: number; r: number } | null {
  const entry = Number(e.plan.entry), stop = Number(e.plan.stop);
  const exit = e.result === 'target' ? Number(e.plan.target) : e.result === 'stop' ? stop : Number(e.exitPrice);
  if (e.decision !== 'took' || e.result === 'open' || e.result === 'not-taken') return null;
  if (![entry, stop, exit].every(Number.isFinite) || e.plan.entry === '' || e.plan.stop === '') return null;
  const sign = e.direction === 'long' ? 1 : -1;
  const risk = (entry - stop) * sign;
  const points = (exit - entry) * sign;
  return { points, r: risk > 0 ? points / risk : NaN };
}

const OBS_KEYS: (keyof Observation)[] = ['event', 'position', 'slope', 'near', 'closed', 'cloud', 'macd', 'break', 'bars', 'required', 'intersection', 'follow', 'pattern', 'patternDone'];

export function toCSV(entries: LogEntry[]): string {
  const head = [
    'id', 'createdAt', 'symbol', 'view', 'timeframe', 'price', 'direction', 'setup', 'fullChecklist',
    ...OBS_KEYS.map(k => `obs_${k}`),
    ...(['position', 'slope', 'cloud', 'macd'] as const).map(k => `ctx60_${k}`),
    'checks_met', 'checks_not', 'checks_unknown', 'verdict',
    'entry', 'stop', 'target', 'costs', 'minRR', 'rr',
    'decision', 'result', 'exitPrice', 'closedAt', 'points', 'r', 'note',
  ];
  const esc = (v: unknown) => {
    const s = v == null ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows = entries.map(e => {
    const o = outcome(e);
    return [
      e.id, e.createdAt, e.symbol, e.view, e.timeframe, e.price, e.direction, e.setup, e.fullChecklist,
      ...OBS_KEYS.map(k => e.observation[k]),
      e.context60m.position, e.context60m.slope, e.context60m.cloud, e.context60m.macd,
      e.checks.met, e.checks.not, e.checks.unknown, e.verdict,
      e.plan.entry, e.plan.stop, e.plan.target, e.plan.costs, e.plan.minRR, e.rr?.toFixed(3) ?? '',
      e.decision, e.result, e.exitPrice, e.closedAt, o?.points ?? '', o && Number.isFinite(o.r) ? o.r.toFixed(3) : '', e.note,
    ].map(esc).join(',');
  });
  return [head.join(','), ...rows].join('\n');
}

export function download(name: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export function isLogEntry(x: unknown): x is LogEntry {
  const e = x as LogEntry;
  return !!e && typeof e.id === 'string' && typeof e.createdAt === 'string' && !!e.observation && !!e.plan
    && (e.direction === 'long' || e.direction === 'short');
}
