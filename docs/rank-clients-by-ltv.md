<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Rank Clients by LTV

**Find out who your best customers really are — ranked by what they've actually paid you.**

## What it does

Ask your AI assistant to rank your clients by lifetime value, and it pulls the answer straight from your synced invoices — every paid invoice, summed and grouped by customer, sorted from your biggest customer down — with real currency amounts and an as-of date attached, not a guess. To be upfront: this is a ranking of realized revenue paid to date, not a predictive model of future customer value (there's no churn or retention data behind it) — but it answers "who's paid us the most so far" honestly and reliably.

## Required data in Well

- **Invoicing / accounting connector** — *required.* This is where your issued customer invoices and their payment status come from.
- **Company profile confirmed in Well** — *required.* The skill needs to know which company is yours so it can tell your issued (customer-facing) invoices apart from bills you've received.

---

## Installation

### AI Assisted (Recommended)

Paste this into any AI agent — Claude, Codex, Cursor, OpenCode, and others:

> [!NOTE]
> We suggest using **Claude Chat** rather than Claude Cowork for this step — Cowork's approach is noticeably slower and pricier for a quick install like this. Any Claude model works fine.

<!-- NOTE: repo is currently private, so this raw link 404s until WellApp-ai/skills
     goes public. Link is permanent (no token) and will work as-is once it does. -->

```
Install the following official skill from Well.

**Instructions**:

1. Fetch this file: 
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/rank-clients-by-ltv/SKILL.md
2. Download and display this file to the user. The file name must be "SKILL.md". No prefix, no suffix. Exact name as specified.
3. Install this skill.
4. Before replying to the user, ensure you have named the downloaded file "SKILL.md". This is crucial for the rest of the steps.
5. If the MCP https://api.wellapp.ai/v1/mcp is not installed: suggest it to the user and explain how to add a new MCP.
```

### Manual Setup

#### Claude Desktop

Download the `.skill` file and double-click it — Claude Desktop installs it immediately, no drag-and-drop, no unzipping:

[⬇ Download for Claude Desktop](https://github.com/WellApp-ai/skills/raw/main/dist/rank-clients-by-ltv.skill) · [.zip](https://github.com/WellApp-ai/skills/raw/main/dist/rank-clients-by-ltv.zip)

#### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/rank-clients-by-ltv
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
