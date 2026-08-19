<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Expense Breakdown

**See where your company's money actually goes — no spreadsheets required.**

## What it does

If you've ever had to stop and ask "wait, what *are* we spending on this month?", this is the skill for that. Ask your AI assistant where your money is going, and it pulls the answer straight from your synced ledger and invoices — your biggest expense categories, and the largest bills you still owe — with real currency amounts and an as-of date attached, not a guess.

## Required data in Well

- **Accounting connector** (e.g. QuickBooks, Xero) — groups the category breakdown by your own chart of accounts. *Recommended, not required:* without it you still get a real category breakdown, grouped by your bank feed's own categories instead of your ledger. The skill always states which grouping produced the numbers, so you know how precise they are.
- **Invoicing / bills** — needed to show your biggest outstanding bills (accounts payable).
- **Banking connector** — *optional* for this skill. Either a banking or an accounting connector is enough to get started.

## Composes onto

This skill delegates two setup steps to Well's atomic skills rather than repeating them:

- **[`define-workspace`](define-workspace.md)** — pins which Well workspace the answer is for.
- **[`connect-tools`](connect-tools.md)** — checks which of your bank / accounting / invoicing sources are connected.

Install both alongside this one. The skill still runs without them — each step falls back to resolving things inline — but with them installed you get one consistent workspace and connection flow across every Well skill. The **Claude Code plugin** and **Codex plugin** paths below install all three together; if you download the `.skill` file on its own, grab those two as well.

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
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/expense-breakdown/SKILL.md
2. This skill composes onto two atomic Well skills — fetch them as well:
    a. https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/define-workspace/SKILL.md
    b. https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/connect-tools/SKILL.md
3. Download and display these files to the user. Each file must be named "SKILL.md" — no prefix, no suffix, exact name as specified — and each must land in its own skill folder named after that skill.
4. Install these skills.
5. Before replying to the user, ensure every downloaded file is named "SKILL.md". This is crucial for the rest of the steps.
6. If the MCP https://api.wellapp.ai/v1/mcp is not installed: suggest it to the user and explain how to add a new MCP.
```

### Manual Setup

#### Claude Desktop

Download the `.skill` file and double-click it — Claude Desktop installs it immediately, no drag-and-drop, no unzipping:

[⬇ Download for Claude Desktop](https://github.com/WellApp-ai/skills/raw/main/dist/expense-breakdown.skill) · [.zip](https://github.com/WellApp-ai/skills/raw/main/dist/expense-breakdown.zip)

#### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill expense-breakdown
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
