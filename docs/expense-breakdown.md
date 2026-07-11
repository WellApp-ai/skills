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

- **Accounting connector** (e.g. QuickBooks, Xero) — powers the category breakdown from your real ledger. *Recommended, not required:* without it, the skill falls back to estimating from your invoices instead.
- **Invoicing / bills** — needed to show your biggest outstanding bills (accounts payable).
- **Banking connector** — *optional* for this skill. Either a banking or an accounting connector is enough to get started.

---

## Installation

### AI Assisted (Recommended)

Paste this into any AI agent — Claude, Codex, Cursor, OpenCode, and others:

<!-- NOTE: repo is currently private, so this raw link 404s until WellApp-ai/skills
     goes public. Link is permanent (no token) and will work as-is once it does. -->

```
Install the following official skill from Well.

**Instructions**:

1. Fetch this file: 
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/expense-breakdown/SKILL.md
2. Download and display this file to the user. The file name must be "SKILL.md". No prefix, no suffix. Exact name as specified.
3. Install this skill.
4. Before replying to the user, ensure you have named the downloaded file "SKILL.md". This is crucial for the rest of the steps.
5. If the MCP https://api.wellapp.ai/v1/mcp is not installed: suggest it to the user and explain how to add a new MCP.
```

### Manual Setup

#### Claude Desktop

Download the `.skill` file and double-click it — Claude Desktop installs it immediately, no drag-and-drop, no unzipping:

[⬇ Download for Claude Desktop](https://github.com/WellApp-ai/skills/raw/main/dist/expense-breakdown.skill) · [.zip](https://github.com/WellApp-ai/skills/raw/main/dist/expense-breakdown.zip)

#### Advanced

<!-- placeholder: swap for the real skills.sh org/listing once this skill is actually published there -->

Install directly from **[skills.sh/wellapp](https://skills.sh/wellapp)**:

```bash
npx skills add wellapp/expense-breakdown
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
