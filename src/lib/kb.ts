import type { Page } from './nav';

/** One knowledge-base article. `body` holds plain paragraphs; `>` starts a quote. */
export interface KbArticle {
  id: string;
  title: string;
  summary: string;
  body: string[];
  source?: string;
  updated?: string;
}

/** A shelf of articles. Add articles to `articles` as they are written. */
export interface KbCategory {
  id: string;
  title: string;
  description: string;
  articles: KbArticle[];
}

const lesson1: KbArticle = {
  id: 'mfm-lesson-1',
  title: 'Lesson 1 — What this course is about',
  summary: 'The premise, where the knowledge comes from, the two ways to forecast, and the three techniques the course teaches.',
  source: 'Market Forecast Mastery, Lesson 1 — Allen Reminick',
  body: [
    'The basic premise of the course: a holistic new method of market forecasting built on the idea that history always repeats itself — if one knows where to look. The work is not prediction out of thin air; it is finding the places in past market data where the same pattern has already played out, and projecting it forward.',
    'Where the knowledge comes from: W.D. Gann, Dr. Jerome Baumring, and Allen Reminick. Gann supplies the law of periodicity, Baumring the structure behind it, and the course the practical method.',
    'Gann on the law of periodicity:',
    '> "The power to determine the trend of the market is due to my knowledge of the characteristics of each individual stock and a certain grouping of different stocks under their proper rates of vibration. Stocks are like electrons, atoms, and molecules, which hold persistently to their own individuality in response to the fundamental Law of Vibration. Science teaches that an original impulse of any kind finally resolves itself into periodic or rhythmical motion. Also, just as the pendulum returns again in its swing, just as the moon returns in its orbit, just as the advancing year ever brings the roses of spring, so do the properties of the elements periodically recur as the weight of the atoms rises."',
    'Two ways to forecast the future. A — the analytical approach, based on decomposition: Fourier series, spectral analysis. Very complex mathematics, and computer software is required. B — the synthesis approach, which is what this course does: conceptually easy, can be done manually, and the result is identifying where history repeats.',
    'Put another way, the two primary approaches are the internal type, wave mechanics (decomposition), and the external type, pattern recognition (synthesis). This course locates cycles through several techniques, and all of them are aspects of pattern recognition — finding the patterns in past markets that are likely to repeat in the future.',
    'Three techniques are taught. 1 — using series and sequences to locate cycles. 2 — the Slide Technique, a method of forecasting by locating the intervals of repetition. 3 — the Momentum Balance Technique, a proprietary method for seeing when a market move is more likely to continue, and for projecting price targets for that move.',
    'The rest of the course is how we actually do it: applying those three techniques to live charts, lesson by lesson.',
  ],
};

const cycleScanner: KbArticle = {
  id: 'cycle-scanner',
  title: 'Finding repeating cycles in the indexes',
  summary: 'The scanner in cycles/ reproduces the 60-year-cycle slide mechanically \u2014 and the controls say which of its four scores to believe.',
  source: 'Market Forecast Mastery, Lesson 1 \u2014 Allen Reminick; cycles/README.md',
  body: [
    'The slide shows the DJIA 60-year cycle: 1962 in grey, 2022 in blue, 93% correlated over about 440 trading days \u2014 22 months, not five \u2014 ending April 2022. The lecture\u2019s point is that nobody trading today is looking at 1962, so the repeat cannot be reflexive, and that it held up when checked 25 years back against 60 years before that. What happened next is the test that matters: in June 2022 the market was falling out of bed on rate rises, while 1962 said up into August, down into mid-October, then away. That is what happened.',
    'The scanner in the repo does this mechanically. It takes the last 440 trading days, slides that window back through every earlier offset, scores each fit, and keeps the best. Two scripts, standard library only. `python3 cycles/update_prices.py` refreshes daily closes for the Dow, S&P 500, Nasdaq Composite, Nasdaq 100, Russell 2000 and the E-mini. It reads Stooq first because that is the only free source with the history this needs \u2014 the Dow back to 1896, where Yahoo only serves it from 1992, and a 60-year cycle cannot be measured in 33 years of data. Then `python3 cycles/find_cycles.py --all --svg` scans and draws the overlay and forecast charts.',
    'Four scores come back per match, and the controls show they do not agree. Two synthetic series were used to calibrate: one with a real 30-year cycle built in, one a pure random walk.',
    'The uncomfortable result first. The random walk produced a \u201c50-year cycle\u201d correlated 0.947 on closing prices \u2014 a higher price correlation than the genuine cycle scored \u2014 and it ranked in the top 0.01% of twelve thousand offsets. So corr, the number on the slide, cannot by itself tell a cycle from two similar-looking trends, and neither can the ranking: coming first out of twelve thousand bad fits is what a search over twelve thousand hypotheses does by construction.',
    'What did separate them: swingCorr, the correlation of monthly (21-bar) returns, scored 0.875 on the real cycle against 0.449 on the noise. That measure is also the one that matches what the course actually claims \u2014 the general direction and the general swing, not day by day perfect. And the stability check, re-scoring the same offset at five earlier anchor points five years apart, never dropped below +0.79 on the real cycle while the random walk\u2019s best match sat at \u22120.01. That check is the course\u2019s own: a cycle that only fits the last two years is not a cycle.',
    'So gate on the swing correlation and on the worst epoch, not on corr. And when a cycle is already in mind, name it \u2014 `--lag-years 60` tests one hypothesis instead of searching, and on the random-walk control that removed the false positive entirely, scoring 0.086. A pre-specified 60-year cycle that still holds is real evidence; the best of a twelve-thousand-offset search is not.',
    'The forecast is the analog\u2019s own forward path, rescaled to today\u2019s price range and anchored to today\u2019s close: what that stretch of history did next, drawn on today\u2019s chart. A roadmap to trade against with the usual stop and target \u2014 not a prediction.',
  ],
};

/**
 * The shelves the articles go on. Drop a KbArticle into the matching
 * `articles` array and it shows up on the page — nothing else needs changing.
 */
export const categories: KbCategory[] = [
  {
    id: 'course',
    title: 'Market Forecast Mastery — the course',
    description: 'Lesson-by-lesson notes from Allen Reminick’s course: the premise, the law of periodicity, and where the knowledge comes from — Gann, Baumring, Reminick.',
    articles: [lesson1],
  },
  {
    id: 'approaches',
    title: 'Two ways to forecast',
    description: 'Analytical / decomposition (Fourier series, spectral analysis, wave mechanics) versus synthesis / pattern recognition — what each one costs and why the course picks synthesis.',
    articles: [],
  },
  {
    id: 'cycles',
    title: 'Technique 1 — series & sequences',
    description: 'Locating cycles with series and sequences: which series, how they are counted off a chart, and how a candidate cycle is confirmed.',
    articles: [cycleScanner],
  },
  {
    id: 'slide',
    title: 'Technique 2 — the Slide Technique',
    description: 'Forecasting by locating the intervals of repetition: sliding past data forward to find where history lines up with the present.',
    articles: [],
  },
  {
    id: 'momentum',
    title: 'Technique 3 — Momentum Balance',
    description: 'Reading when a move is more likely to continue, and projecting price targets for it.',
    articles: [],
  },
  {
    id: 'matrixchannel',
    title: 'Matrixchannel & the live desk',
    description: 'The execution side: the Matrixchannel lines, cloud and moving average, the setups, and how the Live desk checklist applies them to @ES.',
    articles: [],
  },
  {
    id: 'risk',
    title: 'Risk & position sizing',
    description: 'Stops, targets, R:R, costs per contract and how much of the account a single trade is allowed to risk.',
    articles: [],
  },
  {
    id: 'market',
    title: 'Market structure & sessions',
    description: 'Contract specs, roll dates, cash and overnight sessions, the economic calendar, and the hours the method is meant to be traded in.',
    articles: [],
  },
  {
    id: 'review',
    title: 'Journal & review',
    description: 'How a signal is logged, what to fill in once a trade closes, and the weekly review that turns the log into an edge.',
    articles: [],
  },
  {
    id: 'glossary',
    title: 'Glossary',
    description: 'Plain definitions for every term used across the desk and the course — periodicity, cycle, interval of repetition, cluster, magnet, R:R.',
    articles: [],
  },
];

/** Pages of the app that belong in the knowledge base even though they live elsewhere. */
export const relatedPages: { page: Page; title: string; summary: string }[] = [
  {
    page: 'rules',
    title: 'How and when to buy or sell',
    summary: 'The full rule set behind the Live desk checklist — the routine, every setup, the candlestick patterns and the open questions.',
  },
  {
    page: 'log',
    title: 'Signal log',
    summary: 'Every logged decision with its chart observation, plan and result. The dataset the knowledge base is written against.',
  },
];

export const articleCount = categories.reduce((n, c) => n + c.articles.length, 0);
