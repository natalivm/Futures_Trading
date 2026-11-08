#!/usr/bin/env python3
"""
Catch the compile errors a scripted edit to a Pine file tends to introduce.

There is no Pine compiler outside TradingView, so this checks the handful of
things that have actually gone wrong here: a helper function deleted by a
slice between two comment anchors, a block left without a body, a function
indented out of global scope, and unbalanced brackets.

    python3 tradingview/summation_series/check_pine.py <file.pine>
"""
import re
import sys


def duplicate_definitions(lines):
    """Top-level identifiers declared twice.

    Pine refuses a redeclaration, and a merge is exactly how one turns up: a
    block lifted from another script carries its own copy of something the
    host file already has. That is how barDays / tfUsable / tfCoarse arrived
    twice when the moon section was folded into the summation script.
    """
    seen, dupes = {}, []
    pat = re.compile(
        r"^(?:(?:var\s+)?(?:float|int|bool|string|color|line|label|table|box"
        r"|array<[^>]+>)\s+)?([A-Za-z_]\w*)\s*(?::?=)(?!=)")
    for i, raw in enumerate(lines, 1):
        if not raw or raw[0].isspace() or raw.lstrip().startswith("//"):
            continue
        m = pat.match(raw)
        if not m:
            continue
        name = m.group(1)
        if name in seen:
            dupes.append(f"line {i}: {name} was already declared at line {seen[name]}")
        else:
            seen[name] = i
    return dupes


def check(path):
    lines = open(path).read().split("\n")
    # strip comments so string and comment text cannot trip the checks
    code = [l.split("//")[0] if not l.strip().startswith("//") else "" for l in lines]
    src = "\n".join(code)
    bad = []

    opens = sum(l.count("(") for l in code) - sum(l.count(")") for l in code)
    brack = sum(l.count("[") for l in code) - sum(l.count("]") for l in code)
    if opens:
        bad.append(f"unbalanced parentheses: {opens:+d}")
    if brack:
        bad.append(f"unbalanced brackets: {brack:+d}")

    # every helper that is called must also be defined
    defined = set(re.findall(r"^([a-zA-Z_]\w*)\s*\([^)]*\)\s*=>", src, re.M))
    for name in defined:
        if len(re.findall(rf"(?<![\w.]){name}\s*\(", src)) < 2:
            bad.append(f"{name}() is defined but never called")
    # names that only ever occur inside double-quoted strings are prose
    strings = " ".join(re.findall(r'"[^"]*"', "\n".join(lines)))
    builtin = re.compile(
        r"^(if|for|while|and|or|not|input|math|array|str|ta|label|line|box|table|color|size|"
        r"xloc|yloc|extend|close|high|low|open|time|bar_index|na|nz|int|float|bool|string|var|"
        r"indicator|plot|plotshape|barstate|timestamp|request|alert|fixnan|syminfo|hline)$")
    called = set(re.findall(r"(?<![.\w])([a-z][A-Za-z0-9_]*)\s*\(", src))
    for name in sorted(called - defined):
        if not builtin.match(name) and f"{name}(" not in strings and name not in strings.split():
            bad.append(f"{name}() is called but never defined")

    # a user function must sit at global scope
    for i, l in enumerate(lines, 1):
        if "=>" in l and l.startswith(" ") and re.match(r"\s+[a-zA-Z_]\w*\s*\(", l):
            bad.append(f"line {i}: function defined inside a block")

    # a block opener needs a more-indented line under it
    for i, l in enumerate(code[:-1]):
        if re.match(r"^\s*(if|for|while|else)\b", l):
            depth = len(l) - len(l.lstrip())
            j = i + 1
            while j < len(code) and not code[j].strip():
                j += 1
            if j < len(code) and (len(code[j]) - len(code[j].lstrip())) <= depth:
                bad.append(f"line {i + 1}: block with no body")

    # A loop over an array that can be empty counts DOWN in Pine and throws.
    # A guard can sit on any ENCLOSING block, not just the line above, so walk
    # outwards through the headers. `// safe:` marks one the checker cannot
    # infer, such as a flag that is only set when the array is populated.
    literal = {m for m in re.findall(r"(\w+)\s*=\s*array\.from\(", src)}
    for i, l in enumerate(lines, 1):
        m = re.match(r"^(\s*)for \w+ = 0 to array\.size\((\w+)\) - 1\s*(?://.*)?$", l)
        if not m:
            continue
        arr, depth = m.group(2), len(m.group(1))
        if arr in literal or "// safe:" in l or "// safe:" in lines[i - 2]:
            continue
        guarded = False
        for j in range(i - 2, -1, -1):
            prev, stripped = lines[j], lines[j].strip()
            if not stripped or stripped.startswith("//"):
                continue
            d = len(prev) - len(prev.lstrip())
            if d >= depth:
                continue
            depth = d
            if f"array.size({arr})" in prev:
                guarded = True
                break
            if d == 0:
                break
        if not guarded:
            bad.append(f"line {i}: unguarded loop over {arr} (empty array runs backwards)")

    bad += duplicate_definitions(lines)

    print(f"{path}: {len(lines)} lines")
    for b in bad:
        print(f"  ✗ {b}")
    if not bad:
        print("  ✓ no structural problems found")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(max(check(p) for p in (sys.argv[1:] or ["tradingview/summation_series/summation_series.pine"])))
