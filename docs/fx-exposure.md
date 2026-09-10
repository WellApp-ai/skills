<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# FX exposure

**See how much of your cash and receivables sit outside your home currency.**

## What it does

If you hold invoices or bank balances in more than one currency, "how exposed are we to FX risk?" is easy to ask and hard to answer without a spreadsheet. This skill pulls your unpaid invoices and current cash balances, groups everything that isn't your home currency, and converts it using a real exchange rate — so you see the original amount, what it's worth in your own currency, and the rate and date behind the conversion.

## Required data in Well

- **Invoicing / bills** (recommended). Needed to include outstanding receivables and payables in the exposure total. Without it, the skill falls back to cash-only exposure.
- **Banking connector** (recommended). Needed to include cash balances by currency. Without it, the skill falls back to invoice-only exposure.
- **At least one of the two above** (required). With neither connected, there is no exposure to measure.

## FAQ

**Q: Where does the exchange rate come from?**
A: From synced rate data, and the skill always shows the rate and its date so a conversion can be checked or re-run at a different rate.

**Q: What if only one of bank or invoicing is connected?**
A: It computes what it can and says which half is missing. With neither connected there is no exposure to measure and it says that instead of returning zero.

**Q: Does it hedge anything?**
A: No. It measures exposure so you can decide what to do about it.

---

## Installation

The file under `skills/fx-exposure/SKILL.md` is a shell: it carries the skill's name and description, and loads the instructions from Well's MCP server with `well_get_skill` when the skill runs. Install it once; it never goes stale.

### Claude Code

```
/plugin marketplace add WellApp-ai/skills
/plugin install well-skills@wellapp
```

### Codex CLI

```bash
codex plugin marketplace add WellApp-ai/skills
codex plugin add well-skills@wellapp
```

### Assisted by AI

Paste this into any AI agent (Claude, Codex, Cursor, OpenCode, and others):

```
Install the following official skill from Well. Instructions:

1. Fetch this file:
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/fx-exposure/SKILL.md
2. Save it as a file named exactly "SKILL.md" inside a folder named "fx-exposure". No prefix, no suffix.
3. Install this skill.
4. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill fx-exposure
```

Whatever the host, the skill needs the Well MCP server at `https://api.wellapp.ai/v1/mcp`. You'll be asked to sign in to Well the first time it needs your data.

---

[← Back to all skills](../README.md#available-skills)

<p align="center">
  <img src="https://wellapp.ai/images/badges/soc2.avif" alt="SOC 2 Type I" height="40">
  <img src="https://wellapp.ai/images/badges/gdpr.avif" alt="GDPR Compliant" height="40">
</p>

<p align="center">
    <sub><b>Well is SOC-2 Type I and GDPR Compliant</b></sub>
</p>
