import type { ReactNode } from 'react';
import {
  FIELD_OPTIONS, SETUPS, evaluate, riskPlan, trendContext, verdict,
  type Direction, type ObsField, type Observation, type PlanInput, type SetupId,
} from '../lib/rules';
import type { Decision } from '../lib/store';
import type { Timeframe } from '../lib/streams';

export interface Draft {
  symbol: string;
  price: string;
  direction: Direction;
  setup: SetupId;
  full: boolean;
  plan: PlanInput;
  note: string;
}

interface Props {
  timeframe: Timeframe;
  obs: Observation;
  context: Observation;
  draft: Draft;
  onObs: (field: ObsField, value: string) => void;
  onDraft: (patch: Partial<Draft>) => void;
  onClear: () => void;
  onLog: (decision: Decision) => void;
  top?: ReactNode;
}

const STATE_LABEL = { met: '✓', not: '✕', unknown: '?' } as const;

export default function DecisionPanel({ timeframe, obs, context, draft, onObs, onDraft, onClear, onLog, top }: Props) {
  const { direction, setup, full, plan } = draft;
  const ev = evaluate(obs, direction, setup, full);
  const rp = riskPlan(plan, direction);
  const v = verdict(ev, rp, direction);
  const ctx = trendContext(context);
  const againstContext = timeframe === '5m' && ctx.bias !== null && ctx.bias !== direction;
  const setPlan = (k: keyof PlanInput, val: string) => onDraft({ plan: { ...plan, [k]: val } });

  return (
    <aside className="panel" aria-label="Trade decision">
      {top}
      <div className="panel-head">
        <h2>Decide <span className="muted">· {timeframe}</span></h2>
        {timeframe === '5m' && (
          <span className={`chip ${ctx.tone}`} title="From your observations on the 1W · 60m tab">
            1H context: {ctx.label}
          </span>
        )}
      </div>

      <div className="dir-toggle" role="radiogroup" aria-label="Direction">
        <button className={direction === 'long' ? 'buy on' : 'buy'} onClick={() => onDraft({ direction: 'long' })}>▲ Buy / Long</button>
        <button className={direction === 'short' ? 'sell on' : 'sell'} onClick={() => onDraft({ direction: 'short' })}>▼ Sell / Short</button>
      </div>

      <label className="field-label">Setup</label>
      <div className="setups">
        {(Object.keys(SETUPS) as SetupId[]).map(id => (
          <button key={id} className={id === setup ? 'setup on' : 'setup'} onClick={() => onDraft({ setup: id })} title={SETUPS[id].short}>
            {SETUPS[id].name}
            {SETUPS[id].risk === 'higher' && <span className="tag">higher risk</span>}
          </button>
        ))}
      </div>
      <p className="hint">{SETUPS[setup].short}</p>

      <div className="checks-head">
        <label className="field-label">Checklist</label>
        <label className="switch">
          <input type="checkbox" checked={full} onChange={e => onDraft({ full: e.target.checked })} />
          Full (MA + cloud + MACD)
        </label>
      </div>
      <ul className="checks">
        {ev.rows.map(r => (
          <li key={r.key + r.label} className={`check ${r.state}`}>
            <div className="check-top">
              <span className="state" aria-label={r.state}>{STATE_LABEL[r.state]}</span>
              <span className="check-label" title={r.help}>{r.label}</span>
            </div>
            {r.key === 'bars' ? (
              <div className="opts">
                <input inputMode="numeric" placeholder="closes" value={obs.bars} onChange={e => onObs('bars', e.target.value)} />
                <span className="muted">of</span>
                <input inputMode="numeric" placeholder="your min" value={obs.required} onChange={e => onObs('required', e.target.value)} />
              </div>
            ) : (
              <div className="opts">
                {FIELD_OPTIONS[r.key as keyof typeof FIELD_OPTIONS].map(([val, label]) => (
                  <button key={val} className={obs[r.key] === val ? 'opt on' : 'opt'} onClick={() => onObs(r.key, obs[r.key] === val ? '' : val)}>
                    {label}
                  </button>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>

      <label className="field-label">Plan (points)</label>
      <div className="plan">
        {(['entry', 'stop', 'target'] as const).map(k => (
          <label key={k}>
            <span>{k}</span>
            <input inputMode="decimal" value={plan[k]} onChange={e => setPlan(k, e.target.value)} />
          </label>
        ))}
        <label>
          <span>costs</span>
          <input inputMode="decimal" placeholder="0" value={plan.costs} onChange={e => setPlan('costs', e.target.value)} />
        </label>
        <label>
          <span>min R:R</span>
          <input inputMode="decimal" placeholder="—" value={plan.minRR} onChange={e => setPlan('minRR', e.target.value)} />
        </label>
        <div className="rr">
          <span>R:R</span>
          <strong>{rp.valid ? rp.rr.toFixed(2) : '—'}</strong>
        </div>
      </div>
      <p className="hint">
        Stop: {direction === 'long' ? 'below the nearest swing low' : 'above the nearest swing high'}. Target:{' '}
        {direction === 'long' ? 'next line up, or the lowest edge of the upper cluster' : 'next line down, or the highest edge of the lower cluster'}.
      </p>

      <div className={`verdict ${v.tone}`} role="status">
        <strong>{v.title}</strong>
        <span>{v.detail}</span>
        {againstContext && <span className="warn-line">⚠ Against the hourly context</span>}
        {SETUPS[setup].risk === 'higher' && <span className="warn-line">⚠ Source calls this a higher-risk entry</span>}
      </div>

      <div className="log-row">
        <label>
          <span>Symbol</span>
          <input value={draft.symbol} onChange={e => onDraft({ symbol: e.target.value })} />
        </label>
        <label>
          <span>Price now</span>
          <input inputMode="decimal" value={draft.price} onChange={e => onDraft({ price: e.target.value })} />
        </label>
      </div>
      <textarea placeholder="Note (what you see, why you acted)" value={draft.note} onChange={e => onDraft({ note: e.target.value })} rows={2} />
      <div className="log-actions">
        <button className="primary" onClick={() => onLog('took')}>Log · took it</button>
        <button onClick={() => onLog('watching')}>Watching</button>
        <button onClick={() => onLog('skipped')}>Skipped</button>
      </div>
      <button className="link" onClick={onClear}>Clear {timeframe} observations</button>
    </aside>
  );
}
