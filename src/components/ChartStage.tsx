import { useRef, useState } from 'react';
import { streams, streamURL } from '../lib/streams';

interface Props {
  active: string;
  onSelect: (id: string) => void;
  focus: boolean;
  onToggleFocus: () => void;
}

export default function ChartStage({ active, onSelect, focus, onToggleFocus }: Props) {
  // Streams stay mounted once opened so switching tabs is instant.
  const [loaded, setLoaded] = useState<Record<string, number>>({ [active]: 1 });
  const stageRef = useRef<HTMLDivElement>(null);
  const current = streams.find(s => s.id === active) ?? streams[0];

  const select = (id: string) => {
    setLoaded(l => (l[id] ? l : { ...l, [id]: 1 }));
    onSelect(id);
  };
  const reload = () => setLoaded(l => ({ ...l, [active]: (l[active] ?? 0) + 1 }));
  const fullscreen = () => {
    const el = stageRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen?.();
  };

  return (
    <section className="stage">
      <div className="stage-bar">
        <div className="tabs" role="tablist" aria-label="Chart views">
          {streams.map((s, i) => (
            <button
              key={s.id}
              role="tab"
              aria-selected={s.id === active}
              className={s.id === active ? 'tab active' : 'tab'}
              onClick={() => select(s.id)}
              title={`${s.label} — ${s.detail} (key ${i + 1})`}
            >
              {s.tab}
            </button>
          ))}
        </div>
        <div className="stage-meta">
          <span className="live-dot" />
          <span>{current.label}</span>
          <span className="muted">· {current.detail}</span>
        </div>
        <div className="stage-actions">
          <button className="ghost" onClick={reload} title="Reload stream if it glitches">↻ Reload</button>
          <a className="ghost" href={streamURL(current.streamId)} target="_blank" rel="noopener noreferrer">Open ↗</a>
          <button className="ghost" onClick={fullscreen} title="Fullscreen chart">⛶</button>
          <button className="ghost" onClick={onToggleFocus} title="Hide / show the decision panel (F)">
            {focus ? '◧ Panel' : '▣ Focus'}
          </button>
        </div>
      </div>
      <div className="player" ref={stageRef}>
        {streams.map(s =>
          loaded[s.id] ? (
            <iframe
              key={`${s.id}-${loaded[s.id]}`}
              src={streamURL(s.streamId)}
              title={`${s.label} live stream`}
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              hidden={s.id !== active}
            />
          ) : null,
        )}
      </div>
      <p className="stage-note">
        Live streams can glitch — always know your target price and watch your trading platform for execution data.
      </p>
    </section>
  );
}
