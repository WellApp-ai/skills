# The monthly sweep spine

Full detail behind PART A of SKILL.md: the sweep window and its cap, the four single-run month verdicts, month ordering, multi-workspace rules and the SPINE- control points. Open when enumerating months.

---

# PART A — THE SPINE: sweep month by month

**The sweep unit is `(workspace × month)`.** Not "the workspace", not "the trailing 90 days" — the
month, because that is the unit the business actually closes and the unit the product already
exposes.

### A.1 The month picker, when one is present

A month-grid picker exists in the product — a desk-calendar year view of twelve mini month-panels with
per-day dots, year navigation and one selectable month (`apps/web/src/features/chat/components/ai-elements/custom-tags/ai-close-month-picker-tag.tsx`,
accepting `year`, `min-year`, `max-year`, `workspace-id`); it is rendered by the close flow, carries
close-flow copy, and fetches its own month state rather than taking state from the LLM.

**The sweep does not require it.** The sweep unit is `(workspace × month)` regardless of what surface
selected the month, and a CLI or headless run has no picker at all. Where a picker *is* rendered for a
sweep, the copy it shows is checked by `SPINE-07`; where none is rendered, that check is not applicable.

### A.2 The sweep's month verdict — four values, all determinable by one run

Close-readiness is **one input among many**, not the driver. A month can be perfectly closeable and
still fail this sweep (uncategorized spend, no receipts, unlinked IBANs), and a month can be
`not_ready` for reasons the sweep does not own. So the sweep states its own verdict per month.

**Every value below describes what THIS run found.** None of them describes sweep history, because
there is none — every run is cold (`iteration-protocol.md`). "Never swept before" and "swept
previously and was clean" are both unknowable and are not states here.

| month verdict | meaning — as determined by this run | how it is reached |
|---|---|---|
| `HAS_FINDINGS` | swept this run; at least one red or amber above the reporting floor | full control-point set ran; output is the remediation list |
| `NO_FINDINGS` | swept this run; the control points that ran found nothing above the floor. **Not** a claim that the month is clean forever, and **not** a claim it was clean before | full control-point set ran. Carries `(partial — N not evaluated)` whenever any control point was INCONCLUSIVE or SAMPLED |
| `EMPTY` | swept this run; genuinely no data in the period | emptiness sweep only — assert the month is empty *because nothing happened*, not because a connector never synced. That false-quiet is the most dangerous state in this skill (`SPINE-04`) |
| `UNSWEPT` | **outside this run's window** — older than the 6-month cap in A.3, or a later month not reached before the budget ran out. Never "not swept in the past" | nothing ran; report as `UNSWEPT — outside budget` and never as clean |

**Day dots carry this run's findings, not posting status.** A day with a red finding, a day with only
ambers, and a day with none are three different dots — which turns a calendar into a heat map of *where
in the month* the data breaks, and it is the same rendering primitive a close-progress dot uses.

**Where close-readiness still belongs:** as a cross-check. If the sweep says `NO_FINDINGS` while
close-readiness says `not_ready`, one of the two is wrong — that contradiction is a finding
(`SPINE-03`), not something to reconcile silently.

**What this deletes, and why.** The old model had `UNSWEPT` meaning "never swept, or stale beyond the
sweep interval" and `CLEAN` meaning "swept, no findings" with a *reduced* regression-only subset of
checks and a "new red here is a regression alarm" rule. Both needed a record of previous sweeps.
Without one, every month is `UNSWEPT` on every run forever, and the reduced subset would silently
under-check a month on the strength of a prior sweep that cannot be shown to exist. So: `UNSWEPT` now
means only "outside this run's window", `NO_FINDINGS` replaces `CLEAN` and gets the **full** set of
checks like any other month, and the regression alarm (`SPINE-05`) is gone.

### A.3 The window — oldest open month first, capped at 6 months

**One window, one cap, no second definition anywhere:**

- **Start** at the **oldest non-`closed` month**, and sweep **ascending** from there.
- **Cap at 6 months.** A run sweeps at most 6 months per workspace.
- **Anything older than the cap is reported `UNSWEPT — outside budget`**, named explicitly, never
  omitted and never implied clean.

**"Non-`closed`" cannot be read from the MCP surface, and the sweep must not pretend otherwise.**
There is no `CloseReadinessStatus` root and no other queryable close-state field — confirmed
against the 33 live roots (`schema-facts.md`, `mcp-surface-limits.md`). So the start month is
resolved this way, in order:

1. **The user names a month or workspace explicitly** — use it. This is the common case for a
   targeted re-check and needs no close-state lookup at all.
2. **Otherwise, default the start month to the oldest month with any data** (a row in
   `transactions`, `account_balances`, or `invoices`) inside a trailing 6-month lookback from
   today, ascending from there. This is a **data-presence** default, not a close-state judgement —
   it never claims to know which of those months is actually closed in the accounting sense.

State which of the two resolved the start month in the output. A sweep must never assert a month
is "closed" or "open" on its own authority; that claim belongs to the close flow, which has the
field this skill does not.

Ascending order because close is a chain: a defect in an older open month blocks every month after it,
so reporting the newest month first sends the user to fix a symptom. State the chain explicitly in the
output: *"March is closeable; January is `not_ready` — fix January first or the chain stalls."*

The cap exists because the start rule is otherwise unbounded. A workspace whose oldest open month is
two years back yields ~30 months × ~180 control points — a run that cannot finish, and whose failure
mode is a truncated sweep reported as a complete one. Six months covers the trailing quarter that is
actually being closed plus the run-up to it, and it makes the worst-case cost of a run knowable before
it starts. An older month that genuinely needs attention is swept by pointing the run at it directly,
not by letting every run walk the whole history.

### A.4 Multi-workspace

Loop workspaces from `well_list_workspaces`, run the month spine per workspace, and **never merge
verdicts across workspaces** (§ SCOPE WARNING). Every verdict is reported against its own
`workspace_id`; a workspace with a finding is named, never folded into a group figure.

**There is no parent/child consolidation.** An earlier version of this section had a parent's verdict
be the *intersection* of its own and its children's, which is a merge across workspaces and so
contradicts the rule in the sentence above it. It is also not implementable: `workspaces` exposes no
field identifying a parent, so the hierarchy the rule needs cannot be read. Report per workspace. If a
parent field is ever identified, a consolidation rule has to be argued against the no-merge rule
first, not assumed.

### A.5 Spine control points

| id | name | bucket | check | sev |
|---|---|---|---|---|
| `SPINE-01a` | **Workspace enumeration succeeded** (gate 0, **halting**) | exhaustive | `well_list_workspaces` returned a workspace set | red — with no subject list there is nothing to sweep and nothing to scope a verdict to |
| `SPINE-01b` | **Every enumerated workspace produced results** (gate 9, **non-halting**) | exhaustive | the set from `SPINE-01a` vs workspaces with results; name the missing ones | red — a skipped workspace must never read as clean, but a gap found after the run is a scope finding, not a reason to discard the run |
| `SPINE-02` | Every month the run declared in-scope has a result (gate 1) | exhaustive | **self-consistency, not an external lookup.** The window rule (A.3) fixes the declared month range before any control point runs; compare that declared set against the months this run actually produced a verdict for. No MCP root is read — there is no `CloseReadinessStatus` root or equivalent (`schema-facts.md`), so this can never be checked against an external "months that exist" source, only against the sweep's own declared scope | red — a month the run itself committed to sweeping but silently skipped |
| `SPINE-03` | Sweep verdict agrees with close-readiness (gate 1) | complete | **INCONCLUSIVE — no close-state field exists on the MCP surface.** As specified: month verdict per A.2 vs `CloseReadinessStatus`. That root does not exist and appears in no root list; emit INCONCLUSIVE, never a colour, until a close-state root is added to the MCP surface | not evaluable — blocked |
| `SPINE-04` | **`EMPTY` is genuine, not false quiet** (gate 1) | exhaustive | month `EMPTY` **and** an enabled connector covering that period exists **and** zero rows ingested | red — the most dangerous state in this skill |
| `SPINE-06` | Coverage contiguous within the month (gate 1) | exhaustive | a run of no-data days inside an otherwise populated month | amber — coverage gap, distinct from a posting gap |
| `SPINE-07` | Rendered picker copy matches the sweep it is driving (gate 1) | complete | **applicable only when a month picker was actually rendered for this run.** If it was, and it shows close-flow copy, the check fires. **Not applicable** — never amber — for a CLI or headless run, which has no picker | amber — a card that asks "close your books?" will be answered as a close, and the sweep intent is lost |

**Deleted from this table:** `SPINE-05` ("no regression on a settled month"). It compared this run's
reds against a prior sweep's, and there is no prior sweep to compare against — so it could never fire,
in either direction. Recorded here rather than dropped silently, per the skill's own rule that a check
it cannot make is named.
