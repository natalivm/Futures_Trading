/**
 * Article bodies are a list of blocks rather than a list of paragraphs, so a
 * page about reading charts can show charts.
 *
 * A plain string is a paragraph, and a string starting with `> ` is a quote —
 * every article written before this existed still renders unchanged.
 */
export type KbBlock =
  | string
  | { kind: 'heading'; text: string }
  | { kind: 'callout'; tone?: 'note' | 'warn' | 'key'; title?: string; text: string }
  /** A live TradingView chart, opened on the timeframe the passage is about. */
  | {
      kind: 'chart';
      /** TradingView symbol, e.g. `TVC:DJI`. */
      symbol: string;
      /** What to call it in the caption and the fallback card. */
      label: string;
      interval: 'D' | 'W' | 'M';
      /** Span the chart opens on, e.g. `60M`, `ALL`. */
      range?: string;
      caption?: string;
    }
  /** The present window against its analog, drawn from cycles/*.json. */
  | { kind: 'overlay'; series: string; label: string; caption?: string }
  /** Plain bullets, or numbered steps. */
  | { kind: 'list'; items: string[]; ordered?: boolean; tight?: boolean }
  /** A term or rule in bold, with the explanation after it. */
  | { kind: 'rules'; items: RuleItem[] }
  | { kind: 'timeline'; title?: string; caption?: string; rows: TimelineRow[] }
  | { kind: 'table'; head: string[]; rows: string[][]; caption?: string }
  /** An interactive demonstration, keyed by id. */
  | { kind: 'demo'; id: 'noise'; caption?: string };

export interface RuleItem {
  /** The rule itself, or the term being defined. Kept short enough to scan. */
  rule: string;
  detail?: string;
}

export interface TimelineRow {
  when: string;
  what: string;
  note?: string;
  /** Marks the turn of the cycle the reader is living through. */
  now?: boolean;
}

/** The searchable text of a block — search has to see inside figures too. */
export function blockText(block: KbBlock): string {
  if (typeof block === 'string') return block;
  switch (block.kind) {
    case 'heading':
      return block.text;
    case 'callout':
      return `${block.title ?? ''} ${block.text}`;
    case 'chart':
      return `${block.label} ${block.caption ?? ''}`;
    case 'overlay':
      return `${block.label} ${block.caption ?? ''}`;
    case 'list':
      return block.items.join(' ');
    case 'rules':
      return block.items.map(i => `${i.rule} ${i.detail ?? ''}`).join(' ');
    case 'timeline':
      return [block.title, block.caption, ...block.rows.map(r => `${r.when} ${r.what} ${r.note ?? ''}`)]
        .filter(Boolean).join(' ');
    case 'table':
      return [...block.head, ...block.rows.flat(), block.caption ?? ''].join(' ');
    case 'demo':
      return block.caption ?? '';
  }
}
