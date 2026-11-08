import type { KbBlock } from './kbBlocks';

export type { KbBlock } from './kbBlocks';

/**
 * One knowledge-base article. `body` is a list of blocks: a plain string is a
 * paragraph, a string starting with `> ` is a quote, and an object is a
 * figure — a live chart, a cycle overlay, a timeline, a table or a demo.
 */
export interface KbArticle {
  id: string;
  title: string;
  summary: string;
  body: KbBlock[];
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
    'Where that clock puts us now: 2026 corresponds to 1966. In 1966 the market had a bear phase whose low arrived in October; 1967 was up. Looking further out, 2033–2034 corresponds to 1973–1974, where a major decline began — the Dow fell roughly 50% into 1974, the largest decline in many years, and the market stayed depressed until 1982. The lecture’s aside about that period: Merrill Lynch let go of half its staff.',
    {
      kind: 'chart',
      symbol: 'BLACKBULL:US30',
      label: 'Dow 30 — where price is now',
      interval: 'M',
      range: 'ALL',
      caption: 'Monthly, for present context: this is the part of the chain the timeline below calls 2026. It is a CFD proxy for the Dow — TradingView’s anonymous embeds cannot serve the exchange-listed index itself — so it tracks the index without reaching back to 1906. The long view is the timeline and the overlay charts, which come from our own data.',
    },
    'The chain goes back further than one step, which is what makes it interesting. Another 60 years before 1966 is 1906: an up move in 1906, the down move starting in 1907, a low in 1908, then back up and down into 1914. So 1914, 1974 and 2034 are the same point on three consecutive turns of the clock, and 1906, 1966 and 2026 line up the same way. A cycle that holds across three repetitions is a different proposition from one observed once.',
    {
      kind: 'timeline',
      title: 'The same point on three turns of the 60-year clock',
      rows: [
        { when: '1906', what: 'An up year', note: '— the high before the break' },
        { when: '1907', what: 'The down move starts' },
        { when: '1908', what: 'The low, then back up' },
        { when: '1914', what: 'Down again into the war' },
        { when: '1966', what: 'Bear phase, low in October', note: '— 1906 + 60' },
        { when: '1967', what: 'Up year' },
        { when: '1974', what: 'Roughly 50% off the Dow', note: '— 1914 + 60; Merrill Lynch let go of half its staff' },
        { when: '2026', what: 'Where we are', note: '— 1966 + 60; the course expects a low around October', now: true },
        { when: '2027', what: 'The up year, if the clock holds', note: '— and the election cycle agrees' },
        { when: '2034', what: 'The turn both long cycles point at', note: '— 1974 + 60, and 1720 + 314' },
      ],
      caption: 'Three repetitions is a different proposition from one observation — and it is also what makes the claim testable rather than merely striking.',
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'Not yet tested on our own data',
      text: 'The first real run, on 2026-11-08, could not test this at all: the Dow history we hold starts in 1992, and a 60-year offset needs 62 years before it can be measured once. Stooq, the source that reaches back to 1896, returned nothing on that run. Until that is fixed the 93% here is the course’s number, not ours.',
    },
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
    {
      kind: 'chart',
      symbol: 'FOREXCOM:SPXUSD',
      label: 'S&P 500 — monthly',
      interval: 'M',
      range: 'ALL',
      caption: 'Present context on the monthly chart. A CFD proxy, so it does not reach 1929 — for the Depression against the financial crisis, the honest comparison is the overlay the scanner draws once a long enough history is loaded.',
    },
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
    'That second one is worth a flag, and it has now been checked. 2008 was an election year — year 4 — and the Dow fell roughly a third; it was not a pre-election year at all. Run on our own price files, the misses are somewhere else entirely:',
    {
      kind: 'table',
      head: ['Index', 'Pre-election years', 'Up', 'Rate', 'The misses'],
      rows: [
        ['S&P 500 (1970–)', '14', '12', '86%', '2011 −0.0%, 2015 −0.7%'],
        ['Dow (1993–)', '8', '7', '88%', '2015 −2.2%'],
        ['Nasdaq Composite (1971–)', '13', '11', '85%', '1987 −5.2%, 2011 −1.8%'],
        ['Nasdaq 100 (1986–)', '10', '10', '100%', 'none'],
        ['Russell 2000 (1988–)', '9', '6', '67%', '2007, 2011, 2015'],
      ],
      caption: 'Measured 2026-11-08 by cycles/election_cycle.py. Calendar-year closes; year 3 is the pre-election year.',
    },
    'So the shape of the claim survives contact with the data and the specifics do not. The big indices read 85–88%, close to the 94% quoted; the exceptions are 2011 and 2015, exactly as the correction predicted, and on the S&P both were flat rather than down — minus a rounding error and minus seven tenths of one percent. A year that finishes unchanged is a miss for the statistic and not much of a warning for a trader.',
    {
      kind: 'callout',
      tone: 'warn',
      title: 'Read the start dates',
      text: 'This is not the hundred years the claim is made over. Our S&P history begins in 1970 and the Dow’s in 1993, so 1931 cannot appear in either column and the samples are 8 to 14 years rather than 25. Two data faults caused that — a Yahoo request that asked for everything since the Unix epoch, which means 1970, and a Stooq fetch that returned nothing — and both are fixed but not yet re-run. Expect these numbers to move.',
    },
    'Note also the one reading of 100 percent. Ten out of ten on the Nasdaq 100 is the smallest sample in the table and the most impressive-looking number in it, which is the whole problem with a hit rate in miniature.',
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
    'The agreement itself is now computed rather than argued. `python3 cycles/composite.py --symbol ^GSPC --preset sp500` runs each named interval, projects each one forward, and takes a weighted vote at one, three, six and twelve months. A cycle’s vote is weighted by its swing correlation and its worst epoch — not by its price correlation, since weighting that would give the loudest vote to the noise. Cycles that disagree cancel, which is the point: a split is a forecast of chop, and that is a usable answer rather than a missing one.',
    {
      kind: 'callout',
      tone: 'warn',
      title: 'What it says today',
      text: 'On the S&P data currently loaded, not one of the named short cycles clears the swing and epoch floors at a 440-day window, so there is no composite to read. The 11.65-year interval does clear them at its own window — see “The S&P short cycles” — which is a reminder that the window belongs to the cycle rather than to the run. A composite assembled from intervals that have not individually passed R9 is not a composite, it is an average of coincidences.',
    },
    'All of this is recorded here as the course’s expectation — the hypothesis the desk trades against, not a set of facts. Every piece of it is testable with the scripts in `cycles/`, and it should be re-tested as data arrives rather than carried forward on memory.',
    'What would break the near-term case, decided in advance: the market taking out its October 2026 low decisively rather than turning up from it; the 60-year analog diverging on swing correlation when re-scored, not merely on price; or the pre-election-year tilt failing to show in our own data when `election_cycle.py` is run. Any of those and the roadmap is void, whatever the narrative says.',
  ],
};

const crudeCycles: KbArticle = {
  id: 'cycle-crude-17',
  title: 'Crude oil: the 17-year cycle',
  summary: 'December 1997–May 2000 against December 2014–May 2017 at 77% over 650 trading days — and why a match that turns direction is worth more than one that trends.',
  source: 'Market Forecast Mastery, Lesson 1 — Allen Reminick',
  updated: TODAY,
  body: [
    'The crude oil slide covers a longer span than the equity ones: 650 trading days, about three and a half years, with the two periods 17 years apart. The light blue path is December 1997 to May 2000; the dark blue is December 2014 to 15 May 2017, which was the present market when the slide was made. The last two and a half years of it are 77% correlated.',
    'Seventy-seven is a lower number than the Dow’s 93, and it is the better piece of evidence. The lecture makes the point directly: it is hard to get that kind of correlation when the market goes down first and then up afterwards. Two stretches that both trend upward will correlate highly for no reason at all — that is the trap documented in “Using a cycle forecast correctly”. Two stretches that fall hard, bottom, and turn up together have to agree about the turn, and a turn is not something a trend can fake. Down hard, up, down, up, with the low arriving within two weeks of the analog.',
    {
      kind: 'chart',
      symbol: 'TVC:USOIL',
      label: 'WTI crude oil',
      interval: 'W',
      range: 'ALL',
      caption: 'Weekly crude, back as far as the embed reaches. The 2014–16 collapse and its base are the right-hand half of the comparison; the turn, not the trend, is the part that carries the argument.',
    },
    'The course also notes that the 17-year and 27-year cycles in crude agree with each other both before and after the present moment on that chart, tightly. Two independent intervals landing on the same shape is the composite argument again, applied to one market.',
    'What it was worth in practice is the most useful part of the example, and it is not “it predicted the price”. Through the 2014–2016 collapse the analog said this is the part that goes down, so there was no temptation to catch the falling knife. Then, when price broke the downtrend line, somebody holding the analog knew two things the tape alone did not say: that a turn belonged here, and that what followed in 1999 was not a small bounce but a large sustained advance. That is enough to cover a short, or to start looking for a long, well before the move is obvious to everyone else.',
    'Note the shape of that reasoning. The analog did not generate the entry — the broken downtrend line did. The analog supplied the conviction to take a signal that would otherwise have looked like just another bounce in a bear market. That is the correct division of labour between a cycle and a chart.',
    'To test it on our own data: `python3 cycles/find_cycles.py --symbol CL=F --preset crude --window 650`, which runs 17, 19.08 and 27 years as named hypotheses.',
  ],
};

const metonicCycle: KbArticle = {
  id: 'cycle-metonic-19',
  title: 'The 19-year Metonic cycle — crude oil and war',
  summary: 'The Iraq war of 2003 and the Russia–Ukraine war 19 years later, lined up in crude — including the ten months of preparation before either one started.',
  source: 'Market Forecast Mastery, Lesson 1 — Allen Reminick',
  updated: TODAY,
  body: [
    'The second crude cycle runs 19 years and one month. The slide, dated 21 June 2022, shows the 2003 Gulf War pattern in green against 2022 in red across about 360 trading days, roughly twenty per month, and calls for higher prices until 25 August.',
    'The striking part is not the war itself but what came before it. Russia invaded Ukraine on 24 February 2022; the United States invaded Iraq in March 2003. For roughly ten months before each of those dates, crude traced the same path. The preparatory period lined up with the preparatory period. Then came the initial spike, the pullback, and the recovery — in both cases.',
    {
      kind: 'chart',
      symbol: 'TVC:USOIL',
      label: 'WTI crude oil — the war years',
      interval: 'D',
      range: '60M',
      caption: 'Daily crude. The claim is about the ten months before each invasion, not the spike on the day — scroll back to late 2021 and to mid-2002 and compare the run-ups.',
    },
    'The 19-year interval has a name and a physical basis. It is the Metonic cycle, after Meton of Athens, who described it around 432 BC. Nineteen solar years is almost exactly 235 lunar months, so after 19 years the solar and lunar calendars realign: the dates of the new moons and full moons repeat where they fell 19 years earlier, having matched no intervening year. Two related but distinct periods often get folded into it — the lunar nodal cycle of 18.6 years, which governs where eclipses can occur, and the Saros of 18.03 years, after which a given eclipse repeats. The course refers to all of these loosely as the eclipse cycle; worth separating if the mechanism ever matters.',
    'The course extends the 19-year interval to Middle East conflict itself: 1948 and the war at Israel’s founding, 1967, then on through 1986–87, 2005, and 2023–24. Taken as a strict chain from 1948 the steps land on 1967, 1986, 2005 and 2024 — close to the October 2023 outbreak but not on it, and the 1973 war does not sit on that chain at all, being six years off. Record the pattern, but do not round the dates to make it fit; a cycle that needs its dates adjusted is being fitted rather than found.',
    'One extension came from the session itself: if the long-cycle convergence points at 2033–34, that is also 19 years on from the start of the Ukraine conflict — which works if the conflict is dated from the 2014 annexation of Crimea (2014 + 19 = 2033), not from the 2022 invasion (which gives 2041). Which start date you choose decides whether the cycles agree, and choosing the one that makes them agree is the error this knowledge base exists to prevent. Worth noting, not worth trading, until the 19-year interval is tested on crude with a pre-specified offset.',
    'To test it: `python3 cycles/find_cycles.py --symbol CL=F --lag-years 19.08 --window 360`.',
  ],
};

const goldCycle: KbArticle = {
  id: 'cycle-gold-24',
  title: 'Gold: the 24.5-year cycle',
  summary: 'Seven years of gold against the same seven years 24.5 years earlier — the longest window in the course’s examples.',
  source: 'Market Forecast Mastery, Lesson 1 — Allen Reminick',
  updated: TODAY,
  body: [
    'The gold slide uses the longest window of any example in the lesson: 1,800 trading days, about seven years. The present market runs 1 May 2010 to 11 July 2017, with the 24.5-year interval drawn against it, and the caption reports a high correlation across the whole seven years.',
    'Window length is the reason to take this one seriously. Seven years of daily data contains far too much structure for an accidental match to survive it — the rally, the top, the long decline and the base all have to arrive in roughly the right places. The same scepticism still applies to the headline correlation number, but the test is a much harder one to pass than a two-year window.',
    {
      kind: 'chart',
      symbol: 'TVC:GOLD',
      label: 'Gold',
      interval: 'M',
      range: 'ALL',
      caption: 'Seven-year windows are long enough that the rally, the top, the decline and the base all have to line up — a far harder test than a two-year window.',
    },
    'Note that 24.5 years is not a round interval and has no stated mechanism behind it, unlike the Metonic 19 or the 60 that recurs across the equity work. The lecture presents it as something located in the data rather than derived. That makes the pre-specified re-test more important rather than less: a cycle discovered by looking is exactly the kind that needs to prove itself on epochs that were not used to find it.',
    'To test it: `python3 cycles/find_cycles.py --symbol GC=F --lag-years 24.5 --window 1800 --epochs 4`. Gold futures history runs from the mid-1970s, so a 24.5-year offset with a seven-year window needs roughly 32 years of data before a single epoch check is even possible — expect few epochs and read `heldMin` accordingly.',
  ],
};

const spShortCycles: KbArticle = {
  id: 'cycle-sp-short',
  title: 'The S&P short cycles — 11.65, 22 and 6.8 years',
  summary: 'Three claims from the lectures, each re-measured on our own data as of the date it was made. One reproduces almost exactly, one does not, one cannot be tested here.',
  source: 'Market Forecast Mastery, Lesson 1 — Allen Reminick; measured 2026-11-08',
  updated: TODAY,
  body: [
    'The long cycles set the bias; the short ones decide whether the next three months are up. The lectures demonstrate three on the S&P, all anchored at the end of April 2022, and all three are checkable — which is what this page does.',
    { kind: 'heading', text: 'What the slides claim' },
    'The 11.65-year interval: 28 April 2022 against 3 September 2010, over 230 trading days — about eleven months — with the ups and downs landing in the same places. The lecture adds that over a longer window, roughly 400 trading days, the same interval runs 96% correlated for almost two years.',
    'The 22-year interval: 2000 against 2022 over 260 trading days. What made this one memorable was not the chart. In May 2022 the Federal Reserve raised rates by half a point for the first time in 22 years — so on the lecture’s reading, the interval repeated and so did the surface reason for it.',
    'The 6.8-year interval: 13 April 2002 against 29 April 2022, 365 bars at 240 minutes each — roughly three months of four-hour bars — reported at 80% correlation. The claim here is the most striking of the three, because it is intraday: not a general drift but a day-by-day shape repeating from twenty years earlier.',
    { kind: 'heading', text: 'What the data says' },
    'Each was re-run with the course’s own window and anchored to the date the claim was made, which is what `--as-of` exists for: a claim made in April 2022 is about the window ending in April 2022, and scoring it against today tests something else.',
    {
      kind: 'table',
      head: ['Claim', 'Window', 'Price corr', 'Swing corr', 'Worst epoch', 'Verdict'],
      rows: [
        ['11.65y, as of 2022-04-28', '400 days', '0.962', '0.585', '−0.68', 'reproduces'],
        ['11.65y, as of 2022-04-28', '230 days', '0.766', '0.511', '+0.10', 'reproduces'],
        ['22y, as of 2022-04-28', '260 days', '0.285', '0.101', '−0.54', 'does not'],
        ['6.8y, as of 2022-04-29', '365 days', '0.831', '−0.066', '−0.35', 'not a fair test'],
      ],
      caption: 'S&P 500 daily closes, cycles/find_cycles.py with --as-of. The course quotes 96% for the first row.',
    },
    {
      kind: 'callout',
      tone: 'key',
      title: 'The 11.65-year cycle is the first claim in this knowledge base to survive its own test',
      text: 'Measured 0.962 against the quoted 96%, with the analog window ending 2010-08-30 against the slide’s 3 September 2010 — days apart. More importantly it is the only interval so far with a swing correlation near 0.6, roughly where the genuine planted cycle scored in the controls and far above the 0.449 the random walk managed. An open search over 10 to 13 years lands on 11.6 by itself, so the named interval is also the local best rather than a number that needed rounding to work.',
    },
    'The 22-year claim does not reproduce. At exactly 22.0 years it scores 0.285, which is nothing; searching 19 to 25 years finds its best fit at 23.4 years and 0.751, not at 22. The Federal Reserve detail is true and is a good story, and it is not evidence about the interval — a coincidence of policy dates is the kind of thing that reads as confirmation precisely because it cannot be scored.',
    'The 6.8-year row is marked “not a fair test” deliberately. The claim was made on four-hour bars and we hold only daily closes, so running it on dailies tests a different thing and failing it proves nothing. Intraday history is the missing ingredient; until it exists this one is simply open.',
    { kind: 'heading', text: 'And then the part that matters: it was still wrong' },
    'The 11.65-year interval passed every gate in R9 — swing correlation 0.51, a positive worst epoch, the local best in its own neighbourhood, and a price correlation matching the quoted figure. It was the one cycle on the board worth voting. So run the composite as of 28 April 2022 and see what it told you to do, then check what the index actually did.',
    {
      kind: 'table',
      head: ['Horizon from 2022-04-28', 'Forecast', 'Actual', 'Index'],
      rows: [
        ['1 month', '+7.2%', '−3.0%', '4288 → 4158'],
        ['3 months', '+10.5%', '−3.7%', '4288 → 4130'],
        ['6 months', '+19.4%', '−11.2%', '4288 → 3807'],
        ['12 months', '+12.2%', '−2.8%', '4288 → 4168'],
      ],
      caption: 'The composite’s weighted call against S&P 500 closes. Wrong in direction at every horizon.',
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'Read this one twice',
      text: 'The best-scoring cycle we have, tested the honest way, called for a rally into late 2022 and the index fell 11% instead — and it was most wrong exactly where it was most confident. Every protection in this knowledge base was in place: the interval was pre-specified, it cleared the swing floor, it held at earlier epochs, and the search agreed with it. It was still wrong. That is what a 90% method looks like from the inside of the other 10%, and it is the reason R8 and R10 exist — the analog never gets to size the position or skip the stop.',
    },
    'Worth setting beside the 60-year cycle’s June 2022 call, which described the following months closely. Same index, same quarter, two intervals, opposite readings, and the one with the better scores is the one that failed. A composite built from more than one qualifying cycle might have caught the disagreement and reported chop; with only one cycle passing, there was nothing to disagree with it. That is an argument for the composite rather than for any single clock.',
    { kind: 'heading', text: 'What to take from it' },
    'Three claims, three different outcomes, and the difference between them is the whole argument for measuring rather than admiring. The chart that looks most convincing on a slide is not reliably the one that holds up, and the one that holds up here — 11.65 years — is also the one the course spends the least time on.',
  ],
};

const rulesOfAnalysis: KbArticle = {
  id: 'rules-of-analysis',
  title: 'The rules, in order',
  summary: 'The whole method condensed to ten rules, with the two that are most often broken marked.',
  source: 'Distilled from the Market Forecast Mastery lessons; the long form is cycles/METHOD.md',
  updated: TODAY,
  body: [
    'The lectures run to hours and the method underneath them is short. These are the rules the scanner implements and everything else on these pages elaborates.',
    { kind: 'heading', text: 'Finding a cycle' },
    'R1 — A window has to be long enough to be hard to fit. Five months will match something by accident; twenty-two months containing a sequence of highs and lows is a real test. The course’s windows run from eleven months to seven years.',
    'R2 — A match that turns is worth more than a match that trends. Two rising stretches correlate for no reason at all. Two that fall, base and turn together have to agree about the turn, and a trend cannot fake a turn. This is why crude’s 77% is better evidence than the Dow’s 93%.',
    'R3 — The repeat has to be non-reflexive. Nobody trades off 1962, or off four-hour bars from 2002. A pattern that could be produced by people watching the same chart is not evidence of a cycle.',
    'R7 — Pre-specify the interval. Testing one the course names is a single hypothesis. Taking the best of twelve thousand searched offsets is a different activity with a far weaker standard of proof.',
    {
      kind: 'callout',
      tone: 'warn',
      title: 'R9 — the scoring order, and the one most often got backwards',
      text: 'Worst-epoch correlation first, then swing correlation, then daily returns, and price correlation last. The headline number on every slide is the least informative of the four: a random walk with no cycle in it scores 0.947 on it.',
    },
    { kind: 'heading', text: 'Reading one' },
    'R4 — Direction and swing, not day by day. What repeats is the general direction and the general shape. Any use that needs an exact day or an exact level is using the method for something it does not provide.',
    'R5 — The composite is the forecast, not any single cycle. Where several independent intervals agree on the next few months, the odds stack. Where they fight, expect chop rather than a move — a disagreement is a forecast of nothing, and that is a usable answer. Where they all point down together, expect a real decline.',
    'R6 — A long cycle gives the bias, a short cycle gives the timing. The 60-year clock says which side to work for a year; a four-year or eleven-month cycle says whether the next three months are up.',
    { kind: 'heading', text: 'Trading one' },
    'R8 — The analog gives conviction, not entries. The trade is still taken on a level, a reaction and a stop. What the roadmap buys is the nerve to act on a valid trigger before it is obvious — covering a short when crude broke its downtrend line, knowing what followed in the analog was large and sustained rather than a bounce.',
    'R10 — Know what would void it, before entering. “The 60-year analog says up into 2027” is not tradeable. “Long while the October low holds, void below it” is.',
    {
      kind: 'callout',
      tone: 'note',
      title: 'And one that is not a rule',
      text: 'The lectures argue that the driver is not human — that nobody is looking at 1962, so the surface reason given for a move is a story attached afterwards rather than its cause. That is the course’s position on why cycles exist. Nothing here depends on it: the scanner measures whether a pattern repeats, not why.',
    },
  ],
};

const waveMechanics: KbArticle = {
  id: 'wave-mechanics',
  title: 'Wave mechanics — the approach we are not using',
  summary: 'Decomposition: find the component cycles, add them into a composite wave, project it. Why the course defers it, and what its gold forecast looked like.',
  source: 'Market Forecast Mastery, Lesson 1 — Allen Reminick',
  updated: TODAY,
  body: [
    'The other half of the fork from Lesson 1. Where synthesis slides one window back through history looking for a match, decomposition takes the market apart: locate the component waves, of which as many as fifteen to twenty may be live in one market at once, add them back together into a single composite wave, and check whether that composite reproduces the price action you already have. If it does, project it forward.',
    'The reasoning is the same bet in a different costume — if the model matches the past it will probably match the future — and it is a demanding one. The mathematics is Fourier series and spectral analysis, the work needs software, and the number of free parameters is large enough that reproducing the past is not by itself impressive.',
    'The course shows one result rather than the method: a gold forecast drawn in 1982 and run to 2015, thirty-three years of projection as a single smooth curve laid over the weekly bars, with the component waves visible underneath it. Then it sets the whole approach aside, explicitly, until the synthesis side has been learned.',
    'That ordering is worth respecting rather than skipping. Synthesis has one parameter you can argue about — which interval — and a scoring discipline that can reject it. Decomposition has fifteen to twenty components, each with a period, an amplitude and a phase, which is enough freedom to fit almost anything in hindsight. Learning to tell a real repeat from a flattering one on the simpler method first is the right order.',
    'Nothing in this repo implements decomposition, and nothing is planned until the synthesis side is settled — which, on the evidence in these pages, it is not yet.',
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
    { kind: 'demo', id: 'noise' },
    'That is not a thought experiment about a test run months ago — the chart above is generated in your browser each time you press the button, and the scan behind it is the same one the repo runs. Press it a few times and watch which numbers move.',
    'Then the uncomfortable part. The first run against real index history, on 2026-11-08, searched every offset in seven markets. Every single best match scored like the noise:',
    {
      kind: 'table',
      head: ['Market', 'Best offset found', 'Price corr', 'Swing corr', 'Worst epoch'],
      rows: [
        ['Russell 2000', '12.4 years', '0.959', '0.295', '−0.80'],
        ['S&P 500', '12.4 years', '0.957', '0.218', '−0.92'],
        ['Dow', '30.3 years', '0.953', '0.389', 'untestable'],
        ['Nasdaq 100', '11.8 years', '0.948', '−0.082', '−0.88'],
        ['Nasdaq Composite', '32.6 years', '0.947', '0.009', '−0.52'],
        ['Gold', '19.7 years', '0.921', '0.544', 'untestable'],
        ['Crude oil', '8.3 years', '0.808', '0.307', '−0.27'],
        ['— random walk, for comparison', '50.2 years', '0.947', '0.449', '−0.01'],
      ],
      caption: 'Open search, 440-day window, from cycles/REPORT.md. The last row is the synthetic control with no cycle in it.',
    },
    {
      kind: 'callout',
      tone: 'key',
      title: 'Read that table before trusting any search result',
      text: 'Seven real markets produced price correlations of 0.81 to 0.96, and the random walk with no cycle in it scored 0.947 — inside that range, beating five of them. On the measures that can tell the difference, the real markets did no better than the noise either: swing correlations near zero and worst-epoch scores of −0.5 to −0.9. Searching for a cycle finds one whether or not there is one to find.',
    },
    'None of which says the 60-year cycle is not real. It says the open search cannot establish it, and that the only run that could — a named 60-year offset on a century of Dow data — has not been possible yet for want of the history. Those are different statements and the difference matters.',
    'Pre-specify the cycle. Testing 60 years because the course says 60 years is a single hypothesis and the result means something. Taking the best of twelve thousand searched offsets is a different activity with a different, much weaker, standard of proof. The scanner supports both and labels which one produced a given match; prefer the named test when a cycle is already in mind.',
    'Distrust hindsight alignment. Matching the Depression to the financial crisis after both had happened is a weaker claim than the 60-year cycle making a call in June 2022 that then came true. The difference is whether the forecast existed before the outcome. Which is why forecasts belong in the signal log the moment they are made, with the date — so the hit rate is measured later rather than remembered.',
    'Separate being right about price from being right about timing. The lecture’s remark about a well-known strategist — right about the prices, no clue about the timing — is the common failure, and it is the specific thing cycles are supposed to fix. A target with no date is not a plan, and a direction with no window cannot be risk-managed. If a cycle is not improving the timing, it is not earning its place.',
    'The real value of a roadmap is permission to act early at a trigger you would otherwise distrust. The crude oil example is the model: through the collapse the analog said this is the down part, so there was nothing to catch; when price broke the downtrend line, the analog said the move that follows is large and sustained, not a bounce. The break was the entry; the analog was the conviction to take it before it was obvious. A cycle that makes you enter without a trigger is being misused; one that makes you take a valid trigger others are too frightened to take is being used correctly.',
    'A cycle belongs to a market. Sixty and 78.5 years are equity clocks; crude runs on 17 and 19; gold on 24.5. Do not carry a cycle across markets because the number is familiar — test it where you intend to trade it.',
    'And there is now a worked example of all of this failing, in “The S&P short cycles”: the best-scoring interval on our board, pre-specified and tested as of the day the claim was made, called a rally into late 2022 while the index fell 11%. Read it before trusting anything here.',
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
    {
      kind: 'overlay',
      series: 'DJI',
      label: 'The scanner’s own output',
      caption: 'Pick a market and an offset: every one of these was found by searching, and the scores underneath are the reason to distrust most of them. Switch to “What happened next” for the analog’s forward path laid on today’s price — the course’s forecast chart, from our data.',
    },
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
    'Metonic cycle — 19 years, after Meton of Athens (c. 432 BC). Nineteen solar years is almost exactly 235 lunar months, so the dates of new and full moons repeat after it. The course’s 19-year crude and conflict cycles are this interval.',
    'Lunar nodal cycle — 18.6 years, governing where eclipses can occur; the Saros, 18.03 years, after which a specific eclipse repeats. Both are commonly folded into “the eclipse cycle” alongside the Metonic 19, though they are three different periods.',
    'Preparatory period — the stretch before an event in which the analog already matches. In crude, the ten months before both the 2003 and 2022 wars tracked each other, which is where the forecasting value sat.',
    'Secular bear — a decade-scale period with no sustained advance, such as 1929–1942 or 1966–1982, as distinct from a single sharp decline.',
  ],
};

/**
 * The shelves the articles go on. Drop a KbArticle into the matching
 * `articles` array and it shows up on the page — nothing else needs changing.
 */
/**
 * The chapters, in reading order. The page renders them as one continuous
 * document, so this array is the order of the story: the premise, the fork
 * in method, how we search, what the search found, the rules that came out
 * of it, how to use them, and then reference.
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
    articles: [waveMechanics],
  },
  {
    id: 'cycles',
    title: 'Technique 1 — locating cycles',
    description: 'Series and sequences, and the scanner that searches every offset in the history for the one today’s market rhymes with.',
    articles: [cycleScanner],
  },
  {
    id: 'catalogue',
    title: 'The cycle catalogue',
    description: 'The specific cycles the course works with — equities, crude and gold — what the evidence for each one is, and where each currently points.',
    articles: [sixtyYear, seventyEightYear, spShortCycles, electionCycle, crudeCycles, metonicCycle, goldCycle, composite],
  },
  {
    id: 'using',
    title: 'Using a forecast',
    description: 'How a cycle roadmap meets the entry rules, what it can and cannot tell you, and the traps that make people misuse it.',
    articles: [rulesOfAnalysis, usingForecasts],
  },
  {
    id: 'glossary',
    title: 'Glossary',
    description: 'Plain definitions for every term used across the desk and the course.',
    articles: [cycleGlossary],
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
    title: 'Forecast journal & review',
    description: 'Recording a forecast on the day it is made, scoring it once the window has passed, and the review that turns a run of calls into a measured hit rate.',
    articles: [],
  },
];

export const articleCount = categories.reduce((n, c) => n + c.articles.length, 0);

/** The shelf an article sits on, for the breadcrumb on an article page. */
export function categoryOf(articleId: string): KbCategory | undefined {
  return categories.find(c => c.articles.some(a => a.id === articleId));
}
