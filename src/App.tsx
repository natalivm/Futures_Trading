import { useCallback, useEffect, useRef, useState } from 'react';
import AiHistory from './components/AiHistory';
import AiPanel from './components/AiPanel';
import ChartStage, { type ChartStageHandle } from './components/ChartStage';
import DecisionPanel, { type Draft } from './components/DecisionPanel';
import LogView from './components/LogView';
import RulesView from './components/RulesView';
import {
  AI_ENABLED, checkStore, defaultAiSettings, dueSlot, nextSlot, requestAnalysis,
  type AiCheck, type AiSettings, type SnapshotImage,
} from './lib/ai';
import { TabCapture } from './lib/capture';
import { evaluate, freshObservation, riskPlan, verdict, type ObsField, type Observation } from './lib/rules';
import { SCHEMA_VERSION, useStored, type Decision, type LogEntry } from './lib/store';
import { streams, type Timeframe } from './lib/streams';

type Page = 'live' | 'log' | 'rules';
const PAGES: [Page, string][] = [['live', 'Live desk'], ['log', 'Signal log'], ['rules', 'Rules']];

const initialDraft: Draft = {
  symbol: '@ES', price: '', direction: 'long', setup: 'reversal', full: true,
  plan: { entry: '', stop: '', target: '', costs: '', minRR: '' }, note: '',
};
const freshObservations = (): Record<Timeframe, Observation> => ({ '5m': freshObservation(), '60m': freshObservation() });
const wait = (ms: number) => new Promise(r => setTimeout(r, ms));
const AI_LINK_MINUTES = 30;

function pageFromHash(): Page {
  const h = location.hash.slice(1);
  return PAGES.some(([p]) => p === h) ? (h as Page) : 'live';
}

function notify(title: string, body: string) {
  try {
    if ('Notification' in window && Notification.permission === 'granted') new Notification(title, { body });
  } catch {
    // notifications unavailable
  }
}

// Earlier versions kept the checklist and draft across reloads.
try {
  localStorage.removeItem('ft-observations');
  localStorage.removeItem('ft-draft');
} catch {
  // storage blocked
}

export default function App() {
  const [page, setPage] = useState<Page>(pageFromHash);
  const [ui, setUi] = useStored('ft-ui', { view: streams[0].id, focus: false });
  // Checklist, plan, price and note start clean on every page load.
  const [observations, setObservations] = useState(freshObservations);
  const [prefs, setPrefs] = useStored('ft-prefs', { symbol: '@ES', full: true });
  const [draft, setDraft] = useState<Draft>(() => ({ ...initialDraft, ...prefs }));
  const [log, setLog] = useStored<LogEntry[]>('ft-log', []);
  const [toast, setToast] = useState('');

  const [aiSettings, setAiSettings] = useStored<AiSettings>('ft-ai', defaultAiSettings);
  const [ranToday, setRanToday] = useStored<Record<string, string>>('ft-ai-ran', {});
  const [sharing, setSharing] = useState(false);
  const [aiBusy, setAiBusy] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [lastCheck, setLastCheck] = useState<AiCheck | null>(null);
  const [historyVersion, setHistoryVersion] = useState(0);
  const [, setTick] = useState(0);

  const capture = useRef(new TabCapture());
  const stageRef = useRef<ChartStageHandle>(null);
  const busyRef = useRef(false);
  const uiRef = useRef(ui);
  uiRef.current = ui;
  const pageRef = useRef(page);
  pageRef.current = page;

  const stream = streams.find(s => s.id === ui.view) ?? streams[0];
  const tf = stream.timeframe;

  useEffect(() => {
    const onHash = () => setPage(pageFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    capture.current.onEnded = () => setSharing(false);
    checkStore.all().then(all => setLastCheck(all.find(c => c.result) ?? null)).catch(() => {});
    return () => capture.current.stop();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (page !== 'live' || e.metaKey || e.ctrlKey || e.altKey || /INPUT|TEXTAREA|SELECT/.test(t.tagName)) return;
      const i = Number(e.key) - 1;
      if (streams[i]) setUi(u => ({ ...u, view: streams[i].id }));
      if (e.key === 'f') setUi(u => ({ ...u, focus: !u.focus }));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [page, setUi]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(''), 3000);
    return () => clearTimeout(id);
  }, [toast]);

  const go = (p: Page) => { location.hash = p; setPage(p); };

  const startSharing = async () => {
    if (!AI_ENABLED) return false;
    try {
      if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();
      await capture.current.start();
      setSharing(true);
      setAiError(null);
      return true;
    } catch (e) {
      setAiError(e instanceof Error && e.name !== 'NotAllowedError' ? e.message : 'Tab sharing was not allowed.');
      return false;
    }
  };

  const stopSharing = () => {
    capture.current.stop();
    setSharing(false);
  };

  const runCheck = useCallback(async (trigger: AiCheck['trigger'], slot?: string) => {
    if (!AI_ENABLED || busyRef.current) return;
    const check: AiCheck = { id: crypto.randomUUID(), at: new Date().toISOString(), trigger, slot, views: [] };
    const fail = async (message: string) => {
      setAiError(message);
      if (trigger === 'scheduled') {
        await checkStore.put({ ...check, error: message }).catch(() => {});
        setHistoryVersion(v => v + 1);
        notify(`${slot} check failed`, message);
      }
    };

    if (!capture.current.active) {
      if (trigger === 'scheduled' || !(await startSharing())) {
        await fail(trigger === 'scheduled' ? 'Tab was not shared, so the scheduled check could not capture the charts.' : 'Share the tab to capture the charts.');
        return;
      }
      setSharing(true);
    }

    busyRef.current = true;
    setAiError(null);
    const original = uiRef.current.view;
    const primary = streams.find(s => s.id === original && s.timeframe === '5m') ?? streams[0];
    const views = [primary, ...(aiSettings.withContext ? streams.filter(s => s.timeframe === '60m') : [])];
    const images: SnapshotImage[] = [];
    try {
      if (pageRef.current !== 'live') {
        go('live');
        await wait(8000);
      }
      for (const s of views) {
        setAiBusy(`Capturing ${s.tab}…`);
        if (uiRef.current.view !== s.id) await stageRef.current?.show(s.id);
        else await wait(300);
        const player = stageRef.current?.player();
        if (!player) throw new Error('Chart area not found.');
        images.push({ view: s.id, label: `${s.tab} — ${s.label}`, data: capture.current.grab(player).data });
      }
      if (uiRef.current.view !== original) await stageRef.current?.show(original);

      setAiBusy('Asking Claude… (usually 20–60 seconds)');
      const out = await requestAnalysis(aiSettings, images, { symbol: draft.symbol || '@ES', trigger: slot ? `scheduled ${slot}` : 'manual' });
      const done: AiCheck = { ...check, views: images.map(i => i.view), ...out };
      await checkStore.put(done).catch(() => {});
      await Promise.all(images.map(i => checkStore.putImage(done.id, i))).catch(() => {});
      setLastCheck(done);
      setHistoryVersion(v => v + 1);
      const v = out.result?.best.verdict.toUpperCase() ?? '';
      if (trigger === 'scheduled' || document.hidden) notify(`${slot ?? 'AI'} check: ${v}`, out.result?.summary ?? '');
      setToast(`AI check: ${v}`);
    } catch (e) {
      await fail(e instanceof Error ? e.message : 'The AI check failed.');
    } finally {
      busyRef.current = false;
      setAiBusy(null);
    }
  }, [aiSettings, draft.symbol]);

  // Scheduled checks: look every 20 s for a due slot that hasn't run today.
  useEffect(() => {
    const id = setInterval(() => {
      setTick(t => t + 1);
      if (!AI_ENABLED || !aiSettings.scheduleOn || !aiSettings.url) return;
      const slot = dueSlot(aiSettings.schedule, ranToday);
      if (!slot) return;
      setRanToday(r => ({ ...r, [slot]: new Date().toDateString() }));
      runCheck('scheduled', slot);
    }, 20_000);
    return () => clearInterval(id);
  }, [aiSettings, ranToday, setRanToday, runCheck]);

  const setObs = (field: ObsField, value: string) =>
    setObservations(o => ({ ...o, [tf]: { ...o[tf], [field]: value } }));

  const updateDraft = (patch: Partial<Draft>) => {
    setDraft(d => ({ ...d, ...patch }));
    if ('symbol' in patch || 'full' in patch) {
      setPrefs(p => ({ symbol: patch.symbol ?? p.symbol, full: patch.full ?? p.full }));
    }
  };

  const applyCheck = (c: AiCheck) => {
    if (!c.result) return;
    setObservations(o => ({ ...o, '5m': { ...o['5m'], ...c.result!.checklist } }));
    const { best } = c.result;
    if (best.setup !== 'none' && best.direction !== 'none') updateDraft({ direction: best.direction, setup: best.setup });
    if (tf !== '5m') setUi(u => ({ ...u, view: streams[0].id }));
    setToast('Checklist filled from the AI check — review each item');
  };

  const logSignal = (decision: Decision) => {
    const obs = observations[tf];
    const ev = evaluate(obs, draft.direction, draft.setup, draft.full);
    const rp = riskPlan(draft.plan, draft.direction);
    const recentAi = lastCheck?.result && Date.now() - Date.parse(lastCheck.at) < AI_LINK_MINUTES * 60_000 ? lastCheck : null;
    const entry: LogEntry = {
      schema: SCHEMA_VERSION,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      symbol: draft.symbol.trim() || '@ES',
      view: stream.id,
      timeframe: tf,
      price: draft.price,
      direction: draft.direction,
      setup: draft.setup,
      fullChecklist: draft.full,
      observation: { ...obs },
      context60m: { ...observations['60m'] },
      checks: ev.counts,
      verdict: verdict(ev, rp, draft.direction).title,
      plan: { ...draft.plan },
      rr: rp.valid ? rp.rr : null,
      decision,
      result: decision === 'took' ? 'open' : 'not-taken',
      exitPrice: '',
      closedAt: '',
      note: draft.note,
      ...(recentAi?.result && {
        ai: { checkId: recentAi.id, verdict: recentAi.result.best.verdict, setup: recentAi.result.best.setup, direction: recentAi.result.best.direction },
      }),
    };
    setLog(l => [entry, ...l]);
    setDraft(d => ({ ...d, note: '' }));
    setToast(`Logged: ${decision === 'took' ? 'trade taken' : decision}`);
  };

  return (
    <div className={`app ${page === 'live' ? 'is-live' : ''}`}>
      <header className="top">
        <a className="brand" href="#live" onClick={() => go('live')}>
          <span className="mark">M</span>
          <span>Futures Desk<small>Matrixchannel · {draft.symbol || '@ES'}</small></span>
        </a>
        <nav>
          {PAGES.map(([p, label]) => (
            <button key={p} className={p === page ? 'nav on' : 'nav'} onClick={() => go(p)}>
              {label}
              {p === 'log' && log.length > 0 && <span className="count">{log.length}</span>}
            </button>
          ))}
        </nav>
        {aiBusy && <span className="top-status">{aiBusy}</span>}
      </header>

      {page === 'live' && (
        <main className={`desk ${ui.focus ? 'focus' : ''}`}>
          <ChartStage
            ref={stageRef}
            active={stream.id}
            onSelect={id => setUi(u => ({ ...u, view: id }))}
            focus={ui.focus}
            onToggleFocus={() => setUi(u => ({ ...u, focus: !u.focus }))}
          />
          {!ui.focus && (
            <DecisionPanel
              timeframe={tf}
              obs={observations[tf]}
              context={observations['60m']}
              draft={draft}
              onObs={setObs}
              onDraft={updateDraft}
              onClear={() => setObservations(o => ({ ...o, [tf]: freshObservation() }))}
              onLog={logSignal}
              top={
                <AiPanel
                  settings={aiSettings}
                  onSettings={setAiSettings}
                  sharing={sharing}
                  busy={aiBusy}
                  error={aiError}
                  check={lastCheck}
                  next={aiSettings.scheduleOn ? nextSlot(aiSettings.schedule) : null}
                  onShare={startSharing}
                  onStopShare={stopSharing}
                  onAnalyze={() => runCheck('manual')}
                  onApply={applyCheck}
                />
              }
            />
          )}
        </main>
      )}
      {page === 'log' && (
        <main className="page">
          <LogView
            log={log}
            onUpdate={(id, patch) => setLog(l => l.map(e => (e.id === id ? { ...e, ...patch } : e)))}
            onDelete={id => setLog(l => l.filter(e => e.id !== id))}
            onImport={entries => {
              setLog(l => {
                const ids = new Set(l.map(e => e.id));
                return [...entries.filter(e => !ids.has(e.id)), ...l].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
              });
              setToast(`Imported ${entries.length} signals`);
            }}
          />
          <AiHistory version={historyVersion} onDeleted={id => lastCheck?.id === id && setLastCheck(null)} />
        </main>
      )}
      {page === 'rules' && (
        <main className="page">
          <RulesView />
        </main>
      )}

      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}
