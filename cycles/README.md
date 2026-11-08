# Cycles

Finding where history is repeating in the major indexes — the synthesis /
pattern-recognition approach from Market Forecast Mastery, not
decomposition.

Two scripts, standard library only, no pip install:

```bash
python3 cycles/update_prices.py                      # refresh cycles/data/*.csv
python3 cycles/find_cycles.py --preset course        # the lectures' cycle set
python3 cycles/composite.py --symbol ^GSPC --preset sp500   # where cycles agree
python3 cycles/election_cycle.py --symbol ^DJI       # the four-year cycle statistic
```

**[METHOD.md](METHOD.md) is the method in rules** — the lectures distilled to
R1–R10, the table of every cycle they name, and the scoring order. Read that
first; this file is the tooling.

## update_prices.py

Daily closes for `^DJI`, `^GSPC`, `^IXIC`, `^NDX`, `^RUT` and `ES=F` into
`cycles/data/<SLUG>.csv` (`date,close`, oldest first).

Stooq first, because it is the only free source with the history this work
needs — DJIA back to 1896, where Yahoo only serves `^DJI` from 1992. Yahoo
then tops the file up with the most recent sessions. Either source can fail
without failing the run; the other one's rows still land.

**Stooq does not answer GitHub's runners.** Both of its hosts return an HTML
bot-challenge page (`robots: noindex,nofollow` plus a `<noscript>`) instead of
the CSV. That is an IP-reputation block on datacenter ranges, not a rate
limit, so no header or retry gets past it — but it still serves a home
connection, so running `python3 cycles/update_prices.py` locally and
committing `cycles/data/` is the way to get the Dow back to 1896.

Without it the deepest history available is Yahoo's **S&P 500 from 1927**,
which is still enough to test a 60-year interval with room for epoch checks.
Reaching it needs `--full`: the incremental path only fetches the recent tail,
so a file written before the `range=max` fix starts at 1970 and will never
grow backwards on its own. The workflow passes `--full` every run.

## find_cycles.py

Takes the last `--window` trading days and slides that window back through
every earlier offset in the history, scoring each one. The offsets that score
best are the candidate cycles. The DJIA slide — *60-year cycle, 1962 in grey,
2022 in blue, 93% correlated* — is this with a window of about 440 trading
days (22 months, which is the span the lecture describes) and a winning offset
of exactly 60 years. 440 is the default.

```bash
# search for whatever repeats
python3 cycles/find_cycles.py --symbol ^DJI --min-years 40 --max-years 80 --svg

# or test cycles you already believe in — far stronger evidence
python3 cycles/find_cycles.py --symbol ^DJI --lag-years 60 --svg
python3 cycles/find_cycles.py --symbol ^DJI --preset course
```

`--preset course` expands to the set the lectures work with: 4, 28, 56, 60,
78.5, 157 and 314 years. 78.5 is half of 157, which is half of 314 — the
harmonic chain that reaches back to the 1720 top and forward to 2034. Offsets
longer than the available history are skipped with a note.

| flag | meaning |
| --- | --- |
| `--window` | trading days compared (default 440 ≈ 22 months) |
| `--lag-years` | test ONE cycle length instead of searching |
| `--horizon` | trading days projected forward (default 230 ≈ 11 months) |
| `--min-years` / `--max-years` | the offset range scanned |
| `--swing` | bars per swing-return block (default 21 ≈ monthly) |
| `--epochs` / `--epoch-years` | how many earlier anchor points to re-test the offset at, and how far apart |
| `--top` | how many distinct cycles to keep |
| `--svg` | overlay + forecast charts into `cycles/out/` |

Output lands in `public/cycles/<SLUG>.json`: the current window, each match's
analog window, and the analog's own forward path rescaled onto today's price —
the "future 11-month forecast" chart.

### Reading the scores

Four numbers per match, and they do not agree with each other. Two control
series were used to work out which to trust: one with a real 30-year cycle
built into it (each period's return is 70% the return one cycle earlier plus
fresh noise, so the cycle genuinely recurs at every epoch) and one pure random
walk with no cycle at all.

| | `corr` | `swingCorr` | `retCorr` | `heldMean` / `heldMin` |
| --- | --- | --- | --- | --- |
| real 30-year cycle, found by search | +0.895 | **+0.875** | +0.835 | **+0.94 / +0.79** |
| random walk, best of 12,000 offsets (50.2y) | **+0.947** | +0.449 | +0.047 | +0.36 / −0.01 |
| random walk, 30-year offset named in advance | +0.086 | −0.135 | −0.099 | +0.43 / −0.09 |

Read that middle row first. **A pure random walk produced a "50-year cycle"
correlated 0.947 — a better price correlation than the real cycle scored.**
`corr` on closing prices cannot tell a cycle from two similar-looking trends,
and neither can `pctBetter`: that false match also ranked in the top 0.01% of
offsets, because ranking first among twelve thousand bad fits is what a search
over twelve thousand hypotheses does by construction.

- **`corr`** — Pearson on closes. The number on the slides. Unchanged by the
  0–100 rescaling the charts use. Nearly worthless on its own.
- **`swingCorr`** — correlation of non-overlapping 21-bar (monthly) log
  returns. This is the one that matches what the course actually claims: *the
  general direction and the general swing, not day by day perfect.* It
  separated the controls cleanly, 0.875 against 0.449.
- **`retCorr`** — the same on daily returns. A stricter test than the claim
  being made; useful as a floor, not as the gate.
- **`heldMean` / `heldMin`** — the same offset re-scored at earlier anchor
  points, by default five of them five years apart. This is the course's own
  check: the 60-year cycle was not only fitting in 2022, it still fitted
  25 years earlier against 60 years before *that*. It is the sharpest
  discriminator in the table — the real cycle never dropped below +0.79, the
  random walk's best match sat at −0.01.

**Gate on `heldMin` and `swingCorr`, not on `corr`.** And prefer
`--lag-years 60` over a search when you already have a cycle in mind: naming
the hypothesis in advance removed the false positive entirely (0.086).

## composite.py

Rule R5: no single cycle is the forecast. This runs every named interval,
projects each forward, and takes a weighted vote at 1, 3, 6 and 12 months.

```bash
python3 cycles/composite.py --symbol ^GSPC --preset sp500
python3 cycles/composite.py --all --json
```

A cycle's vote is weighted by its **swing correlation and worst epoch**, never
by its price correlation — weighting the headline number would hand the
loudest vote to whichever coincidence scored highest. A cycle below the floors
gets a weight of zero and does not vote at all. Cycles pointing opposite ways
cancel, so a split reports "no agreement", which is the forecast of chop the
lectures describe rather than a missing answer.

Note that **the window belongs to the cycle, not to the run**. The course uses
230–400 days for the 11.65-year interval, 260 for the 22-year and 440 for the
60-year. Running them all at one window is convenient and is not what they
claim; `--window` per cycle is the honest way to test them individually.

## Checking a published claim: `--as-of`

A claim made in April 2022 is about the window ending in April 2022. Scoring
it against today tests something else entirely, so `find_cycles.py --as-of
2022-04-28` truncates the series and re-runs the scan as it would have stood
that day. This is what turned the lectures' S&P claims from anecdotes into
three checkable results — one of which reproduced at 0.962 against a quoted
96%, and one of which did not reproduce at all.

## election_cycle.py

The four-year presidential cycle, computed rather than taken on trust. Year 1
is the year after the election, year 2 the midterm, year 3 the pre-election
year, year 4 the election year.

```bash
python3 cycles/election_cycle.py --symbol ^DJI
python3 cycles/election_cycle.py --all --from 1926 --json
```

It prints, per cycle year, the up-rate, mean, median and worst calendar-year
move, then names every down year. The lecture's claim is that the third year
is up about 94% of the time with only two misses, given as 1931 and 2008 —
note that 2008 was an election year rather than a pre-election year, and the
exceptions usually cited are 1931 and 2015. This script settles it on our own
data. With roughly 25 pre-election years in a century, one extra miss moves
the rate by four points, so read it as a tilt rather than a law.

## Automation

`.github/workflows/update-cycles.yml` runs the whole pipeline on GitHub's
runners, which can reach Stooq and Yahoo. It runs every Saturday and on demand
from the Actions tab, where it takes a symbol, cycle length and window for one
extra ad-hoc test.

Each run refreshes the price files, tests the named cycles for equities, crude
and gold, runs an open search across every market, recomputes the election
table, and writes everything it printed to **`cycles/REPORT.md`** — committed
alongside `cycles/data/` and `public/cycles/`, so the results are readable in
the repo without opening the Actions log.

Note that GitHub only shows the "Run workflow" button for workflows that exist
on the default branch, so this has to be merged to `main` before it can be
triggered by hand.
