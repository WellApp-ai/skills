<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Assign Missing Invoices

**Sort out who owns the expenses that still have no invoice — before you close the month.**

## What it does

When spend has settled but its supplier invoice is still missing, someone has to own getting it. This skill lists the expense lines that have no invoice for a month, split into what nobody owns yet, what is already yours, and what is owned by others, and lets you assign a set of owners to a line — or to several lines at once — straight from the card. Assignment is per transaction and the owner is a set of people: picking owners on a line replaces its owner set, and each month is assigned fresh. Assigning a vendor's month to several people holds one task per owner, and one supplier invoice resolves every owner's task for that gap. It sorts ownership only — it never fetches or collects the documents, and it never closes the period. Owners are people already in the workspace.

## Required data in Well

- **Banking connector** — required. The missing-invoice lines come from the bank feed, so with no bank connected there is nothing to assign; the skill routes you to connect one first.
- A completed month with settled transactions — required. A month with no expenses missing an invoice has nothing to assign (which is not the same as the month being closed).

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
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/assign-missing-invoices/SKILL.md
2. Download and display this file to the user. The file name must be "SKILL.md". No prefix, no suffix. Exact name as specified.
3. Install this skill.
4. Before replying to the user, ensure you have named the downloaded file "SKILL.md". This is crucial for the rest of the steps.
5. If the MCP https://api.wellapp.ai/v1/mcp is not installed: suggest it to the user and explain how to add a new MCP.
```

### Manual Setup

#### Claude Desktop

Download the `.skill` file and double-click it — Claude Desktop installs it immediately, no drag-and-drop, no unzipping:

[⬇ Download for Claude Desktop](https://github.com/WellApp-ai/skills/raw/main/dist/assign-missing-invoices.skill) · [.zip](https://github.com/WellApp-ai/skills/raw/main/dist/assign-missing-invoices.zip)

#### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill assign-missing-invoices
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
