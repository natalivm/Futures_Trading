#!/usr/bin/env python3
"""Build the one-page situation brief — the thing you actually post.

It answers one question with the only evidence on this record that has a
sample worth the name: after a fall like the one just finished, what has
historically happened next? Every analogue in the file that matches the
current session on two conditions — a five-session fall at least as steep,
and a 40-day low — is measured, and the brief draws the distribution of what
followed.

Three figures, in the order the argument needs them:

  1. where we are — the recent closes and the levels that settle the call;
  2. what followed — the median and middle half of the analogues, rebased;
  3. the dip that usually comes first — the trough, which figure 2 hides.

That third figure is not decoration. The median *level* at each horizon sits
above the signal day almost immediately, while three in four analogues make a
lower close at some point: the dips are real but their timing varies, so they
do not survive the median. A brief that showed only figure 2 would read as
"straight up from here", which is the opposite of what the data says.

    python3 cycles/brief.py                      # writes the HTML
    python3 cycles/brief.py --pdf                # and prints it to PDF
    python3 cycles/brief.py --out ~/Desktop      # somewhere else

Stdlib only for the HTML. --pdf shells out to a headless Chrome or Chromium
if one is on PATH, and says how to print it by hand if none is.
"""
import argparse, csv, os, shutil, statistics, subprocess

HERE = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(HERE, "data")

INK, INK2, MUTED = "#0b0b0b", "#52514e", "#898781"
BLUE, BAND, BAND2 = "#2a78d6", "#cde2fb", "#9ec5f4"
CRIT = "#d03b3b"
GRID = "#e4e3df"

# Blue against red validates on every check in the data-viz palette; red
# against green does not — ΔE 4.1 for deuteranopia, the classic failure. So
# the confirmation level is a neutral dashed line carrying a text label, and
# colour is never the only thing distinguishing two marks here.


NAMES = {
    "GSPC": "S&amp;P 500", "DJI": "Dow Jones Industrial Average", "IXIC": "Nasdaq Composite",
    "NDX": "Nasdaq 100", "RUT": "Russell 2000", "ES_F": "E-mini S&amp;P 500",
    "QQQ": "QQQ", "GC_F": "Gold", "CL_F": "WTI crude", "ZB_F": "US 30-year bonds",
}


def figures(symbol, horizon=63, lookback=30):
    """The numbers the brief is made of, measured rather than asserted."""
    with open(os.path.join(DATA_DIR, f"{symbol}.csv"), newline="") as fh:
        rows = list(csv.DictReader(fh))
    d = [r["date"] for r in rows]
    c = [float(r["close"]) for r in rows]
    n = len(c)
    now = n - 1
    r5 = (c[now] - c[now - 5]) / c[now - 5] * 100

    # The analogues: as steep a five-session fall, and a 40-day low with it.
    hits = [i for i in range(40, n - 1)
            if (c[i] - c[i - 5]) / c[i - 5] * 100 <= r5 and c[i] == min(c[i - 40:i + 1])]
    full = [i for i in hits if i + horizon < n]

    def pct(xs, p):
        xs = sorted(xs)
        k = (len(xs) - 1) * p
        lo = int(k)
        hi = min(lo + 1, len(xs) - 1)
        return xs[lo] + (xs[hi] - xs[lo]) * (k - lo)

    paths = [[100 * c[i + k] / c[i] for k in range(horizon + 1)] for i in full]
    fan = [{"k": k,
            "p25": round(pct([p[k] for p in paths], .25), 2),
            "p50": round(pct([p[k] for p in paths], .50), 2),
            "p75": round(pct([p[k] for p in paths], .75), 2)} for k in range(horizon + 1)]

    m21 = [i for i in hits if i + 22 < n]
    trough = [(min(c[i + 1:i + 22]) / c[i] - 1) * 100 for i in m21]
    tro_k = [min(range(1, 22), key=lambda k: c[i + k]) for i in m21]
    fwd21 = [100 * (c[min(n - 1, i + 21)] / c[i] - 1) for i in hits]
    fwd63 = [100 * (c[min(n - 1, i + 63)] / c[i] - 1) for i in hits]
    base21 = [100 * (c[min(n - 1, i + 21)] / c[i] - 1) for i in range(40, n - 22)]

    return {
        "asOf": d[now], "close": round(c[now], 2), "week": round(r5, 2),
        # Not every file reaches 1928 — the Dow's only starts in 1992 — so the
        # copy takes the year from the data rather than asserting one.
        "startYear": int(d[0][:4]) + (1 if d[0][5:] > "06-30" else 0),
        "name": NAMES.get(symbol, symbol),
        "nAnalogues": len(hits), "nFull": len(full), "totalWindows": n - 5,
        "worseWindows": sum(1 for i in range(5, n)
                            if (c[i] - c[i - 5]) / c[i - 5] * 100 <= r5),
        "wasTheLow": round(100 * sum(1 for i in full if min(c[i + 1:i + 1 + horizon]) > c[i])
                           / len(full)),
        "lowerWithin21": round(100 * sum(1 for i in hits if min(c[i + 1:i + 22] or [c[i]]) < c[i])
                               / len(hits)),
        "median21": round(statistics.median(fwd21), 2),
        "median63": round(statistics.median(fwd63), 2),
        "base21": round(statistics.median(base21), 2),
        "troughMed": round(statistics.median(trough), 1),
        "troughP25": round(pct(trough, .25), 1),
        "troughP75": round(pct(trough, .75), 1),
        "troughWhen": round(statistics.median(tro_k)),
        "worst63": round(min(fwd63)), "best63": round(max(fwd63)),
        "recent": [{"date": d[i], "close": round(c[i], 2)} for i in range(now - lookback + 1, now + 1)],
        "fan": fan,
    }


def neg(v, fmt="{:+.1f}"):
    """A real minus sign, not a hyphen. This is a document people print."""
    return fmt.format(v).replace("-", "\u2212")


def esc(s):
    return str(s).replace("&", "&amp;").replace("<", "&lt;")


# ── Chart 1: the setup ──────────────────────────────────────────────────────
def chart_setup(D, CONFIRM, label):
    W, H = 520, 136
    L, R, T, B = 6, 62, 15, 20
    rows = D["recent"]
    ys = [r["close"] for r in rows]
    lo = (min(ys + [CONFIRM]) * 0.995) // 100 * 100
    hi = -(-(max(ys + [CONFIRM]) * 1.004) // 100) * 100
    x = lambda i: L + i * (W - L - R) / (len(rows) - 1)
    y = lambda v: T + (hi - v) * (H - T - B) / (hi - lo)

    o = []
    step = 200 if hi - lo > 800 else 100
    ticks = [lo + k * step for k in range(int((hi - lo) / step) + 1)]
    for v in ticks:
        o.append(f'<line x1="{L}" y1="{y(v):.1f}" x2="{W-R}" y2="{y(v):.1f}" '
                 f'stroke="{GRID}" stroke-width="1"/>')
        o.append(f'<text x="{W-R+6}" y="{y(v)+3.5:.1f}" font-size="9" fill="{MUTED}">'
                 f'{v:,.0f}</text>')
    # The confirmation level: neutral + dashed + labelled, so no colour carries it.
    o.append(f'<line x1="{L}" y1="{y(CONFIRM):.1f}" x2="{W-R}" y2="{y(CONFIRM):.1f}" '
             f'stroke="{INK2}" stroke-width="1.5" stroke-dasharray="6 4"/>')
    o.append(f'<text x="{L+4}" y="{y(CONFIRM)-5:.1f}" font-size="9.5" font-weight="600" '
             f'fill="{INK2}">Confirms above {CONFIRM:,.0f}</text>')

    pts = " ".join(f"{x(i):.1f},{y(v):.1f}" for i, v in enumerate(ys))
    o.append(f'<polyline points="{pts}" fill="none" stroke="{BLUE}" stroke-width="2" '
             f'stroke-linejoin="round" stroke-linecap="round"/>')
    # The five sessions of the decline, emphasised.
    tail = " ".join(f"{x(i):.1f},{y(v):.1f}" for i, v in enumerate(ys) if i >= len(ys) - 6)
    o.append(f'<polyline points="{tail}" fill="none" stroke="{CRIT}" stroke-width="2.6" '
             f'stroke-linejoin="round" stroke-linecap="round"/>')
    o.append(f'<circle cx="{x(len(ys)-1):.1f}" cy="{y(ys[-1]):.1f}" r="4.5" fill="{CRIT}" '
             f'stroke="#fcfcfb" stroke-width="2"/>')
    o.append(f'<text x="{x(len(ys)-1)-9:.1f}" y="{y(ys[-1])-8:.1f}" font-size="10.5" '
             f'font-weight="700" text-anchor="end" fill="{INK}">'
             f'{ys[-1]:,.0f} · {label}</text>')
    o.append(f'<text x="{L}" y="{H-5}" font-size="9" fill="{MUTED}">12 Oct</text>')
    o.append(f'<text x="{x(len(ys)-8):.1f}" y="{T-3}" font-size="9.5" font-weight="700" '
             f'fill="{CRIT}" text-anchor="middle">'
             f'{neg(D["week"], "{:.1f}")}% in five sessions</text>')
    return f'<svg viewBox="0 0 {W} {H}" width="100%" role="img" aria-label="daily closes, last 30 sessions, falling {abs(D['week']):.1f}% in the final five">{"".join(o)}</svg>'


# ── Chart 2: the fan ────────────────────────────────────────────────────────
def chart_fan(D):
    W, H = 520, 154
    L, R, T, B = 6, 62, 16, 22
    fan = D["fan"]
    lo, hi = 89.0, 121.0
    x = lambda k: L + k * (W - L - R) / 63
    y = lambda v: T + (hi - v) * (H - T - B) / (hi - lo)

    o = []
    for v in (90, 95, 100, 105, 110, 115, 120):
        o.append(f'<line x1="{L}" y1="{y(v):.1f}" x2="{W-R}" y2="{y(v):.1f}" '
                 f'stroke="{GRID}" stroke-width="1"/>')
        o.append(f'<text x="{W-R+6}" y="{y(v)+3.5:.1f}" font-size="9" fill="{MUTED}">'
                 f'{v-100:+d}%</text>')
    o.append(f'<line x1="{L}" y1="{y(100):.1f}" x2="{W-R}" y2="{y(100):.1f}" '
             f'stroke="{INK2}" stroke-width="1.3"/>')

    up = " ".join(f"{x(f['k']):.1f},{y(f['p75']):.1f}" for f in fan)
    dn = " ".join(f"{x(f['k']):.1f},{y(f['p25']):.1f}" for f in reversed(fan))
    o.append(f'<polygon points="{up} {dn}" fill="{BAND}" stroke="{BAND2}" stroke-width="1"/>')
    med = " ".join(f"{x(f['k']):.1f},{y(f['p50']):.1f}" for f in fan)
    o.append(f'<polyline points="{med}" fill="none" stroke="{BLUE}" stroke-width="2.4" '
             f'stroke-linejoin="round"/>')

    f21, f63 = fan[21], fan[63]
    for f, lab, anc, dx in ((f21, "1 month", "middle", 0), (f63, "3 months", "end", -8)):
        o.append(f'<line x1="{x(f["k"]):.1f}" y1="{y(f["p25"]):.1f}" '
                 f'x2="{x(f["k"]):.1f}" y2="{y(f["p75"]):.1f}" stroke="{INK2}" '
                 f'stroke-width="1" stroke-dasharray="3 3"/>')
        o.append(f'<circle cx="{x(f["k"]):.1f}" cy="{y(f["p50"]):.1f}" r="4" fill="{BLUE}" '
                 f'stroke="#fcfcfb" stroke-width="1.8"/>')
        o.append(f'<text x="{x(f["k"]):.1f}" y="{H-14}" font-size="9" fill="{MUTED}" '
                 f'text-anchor="middle">{lab}</text>')
        o.append(f'<text x="{x(f["k"])+dx:.1f}" y="{y(f["p50"])-9:.1f}" font-size="10.5" '
                 f'font-weight="700" fill="{INK}" text-anchor="{anc}">'
                 f'{f["p50"]-100:+.1f}%</text>')
    # Direct labels rather than a legend box — one distribution, not two series.
    o.append(f'<text x="{x(34):.1f}" y="{y(fan[34]["p75"])-5:.1f}" font-size="9" '
             f'fill="{INK2}" text-anchor="middle">75th pct</text>')
    o.append(f'<text x="{x(34):.1f}" y="{y(fan[34]["p25"])+12:.1f}" font-size="9" '
             f'fill="{INK2}" text-anchor="middle">25th pct</text>')
    o.append(f'<text x="{x(9):.1f}" y="{y(fan[9]["p50"])+15:.1f}" font-size="9.5" '
             f'font-weight="700" fill="{BLUE}" text-anchor="middle">median</text>')
    o.append(f'<text x="{L}" y="{H-14}" font-size="9" fill="{MUTED}">signal day</text>')
    return f'<svg viewBox="0 0 {W} {H}" width="100%" role="img" aria-label="Where it sat after {D['nAnalogues']} comparable sessions: median and middle half, out to three months">{"".join(o)}</svg>'


# ── Chart 3: the trough strip ───────────────────────────────────────────────
def chart_trough(D, label):
    W, H = 520, 56
    L, R, T = 6, 62, 16
    med, p25, p75 = D["troughMed"], D["troughP25"], D["troughP75"]
    lo = min(-22.0, p25 - 4)
    hi = 2.0
    x = lambda v: L + (v - lo) * (W - L - R) / (hi - lo)
    o = []
    o.append(f'<rect x="{x(p25):.1f}" y="{T}" width="{max(2, x(p75)-x(p25)):.1f}" height="20" '
             f'rx="4" fill="{BAND}" stroke="{BAND2}"/>')
    o.append(f'<line x1="{x(med):.1f}" y1="{T-4}" x2="{x(med):.1f}" y2="{T+24}" '
             f'stroke="{BLUE}" stroke-width="2.6"/>')
    o.append(f'<line x1="{x(0):.1f}" y1="{T-4}" x2="{x(0):.1f}" y2="{T+24}" '
             f'stroke="{INK2}" stroke-width="1.3"/>')
    o.append(f'<text x="{x(med):.1f}" y="{T-8}" font-size="10" font-weight="700" '
             f'fill="{INK}" text-anchor="middle">{neg(med)}% typical dip</text>')
    o.append(f'<text x="{x(0)+5:.1f}" y="{T-8}" font-size="9" fill="{MUTED}">{label}’s close</text>')
    step = 5 if hi - lo <= 30 else 10
    v = 0
    while v >= lo + 1:
        o.append(f'<text x="{x(v):.1f}" y="{T+38}" font-size="9" fill="{MUTED}" '
                 f'text-anchor="middle">{neg(v, "{:d}")}%</text>')
        v -= step

    return f'<svg viewBox="0 0 {W} {H}" width="100%" role="img" aria-label="Deepest point reached within a month: median minus 5.1 percent, middle half minus 12 to minus 1.1 percent">{"".join(o)}</svg>'


def PAGE(D, CONFIRM, VOID, title=None):
    FRI = D["close"]
    import datetime as _dt
    asof = _dt.date.fromisoformat(D["asOf"])
    DAY = asof.strftime("%A")                      # "Friday" only when it is one
    DAYSHORT = asof.strftime("%a %-d %b")
    LONG = asof.strftime("%-d %B")
    TODAY = _dt.date.today().strftime("%-d %B %Y")
    HEADLINE = title or f"Did {DAY} mark the low?"
    tiles = [
        (f'{D["wasTheLow"]}%', f"chance {DAY} was<br>the final low",
         f'about 1 in {round(100 / max(1, D["wasTheLow"]))}'),
        (f'{D["lowerWithin21"]}%', "made a lower close<br>within a month", "the usual path"),
        (f'{D["median21"]:+.1f}%', "median return<br>one month on",
         f'vs {D["base21"]:+.1f}% any day'),
    ]
    tile_html = "".join(
        f'<div class="tile"><div class="tv">{v}</div><div class="tl">{l}</div>'
        f'<div class="tn">{n}</div></div>' for v, l, n in tiles)

    return f"""<!doctype html>
    <html lang="en"><head><meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{D["name"]} — after the {abs(D['week']):.1f}% week</title>
    <style>
      @page {{ size: A4; margin: 0; }}
      :root {{
        --surface:#fcfcfb; --plane:#f9f9f7; --ink:{INK}; --ink2:{INK2};
        --muted:{MUTED}; --blue:{BLUE}; --crit:{CRIT}; --rule:#e4e3df;
      }}
      * {{ box-sizing: border-box; }}
      body {{ margin:0; background:var(--plane); color:var(--ink);
        font-family: ui-sans-serif, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        -webkit-print-color-adjust: exact; print-color-adjust: exact; }}
      .page {{ width:210mm; height:297mm; margin:0 auto; background:var(--surface);
        padding:9mm 11mm 7mm; display:flex; flex-direction:column; overflow:hidden; }}
      header {{ border-bottom:2px solid var(--ink); padding-bottom:5px; margin-bottom:8px; }}
      .kicker {{ font-size:9.5px; letter-spacing:.14em; text-transform:uppercase;
        color:var(--muted); font-weight:700; }}
      h1 {{ font-size:23px; line-height:1.12; margin:3px 0 3px; letter-spacing:-.018em; }}
      .sub {{ font-size:11px; color:var(--ink2); margin:0; line-height:1.35; }}
      .call {{ background:var(--plane); border-left:4px solid var(--blue);
        padding:8px 11px; margin:0 0 8px; border-radius:0 6px 6px 0; }}
      .call b {{ font-size:12.5px; }}
      .call p {{ margin:3px 0 0; font-size:10.5px; color:var(--ink2); line-height:1.42; }}
      .tiles {{ display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin-bottom:9px; }}
      .tile {{ background:var(--plane); border:1px solid var(--rule); border-radius:7px;
        padding:7px 10px; }}
      .tv {{ font-size:24px; font-weight:750; letter-spacing:-.03em; line-height:1; }}
      .tl {{ font-size:10px; color:var(--ink2); margin-top:4px; line-height:1.28; }}
      .tn {{ font-size:8.5px; color:var(--muted); margin-top:3px; }}
      h2 {{ font-size:12px; margin:0 0 1px; letter-spacing:-.005em; }}
      .cap {{ font-size:9px; color:var(--muted); margin:0 0 2px; line-height:1.3; }}
      .fig {{ margin-bottom:6px; }}
      .note {{ font-size:9.5px; color:var(--ink2); background:var(--plane);
        border:1px solid var(--rule); border-radius:6px; padding:6px 9px; line-height:1.4;
        margin-top:3px; }}
      table {{ width:100%; border-collapse:collapse; font-size:10px; margin-top:1px; }}
      th, td {{ text-align:left; padding:3.5px 7px; border-bottom:1px solid var(--rule); }}
      th {{ font-size:9px; text-transform:uppercase; letter-spacing:.07em; color:var(--muted); }}
      td.n {{ text-align:right; font-variant-numeric:tabular-nums; font-weight:650; }}
      .lvl {{ font-weight:700; }}
      footer {{ margin-top:auto; padding-top:7px; border-top:1px solid var(--rule);
        font-size:8px; color:var(--muted); line-height:1.42; }}
    </style></head>
    <body><div class="page">
      <header>
        <div class="kicker">{D["name"]} · situation brief · {TODAY}</div>
        <h1>{HEADLINE}</h1>
        <p class="sub">Probably not the final one — but the month ahead still leans higher.
          What happened after the {D['nAnalogues']} comparable sessions since {D['startYear']}.</p>
      </header>

      <div class="call">
        <b>The call.</b>
        <p>{D["name"]} fell <b>{abs(D['week']):.2f}%</b> in the five sessions to {DAY} {LONG}, closing at
          <b>{FRI:,.0f}</b>. Only {D['worseWindows']:,} of {D['totalWindows']:,} five-day
          stretches since {D['startYear']} were worse. Sessions that looked like this were the final low
          <b>{D['wasTheLow']}%</b> of the time and <b>{D['lowerWithin21']}%</b> went on to a
          lower close within the month — yet the median one-month
          return was <b>{D['median21']:+.1f}%</b>. Both are true: a lower low first, a higher price a month on.</p>
      </div>

      <div class="tiles">{tile_html}</div>

      <div class="fig">
        <h2>Where we are</h2>
        <p class="cap">{D["name"]} daily closes, last {len(D["recent"])} sessions. The final five are marked.</p>
        {chart_setup(D, CONFIRM, DAYSHORT)}
      </div>

      <div class="fig">
        <h2>What followed, in {D['nAnalogues']} comparable cases since {D['startYear']}</h2>
        <p class="cap">Index rebased to 100 at the signal day. The band is the middle half of
          outcomes; the line is the median <em>level</em> at each horizon — not a path any one
          case took, because the timing of the dip varies.</p>
        {chart_fan(D)}
      </div>

      <div class="fig">
        <h2>The dip that usually comes first</h2>
        <p class="cap">Deepest close reached within the following month, relative to the signal day.
          Middle half of outcomes: {neg(D['troughP25'])}% to {neg(D['troughP75'])}%.</p>
        {chart_trough(D, DAY)}
        <div class="note"><b>What the median line above hides.</b> Three in four of these cases
          made a lower close within the month — typically about 5% lower, around seven sessions
          out — and still finished it higher. A quarter fell more than {abs(D['troughP25']):.0f}%. 9 and 11 March 2020
          are both in this sample: a 16% chance of having bottomed is not a 16% chance of a mild
          outcome.</div>
      </div>

      <div class="fig">
        <h2>Levels, stated in advance</h2>
        <table>
          <tbody>
            <tr><td class="lvl">Confirms the low is in</td>
                <td>A close back above <b>{CONFIRM:,.0f}</b> (the prior close)</td>
                <td class="n">{100*(CONFIRM/FRI-1):+.1f}%</td></tr>
            <tr><td class="lvl">{DAY}&rsquo;s close</td><td>The reference for everything above</td>
                <td class="n">{FRI:,.0f}</td></tr>
            <tr><td class="lvl">Voids this read</td>
                <td>A close below <b>{VOID:,.0f}</b> opens the fat-tail case</td>
                <td class="n">{neg(100*(VOID/FRI-1))}%</td></tr>
          </tbody>
        </table>
      </div>

      <footer>
        <b>Method.</b> Every prior session since {D['startYear']} where it fell at least {abs(D['week']):.1f}% over five
        sessions <em>and</em> closed at a 40-day low — {D['nAnalogues']} of them — with forward returns measured
        on closing prices. The last session&rsquo;s particular shape (five straight down closes, the worst last)
        was tested as a refinement and does not change the odds, so no edge is claimed from it.
        A base rate is what usually followed, not what will.<br>
        <b>Not investment advice.</b> Historical frequencies are not probabilities of the future,
        and the sample contains outcomes ranging from {neg(D['worst63'], '{:+d}')}% to {D['best63']:+d}% at three months.
      </footer>
    </div></body></html>"""

def render(D, confirm, void, title=None):
    """The page. Sized to exactly one A4 sheet; check it if you edit the copy."""
    return PAGE(D, confirm, void, title)


def to_pdf(html_path, pdf_path):
    """Print the page with whatever headless browser is about."""
    cands = [shutil.which(n) for n in ("chromium", "chromium-browser",
                                       "google-chrome", "google-chrome-stable", "chrome")]
    cands.append("/opt/pw-browsers/chromium")          # this project's container
    browser = next((c for c in cands if c and os.path.exists(c)), None)
    if not browser:
        print("No Chrome or Chromium found. Open the HTML and print it to PDF "
              "(A4, margins none, background graphics on).")
        return False
    # No --user-data-dir: pointing it at a fresh temp directory made Chrome
    # sit there indefinitely instead of printing and exiting.
    try:
        subprocess.run([browser, "--headless", "--no-sandbox", "--disable-gpu",
                        "--no-pdf-header-footer",
                        f"--print-to-pdf={pdf_path}", f"file://{html_path}"],
                       check=True, capture_output=True, timeout=120)
    except subprocess.TimeoutExpired:
        print("The browser did not finish printing. Open the HTML and print it by hand "
              "(A4, margins none, background graphics on).")
        return False
    except subprocess.CalledProcessError as e:
        print(f"{os.path.basename(browser)} failed: {e.stderr.decode('utf-8','replace')[:200]}")
        return False
    return os.path.exists(pdf_path)


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--symbol", default="GSPC")
    ap.add_argument("--out", default=os.path.join(HERE, "briefs"))
    ap.add_argument("--pdf", action="store_true", help="also print it to PDF")
    ap.add_argument("--title", default=None, help="override the headline")
    ap.add_argument("--confirm", type=float, default=None,
                    help="the level that confirms the low (default: the prior session's close)")
    ap.add_argument("--void", type=float, default=None,
                    help="the level that voids the read (default: 10%% below the last close)")
    args = ap.parse_args()

    D = figures(args.symbol)
    confirm = args.confirm if args.confirm is not None else D["recent"][-2]["close"]
    void = args.void if args.void is not None else round(D["close"] * 0.9, -1)

    os.makedirs(args.out, exist_ok=True)
    stem = f"{args.symbol.lower()}-brief-{D['asOf']}"
    html_path = os.path.join(args.out, f"{stem}.html")
    with open(html_path, "w", encoding="utf-8") as fh:
        fh.write(render(D, confirm, void, args.title))
    print(f"{args.symbol} through {D['asOf']}: "
          f"{D['week']:+.2f}% in five sessions, {D['nAnalogues']} analogues "
          f"since {D['startYear']}")
    print(f"  was the low {D['wasTheLow']}% | lower close within a month "
          f"{D['lowerWithin21']}% | median 21d {D['median21']:+.2f}%")
    print(f"wrote {html_path}")

    if args.pdf:
        pdf_path = os.path.join(args.out, f"{stem}.pdf")
        if to_pdf(html_path, pdf_path):
            print(f"wrote {pdf_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
