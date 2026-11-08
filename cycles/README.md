# Cycles

Finding where history is repeating in the major indexes — the synthesis /
pattern-recognition approach from Market Forecast Mastery Lesson 1, not
decomposition.

Two scripts, standard library only, no pip install:

```bash
python3 cycles/update_prices.py          # refresh cycles/data/*.csv
python3 cycles/find_cycles.py --all --svg
```

## update_prices.py

Daily closes for `^DJI`, `^GSPC`, `^IXIC`, `^NDX`, `^RUT` and `ES=F` into
`cycles/data/<SLUG>.csv` (`date,close`, oldest first).

Stooq first, because it is the only free source with the history this work
needs — DJIA back to 1896, where Yahoo only serves `^DJI` from 1992, and a
60-year cycle cannot be measured in 33 years of data. Yahoo then tops the file
up with the most recent sessions. Either source can fail without failing the
run; the other one's rows still land.

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

# or test one cycle you already believe in — far stronger evidence
python3 cycles/find_cycles.py --symbol ^DJI --lag-years 60 --svg
```

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

## Automation

`.github/workflows/update-cycles.yml` refreshes the prices and rescans every
Saturday, and on demand from the Actions tab. It commits `cycles/data/` and
`public/cycles/` when they change.
