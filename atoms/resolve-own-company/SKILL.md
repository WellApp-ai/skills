---
name: resolve-own-company
description: Resolve which company in a Well workspace is the user's own legal entity, fold in its duplicate records, and hand off a typed identity. Dev-only test artifact — never installed by end users.
---

The workspace is already pinned — pass its `workspace_id` on every call below.

Read the schema, then the field: `well_get_schema({ root: "workspaces" })`, then `workspaces.own_company` for the pinned workspace. Treat all three of these as unresolved, never only the null case: the relation is `null`; the field is absent from the schema entirely; or it resolves to more than one plausible company. Never infer it from the workspace's name, title, logo, slug, or email domain — a coincidence is not a record, and an inferred pick is indistinguishable from a correct one in the output.

Resolved cleanly → take it. One unambiguous company from the schema field → `resolution: schema_field`, unless `mode` is `suggest`, in which case → `resolution: suggested`, offered as an overridable default rather than a stated fact. Either way, say which company in one line, don't ask for confirmation, and skip the alias-folding step below when `mode` is `suggest`.

Unresolved → ask once. Query `companies` for the workspace and ask which one is theirs, with the list on screen, saying why — "to tell your bills from your invoices" and what a wrong pick breaks — "swaps payables for receivables". The answer holds for this run only → `resolution: user_confirmed`. No MCP tool persists `own_company` — if the user wants it set permanently, point them at `<well-app-base-url>/workspaces/<workspace_id>`, where the picker in the Well app writes it. If the user declines, return `resolution: unresolved` and restate "report gross unpaid invoices, labeled as unsplit" so they know what they still get — never fall back to a guess.

Fold in duplicate company records: one legal entity often has several `companies` rows differing only by a legal-form prefix/suffix, punctuation, or accents. Normalize both sides identically — Unicode NFD, strip combining marks, lowercase, replace punctuation/separators with a space, collapse whitespace, trim — then treat a pair as a candidate when *either* normalized name contains the other (containment is directional: test both ways, or an alias like an `EI-` prefix is missed one direction). Propose the candidates, take an explicit yes before treating the confirmed set as one identity, and flag the duplicate as worth fixing in Well. Never merge silently.

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

`identity_set` is the own company plus every confirmed alias — the key a caller compares invoice ids against. `persisted` is `true` for `schema_field`/`suggested` (both read the stored setting), `false` for `user_confirmed`. On `unresolved`, every key but `workspace_id` is null or empty.

Verify before moving on: all three unresolved states were treated as unresolved (null, absent, ambiguous); the own company was never derived from the workspace's name, logo, slug, or domain; alias candidates were found with both-direction containment on identically normalized names and proposed, never merged silently; no write tool (`well_update_company`, `well_delete_company`) was called; a decline returned `resolution: unresolved` with no guess substituted.
