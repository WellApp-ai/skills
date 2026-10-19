<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Recurring revenue

**See the monthly run-rate of live subscriptions, or an invoice average when no typed subscriptions are present.**

## What it does

Ask your AI assistant what your MRR is. When Well has live typed sold subscriptions, it reports their server-calculated monthly run-rate, totals each currency separately, names each client, and can list the 12 newest invoices linked to one subscription, with the full count when more exist. Rows with missing or impossible amounts stay out of the figure and are named. A failed latest sync is reported with the last successful sync date. This path is text only and does not convert currencies.

If there are no live typed sold subscriptions, the skill follows the invoice path. It reports the trailing average of revenue you invoiced under the billing contexts you count as recurring — purchase invoices excluded structurally, credit notes netted, currencies converted, and every month in the window counted in the divisor. Each invoice check runs in the open: the connection, whether syncs finished, and which company is yours. A failed check stops and shows what to fix instead of adding a caveat to a figure.

On the invoice path, you choose what counts. Nothing is recurring by default: the skill shows you each billing context with the revenue behind it, and you decide which ones your business treats as recurring. The revenue that carries no billing context at all is one more choice, with its amount: if you only bill subscriptions, you can count it.

## Required data in Well

- **Invoicing or accounting connector** (required). This is where your issued customer invoices come from.
- **Company profile confirmed in Well** (required). The reader needs to know which company is yours, so it can tell the subscriptions you sell from the ones you buy, and the invoices you issued from the bills you received.

## FAQ

**Q: Why average instead of last month?**
A: The invoice path averages a window because one annual renewal or a delayed invoice run can double or halve a single month. Live typed subscriptions use their current monthly run-rate instead.

**Q: How does it know what is recurring?**
A: The invoice path does not guess. It shows each billing context with its revenue and you decide, because a retainer is recurring for one business and a one-off for another. Live typed subscriptions already identify their billing intervals.

**Q: What about revenue with no billing context?**
A: On the invoice path it is listed as one more choice, with its amount. Well cannot tell how those invoices were billed, so they count only if you tick them, for example when you only bill subscriptions. Either way the answer states the amount.

**Q: Does it split MRR into new, expansion and churn?**
A: No. This answer reports a current subscription run-rate or an invoice average. It does not keep a month by month record of each subscription's state, so it cannot say what moved the figure.

**Q: Does the card work the number out?**
A: The typed subscription answer is text only. On the invoice path, the card draws the figure this skill computed from the invoice sum and the billing contexts you chose; it does not work the number out.

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
