<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Deploy Agents

**See exactly which invoice-fetching agents Well would launch — before a single one runs.**

## What it does

You've just been shown the transactions with no invoice attached. The obvious next question is "so
go get them" — and the honest answer, today, is a preview. This skill takes those missing rows,
groups them into the agents Well would launch — one per provider, with the counterparties and the
number of transactions behind each — and writes it out in your language, one line per agent, plus
the rows only you can upload by hand and the providers still waiting to be connected. Then it says
plainly that nothing was started: no agent launched, no task queued, no browser session opened. It
is the last brick of Well's fetch-missing-invoices flow, running in preview mode, so you can check
the plan before the launch exists.

## Required data in Well

- **A Well workspace with a pinned period** — *required.* Comes from the `define-workspace` and
  `define-period` skills.
- **The missing rows for that period** — *required.* Comes from the `show-missing-invoices` skill,
  which lists the transactions with no invoice attached.
- **Bank, accounting, and invoicing connections** — *optional here.* This skill never reads them
  directly, but a provider that is not connected shows up as a row it cannot fetch; connect them
  with the `connect-tools` skill.

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
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/deploy-agents/SKILL.md
2. Download and display this file to the user. The file name must be "SKILL.md". No prefix, no suffix. Exact name as specified.
3. Install this skill.
4. Before replying to the user, ensure you have named the downloaded file "SKILL.md". This is crucial for the rest of the steps.
5. If the MCP https://api.wellapp.ai/v1/mcp is not installed: suggest it to the user and explain how to add a new MCP.
```

### Manual Setup

#### Claude Desktop

Download the `.skill` file and double-click it — Claude Desktop installs it immediately, no drag-and-drop, no unzipping:

[⬇ Download for Claude Desktop](https://github.com/WellApp-ai/skills/raw/main/dist/deploy-agents.skill) · [.zip](https://github.com/WellApp-ai/skills/raw/main/dist/deploy-agents.zip)

#### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill deploy-agents
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
