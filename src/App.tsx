import { useEffect, useState } from 'react';
import ChartStage from './components/ChartStage';
import DecisionPanel, { type Draft } from './components/DecisionPanel';
import LogView from './components/LogView';
import RulesView from './components/RulesView';
import { evaluate, freshObservation, riskPlan, verdict, type ObsField, type Observation } from './lib/rules';
import { SCHEMA_VERSION, useStored, type Decision, type LogEntry } from './lib/store';
import { streams, type Timeframe } from './lib/streams';

type Page = 'live' | 'log' | 'rules';
const PAGES: [Page, string][] = [['live', 'Live desk'], ['log', 'Signal log'], ['rules', 'Rules']];

const initialDraft: Draft = {
  symbol: '@ES', price: '', direction: 'long', setup: 'reversal', full: true,
  plan: { entry: '', stop: '', target: '', costs: '', minRR: '' }, note: '',
};

function pageFromHash(): Page {
  const h = location.hash.slice(1);
  return PAGES.some(([p]) => p === h) ? (h as Page) : 'live';
}

export default function App() {
  const [page, setPage] = useState<Page>(pageFromHash);
  const [ui, setUi] = useStored('ft-ui', { view: streams[0].id, focus: false });
  const [observations, setObservations] = useStored<Record<Timeframe, Observation>>('ft-observations', {
    '5m': freshObservation(), '60m': freshObservation(),
  });
  const [draft, setDraft] = useStored<Draft>('ft-draft', initialDraft);
  const [log, setLog] = useStored<LogEntry[]>('ft-log', []);
  const [toast, setToast] = useState('');

  const stream = streams.find(s => s.id === ui.view) ?? streams[0];
  const tf = stream.timeframe;

  useEffect(() => {
    const onHash = () => setPage(pageFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
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
    const id = setTimeout(() => setToast(''), 2500);
    return () => clearTimeout(id);
  }, [toast]);

  const go = (p: Page) => { location.hash = p; setPage(p); };

  const setObs = (field: ObsField, value: string) =>
    setObservations(o => ({ ...o, [tf]: { ...o[tf], [field]: value } }));

  const logSignal = (decision: Decision) => {
    const obs = observations[tf];
    const ev = evaluate(obs, draft.direction, draft.setup, draft.full);
    const rp = riskPlan(draft.plan, draft.direction);
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
      </header>

      {page === 'live' && (
        <main className={`desk ${ui.focus ? 'focus' : ''}`}>
          <ChartStage
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
              onDraft={patch => setDraft(d => ({ ...d, ...patch }))}
              onClear={() => setObservations(o => ({ ...o, [tf]: freshObservation() }))}
              onLog={logSignal}
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
