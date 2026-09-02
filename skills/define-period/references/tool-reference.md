# Tool Reference

Full behavior for each tool `define-period` calls: field semantics, fallback paths, and
the edge cases that do not fit in `SKILL.md`'s Tooling section. `SKILL.md` already names
each tool and says when it is called — read this file for what to do with what it returns.

## well_list_periods

Only when it is present in your toolset. It returns the workspace's periods with their
fiscal coordinates and state, and in MCP-Apps hosts its result renders the period picker
card (months are multi-select); pass `title` / `subtitle` through when the tool accepts
them. The card's **Use** click calls `well_switch_workspace` with the picked `periods`
itself — the selection lands server-side — and prefills "Work on <Month Year> and
<Month Year>" in the user's composer. Check for the tool by name before you plan around
it.

Each period row carries `bank_transaction_count`, the number of BANK transactions that
month holds. The same row's `transaction_count` is a different figure: it counts every
transaction the month holds, whatever produced it, so an accounting connector on its own
puts thousands of rows behind `transaction_count`, and a transaction with no source
connector counts there too. A caller that must know whether bank data reached a month
reads `bank_transaction_count`, and reads nothing else for it. A current server emits `0`
for a month with no bank coverage rather than omitting the field, so an absent count
means an older server, or a path that read no period row at all. It never means a month
the server declined to count.

Its per-period result also carries the close-readiness fields — `close_status`,
`close_reason`, `missing_invoice_count`, `unposted_invoice_count` — that
`show_close_readiness` surfaces; see Inputs in `SKILL.md` for when and how to state them.
These readiness counts are computed **per month** (the missing-invoice count reads
proof-gaps for each), so a wide window is expensive — the tool flags the cost itself;
request only the months the picker needs, never a full year by default.

## well_switch_workspace

`well_switch_workspace({ periods: [{ calendar_year, calendar_month }, …] })` is how a
period selection is **written**. The card's click calls it; call it yourself when a hint
or a typed answer resolves the months, so the selection is just as live as a clicked one.
A `periods` list holds at most twelve months — the server refuses a longer one outright.
If the server rejects `periods` (an older server), carry the selection in the
conversation instead and pass it explicitly to the later reads — the one case where they
still take a periods argument.

The same tool pins workspaces, but only when called with `workspace_id` alone: a call
carrying `periods` never pins, even when it also carries `workspace_id` — that argument
then says which workspace the months answer for, nothing more. See "Several workspaces"
in `SKILL.md`'s Inputs for the invariant that keeps this skill from ever doing the pin
itself.

## well_wait_for_selection

`well_wait_for_selection({ kind: "periods", timeout_s? })` reads the click the user made
on the period picker card, for when a later message is not the card's prefill. Call it
only after this conversation has rendered the picker: reading a click on that card is its
one job. Never call it at step start, before the picker exists, or as a probe for whether
a selection already exists — a trusted selection lives only in this conversation's own
history (a prior click, prefill, or typed months). Never call it in the turn that renders
the picker, and never use it as a long wait.

It returns `{ status: "selected", selection: { periods }, already_set: true }` when the
click already landed, or, after a short wait (default 10 seconds), `{ status:
"no_selection_yet" }` — a normal result, not an error, not a sign the tool failed. If the
tool is absent, resync from `well_list_workspaces`' `session.selected_periods` instead.

## well_list_workspaces

For resync only: its `session.selected_periods` is the selection as the server currently
holds it. Desktop-class hosts keep one MCP session per connector, shared across all
conversations, so trust it only for a selection THIS conversation itself wrote (its own
card click or typed months) — never to skip the picker.

## well_get_schema + well_query_records (the activity probe)

The activity probe, and nothing else. Two answers come before it and cancel it: a
`bank_transaction_count` on the period rows, and a caller's `probe: false`. Where neither
applies: when `well_list_periods` is absent the fallback proposes a month by arithmetic,
never by querying this root.

Call `well_get_schema({ root: "transactions" })` once per session and read the date
fields from the result rather than assuming them. Range on `executed_at`, and on that
field alone: it is the non-null settlement date Well buckets a transaction's month by,
and it already falls back through `booking_date` then `value_date` at ingest.
`booking_date` is nullable and is *not* the month field — on the rows where the two
disagree it belongs to a different month, so widening the probe with it reports activity
the selection does not hold. Only when the schema exposes no `executed_at` should you
range on `booking_date` instead, and then say the probe is approximate.

For how the `well_query_records` call itself is built — the interval per run of
consecutive months, the `_or` across a gap, never spanning from the earliest month to the
latest one — see step 6 of the Workflow in `SKILL.md`; that construction is part of the
step, not a tool quirk, so it lives there. The probe answers one boolean — does the
selection hold any bank activity — never a count and never a figure.
