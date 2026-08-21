<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Fetch Missing Invoices

**One prompt, the whole month-end sweep — and a preview of the agents that would go and get the invoices you are missing.**

## What it does

Chasing supplier invoices at month end is seven questions, not one: which entity, what is connected, is the bank feed actually live, which month, what is actually missing, is the month even labelled well enough to tell, and who can go and get the rest. This skill asks them in that order and routes on each answer instead of guessing. It pins the workspace, checks your bank, accounting, and invoicing connections, gets the bank feed in, fixes the month, lists the settled spend that still has no supplier invoice, raises categorization coverage when the list is too thin to trust, and finishes with a preview of the invoice-fetching agents — which provider, how many invoices, what you would still upload by hand. Every stop is named: no workspace, nothing connected, no bank, no month, no gap list, or nothing missing at all. The preview is a dry run: it launches no agent, queues no task, and opens no browser session. Pick several entities at the workspace step and the whole flow runs once per workspace, in order, with one recap per entity — never a merged view.

It carries the whole flow in one file. Each step also exists as its own skill — `define-workspace`, `connect-tools`, `connect-bank`, `define-period`, `categorize-counterparties`, `show-missing-invoices`, and `deploy-agents` — for use one at a time, but this skill reads none of them, so installing this one brings the whole flow. The categorization step runs only when your Well server exposes the counterparty list; without it the flow says so instead of guessing.

## Required data in Well

- **A Well account with at least one workspace** — *required.* The flow stops before it reads anything if none is pinned.
- **A bank connection** — *required in practice.* Settled bank spend is what makes a missing invoice visible; with nothing connected there is nothing to compare invoices against.
- **An accounting connection** (Pennylane, QuickBooks, Xero…) — *optional.* It is what lets Well match an invoice to the spend, so the gap list is sharper with it.
- **Invoicing and payment portals** (Stripe, Shopify…) — *optional.* Each one connected turns a manual upload into a gap an agent could fetch.

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
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/fetch-missing-invoices/SKILL.md
2. Download and display this file to the user. The file name must be "SKILL.md". No prefix, no suffix. Exact name as specified.
3. Install this skill.
4. Before replying to the user, ensure you have named the downloaded file "SKILL.md". This is crucial for the rest of the steps.
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
