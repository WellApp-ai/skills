<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Connect Tools

**Know which sources are plugged into Well — bank, accounting, invoicing — and connect the missing ones in one click.**

## What it does

Every grounded answer rests on what is connected. This skill reads the live connection state of a workspace — which bank accounts, accounting software, and invoicing or payment portals are connected, still running their first sync, or in error — and, for whatever is missing, hands your AI assistant Well's one-click install links (in Claude Desktop, the connect card itself). Once a connection lands it re-checks on its own and moves the flow forward, then reports a plain coverage line: bank connected, accounting needs a reconnect, invoicing missing. It is steps two and three of Well's fetch-missing-invoices flow and the connector check every Well data skill relies on.

## Required data in Well

- **A resolved workspace** — *required.* Run `define-workspace` first; this skill takes its `workspace_id`.
- **Banking connector** — *checked, connected here if missing.*
- **Accounting connector** (Pennylane, QuickBooks, Xero, …) — *checked, connected here if missing.*
- **Invoicing / payment portals** (Stripe, Shopify, SaaS vendors) — *checked, connected here if missing.*

---

## Composes onto

This skill delegates one setup step to a Well atomic skill rather than repeating it:

- **[`define-workspace`](define-workspace.md)** — pins which Well workspace the connections are checked for.

Install it alongside this one. The skill still runs without it — step 2 falls back to resolving the workspace inline — but with it installed you get one consistent workspace flow across every Well skill. The **Claude Code plugin** and **Codex plugin** paths below install all two together; if you download the `.skill` file on its own, grab `define-workspace` as well.

---

## Installation

### AI Assisted (Recommended)

Paste this into any AI agent — Claude, Codex, Cursor, OpenCode, and others:

> [!NOTE]
> We suggest using **Claude Chat** rather than Claude Cowork for this step — Cowork's approach is noticeably slower and pricier for a quick install like this. Any Claude model works fine.

```
Install the following official skills from Well.

**Instructions**:

1. Fetch these files:
    a. https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/connect-tools/SKILL.md
    b. https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/define-workspace/SKILL.md
2. Download and display these files to the user. The file name must be "SKILL.md". No prefix, no suffix. Exact name as specified.
3. Install these skills.
4. Before replying to the user, ensure you have named the downloaded files "SKILL.md". This is crucial for the rest of the steps.
5. If the MCP https://api.wellapp.ai/v1/mcp is not installed: suggest it to the user and explain how to add a new MCP.
```

### Manual Setup

#### Claude Desktop

Download the `.skill` file and double-click it — Claude Desktop installs it immediately, no drag-and-drop, no unzipping:

[⬇ Download for Claude Desktop](https://github.com/WellApp-ai/skills/raw/main/dist/connect-tools.skill) · [.zip](https://github.com/WellApp-ai/skills/raw/main/dist/connect-tools.zip)

#### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill connect-tools
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
