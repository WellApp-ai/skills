# Conventions

Internal notes for the Well team and the agents working alongside us. This repo is public so the skills can be installed from it, not as an invitation to send skill PRs — nothing here ships to users, it is just how we change the skills without breaking the parts that are easy to miss.

Every rule below exists because a reviewer caught it, usually more than once.

## A skill that depends on another declares it in three places

The atomic bricks — `define-workspace`, `connect-tools`, `define-period`, `resolve-own-company`, `normalize-currency` — are invoked by other skills rather than duplicated into them. When a skill starts depending on one, say so in **all three** of:

1. **`requires:`** in the SKILL.md frontmatter — `requires: [define-workspace, connect-tools]`.
2. **A `**Composed skills.**` block** in the SKILL.md body, inside the Tooling section, naming each brick and what it supplies.
3. **`docs/<name>.md`** — both a `## Composes onto` section *and* the dependency's URL in the AI-assisted install list.

Declaring only the first is the mistake reviewers keep finding. The three surfaces serve different readers: the frontmatter is machine-readable, the body block tells the running agent what not to reimplement, and the docs page is what a human follows when they download a single `.skill`. Miss the third and they install the skill without its dependency, and it silently falls back to the inline behaviour the delegation was meant to remove.

`define-workspace` is the only brick that declares nothing — it is the root and depends on no one.

## Every dependency count appears four times per docs page

A `## Composes onto` section states its count in four places. Changing a skill's dependencies means changing all four, or the page contradicts itself:

| Where | Looks like |
|---|---|
| Intro sentence | `This skill delegates **four** setup steps to Well's atomic skills…` |
| Bullet list | one bolded-link bullet per dependency, pointing at that brick's docs page |
| Install sentence | `Install **all four** alongside this one.` |
| Plugin sentence | `…paths below install **all five** together` — note **N+1**, because it counts this skill too |

Derive all four from the actual bullet count rather than editing by hand, then check that the install list carries exactly `bullets + 1` entries (the skill itself plus its dependencies). Grammar agrees with the count: *one skill owns*, *two or more skills own*; and at N=1 the install sentence reads `Install it alongside this one` / `install both together`, not `all one` / `all two`.

## Reuse the README's install copy — never rewrite it

The canonical template for a docs page's AI-assisted block is **any of the twenty pages that already share it** — [`docs/expense-breakdown.md`](docs/expense-breakdown.md) is as good a reference as any. Those twenty blocks are byte-identical: five steps, opening `1. Fetch these files:` with lettered sub-items. To add a dependency, extend step 1 with the next letter and change nothing else.

**Do not copy the block out of [`README.md`](README.md#assisted-by-ai-recommended).** It looks like the same thing and is not: it installs *every* skill at once, so it runs to six steps and carries two that a single-skill page must never import — a "create a summary table" step, and a clause about keeping the design-system's two `.css` files in `assets/`. The README block is where the multi-file *shape* came from, but its wording has since diverged, and copying it verbatim into a docs page would change the established install flow.

Do not write new prose for it either. That copy is tuned for install UX, and rewriting it reintroduces untested wording — one attempt added an "each must land in its own skill folder named after that skill" instruction that was never true and had to be reverted.

One page differs legitimately. [`docs/define-workspace.md`](docs/define-workspace.md) is the root brick and depends on nothing, so it uses the singular `1. Fetch this file:` with no sub-items. [`docs/fetch-missing-invoices.md`](docs/fetch-missing-invoices.md) used to share that shape and no longer does: the flow now composes the six bricks it runs, so its page carries a `## Composes onto` section and the lettered install list like every other dependent page.

## Never blind find-and-replace a shared phrase

`delegates N setup steps` currently appears across **20** docs pages at four different values of N — 6 pages at one, 5 at two, 4 at three, 5 at four. Only the pages whose dependency count actually changed may be touched. A repo-wide substitution to fix five pages will silently make ten wrong, and nothing validates prose.

The same applies to `Install all N alongside this one`, `install all N+1 together`, and `grab those N as well`.

## Two standing exemptions

**`cash-position` and `runway-calculator` must never delegate to `normalize-currency`.** `well_get_cash_position` and `well_get_runway` convert currency server-side and return the rate they applied; both skills explicitly forbid re-deriving their tool's output. Converting again produces a second number that disagrees with what the Well app shows for the same workspace. Verify with `grep -c normalize-currency skills/cash-position/SKILL.md` — it should stay `0`.

## Sweep after any merge — concurrent PRs drift

A PR that adds a convention to every skill and a PR that adds a new skill will not know about each other. PR #22 added the `**How this reaches the user.**` widget-disclosure block to every skill that existed at the time, and merged twelve minutes before PR #21 added `normalize-currency` — so the newest skill shipped without the newest convention, and `main` inherited a gap neither PR was wrong about. All 23 skills carry that block today. The `well-design-system` skill that used to be the exception is gone: the design system is Well's brand rather than a capability a user installs, so its tokens are now generated into the three skills that compose a visual and it is not distributed.

After merging either kind of change, sweep the convention across every skill rather than trusting the PR that introduced it.

## What each brick owns

Know these before writing a workflow step that looks similar — the logic is centralised precisely so it is not re-derived.

| Brick | Owns |
|---|---|
| `define-workspace` | The MCP-server check, the OAuth/DCR flow, and pinning exactly one workspace. Supplies `workspace_id` to everything downstream. |
| `connect-tools` | Whether a connection is real: `well_list_connectors` catalog rows filtered on `direction: input`, matched on `data_domains`, with `last_successful_sync_at` — not a bare `connection_status: enabled` — deciding connected. Plus install links. |
| `resolve-own-company` | The three-way unresolved test (relation null / field **absent from the schema** / more than one candidate), the never-infer rule, and two-directional containment on normalized names for duplicate records. |
| `normalize-currency` | The never-blend invariant, and rate selection: `exchange_rates` read, most-recent-rate-at-or-before the as-of date, never a later one, pair-direction checked. |

## Before you push

`make validate` is the gate, and it runs on push via `.githooks/pre-push` (set up once with `make install`). It runs three checks, and the distinction matters:

- **`claude plugin validate . --strict`** confirms the marketplace manifest is well-formed. It never reads the skills, so it passes even when a skill carries no frontmatter at all.
- **`claude plugin validate ./skills --strict`** confirms every skill carries a frontmatter block. It checks only that the block *exists* — never that the block parses as YAML.
- **`node scripts/check-skill-frontmatter.js`** enforces the one YAML rule that actually bites: an unquoted value containing a bare `:` is read by YAML as the start of a nested mapping, so the skill loads with **empty metadata, silently** — no name, no description, undiscoverable, and nothing anywhere reports an error. Per that script's own header, this broke `company-profile` and `missing-receipts` in #8.

So running `claude plugin validate` alone is not the gate. Run `make validate`, and read the exit status unpiped (`make validate > /dev/null 2>&1; echo $?`), since a pipe reports its last stage.

Any commit touching `skills/*/SKILL.md` must carry the rebuilt `dist/<name>.{zip,skill}`. The pre-commit hook does it; `make build` does it by hand. See [`dist/README.md`](dist/README.md).
