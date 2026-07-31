# COMPLETE vs EXHAUSTIVE — the two failure modes, and how to tell them apart

`SKILL.md` § Purpose carries the two definitions. This file carries the diagnostics: the symptom of
each failure, why neither is visible without a deliberate check, and the one-question test that
assigns a control point to its bucket.

## The one-question test

Ask these in order. Each control point answers exactly one of them, and that answer **is** its bucket.

- **COMPLETE** — *if I answer from this data, is the number I state the right number?*
- **EXHAUSTIVE** — *is the population I answered over the whole population the user meant?*

A control point that seems to answer both is really two control points; split it.

## Symptom, detectability, remedy

| | COMPLETE fails | EXHAUSTIVE fails |
|---|---|---|
| Symptom | Right scope, wrong number | Right number, wrong scope |
| Detectability | Silent — needs a cross-check | Silent — needs a census |
| Example | a balance flagged `verification_error` → cash off by a known amount | a second bank connected but never configured → whole account absent |
| Remedy shape | Repair / re-verify / re-classify the record | Connect / backfill / widen the window |

## Why the distinction is load-bearing

**COMPLETE is about the quality of what we have.** It fails silently, and it is the dangerous one:
the answer looks confident and is wrong by a specific amount. A balance snapshot that exists but
whose transactions don't sum to it produces a cash figure that is precisely, quietly incorrect.

**EXHAUSTIVE is about the coverage of what we have.** It fails visibly-in-hindsight: the answer is
correct for the subset it saw and wrong for the business. A runway computed from one of three bank
accounts is arithmetically perfect and materially false.

A sweep that checks only one of the two gives false confidence. The two buckets **partition** the
run — every control point declares one and only one — which is what lets the report route each
finding to the right fix, and what makes the two verdicts meaningful when reported separately.
