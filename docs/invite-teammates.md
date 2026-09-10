<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Invite teammates

**Get your teammates into the workspace, without leaving the conversation.**

## What it does

Ask to add a teammate and this skill reads who you can invite, shows Well's invite card, and sends the invitations. Out of the box the card offers the people Well detected: the ones who share the workspace owner's corporate email domain and hold no membership yet. A close-books or fetch-missing-invoices flow can hand it a specific set of people instead — the owners it just assigned — so anyone still waiting on an invitation can open their task. Each card row carries a checkbox and a state chip (`has access` or `invited`), and the card adds a contact search with email chips, a role select (admin or member), and a target picker (this workspace or a workspace group). Ticking who to invite, picking a role and a target, and clicking Send invitations creates the memberships and sends the invitation emails. Several invitations go in one send, each address reports its own result, and an address that already has access is refused rather than downgraded. It invites people only — it assigns no work and sets no accounting data.

## Required data in Well

- **A Well workspace** (required). Memberships belong to a workspace, so the workspace is pinned first.

## FAQ

**Q: Who does it offer by default?**
A: The people who share the workspace owner's email domain and hold no membership yet. A calling flow can hand it a specific set instead.

**Q: What happens to someone who already has access?**
A: They are left off the send. An invitation that is only pending is re-issued instead, which is what lets that person in.

**Q: Which roles can I give?**
A: Admin or member, and the invitation can target this workspace or a workspace group you belong to.

---

## Installation

The file under `skills/invite-teammates/SKILL.md` is a shell: it carries the skill's name and description, and loads the instructions from Well's MCP server with `well_get_skill` when the skill runs. Install it once; it never goes stale.

### Claude Code

```
/plugin marketplace add WellApp-ai/skills
/plugin install well-skills@wellapp
```

### Codex CLI

```bash
codex plugin marketplace add WellApp-ai/skills
codex plugin add well-skills@wellapp
```

### Assisted by AI

Paste this into any AI agent (Claude, Codex, Cursor, OpenCode, and others):

```
Install the following official skill from Well. Instructions:

1. Fetch this file:
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/invite-teammates/SKILL.md
2. Save it as a file named exactly "SKILL.md" inside a folder named "invite-teammates". No prefix, no suffix.
3. Install this skill.
4. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill invite-teammates
```

Whatever the host, the skill needs the Well MCP server at `https://api.wellapp.ai/v1/mcp`. You'll be asked to sign in to Well the first time it needs your data.

---

[← Back to all skills](../README.md#available-skills)

<p align="center">
  <img src="https://wellapp.ai/images/badges/soc2.avif" alt="SOC 2 Type I" height="40">
  <img src="https://wellapp.ai/images/badges/gdpr.avif" alt="GDPR Compliant" height="40">
</p>

<p align="center">
    <sub><b>Well is SOC-2 Type I and GDPR Compliant</b></sub>
</p>
