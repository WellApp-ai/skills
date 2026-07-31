<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Cash Balance Trend

**See whether your cash is going up or down — as a real history, not a guess.**

## What it does

Ask your AI assistant "is our cash going up or down?" and it pulls your real, synced bank balances over time — not a single snapshot, and never a forecast — and shows you exactly how your cash has moved: the dates, the balances, the currency, and the direction. If you want to know what's coming next, that's a different question (see the runway skill); this one only tells you what already happened.

## Required data in Well

- **Banking connector** — *required.* This is where your real historical cash balances come from.
- **More than one synced balance period per account** — *required for a trend.* A freshly connected account with only one snapshot has nothing to trend yet; the skill will say so plainly instead of guessing a direction.

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
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/cash-balance-trend/SKILL.md
2. Download and display this file to the user. The file name must be "SKILL.md". No prefix, no suffix. Exact name as specified.
3. Install this skill.
4. Before replying to the user, ensure you have named the downloaded file "SKILL.md". This is crucial for the rest of the steps.
5. If the MCP https://api.wellapp.ai/v1/mcp is not installed: suggest it to the user and explain how to add a new MCP.
```

### Manual Setup

#### Claude Desktop

Download the `.skill` file and double-click it — Claude Desktop installs it immediately, no drag-and-drop, no unzipping:

[⬇ Download for Claude Desktop](https://github.com/WellApp-ai/skills/raw/main/dist/cash-balance-trend.skill) · [.zip](https://github.com/WellApp-ai/skills/raw/main/dist/cash-balance-trend.zip)

#### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/cash-balance-trend
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
