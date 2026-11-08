export type Page = 'home' | 'live' | 'kb' | 'log' | 'rules';

/**
 * The site holds two unrelated subjects and keeps them apart.
 *
 * `desk` is trading @ES on the Matrixchannel method — live charts, the
 * checklist, the signal log, the rules. `kb` is the Market Forecast Mastery
 * course and the cycle work. They share a landing page and nothing else: the
 * top bar only ever shows the section you are in, so neither offers a button
 * into the other. Crossing between them goes through home.
 */
export type Section = 'home' | 'desk' | 'kb';

export interface NavItem {
  id: Page;
  label: string;
  section: Section;
}

export const NAV: NavItem[] = [
  { id: 'live', label: 'Live desk', section: 'desk' },
  { id: 'log', label: 'Signal log', section: 'desk' },
  { id: 'rules', label: 'Rules', section: 'desk' },
  { id: 'kb', label: 'Knowledge base', section: 'kb' },
];

const PAGES: Page[] = ['home', ...NAV.map(n => n.id)];

export function sectionOf(page: Page): Section {
  return NAV.find(n => n.id === page)?.section ?? 'home';
}

/** What the brand shows under the wordmark, which depends on the subject. */
export function sectionTag(page: Page, symbol: string): string {
  const section = sectionOf(page);
  if (section === 'desk') return `Matrixchannel · ${symbol}`;
  if (section === 'kb') return 'Market Forecast Mastery';
  return 'Trading desk · Knowledge base';
}

export function pageFromHash(): Page {
  const h = location.hash.slice(1);
  return (PAGES as string[]).includes(h) ? (h as Page) : 'home';
}
