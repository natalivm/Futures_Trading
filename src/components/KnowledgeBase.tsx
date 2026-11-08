import { useState } from 'react';
import { articleCount, categories, categoryOf, relatedPages, type KbArticle } from '../lib/kb';
import type { Page } from '../lib/nav';

interface Props {
  onGo: (page: Page) => void;
}

export default function KnowledgeBase({ onGo }: Props) {
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
  const related = relatedPages.filter(r => !q || match(r.title) || match(r.summary));

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
        Market Forecast Mastery lesson by lesson, plus the Matrixchannel rules, the risk limits and the
        tools behind the desk — written down so a decision never depends on memory. {articleCount > 0
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

      {written.length + related.length > 0 && <h2>Read now</h2>}
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
        {related.map(r => (
          <button type="button" key={r.page} className="kb-card live" onClick={() => onGo(r.page)}>
            <h3>{r.title}</h3>
            <p className="muted small">{r.summary}</p>
            <span className="kb-meta ready">Open →</span>
          </button>
        ))}
      </div>

      {planned.length > 0 && <h2>Sections being written</h2>}
      {shelves.length === 0 && related.length === 0 && <p className="muted">Nothing matches “{query}”.</p>}
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
