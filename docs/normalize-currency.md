<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Convert currencies

**Turn mixed currencies into one number you can actually audit.**

## What it does

If your invoices are in euros and dollars, adding them up gives you a figure that isn't in any currency at all. This skill handles that properly: it either converts everything to one currency — telling you which exchange rate it used and from what date — or reports each currency separately. What it never does is quietly add them together.

It also does the boring-but-important part. If Well has no rate for today, it uses the most recent rate on or before your as-of date and says so, rather than reaching for a later one that would make the number impossible to reproduce tomorrow. And if Well has no rate for a currency at all, that currency is excluded and named, instead of silently shrinking your total.

Other Well skills call this one internally; you rarely need to run it yourself.

## Required data in Well

- **A resolvable home currency** (required). The conversion needs a target. The home currency comes from your accounting settings.
- **Banking or invoicing connector** (recommended). The amounts being converted come from your real balances and invoices.

## FAQ

**Q: Where do the rates come from?**
A: From Well's own exchange rate records, with the date each one was taken. The skill does not reach out to a market feed of its own.

**Q: Why not just give one total?**
A: It will, as long as it can state the rate and the date behind it. What it refuses to do is blend currencies into a figure with no rate attached.

**Q: Do I run this myself?**
A: Rarely. Other skills invoke it whenever their totals span more than one currency, which is why their answers name a rate.

---

## Installation

The file under `skills/normalize-currency/SKILL.md` is a shell: it carries the skill's name and description, and loads the instructions from Well's MCP server with `well_get_skill` when the skill runs. Install it once; it never goes stale.

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
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/normalize-currency/SKILL.md
2. Save it as a file named exactly "SKILL.md" inside a folder named "normalize-currency". No prefix, no suffix.
3. Install this skill.
4. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill normalize-currency
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
