import { type KbBlock } from '../../lib/kbBlocks';
import CycleOverlay from './CycleOverlay';
import NoiseCycleDemo from './NoiseCycleDemo';
import TradingViewChart from './TradingViewChart';

/** Renders an article's blocks. A plain string is still a paragraph. */
export default function ArticleBody({ body }: { body: KbBlock[] }) {
  return (
    <>
      {body.map((block, i) => {
        if (typeof block === 'string') {
          return block.startsWith('> ')
            ? <blockquote key={i} className="kb-quote">{block.slice(2)}</blockquote>
            : <p key={i} className="kb-para">{block}</p>;
        }

        switch (block.kind) {
          case 'heading':
            return <h2 key={i} className="kb-h2">{block.text}</h2>;

          case 'callout':
            return (
              <aside key={i} className={`kb-callout ${block.tone ?? 'note'}`}>
                {block.title && <strong>{block.title}</strong>}
                <span>{block.text}</span>
              </aside>
            );

          case 'chart':
            return (
              <TradingViewChart key={i} symbol={block.symbol} label={block.label}
                                interval={block.interval} range={block.range} caption={block.caption} />
            );

          case 'overlay':
            return <CycleOverlay key={i} series={block.series} label={block.label} caption={block.caption} />;

          case 'demo':
            return <NoiseCycleDemo key={i} caption={block.caption} />;

          case 'list': {
            const List = block.ordered ? 'ol' : 'ul';
            return (
              <List key={i} className={`kb-list${block.tight ? ' tight' : ''}`}>
                {block.items.map((item, n) => <li key={n}>{item}</li>)}
              </List>
            );
          }

          case 'rules':
            return (
              <dl key={i} className="kb-rules">
                {block.items.map((item, n) => (
                  <div key={n}>
                    <dt>{item.rule}</dt>
                    {item.detail && <dd>{item.detail}</dd>}
                  </div>
                ))}
              </dl>
            );

          case 'timeline':
            return (
              <figure key={i} className="kb-figure">
                {block.title && (
                  <div className="kb-figure-head">
                    <span className="kb-figure-kind">Timeline</span>
                    <strong>{block.title}</strong>
                  </div>
                )}
                <ol className="kb-timeline">
                  {block.rows.map(row => (
                    <li key={row.when} className={row.now ? 'now' : ''}>
                      <span className="when">{row.when}</span>
                      <span className="what">
                        {row.what}
                        {row.note && <small className="muted"> {row.note}</small>}
                      </span>
                    </li>
                  ))}
                </ol>
                {block.caption && <figcaption>{block.caption}</figcaption>}
              </figure>
            );

          case 'table':
            return (
              <figure key={i} className="kb-figure">
                <div className="kb-table-wrap">
                  <table className="kb-table">
                    <thead>
                      <tr>{block.head.map(h => <th key={h}>{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {block.rows.map((row, r) => (
                        <tr key={r}>
                          {row.map((cell, c) => (
                            c === 0 ? <th key={c} scope="row">{cell}</th> : <td key={c}>{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {block.caption && <figcaption>{block.caption}</figcaption>}
              </figure>
            );
        }
      })}
    </>
  );
}
