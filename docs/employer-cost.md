<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Employer cost

**Read one month of payslips and state, per person, gross pay plus the employee deductions and the employer charges the payslip printed, then list the payroll related bills paid from the bank that no payslip carries.**

## What it does

Ask what an employee costs and the honest answer has two halves. The first half is printed on the payslip: the gross pay, the deductions taken off the employee, and the charges the employer owes on top. Well reads all three, because each payslip line carries the side it sits on, so the employer half is separated from the employee half rather than guessed from a label.
The second half never appears on a payslip. Workers' compensation, DBL and PFL, a BG contribution, a mutuelle or prevoyance premium, a seguro de convenio, fondi sanitari and enti bilaterali contributions, a company car CO2 levy: these arrive as bills and leave as bank debits. Well reads those debits for the month and reports them beside the payslip figures. They stay at company level. A bank transaction carries no link to a person, so this skill will not divide a workers' compensation premium between two employees, and it says so rather than inventing a split.
It is deliberately narrow everywhere else. It files nothing and pays nothing. It allocates nothing by department or cost centre. A payslip line carries no exchange rate, so a month holding two currencies is reported per currency, and a single converted figure is given only at the total, with the rate and the rate date beside it. It reads what a payslip printed and what a bank paid, and it never recomputes a contribution or judges whether a rate is the right one for the country.

## Required data in Well

- **Payslips in Well** (required). The rows the per person figure comes from. They arrive from a payroll sync, or from pay documents dropped into Well and extracted. Without them there is no employer charge to read.
- **A calendar month to read** (required). The skill reads one complete month at a time, pinned from the period picker or from the month named in the question.
- **Bank transactions for the month** (recommended). Where the off payslip bills are read from. Without them the answer covers the payslip halves only, and says the off payslip side was not checked.
- **A category on the payees behind those bills** (recommended). What separates an insurer or a fund from an ordinary supplier. An uncategorised payee is listed as unclassified rather than counted into the payroll total.
- **Your workspace base currency** (optional). Read only when the month holds more than one currency and you ask for a single figure. Without it the answer stays per currency.

## FAQ

**Q: Which forms does this cover?**
A: United States: the payroll register, the workers' compensation policy, and the DBL and PFL policy and contributions. Germany: the Lohnjournal and the BG Beitragsbescheid. Belgium: the fiche de paie and the quarterly DmfA. Italy: the monthly riepilogo contabile del costo del personale, and CCNL contributions to fondi sanitari, enti bilaterali and the fondo pensione. Spain: the nomina, also called the recibo de salarios, and the seguro de convenio. France: the bulletin de paie, the mutuelle and prevoyance amounts due, and the taux AT/MP notification. Well reads the payslip documents in that list, the bulletin de paie, the fiche de paie, the nomina and their equivalents, wherever they are already in the workspace as payslips, and every amount it states per person comes from one of them. The rest, the workers' compensation policy, the DBL and PFL contributions, the BG Beitragsbescheid, the DmfA, the CCNL fund contributions, the seguro de convenio, the mutuelle and prevoyance amounts and the taux AT/MP notification, Well names so you know what is due and shows only where a bank debit for them landed in the month. The summary documents, the payroll register, the Lohnjournal and the riepilogo contabile, are named as the bureau's own recap to check this answer against, not read.

**Q: Does Well file any of this?**
A: No. Well never files, signs or transmits a statutory return or a contribution declaration. Not to the IRS, ELSTER, ONSS, the Agenzia delle Entrate, the TGSS or net-entreprises. It reads, checks, reconciles, reminds and prepares the hand-off. You or your bureau click submit.

**Q: Can I get the fully loaded cost per person?**
A: Only for the halves a payslip prints. Gross pay, employee deductions and employer charges are stated per person, because each payslip line carries the side it sits on. The off payslip bills are not: a bank transaction carries no link to a person, so a workers' compensation premium, a BG contribution or a mutuelle bill is reported for the month at company level and never divided between heads.

**Q: Can it split cost by department or cost centre?**
A: No. A department can sit on an employment contract, but nothing in Well allocates cost by it, and the contracts are not readable as their own records. The answer is per person and per company, and it says so rather than approximating a split.

**Q: What happens with more than one currency in the month?**
A: Each payslip keeps the currency it was issued in and the answer reports per currency. A payslip line carries no exchange rate, so nothing is converted line by line. A single converted figure is given only at the total, with the rate and the rate date beside it, and a currency with no rate is named and left out rather than quietly dropped.

**Q: Does it compute or check the contributions?**
A: No. It reads what the payslip printed and what the bank paid. It does not recompute a contribution, apply a rate, or judge whether a charge is correct, complete or compliant for your country. A missing amount is reported as unread, never as zero and never as a clean result.

**Q: Does it count hours or absences?**
A: No. Well records no time. There is no timesheet, shift, attendance or absence record, so an hours figure appears only where a payslip itself printed one.

**Q: Can it cost a hire I have not made yet?**
A: No. It reads months that already have payslips. For a budget on a future hire, take this month's figures and do the arithmetic yourself.

**Q: How is this different from the cost structure report?**
A: The cost structure report groups a month's whole spend by category. This one reads payroll on its own, splits the payslip by side, and adds the payroll related bills that sit outside a payslip. The two are different questions and do not tie out against each other.

---

## Installation

The file under `skills/employer-cost/SKILL.md` is a shell: it carries the skill's name and description, and loads the instructions from Well's MCP server with `well_get_skill` when the skill runs. Install it once; it never goes stale.

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

[⬇ Install employer-cost](https://github.com/WellApp-ai/skills/raw/main/dist/employer-cost.skill) and open the downloaded file. Desktop installs the skill straight away, with nothing to unzip.

### Assisted by AI

Paste this into any AI agent (Claude, Codex, Cursor, OpenCode, and others):

```
Install the following official skill from Well. Instructions:

1. Fetch this file:
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/employer-cost/SKILL.md
2. Save it as a file named exactly "SKILL.md" inside a folder named "employer-cost". No prefix, no suffix.
3. Install this skill.
4. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill employer-cost
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
