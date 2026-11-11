<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Revenue by customer

**See what each customer billed in a period, ranked net of tax, with the part not placed on a client named.**

## What it does

Ask your AI assistant who your biggest clients were over the last 12 months, this month or last week, and it reads the answer off the invoices your workspace issued: the sales invoices in the period, grouped by the customer they were addressed to, ranked from the biggest down, with the currency and the exact dates of the period stated beside each figure.
The number is net of tax. Over whole complete months, credit notes are netted too. Well's own invoice total is on the same basis, but it also counts invoices placed on no customer, so the two are stated apart and never added together. Invoices whose customer is not recorded stay as a single line outside the ranking, and invoices Well could place on neither side of the relationship are counted and reported beside the ranking rather than dropped, because an unplaced invoice may still belong in the figure.
Well places the side of each invoice on the server, never from a party name. When it cannot, the skill lists the largest invoices on both sides as an unsplit list, side not placed, and ranks no customer from it, because a ranking that mixes purchases into sales reads exactly like a correct one.

## Required data in Well

- **Invoicing or accounting connector** (required). This is where the invoices your workspace issued, and the customers they were addressed to, come from.
- **A period to rank** (optional). Name a month, a year, a quarter, a date range or a stretch such as the last 12 months, and that window is the one ranked. With none named, the default is the last complete calendar month.

## FAQ

**Q: Does it net credit notes against the invoices they cancel?**
A: Over whole complete months, yes: each customer's figure is net of tax and credit notes are netted. For a window that reaches into the current month or does not follow whole months, the ranking counts the invoices as billed, net of tax, and names the rows it can identify as credit notes separately without subtracting them. A synced invoice can carry no document type at all, so a credit note whose type was never extracted reads as an invoice.

**Q: Why does this figure differ from Well's own revenue total?**
A: Both are net of tax. Well's own total also counts the invoices placed on no customer, which the ranking keeps on a line of their own, and it covers whole months only. Both are reported, stated apart, and never added to each other.

**Q: Can it rank suppliers or spend?**
A: No. This reads the invoices your workspace issued. For money going out, ask for your cost structure instead.

**Q: How does it tell what I owe from what I am owed?**
A: Well places the side of each invoice on the server and never asks you to pick a company in this answer. An invoice it cannot place is listed with its issuer and its receiver named, and counted beside the total.

**Q: Is the ranking always complete?**
A: One read returns at most 500 invoices. When the period holds more, the skill says so, reports the share it covered as a floor rather than a total, and offers a shorter period.

---

## Installation

The file under `skills/revenue-by-customer/SKILL.md` is a shell: it carries the skill's name and description, and loads the instructions from Well's MCP server with `well_get_skill` when the skill runs. Install it once; it never goes stale.

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

[⬇ Install revenue-by-customer](https://github.com/WellApp-ai/skills/raw/main/dist/revenue-by-customer.skill) and open the downloaded file. Desktop installs the skill straight away, with nothing to unzip.

### Assisted by AI

Paste this into any AI agent (Claude, Codex, Cursor, OpenCode, and others):

```
Install the following official skill from Well. Instructions:

1. Fetch this file:
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/revenue-by-customer/SKILL.md
2. Save it as a file named exactly "SKILL.md" inside a folder named "revenue-by-customer". No prefix, no suffix.
3. Install this skill.
4. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill revenue-by-customer
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
