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
