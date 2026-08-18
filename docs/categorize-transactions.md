<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Categorize Transactions

**Get the month's transactions labelled — and see exactly how much of it is still guesswork.**

## What it does

A missing invoice you cannot see is a missing invoice nobody chases. This skill reads every transaction in the period you pinned, sorts them into what Well has categorized, what it labelled with low confidence, and what it has not touched at all, and shows you the gap — largest amounts first. It proposes labels in batches small enough to actually read, taken only from Well's own catalog of transaction categories, and writes nothing until you say yes to the batch in front of you. No sweep, no "apply to all", no invented label. It then re-reads the period and reports coverage before and after, so the read that follows rests on a number you can check rather than an assumption. Step five of Well's fetch-missing-invoices flow.

## Required data in Well

- **A resolved workspace** — *required.* Run `define-workspace` first; this skill takes its `workspace_id`.
- **A pinned period** — *required.* Run `define-period` first, or give the month yourself.
- **Banking connector** — *required.* The transactions being categorized come from your connected bank sources; run `connect-tools` if none is connected yet.
- **Accounting connector** (Pennylane, QuickBooks, Xero, …) — *optional.* Transactions already explained by a posted journal entry are counted as covered and left alone.

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
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/categorize-transactions/SKILL.md
2. Download and display this file to the user. The file name must be "SKILL.md". No prefix, no suffix. Exact name as specified.
3. Install this skill.
4. Before replying to the user, ensure you have named the downloaded file "SKILL.md". This is crucial for the rest of the steps.
5. If the MCP https://api.wellapp.ai/v1/mcp is not installed: suggest it to the user and explain how to add a new MCP.
```

### Manual Setup

#### Claude Desktop

Download the `.skill` file and double-click it — Claude Desktop installs it immediately, no drag-and-drop, no unzipping:

[⬇ Download for Claude Desktop](https://github.com/WellApp-ai/skills/raw/main/dist/categorize-transactions.skill) · [.zip](https://github.com/WellApp-ai/skills/raw/main/dist/categorize-transactions.zip)

#### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill categorize-transactions
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
