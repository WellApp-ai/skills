<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Fetch Missing Invoices

**One prompt, the whole month-end sweep — and a preview of the agents that would go and get the invoices you are missing.**

## What it does

Chasing supplier invoices at month end is six questions, not one: which entity, which month, is the bank feed actually live, which of that month's vendors carry no industry label, what is actually missing, and who can go and get the rest. This skill asks them in that order and routes on each answer instead of guessing. It pins the workspace, gets the bank feed in first when no month on the picker holds a bank transaction at all, fixes the month, gets the bank feed in when a month you picked holds no bank transaction, offers to label the month's counterparties that carry no industry category, lists the settled spend that still has no supplier invoice, and finishes with a preview of the invoice-fetching agents — which provider, how many invoices, what you would still upload by hand. Every stop is named: no workspace, no month, no bank, no gap list, or nothing missing at all. The preview is a dry run: it launches no agent, queues no task, and opens no browser session. Pick several entities at the workspace step and the whole flow runs once per workspace, in order, with one recap per entity — never a merged view.

It carries the order, not the steps. It runs eight steps over seven Well skills, `connect-bank` owning the two bank steps and one brick owning each of the rest — `define-workspace`, `define-period`, `connect-bank`, `categorize-counterparties`, `show-missing-invoices`, `connect-tools`, and `deploy-agents` — which this file runs in a fixed order rather than repeating what they do. Install it on its own and only the workspace step stops the flow: five steps fall back to an inline copy of the part the order depends on, and the bank step falls back to `connect-tools` scoped to banks. The categorization step runs only when your Well server exposes the counterparty list; without it the flow says so instead of guessing.

## Required data in Well

- **A Well account with at least one workspace** — *required.* The flow stops before it reads anything if none is pinned.
- **A bank connection** — *required in practice.* Settled bank spend is what makes a missing invoice visible; with nothing connected there is nothing to compare invoices against.
- **An accounting connection** (Pennylane, QuickBooks, Xero…) — *optional.* It is what lets Well match an invoice to the spend, so the gap list is sharper with it.
- **Invoicing and payment portals** (Stripe, Shopify…) — *optional.* Each one connected turns a manual upload into a gap an agent could fetch.

## Composes onto

This skill delegates its eight steps to **seven** of Well's atomic skills rather than repeating them, one brick per step and `connect-bank` owning both bank steps:

- **[`define-workspace`](define-workspace.md)** — pins which Well workspace the run is for, and drives the sign-in when there is no connection yet.
- **[`define-period`](define-period.md)** — fixes which month or months the run covers.
- **[`connect-bank`](connect-bank.md)** — the bank feed on its own, which is what makes a missing invoice visible. It runs before the month when no month on the picker holds a bank transaction at all, and after the month when any month you picked holds none. Never both.
- **[`categorize-counterparties`](categorize-counterparties.md)** — raises category coverage when the month's vendors carry no industry label.
- **[`show-missing-invoices`](show-missing-invoices.md)** — lists the settled spend with no supplier invoice, and takes your pick of the vendors to chase.
- **[`connect-tools`](connect-tools.md)** — reads which services Well holds a connector for behind the vendors you picked, and carries the connect links, so you can connect a service instead of running an agent for it.
- **[`deploy-agents`](deploy-agents.md)** — previews what Well would fetch for the vendors you picked, and hands those portals to the collect link.

The order is this skill's own: it walks the bricks one at a time, asks for the bank before the month when no month on the picker holds a bank transaction and after the month when one you picked holds none, offers the connect step for the vendors Well holds a connector for, and previews what Well would fetch for the rest.

Install all seven alongside this one. The skill still runs without them — only the workspace step stops the flow, five steps fall back to an inline copy of what the order needs, and the bank step falls back to `connect-tools` — but with them installed each step is owned in one place. The **Claude Code plugin** and **Codex plugin** paths below install all eight together; if you download the `.skill` file on its own, grab those seven as well.

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
    a. https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/fetch-missing-invoices/SKILL.md
    b. https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/define-workspace/SKILL.md
    c. https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/define-period/SKILL.md
    d. https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/connect-bank/SKILL.md
    e. https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/categorize-counterparties/SKILL.md
    f. https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/show-missing-invoices/SKILL.md
    g. https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/connect-tools/SKILL.md
    h. https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/deploy-agents/SKILL.md
2. Download and display these files to the user. The file name must be "SKILL.md". No prefix, no suffix. Exact name as specified.
3. Install these skills.
4. Before replying to the user, ensure you have named the downloaded files "SKILL.md". This is crucial for the rest of the steps.
5. If the MCP https://api.wellapp.ai/v1/mcp is not installed: suggest it to the user and explain how to add a new MCP.
```

### Manual Setup

#### Claude Desktop

Download the `.skill` file and double-click it — Claude Desktop installs it immediately, no drag-and-drop, no unzipping:

[⬇ Download for Claude Desktop](https://github.com/WellApp-ai/skills/raw/main/dist/fetch-missing-invoices.skill) · [.zip](https://github.com/WellApp-ai/skills/raw/main/dist/fetch-missing-invoices.zip)

#### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill fetch-missing-invoices
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
