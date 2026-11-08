export type Page = 'home' | 'live' | 'kb' | 'log' | 'rules';

export interface NavItem {
  id: Page;
  label: string;
}

/** Sections shown in the top bar, in order. `home` is reached through the brand. */
export const NAV: NavItem[] = [
  { id: 'live', label: 'Live desk' },
  { id: 'kb', label: 'Knowledge base' },
  { id: 'log', label: 'Signal log' },
  { id: 'rules', label: 'Rules' },
];

const PAGES: Page[] = ['home', ...NAV.map(n => n.id)];

export function pageFromHash(): Page {
  const h = location.hash.slice(1);
  return (PAGES as string[]).includes(h) ? (h as Page) : 'home';
}
