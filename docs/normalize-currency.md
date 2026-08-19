<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Normalize Currency

**Stop multi-currency totals from becoming one meaningless number.**

## What it does

If your invoices are in euros and dollars, adding them up gives you a figure that isn't in any currency at all. This skill handles that properly: it either converts everything to one currency — telling you which exchange rate it used and from what date — or reports each currency separately. What it never does is quietly add them together.

It also does the boring-but-important part. If Well has no rate for today, it uses the most recent rate on or before your as-of date and says so, rather than reaching for a later one that would make the number impossible to reproduce tomorrow. And if Well has no rate for a currency at all, that currency is excluded and named, instead of silently shrinking your total.

Other Well skills call this one internally; you rarely need to run it yourself.

## Required data in Well

- **Any connector that has synced amounts** — invoicing, accounting, or bank.
- **Exchange rates in Well** — needed only for converting to a single currency. Without them you still get a clean per-currency breakdown; you just don't get one total.

## Composes onto

This skill delegates one setup step to a Well atomic skill rather than repeating it:

- **[`define-workspace`](define-workspace.md)** — pins which Well workspace the rates and amounts belong to, and supplies the base currency used as the default conversion target.

Install it alongside this one. The skill still runs without it — step 1 falls back to resolving the workspace inline — but with it installed you get one consistent workspace flow across every Well skill. The **Claude Code plugin** and **Codex plugin** paths below install all two together; if you download the `.skill` file on its own, grab `define-workspace` as well.

---

## Installation

### AI Assisted (Recommended)

Paste this into any AI agent — Claude, Codex, Cursor, OpenCode, and others:

> [!NOTE]
> We suggest using **Claude Chat** rather than Claude Cowork for this step — Cowork's approach is noticeably slower and pricier for a quick install like this. Any Claude model works fine.

```
Install the following official skills from Well.

**Instructions**:

1. Fetch these files:
    a. https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/normalize-currency/SKILL.md
    b. https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/define-workspace/SKILL.md
2. Download and display these files to the user. The file name must be "SKILL.md". No prefix, no suffix. Exact name as specified.
3. Install these skills.
4. Before replying to the user, ensure you have named the downloaded files "SKILL.md". This is crucial for the rest of the steps.
5. If the MCP https://api.wellapp.ai/v1/mcp is not installed: suggest it to the user and explain how to add a new MCP.
```

### Manual Setup

#### Claude Desktop

Download the `.skill` file and double-click it — Claude Desktop installs it immediately, no drag-and-drop, no unzipping:

[⬇ Download for Claude Desktop](https://github.com/WellApp-ai/skills/raw/main/dist/normalize-currency.skill) · [.zip](https://github.com/WellApp-ai/skills/raw/main/dist/normalize-currency.zip)

#### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill normalize-currency
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
