import type { KbBlock } from './kbBlocks';

export type { KbBlock } from './kbBlocks';

/**
 * One knowledge-base article. `body` is a list of blocks.
 *
 * Written as bullets and rules rather than prose: this is reference material
 * consulted beside a chart, not an essay. A plain string is a paragraph and
 * is used sparingly — for a lead line, or a point that genuinely needs a
 * sentence. Everything else is a list, a rule set, a table or a figure.
 */
export interface KbArticle {
  id: string;
  title: string;
  summary: string;
  body: KbBlock[];
  source?: string;
  updated?: string;
}

/**
 * A chapter. Its articles are sections, rendered in order on one page.
 *
 * `description` is printed on the same line as the title, after an em dash,
 * so it is written as a continuation of it — lower case, and never repeating
 * a word the title already said. A chapter holding a single section prints no
 * section heading, so that chapter's line has to carry what the section is.
 */
export interface KbCategory {
  id: string;
  title: string;
  description: string;
  articles: KbArticle[];
}

const TODAY = '2026-11-08';

// ── The course ──

const premise: KbArticle = {
  id: 'mfm-premise',
  title: 'What this is about',
  summary: 'The premise, the sources, the two ways to forecast, and the three techniques.',
  updated: TODAY,
  body: [
    {
      kind: 'list',
      items: [
        'History always repeats itself — if one knows where to look.',
        'The work is not prediction. It is locating the stretch of past data the present rhymes with, and reading what that stretch did next.',
        'Where the knowledge comes from: W.D. Gann (the law of periodicity), Dr. Jerome Baumring (the structure behind it), Allen Reminick (the practical method).',
      ],
    },
    'Gann on the law of periodicity:',
    '> "The power to determine the trend of the market is due to my knowledge of the characteristics of each individual stock and a certain grouping of different stocks under their proper rates of vibration. Stocks are like electrons, atoms, and molecules, which hold persistently to their own individuality in response to the fundamental Law of Vibration. Science teaches that an original impulse of any kind finally resolves itself into periodic or rhythmical motion. Also, just as the pendulum returns again in its swing, just as the moon returns in its orbit, just as the advancing year ever brings the roses of spring, so do the properties of the elements periodically recur as the weight of the atoms rises."',
    { kind: 'heading', text: 'Two ways to forecast' },
    {
      kind: 'rules',
      items: [
        {
          rule: 'A — Analytical, by decomposition',
          detail: 'Fourier series, spectral analysis, wave mechanics. Complex mathematics, software required. The internal approach.',
        },
        {
          rule: 'B — Synthesis, by pattern recognition',
          detail: 'Conceptually easy, can be done by hand. The result is identifying where history repeats. The external approach — and what this course does.',
        },
      ],
    },
    { kind: 'heading', text: 'The three techniques' },
    {
      kind: 'list',
      ordered: true,
      items: [
        'Series and sequences, used to locate cycles.',
        'The Slide Technique — forecasting by locating the intervals of repetition.',
        'The Momentum Balance Technique — proprietary; when a move is likely to continue, and the price target for it.',
      ],
    },
    'Everything that follows applies those three to live charts.',
  ],
};

// ── Two ways to forecast ──

const waveMechanics: KbArticle = {
  id: 'wave-mechanics',
  title: 'Wave mechanics — the approach we are not using',
  summary: 'Decomposition: find the component cycles, add them, project. Why the course defers it.',
  updated: TODAY,
  body: [
    { kind: 'heading', text: 'How it works' },
    {
      kind: 'list',
      ordered: true,
      items: [
        'Locate the component waves in a market — as many as 15 to 20 may be live at once.',
        'Add them together into a single composite wave.',
        'Check whether that composite reproduces the price action you already have.',
        'If it does, project it forward.',
      ],
    },
    { kind: 'heading', text: 'Why it is deferred' },
    {
      kind: 'list',
      items: [
        'The mathematics is Fourier series and spectral analysis; it needs software.',
        '15 to 20 components, each with a period, an amplitude and a phase, is enough freedom to fit almost anything in hindsight.',
        'Synthesis has one parameter worth arguing about — which interval — and a scoring discipline that can reject it. Learn to tell a real repeat from a flattering one there first.',
        'The course shows one result rather than the method: a gold forecast drawn in 1982 and run to 2015, 33 years as a single curve over the weekly bars.',
      ],
    },
    {
      kind: 'callout',
      tone: 'note',
      title: 'Not implemented here',
      text: 'Nothing in the repo does decomposition, and nothing is planned until the synthesis side is settled — which, on the evidence in these pages, it is not.',
    },
  ],
};

// ── Technique 1 ──

const cycleScanner: KbArticle = {
  id: 'cycle-scanner',
  title: 'The scanner, and its four scores',
  summary: 'What the scanner does, and which of its four scores to believe.',
  source: 'cycles/README.md',
  updated: TODAY,
  body: [
    { kind: 'heading', text: 'What it does' },
    {
      kind: 'list',
      ordered: true,
      items: [
        'Take the last N trading days — 440 by default, the span on the course slides.',
        'Slide that window back through every earlier offset in the history.',
        'Score each fit, and keep the best ones.',
        'Project each match’s own forward path onto today’s price.',
      ],
    },
    {
      kind: 'rules',
      items: [
        { rule: 'update_prices.py --full', detail: 'Daily closes for the indices, crude and gold. Stooq first for depth, Yahoo for the recent tail.' },
        { rule: 'find_cycles.py --all --svg', detail: 'Search every market and draw the overlays.' },
        { rule: '--preset course', detail: 'Test only the intervals the lectures name, instead of searching.' },
        { rule: '--as-of 2022-04-28', detail: 'Check a published claim against the data as it stood the day it was made.' },
      ],
    },
    { kind: 'heading', text: 'The four scores, worst to best' },
    {
      kind: 'rules',
      items: [
        { rule: 'Price correlation — nearly worthless alone', detail: 'The headline number on every slide. A random walk with no cycle in it scores about 0.95.' },
        { rule: 'Daily return correlation — a floor', detail: 'Stricter than what the method actually claims, so a sanity check rather than a gate.' },
        { rule: 'Swing correlation — matches the claim', detail: 'Monthly returns rather than prices. The course claims general direction and general swing; this measures exactly that.' },
        { rule: 'Worst-epoch correlation — the sharpest', detail: 'Re-score the same offset at earlier anchor points. A cycle that only fits the last two years is not a cycle.' },
      ],
    },
    { kind: 'heading', text: 'What the controls showed' },
    {
      kind: 'table',
      head: ['Series', 'Price', 'Swing', 'Worst epoch'],
      rows: [
        ['Synthetic, real 30-year cycle planted', '0.895', '0.875', '+0.79'],
        ['Pure random walk, best of 12,000 offsets', '0.947', '0.449', '−0.01'],
        ['Random walk, 30-year offset named in advance', '0.086', '−0.135', '−0.09'],
      ],
      caption: 'The random walk beat the genuine cycle on price correlation. Only swing and epoch stability separated them.',
    },
    {
      kind: 'overlay',
      series: 'DJI',
      label: 'The scanner’s own output',
      caption: 'Pick a market and an offset. Every one of these was found by searching, and the scores underneath are the reason to distrust most of them.',
    },
  ],
};

// ── The cycle catalogue ──

const sixtyYear: KbArticle = {
  id: 'cycle-60-year',
  title: 'The 60-year cycle',
  summary: '2022 against 1962 at 93%, the forward call it made, and where it puts 2026.',
  updated: TODAY,
  body: [
    {
      kind: 'overlay',
      series: 'GSPC',
      label: 'The 60-year overlay',
      lagYears: 60,
    },
    {
      kind: 'rules',
      items: [
        { rule: 'Market', detail: 'The course shows the Dow. Yahoo\u2019s Dow record starts in 1992, so 60 years cannot be measured on it — everything here is the S\u0026P, whose record reaches 1927. Switch the figure to the Dow and it says so.' },
        { rule: 'Window', detail: '440 trading days — about 22 months.' },
        { rule: 'Offset', detail: '60 years, named in advance rather than searched for.' },
        { rule: 'Command', detail: 'find_cycles.py --symbol ^GSPC --lag-years 60 --window 440' },
      ],
    },
    {
      kind: 'callout',
      tone: 'key',
      title: 'Tested on the S&P, it was the strongest claim in this course \u2014 and then it decayed',
      text: 'Run on the S&P as of 30 June 2022, the pre-specified 60-year offset scores 0.922 on price and 0.457 on swing \u2014 the only swing figure anywhere in these pages to clear the 0.449 a random walk reaches, and its analog is 1960-09 to 1962-06, exactly the stretch the course points at. The same offset today reads \u22120.279 on price and 0.182 on swing. The window the claim was made on matched; the window since has not. Its forward call fared better than the overlay did: +29.6% projected over eleven months against +10.4% delivered, so the direction held and a third of the size.',
    },
    { kind: 'heading', text: 'The claim' },
    {
      kind: 'list',
      items: [
'2022, ending April, against 1962.',
        '93% correlated. The down move, the low, and high after low after high all line up in sequence.',
        'Checked historically: the window taken back 25 years, against 60 years before that, still over 90%.',
        'Reported as holding at roughly 90% accuracy since 2022.',
      ],
    },
    { kind: 'heading', text: 'Why it is not self-fulfilling' },
    {
      kind: 'list',
      items: [
        'Anyone trading in 1962 in their twenties is in their eighties or nineties now.',
        'Essentially nobody in today’s market consults 1962 before acting.',
        'Whatever produces the repeat, it is not traders copying an old chart.',
      ],
    },
    { kind: 'heading', text: 'The part that counts as evidence' },
    {
      kind: 'list',
      items: [
        'June 2022: rates just raised, recession the consensus, expectation lower.',
        'The 1962 roadmap said up into August, down into mid-October, then away to the upside.',
        'That is what happened — and it was out of sample, which is what makes it evidence rather than a fit.',
      ],
    },
    {
      kind: 'timeline',
      title: 'The same point on three turns of the clock',
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
      caption: 'Three repetitions is a different proposition from one observation.',
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'Not yet tested on our own data',
      text: 'Stooq, the only free source reaching back to 1896, is blocked from GitHub’s runners by IP reputation — so the Dow we hold starts in 1992. Until someone runs the fetch from a home connection, the 93% is the course’s number, not ours.',
    },
  ],
};

const seventyEightYear: KbArticle = {
  id: 'cycle-78-year',
  title: 'The 78.5-year cycle and the 157 / 314 chain',
  summary: 'The Depression against the financial crisis, and the harmonic argument that reaches 2034.',
  updated: TODAY,
  body: [
    {
      kind: 'overlay',
      series: 'GSPC',
      label: 'The 78.5-year overlay',
      lagYears: 78.5,
    },
    {
      kind: 'rules',
      items: [
        { rule: 'Market', detail: 'S&P 500 daily closes — the Dow is the course’s chart, but ours starts in 1992.' },
        { rule: 'Window', detail: '345 trading days — about 17 months.' },
        { rule: 'Offset', detail: '78.5 years. Half of 157, which is half of 314.' },
        { rule: 'What would make it real', detail: 'The offset holding at epochs containing no crisis. If it only fits when one end is 1929–32, it is an observation about two crises.' },
        { rule: 'Command', detail: 'find_cycles.py --symbol ^DJI --lag-years 78.5 --window 345 --epochs 6' },
      ],
    },
    { kind: 'heading', text: 'The claim' },
    {
      kind: 'list',
      items: [
        'Dow: 2007–08 into the March 2009 low, against 1930 into 1931–32.',
'The two crises line up 78 years apart.',
        'The 314-year cycle reaches back to the speculative top of 1720, putting the next turn at 1720 + 314 = 2034.',
      ],
    },
    {
      kind: 'callout',
      tone: 'note',
      title: 'A correction worth making',
      text: 'The 1720 mania is the South Sea Bubble — the one that caught Isaac Newton — not the Dutch tulip mania, which peaked in 1636–37. The arithmetic is built on 1720 either way.',
    },
    { kind: 'heading', text: 'Where it agrees with the other clock' },
    {
      kind: 'list',
      items: [
        '60-year clock: 2033–34 corresponds to 1973–74, the start of a major decline.',
        '314-year chain: 1720 + 314 = 2034.',
        'Two independent intervals landing in the same window is what the composite method is built on.',
      ],
    },
    { kind: 'heading', text: 'Why it is weaker than the 60-year case' },
    {
      kind: 'list',
      items: [
        'The match was identified after both crashes were known.',
        'The 60-year cycle earns more trust because it made a call in June 2022 that then came true.',
        'A hindsight alignment of two famous crashes is weaker evidence, however striking the chart.',
      ],
    },
  ],
};

const spShortCycles: KbArticle = {
  id: 'cycle-sp-short',
  title: 'The S&P short cycles — 11.65, 22 and 6.8 years',
  summary: 'Three claims, each re-measured as of the date it was made. One holds, one does not, one cannot be tested.',
  source: 'measured 2026-11-08',
  updated: TODAY,
  body: [
    { kind: 'heading', text: 'What the slides claim' },
    {
      kind: 'rules',
      items: [
        { rule: '11.65 years', detail: '28 April 2022 against 3 September 2010, over 230 trading days. Over ~400 days, reported at 96% correlated for almost two years.' },
        { rule: '22 years', detail: '2000 against 2022 over 260 trading days. In May 2022 the Fed raised by half a point for the first time in 22 years — so the reason repeated too, on the lecture’s reading.' },
        { rule: '6.8 years', detail: '13 April 2002 against 29 April 2022, 365 bars at 240 minutes — about three months of four-hour bars, at 80%. Intraday, which is the striking part.' },
      ],
    },
    { kind: 'heading', text: 'What the data says' },
    {
      kind: 'table',
      head: ['Claim', 'Window', 'Price', 'Swing', 'Worst epoch', 'Verdict'],
      rows: [
        ['11.65y, as of 2022-04-28', '400 days', '0.962', '0.585', '−0.68', 'reproduces'],
        ['11.65y, as of 2022-04-28', '230 days', '0.766', '0.511', '+0.10', 'reproduces'],
        ['22y, as of 2022-04-28', '260 days', '0.285', '0.101', '−0.54', 'does not'],
        ['6.8y, as of 2022-04-29', '365 days', '0.831', '−0.066', '−0.35', 'not a fair test'],
      ],
      caption: 'S&P 500 daily closes, anchored to the date each claim was made. The course quotes 96% for the first row.',
    },
    {
      kind: 'callout',
      tone: 'key',
      title: '11.65 years is the first claim here to survive its own test',
      text: 'Measured 0.962 against the quoted 96%. The analog window ends 2010-08-30 against the slide’s 3 September 2010 — days apart. Swing correlation near 0.6, roughly where the genuine planted cycle scored. An open search over 10–13 years lands on 11.6 by itself, so the named interval is also the local best.',
    },
    {
      kind: 'list',
      items: [
        '22 years does not reproduce: 0.285 at exactly 22.0, and searching 19–25 years finds its best fit at 23.4 years.',
        'The Federal Reserve detail is true and is not evidence — a coincidence of policy dates cannot be scored.',
        '6.8 years was claimed on four-hour bars and we hold only daily closes, so failing it on dailies proves nothing. Open, not refuted.',
      ],
    },
    { kind: 'heading', text: 'And then it was still wrong' },
    'The 11.65-year interval passed every gate, so it was the one cycle worth voting. Run the composite as of 28 April 2022 and compare it with what the index did:',
    {
      kind: 'table',
      head: ['Horizon from 2022-04-28', 'Forecast', 'Actual', 'Index'],
      rows: [
        ['1 month', '+7.2%', '−3.0%', '4288 → 4158'],
        ['3 months', '+10.5%', '−3.7%', '4288 → 4130'],
        ['6 months', '+19.4%', '−11.2%', '4288 → 3807'],
        ['12 months', '+12.2%', '−2.8%', '4288 → 4168'],
      ],
      caption: 'Wrong in direction at every horizon, and most wrong where it was most confident.',
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'Read this one twice',
      text: 'Pre-specified, above the swing floor, positive at earlier epochs, agreed with by an open search — and still wrong. That is what a 90% method looks like from inside the other 10%, and it is why the analog never gets to size the position or skip the stop.',
    },
    {
      kind: 'list',
      items: [
        'Same index, same quarter: the 60-year cycle’s June 2022 call described what followed; the better-scoring 11.65-year call did not.',
        'With only one cycle passing there was nothing to disagree with it. A second qualifying cycle might have reported chop.',
        'That is an argument for the composite, not for any single clock.',
      ],
    },
  ],
};

const electionCycle: KbArticle = {
  id: 'cycle-election',
  title: 'The four-year election cycle',
  summary: 'High near the election, low near the midterms, strength in the pre-election year — measured, not quoted.',
  source: 'measured 2026-11-08',
  updated: TODAY,
  body: [
    {
      kind: 'rules',
      items: [
        { rule: 'Year 1 — post-election', detail: '2025' },
        { rule: 'Year 2 — midterm', detail: '2026. Where the low belongs.' },
        { rule: 'Year 3 — pre-election', detail: '2027. The strong one, and the subject of the claim.' },
        { rule: 'Year 4 — election', detail: '2028. Usually near a high.' },
      ],
    },
    { kind: 'heading', text: 'The claim, and the correction' },
    {
      kind: 'list',
      items: [
        'Claim: over about a hundred years the third year is up roughly 94% of the time, with only two misses — given as 1931 and 2008.',
        '2008 was an election year, not a pre-election year, and the Dow fell roughly a third.',
        'The exceptions usually cited are 1931 and 2015. Our own data agrees with that, not with 2008.',
      ],
    },
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
      caption: 'cycles/election_cycle.py, calendar-year closes.',
    },
    {
      kind: 'list',
      items: [
        'Big indices read 85–88% against the 94% claimed — the shape survives, the specifics do not.',
        'Both S&P misses were flat rather than down: −0.0% and −0.7%. A year that finishes unchanged is a miss for the statistic and barely a warning for a trader.',
        'The 100% reading is the smallest sample in the table and the most impressive-looking number in it.',
      ],
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'Read the start dates',
      text: 'This is not the hundred years the claim is made over. Our S&P history begins in 1970 and the Dow’s in 1993, so 1931 cannot appear and the samples are 8 to 14 years rather than 25. Two data faults caused that, both fixed and not yet re-run. Expect these numbers to move.',
    },
    {
      kind: 'list',
      items: [
        'Roughly 25 pre-election years in a century, so one extra miss moves the rate by four points.',
        'The usual mechanism — policy leaning supportive before an election — is plausible and unprovable at this sample size.',
        'Use it as a tilt: which way to lean when other evidence agrees. It says nothing about any particular week.',
      ],
    },
  ],
};

const crudeCycles: KbArticle = {
  id: 'cycle-crude-17',
  title: 'Crude oil: the 17-year cycle',
  summary: '1997–2000 against 2014–2017 at 77% — and why a lower number can be better evidence.',
  updated: TODAY,
  body: [
    {
      kind: 'overlay',
      series: 'CL_F',
      label: 'Crude, the 17-year overlay',
      lagYears: 17,
    },
    {
      kind: 'rules',
      items: [
        { rule: 'Market', detail: 'WTI crude oil, daily closes.' },
        { rule: 'Window', detail: '650 trading days — about three and a half years.' },
        { rule: 'Offset', detail: '17 years. The 27-year interval agrees with it either side.' },
        { rule: 'Command', detail: 'find_cycles.py --symbol CL=F --preset crude --window 650' },
      ],
    },
    {
      kind: 'list',
      items: [
        'December 1997 to May 2000 against December 2014 to 15 May 2017.',
        'The last two and a half years of it are 77% correlated.',
        'The 17-year and 27-year cycles in crude agree with each other both before and after that moment.',
      ],
    },
    {
      kind: 'callout',
      tone: 'key',
      title: 'Why 77% beats the Dow’s 93%',
      text: 'Two stretches that both trend upward correlate for no reason. Two that fall hard, base, and turn up together have to agree about the turn — and a trend cannot fake a turn.',
    },
    { kind: 'heading', text: 'What it was worth in practice' },
    {
      kind: 'list',
      ordered: true,
      items: [
        'Through the 2014–16 collapse the analog said this is the part that goes down — so no catching the falling knife.',
        'When price broke the downtrend line, the analog said a turn belonged here.',
        'It also said what followed in 1999 was large and sustained, not a small bounce.',
        'Enough to cover a short, or start looking for a long, well before it was obvious.',
      ],
    },
    {
      kind: 'callout',
      tone: 'note',
      title: 'The division of labour',
      text: 'The analog did not generate the entry — the broken downtrend line did. The analog supplied the conviction to take a signal that would otherwise have looked like another bounce in a bear market.',
    },
  ],
};

const metonicCycle: KbArticle = {
  id: 'cycle-metonic-19',
  title: 'The 19-year Metonic cycle — crude oil and war',
  summary: 'Iraq 2003 and Ukraine 2022 lined up in crude, including the ten months before either began.',
  updated: TODAY,
  body: [
    {
      kind: 'overlay',
      series: 'CL_F',
      label: 'Crude, the 19-year overlay',
      lagYears: 19.08,
    },
    {
      kind: 'rules',
      items: [
        { rule: 'Market', detail: 'WTI crude oil, daily closes.' },
        { rule: 'Window', detail: '360 trading days — roughly 20 per month, about 18 months.' },
        { rule: 'Offset', detail: '19 years and 1 month — the Metonic interval.' },
        { rule: 'Command', detail: 'find_cycles.py --symbol CL=F --lag-years 19.08 --window 360' },
      ],
    },
    {
      kind: 'list',
      items: [
'The slide is dated 21 June 2022 and calls for higher prices until 25 August.',
'Green is the 2003 Gulf War pattern, red is 2022.',
        'Russia invaded Ukraine 24 February 2022; the US invaded Iraq in March 2003.',
        'For roughly ten months before each date crude traced the same path — then the initial spike, the pullback, the recovery, in both cases.',
      ],
    },
    {
      kind: 'callout',
      tone: 'key',
      title: 'The preparatory period is the forecasting value',
      text: 'The match before the event is what could have been traded. The spike on the day could not.',
    },
    { kind: 'heading', text: 'Three periods that get conflated' },
    {
      kind: 'rules',
      items: [
        { rule: 'Metonic — 19 years', detail: 'After Meton of Athens, c. 432 BC. 19 solar years ≈ 235 lunar months, so new and full moon dates repeat. This is the interval the course uses.' },
        { rule: 'Lunar nodal — 18.6 years', detail: 'Governs where eclipses can occur.' },
        { rule: 'Saros — 18.03 years', detail: 'After which a specific eclipse repeats.' },
      ],
    },
    { kind: 'heading', text: 'The Middle East chain — check the arithmetic' },
    {
      kind: 'list',
      items: [
        'The course extends 19 years to conflict: 1948, 1967, 1986–87, 2005, 2023–24.',
        'A strict chain from 1948 lands on 1967, 1986, 2005 and 2024 — close to October 2023 but not on it.',
        'The 1973 war does not sit on that chain at all, being six years off.',
        'A cycle that needs its dates adjusted is being fitted, not found.',
      ],
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'The 2033 convergence depends on which start date you pick',
      text: '2014 + 19 = 2033, which agrees with the long cycles — if the Ukraine conflict is dated from the annexation of Crimea. From the 2022 invasion it gives 2041. Choosing the date that makes cycles agree is the error this knowledge base exists to prevent.',
    },
  ],
};

const goldCycle: KbArticle = {
  id: 'cycle-gold-24',
  title: 'Gold: the 24.5-year cycle',
  summary: 'Seven years of gold against the same seven years 24.5 years earlier — the longest window in the course.',
  updated: TODAY,
  body: [
    {
      kind: 'overlay',
      series: 'GC_F',
      label: 'Gold, the 24.5-year overlay',
      lagYears: 24.5,
    },
    {
      kind: 'rules',
      items: [
        { rule: 'Market', detail: 'Gold, daily closes.' },
        { rule: 'Window', detail: '1,800 trading days — about seven years, the longest here.' },
        { rule: 'Offset', detail: '24.5 years. Not a round number and with no stated mechanism.' },
        { rule: 'Expect few epochs', detail: 'Gold history here starts in 2000, and a 24.5-year offset on a seven-year window needs ~32 years before even one epoch check is possible.' },
        { rule: 'Command', detail: 'find_cycles.py --symbol GC=F --lag-years 24.5 --window 1800 --epochs 4' },
      ],
    },
    {
      kind: 'list',
      items: [
        'Present market 1 May 2010 to 11 July 2017, against the same span 24.5 years earlier.',
        'The two hug each other for roughly seven years: up move, down move, up, down. Not perfect, high correlation.',
        'The practical claim: knowing gold’s general direction, you would have been out of it in 2011 and short afterwards.',
      ],
    },
    {
      kind: 'list',
      items: [
        'Window length is the reason to take it seriously — seven years of daily data is hard to match by accident.',
        '24.5 is not a round interval and has no stated mechanism, unlike the Metonic 19 or the recurring 60.',
        'It is presented as located in the data rather than derived, which makes the pre-specified re-test more important, not less.',
      ],
    },
  ],
};

const composite: KbArticle = {
  id: 'cycle-composite',
  title: 'Reading cycles together — the composite',
  summary: 'No single cycle is the forecast. Where the clocks agree, and what the course expects from 2027 and 2034.',
  updated: TODAY,
  body: [
    {
      kind: 'rules',
      items: [
        { rule: 'They agree up', detail: 'Most likely up. One cycle at 90% is a lean; two unrelated cycles agreeing is a position.' },
        { rule: 'They fight each other', detail: 'Usually nothing — chop, not a move. That is a usable answer, not a missing one.' },
        { rule: 'They all point down', detail: 'Usually a decent decline.' },
      ],
    },
    { kind: 'heading', text: 'The near-term composite, as the course reads it' },
    {
      kind: 'list',
      items: [
        '60-year clock: 2026 corresponds to 1966 — real damage, low in October, followed by an up 1967.',
        'Election clock: the midterm year is where the low belongs, the pre-election year is the strong one.',
        'Both point the same way into 2027. The course anticipates a year to eighteen months of upside.',
        'Explicitly not a straight line — a one- or two-month decline along the way would be normal.',
      ],
    },
    { kind: 'heading', text: 'The long-term composite' },
    {
      kind: 'list',
      items: [
        '2033–34: the 60-year clock reaches 1973–74 and the 314-year chain from 1720 lands.',
        'Expectation is a major top there, followed by a long decline rather than a crash-and-recover.',
        'Consistent with a ~28-year rhythm (JB Cycles, tied to 56 years) in which a five- to eight-year decline arrives; the last was 1966–1982.',
        'Both modern secular bears — 1929–42 and 1966–82 — have that shape: up, down a year or two, up again, no sustained advance for a decade.',
        'Margin and leverage excess is described as running ~22 years and not yet at its peak, perhaps eighteen months of room.',
      ],
    },
    { kind: 'heading', text: 'How it is computed' },
    {
      kind: 'rules',
      items: [
        { rule: 'composite.py --symbol ^GSPC --preset sp500', detail: 'Runs each named interval, projects each forward, takes a weighted vote at 1, 3, 6 and 12 months.' },
        { rule: 'Weighted by swing and worst epoch', detail: 'Never by price correlation — that would give the loudest vote to whichever coincidence scored highest.' },
        { rule: 'Disagreement cancels', detail: 'A split reports chop. That is the point of the rule, not a failure of the tool.' },
      ],
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'What it says today',
      text: 'On the S&P data loaded, not one named short cycle clears the swing and epoch floors at a 440-day window, so there is no composite to read. The 11.65-year interval does clear them at its own window — the window belongs to the cycle, not to the run. A composite built from intervals that have not individually passed is an average of coincidences.',
    },
    { kind: 'heading', text: 'What would void the near-term case' },
    {
      kind: 'list',
      items: [
        'The market taking out its October 2026 low decisively rather than turning up from it.',
        'The 60-year analog diverging on swing correlation when re-scored — not merely on price.',
        'The pre-election-year tilt failing to show in our own data.',
      ],
    },
    'All of the above is the course’s expectation, recorded as the hypothesis the desk trades against. Not a set of facts.',
  ],
};

const invertedCycles: KbArticle = {
  id: 'cycle-inverted-bonds',
  title: 'Multiples, and cycles that repeat upside down',
  summary: 'US 30-year bonds at 82 × 3 = 246 weeks, where a low lands on a high and every leg mirrors.',
  updated: TODAY,
  body: [
    {
      kind: 'overlay',
      series: 'ZB_F',
      label: 'US 30-year bonds — the 246-week interval',
      lagYears: 4.72,
      caption: 'Drawn inverted when the scan finds the match is an inverted one. 246 weeks is 4.72 years, which is how the interval is expressed on a daily series.',
    },
    {
      kind: 'rules',
      items: [
        { rule: 'Market', detail: 'US 30-year Treasury bond futures, weekly on the course chart.' },
        { rule: 'Base count', detail: '82 weeks — it appears twice on the chart, high to high.' },
        { rule: 'Working interval', detail: '82 × 3 = 246 weeks. Not a count on the chart; a multiple of one.' },
        { rule: 'Polarity', detail: 'Inverted. The highest high lines up with a major low.' },
        { rule: 'Command', detail: 'find_cycles.py --symbol ZB=F --preset bonds --allow-invert' },
        { rule: 'Scope', detail: 'Inversion is allowed on this market and no other — the scanner refuses the flag anywhere else.' },
      ],
    },
    { kind: 'heading', text: 'Two new ideas' },
    {
      kind: 'list',
      items: [
        'The interval you trade may be a MULTIPLE of a count, not a count. The chain gives 9, 21, 30, 51, 82 — and the one that works is 82 × 3.',
        'A cycle can repeat INVERTED. Here the high aligns with a low, so every rally maps to a decline and every decline to a rally.',
        'An inverted match is not a weaker match. The week counts still line up exactly; only the sign flips.',
        'Go back far enough and the inversion may resolve: six 82s would be high to high again. Half a cycle is still usable.',
      ],
    },
    { kind: 'heading', text: 'How the legs mirrored' },
    {
      kind: 'rules',
      items: [
        { rule: 'A → B', detail: 'A rally of N weeks out of the low maps to a decline of exactly N weeks from the high, 246 weeks later.' },
        { rule: 'B → C', detail: 'A decline maps to a rally, again to the week.' },
        { rule: 'C → D', detail: 'A rally maps to a decline — and that one came through as a crash.' },
      ],
    },
    {
      kind: 'callout',
      tone: 'key',
      title: 'The forecast is the leg count, not the move',
      text: 'Knowing C → D ran 26 or 27 weeks tells you how long the mirrored decline has to run, not how far. The rally it mirrored was small and the decline was a crash — you got more than the analog promised, which is the same lesson as the Bitcoin case: the dates are the forecast, the magnitude is not.',
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'What makes this one hard to trust',
      text: 'An inverted match doubles the number of patterns that can be called a fit, so it roughly doubles the chance of finding one by accident — and the random-walk baseline every other claim here is scored against was measured without it. That is why inversion is not a global setting: --allow-invert works on the 30-year bond series and the scanner refuses it on anything else, so one market spends the extra freedom and the rest keep a baseline that still applies. Until the noise bar is re-measured for inverted matching, assume it is higher here than the table says.',
    },
  ],
};

/**
 * The one lecture that can be scored.
 *
 * Almost every claim in this course is shown on a chart that already
 * happened. This one is not: the slide's own quote line dates the recording,
 * and it ends with a forecast. Four years of data have arrived since.
 */
const bondBacktest: KbArticle = {
  id: 'bond-216-backtest',
  title: 'Scoring the bond lecture, four years on',
  summary: 'The 216-week chain, the 246-week mirror and the six-month call, each tested against what happened.',
  source: 'Backtest: cycles/backtest_interval.py against ZB=F weekly',
  updated: TODAY,
  body: [
    {
      kind: 'callout',
      tone: 'key',
      title: 'The lecture was recorded on 18 November 2022',
      text: 'Not a guess. The slide leaves its quote line visible — O=125 29/32, Hi=126 12/32, Lo=125 9/32 — and exactly one bar in the bond record carries those three numbers. That fixes the date and makes everything said after it a forecast with four years of out-of-sample data behind it.',
    },
    { kind: 'heading', text: 'The call itself: right' },
    {
      kind: 'rules',
      items: [
        { rule: '"We are basically at a low"', detail: 'Correct. The swing low was 117.59 on 24 October 2022, four weeks before he spoke.' },
        { rule: '"It should go up for about six months"', detail: 'Broadly correct. Bonds ran from 125.44 to 134.44 by 3 April 2023 — +7.2% over 4.6 months — and were still +1.4% at the six-month mark.' },
        { rule: '"The market\u2019s about to go down hard again"', detail: 'Correct, and hard: from that April peak to roughly 105 by October 2023. Four years on the contract is \u221213.5%, having set a new low at 101.16 on 5 October 2026.' },
      ],
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'One call is one call',
      text: 'A direction, a rough duration and a sequel, all of them right, on a single trade. That is worth noting and it is not evidence of a method. What follows is the evidence he offered for it, which is testable at a sample size above one.',
    },
    { kind: 'heading', text: 'The 216-week chain: real on his chart, and it broke' },
    {
      kind: 'list',
      items: [
        'On the chart he had, pivot highs 216 weeks apart run six deep: 2001-01-01, 2005-02-07, 2009-03-16, 2013-04-29, 2017-06-19, 2021-07-19. Every link inside \u00b14 weeks. It is a striking picture and it is really there.',
        'It is there at one pivot definition. Swept across fifteen pivot strengths, the chain is six long at strengths 5 and 7 and collapses to one to three everywhere else. That is a result selected by how hard you squint.',
        'The out-of-sample term was due the week of 8 September 2025. The nearest pivot high came on 20 October 2025 \u2014 six weeks late, outside the \u00b14 every earlier link held to. The chain did not continue.',
        'The claim that each decline is bigger than the last does not hold either: the 216-week highs gave \u221221.0%, \u221227.8%, \u221220.5%. Up, then down.',
      ],
    },
    {
      kind: 'table',
      caption: 'The control holds the real pivots fixed \u2014 same count, same types, same distribution of gaps \u2014 and shuffles only their order, so anything left is alignment.',
      head: ['Test', 'Longest run', 'Random reaches it'],
      rows: [
        ['216w highs, his chart, strength 7', '6', '3% of runs'],
        ['\u2026 corrected for the 15 strengths tried', '6', '\u224836%'],
        ['216w highs, full series, strength 7', '6', '12.3%'],
        ['216w highs, full series, strength 13', '3', '58.7%'],
      ],
    },
    { kind: 'heading', text: 'The 246-week mirror: one good pair, no edge' },
    {
      kind: 'list',
      items: [
        'The specific pair holds. 246 weeks before the lecture is late February 2018, and the chart carries a pivot high there against the low he was pointing at. The mirror he described is in the data.',
        'Across the whole series it is a coin flip with a lean. Of all pivot pairs 246 weeks apart, 56\u201367% are mirrored depending on pivot strength, against the 50% you get for nothing.',
        'The daily scan agrees. Pre-specified at 1.57, 3.14 and 4.72 years, swing correlation reads 0.11 to 0.24 \u2014 well under the 0.449 a random walk scores on the same measure.',
      ],
    },
    {
      kind: 'callout',
      tone: 'key',
      title: 'What this case is actually worth',
      text: 'He made a good call and the reasoning he gave for it does not survive a control. Those are two separate findings and neither cancels the other. The useful lesson is the one the rest of this page keeps arriving at from other directions: a chain of six intervals that looks undeniable on the chart is the kind of thing shuffled pivots produce often enough that you cannot tell them apart \u2014 and the way you find out is to write down the next date and wait, which is exactly what the 8 September 2025 term did for us.',
    },
    {
      kind: 'rules',
      items: [
        { rule: 'Reproduce it', detail: 'python3 cycles/backtest_interval.py --interval 216 --type high --strength 7 --until 2022-11-18' },
        { rule: 'And out of sample', detail: 'python3 cycles/backtest_interval.py --interval 216 --type high --strength 7 --as-of 2022-11-18' },
      ],
    },
  ],
};

/**
 * The step between finding a series and having a cycle.
 *
 * Kept separate from the two bond articles in the catalogue: they are the
 * worked example and its score, this is the rule they are examples of.
 */
const multiplesRule: KbArticle = {
  id: 'multiples-rule',
  title: 'The series is the middle of the work, not the end',
  summary: 'Counting pivots gives you numbers. Multiples of the numbers over 50 are where a cycle length comes from.',
  updated: TODAY,
  body: [
    'A summation chain is not a set of cycle lengths. It is a set of candidates to multiply.',
    {
      kind: 'rules',
      items: [
        { rule: 'Take the terms over 50', detail: 'Below that the interval is too short to repeat enough times to be worth measuring. Smaller terms stay in the chain; they just are not multiplied.' },
        { rule: 'Multiply each by 1, 2, 3, 4, 5', detail: 'The term itself counts as x1 \u2014 sometimes the count already is the cycle.' },
        { rule: 'Test each product as an interval', detail: 'Does it recur high to high, or low to low? That is the only question the multiple has to answer.' },
        { rule: 'Accept a half as well as a whole', detail: 'A product that lands a high on a low is half of the real cycle, so the real one is twice it. Polarity tells you which you have.' },
        { rule: 'Confirm by watching it repeat', detail: 'The multiple is a hypothesis until the chart has done it more than twice.' },
      ],
    },
    { kind: 'heading', text: 'Why a half cycle is still a cycle' },
    {
      kind: 'list',
      items: [
        'The 246-week bond interval is about 4.7 years. Double it and you get 9.3; double again and you get 18.6 \u2014 the lunar nodal period the course ties to the real-estate cycle.',
        'So one interval inverted and another upright can be the same cycle seen at two scales, and when both point the same way that is agreement rather than coincidence.',
        'The ratio of consecutive terms approaches the golden ratio as they grow: 216 \u00f7 134 is 1.612. You cannot see that at the start of a chain \u2014 4, 8, 12, 20 shows nothing \u2014 which is why the course works forward from counts rather than starting from a ratio.',
      ],
    },
    { kind: 'heading', text: 'Start big, then tighten' },
    {
      kind: 'list',
      tight: true,
      items: [
        'Monthly \u2014 whether the next five years go up or down.',
        'Weekly \u2014 where the method starts, and where the big picture is readable.',
        'Daily \u2014 the trading level: up thirteen days, down twelve.',
        'Hourly and below \u2014 swing and intraday, by which point a lot of cycle structure is already in hand.',
      ],
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'Multiplying is the widest search in this whole method',
      text: 'Four chain terms over the floor, times five, tested upright and mirrored, is forty hypotheses \u2014 against a noise bar measured for one. The indicator prints the candidate count beside whatever it finds for exactly this reason, and colours the row as a lead rather than a finding. What that costs is measured on a real case in \u201cScoring the bond lecture, four years on\u201d.',
    },
    {
      kind: 'callout',
      tone: 'note',
      title: 'The indicator does not reproduce the lecture\u2019s own series',
      text: 'Run on the same weekly bond chart truncated to the day of the lecture, the mechanical chain reads 43, 91, 136, 227, 363, 591 \u2014 not 82, 134, 216. The 134 turns up at most pivot settings and 82 at none of the eight tried. A hand-marked chart and a pivot rule do not pick the same swings, and the gap has been left visible rather than tuned away: fitting the pivot settings until a published answer falls out is how you end up measuring your own assumptions.',
    },
  ],
};

// ── Using a forecast ──

const rulesOfAnalysis: KbArticle = {
  id: 'rules-of-analysis',
  title: 'The rules, in order',
  summary: 'The whole method as ten rules.',
  source: 'Distilled from the course; the long form is cycles/METHOD.md',
  updated: TODAY,
  body: [
    { kind: 'heading', text: 'Finding a cycle' },
    {
      kind: 'rules',
      items: [
        { rule: 'R1 — A window must be long enough to be hard to fit', detail: 'Five months will match something by accident. Twenty-two months containing a sequence of highs and lows is a real test. The course uses eleven months to seven years.' },
        { rule: 'R2 — A match that turns beats a match that trends', detail: 'Two rising stretches correlate for no reason. Two that fall, base and turn together have to agree about the turn.' },
        { rule: 'R3 — The repeat must be non-reflexive', detail: 'Nobody trades off 1962. A pattern that could be produced by people watching the same chart is not evidence of a cycle.' },
        { rule: 'R7 — Pre-specify the interval', detail: 'Testing one the course names is a single hypothesis. The best of twelve thousand searched offsets is not.' },
      ],
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'R9 — the scoring order, most often got backwards',
      text: 'Worst epoch first, then swing correlation, then daily returns, and price correlation last. The headline number on every slide is the least informative of the four: a random walk scores 0.947 on it.',
    },
    { kind: 'heading', text: 'Reading one' },
    {
      kind: 'rules',
      items: [
        { rule: 'R4 — Direction and swing, not day by day', detail: 'What repeats is the general direction and shape. Any use needing an exact day or level is misusing it.' },
        { rule: 'R5 — The composite is the forecast', detail: 'Not any single cycle. Agreement stacks the odds; disagreement forecasts chop; all pointing down forecasts a decline.' },
        { rule: 'R6 — Long cycle for bias, short cycle for timing', detail: 'The 60-year clock says which side to work for a year. A four-year or eleven-month cycle says whether the next three months are up.' },
      ],
    },
    { kind: 'heading', text: 'Trading one' },
    {
      kind: 'rules',
      items: [
        { rule: 'R8 — The analog gives conviction, not entries', detail: 'The trade is still taken on a level, a reaction and a stop. The roadmap buys the nerve to act on a valid trigger before it is obvious.' },
        { rule: 'R10 — Know what would void it, before entering', detail: '“The 60-year analog says up into 2027” is not tradeable. “Long while the October low holds, void below it” is.' },
      ],
    },
    {
      kind: 'callout',
      tone: 'note',
      title: 'And one that is not a rule',
      text: 'The lectures argue the driver is not human — nobody is looking at 1962, so the surface reason given for a move is a story attached afterwards. That is the course’s position on why cycles exist. Nothing here depends on it: the scanner measures whether a pattern repeats, not why.',
    },
  ],
};

const usingForecasts: KbArticle = {
  id: 'using-a-cycle-forecast',
  title: 'What a forecast can and cannot do',
  summary: 'What a roadmap can and cannot tell you, and the traps — statistical and emotional.',
  source: 'the control runs in cycles/README.md',
  updated: TODAY,
  body: [
    { kind: 'heading', text: 'What it is' },
    {
      kind: 'list',
      items: [
        'A roadmap of direction and timing windows. Not a price, not a date, not a prediction.',
        'It changes the bias, not the entry — the cycle decides which side to work, the checklist decides whether there is a trade today.',
        'Never trade one without a stop. Ninety percent accurate means it fails one time in ten, and those are the years everyone remembers.',
        'Separate being right about price from being right about timing. A target with no date is not a plan.',
      ],
    },
    { kind: 'heading', text: 'The statistical traps' },
    { kind: 'demo', id: 'noise' },
    {
      kind: 'list',
      items: [
        'Price correlation is nearly worthless alone — the demo above makes one near 0.9 out of random numbers, on command.',
        'Ranking is no better: that false match also lands in the top 0.01% of twelve thousand offsets, because that is what a search over twelve thousand hypotheses does.',
        'Gate on swing correlation and worst epoch. In the controls they read 0.875 and +0.79 for a real cycle against 0.449 and −0.01 for noise.',
        'Pre-specify. Naming the interval in advance removed the false positive entirely.',
        'Distrust hindsight alignment — a forecast that existed before the outcome is worth more than a match found after it.',
      ],
    },
    'The first run against real markets said the same thing. An open search over seven markets:',
    {
      kind: 'table',
      head: ['Market', 'Best offset', 'Price', 'Swing', 'Worst epoch'],
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
      caption: '440-day window, from cycles/REPORT.md. The last row has no cycle in it and beats five of the real markets.',
    },
    {
      kind: 'callout',
      tone: 'key',
      title: 'Searching finds a cycle whether or not there is one',
      text: 'Seven real markets produced 0.81 to 0.96 on price; the random walk scored 0.947. On the measures that can tell the difference, the real markets did no better. This does not disprove the named cycles — it means an open search cannot establish them.',
    },
    { kind: 'heading', text: 'Before entering' },
    {
      kind: 'list',
      ordered: true,
      items: [
        'Check the cycle was named in advance, not found by searching.',
        'Check the swing correlation and the worst epoch, not the headline number.',
        'Wait for the chart to give a level, a reaction and a closed-candle confirmation.',
        'Set the stop and target first. Size for the roadmap being void.',
        'Write down what would prove it wrong, and log the forecast with its date.',
      ],
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'The worked example of all of this failing',
      text: 'In “The S&P short cycles” above: the best-scoring interval on the board, pre-specified and tested as of the day the claim was made, called a rally into late 2022 while the index fell 11%.',
    },
    { kind: 'heading', text: 'The emotional failure mode' },
    {
      kind: 'list',
      items: [
        'Newton made a fortune in the 1720 bubble, took profits, watched it climb, bought back near the top and was destroyed.',
        'Druckenmiller did the same in 1999–2000: out with the gains, back in as the melt-up continued, caught at the top.',
        'A roadmap only helps if it is followed when the tape feels wrong — and abandoned when its stated invalidation trips, not when it merely becomes uncomfortable.',
      ],
    },
    {
      kind: 'callout',
      tone: 'note',
      title: 'A cycle belongs to a market',
      text: '60 and 78.5 years are equity clocks, 17 and 19 are crude’s, 24.5 is gold’s. Do not carry an interval across markets because the number is familiar — test it where you intend to trade it.',
    },
  ],
};

// ── Glossary ──

const cycleGlossary: KbArticle = {
  id: 'glossary-cycles',
  title: 'Cycle terms',
  summary: 'The vocabulary used across these pages.',
  updated: TODAY,
  body: [
    {
      kind: 'rules',
      items: [
        { rule: 'Analog', detail: 'The stretch of past history the present is compared with. The grey line on the slides.' },
        { rule: 'Lag, or offset', detail: 'How far back the analog sits. A 60-year cycle is a lag of about 15,120 trading days.' },
        { rule: 'Window', detail: 'How much history is compared at once. The Dow slide used ~440 trading days, roughly 22 months.' },
        { rule: 'CS / CE', detail: 'Cycle start and cycle end, the markers at the edges of the course’s charts.' },
        { rule: 'Interval of repetition', detail: 'The distance between a pattern and its repeat. Locating it is what the Slide Technique does.' },
        { rule: 'corr — price correlation', detail: 'Pearson on closing prices. The number quoted on the slides. Unaffected by the 0–100 rescaling. Weak evidence alone.' },
        { rule: 'swingCorr', detail: 'Correlation of monthly (21-bar) returns. Whether the two paths move together swing by swing. The score to gate on.' },
        { rule: 'retCorr', detail: 'The same on daily returns. Stricter than the claim; useful as a floor.' },
        { rule: 'Epoch stability', detail: 'Re-scoring the same lag at earlier anchor points. Reported as heldMean and heldMin.' },
        { rule: 'Pre-specified vs searched', detail: 'Whether the interval was named in advance or found by scanning thousands of offsets. The first is strong evidence, the second nearly none.' },
        { rule: 'Composite', detail: 'Several cycles read together. The forecast is where independent clocks agree.' },
        { rule: 'Harmonic', detail: 'A cycle that is a simple fraction or multiple of another: 78.5 is half of 157, which is half of 314.' },
        { rule: 'Metonic cycle', detail: '19 years, after Meton of Athens (c. 432 BC). 19 solar years ≈ 235 lunar months, so moon phases repeat on the same dates.' },
        { rule: 'Lunar nodal / Saros', detail: '18.6 years (where eclipses can occur) and 18.03 years (when one repeats). Often folded into “the eclipse cycle” with the Metonic 19 — three different periods.' },
        { rule: 'Preparatory period', detail: 'The stretch before an event in which the analog already matches. In crude, the ten months before both wars.' },
        { rule: 'Secular bear', detail: 'A decade-scale period with no sustained advance — 1929–42, 1966–82 — as distinct from a single sharp decline.' },
      ],
    },
  ],
};

/**
 * The chapters, in reading order. The page renders them as one continuous
 * document, so this array is the order of the story: the premise, the fork
 * in method, how we search, what the search found, the rules that came out
 * of it, how to use them, and then reference.
 */
export const categories: KbCategory[] = [
  {
    id: 'course',
    title: 'Market Forecast Mastery',
    description: 'the law of periodicity, and where the knowledge comes from — Gann, Baumring, Reminick.',
    articles: [premise],
  },
  {
    id: 'approaches',
    title: 'Wave mechanics',
    description: 'decomposition, the approach we are not using — what it costs, and why the course defers it.',
    articles: [waveMechanics],
  },
  {
    id: 'cycles',
    title: 'Locating cycles',
    description: 'searching every offset for the one today’s market rhymes with, and the controls that say which scores to believe.',
    articles: [cycleScanner, multiplesRule],
  },
  {
    id: 'catalogue',
    title: 'The cycle catalogue',
    description: 'equities, crude and gold — the evidence for each cycle the course works with, and where each points.',
    articles: [sixtyYear, seventyEightYear, spShortCycles, electionCycle, crudeCycles, metonicCycle, goldCycle, invertedCycles, bondBacktest, composite],
  },
  {
    id: 'using',
    title: 'Using a forecast',
    description: 'the rules, the traps, and the checklist before entering.',
    articles: [rulesOfAnalysis, usingForecasts],
  },
  {
    id: 'glossary',
    title: 'Glossary',
    description: 'plain definitions for every cycle term used across these pages.',
    articles: [cycleGlossary],
  },
  {
    id: 'slide',
    title: 'The Slide Technique',
    description: 'forecasting by locating the intervals of repetition: sliding past data forward to find where history lines up with the present.',
    articles: [],
  },
  {
    id: 'momentum',
    title: 'Momentum Balance',
    description: 'reading when a move is more likely to continue, and projecting price targets for it.',
    articles: [],
  },
  {
    id: 'risk',
    title: 'Risk & position sizing',
    description: 'stops, targets, R:R, costs per contract and how much of the account a single trade is allowed to risk.',
    articles: [],
  },
  {
    id: 'market',
    title: 'Market structure & sessions',
    description: 'contract specs, roll dates, cash and overnight sessions, the economic calendar, and the hours the method is meant to be traded in.',
    articles: [],
  },
  {
    id: 'review',
    title: 'Forecast journal & review',
    description: 'recording a forecast on the day it is made, scoring it once the window has passed, and the review that turns a run of calls into a measured hit rate.',
    articles: [],
  },
];

export const articleCount = categories.reduce((n, c) => n + c.articles.length, 0);

/** The chapter an article sits in. */
export function categoryOf(articleId: string): KbCategory | undefined {
  return categories.find(c => c.articles.some(a => a.id === articleId));
}
