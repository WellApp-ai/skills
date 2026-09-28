<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Burn rate

**Know what you spend in an average month over a window you can see, with the months that carried no spend counted.**

## What it does

Ask your AI assistant what your burn rate is, and it reports the trailing average of your real monthly outflows: internal transfers excluded, currencies converted, and every month in the window counted in the divisor.
It computes the figure rather than reading it off a black box, which means you can see what it rests on. Each check runs in the open: the connection, whether the syncs actually finished, whether your accounts are attached to companies you own, whether the window's transactions are categorized. A check that fails **stops** and shows you what to fix, with the number of rows and the amount at stake, instead of reporting a figure with a caveat you would have to notice.
You also choose what does not count. Internal transfers leave the figure automatically, by a structural rule rather than a label; anything else your business does not treat as spend, you exempt yourself, with each option showing what it removes.
It refuses more than it reports. It does not guess which sign means money leaving, it does not turn an uncounted exclusion into a zero, it does not add two currencies together in silence, and it does not put a figure on screen when the read behind it came back empty.

## Required data in Well

- **Banking connector** (required). This is where the real outflows come from.
- **Your own company, set on the workspace** (required). A movement between two accounts you own is not money leaving the business. Telling one from the other is a test on the accounts behind each side, so the accounts have to be attached to a company you own.

## FAQ

**Q: Why average instead of last month?**
A: Because one annual invoice or a delayed payroll run can double or halve a single month. The average over a window is the figure you can plan against.

**Q: Can I change the window?**
A: Yes. Ask for a different number of months and the skill recomputes, and it always states the window it used.

**Q: What if a month had no spend?**
A: The skill reports how much of the window actually carried spend. An average over a mostly empty window is flagged rather than presented as fact.

**Q: How does it know which rows are money going out?**
A: It measures it, and it refuses to guess. Some feeds record an outflow as a negative amount and some record it as a positive magnitude, so the direction is elected once over the whole window from the counts on each side. A window that carries a large share of both is two feeds pooled together, and the skill reports it as mixed rather than reducing it to one figure.

**Q: What does it do when something could not be counted?**
A: It says so. An exclusion count that comes back empty means nobody measured it, not that nothing was excluded, and the skill reports it as unmeasured rather than as none. The same holds for the whole reading: a sum that came back with nothing in it is not a burn of zero, so the skill stops and offers to read again.

**Q: What about a workspace spending in several currencies?**
A: The sum always groups by currency, so a multi-currency window comes back as one row per currency. The skill converts each one into your base currency at a rate it states, and never presents a single total as though no conversion happened.

---

## Installation

The file under `skills/avg-burn/SKILL.md` is a shell: it carries the skill's name and description, and loads the instructions from Well's MCP server with `well_get_skill` when the skill runs. Install it once; it never goes stale.

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

[⬇ Install avg-burn](https://github.com/WellApp-ai/skills/raw/main/dist/avg-burn.skill) and open the downloaded file. Desktop installs the skill straight away, with nothing to unzip.

### Assisted by AI

Paste this into any AI agent (Claude, Codex, Cursor, OpenCode, and others):

```
Install the following official skill from Well. Instructions:

1. Fetch this file:
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/avg-burn/SKILL.md
2. Save it as a file named exactly "SKILL.md" inside a folder named "avg-burn". No prefix, no suffix.
3. Install this skill.
4. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill avg-burn
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
