<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# FX exposure

**See how much of your cash and receivables sit outside your reporting currency.**

## What it does

If you hold invoices or bank balances in more than one currency, "how exposed are we to FX risk?" is easy to ask and hard to answer without a spreadsheet. This skill pulls your unpaid invoices and current cash balances, groups everything that isn't your reporting currency, and converts it using a real exchange rate — so you see the original amount, what it's worth in your own currency, and the rate and date behind the conversion.

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
A: No. It measures exposure so you can decide what to do about it. Well holds no forward or hedge record, so the skill states exposure and stops there.

**Q: What about an invoice with no totals in the accounting settings' currency?**
A: It is named in its own currency rather than restated. An invoice whose totals in the accounting settings' currency were never written, because its amount was unusable or no rate covered its currency on its issue date, is listed as unconverted exposure.

**Q: How is a rate found for a pair like dollars to pounds?**
A: Only euro-anchored pairs are stored, so a pair that does not touch the euro is converted through the euro in two steps. The answer states which route it took, and a currency with no route at all is counted in its own bucket instead of being folded into the total.

**Q: Can the converted total be incomplete?**
A: Yes, and it says so. When a counted account had no readable balance, or its currency had no rate, the converted total is a floor rather than the whole picture, and the accounts behind the gap are named beside it.

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

### Claude Desktop

[⬇ Install fx-exposure](https://github.com/WellApp-ai/skills/raw/main/dist/fx-exposure.skill) and open the downloaded file. Desktop installs the skill straight away, with nothing to unzip.

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
