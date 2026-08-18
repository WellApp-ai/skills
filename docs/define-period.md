<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Define Period

**Pin the one month a job is about — in your calendar and in your fiscal one.**

## What it does

"Last month", "March", "Q1" — everyone means a month, and almost nobody says which one. Before your AI assistant can tell you which invoices are missing or what still needs reviewing, it has to agree with you on exactly one month, and translate it into the fiscal year and period your books actually use. This skill proposes the last complete month, accepts what you named ("March", "2026-03", "this month"), asks which month you mean when you say a quarter, and derives the fiscal coordinate from your workspace's fiscal-year start — so a March in an April-to-March fiscal year lands in period 12 of the previous fiscal year, not period 3. It also tells you whether the month holds any activity, and it reads only: it never closes, locks, or posts anything. Third step of Well's fetch-missing-invoices flow, after `define-workspace` and `connect-tools`.

## Required data in Well

- **A Well account with at least one workspace** — *required.* The month is pinned against that workspace's fiscal-year setting; when the workspace has none, the skill assumes a calendar year and says so.
- **A bank connection** — *optional.* Used only to tell you whether the month holds any activity. Without it the skill still pins the month and reports the activity as unknown rather than guessing.

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
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/define-period/SKILL.md
2. Download and display this file to the user. The file name must be "SKILL.md". No prefix, no suffix. Exact name as specified.
3. Install this skill.
4. Before replying to the user, ensure you have named the downloaded file "SKILL.md". This is crucial for the rest of the steps.
5. If the MCP https://api.wellapp.ai/v1/mcp is not installed: suggest it to the user and explain how to add a new MCP.
```

### Manual Setup

#### Claude Desktop

Download the `.skill` file and double-click it — Claude Desktop installs it immediately, no drag-and-drop, no unzipping:

[⬇ Download for Claude Desktop](https://github.com/WellApp-ai/skills/raw/main/dist/define-period.skill) · [.zip](https://github.com/WellApp-ai/skills/raw/main/dist/define-period.zip)

#### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill define-period
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
