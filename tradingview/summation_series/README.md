# Summation Series Cycle Finder

`summation_series.pine` implements the Summation Series technique for locating
cycles, from Market Forecast Mastery (Allen Reminick). It is not his code.

Open the Pine editor, clear it, paste the whole file, Save, Add to chart.
**Use it on a weekly chart first** — that is where the course starts.

## The method it automates

1. **Pick the zero point.** An important high or low, recent but not the
   extreme of the whole history — the course suggests 20 to 70 weeks back. Use
   a *high* if the market has been falling since, a *low* if it has been
   rising. Label it 0.
2. **Count backwards.** Walk back from the zero point and label every pivot
   with its distance in bars. The numbers get large — 130, 180, 192 — and that
   is fine, the course says the bigger the better.
3. **Find a summation series in those numbers.** A chain where each term is
   the sum of the two before it: 3, 4, 7, 11, 18, 29, 47, 76. It may use any
   *subset* of the pivots; skipping most of them is expected. Fibonacci is one
   such series and the course's point is that it is not the only one.
4. **Read the cycle off the chain.** Of the pivots in the chain, the ones whose
   *type matches the zero point* — high against a high anchor, low against a
   low — are the cycle candidates. That is what connects the past to the
   present: a chain of growth terms landing on the same kind of turn.

> "The summation series is a growth process that connects the past through a
> sequence of collapsing points to the present."

## What it draws

- **0** in yellow on the anchor, every other pivot labelled with its count.
- Chain members in aqua, everything else dimmed — the circling step, done for you.
- Dashed forward lines where the chain's own step projects the next turns.
- A table: pivots counted, the chain, the cycle candidates, the most repeated
  same-type interval, and how many counts land on the classic series.

## Settings worth knowing

| Setting | Why it matters |
| --- | --- |
| **Pivot strength** | The single biggest lever. Higher = fewer, more important pivots, which is what "primary pivot" means. Low values find a chain in noise. |
| **Tolerance** | How far a pivot may sit from the exact sum. The larger of *n* bars or *x* %, so small terms get the bar allowance and large ones the percentage. |
| **Shortest chain** | 3 is one addition and happens constantly by chance. 4–5 is where it starts to mean something. |

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

Written against the method as described in the course transcript and slide.
**Not yet compile-checked on TradingView** — there is no Pine compiler in the
environment it was written in, so the first paste may turn up syntax to fix.
