import type { Page } from './nav';

/** One knowledge-base article. `body` holds plain paragraphs; a `> ` prefix marks a quote. */
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

const TODAY = '2026-11-08';

// ── The course ──

const lesson1: KbArticle = {
  id: 'mfm-lesson-1',
  title: 'Lesson 1 — What this course is about',
  summary: 'The premise, where the knowledge comes from, the two ways to forecast, and the three techniques the course teaches.',
  source: 'Market Forecast Mastery, Lesson 1 — Allen Reminick',
  updated: TODAY,
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

// ── The cycle catalogue ──

const sixtyYear: KbArticle = {
  id: 'cycle-60-year',
  title: 'The 60-year cycle',
  summary: 'The granddaddy of the set: 2022 against 1962 at 93%, the forward call it made in June 2022, and where it puts 2026 and 2027.',
  source: 'Market Forecast Mastery, Lesson 1 — Allen Reminick',
  updated: TODAY,
  body: [
    'The 60-year cycle compares the market now with the market exactly 60 years earlier. The course slide shows it on the Dow: the blue path is 2022, ending in April; the grey path is 1962. The x-axis is trading days and the span is about 440 of them — roughly 22 months, so the comparison runs back through 2021 and into the end of 2020. Over that span the two paths are 93% correlated.',
    'The length of the window is the point. Five months of data will correlate with something by accident. Twenty-two months containing a whole sequence of highs, lows and hesitation points is a much harder thing to match, and in 1962 against 2022 the down move lines up, the low lines up, and high after low after high lines up in sequence.',
    'The course makes a second argument, about why this cannot be a self-fulfilling pattern. Anyone trading in 1962 in their twenties or thirties is in their eighties or nineties now. Essentially nobody in today’s market is looking at 1962 to decide what to do. Whatever is producing the repeat, it is not traders copying an old chart.',
    'The part that actually counts as evidence is what came next, because it was out of sample. In June 2022 the market was falling out of bed: rates had just been raised, recession was the consensus, and the expectation was lower. The 1962 roadmap said something else — up into August, down into the middle of October, around the 15th to the 20th, and then away to the upside. That is what happened. The market turned up into August, sold off into the October low, and then ran.',
    'The course reports the pattern as holding at roughly 90% accuracy since 2022, and notes it checked out historically too: taking the window back 25 years and comparing with 60 years before that, the correlation was still over 90%.',
    'Where that clock puts us now: 2026 corresponds to 1966. In 1966 the market had a bear phase whose low arrived in October; 1967 was up. Looking further out, 2033–2034 corresponds to 1973–1974, where a major decline began — the Dow fell roughly 50% into 1974 and the market stayed depressed until 1982.',
    'Treat all of that as the hypothesis, not the conclusion. The way to hold it honestly is to re-test it: `python3 cycles/find_cycles.py --symbol ^DJI --lag-years 60 --window 440`. Read the swing correlation and the epoch check rather than the headline 93%, for the reasons in “Finding repeating cycles in the indexes”. A pre-specified 60-year offset that still holds across epochs is real evidence; the same number arrived at by searching is not.',
  ],
};

const seventyEightYear: KbArticle = {
  id: 'cycle-78-year',
  title: 'The 78.5-year cycle and the 157 / 314 chain',
  summary: 'The Depression lined up with the global financial crisis 78 years later — and the harmonic argument that runs from 1720 to a 2034 top.',
  source: 'Market Forecast Mastery, Lesson 1 — Allen Reminick',
  updated: TODAY,
  body: [
    'The second example on the slides is longer: a 78-year cycle on the Dow, titled 1930–2008. The green path is 2007 into 2008 and down to the March 2009 low; the pink path is 1930 into 1931 and 1932. The span is about 345 trading days, roughly 17 months. The crash of the 1930s and the global financial crisis line up, 78 years apart.',
    'The length is not arbitrary in the course’s framing. 78.5 years is half of 157, and 157 is half of 314. The 314-year cycle is the one that reaches back to the speculative top of 1720, which puts the next turn at 1720 + 314 = 2034.',
    'A note for accuracy, since this is a knowledge base: the 1720 mania is the South Sea Bubble — the one that caught Isaac Newton — not the Dutch tulip mania, which peaked in 1636–37. The arithmetic the course uses is built on 1720 either way.',
    'What makes 2034 interesting is that a different clock lands in the same place. On the 60-year cycle, 2033–2034 corresponds to 1973–1974, the start of a major decline. Two independent cycles pointing at the same window is the kind of agreement the composite method is built on.',
    'Where this one is weaker than the 60-year case, and it is worth being clear about it: aligning the Depression with the financial crisis is a match identified after both crashes were known. The 60-year cycle earns more trust because it made a call in June 2022 about the months ahead and that call came true. A hindsight alignment of two famous crashes is a weaker kind of evidence, however striking the chart.',
    'So the test to run on this one is the pre-specified kind, at offsets that are not the 2008 crash: `python3 cycles/find_cycles.py --symbol ^DJI --lag-years 78.5 --window 345 --epochs 6`. If the 78.5-year offset only fits when one end of it is 1929–32, it is an observation about two crises. If it holds at epochs that contain no crisis at all, it is a cycle.',
  ],
};

const electionCycle: KbArticle = {
  id: 'cycle-election',
  title: 'The four-year election cycle',
  summary: 'High near the election, low near the midterms, and a pre-election year that is up the overwhelming majority of the time — with the exceptions named.',
  source: 'Market Forecast Mastery, Lesson 1 — Allen Reminick',
  updated: TODAY,
  body: [
    'The presidential cycle is the shortest clock the course leans on and the easiest to check. Its shape: a high around the presidential election, a low around the midterms two years later, and strength in the year after that.',
    'The numbering used here, matching the lecture: year 1 is the year after the election (2025), year 2 is the midterm year (2026), year 3 is the pre-election year (2027), year 4 is the election year (2028).',
    'The claim: going back about a hundred years, the third year has been up something like 94% of the time — only two misses in the whole record. The lecture names 1931 and 2008 as the exceptions.',
    'That second one is worth a flag. 2008 was an election year — year 4 — and the Dow fell roughly a third; it was not a pre-election year. The exceptions usually cited for third years are 1931 and 2015, the latter a fractional loss. This is exactly the sort of detail a knowledge base should settle rather than repeat, so the repo computes it from our own price files: `python3 cycles/election_cycle.py --symbol ^DJI`. It prints the up-rate, mean and median move, and every down year, for each of the four cycle years.',
    'Two cautions on how much weight the statistic can carry. A century holds only about 25 pre-election years, so 94% means roughly 23 or 24 out of 25 — one more miss drops it to 90%, and the error bar around a 25-observation rate is wide. And the usual mechanism offered, policy and stimulus leaning supportive ahead of an election, is plausible but not something a sample this size can prove.',
    'Used properly it is a tilt, not a guarantee: it says which way to lean when other evidence agrees, and it says nothing at all about any particular week.',
  ],
};

const composite: KbArticle = {
  id: 'cycle-composite',
  title: 'Reading cycles together — the composite',
  summary: 'No single cycle is the forecast. Where the 60-year clock, the election cycle and the longer rhythms agree, and what the course expects from 2027 and 2034.',
  source: 'Market Forecast Mastery, Lesson 1 — Allen Reminick',
  updated: TODAY,
  body: [
    'The method is not to pick a cycle. It is to see where several independent clocks point the same way, because that is when the odds stack. One cycle at 90% is a lean; two unrelated cycles agreeing is a position.',
    'The near-term composite as the course reads it. On the 60-year clock, 2026 corresponds to 1966: a year with real damage in it, whose low arrived in October, followed by an up year in 1967. On the election clock, the midterm year is where the low belongs and the pre-election year is the strong one. Both therefore point the same way into 2027, and the course anticipates something like another year to eighteen months of upside — while being explicit that it will not be a straight line and that a one- or two-month decline somewhere along the way, perhaps early in the year, would be entirely normal.',
    'The long-term composite. 2033–2034 is where the 60-year clock reaches 1973–1974 and where the 314-year chain from 1720 lands. The course’s expectation is a major top in that window, followed by a long decline rather than a crash-and-recover. That fits a third rhythm it cites, a roughly 28-year pattern associated with JB Cycles and tied to a 56-year cycle, in which a five- to eight-year decline tends to arrive; the most recent of those was the 1966–1982 era. Both of the long secular bears in the modern record — 1929 to 1942, and 1966 to 1982 — have that shape: up, then down for a year or two, then up again, with no sustained advance for a decade or more.',
    'One more input the lecture mentions: margin and leverage excess, which it describes as running on a roughly 22-year rhythm and as not yet near its peak — perhaps another eighteen months of room. On that reading the speculative phase has not finished, which is consistent with the near-term composite pointing up.',
    'All of this is recorded here as the course’s expectation — the hypothesis the desk trades against, not a set of facts. Every piece of it is testable with the scripts in `cycles/`, and it should be re-tested as data arrives rather than carried forward on memory.',
    'What would break the near-term case, decided in advance: the market taking out its October 2026 low decisively rather than turning up from it; the 60-year analog diverging on swing correlation when re-scored, not merely on price; or the pre-election-year tilt failing to show in our own data when `election_cycle.py` is run. Any of those and the roadmap is void, whatever the narrative says.',
  ],
};

// ── Using the forecasts ──

const usingForecasts: KbArticle = {
  id: 'using-a-cycle-forecast',
  title: 'Using a cycle forecast correctly',
  summary: 'What a cycle roadmap can and cannot tell you, how it meets the entry rules, and the traps — statistical and emotional — that make people misuse it.',
  source: 'Market Forecast Mastery, Lesson 1, plus the control runs in cycles/README.md',
  updated: TODAY,
  body: [
    'A cycle forecast is a roadmap of direction and timing windows. It is not a price, not a date, and not a prediction. The course is explicit about the resolution: what repeats is the general direction and the general swing, not day by day perfect. Any use of it that depends on a specific day or a specific level is using it for something it does not provide.',
    'So it changes the bias, not the entry. The cycle decides which side you want to be working — long into 2027, on the current composite. The Matrixchannel checklist still decides whether there is a trade in front of you today: price at a level, a reaction to it, confirmation on closed candles, and a stop, target and R:R set before entering. A roadmap that says “up” is not a reason to buy a chart that has not given a setup, and it is never a reason to skip the stop.',
    'Never trade a cycle without a stop. Ninety percent accurate means it fails one time in ten, and the failures are the years everyone remembers — 1931, 2008. The roadmap tells you what to expect; the stop is what pays for the times the expectation is wrong.',
    'On the statistics, the single most important thing in this knowledge base. Price correlation is nearly worthless as evidence on its own. A pure random walk, with no cycle in it whatsoever, produced a “50-year cycle” correlated 0.947 on closing prices — a higher correlation than a genuine planted cycle scored in the same test — and it ranked in the top 0.01% of twelve thousand offsets. High correlation and exclusive ranking are both reachable by chance. What separated the real cycle from the noise was the monthly swing correlation (0.875 against 0.449) and re-scoring the same offset at earlier epochs (never below +0.79, against −0.01). Gate on those two.',
    'Pre-specify the cycle. Testing 60 years because the course says 60 years is a single hypothesis and the result means something. Taking the best of twelve thousand searched offsets is a different activity with a different, much weaker, standard of proof. The scanner supports both and labels which one produced a given match; prefer the named test when a cycle is already in mind.',
    'Distrust hindsight alignment. Matching the Depression to the financial crisis after both had happened is a weaker claim than the 60-year cycle making a call in June 2022 that then came true. The difference is whether the forecast existed before the outcome. Which is why forecasts belong in the signal log the moment they are made, with the date — so the hit rate is measured later rather than remembered.',
    'Size for being wrong. A 94% statistic drawn from 25 observations has a wide error bar, and the composite is not 94% simply because two cycles agree. Position size should survive the case where the roadmap is void.',
    'Write the invalidation down before entering. “The 60-year analog says up into 2027” is not tradeable; “long while the October low holds, void below it” is. Decide in advance what would prove the roadmap wrong, and act on that rather than on discomfort.',
    'Finally, the failure mode the lectures dwell on, which is emotional rather than analytical. Isaac Newton made a fortune in the 1720 bubble, took profits, watched it keep going, bought back near the top and was destroyed. Stanley Druckenmiller did the same thing in 1999 and 2000: out with the gains, back in as the melt-up continued, caught at the top. A roadmap only helps if it is followed when the tape feels wrong, and abandoned when its own stated invalidation trips — not when it merely becomes uncomfortable, and not when everyone else is making money faster.',
  ],
};

// ── Technique 1 ──

const cycleScanner: KbArticle = {
  id: 'cycle-scanner',
  title: 'Finding repeating cycles in the indexes',
  summary: 'The scanner in cycles/ reproduces the 60-year-cycle slide mechanically — and the controls say which of its four scores to believe.',
  source: 'Market Forecast Mastery, Lesson 1 — Allen Reminick; cycles/README.md',
  updated: TODAY,
  body: [
    'The slide shows the DJIA 60-year cycle: 1962 in grey, 2022 in blue, 93% correlated over about 440 trading days — 22 months, not five — ending April 2022. The lecture’s point is that nobody trading today is looking at 1962, so the repeat cannot be reflexive, and that it held up when checked 25 years back against 60 years before that. What happened next is the test that matters: in June 2022 the market was falling out of bed on rate rises, while 1962 said up into August, down into mid-October, then away. That is what happened.',
    'The scanner in the repo does this mechanically. It takes the last 440 trading days, slides that window back through every earlier offset, scores each fit, and keeps the best. Two scripts, standard library only. `python3 cycles/update_prices.py` refreshes daily closes for the Dow, S&P 500, Nasdaq Composite, Nasdaq 100, Russell 2000 and the E-mini. It reads Stooq first because that is the only free source with the history this needs — the Dow back to 1896, where Yahoo only serves it from 1992, and a 60-year cycle cannot be measured in 33 years of data. Then `python3 cycles/find_cycles.py --all --svg` scans and draws the overlay and forecast charts.',
    'Four scores come back per match, and the controls show they do not agree. Two synthetic series were used to calibrate: one with a real 30-year cycle built in, one a pure random walk.',
    'The uncomfortable result first. The random walk produced a “50-year cycle” correlated 0.947 on closing prices — a higher price correlation than the genuine cycle scored — and it ranked in the top 0.01% of twelve thousand offsets. So corr, the number on the slide, cannot by itself tell a cycle from two similar-looking trends, and neither can the ranking: coming first out of twelve thousand bad fits is what a search over twelve thousand hypotheses does by construction.',
    'What did separate them: swingCorr, the correlation of monthly (21-bar) returns, scored 0.875 on the real cycle against 0.449 on the noise. That measure is also the one that matches what the course actually claims — the general direction and the general swing, not day by day perfect. And the stability check, re-scoring the same offset at five earlier anchor points five years apart, never dropped below +0.79 on the real cycle while the random walk’s best match sat at −0.01. That check is the course’s own: a cycle that only fits the last two years is not a cycle.',
    'So gate on the swing correlation and on the worst epoch, not on corr. And when a cycle is already in mind, name it — `--lag-years 60` tests one hypothesis instead of searching, and on the random-walk control that removed the false positive entirely, scoring 0.086. `--preset course` runs the whole set the lectures use: 4, 28, 56, 60, 78.5, 157 and 314 years.',
    'The forecast is the analog’s own forward path, rescaled to today’s price range and anchored to today’s close: what that stretch of history did next, drawn on today’s chart. A roadmap to trade against with the usual stop and target — not a prediction.',
  ],
};

// ── Glossary ──

const cycleGlossary: KbArticle = {
  id: 'glossary-cycles',
  title: 'Cycle terms',
  summary: 'Analog, lag, window, CS and CE, the three correlations, epoch stability, composite — the vocabulary used across the cycle pages.',
  updated: TODAY,
  body: [
    'Analog — the stretch of past history that today’s market is being compared with. On the slides it is the grey line; the present is the coloured one.',
    'Lag, or offset — how far back the analog sits, measured in trading days and reported in years. A 60-year cycle is a lag of about 15,120 trading days.',
    'Window — how much history is compared at once. The DJIA slide used about 440 trading days, roughly 22 months. A short window correlates with almost anything; a long one containing many highs and lows is a far harder test.',
    'CS and CE — cycle start and cycle end, the markers at the left and right edges of the course’s charts.',
    'Interval of repetition — the course’s term for the distance between a pattern and its repeat. Locating it is what the Slide Technique does.',
    'corr — Pearson correlation of the two closing series. The number quoted on the slides, for example 93%. Unaffected by rescaling both paths to 0–100, which is what those charts do. Weak evidence on its own.',
    'swingCorr — correlation of monthly (21-bar) returns rather than prices. Measures whether the two paths actually move together swing by swing, which is what the method claims. The score to gate on.',
    'retCorr — the same on daily returns. Stricter than the claim being made; useful as a floor.',
    'Epoch stability — re-scoring the same lag at earlier anchor points to see whether the cycle held historically or only fits the last couple of years. Reported as heldMean and heldMin.',
    'Pre-specified versus searched — whether the cycle length was named in advance or found by scanning thousands of offsets. The first is strong evidence, the second is nearly none.',
    'Composite — several cycles read together. The forecast is where independent clocks agree, not any single one of them.',
    'Harmonic — a cycle that is a simple fraction or multiple of another: 78.5 is half of 157, which is half of 314.',
    'Secular bear — a decade-scale period with no sustained advance, such as 1929–1942 or 1966–1982, as distinct from a single sharp decline.',
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
    id: 'catalogue',
    title: 'The cycle catalogue',
    description: 'The specific cycles the course works with, what the evidence for each one is, and where each currently points.',
    articles: [sixtyYear, seventyEightYear, electionCycle, composite],
  },
  {
    id: 'using',
    title: 'Using a forecast',
    description: 'How a cycle roadmap meets the entry rules, what it can and cannot tell you, and the traps that make people misuse it.',
    articles: [usingForecasts],
  },
  {
    id: 'cycles',
    title: 'Technique 1 — locating cycles',
    description: 'Series and sequences, and the scanner that searches every offset in the history for the one today’s market rhymes with.',
    articles: [cycleScanner],
  },
  {
    id: 'approaches',
    title: 'Two ways to forecast',
    description: 'Analytical / decomposition (Fourier series, spectral analysis, wave mechanics) versus synthesis / pattern recognition — what each one costs and why the course picks synthesis.',
    articles: [],
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
    description: 'Plain definitions for every term used across the desk and the course.',
    articles: [cycleGlossary],
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

/** The shelf an article sits on, for the breadcrumb on an article page. */
export function categoryOf(articleId: string): KbCategory | undefined {
  return categories.find(c => c.articles.some(a => a.id === articleId));
}
