<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Accounts Receivable Aging

**See who owes you money, and how long they've been sitting on it.**

## What it does

Chasing down late payments starts with knowing who's late. Ask your AI assistant who owes you money, and it pulls the answer straight from your synced invoices — every unpaid or partially-paid customer invoice, sorted into aging buckets (current, 1-30, 31-60, 61-90, 90+ days overdue) — with real currency amounts and an as-of date attached, not a guess.

## Required data in Well

- **Invoicing / accounting connector** — *required.* This is where your issued customer invoices and their payment status come from.
- **Company profile confirmed in Well** — *required.* The skill needs to know which company is yours so it can tell receivables (what customers owe you) apart from payables (what you owe others).

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
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/accounts-receivable-aging/SKILL.md
2. Download and display this file to the user. The file name must be "SKILL.md". No prefix, no suffix. Exact name as specified.
3. Install this skill.
4. Before replying to the user, ensure you have named the downloaded file "SKILL.md". This is crucial for the rest of the steps.
5. If the MCP https://api.wellapp.ai/v1/mcp is not installed: suggest it to the user and explain how to add a new MCP.
```

### Manual Setup

#### Claude Desktop

Download the `.skill` file and double-click it — Claude Desktop installs it immediately, no drag-and-drop, no unzipping:

[⬇ Download for Claude Desktop](https://github.com/WellApp-ai/skills/raw/main/dist/accounts-receivable-aging.skill) · [.zip](https://github.com/WellApp-ai/skills/raw/main/dist/accounts-receivable-aging.zip)

#### Advanced

<!-- placeholder: swap for the real skills.sh org/listing once this skill is actually published there -->

Install directly from **[skills.sh/wellapp](https://skills.sh/wellapp)**:

```bash
npx skills add wellapp/accounts-receivable-aging
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
