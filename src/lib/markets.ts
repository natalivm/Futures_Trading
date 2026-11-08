/** The markets the cycle scanner writes data for, in the order they are offered. */
export interface Market {
  /** File slug, matching cycles/data/<slug>.csv and public/cycles/<slug>.json. */
  slug: string;
  label: string;
  /** Short form for a crowded control. */
  short: string;
}

export const MARKETS: Market[] = [
  { slug: 'DJI', label: 'Dow Jones Industrial Average', short: 'Dow' },
  { slug: 'GSPC', label: 'S&P 500', short: 'S&P 500' },
  { slug: 'IXIC', label: 'Nasdaq Composite', short: 'Nasdaq' },
  { slug: 'NDX', label: 'Nasdaq 100', short: 'Nasdaq 100' },
  { slug: 'RUT', label: 'Russell 2000', short: 'Russell' },
  { slug: 'ES_F', label: 'E-mini S&P 500 futures', short: 'E-mini' },
  { slug: 'CL_F', label: 'WTI crude oil', short: 'Crude' },
  { slug: 'GC_F', label: 'Gold', short: 'Gold' },
  { slug: 'ZB_F', label: 'US 30-year Treasury bonds', short: 'US 30y' },
];

export function marketLabel(slug: string): string {
  return MARKETS.find(m => m.slug === slug)?.label ?? slug;
}
