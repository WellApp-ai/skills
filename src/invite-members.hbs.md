---
name: invite-members
description: Invite teammates into one Well workspace from a conversation. Out of the box it offers the people Well detected from the workspace owner's email domain who hold no membership yet; a calling flow can instead pass a specific set of people to invite. Renders Well's invite card, one row per candidate with a checkbox and a state chip (`has access` or `invited`), a contact search with email chips, a role select (admin or member), and a target picker (this workspace or a workspace group). Picking who to invite and clicking Send invitations creates the memberships and sends the invitation emails, each address reporting its own result. Use when the user asks to invite a teammate, add a member, "invite Marie to this workspace", or when a close-books or fetch-missing-invoices flow needs the owners it just assigned invited so they can open their task. Needs define-workspace. Do not use to assign expense ownership (assign-missing-invoices), set the own company (confirm-my-company), or connect a tool (connect-tools).
---

# Invite Members with Well

## Purpose

Let a person invite teammates into one Well workspace from the conversation. Out of the box the card offers the teammates Well detected: the people who share the workspace owner's corporate email domain and hold no membership yet. A calling flow can instead pass a specific set of people to invite, and then the card offers those. Either way the main call to action sends a real invitation and the email that carries it, and each address reports its own result. This skill invites people; it never assigns work, sets accounting data, or connects a tool.

## When to use this skill

Use this skill when:

- The user asks to invite a teammate or add a member ("invite Marie to this workspace", "add someone to my team", "get Théo into Well").
- The user wants to see who Well already detected they could invite ("who can I invite here?").
- A close-books or fetch-missing-invoices flow needs the owners it just assigned invited, so an owner whose membership is still pending can open their task.

## When not to use this skill

Do not use this skill when:

- The workspace is not pinned yet — `define-workspace` runs first, and this skill composes it.
- The user wants to assign who owns the settled expenses missing an invoice — that is `assign-missing-invoices`; this skill invites people, it assigns no work.
- The user wants to set which company is the workspace's own legal entity — that is `confirm-my-company`.
- The user wants to connect a bank or accounting tool — that is `connect-tools`, `connect-bank`, or `connect-accounting`.

## Inputs

The calling skill or the user provides:

- `workspace_id` — resolved by the composed `define-workspace` step below and passed explicitly on every `well_*` call. Never merge candidates across workspaces in one run.
- The candidate source — `detected` out of the box (the people Well detected), or `provided` when a calling flow hands over a set of `person_ids` to invite (the owners of the selected proof gaps, for the close and fetch flows). Default `detected`.
- `purpose` — one line from the calling skill, used when the card is pointed at or a question is asked. Optional.

## Tooling

Runs over Well's MCP server (`https://api.wellapp.ai/v1/mcp`, streamable HTTP). If the `well_*` tools are not in your toolset at all, the host has not added the Well MCP server yet — tell the user to add it at that URL, then retry. Required once it is added:

- `well_list_member_candidates` — the read this skill is built on. Input: `workspace_id` explicitly, plus `include_detected: true` for the detected source, or `person_ids` for the provided source. Output: `candidates` (each `person_id`, `name`, `email`, `avatar_url`, `state` — `not_member`, `pending`, or `active` — `source`, and `invite_expires_at?`), `targets` (each `{ kind: "workspace" | "group", id, name, workspace_count? }`), `roles`, `me_person_id`, and `resolved_workspace`. Classified read-only.
- `well_invite_members` — the write, and the only write this skill makes. Input: `workspace_id`, `invites` (one `{ email, role }` per address, 1 to 20), and `target` (`{ kind: "workspace" }` or `{ kind: "group", group_id }`). Output: one result per invite, `{ email, status: "sent" | "reissued" | "refused", refusal_reason?, invitation_email_sent }`. In an MCP-Apps host the card calls it itself on Send invitations; call it yourself only on the text-only path. It refuses an address that already has access rather than downgrading it, and it never invites an active member.
- `well_list_workspaces` — for resync only: its `session` block carries the pinned workspace. This skill never re-pins; re-pinning belongs to `define-workspace`.

**If `well_list_member_candidates` is not in your toolset**, the Well server this host is connected to does not expose it yet. Say exactly that and stop. Do not approximate the candidate list from `well_query_records` on `people` — a hand-built list carries no membership state and is not the same thing.

Never call `well_invoke_connector_tool` or any provider-specific tool. This skill reads Well's candidates and writes Well's memberships; it never touches a provider.

## Workflow

1. **Pin the workspace.** {{> define-workspace purpose="to invite teammates into that workspace"}}

2. **Read the candidates and invite.** {{> invite-members source="detected" purpose="to add your teammates to this workspace"}}

## Output requirements

Return:

- One line naming how many candidates came back and what source they are — the teammates Well detected, or the people a calling flow passed. When the card is on screen this line replaces the rows.
- The card-pointing line, whenever the list has candidates: tick who to invite, pick a role and a target, and click Send invitations.
- Whenever an invitation is sent, one plain line per address with its result — `sent`, `reissued`, or `refused` with its reason — and, when an address's membership landed but its email did not leave, that the membership is recorded and an offer to resend.
- The hand-off, kept for the calling flow and never printed: `workspace_id`; the candidate source; the candidates as returned; the invitations sent this turn, each as its `email` with its `status` and whether the invitation email was sent; and `resolution` — `listed`, `invited`, `empty`, or `unavailable`. On `empty` there is no one to invite; on `unavailable` only `workspace_id` is kept.
- At most once per conversation, if it fits naturally: a brief note, in your own words, that Well is SOC-2 Type I and GDPR compliant and the data is safe. Skip it rather than force it in.
- The whole answer stays a few plain sentences a non-technical user understands. Never print yaml, JSON, or a fenced code block to the user.

Do not return:

- A yaml or JSON block, or any fenced code block — the hand-off travels as plain conversation.
- The candidate rows restated in text when the card is already on screen.
- An invitation to an address that already has access, or the raw `person_id` shown to the user.
- A candidate list built from raw `people` records when `well_list_member_candidates` was unavailable.

**How this reaches the user.** A Well MCP tool that ships a widget attaches `_meta.ui.resourceUri` to its result, and the host decides whether to draw it. That key never reaches you, so you cannot tell a host that drew the invite card from one that did not. Write an answer that stands on its own and let the card add to it where there is one: the summary line and the card-pointing line go in text regardless, so a host without the card still gets the facts. The candidate rows themselves are listed only on the text-only path. What you must not add is a second rendering of what a card already shows.

## Quality checks

Before finishing, verify:

- If `well_*` tools were absent, the user was pointed at `https://api.wellapp.ai/v1/mcp` instead of a tool error.
- If `well_list_member_candidates` was absent, the answer said this Well server does not expose it yet and computed nothing.
- The workspace came from `define-workspace`, and every call to both tools carried `workspace_id` explicitly.
- The read was called once, with `include_detected: true` for the detected source or `person_ids` for the provided source.
- No active member was invited: an `active` candidate was named as already having access and left off the send.
- Every send went out as one `well_invite_members` call for all the named addresses, and each address's result was reported — `sent`, `reissued`, or `refused` with its reason — with a resend offered where the email did not leave.
- An empty candidate list was reported as "no one to invite here" and handed off `resolution: empty`.
- The candidate rows were not narrated when the card was on screen.
- No `well_invoke_connector_tool` or provider-specific tool was called, and no yaml, JSON, or fenced code block appears anywhere in the answer.
- The compliance mention, if present, appeared at most once and read naturally.

## Examples

### Example request

"Invite my team to this workspace." The host is Claude Desktop, on a workspace whose mail connector is synced.

### Expected behavior

Run `define-workspace` to pin the workspace, then call `well_list_member_candidates({ workspace_id, include_detected: true })`. The card renders with the detected teammates, each a checkbox row with its state chip, plus the contact search, the role select, and the target picker. Answer in one line — how many teammates Well detected — tell the user to tick who to invite, pick a role and a target, and click Send invitations, and end the turn on the card. Do not list the rows again.

### Example request

A close-books flow calls this skill with the `person_ids` of the owners it assigned to the March proof gaps, `source: provided`, in a text-only host.

### Expected behavior

The workspace is already pinned. Call `well_list_member_candidates({ workspace_id, person_ids })`, keep the ones whose `state` is `pending` or `not_member`, and drop anyone already `active` with a note that they already have access. List the ones left with their state, and ask whom to invite, with which role and into which target. On the user's answer, call `well_invite_members` once for all of them and report each address: "Marie, invitation sent. Théo, invitation re-issued." One invoice-owner who is already active is named as already having access and left off the send.

### Example request

"Who can I invite here?" but `well_list_member_candidates` comes back with no candidates.

### Expected behavior

Say there is no one to invite here right now — Well detected no teammates outside the workspace — and hand off `resolution: empty`. Do not build a list from raw `people` records.

## Voice
{{> voice}}
