"""Python mirror of the "Pasted levels" parser in ../scalp_levels.pine, with the cases it has to survive.

Run: python3 test_setups_parser.py   (no output after the summary line means every check passed)

Formats in the box, mixed freely:
  - the A+ Scalp Setups message, on one line or many: ticker, then ❌ Rejection / 🔻 Breakdown /
    🔼 Breakout / 🔄 Bounce, each "emoji trigger emoji targets", then "Bias (before 10:00) …
    (after 10:00) …"
  - "TICKER: bull, bull | bear, bear" lines
Setups are found from the structure, not the names: ❌ and 🔄 always open a setup; 🔻 / 🔼 open one
unless the current setup has its trigger but no targets yet (then they mark the targets). On TSLA
19 Oct the names alone failed in TradingView and Breakdown/Breakout merged into Rejection as T4-T11.
"""
import re

STOP = {"VWAP", "ORB", "ARB", "EMA", "RSI", "ATH", "HOD", "LOD", "ET", "AM", "PM"}


def kind_word(u):
    for kind, key in (("Rejection", "REJECT"), ("Breakdown", "BREAKDOWN"), ("Breakout", "BREAKOUT"), ("Bounce", "BOUNCE")):
        if key in u:
            return kind
    return ""


def kind_emoji(t):
    return "Rejection" if "❌" in t else "Bounce" if "🔄" in t else "Breakdown" if "🔻" in t else "Breakout" if "🔼" in t else ""


def num(t):
    try:
        return float(t)
    except ValueError:
        return None


def parse(text, me):
    simple, setups, pre, post, stream = None, [], "", "", ""
    for ln0 in text.replace("\r", "").split("\n"):
        ln = ln0.replace(" ", "").replace("\t", "").upper()
        if re.search(r"^[A-Z0-9._!]+(:[A-Z0-9._!]+)?:[0-9]", ln):
            parts = ln.split(":")
            if parts[-2] == me:
                simple = parts[-1]
        else:
            stream += " |NL| " + ln0
    cur = mode = part = skip = ""
    cs = None
    for tok0 in stream.replace("\t", " ").split(" "):
        tok = tok0.replace(",", "")
        if tok == "":
            continue
        if tok == "|NL|":
            if mode == "bias" and part == "post":
                mode = ""
            continue
        skip_in, skip = skip, ""
        is_num = num(tok) is not None
        has_word = bool(re.search(r"[A-Za-z]{3,}", tok))
        emo = kind_emoji(tok)
        word = "" if mode == "bias" else kind_word(tok.upper())
        opn = ""
        if re.search(r"^[A-Z]{1,6}$", tok) and tok not in STOP:
            cur, mode, part, cs = tok, "", "", None
        elif emo and (emo in ("Rejection", "Bounce") or has_word or cs is None or cs["tgts"] or mode != "setup"):
            opn = skip = emo
        elif emo:
            pass
        elif word and word != skip_in:
            opn = word
        elif word and word == skip_in:
            pass
        elif "counter-trend" in tok:
            if cs:
                cs["counter"] = True
        elif tok == "Bias":
            mode, cs = "bias", None
        elif mode == "bias":
            if "(before" in tok:
                part = "pre"
            elif "(after" in tok:
                part = "post"
            elif cur == me and not re.search(r"^[0-9]{1,2}:[0-9]{2}\)?$", tok):
                if part == "pre":
                    pre = (pre + " " + tok).strip()
                elif part == "post":
                    post = (post + " " + tok).strip()
        elif mode == "setup" and cs is not None and is_num:
            if cs["trig"] is None:
                cs["trig"] = num(tok)
            else:
                cs["tgts"].append(num(tok))
        if opn:
            mode, cs = "setup", None
            if cur == me:
                cs = {"kind": opn, "trig": None, "tgts": [], "counter": False}
                setups.append(cs)
    return simple, setups, pre, post


ONE_LINE_OCT19 = ("A+ Scalp Setups - Mon Oct 19 SPY ❌ Rejection 768.61 🔻 767.46, 766.41, 765.42 🔻 Breakdown 766.97 🔻 765.69, 764.65, 763.23 "
                  "🔼 Breakout 768.42 🔼 769.74, 770.78, 772.62 ⚠️ counter-trend 🔄 Bounce 766.41 🔼 768.10, 769.31, 771.23 Bias (before 10:00) "
                  "Bearish — watch for rejection first (after 10:00) Bearish — watch for rips to be likely sold TSLA ❌ Rejection 357.83 🔻 354.47, "
                  "352.62, 350.80 🔻 Breakdown 354.86 🔻 352.97, 351.38, 345.88 🔼 Breakout 357.32 🔼 361.09, 362.68, 365.96 🔄 Bounce 352.97 🔼 "
                  "354.86, 356.71, 359.31 Bias (before 10:00) Lean Bearish — watch for rejection first (after 10:00) Lean Bearish — watch for "
                  "rips to be likely sold")
MULTI_LINE_OCT20 = """A+ Scalp Setups - Tues Oct 20

SPY
❌ Rejection 768.01 🔻 766.77, 765.69, 764.43
🔻 Breakdown 763.55 🔻 762.13, 761.10, 759.48
🔼 Breakout 766.77 🔼 767.85, 768.88, 771.23
🔄 Bounce 765.82 🔼 767.66, 768.86, 771.12
Bias (before 10:00) Neutral — watch for bounce first
(after 10:00) Neutral — watch for two-way trade environment

NVDA
❌ Rejection 218.10 🔻 217.41, 216.34, 215.08
🔻 Breakdown 214.75 🔻 213.33, 212.41, 208.93
🔼 Breakout 217.41 🔼 218.33, 219.25, 220.78 ⚠️ counter-trend
🔄 Bounce 216.15 🔼 217.75, 218.82, 220.78
Bias (before 10:00) Bearish — watch for rejection first
(after 10:00) Bearish — watch for rips to be likely sold

MSFT: 539.53, 543.16, 544.98, 553.72 | 536.30, 534.70, 532.89, 528.77"""


def shape(setups):
    return [(s["kind"], s["trig"], len(s["tgts"]), s["counter"]) for s in setups]


TSLA_19 = [("Rejection", 357.83, 3, False), ("Breakdown", 354.86, 3, False), ("Breakout", 357.32, 3, False), ("Bounce", 352.97, 3, False)]
CASES = [
    ("one line", ONE_LINE_OCT19, "TSLA", TSLA_19),
    ("misspelled names", ONE_LINE_OCT19.replace("Breakdown", "Brеakdown").replace("Breakout", "Brеakout"), "TSLA", TSLA_19),  # Cyrillic е
    ("no names, emoji only", re.sub(r" (Rejection|Breakdown|Breakout|Bounce)", "", ONE_LINE_OCT19), "TSLA", TSLA_19),
    ("multi-line, two-line bias", MULTI_LINE_OCT20, "NVDA",
     [("Rejection", 218.10, 3, False), ("Breakdown", 214.75, 3, False), ("Breakout", 217.41, 3, True), ("Bounce", 216.15, 3, False)]),
]

if __name__ == "__main__":
    failures = 0
    for name, text, me, want in CASES:
        got = shape(parse(text, me)[1])
        if got != want:
            failures += 1
            print(f"FAIL {name}: {got}")
    simple, setups, pre, post = parse(MULTI_LINE_OCT20, "SPY")
    if (pre, post) != ("Neutral — watch for bounce first", "Neutral — watch for two-way trade environment"):
        failures += 1
        print("FAIL bias:", pre, "|", post)
    if parse(MULTI_LINE_OCT20, "MSFT")[0] != "539.53,543.16,544.98,553.72|536.30,534.70,532.89,528.77":
        failures += 1
        print("FAIL simple line")
    print(f"{len(CASES) + 2 - failures}/{len(CASES) + 2} checks passed")
