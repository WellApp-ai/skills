<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Reconcile the payroll month

**Read one month's payslips and the bank transactions that paid them, name every payslip with no matching debit and every payroll debit with no payslip, and, on your explicit yes, categorise and post those debits as net salaries, employer social charges or wage withholding.**

## What it does

Every jurisdiction runs the same monthly moment with different paperwork. A founder in France never sees the declaration, only the two debits that follow it. A founder in Germany watches eight funds take eight amounts. A founder in Italy reconciles the accountant's monthly cost summary by hand. The question underneath is always the same one: did last month's payroll actually go out, and is it booked.
This skill answers that from two reads. It takes the payslips Well holds for the month you pin, with the four amounts a payslip prints (gross pay, tax withheld, social contributions, net pay), and it takes the month's bank transactions with the counterparty behind each one. It then names two lists: payslip amounts with no matching debit, and payroll debits with no payslip. Both lists are stated with the dates and the counterparties, so you can see at once whether something is late or simply missing.
The write is narrow and gated. On your explicit yes, a confirmed debit gets a category (net salaries, employer social charges, or wage withholding) and a ledger account, so it stops blocking the close. That is all that persists. The match itself is computed in the run and reported, not stored, so asking again next month recomputes it from the rows as they stand then.
It is honest about its edges. It reads payslip header totals, not the individual lines, so the employer side of a payslip is reconciled from the bank transaction's category rather than from a line split. It takes the payslip as issued and never recomputes gross to net or checks a contribution rate. It records no hours: if hours matter, it reads what a payslip printed. And it never files anything. The declaration, the deposit and the portal stay yours.

## Required data in Well

- **Payslips in Well for the month** (required). The rows one half of the match reads. They arrive from a payroll connector sync, or from pay documents dropped into Well and extracted.
- **A connected bank account** (required). The other half of the match. Without the month's bank transactions there is nothing to reconcile the payslips against.
- **A calendar month that has ended** (required). The skill reads one complete month at a time, pinned from the period picker or from the month named in the question.
- **Categories on your payroll counterparties** (recommended). A tax office, a social fund or a payroll bureau that already carries a category makes its debits far easier to place. Uncategorised ones are still listed, just with less to go on.

## FAQ

**Q: Does Well file my payroll return?**
A: No, and it never will from here. Well reads the bank debit that follows a filing. Submitting a declaration or a deposit stays with you or your bureau, on the tax or social portal itself. Well does not lodge one, does not prefill one, and does not open a channel to one.

**Q: Which forms does this cover?**
A: United States: pay statements and the payroll register are read from a document you hold; the federal tax deposit (EFTPS) and NYS-1 are only named, so you know what is due and can check the debit landed. Germany: the Entgeltabrechnung and the Lohnjournal are read; the Lohnsteueranmeldung and the Beitragsnachweis are named. Belgium: the fiche de paie is read; the 274 précompte professionnel and the quarterly DmfA are named. Italy: the cedolino, the monthly staff cost summary and the distinta netti are read; the F24 for withholding and contributions is named. Spain: the nomina is read; the RLC and RNT contribution filings and Modelo 111 are named. France: the bulletin de paie is read; the monthly DSN and prélèvement à la source are named. Read means Well takes the amounts from a document you gave it. Named means Well tells you it is due and looks for the matching debit, nothing more.

**Q: Is the payslip to bank match saved?**
A: No. The match is computed in the run and reported to you. What persists is the category and the ledger account you confirmed on a bank transaction. Ask again next month and the match is recomputed from the rows as they stand then.

**Q: Does it split employer charges from employee deductions?**
A: Not from the payslip. The per line employer versus employee side is not readable on the payslip records, so the employer leg is placed from the bank transaction's own category instead. A payslip with no separate employer total contributes nothing to that side.

**Q: Does it check my payroll is correct?**
A: No. It takes the payslip as issued. It does not recompute gross to net, does not check a contribution rate, and does not judge whether a deduction is right. It checks that what the payslip printed left the bank, and that what left the bank has a payslip behind it.

**Q: Does it pay anyone?**
A: No. It never releases a transfer, never schedules a remittance and never touches a payment batch. It reads what already moved.

**Q: Does it close the month?**
A: No. It clears payroll gaps so they stop blocking a close, and the remaining gaps feed the close itself. Closing and locking a period is a separate flow, confirmed by you in Well.

**Q: Does it track hours or absences?**
A: No. Well records no time: there is no timesheet, shift, attendance or absence row anywhere behind this. Where hours appear, they are the hours a payslip printed.

---

## Installation

The file under `skills/reconcile-payroll-month/SKILL.md` is a shell: it carries the skill's name and description, and loads the instructions from Well's MCP server with `well_get_skill` when the skill runs. Install it once; it never goes stale.

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

[⬇ Install reconcile-payroll-month](https://github.com/WellApp-ai/skills/raw/main/dist/reconcile-payroll-month.skill) and open the downloaded file. Desktop installs the skill straight away, with nothing to unzip.

### Assisted by AI

Paste this into any AI agent (Claude, Codex, Cursor, OpenCode, and others):

```
Install the following official skill from Well. Instructions:

1. Fetch this file:
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/reconcile-payroll-month/SKILL.md
2. Save it as a file named exactly "SKILL.md" inside a folder named "reconcile-payroll-month". No prefix, no suffix.
3. Install this skill.
4. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill reconcile-payroll-month
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
