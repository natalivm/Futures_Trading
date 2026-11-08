import { useEffect, useRef, useState } from 'react';

interface Props {
  symbol: string;
  label: string;
  interval: 'D' | 'W' | 'M';
  range?: string;
  caption?: string;
}

const INTERVAL_LABEL: Record<Props['interval'], string> = {
  D: 'Daily',
  W: 'Weekly',
  M: 'Monthly',
};

const WIDGET_SRC = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';

function chartUrl(symbol: string, interval: string) {
  return `https://www.tradingview.com/chart/?symbol=${encodeURIComponent(symbol)}&interval=${interval}`;
}

/**
 * A TradingView chart opened on the timeframe the passage is discussing.
 *
 * The widget is third-party script: it is blocked by some networks and by most
 * content blockers, and it cannot load at all offline. So the fallback is not
 * an error state — it is a normal way for this to end, and it still has to be
 * useful. It names the symbol and timeframe and links straight to the same
 * chart on tradingview.com.
 */
export default function TradingViewChart({ symbol, label, interval, range, caption }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const [near, setNear] = useState(false);

  // Everything lives on one page now, so mounting every widget at load meant
  // four third-party charts fetching at once before the reader had scrolled
  // to any of them. Each one waits until it is close to the viewport.
  useEffect(() => {
    const node = frame.current;
    if (!node || near) return;
    const observer = new IntersectionObserver(
      entries => entries.some(e => e.isIntersecting) && setNear(true),
      { rootMargin: '400px 0px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [near]);

  useEffect(() => {
    const node = host.current;
    if (!node || !near) return;
    let settled = false;

    node.innerHTML = '';
    const mount = document.createElement('div');
    mount.className = 'tradingview-widget-container__widget';
    node.appendChild(mount);

    const script = document.createElement('script');
    script.src = WIDGET_SRC;
    script.async = true;
    script.type = 'text/javascript';
    script.innerHTML = JSON.stringify({
      symbol,
      interval,
      range: range ?? '60M',
      theme: 'dark',
      style: '2',               // 2 = line: the shape is the subject, not the candles
      locale: 'en',
      autosize: true,
      hide_side_toolbar: true,
      hide_top_toolbar: false,
      allow_symbol_change: false,
      save_image: false,
      backgroundColor: 'rgba(18, 25, 36, 1)',
      gridColor: 'rgba(36, 48, 66, 0.6)',
    });
    script.onerror = () => { settled = true; setFailed(true); };
    node.appendChild(script);

    // No onload fires for a blocked request in every browser, so also give the
    // widget a few seconds to actually paint an iframe before giving up.
    const timer = window.setTimeout(() => {
      if (!settled && !node.querySelector('iframe')) setFailed(true);
    }, 6000);

    return () => {
      window.clearTimeout(timer);
      node.innerHTML = '';
    };
  }, [symbol, interval, range, near]);

  return (
    <figure className="kb-figure">
      <div className="kb-figure-head">
        <span className="kb-figure-kind">Live chart</span>
        <strong>{label}</strong>
        <span className="muted small">{INTERVAL_LABEL[interval]}</span>
        <a className="kb-figure-link" href={chartUrl(symbol, interval)} target="_blank" rel="noreferrer">
          Open on TradingView ↗
        </a>
      </div>
      {failed ? (
        <div className="kb-figure-fallback">
          <p><strong>{label}</strong> · {INTERVAL_LABEL[interval]} · <code>{symbol}</code></p>
          <p className="muted small">
            The TradingView widget could not load — it is blocked by many content blockers and by
            networks that do not allow their script host. The chart itself is one click away.
          </p>
          <a className="ghost" href={chartUrl(symbol, interval)} target="_blank" rel="noreferrer">
            Open {symbol} on TradingView ↗
          </a>
        </div>
      ) : (
        <div className="kb-tv-frame" ref={frame}>
          {/* autosize makes the widget write height:100% on its own container,
              so the fixed height has to live on a parent it does not touch. */}
          <div className="tradingview-widget-container" ref={host} />
          {!near && <p className="kb-tv-idle muted small">Chart loads when you reach it.</p>}
        </div>
      )}
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
