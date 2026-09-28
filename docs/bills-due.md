<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Bills due

**See what you owe and when, ordered by due date with a running total.**

## What it does

Ask your AI assistant what bills are coming due, and it reads the answer from your synced invoices. Every bill still carrying a balance is placed on a date-ordered calendar (overdue, this week, this month, later), with the supplier, the amount, the currency and the due date on each row, and a running cumulative total beside it.

Which side of an invoice your workspace occupies is resolved from your confirmed own company, not from a party name, so a supplier that appears under a registered name in one source and a trade name in another still lands on the correct side. Invoices Well cannot place on either side are counted and reported beside the total rather than dropped, because an unplaced invoice may still be owed by you.

The calendar states its own edges. A due date is optional on an invoice record, and payment terms are held as free text that nothing parses into a date, so a bill with no due date is listed separately instead of being slotted into a week it was never assigned to. A bill a source system calls settled with no bank payment matched to it keeps its full balance on the record, so the calendar runs on payment status rather than on the balance alone, and reports that group under its own heading.

It covers bills that exist as invoices. Rent, subscriptions and the next payroll have no invoice behind them until one arrives, so near-term outflow is understated by whatever those come to, and the answer says so. For what you are owed rather than what you owe, ask `accounts-receivable-aging`. For the cash you hold against it, ask `cash-position`.

## Required data in Well

- **Invoicing or accounting connector** (required). Where your received bills and their payment state come from. Either one is enough.
- **Company profile confirmed in Well** (required). Well resolves which side of an invoice you occupy from your own company. Without it, bills you received cannot be told apart from invoices you issued.

## FAQ

**Q: Does it tell me whether I can afford each payment?**
A: No. It orders what you owe and totals it; it does not match the calendar against the cash available on each date. A cash position is a reading taken at a moment that has already happened, so no figure exists for a future date, and the forward cash series Well draws is monthly rather than per date. Read the calendar beside `cash-position` and make that call yourself.

**Q: Does it include rent, subscriptions and payroll?**
A: No. It reads bills that exist as invoices in your workspace. An obligation with no invoice behind it yet is not on the calendar, so near-term outflow is understated by whatever those come to. The answer states this every time rather than letting the total read as everything you owe.

**Q: What happens to a bill with no due date?**
A: It is listed on its own line with its supplier and amount, outside the calendar. A due date is optional on an invoice record, and payment terms sit as free text that nothing parses into a date, so placing the bill in a week would be a guess wearing the look of a real deadline.

**Q: Could it ask me to pay something twice?**
A: Not from the calendar. A bill a source system calls settled with no bank payment matched to it keeps its full balance on the record, so filtering on the balance alone would put a paid bill back on the list. The calendar runs on payment status instead, and reports that group under its own heading so you can see it.

**Q: Why does it need to know my own company?**
A: To tell bills from invoices you issued. Your own company is what Well resolves the two sides of an invoice against, so without it the skill cannot separate what you owe from what you are owed. It asks you to confirm rather than guessing from a name or a logo.

**Q: Does it convert everything into one currency?**
A: Only with the rate and rate date shown. Currencies are never blended into a single figure. A currency with no rate available is reported on its own and named as excluded from the converted total.

**Q: Can it pay the bills?**
A: No. The skill builds the calendar. Approving and paying stays with you.

---

## Installation

The file under `skills/bills-due/SKILL.md` is a shell: it carries the skill's name and description, and loads the instructions from Well's MCP server with `well_get_skill` when the skill runs. Install it once; it never goes stale.

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

[⬇ Install bills-due](https://github.com/WellApp-ai/skills/raw/main/dist/bills-due.skill) and open the downloaded file. Desktop installs the skill straight away, with nothing to unzip.

### Assisted by AI

Paste this into any AI agent (Claude, Codex, Cursor, OpenCode, and others):

```
Install the following official skill from Well. Instructions:

1. Fetch this file:
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/bills-due/SKILL.md
2. Save it as a file named exactly "SKILL.md" inside a folder named "bills-due". No prefix, no suffix.
3. Install this skill.
4. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill bills-due
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
