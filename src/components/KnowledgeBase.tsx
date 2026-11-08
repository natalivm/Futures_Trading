import { useEffect, useMemo, useRef, useState } from 'react';
import { articleCount, categories } from '../lib/kb';
import { blockText } from '../lib/kbBlocks';
import ArticleBody from './kb/ArticleBody';

/**
 * The knowledge base is one document, not a set of tabs.
 *
 * It was a grid of cards that each opened a separate view, which is the wrong
 * shape for material whose whole point is cumulative: the controls explain why
 * the scoring is ordered the way it is, the scoring explains which cycle
 * claims survive, and the one that survives is the one that then got the
 * direction wrong. Read out of order none of that lands. So: chapters in
 * reading order, everything on the page, and a contents rail that tracks
 * where you are rather than hiding the rest.
 *
 * It deliberately links nowhere else in the app — the trading desk is a
 * separate subject, reached from the landing page.
 */
export default function KnowledgeBase() {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState<string>('');
  const contentRef = useRef<HTMLDivElement>(null);

  const q = query.trim().toLowerCase();

  const chapters = useMemo(() => {
    const match = (text: string) => !q || text.toLowerCase().includes(q);
    return categories
      .map(c => ({
        ...c,
        articles: c.articles.filter(
          a => !q || match(a.title) || match(a.summary) || a.body.some(b => match(blockText(b))),
        ),
      }))
      .filter(c => (q ? c.articles.length > 0 : c.articles.length > 0 || true));
  }, [q]);

  const written = chapters.filter(c => c.articles.length > 0);
  const pending = q ? [] : categories.filter(c => c.articles.length === 0);

  // Highlight the chapter being read. rootMargin pulls the trigger line up to
  // roughly a third down the viewport so the rail changes when a heading
  // reaches reading position, not when it leaves the screen.
  useEffect(() => {
    const nodes = contentRef.current?.querySelectorAll('section[data-chapter]');
    if (!nodes?.length) return;
    const seen = new Map<string, boolean>();
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(e => seen.set((e.target as HTMLElement).dataset.chapter!, e.isIntersecting));
        const first = Array.from(nodes).find(n => seen.get((n as HTMLElement).dataset.chapter!));
        if (first) setActive((first as HTMLElement).dataset.chapter!);
      },
      { rootMargin: '-15% 0px -70% 0px' },
    );
    nodes.forEach(n => observer.observe(n));
    return () => observer.disconnect();
  }, [written.length]);

  const jump = (id: string) => {
    document.getElementById(`ch-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="kb-layout">
      <aside className="kb-rail">
        <input
          className="kb-search"
          type="search"
          placeholder="Filter…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          aria-label="Filter the knowledge base"
        />
        <nav aria-label="Contents">
          <ol className="kb-toc">
            {written.map((c, i) => (
              <li key={c.id} className={active === c.id ? 'on' : ''}>
                <button onClick={() => jump(c.id)}>
                  <span className="num">{i + 1}</span>
                  <span>{c.title}</span>
                </button>
              </li>
            ))}
          </ol>
        </nav>
      </aside>

      <div className="kb-doc" ref={contentRef}>
        <header className="kb-doc-head">
          <h1>Knowledge base</h1>
          <p className="muted lead">
            Market Forecast Mastery, read front to back: the premise, the two ways to forecast, what
            the scanner found when the claims were tested, and how to use a cycle without fooling
            yourself. {articleCount} sections, in order — it is one argument, so it is one page.
          </p>
        </header>

        {written.length === 0 && <p className="muted">Nothing matches “{query}”.</p>}

        {written.map((chapter, i) => (
          <section key={chapter.id} id={`ch-${chapter.id}`} data-chapter={chapter.id} className="kb-chapter">
            <div className="kb-chapter-head">
              <span className="kb-chapter-num">{i + 1}</span>
              <div>
                <h2>{chapter.title}</h2>
                <p className="muted">{chapter.description}</p>
              </div>
            </div>

            {chapter.articles.map(article => (
              <article key={article.id} id={`kb-${article.id}`} className="kb-section">
                <h3>{article.title}</h3>
                <p className="kb-section-sum">{article.summary}</p>
                {article.source && <p className="muted small kb-source">Source: {article.source}</p>}
                <ArticleBody body={article.body} />
              </article>
            ))}
          </section>
        ))}

        {pending.length > 0 && (
          <section className="kb-chapter kb-pending">
            <h2>Still to be written</h2>
            <ul>
              {pending.map(c => (
                <li key={c.id}>
                  <strong>{c.title}</strong>
                  <span className="muted small"> — {c.description}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
