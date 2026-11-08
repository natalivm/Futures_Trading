# The method, in rules

A distillation of the Market Forecast Mastery lectures (Allen Reminick) into
the rules the scanner implements and the knowledge base teaches. Written from
the course transcripts and slides — the claims are the course's, the
measurements and the caveats under them are ours.

## 1. The premise

History repeats, if you know where to look. The work is not prediction; it is
locating the stretch of past data the present rhymes with and reading what it
did next.

Two ways to do it:

- **Decomposition / wave mechanics (analytical).** Break the market into
  component waves — 15 to 20 may be live in one market at a time — add them
  into a composite wave, and project it forward. Complex mathematics, needs
  software. Deferred to later courses.
- **Synthesis / pattern recognition.** Slide the present window back through
  history and find where it fits. Conceptually simple, can be done by hand.
  **This is what we do.**

The course's explanation for why it works at all: the driver is not human.
Nobody is looking at 1962, or at four-hour bars from 2002, to decide what to do
today. The surface justification for a move — the Fed, an election, a war —
is the story attached afterwards, not the cause. Recorded here as the course's
position; the scanner neither needs it nor tests it.

## 2. What is being measured

| term | meaning |
| --- | --- |
| **Window** | how much present data is compared, in trading days |
| **Lag / interval** | how far back the analog sits |
| **Analog** | the past stretch the present is matched against |
| **CS / CE** | cycle start and cycle end, the markers on the course's charts |

Both paths are rescaled 0–100 and drawn over each other. Rescaling does not
change the correlation — it only makes two different price levels comparable
on one axis.

## 3. The cycles the course names

| market | interval | window used | reported fit |
| --- | --- | --- | --- |
| Dow | 60 years | 440 days (22 months) | 93% |
| Dow | 78.5 years | 345 days (17 months) | Depression ↔ GFC |
| Dow / equities | 157, 314 years | — | harmonics of 78.5; 1720 + 314 = 2034 |
| S&P 500 | 22 years | 260 days | 2000 ↔ 2022 |
| S&P 500 | 11.65 years | 230 days, and ~400 days | "96% for almost two years" |
| S&P 500 | 6.8 years | 365 four-hour bars (~3 months) | 80% |
| Crude | 17 years | 650 days (3.5 years) | 77% |
| Crude | 19 years 1 month | 360 days | Iraq 2003 ↔ Ukraine 2022 |
| Crude | 27 years | — | agrees with the 17 before and after |
| Gold | 24.5 years | 1,800 days (7 years) | "high" |
| Equities | 4 years | — | the election cycle |
| Equities | 28 / 56 years | — | the 5–8 year decline rhythm |

A cycle belongs to a market. 60 and 78.5 are equity clocks, 17 and 19 are
crude's, 24.5 is gold's. Do not carry an interval across markets because the
number is familiar.

## 4. The rules

**R1 — A window has to be long enough to be hard to fit.** Five months of data
will match something by accident. Twenty-two months containing a sequence of
highs and lows is a far harder test. The course's windows run 11 months to
7 years.

**R2 — A match that turns is worth more than a match that trends.** Two rising
stretches correlate for no reason. Two stretches that fall, base and turn
together have to agree about the turn, and a trend cannot fake a turn. This is
why crude's 77% is better evidence than the Dow's 93%.

**R3 — The repeat has to be non-reflexive to mean anything.** Nobody trades off
1962, or off four-hour bars from 2002. If a pattern could be produced by people
watching the same chart, it is not evidence of a cycle.

**R4 — Direction and swing, not day by day.** What repeats is the general
direction and the general swing. Any use that needs an exact day or an exact
level is using the method for something it does not provide.

**R5 — The composite is the forecast, not any single cycle.** Where several
independent intervals agree on the next few months, the odds stack. Where they
fight, expect nothing — chop, not a move. Where they all point down together,
expect a real decline. Agreement between a long cycle and a short one is worth
more than either alone.

**R6 — A long cycle gives the bias; a short cycle gives the timing.** The
60-year clock says which side to work for a year. A 4-year, 2-year or
326-day cycle says whether the next three months are up.

**R7 — Pre-specify the interval.** Testing an interval the course names is one
hypothesis. Taking the best of twelve thousand searched offsets is a different
activity with a far weaker standard of proof.

**R8 — The analog gives conviction, not entries.** The trade is still taken on
a level, a reaction and a stop. What the roadmap buys is the nerve to act on a
valid trigger before it is obvious — covering a short when crude broke its
downtrend line, knowing the analog's next move was large and sustained.

**R9 — Scoring.** Four numbers, in order of how much they are worth:

1. **Worst-epoch correlation** — the same interval re-scored at earlier anchor
   points. A cycle that only fits the last two years is not a cycle.
2. **Swing correlation** — monthly returns rather than prices. Matches R4.
3. **Daily return correlation** — a floor; stricter than the claim.
4. **Price correlation** — the headline number on every slide, and nearly
   worthless alone.

**R10 — Know what would void it, in advance.** Write the invalidation before
entering. A forecast with no stated way to be wrong cannot be traded.

## 5. Why R9 puts price correlation last

Two controls, in `README.md`. A synthetic series with a real 30-year cycle
scores 0.895 on price and 0.875 on swing, holding above +0.79 at every earlier
epoch. **A pure random walk with no cycle at all scores 0.947 on price** — a
higher price correlation than the genuine cycle — with swing 0.449 and worst
epoch −0.01.

The first run against real markets, 2026-11-08, said the same thing: an open
search over seven markets returned price correlations of 0.81 to 0.96, swing
correlations near zero and worst-epoch scores of −0.5 to −0.9. On the measures
that can tell a cycle from a coincidence, searching real indices did no better
than searching noise.

None of which disproves the named cycles. It means **a searched cycle is not
evidence and a pre-specified one has to clear R9 before it is.**

## 6. What the tools do

| script | job |
| --- | --- |
| `update_prices.py` | daily closes for the indices, crude and gold |
| `find_cycles.py` | search for intervals, or test named ones (`--preset`) |
| `composite.py` | R5 — run several named cycles and report where they agree |
| `election_cycle.py` | the 4-year cycle as a measured statistic |

## 7. Open questions

- The 60-year test needs a century of Dow data; Yahoo serves 1992 onward and
  Stooq has been unreliable. Until that lands, the headline claim is untested.
- Intraday cycles (the 6.8-year match on four-hour bars) need intraday history,
  which none of the sources here provide.
- The 6.8-year label on that slide sits against dates 20 years apart — 2002
  against 2022 — so either the label or the dates mean something other than the
  obvious. Unresolved.
- Wave mechanics is not implemented and is not planned until the synthesis side
  is settled, which is the order the course itself recommends.
