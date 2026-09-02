---
name: confirm-my-company
description: Resolve which company in a Well workspace is the user's own legal entity, fold in its duplicate records, and hand off a typed identity — and, in persist mode, set it via `well_set_own_company` on an explicit confirmation. Dev-only test artifact — never installed by end users.
placeholders:
  purpose: "to tell your bills from your invoices"
  consequence: "swaps payables for receivables"
  mode: "strict"
  foldAliases: true
  foldCounterparties: false
  onDecline: "report gross unpaid invoices, labeled as unsplit"
  persist: false
---

The workspace is already pinned — pass its `workspace_id` on every call below.

Read the schema, then the field: `well_get_schema({ root: "workspaces" })`, then `workspaces.own_company` for the pinned workspace. Treat all three of these as unresolved, never only the null case: the relation is `null`; the field is absent from the schema entirely; or it resolves to more than one plausible company. Never infer it from the workspace's name, title, logo, slug, or email domain — a coincidence is not a record, and an inferred pick is indistinguishable from a correct one in the output.

Resolved cleanly → take it. One unambiguous company from the schema field {{#if (eq mode "suggest")}}→ `resolution: suggested`, offered as an overridable default rather than a stated fact{{else}}→ `resolution: schema_field`{{/if}}. Say which company in one line and don't ask for confirmation either way.

Unresolved → ask once. Query `companies` for the workspace and ask which one is theirs, with the list on screen{{#if purpose}}, saying why — "{{purpose}}"{{/if}}{{#if consequence}} and what a wrong pick breaks — "{{consequence}}"{{/if}}. Then, on the user's explicit confirmation of one company:
{{#if persist}}
- `well_set_own_company` in the toolset → set the anchor: `well_set_own_company({ company_id })` with the company they named. If their company is not yet a record in the workspace and they ask to create it, `well_create_company` first, then set that id. This is an accounting-critical, admin-only write — take it only on the explicit yes, never on a guess; if the caller is not an admin the tool refuses, so surface that plainly rather than retrying. On success → `resolution: user_confirmed`, `persisted: true`.
- The write tool is absent → the answer holds for this run only → `resolution: user_confirmed`, `persisted: false`. Point the user at `<well-app-base-url>/workspaces/<workspace_id>`, where the picker in the Well app writes it, and say plainly that until then every run asks again.
{{else}}
The answer holds for this run only → `resolution: user_confirmed`, `persisted: false`. If the user wants it set permanently, point them at `<well-app-base-url>/workspaces/<workspace_id>`, where the picker in the Well app writes it.
{{/if}}
If the user declines, return `resolution: unresolved`{{#if onDecline}} and restate "{{onDecline}}" so they know what they still get{{/if}} — never fall back to a guess.

{{#if foldAliases}}
Fold in duplicate company records: one legal entity often has several `companies` rows differing only by a legal-form prefix/suffix, punctuation, or accents. Normalize both sides identically — Unicode NFD, strip combining marks, lowercase, replace punctuation/separators with a space, collapse whitespace, trim — then treat a pair as a candidate when *either* normalized name contains the other (containment is directional: test both ways, or an alias like an `EI-` prefix is missed one direction). Propose the candidates, take an explicit yes before treating the confirmed set as one identity, and flag the duplicate as worth fixing in Well. Never merge silently.
{{/if}}
{{#if foldCounterparties}}
Run the same both-direction, normalized comparison among the *other* companies too, and propose those alias sets as well — an unmerged counterparty alias splits one party's invoices across two rows and understates them.
{{/if}}

Emit the hand-off:

```yaml
workspace_id: <uuid>
own_company_id: <uuid or null>
own_company_name: <name or null>
identity_set: [<uuid>, …]
aliases: [{ id: <uuid>, name: <name> }, …]
counterparty_alias_sets: [[{ id: <uuid>, name: <name> }, …], …]
resolution: schema_field | user_confirmed | suggested | unresolved
persisted: <true|false>
```

`identity_set` is the own company plus every confirmed alias — the key a caller compares invoice ids against. `persisted` is `true` whenever the anchor is stored server-side — `schema_field`/`suggested` (both read the stored setting), and a `user_confirmed` answer written with `well_set_own_company` in persist mode — `false` for a `user_confirmed` answer that held for this run only. On `unresolved`, every key but `workspace_id` is null or empty.

Verify before moving on: all three unresolved states were treated as unresolved (null, absent, ambiguous); the own company was never derived from the workspace's name, logo, slug, or domain; alias candidates were found with both-direction containment on identically normalized names and proposed, never merged silently; no write tool (`well_update_company`, `well_delete_company`) was called except `well_set_own_company` in persist mode on an explicit confirmation; a decline returned `resolution: unresolved` with no guess substituted.
