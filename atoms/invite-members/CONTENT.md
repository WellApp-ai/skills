---
name: invite-members
description: Invite teammates into a Well workspace — read the candidates, show the invite card or ask in text, send the invitations, and hand back the per-address result. Dev-only test artifact — never installed by end users.
placeholders:
  purpose: "so the owners you just assigned can open their task"
  source: "provided"
  personIds: "the owner_person_ids of the assignments made this turn"
---

The workspace is already pinned — pass its `workspace_id` on every call below, and do not re-resolve it here.

**Read the candidates once.** Call `well_list_member_candidates` a single time, with `workspace_id`{{#if (eq source "provided")}} and the `person_ids` this beat runs on{{else}} and `include_detected: true`{{/if}}.

{{#if (eq source "provided")}}
This runs on a set of people a calling flow already chose ({{personIds}}), so pass them as `person_ids` and read each one's current membership state. Each candidate comes back with `source: provided` and a `state`: `not_member`, `pending` with an `invite_expires_at`, or `active`. **Keep only the `pending` and `not_member` ones.** A `pending` person is invited but has not accepted, so re-issuing the invitation is what lets them in; an `active` one already has access, so never invite them — say they already have access and drop them from the send. When no candidate is left to invite, say there is no one to invite here and hand that back in one line.
{{else}}
Out of the box this offers the teammates Well detected: with `include_detected: true` the read returns the people who share the workspace owner's corporate email domain and hold no membership yet, each `source: detected`. When a calling flow instead hands you a specific set of people to invite, pass those as `person_ids` and drop `include_detected` — that is the `provided` source, and each candidate then carries its own `state` (`not_member`, `pending`, or `active`). Either way, never invite an `active` candidate: they already have access, so say so and leave them off the send.
{{/if}}

The read also hands back `targets` (each `{ kind, id, name, workspace_count }` — this workspace, or a workspace group the user belongs to), `roles` (each `{ value, label, hint }`, where `value` is `admin` or `member`), `me_person_id`, `resolved_workspace`, and `success` with an `error` on a failed read. Every candidate carries `person_id`, `name`, `email`, `avatar_url`, `state`, `source`, and `invite_expires_at`.

**Then invite, on the host you are in.**

- **In an MCP-Apps host the card is already on screen.** The `well_list_member_candidates` result renders the invite card: the candidate list with a checkbox and a state chip per row (`has access` for an active member, `invited` for a pending one), a contact search with email chips, a role select, and a target picker. The card sends the invitations itself. Say one line naming how many candidates are on the card and that they are there {{purpose}}, tell the user to tick who to invite, pick a role and a target, and click Send invitations, and **end the turn on the card**. Do not restate the candidate rows in text under it, and do not call `well_invite_members` yourself: the card owns the send.
- **In a text-only host, list the candidates** — name, email, and state (`has access`, `invited`, or new) — and ask whom to invite, with which role (`admin` or `member`) and into which target (this workspace, or a named group). When the user names the people, the role, and the target, call `well_invite_members({ workspace_id, invites, target })` **once** for everyone named: `invites` is one `{ email, role }` per address (1 to 20), and `target` is `{ kind: "workspace" }` or `{ kind: "group", group_id }` built from the chosen target's `id`. Leave any active member off the call.

`well_invite_members` returns an envelope, `{ results, success, error? }`. Read the per-address outcome from `results[]`, never from the top level: each entry is `{ email, status, refusal_reason?, invitation_email_sent }`. State each one in plain words: `sent` (the invitation went out), `reissued` (a pending invitation was sent again), or `refused` (name the `refusal_reason`, such as an address that already has access). A group target reports `sent` for a re-issue, so on a group target do not expect `reissued`. When `invitation_email_sent` is false for an address whose membership otherwise landed, say the membership is recorded but the email did not leave, and offer to resend it. Never retry a `refused` address on your own.

**Hand off the invited emails and their results** — each `email` with its `status` and whether the invitation email was sent — as reasoning vocabulary for the calling flow, carried in plain conversation, never printed as a yaml, JSON, or fenced block.
