# Worked Examples

### Example request

The fetch-missing-invoices flow calls deploy-agents with `workspace_id` of Acme SAS, the
March 2026 selection already written by the user's click on the period card, and the
`show-missing-invoices` hand-off, its `agent_candidates` covering Shopify (3 transactions, 1
counterparty) and Free Pro (2 transactions, 1 counterparty), with no `"unknown"` group, plus
4 `upload` rows on four other counterparties and one `connect` row on an unconnected Stripe
account. The session holds a pick of three vendors for this workspace: the Shopify
counterparty, Free Pro, and Stripe. The user writes in French.
`well_preview_invoice_fetch` is not in the toolset.

### Expected behavior

Keep the candidates whose `company_id` is in the session's pick, derive the preview from
them, and call nothing. Answer:

> Agent prêt pour Shopify : 3 factures (rien n'est encore lancé)
> Agent prêt pour Free Pro : 2 factures (rien n'est encore lancé)
> Aucune ligne à téléverser à la main parmi les fournisseurs retenus.
> 1 ligne dépend de Stripe, qui n'est pas encore connecté.
>
> Ce plan ne couvre que les dépenses déjà catégorisées de la période : ce qui ne l'est pas
> encore n'y apparaît pas.
>
> Aucun agent n'a démarré ici, aucune tâche n'est en file, aucune session de navigation
> n'est ouverte. La collecte se lance depuis l'extension Well, une fois que vous la démarrez
> sur la page de collecte. Ouvrez l'espace de travail dans l'app Well,
> `<well-app-base-url>/workspaces/<workspace_id>`, pour voir les mêmes lignes manquantes.
> Ces chiffres comptent les transactions sans facture, pas les factures déjà récupérées.

Then keep the hand-off — `workspace_id`, `run_mode: preview`, `nothing_launched: true`, the
`selection`, each agent's `provider_id` (the group's `matched_connector_service_id`, or
null), `collect_url: null`, `coverage_note`, `resolution: previewed` — and hand back to the
caller. Nothing more is printed. The upload line reads zero because no `upload` row names a
picked counterparty, and it still appears at zero. Leave the hand-off's `counts.upload` out
of the answer: it is a period-wide number with no counterparty behind it, so no pick-scoped
line can be built from it. The hand-off carries no `scoped_to_selected_counterparties`: the
tool never ran, and the pick was applied here.

### Example request

Same flow, in a Claude Desktop session where `well_preview_invoice_fetch` **is** available.

### Expected behavior

Call `well_preview_invoice_fetch({ workspace_id })` — the server reads the clicked
selection. The result carries `scoped_to_selected_counterparties: true`, so it already
covers the picked vendors only. The preview card renders the vendors the link names with
their checkboxes, its select-all, its Preview badge and its Deploy action. Do not restate
the rows. Say one line per agent — provider, count, nothing started yet — then the upload
line, the connect line, the line saying the plan covers the picked vendors only, the
coverage line carrying the tool's `hints`, one line asking the user to confirm the vendors
and deploy, and the plain sentence that nothing has started here and the extension runs the
collection once the user starts it on the collect page. Carry each agent's `provider_id` and
`domain`, plus the envelope's `collect_url` and `scoped_to_selected_counterparties`, into
the hand-off. End the turn there.

### Example request

"Great, now actually run them."

### Expected behavior

Say plainly that nothing runs from the session. Deploy on the card opens the collect link
for the vendors still ticked, and the Well browser extension collects from those portals
once the user starts them on that page. Where no card is drawn, give the collect link from
`collect_url`, or `<well-app-base-url>/workspaces/<workspace_id>` when the preview carried
none. Do not call any tool, do not promise a run from the session, and do not re-emit the
preview as though it were a finished run.

### Example request

Same flow, tool absent, and the hand-off's `agent_candidates` hold two groups: Amazon with
three counterparties (5 transactions) and `"unknown"` with two counterparties (2
transactions).

### Expected behavior

Build one agent, for Amazon. The `"unknown"` group is not an agent: Well matched no provider
for those rows, so nothing can be dispatched for them. Its 2 transactions become
`unmatched_rows`, on a line of their own rather than folded into `upload_rows`: "Agent ready
for Amazon: 5 invoices (nothing started yet)", then the upload line, then "2 transactions
have no provider Well could identify, no agent covers them", then the connect line, the
coverage line, the deploy line, and the plain sentence that nothing has started here. Never
write "Agent ready for unknown".

### Example request

The flow calls deploy-agents for a period whose rows all already have an invoice attached —
`agent_candidates` is empty, `selection_state` is `none`, and there is nothing to upload or
connect.

### Expected behavior

Return `resolution: nothing_to_do`: "Nothing to fetch for March: every categorized expense
transaction already has its invoice, and spend that is not categorized yet cannot appear
here. No agent has started, no task is queued, no browser session is open." The upload
line, the connect line and the deploy line are dropped: there is nothing to upload, nothing
to connect and nothing to collect. Keep an empty `agents` list with the `coverage_note` set,
and hand back. Do not offer `categorize-counterparties` as a way to uncover more: it labels
the vendor companies, not the period's transactions. Do not invent an agent, and do not
offer to run one anyway.

### Example request

The flow reaches this skill with no pick recorded — the missing-invoices card is on screen
and the user has ticked nothing yet.

### Expected behavior

Preview nothing. The hand-off carries `selection_state: pending`, which is a tick still to
come and not an empty list. Say the pick comes first, run `show-missing-invoices` so its
card takes the tick and the Continue click, and come back once its hand-off carries
`selection_state: written`. Do not preview every vendor of the period as a stand-in for the
pick.
