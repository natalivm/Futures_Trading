import type { Direction, Observation, SetupId } from './rules';

// Mirrors worker/src/prompt.ts ANALYSIS_SCHEMA.
export type Status = 'met' | 'not_met' | 'unclear';

export interface AiLevel { price: number; kind: string; note: string }

export interface AiChart {
  view: string;
  readable: boolean;
  last_price: number | null;
  ma_position: string;
  ma_slope: string;
  cloud: string;
  macd: string;
  last_candle_closed: string;
  levels: AiLevel[];
  notes: string;
}

export interface AiSetup {
  setup: SetupId;
  direction: Direction;
  fit: 'complete' | 'partial' | 'poor';
  conditions: { rule: string; status: Status; evidence: string }[];
  entry: number | null;
  stop: number | null;
  target: number | null;
  reward_risk: number | null;
  notes: string;
}

export interface AiResult {
  summary: string;
  charts: AiChart[];
  context: string;
  setups: AiSetup[];
  best: { verdict: 'buy' | 'sell' | 'wait'; setup: SetupId | 'none'; direction: Direction | 'none'; reason: string };
  wait_for: string;
  checklist: Pick<Observation, 'event' | 'position' | 'slope' | 'near' | 'closed' | 'cloud' | 'macd' | 'break' | 'pattern' | 'patternDone'>;
}

export interface AiCheck {
  id: string;
  at: string;
  trigger: 'manual' | 'scheduled';
  slot?: string;
  views: string[];
  model?: string;
  usage?: { input_tokens: number; output_tokens: number };
  result?: AiResult;
  error?: string;
}

export interface AiSettings {
  url: string;
  key: string;
  withContext: boolean;
  schedule: string[];
  scheduleOn: boolean;
}

export const defaultAiSettings: AiSettings = {
  url: '',
  key: '',
  withContext: true,
  schedule: ['16:35', '20:05', '23:05'],
  scheduleOn: true,
};

export interface SnapshotImage { view: string; label: string; data: string }

export async function requestAnalysis(
  settings: AiSettings,
  images: SnapshotImage[],
  context: { symbol: string; trigger: string; note?: string },
): Promise<Pick<AiCheck, 'model' | 'usage' | 'result'>> {
  const base = settings.url.trim().replace(/\/+$/, '');
  if (!base) throw new Error('Add your AI server URL in AI settings.');
  let res: Response;
  try {
    res = await fetch(`${base}/analyze`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-access-key': settings.key },
      body: JSON.stringify({
        images: images.map(i => ({ view: i.view, label: i.label, media_type: 'image/jpeg', data: i.data })),
        context: { ...context, localTime: new Date().toString() },
      }),
    });
  } catch {
    throw new Error('Could not reach the AI server. Check the URL.');
  }
  const body = await res.json().catch(() => null);
  if (!res.ok || !body?.ok) throw new Error(body?.error ?? `AI server error ${res.status}`);
  return { model: body.model, usage: body.usage, result: body.result as AiResult };
}

// Claude Opus 5.5 list prices, USD per million tokens.
export function estimateCost(usage?: AiCheck['usage']) {
  if (!usage) return null;
  return (usage.input_tokens * 4 + usage.output_tokens * 20) / 1_000_000;
}

/** Scheduled slot ("HH:MM") due now: within 10 minutes after its time and not yet run today. */
export function dueSlot(schedule: string[], ranToday: Record<string, string>, now = new Date()): string | null {
  const today = now.toDateString();
  const mins = now.getHours() * 60 + now.getMinutes();
  for (const slot of schedule) {
    const m = /^(\d{1,2}):(\d{2})$/.exec(slot.trim());
    if (!m) continue;
    const at = Number(m[1]) * 60 + Number(m[2]);
    if (mins >= at && mins < at + 10 && ranToday[slot] !== today) return slot;
  }
  return null;
}

export function nextSlot(schedule: string[], now = new Date()): string | null {
  const mins = now.getHours() * 60 + now.getMinutes();
  const slots = schedule
    .map(s => /^(\d{1,2}):(\d{2})$/.exec(s.trim()))
    .filter((m): m is RegExpExecArray => !!m)
    .map(m => ({ label: `${m[1].padStart(2, '0')}:${m[2]}`, at: Number(m[1]) * 60 + Number(m[2]) }))
    .sort((a, b) => a.at - b.at);
  if (!slots.length) return null;
  return (slots.find(s => s.at > mins) ?? slots[0]).label;
}

// IndexedDB: checks and their snapshot images (too big for localStorage).
const DB = 'futures-desk';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore('checks', { keyPath: 'id' });
      req.result.createObjectStore('snapshots');
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx<T>(store: string, mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const t = db.transaction(store, mode);
    const req = run(t.objectStore(store));
    t.oncomplete = () => { db.close(); resolve(req.result); };
    t.onerror = () => { db.close(); reject(t.error); };
  });
}

export const checkStore = {
  put: (c: AiCheck) => tx('checks', 'readwrite', s => s.put(c)),
  all: async () => ((await tx('checks', 'readonly', s => s.getAll())) as AiCheck[]).sort((a, b) => b.at.localeCompare(a.at)),
  remove: async (id: string) => {
    await tx('checks', 'readwrite', s => s.delete(id));
    await tx('snapshots', 'readwrite', s => s.delete(IDBKeyRange.bound(`${id}:`, `${id}:￿`)));
  },
  putImage: (checkId: string, img: SnapshotImage) => tx('snapshots', 'readwrite', s => s.put(img, `${checkId}:${img.view}`)),
  images: async (checkId: string) =>
    (await tx('snapshots', 'readonly', s => s.getAll(IDBKeyRange.bound(`${checkId}:`, `${checkId}:￿`)))) as SnapshotImage[],
};
