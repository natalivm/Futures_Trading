import { useState } from 'react';
import { estimateCost, type AiCheck, type AiSettings } from '../lib/ai';
import { SETUPS } from '../lib/rules';
import { streams } from '../lib/streams';

interface Props {
  settings: AiSettings;
  onSettings: (s: AiSettings) => void;
  sharing: boolean;
  busy: string | null;
  error: string | null;
  check: AiCheck | null;
  next: string | null;
  onShare: () => void;
  onStopShare: () => void;
  onAnalyze: () => void;
  onApply: (check: AiCheck) => void;
}

const VERDICT = { buy: 'BUY', sell: 'SELL', wait: 'WAIT' } as const;
const STATUS = { met: '✓', not_met: '✕', unclear: '?' } as const;

export default function AiPanel(p: Props) {
  const [editing, setEditing] = useState(false);
  const r = p.check?.result;
  const cost = estimateCost(p.check?.usage);

  return (
    <section className="ai">
      <div className="ai-head">
        <h3>AI check</h3>
        <button className="ghost small-btn" onClick={() => setEditing(true)} title="AI settings">⚙ Settings</button>
      </div>

      {!p.settings.url ? (
        <button className="primary" onClick={() => setEditing(true)}>Connect your AI server</button>
      ) : (
        <>
          <div className="ai-actions">
            {p.sharing ? (
              <button className="sharing" onClick={p.onStopShare} title="Stop sharing this tab">● Sharing</button>
            ) : (
              <button onClick={p.onShare} title="Allow this page to capture the charts">Share tab</button>
            )}
            <button className="primary" onClick={p.onAnalyze} disabled={!!p.busy}>
              {p.busy ? 'Working…' : 'Analyze now'}
            </button>
          </div>
          <label className="switch">
            <input type="checkbox" checked={p.settings.withContext} onChange={e => p.onSettings({ ...p.settings, withContext: e.target.checked })} />
            Include 1W · 60m context
          </label>
          <p className="hint">
            {p.settings.scheduleOn && p.settings.schedule.length
              ? <>Auto checks {p.settings.schedule.join(' · ')}{p.next && <> — next <strong>{p.next}</strong></>}{!p.sharing && <span className="warn-text"> · share the tab so they can run</span>}</>
              : 'Auto checks off'}
          </p>
        </>
      )}

      {p.busy && <p className="ai-busy">{p.busy}</p>}
      {p.error && <p className="ai-error">{p.error}</p>}

      {r && p.check && (
        <div className={`ai-result ${r.best.verdict}`}>
          <div className="ai-verdict">
            <strong>{VERDICT[r.best.verdict]}</strong>
            <span>
              {r.best.setup !== 'none' ? `${SETUPS[r.best.setup].name} · ${r.best.direction}` : 'No setup'}
            </span>
            <time>{new Date(p.check.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{p.check.trigger === 'scheduled' && ' · auto'}</time>
          </div>
          <p>{r.summary}</p>
          <p className="ai-reason"><strong>Why:</strong> {r.best.reason}</p>
          {r.wait_for && <p className="ai-reason"><strong>Wait for:</strong> {r.wait_for}</p>}
          {r.charts[0]?.levels.length > 0 && (
            <div className="levels">
              {[...r.charts[0].levels].sort((a, b) => b.price - a.price).map(l => (
                <span key={`${l.price}-${l.kind}`} className={`level ${l.kind}`} title={l.note}>{l.price} <small>{l.kind}</small></span>
              ))}
            </div>
          )}
          <details>
            <summary>All setups & conditions</summary>
            <p className="muted small">{r.context}</p>
            {r.setups.map(s => (
              <div key={s.setup + s.direction} className="ai-setup">
                <div className="ai-setup-head">
                  <strong>{SETUPS[s.setup]?.name ?? s.setup} · {s.direction}</strong>
                  <span className={`fit ${s.fit}`}>{s.fit}</span>
                </div>
                <ul>
                  {s.conditions.map(c => (
                    <li key={c.rule} className={c.status}><span>{STATUS[c.status]}</span> {c.rule} <em>— {c.evidence}</em></li>
                  ))}
                </ul>
                {(s.entry ?? s.stop ?? s.target) !== null && (
                  <p className="small">Entry {s.entry ?? '—'} · Stop {s.stop ?? '—'} · Target {s.target ?? '—'}{s.reward_risk !== null && ` · R:R ${s.reward_risk.toFixed(2)}`}</p>
                )}
                {s.notes && <p className="muted small">{s.notes}</p>}
              </div>
            ))}
            {r.charts.map(c => (
              <p key={c.view} className="muted small">
                <strong>{streams.find(s => s.id === c.view)?.tab ?? c.view}:</strong> price {c.last_price ?? '?'}, MA {c.ma_position}/{c.ma_slope}, cloud {c.cloud}, MACD {c.macd}, last candle closed: {c.last_candle_closed}. {c.notes}
              </p>
            ))}
          </details>
          <div className="ai-foot">
            <button onClick={() => p.onApply(p.check!)}>Apply to checklist</button>
            {cost !== null && <span className="muted small">≈ ${cost.toFixed(3)}</span>}
          </div>
        </div>
      )}

      {editing && <AiSettingsDialog settings={p.settings} onSave={s => { p.onSettings(s); setEditing(false); }} onClose={() => setEditing(false)} />}
    </section>
  );
}

function AiSettingsDialog({ settings, onSave, onClose }: { settings: AiSettings; onSave: (s: AiSettings) => void; onClose: () => void }) {
  const [url, setUrl] = useState(settings.url);
  const [key, setKey] = useState(settings.key);
  const [times, setTimes] = useState(settings.schedule.join(', '));
  const [on, setOn] = useState(settings.scheduleOn);
  const [test, setTest] = useState('');

  const schedule = times.split(/[,\s]+/).map(t => t.trim()).filter(t => /^\d{1,2}:\d{2}$/.test(t));
  const testConnection = async () => {
    setTest('Testing…');
    try {
      const res = await fetch(`${url.trim().replace(/\/+$/, '')}/`);
      const body = await res.json();
      setTest(body?.ok ? '✓ Server is reachable' : 'Unexpected reply');
    } catch {
      setTest('✕ Could not reach that URL');
    }
  };

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label="AI settings" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-card">
        <h3>AI settings</h3>
        <label>
          <span>AI server URL</span>
          <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://futures-desk-ai.<you>.workers.dev" />
        </label>
        <label>
          <span>Access password</span>
          <input type="password" value={key} onChange={e => setKey(e.target.value)} autoComplete="off" />
        </label>
        <div className="row">
          <button onClick={testConnection} disabled={!url.trim()}>Test connection</button>
          <span className="muted small">{test}</span>
        </div>
        <label>
          <span>Auto-check times (your local time)</span>
          <input value={times} onChange={e => setTimes(e.target.value)} placeholder="16:35, 20:05, 23:05" />
        </label>
        <label className="switch">
          <input type="checkbox" checked={on} onChange={e => setOn(e.target.checked)} />
          Run auto checks while this page is open and the tab is shared
        </label>
        <p className="muted small">Saved in this browser only. The password protects your AI server from other people using your credits.</p>
        <div className="row end">
          <button onClick={onClose}>Cancel</button>
          <button className="primary" onClick={() => onSave({ ...settings, url: url.trim(), key, schedule, scheduleOn: on })}>Save</button>
        </div>
      </div>
    </div>
  );
}
