<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Invite Members

**Invite your teammates into a Well workspace from the conversation — pick who, set a role, and send the invitation.**

## What it does

Ask to add a teammate and this skill reads who you can invite, shows Well's invite card, and sends the invitations. Out of the box the card offers the people Well detected: the ones who share the workspace owner's corporate email domain and hold no membership yet. A close-books or fetch-missing-invoices flow can hand it a specific set of people instead — the owners it just assigned — so anyone still waiting on an invitation can open their task. Each card row carries a checkbox and a state chip (`has access` or `invited`), and the card adds a contact search with email chips, a role select (admin or member), and a target picker (this workspace or a workspace group). Ticking who to invite, picking a role and a target, and clicking Send invitations creates the memberships and sends the invitation emails. Several invitations go in one send, each address reports its own result, and an address that already has access is refused rather than downgraded. It invites people only — it assigns no work and sets no accounting data.

## Required data in Well

- **A Well workspace** — the invitations are sent into it.
- A mail connector synced, for the out-of-the-box detected teammates — *recommended, not required.* Without it the detected list can come back empty; you can still add an email by hand and send it.

---

## Installation

### AI Assisted (Recommended)

Paste this into any AI agent — Claude, Codex, Cursor, OpenCode, and others:

> [!NOTE]
> We suggest using **Claude Chat** rather than Claude Cowork for this step — Cowork's approach is noticeably slower and pricier for a quick install like this. Any Claude model works fine.

```
Install the following official skill from Well.

**Instructions**:

1. Fetch this file: 
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/invite-members/SKILL.md
2. Download and display this file to the user. The file name must be "SKILL.md". No prefix, no suffix. Exact name as specified.
3. Install this skill.
4. Before replying to the user, ensure you have named the downloaded file "SKILL.md". This is crucial for the rest of the steps.
5. If the MCP https://api.wellapp.ai/v1/mcp is not installed: suggest it to the user and explain how to add a new MCP.
```

### Manual Setup

#### Claude Desktop

Download the `.skill` file and double-click it — Claude Desktop installs it immediately, no drag-and-drop, no unzipping:

[⬇ Download for Claude Desktop](https://github.com/WellApp-ai/skills/raw/main/dist/invite-members.skill) · [.zip](https://github.com/WellApp-ai/skills/raw/main/dist/invite-members.zip)

#### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill invite-members
```

---

[← Back to all skills](../README.md#available-skills)

<p align="center">
  <img src="https://wellapp.ai/images/badges/soc2.avif" alt="SOC 2 Type I" height="40">
  <img src="https://wellapp.ai/images/badges/gdpr.avif" alt="GDPR Compliant" height="40">
</p>

<p align="center">
    <sub><b>Well is SOC-2 Type I and GDPR Compliant</b></sub>
</p>
