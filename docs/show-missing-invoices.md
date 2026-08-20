<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Show Missing Invoices

**See every euro you spent last month that still has no supplier invoice — and how to close each gap.**

## What it does

Ask your AI assistant what you are missing for a month, and it reads Well's gap list for that period: the money that actually left your bank account and still has no supplier invoice behind it, one row per supplier, with the number of transactions and the total. Each row says how the gap can be closed — Well's agent can fetch it from the supplier's portal, the provider needs connecting first, or it needs an upload from you. Amounts that Well has no exchange rate for are shown as unavailable rather than folded into a wrong total, and the list covers your categorized expense transactions, which the skill tells you every time. It is the fourth step of Well's fetch-missing-invoices flow — it lists the gaps and hands them on. It never collects the documents itself.

## Required data in Well

- **A workspace and a period** — *required.* The `define-workspace` skill pins the entity, and the `define-period` skill resolves the month or fiscal period this list is about.
- **Banking connector** — required. Settled spend is what makes a gap visible; without it there is nothing to be missing an invoice against.
- **Accounting or invoicing connector** — *optional but recommended.* This is what lets Well match an invoice to a payment, so an already-received invoice stops showing up as a gap.

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
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/show-missing-invoices/SKILL.md
2. Download and display this file to the user. The file name must be "SKILL.md". No prefix, no suffix. Exact name as specified.
3. Install this skill.
4. Before replying to the user, ensure you have named the downloaded file "SKILL.md". This is crucial for the rest of the steps.
5. If the MCP https://api.wellapp.ai/v1/mcp is not installed: suggest it to the user and explain how to add a new MCP.
```

### Manual Setup

#### Claude Desktop

Download the `.skill` file and double-click it — Claude Desktop installs it immediately, no drag-and-drop, no unzipping:

[⬇ Download for Claude Desktop](https://github.com/WellApp-ai/skills/raw/main/dist/show-missing-invoices.skill) · [.zip](https://github.com/WellApp-ai/skills/raw/main/dist/show-missing-invoices.zip)

#### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill show-missing-invoices
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
