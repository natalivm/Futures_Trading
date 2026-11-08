# Summation Series Cycle Finder

`summation_series.pine` implements the Summation Series technique for locating
cycles, from Market Forecast Mastery (Allen Reminick). It is not his code.

Open the Pine editor, clear it, paste the whole file, Save, Add to chart.
**Use it on a weekly chart first** — that is where the course starts.

## The method it automates

**Counting convention:** a label is the **span**, counted inclusively — the
first candle back is already one — so a pivot six bars before the anchor is
labelled 7. This matters: run the chain search on the course's published gold
labels (6, 12, 16, 23, 30, 40, 52, 61, 66, 83, 103, 104, 132) and it returns
6, 23, 30, 52, 83, 132, which is the series the course names. Shift them all
down by one, as gap-counting would, and the chain degrades to five terms that
match nothing published. The labels in the course are spans.

1. **Pick the zero point.** An important high or low: either a recent one
   20 to 70 bars back — a *high* if the market has fallen since, a *low* if it
   has risen — or simply the highest high / lowest low, which is how the course
   anchors the Bitcoin chart. "Not that near, but not that far either, and
   obviously important." Label it 0.
2. **Count backwards.** Walk back from the zero point and label every pivot
   with its distance in bars. The numbers get large — 130, 180, 192 — and that
   is fine, the course says the bigger the better.
3. **Find a summation series in those numbers — skipping freely.** A chain where each term is
   the sum of the two before it: 3, 4, 7, 11, 18, 29, 47, 76. It may use any
   *subset* of the pivots; skipping most of them is expected. Fibonacci is one
   such series and the course's point is that it is not the only one.
4. **Read the candidates off the chain.** Of the pivots in the chain, the ones
   whose *type matches the zero point* — high against a high anchor, low
   against a low — are the cycle candidates. That is what connects the past to
   the present: a chain of growth terms landing on the same kind of turn.
5. **Confirm by shape, not by the number.** A candidate is only a cycle if the
   same thing happened *into* it and *out of* it as at the zero point. In the
   gold example: a sharp rally in, then a 17-week stair-step decline out — at
   the zero point, at 83 and at 135. The indicator correlates both windows and
   confirms above a threshold.
6. **Act on agreement, not on one cycle.** Two confirmed cycles that also agree
   about what comes next is the evidence. In the gold example both said five to
   six weeks up, worth roughly $200 — a trade with a stop under the nearby low.
   Two that disagree is no signal at all.
7. **Agreement is a schedule, not a verdict.** Cycles drift in and out of sync.
   Where they say the same thing you can act; where they diverge you stand
   aside; when they agree again you act again. The course takes *three*
   separate trades out of the same pair that way, re-entering each time the two
   paths re-converge.

**This is a time-only technique.** No volume, no magnitude. Asked whether the
size of the move can be derived, the answer is that it needs other tools —
and the Bitcoin case makes the point: the analog's rally was huge and the
repeat was small, but the *dates* were right. "Even if you don't have the
magnitude right, you have the dates right."

What a window tells you is **direction and a minimum duration**, never the
size. In the course's third trade one analog ran three weeks and the other
six; you could not know which. So take the three you are given and trail a
stop under the low in case it turns into six.

> "The summation series is a growth process that connects the past through a
> sequence of collapsing points to the present."

> "It can't be just any high. Because they're in the series, they're connected
> to each other. They're part of the same growth process."

On tolerance, the course is explicit: being off by one and then back in sync
is fine; what you must not allow is an error that **compounds**. The chain
search follows that — each new term is predicted from the two *actual* pivot
counts before it, never from the predicted value, so drift cannot accumulate.

## What it draws

- **0** in yellow on the anchor, every other pivot labelled with its count.
- Chain members in aqua, everything else dimmed — the circling step, done for you.
- Confirmed cycles marked in lime, each joined to the anchor by a dotted line.
- A consensus label when two or more confirmed cycles agree on the next move.
- Dashed forward lines where the chain's own step projects the next turns.
- A table: pivots counted, the chain, the candidates, which ones confirmed and
  at what score, the vote over the agreement horizon, the most repeated
  same-type interval, the classic-series hits, and the noise bar.

## Settings worth knowing

| Setting | Why it matters |
| --- | --- |
| **Pivot strength** | The single biggest lever, for reach as well as quality. Higher = fewer, more important pivots, which is what "primary pivot" means, and fewer pivots means each one kept reaches further back. Low values find a chain in noise and run out of history early. |
| **Pivots to keep** | How far back the count reaches. The most recent N are kept and older ones dropped, so if the numbers stop too early raise this — the course labels out past 130, 180, sometimes a couple of hundred. Default 80, up to 150. The chain search grows with the square of it. |
| **Tolerance** | How far a pivot may sit from the exact sum. The larger of *n* bars or *x* %, so small terms get the bar allowance and large ones the percentage. |
| **Shortest chain** | 3 is one addition and happens constantly by chance. 4–5 is where it starts to mean something. |

## Multiples, and cycles that repeat upside down

Two mechanisms from the US 30-year bond chart. Both live in the Python
scanner (`cycles/find_cycles.py`); **neither is in the indicator**, which
counts pivots and chains them and says nothing about polarity or
multiples.

**The interval may be a multiple of a count.** The bond chain gives 9, 21, 30,
51, 82 — and the one that works is **82 × 3 = 246 weeks**, which never appears
as a label. `--preset bonds` carries 82 and 246 weeks as 1.57 and 4.72 years.

This one *is* in the indicator now, as the **Multiple cycle** row: every chain
term above `multFloor` (50 — below that an interval is too short to repeat
enough times to measure) times one to five, each product tested as a recurring
high-to-high or low-to-low interval and again mirrored, since a product that
lands a high on a low is half of the real cycle. The winning grid is drawn on
the chart, back and two terms forward. **Moves after each** reports what
followed every hit, because the lecture's claim is not only that the highs
recur but that each decline is bigger than the last.

> The row always carries its candidate count — `(of 36 tried)` — and is never
> coloured as a finding. Four terms over the floor times five tested two ways
> is forty hypotheses against a noise bar measured for one, which is a wider
> search than the chain itself and has no control. Read it as a lead.
>
> It also does not reproduce the lecture's own 82 / 134 / 216 on the same
> chart: truncated to the day of the lecture the mechanical chain reads 43,
> 91, 136, 227, 363, 591, and 82 appears at none of the eight pivot settings
> tried. That gap is left visible rather than tuned away.

**A cycle can repeat inverted.** On that chart the highest high lines up with
a major low, so every rally maps to a decline and every decline to a rally —
and the week counts still match exactly, leg for leg: A→B a rally of N weeks
mirrors a decline of N weeks, B→C a decline mirrors a rally, C→D a rally
mirrors what became a crash. `--allow-invert` scores the magnitude of the
correlation and records the polarity; the overlay then draws the analog
flipped and tags it.

What it forecasts is still the **leg length, not the move**. C→D ran 26 or 27
weeks, so the mirrored decline had that long to run — the rally it mirrored
was small and the decline was a crash.

> An inverted match roughly doubles the number of patterns that can be called
> a fit, so it roughly doubles the chance of finding one by accident — and
> the random-walk baseline is the one measured without it. So inversion is
> **not a global setting**: `--allow-invert` is limited to the 30-year bond
> series (`INVERT_MARKETS` in `find_cycles.py`) and the scanner refuses the
> flag on any other symbol and on `--all`. One market spends the extra
> freedom; the rest keep a baseline that still applies. The noise bar has
> **not** been re-measured for inverted matching; assume the real bar is
> higher than the table says until it has been.

## Which chain wins: exactness, not length

The class offered 0, 3, 7, 10, 16, 26, 42 and was corrected: *"your intention
was to include everything, but if you leave out the three, the thing works
perfectly."* The answer was **7, 9, 16, 25, 41, 66, 107, 173** — every sum
exact, and the 3 simply dropped.

That rules out ranking by length. Searching those counts, the longest chain
*includes* the 3 and runs nine terms with one bar of error; the course prefers
the eight-term chain with none.

The rule implemented: take the longest chain, **allow one term shorter**, and
among those prefer the lowest mean error per link.

| slack allowed | Bitcoin | gold |
| --- | --- | --- |
| 0 terms | 9 terms incl. the 3 ✗ | 6, 23, 30, 52, 83, 132 ✓ |
| **1 term** | **7, 9, 16, 25, 41, 66, 107, 173 ✓** | **6, 23, 30, 52, 83, 132 ✓** |
| 2 terms | ✓ | 6, 16, 23, 40 ✗ |

One term is the only value that reproduces both published answers. The table
shows the chain's fit — "(exact)" or "(±n)" — so a chain bought with slack is
visibly not the same thing as one that sums cleanly.

## Projected turn dates

The method does not only call direction, it calls **dates**. On the gold chart
the course names a high on 10 March 2023 and lows on 7 July and 6 October,
each one because *both* cycles put a turn there.

That is now computed. A projected turn is a pivot in an analog's own future,
carried forward onto today's timeline; where two analogs land the same kind of
turn within a couple of bars, the chart marks the date with a dotted line and
a label — red for a projected high, lime for a low.

Run on real gold from July 2022 with the two cycles that confirmed by shape,
the clustering produces three agreed dates, and one of them is **2023-03-10** —
the date the course calls. Worth stating what that does and does not show: the
mechanism finds the date, but labels it a low where the course has a high,
because this run's pair is 83 and 400 rather than 83 and 135 and the pivots
are close-based. The date agreement is real; the direction agreement is not.

Future dates are extrapolated from the last bar's spacing, so on a weekly
chart a label can sit a few days off a real session.

## The "Projection step" row lands at chance

The panel's one forward-looking number projects turn dates. It does not work,
and the measurement is in `cycles/backtest_projection.py`.

Two readings of how to project were in the code and its comment at the same
time. The comment claimed the chain was **mirrored** around the anchor —
turns at anchor + 11, +27, +38, +64 — while the code repeated a **constant**
step, the widest gap in the chain. Both were scored, walking forward so
nothing is fitted on data it then predicts.

The control has to be matched on **tolerance**, and that is the whole story.
A hit allows 2% of the offset, so a 427-bar projection gets a ±8-bar window
while an 11-bar one gets ±1. With a strength-5 pivot every nine bars the wide
window catches something almost regardless — which is how the constant step
first measured **89%** and looked superb. Against random future bars judged
at the same tolerance, chance is 90%.

Pooled over four indices and four definitions of what counts as a turn:

| projection | hit rate | chance, same tolerances | edge | n |
|---|---|---|---|---|
| constant step | 55.9% | 56.4% | **−0.5 pts** | 9,940 |
| mirrored chain | 36.5% | 36.9% | **−0.4 pts** | 20,672 |

Sixteen cells, edges scattering from −3.9 to +3.1 with no pattern by symbol or
by how major a turn has to be. One intermediate result looked promising — ES
at +8.1 points against major turns — and it was an artifact of using a single
random draw per projection as the control; at 25 draws the same cell reads
+3.1 and its neighbours go negative.

So the row still prints its number and draws its dashed lines, because a date
to watch costs nothing, but it is printed in plain grey rather than the
projection colour and carries **`· lands at chance`**. The comment that
claimed a mirror has been corrected to describe what the code does, and why
the series cannot in fact be continued forward: the gaps contract into the
anchor (166, 97, 64, 36, 26, 11, 16, 11) and the recursion collapses one step
past it.

Note what this does **not** touch: the confirm-level and chain machinery above
are scored separately, and the agreement ribbon below projects dates by a
different mechanism — analog pivots carried forward — which is not what was
measured here.

## The agreement ribbon

The forward band is the part to read. Walking the two confirmed cycles forward
week by week on real gold from July 2022:

```
week 1 → 26   ▲ · · · · · · · · · · · · ▼ ▼ · · · · · ▼ ▲ ▲ · · ·
              ▲ agree up    ▼ agree down    · disagree, stand aside
```

Agree, then twelve weeks of divergence where there is nothing to do, then
agreement again, twice more. That shape *is* the method — the gaps are as
much the output as the bands.

## Run end to end on real gold weekly data

The strongest check available: take actual gold weekly closes, anchor on the
last pivot high before August 2022 — where the course anchors — and run every
step without looking at the answer.

```
anchor           2022-03-11  high @ 1985
counts back      6, 17, 25, 27, 31, 38, 41, 53, 62, 67, 70, 76, 83, 92, 95, 103, 118, …
longest chain    6, 76, 83, 159, 244, 400, 641, 1043
same-type (high) 83, 159, 400, 641

 cycle   corr in  corr out   score    next 6 weeks
    83      0.87      0.74    0.74          −3.7%
   159      0.69      0.04    0.04          +8.3%
   400      0.71      0.91    0.71          +3.5%
   641      0.86      0.48    0.48          +6.7%
```

**It finds 83 — the course's own number — from raw data.** And 83 scores
highest on shape: 0.87 going in, 0.74 coming out, which is exactly the
argument made in the lecture (sharp rally into the high, stair-step 17-week
decline out of it, at both points).

Two things the gates then do, which matter more than the hit:

- **159 is rejected.** It is in the chain and it is a high, but its
  out-shape correlates 0.04 with the anchor's. A chain member is not a cycle.
- **No signal is produced.** The two that confirm, 83 and 400, point opposite
  ways over the next six weeks — −3.7% against +3.5%. The course's rule is
  that one cycle might get you in and two agreeing is the evidence; two
  disagreeing is not a weak signal, it is no signal.

The course pairs 83 with 135. This run offers 159 instead, and rejects it —
pivot detection here is close-based on resampled weekly bars rather than
COMEX highs and lows, and the anchor is March rather than April. Close enough
to say the method reproduces; not close enough to claim the same two cycles.

## What a chain is worth — measured, not assumed

The search was run against the course's own gold weekly counts
(6, 12, 16, 23, 30, 40, 52, 61, 66, 83, 103, 104, 132) and against random
pivot sets of the same size, 600–2000 trials a cell.

**On the slide's numbers it finds 6, 16, 23, 40, 61, 103** — a six-term chain
(6+16≈23, 16+23≈40, 23+40≈61, 40+61≈103). The method reproduces.

But random numbers produce chains too, and that is the number to know:

| pivots counted | exact | 1 bar / 2% | 2 bars / 4% | 3 bars / 6% |
| --- | --- | --- | --- | --- |
| 12 | 3 | 4 | 5 | 5 |
| 20 | 4 | 5 | 6 | 6 |
| 30 | 4 | 6 | 7 | 7 |
| 40 | 4 | 7 | 8 | 8 |
| 60 | 5 | 7 | 8 | 9 |
| 80 | 5 | 8 | 9 | 10 |
| 110 | 5 | 9 | 10 | 10 |
| 150 | 5 | 9 | 10 | 11 |

*The longest chain random pivot counts reach 95% of the time.* Anything at or
below that line is what noise produces.

Three things follow, and they set the defaults:

- **Tolerance is the whole ball game.** At exact matching the slide's own
  chain is only 3 terms — the gold example needs slack to exist at all. At
  1 bar / 2% it is 6, and random data reached 6 in **0 of 2000** trials. At
  3 bars / 6% random reaches 6 five percent of the time and the result stops
  meaning anything. Default: **1 bar / 2%**.
- **A four-term chain is noise.** It is the *average* for random counts at
  moderate tolerance. Default minimum: **5**, and even that is weak above 20
  pivots.
- **More pivots make longer chains easier.** Forty pivots at loose tolerance
  reach 8 by chance. Keeping the pivot count down is not just about a tidy
  chart.

The indicator reports this itself: the **Noise bar** row compares the chain it
found against the random baseline for your pivot count and tolerance, and says
plainly whether it clears it.

### A worked reading

A live Bitcoin daily chart, 73 pivots at the defaults, reported:

```
Chain               18, 62, 82, 145, 227, 368, 595     (7 terms)
Cycle candidates    18, 62, 368  (highs)
Confirmed by shape  none
Agreement now       needs two confirmed cycles
Noise bar           7 vs 8  — random reaches this
```

Seven terms looks like a result and is not one: random pivots of that count
reach eight. Nothing then confirmed by shape, so there were no cycles and no
agreement to read. That is the tool answering honestly, and the correct
response is to change the inputs rather than the conclusion — raise the pivot
strength so the pivots that remain are the important ones, or move to a
weekly chart, which is where the course starts and where 73 daily pivots
become perhaps a dozen weekly ones.

## Before trusting a chain

- Check the Noise bar row first. If the chain does not clear it, stop.
- Tighten the tolerance and see whether it survives.
- Raise the pivot strength and see whether the same numbers come back.
- Check the cycle candidates are the anchor's own type, not a mix.
- Move the anchor one pivot and see whether the chain changes completely. A
  real interval should not depend on which of two adjacent pivots you picked.

`cycles/METHOD.md` R7 applies here as much as anywhere: a chain you went
looking for is weaker evidence than an interval you named in advance and then
confirmed.

## Status

Compiles on TradingView. The first run threw `RE10045` — `array.get()` index 0
on an array of size 0 — and the cause is a Pine trap worth knowing:

```pine
for i = 0 to array.size(x) - 1   // x is empty, so this is `0 to -1`
```

Pine decides the direction of a `for` from its bounds, so when the end is
below the start it counts **down**. An empty array does not skip the loop; it
runs the body with `i = 0` and then `i = -1`. Every cleanup and reporting
loop here had that shape. All fourteen are now wrapped in
`if array.size(x) > 0`, and one history lookup that a long chain term could
push beyond `max_bars_back` is bounds-checked as well.

---

# Moon node cycles (group 7)

A second method in the same script, off by default. The course uses the
moon's node conjunctions as the swing-trade trigger on the same charts it
counts pivots on, and two scripts fighting over one pane is worse than one
script with a switch. The two are independent: nothing in the counting reads
the moon and nothing here reads the chain.

The section is **on by default**. It shipped off, on the reasoning that most
of the time you are here for the counting, and the effect was that it looked
like it had never been added — a feature nobody can find is not a default,
it is a bug. Untick `Mark moon-Rahu / moon-Ketu conjunctions` in group 7 to
get the plain counting panel back.

Its table has its own corner (bottom right by default). "Middle right" was
the first default and was wrong: the summation table at top right runs to
twelve rows, which reaches into the middle of the pane, so the two drew over
each other and both became unreadable. Only corners a twelve-row table cannot
reach are offered now and its labels live in their own ring buffer — the
summation drawing is wiped and rebuilt on every last bar, while node marks
are historical and should stay where they were put. `Label only the last N`
exists because TradingView allows 500 labels per script and the pivot counts
already want most of them.

## Three cycles, three lengths

They are routinely confused and they are not interchangeable. A test run on
the wrong one tests nothing.

| cycle | length | what it is |
|---|---|---|
| synodic | 29.53 d | new moon to new moon — what most people mean |
| sidereal | 27.32 d | the moon once round the zodiac |
| **draconic** | **27.21 d** | **north node to north node — the one traded here** |

Moon conjunct Rahu (north node) is the moon crossing the ecliptic going north;
Ketu (south node) is the crossing going south, a fortnight later. So no zodiac
is needed to find them — they are the two zeros of the moon's ecliptic latitude
each draconic month, which is arithmetic on the bar's timestamp.

Positions come from Meeus, *Astronomical Algorithms* ch. 47 and 25, transcribed
term for term from `cycles/moon.py`. That file is checked against five
published solar eclipses: every new moon lands within nine minutes of the
catalogued time, and every eclipse carries a node crossing within hours, as one
must. Measured back from its own roots, the draconic month comes out at
27.2141 days against the book's 27.2122 and the synodic at 29.530567 against
29.530588.

### What the backtest found

`python3 cycles/backtest_moon.py --symbol GSPC --from 2010-01-01`

**"Buy at a Ketu conjunction and you win about 70% of the time" — the rate is
real and the edge is not.** Over 2010–2026 a Ketu entry held four weeks wins
67.3% of the time. Buying on *any* day and holding four weeks wins **67.2%**.
The number is the market's drift over a month, measured at the node.

| horizon | Ketu win | Rahu win | **any day** |
|---|---|---|---|
| 1 week | 60.6% | 61.5% | 60.1% |
| 2 weeks | 64.2% | 62.8% | 63.5% |
| to next node | 65.5% | 67.7% | 66.2% |
| 4 weeks | 67.3% | 67.3% | 67.2% |

**"Rahu is more bearish than bullish" — no.** Rahu wins as often as Ketu at
every horizon, and at the node-to-node horizon it wins *more* (67.7% against
65.5%). On the full S&P record back to 1928 the four-week Ketu rate is beaten
by a randomly-phased schedule 91% of the time.

**"Last month tends to be the opposite" — true, and not lunar.** Draconic-month
returns carry a real negative lag-1 autocorrelation: −0.159 on the S&P since
2010, −0.109 on ES since 2000, both outside the 95% band of shuffled months.
But cut the same series into 19-bar blocks starting at an **arbitrary** phase
and the figure is −0.162 (S&P) — marginally *more* negative than the lunar one.
It is short-horizon mean reversion, which any block of that length shows. The
moon contributes nothing to it.

**"Two, four, six and eight months back tend to be the same" — not found.**
Every even lag sits inside the shuffle band on the 2010–2026 window, and on the
full record the pattern is incoherent: lag 3 holds, lag 4 goes the wrong way,
lags 6 and 8 hold.

### So why mark them at all

Because the lecture's own framing survives its statistics. It is explicit that
the question is not whether a conjunction is bullish — *"it isn't either"* —
but whether the market is repeating what it did a month ago. That is a reading
aid, and the table is built for it: each completed draconic month's move, and
whether it matches the one in progress, with the rule of thumb printed beside
each row as a prediction to read the row against rather than as a result.

Nothing here scores a setup, and nothing colours a conjunction as a signal.

### The calendar ahead

`Project this many conjunctions ahead` (default 6) adds a calendar section to
the lunar table and marks the dates on the chart as dotted lines.

**This is the one projection on the panel that is not a forecast.** Everything
else that points forward here was measured and lands at chance. A node
crossing is astronomy: the ephemeris is checked against five published solar
eclipses and lands within minutes of each, and the Pine root-finder was
verified against the Python one to the millisecond across six future
crossings. The dates are not in doubt.

What the market does on them is an entirely separate question, and the
backtest above answers it: nothing reliable. The calendar is there so you can
see the dates coming, which is what the lecture uses them for.

```
Ahead       date (UT)           in     astronomy, not a forecast
new moon    2026-11-09 07:04     1 d   synodic 29.53 d
Rahu        2026-11-17 11:45     9 d   draconic 27.21 d
full moon   2026-11-24 14:58    17 d   synodic 29.53 d
Ketu        2026-11-30 03:39    22 d   draconic 27.21 d
new moon    2026-12-09 00:55    31 d   synodic 29.53 d
Rahu        2026-12-14 13:02    36 d   draconic 27.21 d
```

Node crossings are always listed; new and full moons join them when `Also
mark new and full moons` is on. The two interleave rather than coincide —
they are different cycles of different lengths, which is the thing the
lecture opens by clearing up — so each row names which cycle it belongs to
and the list is in date order.

**The dates are exact; the line positions are not.** Placing a date on a
future bar needs an average bar spacing, and holidays and half-days make that
an estimate, so a mark can stand a bar or two off its true date. Read the
table for the date and the line for roughly where it falls.

The same calendar outside TradingView, with new and full moons included:

```bash
python3 cycles/moon.py --ahead 60
```

### Settings

- **What to mark** — node conjunctions, optionally new and full moons (the
  *synodic* cycle, kept separate so the two are never mixed up), vertical lines.
- **Earlier months** — how many back to compare, up to eight.
- **Display** — colours.

Start on a daily chart. A node crossing is dated to the bar it falls in, so a
daily bar resolves it to the day and an hourly bar to the hour, which is as
fine as the course works.

### Daily or finer — the section refuses anything coarser than weekly

A 27.21-day cycle sampled once every 30.44 days does not come out slow, it
comes out **aliased**. The beat period is

    1 / |1/27.21 − 1/30.44| = 257 days ≈ 8.4 months

and that is exactly what the first version did on a monthly chart: it marked
"Rahu" every eight or nine months and filled the table with confident
nonsense. Measured gaps were 8.1, 8.9, 8.0, 8.0, 9.0, 9.0 months against the
8.4 the arithmetic predicts — the diagnosis to a tenth of a month.

Nyquist wants two samples per cycle, so 13.6-day bars is the theoretical
floor. Weekly clears it and is allowed, with the header saying the comparison
is bar-resolution only. Monthly and above are refused and the table says why.
A wrong answer delivered confidently is worse than no answer.

### How often does the panel read 6/6, and does it mean anything

Six rows all matching the odd/opposite, even/same rule looks like 1-in-64.
It is not, because the rows are not independent — consecutive months share a
boundary — and the measured distribution is squeezed toward the middle:

| rows matching | share of days (S&P 1928–2026) | if the rows were coin flips |
|---|---|---|
| 0/6 | 1.0% | 1.6% |
| 3/6 | 30.7% | 31.2% |
| **6/6** | **1.1%** | **1.6%** |

A full house is **rarer** than chance, not commoner, and a panel cut at an
arbitrary phase reaches it as often or oftener 40% of the time. Forward
returns after a 6/6 day are not distinguishable from any other day at n=252,
and the 2010–2026 subsample that looks dramatic (12.5% win rate over ten
bars) rests on 24 days.

`python3 cycles/backtest_moon.py --symbol GSPC` prints all of it.
