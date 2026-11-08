import { useState } from 'react';
import { articleCount, categories, categoryOf, type KbArticle } from '../lib/kb';

// The knowledge base is the course: Market Forecast Mastery and the cycles.
// It deliberately links nowhere else in the app — the trading desk is a
// separate subject, reached from the landing page, not from in here.
export default function KnowledgeBase() {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<KbArticle | null>(null);

  const q = query.trim().toLowerCase();
  const match = (text: string) => !q || text.toLowerCase().includes(q);
  const shelves = categories
    .map(c => ({
      ...c,
      articles: c.articles.filter(a => match(a.title) || match(a.summary) || a.body.some(match)),
    }))
    .filter(c => !q || c.articles.length > 0 || match(c.title) || match(c.description));
  const written = shelves.filter(c => c.articles.length > 0);
  const planned = shelves.filter(c => c.articles.length === 0);

  if (open) {
    return (
      <article className="kb-article">
        <button className="ghost back" onClick={() => setOpen(null)}>← Back to the knowledge base</button>
        <p className="kb-crumb muted small">{categoryOf(open.id)?.title ?? 'Knowledge base'}</p>
        <h1>{open.title}</h1>
        <p className="muted lead">{open.summary}</p>
        {open.source && <p className="muted small">Source: {open.source}</p>}
        {open.body.map((para, i) =>
          para.startsWith('> ')
            ? <blockquote key={i} className="kb-quote">{para.slice(2)}</blockquote>
            : <p key={i} className="kb-para">{para}</p>,
        )}
      </article>
    );
  }

  return (
    <section className="kb">
      <h1>Knowledge base</h1>
      <p className="muted lead">
        Market Forecast Mastery lesson by lesson: the premise, the cycles, and how to read a forecast
        without fooling yourself — written down so a decision never depends on memory. {articleCount > 0
          ? `${articleCount} article${articleCount === 1 ? '' : 's'} across ${categories.length} sections.`
          : `${categories.length} sections are mapped out below; the articles are being written now.`}
      </p>

      <input
        className="kb-search"
        type="search"
        placeholder="Search the knowledge base…"
        value={query}
        onChange={e => setQuery(e.target.value)}
        aria-label="Search the knowledge base"
      />

      {written.length > 0 && <h2>Read now</h2>}
      <div className="kb-grid">
        {written.map(c => (
          <section key={c.id} className="kb-card live">
            <h3>{c.title}</h3>
            <ul className="kb-articles">
              {c.articles.map(a => (
                <li key={a.id}>
                  <button className="link" onClick={() => setOpen(a)}>{a.title}</button>
                  <span className="muted small"> — {a.summary}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {planned.length > 0 && <h2>Sections being written</h2>}
      {shelves.length === 0 && <p className="muted">Nothing matches “{query}”.</p>}
      <div className="kb-grid">
        {planned.map(c => (
          <section key={c.id} className="kb-card">
            <h3>{c.title}</h3>
            <p className="muted small">{c.description}</p>
            <span className="kb-meta">No articles yet</span>
          </section>
        ))}
      </div>
    </section>
  );
}
