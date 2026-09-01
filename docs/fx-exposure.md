<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# FX Exposure

**See exactly how much of your cash and receivables sit outside your home currency — and what that's worth today.**

## What it does

If you hold invoices or bank balances in more than one currency, "how exposed are we to FX risk?" is easy to ask and hard to answer without a spreadsheet. This skill pulls your unpaid invoices and current cash balances, groups everything that isn't your home currency, and converts it using a real exchange rate — so you see the original amount, what it's worth in your own currency, and the rate and date behind the conversion.

## Required data in Well

- **Invoicing / bills** — needed to include outstanding receivables and payables in the exposure total. *Recommended, not required:* without it, the skill falls back to cash-only exposure.
- **Banking connector** — needed to include cash balances by currency. *Recommended, not required:* without it, the skill falls back to invoice-only exposure.
- At least one of the two above is required to compute anything — with neither connected, there's no exposure to measure.

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
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/fx-exposure/SKILL.md
2. Download and display this file to the user. The file name must be "SKILL.md". No prefix, no suffix. Exact name as specified.
3. Install this skill.
4. Before replying to the user, ensure you have named the downloaded file "SKILL.md". This is crucial for the rest of the steps.
5. If the MCP https://api.wellapp.ai/v1/mcp is not installed: suggest it to the user and explain how to add a new MCP.
```

### Manual Setup

#### Claude Desktop

Download the `.skill` file and double-click it — Claude Desktop installs it immediately, no drag-and-drop, no unzipping:

[⬇ Download for Claude Desktop](https://github.com/WellApp-ai/skills/raw/main/dist/fx-exposure.skill) · [.zip](https://github.com/WellApp-ai/skills/raw/main/dist/fx-exposure.zip)

#### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill fx-exposure
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
