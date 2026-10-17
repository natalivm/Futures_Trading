import { useRef } from 'react';
import { SETUPS } from '../lib/rules';
import { download, isLogEntry, outcome, toCSV, type Decision, type LogEntry, type Result } from '../lib/store';
import { streams } from '../lib/streams';

interface Props {
  log: LogEntry[];
  onUpdate: (id: string, patch: Partial<LogEntry>) => void;
  onDelete: (id: string) => void;
  onImport: (entries: LogEntry[]) => void;
}

const RESULTS: [Result, string][] = [
  ['open', 'Open'], ['target', 'Hit target'], ['stop', 'Stopped'], ['manual', 'Manual exit'], ['not-taken', 'n/a'],
];

export default function LogView({ log, onUpdate, onDelete, onImport }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const closed = log.map(e => outcome(e)).filter((o): o is { points: number; r: number } => !!o);
  const wins = closed.filter(o => o.points > 0).length;
  const rs = closed.map(o => o.r).filter(Number.isFinite);
  const avgR = rs.length ? rs.reduce((a, b) => a + b, 0) / rs.length : null;
  const stamp = new Date().toISOString().slice(0, 10);

  const importFile = async (file: File) => {
    try {
      const data = JSON.parse(await file.text());
      const entries = (Array.isArray(data) ? data : data.entries ?? []).filter(isLogEntry);
      onImport(entries);
    } catch {
      alert('That file is not a signal log backup.');
    }
  };

  return (
    <section className="log">
      <div className="log-head">
        <div>
          <h1>Signal log</h1>
          <p className="muted">Every decision you log, with the chart state at that moment. Fill in the result later — this is the dataset for the buy/sell indicator.</p>
        </div>
        <div className="log-tools">
          <button onClick={() => download(`signals-${stamp}.csv`, toCSV(log), 'text/csv')} disabled={!log.length}>Export CSV</button>
          <button onClick={() => download(`signals-${stamp}.json`, JSON.stringify({ exportedAt: new Date().toISOString(), entries: log }, null, 2), 'application/json')} disabled={!log.length}>Backup JSON</button>
          <button onClick={() => fileRef.current?.click()}>Import JSON</button>
          <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={e => { const f = e.target.files?.[0]; if (f) importFile(f); e.target.value = ''; }} />
        </div>
      </div>

      <div className="stats">
        <div><span>Logged</span><strong>{log.length}</strong></div>
        <div><span>Taken</span><strong>{log.filter(e => e.decision === 'took').length}</strong></div>
        <div><span>Closed</span><strong>{closed.length}</strong></div>
        <div><span>Win rate</span><strong>{closed.length ? `${Math.round((wins / closed.length) * 100)}%` : '—'}</strong></div>
        <div><span>Avg R</span><strong>{avgR === null ? '—' : avgR.toFixed(2)}</strong></div>
      </div>

      {!log.length ? (
        <div className="empty">No signals yet. On the Live desk, fill the checklist and press <strong>Log</strong>.</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>When</th><th>Chart</th><th>Side</th><th>Setup</th><th>Checklist</th><th>Plan</th>
                <th>Decision</th><th>Result</th><th>Exit</th><th>Pts / R</th><th>Note</th><th />
              </tr>
            </thead>
            <tbody>
              {log.map(e => {
                const o = outcome(e);
                const view = streams.find(s => s.id === e.view)?.tab ?? e.timeframe;
                return (
                  <tr key={e.id}>
                    <td className="nowrap">{new Date(e.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="nowrap">{e.symbol} · {view}{e.price && <div className="muted">@ {e.price}</div>}</td>
                    <td><span className={e.direction === 'long' ? 'side buy' : 'side sell'}>{e.direction === 'long' ? 'BUY' : 'SELL'}</span></td>
                    <td>{SETUPS[e.setup]?.name ?? e.setup}</td>
                    <td className="nowrap" title={e.verdict}>
                      <span className="met">{e.checks.met}✓</span> <span className="not">{e.checks.not}✕</span> <span className="unk">{e.checks.unknown}?</span>
                    </td>
                    <td className="nowrap">
                      {e.plan.entry ? `${e.plan.entry} / ${e.plan.stop} / ${e.plan.target}` : '—'}
                      {e.rr !== null && <div className="muted">R:R {e.rr.toFixed(2)}</div>}
                    </td>
                    <td>
                      <select value={e.decision} onChange={ev => onUpdate(e.id, { decision: ev.target.value as Decision, result: ev.target.value === 'took' ? 'open' : 'not-taken' })}>
                        <option value="took">Took</option>
                        <option value="watching">Watching</option>
                        <option value="skipped">Skipped</option>
                      </select>
                    </td>
                    <td>
                      <select value={e.result} onChange={ev => onUpdate(e.id, { result: ev.target.value as Result, closedAt: ev.target.value === 'open' ? '' : new Date().toISOString() })}>
                        {RESULTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </td>
                    <td>
                      <input className="narrow" inputMode="decimal" value={e.exitPrice} placeholder={e.result === 'manual' ? 'price' : ''} disabled={e.result !== 'manual'} onChange={ev => onUpdate(e.id, { exitPrice: ev.target.value })} />
                    </td>
                    <td className={`nowrap ${o ? (o.points > 0 ? 'pos' : o.points < 0 ? 'neg' : '') : ''}`}>
                      {o ? `${o.points > 0 ? '+' : ''}${o.points.toFixed(2)} / ${Number.isFinite(o.r) ? o.r.toFixed(2) : '—'}R` : '—'}
                    </td>
                    <td><input className="note" value={e.note} onChange={ev => onUpdate(e.id, { note: ev.target.value })} /></td>
                    <td><button className="link danger" onClick={() => confirm('Delete this signal?') && onDelete(e.id)} aria-label="Delete">✕</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="muted small">Saved in this browser only. Export regularly — clearing browser data deletes the log.</p>
    </section>
  );
}
