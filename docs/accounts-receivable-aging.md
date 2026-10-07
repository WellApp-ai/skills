<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Receivables aging

**See who owes you money, and how long they have been sitting on it.**

## What it does

Ask your AI assistant who owes you money, and it reads the answer from your synced invoices. Every customer invoice still carrying a balance is sorted into an aging band (current, 1-30, 31-60, 61-90, and 90+ days past due), with the customer, the amount, the currency and the due date on each row.

Which side of an invoice your workspace occupies is resolved from your confirmed own company, not from a party name, so an entity that appears under a registered name in one source and a trade name in another still lands on the correct side. Invoices Well cannot place on either side are counted and reported beside the total rather than dropped, because an unplaced invoice may still be owed to you.

The skill says what it cannot age. An invoice with no due date recorded gets its own line instead of an invented one. An invoice whose payment status could not be recomputed is named rather than counted as settled. A total never blends currencies: each currency is converted at a stated rate and rate date, or reported on its own.

For what you owe rather than what you are owed, ask `bills-due`. For one customer's full history rather than an aging summary, ask `company-profile`.

## Required data in Well

- **Invoicing or accounting connector** (required). Where your issued customer invoices and their payment state come from. Either one is enough.
- **Company profile confirmed in Well** (required). Well resolves which side of an invoice you occupy from your own company. Without it, receivables cannot be told apart from payables.

## FAQ

**Q: Why does it need to know my own company?**
A: To tell receivables from payables. Your own company is what Well resolves the two sides of an invoice against, so without it the skill cannot separate invoices you issued from bills you received. It asks you to confirm rather than guessing from a name or a logo.

**Q: Which aging bands does it use?**
A: Current (not yet due), 1-30, 31-60, 61-90, and 90+ days past due, measured from the due date against a stated as-of date.

**Q: What happens to an invoice with no due date?**
A: It gets its own line, listed with its amount and customer. It is in the outstanding total and in no band. A due date is optional on an invoice record, and no other date substitutes for one: aging a row from its issue date instead would read as a real overdue figure while resting on a guess.

**Q: What about an invoice whose payment status could not be worked out?**
A: It is named, not summed. Well recomputes payment status from the payments allocated against an invoice, and that recompute halts on a few conditions, such as an invoice total that is missing or not positive, an allocation in a currency with no exchange rate available, or a locked period. A halted row keeps no fresh payment status or balance, so the skill lists those invoices separately instead of treating them as settled or as overdue.

**Q: Which payment status does it report?**
A: The one Well recomputes from allocated payments, and it says so. Where a source system asserts an invoice is settled but no bank payment has been matched to it yet, the skill reports that state under its own heading rather than silently choosing between the two answers.

**Q: Does it convert everything into one currency?**
A: Only with the rate and rate date shown. Currencies are never blended into a single figure. A currency with no rate available is reported on its own and named as excluded from the converted total.

**Q: Does it chase the payment for me?**
A: No. The skill surfaces who is late and by how much, and drafts a reminder when you ask for one. Sending the follow-up stays with you.

---

## Installation

The file under `skills/accounts-receivable-aging/SKILL.md` is a shell: it carries the skill's name and description, and loads the instructions from Well's MCP server with `well_get_skill` when the skill runs. Install it once; it never goes stale.

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

[⬇ Install accounts-receivable-aging](https://github.com/WellApp-ai/skills/raw/main/dist/accounts-receivable-aging.skill) and open the downloaded file. Desktop installs the skill straight away, with nothing to unzip.

### Assisted by AI

Paste this into any AI agent (Claude, Codex, Cursor, OpenCode, and others):

```
Install the following official skill from Well. Instructions:

1. Fetch this file:
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/accounts-receivable-aging/SKILL.md
2. Save it as a file named exactly "SKILL.md" inside a folder named "accounts-receivable-aging". No prefix, no suffix.
3. Install this skill.
4. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill accounts-receivable-aging
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
