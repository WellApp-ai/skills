# The monthly sweep spine

Full detail behind PART A of SKILL.md: month-picker reuse, the four sweep states, month ordering, multi-workspace rules and the SPINE- control points. Open when enumerating months or rendering the picker.

---

# PART A — THE SPINE: sweep month by month

**The sweep unit is `(workspace × month)`.** Not "the workspace", not "the trailing 90 days" — the
month, because that is the unit the business actually closes and the unit the product already
exposes.

### A.1 Reuse the month-picker component — as a SWEEP picker, not a close picker

The sweep's entry surface is the existing month-grid picker
(`apps/web/src/features/chat/components/ai-elements/custom-tags/ai-close-month-picker-tag.tsx`): a
desk-calendar year view, twelve mini month-panels, each day a dot, year navigation, one selectable
month. **That geometry is exactly right for a monthly sweep.** What is wrong for a sweep is its
*content* — it currently says "Close your books".

**So the skill re-labels the card.** The component supplies the shape; the sweep supplies the
meaning. It is a month picker that happens to be used by the close flow today, not a close artefact
the sweep is borrowing.

### What the skill must override

| what | today (hardcoded) | the sweep needs |
|---|---|---|
| Title | `chat.bookkeeping.closeMonthPicker.title` → *"Close your books"* | *"Sweep a month"* |
| Subtitle | `.subtitle` → *"For which month do you want to close your books?"* | *"Which month should I check for complete and exhaustive data?"* |
| Context label | `.context` → *"Closing books for"* | *"Sweeping"* |
| Disabled-month copy | `.monthClosed` → *"{month} is already closed"* · `.monthLocked` → *"{month} can't be closed yet"* | *"{month} was swept and is clean"* · *"{month} has no data to sweep"* |
| Dot grammar | close-readiness (posted / progress / neutral) | **sweep findings per day** — see A.2 |

**Required component change, stated plainly:** `title` and `subtitle` are read from fixed i18n keys
(`ai-close-month-picker-tag.tsx:118, 265-266`) and there are **no props to override them** — the tag
accepts only `year`, `min-year`, `max-year`, `workspace-id`. So the sweep cannot re-label it today.
The change is small and belongs in the component, not in a fork:

- add an optional **`mode`** prop (`"close" | "sweep"`, default `"close"`) that selects the i18n
  namespace — `chat.bookkeeping.closeMonthPicker.*` vs a new `chat.bookkeeping.monthSweepPicker.*`
  block — so copy stays in i18n and is translatable, rather than being passed as raw strings through
  a tag attribute;
- have `mode` also select the state vocabulary and dot semantics (A.2);
- keep everything else — grid, year nav, keyboard, loading-as-locked behaviour — untouched.

**Do not fork the component into `<ai-sweep-month-picker />`.** One logical object, one
implementation, varied by a prop — the density/variant rule. A fork would drift the two calendars
apart within a release.

**Keep the one behaviour that matters most:** the card **does not trust LLM-emitted state.** The LLM
emits only the year bounds; the card fetches its own authoritative snapshot and renders every month
as LOCKED while in flight, so it never shows a spurious selectable state. The sweep variant must
fetch its own month verdicts the same way — the AI writes the *copy*, never the *state*.

### A.2 The sweep's month state — its own vocabulary

Close-readiness is **one input among many**, not the driver. A month can be perfectly closeable and
still fail this sweep (uncategorized spend, no receipts, unlinked IBANs), and a month can be
`not_ready` for reasons the sweep does not own. So the sweep needs its own four states:

| sweep state | meaning | selectable? | what runs |
|---|---|---|---|
| `HAS_FINDINGS` | swept, reds or ambers open | **yes** — the primary target | full sweep; output is the remediation list |
| `UNSWEPT` | never swept, or stale beyond the sweep interval | **yes** | full sweep |
| `CLEAN` | swept, no findings above the reporting floor | yes (re-sweep) | regression subset only — structural checks that must hold forever (tenancy, dangling refs, duplicate identity). **Do not** re-run grace-window or freshness checks on a settled month; they fire on history. A new red here is a **regression alarm**. |
| `EMPTY` | genuinely no data in the period | no | **emptiness sweep only** — assert the month is empty *because nothing happened*, not because a connector never synced. That false-quiet is the most dangerous state in this skill (`SPINE-04`). |

**Day dots carry sweep findings, not posting status.** A day with a red finding, a day with only
ambers, and a clean day are three different dots — which turns the calendar into a heat map of *where
in the month* the data breaks. That is strictly more useful than a close-progress dot, and it is the
same rendering primitive.

**Where close-readiness still belongs:** as a cross-check. If the sweep says a month is `CLEAN` while
close-readiness says `not_ready`, one of the two is wrong — that contradiction is a finding
(`SPINE-03`), not something to reconcile silently.

### A.3 Month ordering — oldest open first

Sweep months in **ascending** order from the oldest non-`closed` month. Rationale: close is a chain.
A defect in an older open month blocks every month after it, so reporting the newest month first
sends the user to fix a symptom. State the chain explicitly in the output: *"March is closeable;
January is `not_ready` — fix January first or the chain stalls."*

### A.4 Multi-workspace

The picker already carries a `workspace-id` prop, stamped by the deterministic close runner for the
**multi-workspace close loop**. The sweep mirrors that exactly: loop workspaces from
`well_list_workspaces`, run the month spine per workspace, and **never merge verdicts across
workspaces** (§ SCOPE WARNING). A parent workspace's consolidated verdict is the *intersection* of
its own and its children's — one child's `not_ready` January makes the parent's January `not_ready`.

### A.5 Spine control points

| id | name | check | sev |
|---|---|---|---|
| `SPINE-01` | Every workspace enumerated and swept | workspaces from `well_list_workspaces` vs workspaces with results | red — a skipped workspace must never read as clean |
| `SPINE-02` | Every month in range enumerated | months from close-readiness for each year in range vs months with results | red |
| `SPINE-03` | **Sweep verdict agrees with close-readiness** | sweep state per month vs `CloseReadinessStatus` | red — `CLEAN` on a `not_ready` month (or findings on a month reported closeable) means one of the two is lying |
| `SPINE-04` | **`EMPTY` is genuine, not false quiet** | month `EMPTY` **and** an enabled connector covering that period exists **and** zero rows ingested | red — the most dangerous state in this skill |
| `SPINE-05` | No regression on a settled month | new red on a `CLEAN` month vs the prior sweep | red |
| `SPINE-06` | Coverage contiguous within the month | a run of no-data days inside an otherwise populated month | amber — coverage gap, distinct from a posting gap |
| `SPINE-07` | Card copy matches the mode it is rendering | picker rendered for a sweep while showing close copy (i.e. `mode` unset/unsupported) | amber — a sweep that asks "close your books?" will be answered as a close, and the user's intent is lost |

