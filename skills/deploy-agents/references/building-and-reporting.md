# Building And Reporting The Preview

The full edge-case catalog behind steps 3, 5 and 7 of the workflow: the resolution states,
the `"unknown"` group, the counting nuances for the upload and connect lines, and the exact
readings for a refused collect link.

## Resolution states

No agents, no upload rows, no connect rows, and no unmatched rows → resolution
`nothing_to_do`. Say the picked vendors have nothing to fetch and stop; do not manufacture a
plan.

A pick that yields no agent — every picked vendor is an upload or a connect row — still has
something to report: keep `agents` empty, state those lines, and resolve `previewed`.
Reserve `nothing_to_do` for a pick with nothing on any of the three routes.

A pick holding only an `"unknown"` group is **not** `nothing_to_do`: those transactions are
still missing an invoice, so report them on their own line and resolve `previewed`.

## The `"unknown"` group

The `"unknown"` group is never an agent, whichever path produced it — the one exception to
using the tool's `agents` as they come. `show-missing-invoices` files the rows whose
provider it could not match under `provider_name: "unknown"`, and no agent can be dispatched
against a provider that was never identified. Keep that group out of `agents` and carry its
`tx_count` as `unmatched_rows`, counted apart from `upload_rows` so neither number is
misreported.

## Provider id sourcing

Carry a structured provider identifier on every agent. `provider_id` is the tool's
`provider_id` when you called the tool; otherwise the `matched_connector_service_id` shared
by that group's rows in the `show-missing-invoices` hand-off; otherwise null. Never make a
later step identify a provider by its name alone.

## Counting the upload, connect, and unmatched lines

Both the upload count and the connect count are counterparty rows, one per month, so a
vendor missing an invoice in two of the months read counts once for each of those months:
say the unit on a window of several months, or count the distinct vendors yourself and say
that is what you counted. A counterparty the tool also listed under a portal keeps its agent
run: say the run stays available when the connector does not suit the user, and count that
vendor once rather than on both lines. Both appear even at zero. State the count for each;
when the tool returns the rows themselves rather than a count, name at most three and give
the total. A third line, only when `unmatched_rows` is non-zero: Well could not match a
provider for those transactions, so no agent covers them. Keep it a line of its own with its
own count — folding it into `upload_rows` misreports both.

## Reading a refused collect link

The collect page can refuse the reader before it shows any portal, and each refusal has one
true reading:

- It asks the user to sign in to Well when no Well session is open, and it returns to the
  same link afterwards.
- It says the link is for another workspace when the signed-in account is not a member of
  the workspace the link names — that reader cannot start the collection, and a second link
  for the same portals would refuse them again, so point them at an account that is a member
  of this workspace.
- It says it cannot check the access when Well is unreachable, and a reload is the whole
  remedy.

None of these is a failed collection: nothing ran, so report it as a link the reader could
not open and never as an agent that tried and stopped.
