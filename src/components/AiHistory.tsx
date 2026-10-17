import { useEffect, useState } from 'react';
import { checkStore, estimateCost, type AiCheck, type SnapshotImage } from '../lib/ai';
import { SETUPS } from '../lib/rules';
import { download } from '../lib/store';

interface Props {
  version: number;
  onDeleted: (id: string) => void;
}

export default function AiHistory({ version, onDeleted }: Props) {
  const [checks, setChecks] = useState<AiCheck[]>([]);
  const [open, setOpen] = useState<{ check: AiCheck; images: SnapshotImage[] } | null>(null);

  useEffect(() => {
    checkStore.all().then(setChecks).catch(() => setChecks([]));
  }, [version]);

  const total = checks.reduce((a, c) => a + (estimateCost(c.usage) ?? 0), 0);
  const view = async (check: AiCheck) => setOpen({ check, images: await checkStore.images(check.id).catch(() => []) });
  const remove = async (id: string) => {
    if (!confirm('Delete this AI check and its snapshots?')) return;
    await checkStore.remove(id);
    setChecks(cs => cs.filter(c => c.id !== id));
    onDeleted(id);
  };

  return (
    <section className="ai-history">
      <div className="log-head">
        <div>
          <h2>AI checks</h2>
          <p className="muted">Every snapshot analysis, with its chart images. {checks.length > 0 && `${checks.length} checks · ≈ $${total.toFixed(2)} total.`}</p>
        </div>
        <div className="log-tools">
          <button
            disabled={!checks.length}
            onClick={() => download(`ai-checks-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify({ exportedAt: new Date().toISOString(), checks }, null, 2), 'application/json')}
          >
            Export JSON
          </button>
        </div>
      </div>

      {!checks.length ? (
        <div className="empty">No AI checks yet. Connect your AI server on the Live desk and press <strong>Analyze now</strong>.</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>When</th><th>Type</th><th>Verdict</th><th>Best setup</th><th>Summary</th><th>Cost</th><th /></tr>
            </thead>
            <tbody>
              {checks.map(c => {
                const r = c.result;
                const cost = estimateCost(c.usage);
                return (
                  <tr key={c.id}>
                    <td className="nowrap">{new Date(c.at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="nowrap">{c.trigger === 'scheduled' ? `Auto ${c.slot ?? ''}` : 'Manual'}</td>
                    <td>{r ? <span className={`side ${r.best.verdict === 'buy' ? 'buy' : r.best.verdict === 'sell' ? 'sell' : 'unk'}`}>{r.best.verdict.toUpperCase()}</span> : <span className="neg">Failed</span>}</td>
                    <td className="nowrap">{r && r.best.setup !== 'none' ? `${SETUPS[r.best.setup].name} · ${r.best.direction}` : '—'}</td>
                    <td className="summary-cell">{r?.summary ?? c.error}</td>
                    <td className="nowrap">{cost !== null ? `$${cost.toFixed(3)}` : '—'}</td>
                    <td className="nowrap">
                      {r && <button className="small-btn" onClick={() => view(c)}>View</button>}{' '}
                      <button className="link danger" onClick={() => remove(c.id)} aria-label="Delete">✕</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {open && (
        <div className="modal" role="dialog" aria-modal="true" aria-label="AI check" onClick={e => e.target === e.currentTarget && setOpen(null)}>
          <div className="modal-card wide">
            <div className="row">
              <h3>{new Date(open.check.at).toLocaleString()} · {open.check.result?.best.verdict.toUpperCase()}</h3>
              <button className="ghost small-btn" onClick={() => setOpen(null)}>Close ✕</button>
            </div>
            <p>{open.check.result?.summary}</p>
            <p className="muted small"><strong>Why:</strong> {open.check.result?.best.reason}</p>
            {open.images.length === 0 && <p className="muted small">No snapshots stored for this check.</p>}
            {open.images.map(img => (
              <figure key={img.view}>
                <figcaption className="muted small">{img.label}</figcaption>
                <img src={`data:image/jpeg;base64,${img.data}`} alt={img.label} />
              </figure>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
