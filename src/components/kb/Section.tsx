import { useEffect, useState } from 'react';
import type { KbArticle } from '../../lib/kb';
import type { KbBlock } from '../../lib/kbBlocks';
import ArticleBody from './ArticleBody';

/** Blocks that draw data. These stay on the page when the prose is folded. */
function isFigure(b: KbBlock) {
  return typeof b !== 'string'
    && (b.kind === 'overlay' || b.kind === 'scorecard' || b.kind === 'demo');
}

/**
 * One section of the document, folded down to its title and its summary.
 *
 * The page is long and most of it is argument. Folding it makes the shape of
 * the whole thing visible at once — which is what the summaries were written
 * for and why they were previously unused.
 *
 * The charts are the exception and do not fold. A reader scrolling past a
 * closed section should still see what the market actually did, because that
 * is the part that changes week to week and the part worth checking without
 * reading anything. So a closed section renders its figures and nothing else;
 * an open one renders the whole body in its proper order, figures in place.
 */
export default function Section({ article, titled, forceOpen }:
  { article: KbArticle; titled: boolean; forceOpen?: boolean }) {
  const [open, setOpen] = useState(false);
  const bodyId = `kb-body-${article.id}`;

  // A link straight to a section opens it, otherwise the anchor lands on a
  // closed heading and looks broken.
  useEffect(() => {
    const wanted = () => decodeURIComponent(location.hash.replace(/^#/, '')) === `kb-${article.id}`;
    if (wanted()) setOpen(true);
    const onHash = () => wanted() && setOpen(true);
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [article.id]);

  const shown = open || forceOpen;
  const figures = article.body.filter(isFigure);

  return (
    <article id={`kb-${article.id}`} className={`kb-section${shown ? ' open' : ''}`}>
      <h3 className="kb-section-head">
        <button type="button" aria-expanded={!!shown} aria-controls={bodyId}
                onClick={() => setOpen(o => !o)}>
          <span className="kb-section-chevron" aria-hidden="true" />
          <span className="kb-section-text">
            <span className="kb-section-title">{titled ? article.title : article.title}</span>
            <span className="kb-section-sum">{article.summary}</span>
          </span>
        </button>
      </h3>

      <div id={bodyId} className="kb-section-body">
        {shown ? (
          <>
            {article.source && <p className="muted small kb-source">Source: {article.source}</p>}
            <ArticleBody body={article.body} level={titled ? 4 : 3} />
          </>
        ) : (
          figures.length > 0 && <ArticleBody body={figures} level={titled ? 4 : 3} />
        )}
      </div>
    </article>
  );
}
