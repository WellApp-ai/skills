<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Revenue by customer

**See which customers your revenue came from in a period, ranked, with the part you could not place named.**

## What it does

Ask your AI assistant how much each customer billed you for last month, and it reads the answer off the invoices your workspace issued: every sales invoice in the period, grouped by the customer it was addressed to, ranked from the biggest down, with the currency and the period stated beside each figure.
The number is the invoice total as issued, gross of tax. Well's own invoice arithmetic reports a different measure, net of tax and net of credit notes, so the two are stated apart and never added together. Invoices whose customer is not recorded stay as a single unattributed line, and invoices Well could place on neither side of the relationship are counted and reported beside the ranking rather than dropped, because an unplaced invoice may still belong in the figure.
The skill needs to know which company is yours. That is what separates the invoices you issued from the bills you received, and it is resolved from your workspace's own company rather than from a party name. If it is not set, the skill says so, lists the largest invoices on both sides as an unsplit list and asks which company is yours on its last line, because a ranking that mixes purchases into sales reads exactly like a correct one.

## Required data in Well

- **Invoicing or accounting connector** (required). This is where the invoices your workspace issued, and the customers they were addressed to, come from.
- **Company profile confirmed in Well** (required). The sale side of an invoice is resolved from your own company. Without it, an invoice you received looks the same as one you issued.
- **A period to rank** (optional). Name a month or a date range, or take the default, which is the last complete calendar month.

## FAQ

**Q: Does it net credit notes against the invoices they cancel?**
A: No. A synced invoice can carry no document type at all, so a credit note whose type was never extracted reads as an invoice. The ranking counts what was billed, names the rows it can identify as credit notes separately, and does not subtract them from a customer's figure.

**Q: Why does this figure differ from Well's own revenue total?**
A: They measure different things. The per-customer figure is the invoice total as issued, gross of tax. Well's invoice arithmetic sums the line items net of tax and already net of credit notes. Both are reported, stated apart, and never added to each other.

**Q: Can it rank suppliers or spend?**
A: No. This reads the invoices your workspace issued. For money going out, ask for your cost structure instead.

**Q: What happens if my own company is not confirmed?**
A: The skill lists the largest invoices of the period on both sides first, says the list mixes what you billed and what you received, ranks no customer from it, and asks which company is yours on its last line. Ranking without it would mix the bills you received into the invoices you issued, and the result would read as a clean answer.

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
