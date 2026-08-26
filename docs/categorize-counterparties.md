<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Categorize Counterparties

**See which of the companies behind your spend still have no category — and put them in one, a batch at a time, only where you say yes.**

## What it does

A counterparty with no category is a company Well knows the name of and nothing else. This skill reads the counterparties whose invoices a month is still missing — or, asked on its own, every uncategorized counterparty in the workspace — and reports coverage in one line. On a month it says how many of those counterparties carry a category, how many do not, and which uncategorized one carries the most spend. On the workspace-wide ask it says how many counterparties carry no category and that the read lists the first 50 of them; that scope holds no amounts, so it names no biggest company. The card that comes back is where the categorizing happens: it lists the first twelve counterparties and names the rest in a More line, every listed row carries a category select fed by Well's shared catalog, each pick you make saves that company immediately with no submit to press, and its Continue button hands the conversation back when you are done. Categorizing tells Well more about your vendors; it does not change which invoices are missing. The skill makes that one read, points at the card, and stops — it proposes categories only when you ask it to, and then from the rows it already holds plus Well's category catalog, biggest spend first on a month, writing only the ones you confirm. Nothing is ever assigned outside the catalog. It is the categorization step of Well's fetch-missing-invoices flow — it runs after the period is picked and before the flow lists the gaps.

## Required data in Well

- **A resolved workspace** — *required.* Run `define-workspace` first; this skill takes its `workspace_id`.
- **A month or period** — *optional.* Run `define-period` to scope the pass to one month; without one, the skill runs workspace-wide over everything still uncategorized.
- **Banking connector** — *required.* Bank data is what makes a counterparty's settled spend visible at all.
- **Accounting connector** (Pennylane, QuickBooks, Xero, …) — *optional, widens the list.*
- **Invoicing / payment portals** (Stripe, Shopify, SaaS vendors) — *optional, widens the list.*

## Composes onto

This skill delegates one setup step to a Well atomic skill rather than repeating it:

- **[`define-workspace`](define-workspace.md)** — pins which Well workspace the counterparties are read from.

Install it alongside this one. Without it there is no workspace to categorize against, so the skill has nothing to read; with it installed you get one consistent workspace flow across every Well skill. The **Claude Code plugin** and **Codex plugin** paths below install both together; if you download the `.skill` file on its own, grab `define-workspace` as well.

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
    a. https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/categorize-counterparties/SKILL.md
    b. https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/define-workspace/SKILL.md
2. Download and display these files to the user. The file name must be "SKILL.md". No prefix, no suffix. Exact name as specified.
3. Install these skills.
4. Before replying to the user, ensure you have named the downloaded files "SKILL.md". This is crucial for the rest of the steps.
5. If the MCP https://api.wellapp.ai/v1/mcp is not installed: suggest it to the user and explain how to add a new MCP.
```

### Manual Setup

#### Claude Desktop

Download the `.skill` file and double-click it — Claude Desktop installs it immediately, no drag-and-drop, no unzipping:

[⬇ Download for Claude Desktop](https://github.com/WellApp-ai/skills/raw/main/dist/categorize-counterparties.skill) · [.zip](https://github.com/WellApp-ai/skills/raw/main/dist/categorize-counterparties.zip)

#### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill categorize-counterparties
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
