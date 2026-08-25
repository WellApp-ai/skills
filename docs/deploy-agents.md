<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Deploy Agents

**See exactly which invoice-fetching agents Well would launch — before a single one runs.**

## What it does

You've just been shown the transactions with no invoice attached. The obvious next question is "so
go get them" — and the answer starts with a preview. This skill takes the vendors you picked, groups
them into the agents Well would run — one per provider, with the counterparties and the number of
transactions behind each — and writes it out in your language, one line per agent, plus the rows only
you can upload by hand and the providers still waiting to be connected. Nothing collects anything
yet: no agent has run, no task is queued, no browser session is open.

Then it hands the vendors over. The preview card gives a checkbox to each vendor Well can reach a
portal for. Tick the ones to chase, and the card's **Deploy** action opens Well's collect page for
those portals. The Well browser extension is the only thing that collects from them, and it starts
on that page, when you tell it to. This skill is the last brick of Well's fetch-missing-invoices
flow: read the plan first, then hand it over.

## Required data in Well

- **A Well workspace with a pinned period** — *required.* Comes from the `define-workspace` and
  `define-period` skills.
- **The missing rows for that period** — *required.* Comes from the `show-missing-invoices` skill,
  which lists the transactions with no invoice attached.
- **Bank, accounting, and invoicing connections** — *optional here.* This skill never reads them
  directly, but a provider that is not connected shows up as a row it cannot fetch; connect them
  with the `connect-tools` skill.

## Composes onto

This skill delegates three setup steps to Well's atomic skills rather than repeating them:

- **[`define-workspace`](define-workspace.md)** — pins which Well workspace the preview is for.
- **[`define-period`](define-period.md)** — resolves the month or fiscal period, and writes the
  selection Well reads when it builds the preview.
- **[`show-missing-invoices`](show-missing-invoices.md)** — lists the transactions with no invoice,
  which are the rows this preview groups into agents.

Install all three alongside this one. This skill needs them: it resolves no workspace of its own,
never guesses a month, and never rebuilds the gap list, so without them there is nothing to preview.
The **Claude Code plugin** and **Codex plugin** paths below install all four together; if you
download the `.skill` file on its own, grab those three as well.

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
    a. https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/deploy-agents/SKILL.md
    b. https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/define-workspace/SKILL.md
    c. https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/define-period/SKILL.md
    d. https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/show-missing-invoices/SKILL.md
2. Download and display these files to the user. The file name must be "SKILL.md". No prefix, no suffix. Exact name as specified.
3. Install these skills.
4. Before replying to the user, ensure you have named the downloaded files "SKILL.md". This is crucial for the rest of the steps.
5. If the MCP https://api.wellapp.ai/v1/mcp is not installed: suggest it to the user and explain how to add a new MCP.
```

### Manual Setup

#### Claude Desktop

Download the `.skill` file and double-click it — Claude Desktop installs it immediately, no drag-and-drop, no unzipping:

[⬇ Download for Claude Desktop](https://github.com/WellApp-ai/skills/raw/main/dist/deploy-agents.skill) · [.zip](https://github.com/WellApp-ai/skills/raw/main/dist/deploy-agents.zip)

#### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill deploy-agents
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
