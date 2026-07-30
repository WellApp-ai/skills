<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Daily Data Sweep

**Know whether today's numbers can be trusted, before you quote one.**

## What it does

Ask your AI assistant to run the daily sweep, and it audits your Well workspace's data for two separate failure modes: **COMPLETE** — the records that exist are whole, verified, categorized, and reconciled — and **EXHAUSTIVE** — nothing is missing, every source that should be connected is connected, and no month, account, or entity is silently excluded. The two verdicts are always reported separately, never merged into one score, because they point to different fixes: a COMPLETE failure means repair or re-verify a record; an EXHAUSTIVE failure means connect or backfill a source. This skill never answers a financial question itself — for cash, runway, expenses, or receivables, use the dedicated skill — and it never fixes, syncs, or categorizes anything. It only tells you, plainly, whether you can trust what those other skills would say.

## Required data in Well

- **Any connector** — required. The sweep audits whatever is connected; a workspace with nothing synced gets an emptiness check, not a verdict.
- **Banking connector** — recommended. Unlocks the banking-depth family (`BANK-`), which every chart-facing skill depends on and which a red here blocks.
- **Invoicing / accounting connector** — recommended. Unlocks the bookkeeping proof chain (`BOOK-`, `DOC-`) and invoice-banking linkage checks.

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
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/daily-data-sweep/SKILL.md
2. Download and display this file to the user. The file name must be "SKILL.md". No prefix, no suffix. Exact name as specified.
3. Install this skill.
4. Before replying to the user, ensure you have named the downloaded file "SKILL.md". This is crucial for the rest of the steps.
5. If the MCP https://api.wellapp.ai/v1/mcp is not installed: suggest it to the user and explain how to add a new MCP.
```

### Manual Setup

#### Claude Desktop

Download the `.skill` file and double-click it — Claude Desktop installs it immediately, no drag-and-drop, no unzipping:

[⬇ Download for Claude Desktop](https://github.com/WellApp-ai/skills/raw/main/dist/daily-data-sweep.skill) · [.zip](https://github.com/WellApp-ai/skills/raw/main/dist/daily-data-sweep.zip)

#### Advanced

<!-- placeholder: swap for the real skills.sh org/listing once this skill is actually published there -->

Install directly from **[skills.sh/wellapp](https://skills.sh/wellapp)**:

```bash
npx skills add wellapp/daily-data-sweep
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
