<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Recurring revenue

**Know what you can count on earning each month, averaged over real months.**

## What it does

Ask your AI assistant what your MRR is, and it reports the trailing average of the revenue you actually invoiced under the billing contexts you count as recurring — purchase invoices excluded structurally, credit notes netted, currencies converted, and every month in the window counted in the divisor.

It computes the figure rather than reading it off a black box, which means you can see what it rests on. Each check runs in the open: the connection, whether the syncs actually finished, and which company is yours, because that is what separates the invoices you issued from the ones you received. A check that fails **stops** and shows you what to fix instead of reporting a figure with a caveat you would have to notice.

You also choose what counts. Nothing is recurring by default: the skill shows you each billing context with the revenue behind it, and you decide which ones your business treats as recurring. The revenue that carries no billing context at all is one more choice, with its amount: if you only bill subscriptions, you can count it.

## Required data in Well

- **Invoicing or accounting connector** (required). This is where your issued customer invoices come from.
- **Company profile confirmed in Well** (required). The skill needs to know which company is yours, so it can tell the invoices you issued from the bills you received.

## FAQ

**Q: Why average instead of last month?**
A: Because one annual renewal or a delayed invoice run can double or halve a single month. The average over a window is the figure you can plan against.

**Q: How does it know what is recurring?**
A: It does not, and it does not guess. It shows you each billing context with the revenue behind it and you decide, because a retainer is recurring for one business and a one-off for another.

**Q: What about revenue with no billing context?**
A: It is listed as one more choice, with its amount. Well cannot tell how those invoices were billed, so they count only if you tick them, for example when you only bill subscriptions. Either way the answer states the amount.

---

## Installation

The file under `skills/mrr/SKILL.md` is a shell: it carries the skill's name and description, and loads the instructions from Well's MCP server with `well_get_skill` when the skill runs. Install it once; it never goes stale.

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

[⬇ Install mrr](https://github.com/WellApp-ai/skills/raw/main/dist/mrr.skill) and open the downloaded file. Desktop installs the skill straight away, with nothing to unzip.

### Assisted by AI

Paste this into any AI agent (Claude, Codex, Cursor, OpenCode, and others):

```
Install the following official skill from Well. Instructions:

1. Fetch this file:
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/mrr/SKILL.md
2. Save it as a file named exactly "SKILL.md" inside a folder named "mrr". No prefix, no suffix.
3. Install this skill.
4. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill mrr
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
