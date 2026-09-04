---
name: link-accounts-to-companies
description: Confirm every bank account the figure rests on is attached to a company, and that the company is one the workspace owns. Dev-only test artifact — never installed by end users.
placeholders:
  purpose: "so a movement between two of your own accounts can be told from money leaving"
---

The workspace is already pinned.

One `well_query_records` on `accounts` for this workspace, reading each account's owning company and its `ownership`.

Two things fail here, and they are one card because they are one decision — whose account is this:

- No company attached. Nothing can place the account on either side of a transfer.
- `ownership` unresolved. The account has a company, but whether the workspace owns it is unanswered.

Either → stop, list the accounts, and surface the assignment card so the reader picks the company per account. This is a genuine decision only they can make: an account's owner cannot be inferred from its name, its bank, or the company that appears most often beside it, and a guess here is indistinguishable from a fact in everything computed afterwards.

{{#if purpose}}Say what it decides — "{{purpose}}".{{/if}}

**Resuming.** The card's Continue names this step, so a run that comes back re-reads the accounts alone and continues from here.

All accounts resolved → hand them back and carry on.

**A read that fails is not a resolution.** When the call errors rather than returning a clean result, retry once; on a second failure stop and say the account links could not be read. Never hand off a resolution derived from data that did not arrive — the consuming skill cannot tell the two apart. This is stated here rather than left to a caller's preamble, because an atom is loaded standalone and composed by skills that have their own.

Hand off: per account, its id, name, company, and ownership; `unresolved_count`; `resolution: complete | unresolved`.

Verify before moving on: ownership was read rather than inferred; both failures were surfaced as one decision; no account was assigned a company on the reader's behalf.
