<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Average Monthly Burn

**Know what actually leaves the account each month.**

## What it does

Ask your AI assistant what your burn rate is, and it reports the trailing average of your real monthly outflows — internal transfers excluded, currencies converted, and every month in the window counted in the divisor.

It computes the figure rather than reading it off a black box, which means you can see what it rests on. Each check runs in the open: the connection, whether the syncs actually finished, whether your accounts are attached to companies you own, whether the window's transactions are categorized. A check that fails **stops** and shows you what to fix, with the number of rows and the amount at stake, instead of reporting a figure with a caveat you would have to notice.

You also choose what does not count. Internal transfers leave the figure automatically, by a structural rule rather than a label; anything else your business does not treat as spend, you exempt yourself, with each option showing what it removes.

## Required data in Well

- **Banking connector** — *required.* This is where your real outflows come from.
- **Accounting settings** — *required.* Only the base currency, so amounts can be converted.

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
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/avg-burn/SKILL.md
2. Download and display this file to the user. The file name must be "SKILL.md". No prefix, no suffix. Exact name as specified.
3. Install this skill.
4. Before replying to the user, ensure you have named the downloaded file "SKILL.md". This is crucial for the rest of the steps.
5. If the MCP https://api.wellapp.ai/v1/mcp is not installed: suggest it to the user and explain how to add a new MCP.
```

### Manual Setup

#### Claude Desktop

Download the `.skill` file and double-click it — Claude Desktop installs it immediately, no drag-and-drop, no unzipping:

[⬇ Download for Claude Desktop](https://github.com/WellApp-ai/skills/raw/main/dist/avg-burn.skill) · [.zip](https://github.com/WellApp-ai/skills/raw/main/dist/avg-burn.zip)

#### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill avg-burn
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
