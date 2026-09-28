<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Payables aging

**See what you owe your suppliers, and how long each bill has been past due.**

## What it does

Ask your AI assistant what you owe your suppliers and how overdue it is, and it reads the answer from your synced invoices. Every supplier bill still carrying a balance is sorted into an aging band (current, 1-30, 31-60, 61-90, and 90+ days past due), with the supplier, the amount, the currency and the due date on each row.

Which side of an invoice your workspace occupies is resolved from your confirmed own company, not from a party name, so a supplier trading under a registered name in one source and a trade name in another still lands on the payable side. Invoices Well cannot place on either side are counted and reported beside the total rather than dropped, because an unplaced invoice may still be one you owe.

The skill says what it cannot age. A bill with no due date recorded gets its own line instead of an invented one. A bill whose amount or balance is not recorded is counted and named as unpriced rather than summed at zero. A bill a source system asserts is settled, with no bank payment matched to it, is reported under its own heading rather than counted as paid: Well's balance figures stay bank-derived, so that assertion moves no balance.

It is an aged view of invoices, not a ledger extract. It does not tie the bands to a supplier control account, and it does not pay, dispute or chase anyone. For a date-ordered payment calendar of what falls due and when, ask `bills-due`. For the customer side of an aged balance, ask `accounts-receivable-aging`. For what you paid each supplier over a year, ask `supplier-spend-register`.

## Required data in Well

- **Invoicing or accounting connector** (required). Where your supplier bills and their payment state come from. Either one is enough.
- **Company profile confirmed in Well** (required). Well resolves which side of an invoice you occupy from your own company. Without it, a bill cannot be placed on the payable side.
- **Bank connector** (recommended). Well derives what is still owed on a bill from the payments matched against it in your bank feed. Without one, a bill a source system calls settled rests on that system's word alone, and the skill reports it under its own heading.

## FAQ

**Q: Why does it need to know my own company?**
A: To tell what you owe from what you are owed. Your own company is what Well resolves the two sides of an invoice against, so without it a bill cannot be placed on the payable side. The skill asks you to confirm rather than guessing from a name or a logo.

**Q: Which aging bands does it use?**
A: Current (not yet due), 1-30, 31-60, 61-90, and 90+ days past due, measured from the due date against a stated as-of date.

**Q: How is this different from the bills calendar?**
A: The calendar orders bills by the date they fall due and runs a cumulative total, so you can plan cash out. This skill bands them by how far past due they already sit, so you can see which supplier has been waiting longest. Ask for `bills-due` when the question is about planning, and for this one when the question is about lateness.

**Q: Does it tie the bands to the supplier control account?**
A: No. The bands are built from invoice rows, not from ledger postings. The auxiliary account on a journal entry line is optional in Well and is commonly not set, so an aged balance keyed on a supplier control account is not something this skill can produce. Read it as an aged invoice view.

**Q: Does a bill marked paid by my invoicing tool count as settled?**
A: Not inside the bands. A payment a connector asserts never moves the paid amount or the balance on the invoice, because those stay bank-derived, so that bill still carries its full amount. The skill reports those bills under their own heading with a count and a total, and says which reading they come from, rather than choosing silently between the two answers.

**Q: What happens to a bill with no due date?**
A: It gets its own line, listed with its supplier and amount, and is left out of the bands. A due date is optional on an invoice record, and no other date substitutes for one: aging a row from its issue date instead would read as a real overdue figure while resting on a guess.

**Q: What about a bill with no amount recorded?**
A: It is counted and named as unpriced, never summed at zero. Both the invoice total and the balance are optional fields, and a row missing them tells you nothing about how much is owed, only that something is.

**Q: Does it give me a file to send to my accountant?**
A: No. The answer is a table on screen. There is no export, no CSV and no accountant pack behind this skill, and it does not claim one.

**Q: Does it pay or chase the supplier?**
A: No. It surfaces who has been waiting and for how long. Paying, disputing and contacting the supplier stay with you.

---

## Installation

The file under `skills/accounts-payable-aging/SKILL.md` is a shell: it carries the skill's name and description, and loads the instructions from Well's MCP server with `well_get_skill` when the skill runs. Install it once; it never goes stale.

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

[⬇ Install accounts-payable-aging](https://github.com/WellApp-ai/skills/raw/main/dist/accounts-payable-aging.skill) and open the downloaded file. Desktop installs the skill straight away, with nothing to unzip.

### Assisted by AI

Paste this into any AI agent (Claude, Codex, Cursor, OpenCode, and others):

```
Install the following official skill from Well. Instructions:

1. Fetch this file:
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/accounts-payable-aging/SKILL.md
2. Save it as a file named exactly "SKILL.md" inside a folder named "accounts-payable-aging". No prefix, no suffix.
3. Install this skill.
4. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill accounts-payable-aging
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
