# Moon Node Cycles

Marks the moon–Rahu and moon–Ketu conjunctions the course uses as swing-trade
triggers, and tabulates what the market did in the same lunar slot in earlier
months.

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

## What the backtest found

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

## So why mark them at all

Because the lecture's own framing survives its statistics. It is explicit that
the question is not whether a conjunction is bullish — *"it isn't either"* —
but whether the market is repeating what it did a month ago. That is a reading
aid, and the table is built for it: each completed draconic month's move, and
whether it matches the one in progress, with the rule of thumb printed beside
each row as a prediction to read the row against rather than as a result.

Nothing here scores a setup, and nothing colours a conjunction as a signal.

## Settings

- **What to mark** — node conjunctions, optionally new and full moons (the
  *synodic* cycle, kept separate so the two are never mixed up), vertical lines.
- **Earlier months** — how many back to compare, up to eight.
- **Display** — colours.

Start on a daily chart. A node crossing is dated to the bar it falls in, so a
daily bar resolves it to the day and an hourly bar to the hour, which is as
fine as the course works.
