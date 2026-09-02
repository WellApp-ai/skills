<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Cash Position Forecast

**See your cash month by month, including the floor.**

## What it does

Ask your AI assistant to project your cash forward, and it returns your real settled month-end balances followed by a worst-case projection — the same series the Well app charts. The projection assumes no incoming revenue, so it is a floor rather than a prediction, and the answer says so every time rather than letting you mistake one for the other.

## Required data in Well

- **Banking connector** — *required.* The forecast is built from your real month-end balance history, so this is what makes it possible.

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
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/cash-forecast/SKILL.md
2. Download and display this file to the user. The file name must be "SKILL.md". No prefix, no suffix. Exact name as specified.
3. Install this skill.
4. Before replying to the user, ensure you have named the downloaded file "SKILL.md". This is crucial for the rest of the steps.
5. If the MCP https://api.wellapp.ai/v1/mcp is not installed: suggest it to the user and explain how to add a new MCP.
```

### Manual Setup

#### Claude Desktop

Download the `.skill` file and double-click it — Claude Desktop installs it immediately, no drag-and-drop, no unzipping:

[⬇ Download for Claude Desktop](https://github.com/WellApp-ai/skills/raw/main/dist/cash-forecast.skill) · [.zip](https://github.com/WellApp-ai/skills/raw/main/dist/cash-forecast.zip)

#### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill cash-forecast
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
