#!/usr/bin/env python3
"""Lunar ephemeris, stdlib only — enough of it to date the cycles the course
uses as swing-trade triggers.

Three different cycles get called "the lunar cycle" and they are not the same
length. The course is explicit about this and it matters here, because a test
run on the wrong one tests nothing:

  synodic   29.53 days  new moon to new moon. What most people mean.
  sidereal  27.32 days  the moon's longitude once round the zodiac.
  draconic  27.21 days  north node to north node. THIS is the one the course
                        trades, because the moon meets the north node (Rahu),
                        then the south node (Ketu) a fortnight later.

Moon conjunct Rahu is the moon crossing the ascending node, which is the
moment its ecliptic latitude passes zero going north; Ketu is the descending
crossing. So no zodiac is involved in finding them — they are the two zeros of
the moon's latitude each draconic month, and that is a plain root-find.

Positions come from the main periodic terms of Meeus, Astronomical Algorithms
ch. 47 and 25. Good to roughly a minute of arc, which is far finer than a
daily bar needs; the honest limit on anything built from this is the bar, not
the ephemeris.
"""
import math

D2R = math.pi / 180.0
J2000 = 2451545.0
SYNODIC, SIDEREAL, DRACONIC = 29.530588, 27.321582, 27.212221


def jd_from_unix(ts):
    return ts / 86400.0 + 2440587.5


def unix_from_jd(j):
    return (j - 2440587.5) * 86400.0


def jd_from_ymd(y, m, d):
    if m <= 2:
        y, m = y - 1, m + 12
    a = y // 100
    b = 2 - a + a // 4
    return math.floor(365.25 * (y + 4716)) + math.floor(30.6001 * (m + 1)) + d + b - 1524.5


def ymd_from_jd(j):
    j += 0.5
    z, f = int(j), j - int(j)
    a = z
    if z >= 2299161:
        al = int((z - 1867216.25) / 36524.25)
        a = z + 1 + al - al // 4
    b = a + 1524
    c = int((b - 122.1) / 365.25)
    d = int(365.25 * c)
    e = int((b - d) / 30.6001)
    day = b - d - int(30.6001 * e) + f
    month = e - 1 if e < 14 else e - 13
    year = c - 4716 if month > 2 else c - 4715
    return year, month, day


def iso(j):
    y, m, d = ymd_from_jd(j)
    hh = (d - int(d)) * 24
    return f"{y:04d}-{m:02d}-{int(d):02d} {int(hh):02d}:{int((hh%1)*60):02d}"


def date_str(j):
    y, m, d = ymd_from_jd(j)
    return f"{y:04d}-{m:02d}-{int(d):02d}"


def _args(jd):
    """The fundamental arguments, in degrees."""
    t = (jd - J2000) / 36525.0
    D  = 297.8501921 + 445267.1114034 * t - 0.0018819 * t * t + t ** 3 / 545868.0
    M  = 357.5291092 + 35999.0502909 * t - 0.0001536 * t * t
    Mp = 134.9633964 + 477198.8675055 * t + 0.0087414 * t * t + t ** 3 / 69699.0
    F  = 93.2720950 + 483202.0175233 * t - 0.0036539 * t * t - t ** 3 / 3526000.0
    L  = 218.3164477 + 481267.88123421 * t - 0.0015786 * t * t + t ** 3 / 538841.0
    return [x % 360.0 for x in (D, M, Mp, F, L)], t


def moon_latitude(jd):
    """Ecliptic latitude of the moon, degrees. Zero at a node crossing."""
    (D, M, Mp, F, _), t = _args(jd)
    e = 1 - 0.002516 * t - 0.0000074 * t * t
    d, m, mp, f = D * D2R, M * D2R, Mp * D2R, F * D2R
    b = (5128122 * math.sin(f)
         + 280602 * math.sin(mp + f)
         + 277693 * math.sin(mp - f)
         + 173237 * math.sin(2 * d - f)
         + 55413 * math.sin(2 * d - mp + f)
         + 46271 * math.sin(2 * d - mp - f)
         + 32573 * math.sin(2 * d + f)
         + 17198 * math.sin(2 * mp + f)
         + 9266 * math.sin(2 * d + mp - f)
         + 8822 * math.sin(2 * mp - f)
         + 8216 * e * math.sin(2 * d - m - f)
         + 4324 * math.sin(2 * d - 2 * mp - f)
         + 4200 * math.sin(2 * d + mp + f)
         - 3359 * e * math.sin(2 * d + m - f)
         + 2463 * e * math.sin(2 * d - m - mp + f)
         + 2211 * e * math.sin(2 * d - m + f)
         + 2065 * e * math.sin(2 * d - m - mp - f)
         - 1870 * e * math.sin(m - mp - f)
         + 1828 * math.sin(4 * d - mp - f)
         - 1794 * e * math.sin(m + f))
    return b / 1000000.0


def moon_longitude(jd):
    """Apparent ecliptic longitude of the moon, degrees."""
    (D, M, Mp, F, L), t = _args(jd)
    e = 1 - 0.002516 * t - 0.0000074 * t * t
    d, m, mp, f = D * D2R, M * D2R, Mp * D2R, F * D2R
    s = (6288774 * math.sin(mp)
         + 1274027 * math.sin(2 * d - mp)
         + 658314 * math.sin(2 * d)
         + 213618 * math.sin(2 * mp)
         - 185116 * e * math.sin(m)
         - 114332 * math.sin(2 * f)
         + 58793 * math.sin(2 * d - 2 * mp)
         + 57066 * e * math.sin(2 * d - m - mp)
         + 53322 * math.sin(2 * d + mp)
         + 45758 * e * math.sin(2 * d - m)
         - 40923 * e * math.sin(m - mp)
         - 34720 * math.sin(d)
         - 30383 * e * math.sin(m + mp)
         + 15327 * math.sin(2 * d - 2 * f)
         - 12528 * math.sin(mp + 2 * f)
         + 10980 * math.sin(mp - 2 * f))
    return (L + s / 1000000.0) % 360.0


def sun_longitude(jd):
    """Apparent ecliptic longitude of the sun, degrees."""
    t = (jd - J2000) / 36525.0
    L0 = (280.46646 + 36000.76983 * t + 0.0003032 * t * t) % 360.0
    M = (357.52911 + 35999.05029 * t - 0.0001537 * t * t) % 360.0
    mr = M * D2R
    c = ((1.914602 - 0.004817 * t - 0.000014 * t * t) * math.sin(mr)
         + (0.019993 - 0.000101 * t) * math.sin(2 * mr)
         + 0.000289 * math.sin(3 * mr))
    return (L0 + c) % 360.0


def _roots(f, start, end, step, jump=90.0):
    """Every sign change of f over [start, end], refined by bisection.

    `jump` rejects the discontinuity, which is not optional here: an angle
    folded into (-180, 180] crosses zero at its root AND falls off a cliff
    from +180 to -180 half a cycle later. Both look like sign changes, so the
    first version of this found two new moons per lunation and reported the
    synodic month as 14.77 days — exactly half, which is the tell.
    """
    out = []
    a, fa = start, f(start)
    while a < end:
        b = min(a + step, end)
        fb = f(b)
        if fa == 0.0:
            out.append(a)
        elif fa * fb < 0 and abs(fa) < jump and abs(fb) < jump:
            lo, hi, flo = a, b, fa
            for _ in range(60):
                mid = (lo + hi) / 2.0
                fm = f(mid)
                if flo * fm <= 0:
                    hi = mid
                else:
                    lo, flo = mid, fm
            out.append((lo + hi) / 2.0)
        a, fa = b, fb
    return out


def node_crossings(start_jd, end_jd):
    """(jd, 'rahu'|'ketu') for every node passage in the span.

    Rahu is the ascending crossing — latitude going from south to north.
    Ketu is the descending one, a little under a fortnight later.
    """
    out = []
    for j in _roots(moon_latitude, start_jd, end_jd, 1.0):
        rising = moon_latitude(j + 0.02) > moon_latitude(j - 0.02)
        out.append((j, "rahu" if rising else "ketu"))
    return out


def phases(start_jd, end_jd):
    """(jd, 'new'|'full') for every syzygy in the span."""
    def elong(j):
        return ((moon_longitude(j) - sun_longitude(j) + 180.0) % 360.0) - 180.0

    def opp(j):
        return ((moon_longitude(j) - sun_longitude(j)) % 360.0) - 180.0

    return (sorted([(j, "new") for j in _roots(elong, start_jd, end_jd, 1.0)]
                   + [(j, "full") for j in _roots(opp, start_jd, end_jd, 1.0)]))


def calendar(days=120, from_jd=None):
    """The node crossings and syzygies still to come."""
    import datetime as _dt
    j0 = from_jd if from_jd is not None else jd_from_unix(_dt.datetime.now(_dt.UTC).timestamp())
    rows = [(j, k) for j, k in node_crossings(j0, j0 + days)]
    rows += [(j, k) for j, k in phases(j0, j0 + days)]
    rows.sort()
    return j0, rows


def _print_calendar(days):
    j0, rows = calendar(days)
    print(f"from {iso(j0)} UT, the next {days} days\n")
    print(f"  {'what':<10} {'when (UT)':<18} {'in'}")
    for j, k in rows:
        name = {"rahu": "Rahu", "ketu": "Ketu", "new": "new moon", "full": "full moon"}[k]
        print(f"  {name:<10} {iso(j):<18} {j - j0:5.1f} d")
    print("\n  These dates are astronomy, not a forecast. What the market does on")
    print("  them is a separate question — see cycles/backtest_moon.py.")


if __name__ == "__main__":
    import sys as _sys
    if "--ahead" in _sys.argv:
        i = _sys.argv.index("--ahead")
        _print_calendar(int(_sys.argv[i + 1]) if len(_sys.argv) > i + 1 else 120)
        raise SystemExit(0)

    # Eclipses are the check: a solar eclipse is a new moon AT a node, so both
    # routines have to land on the same day, and a published one pins them.
    print("validation — a solar eclipse is a new moon within hours of a node\n")
    for y, m, d, what in [(1999, 8, 11, "total solar, 11:03 UT"),
                          (2017, 8, 21, "total solar, 18:26 UT"),
                          (2023, 10, 14, "annular solar, 18:00 UT"),
                          (2024, 4, 8, "total solar, 18:17 UT"),
                          (2026, 8, 12, "total solar, 17:46 UT")]:
        j0 = jd_from_ymd(y, m, d)
        ns = [p for p in phases(j0 - 2, j0 + 2) if p[1] == "new"]
        nd = node_crossings(j0 - 3, j0 + 3)
        print(f"  {y}-{m:02d}-{d:02d}  {what}")
        for j, k in ns:
            print(f"     new moon  {iso(j)} UT")
        for j, k in nd:
            print(f"     {k:<5}     {iso(j)} UT   ({abs(j-ns[0][0])*24:.1f} h from the new moon)")
    print(f"\nmean lengths over 2000-2026, measured from the roots themselves:")
    a, b = jd_from_ymd(2000, 1, 1), jd_from_ymd(2026, 1, 1)
    nd = node_crossings(a, b)
    rh = [j for j, k in nd if k == "rahu"]
    ph = [j for j, k in phases(a, b) if k == "new"]
    print(f"   draconic {(rh[-1]-rh[0])/(len(rh)-1):.6f} d   (book value {DRACONIC})")
    print(f"   synodic  {(ph[-1]-ph[0])/(len(ph)-1):.6f} d   (book value {SYNODIC})")
