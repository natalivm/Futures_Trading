import { articleCount, categories } from '../lib/kb';
import type { Page } from '../lib/nav';
import { streams } from '../lib/streams';

interface Props {
  symbol: string;
  logCount: number;
  onGo: (page: Page) => void;
}

export default function HomeView({ symbol, logCount, onGo }: Props) {
  return (
    <div className="home">
      <section className="hero">
        <p className="eyebrow">Market Forecast Mastery · Matrixchannel · {symbol || '@ES'}</p>
        <h1>Forecast the move. Read the levels. Log the decision.</h1>
        <p className="lead">
          Two halves of the same desk: the live charts where trades are decided, and the knowledge base
          holding the course behind them — Gann’s law of periodicity through to the three techniques.
          Start wherever you are.
        </p>
      </section>

      <div className="doors">
        <button type="button" className="door trade" onClick={() => onGo('live')}>
          <span className="door-icon" aria-hidden="true">📈</span>
          <h2>Futures trading</h2>
          <p>
            The {streams.length} live Matrixchannel streams in large tabs, the buy/sell checklist beside them,
            and a stop/target/R:R plan before anything is logged.
          </p>
          <ul className="door-list">
            <li>Live 5-minute and hourly charts</li>
            <li>Checklist → BUY / SELL / WAIT verdict</li>
            <li>Optional AI chart check</li>
          </ul>
          <span className="door-cta">Open the desk →</span>
        </button>

        <button type="button" className="door learn" onClick={() => onGo('kb')}>
          <span className="door-icon" aria-hidden="true">📚</span>
          <h2>Knowledge base</h2>
          <p>
            Market Forecast Mastery in one place — the premise, the two ways to forecast and the
            three techniques — plus the Matrixchannel rules the desk trades by.
          </p>
          <ul className="door-list">
            <li>{articleCount > 0 ? `${articleCount} article${articleCount === 1 ? '' : 's'} published` : 'First articles going up'}, {categories.length} sections mapped</li>
            <li>Gann · Baumring · Reminick</li>
            <li>Series &amp; sequences · Slide · Momentum Balance</li>
          </ul>
          <span className="door-cta">Browse the knowledge base →</span>
        </button>
      </div>

      <div className="quick">
        <button type="button" className="quick-card" onClick={() => onGo('log')}>
          <strong>Signal log</strong>
          <span className="muted small">
            {logCount > 0 ? `${logCount} logged decision${logCount === 1 ? '' : 's'}` : 'No signals logged yet'} · export CSV / JSON
          </span>
        </button>
        <button type="button" className="quick-card" onClick={() => onGo('rules')}>
          <strong>Rules</strong>
          <span className="muted small">How and when to buy or sell, in one page</span>
        </button>
        <a
          className="quick-card"
          href="https://tradeforecastmastery.com/matrixchannel-indicator-info"
          target="_blank"
          rel="noreferrer"
        >
          <strong>Matrixchannel source ↗</strong>
          <span className="muted small">Trade Forecast Mastery — streams and method</span>
        </a>
      </div>

      <p className="home-foot muted small">
        Everything is saved in this browser only (localStorage). Export the log regularly.
      </p>
    </div>
  );
}
