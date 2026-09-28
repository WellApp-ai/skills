<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Check expense taxability

**For one French payroll month, list the payslip lines that are neither salary, tax nor contribution, with the label and amount the payslip printed, set the receipt gaps Well already found beside them, and state the country rule each item has to be judged against.**

## What it does

The question behind this skill is short: should that reimbursement, that gift card or that car have been on the payslip? The answer is a rule, not a balance, and getting it wrong turns an expense into unpaid wages with contributions on top.
For one calendar month you pin, this skill reads the payslips Well holds and the lines those payslips printed. It shows each line with its label, its amount and its currency, and it sets the four header amounts (gross pay, tax withheld, social contributions, net pay) beside them so you can see which lines are already accounted for by salary, tax and contributions and which are not. Then it names the rule each remaining item has to be judged against, and the document you are expected to keep for it.
It states its limits as plainly as its findings. The taxable flag lives on the payroll rubric dictionary and is not readable over Well's tools, so the skill reports the line and the rule, never a verdict. It does not read a line's meaning out of its label, because a label is free text a payroll source printed. It cannot find a reimbursement in the bank, because a bank transaction carries no person as counterparty, so a payment to an employee cannot be told apart from any other payment. It runs no substantiation clock, because Well holds no expense claim record and no substantiation date. And it values nothing that never touched a payslip: a company car with no line carrying its amount is named as a question to ask, not priced.
Coverage follows the data. France is the country whose benefit and reimbursement lines Well carries. For the United States, only the four header amounts are read. Germany, Belgium, Italy and Spain have no payroll catalog and no payroll connection here, so for those countries the skill can name the document to keep and the rule to check, and nothing more.

## Required data in Well

- **Payslips in Well for the month** (required). The rows this skill reads. They arrive from a payroll connection, or from pay documents dropped into Well and extracted. With no payslip for the month there is nothing to lay out.
- **A calendar month to read** (required). The skill reads one complete month at a time, pinned from the period picker or from the month named in the question.
- **Receipts and source documents** (recommended). The receipt gaps Well already found are set beside the lines. Without them the list still stands, and the paperwork column reads as unknown rather than as clean.
- **The country each person is paid in** (recommended). It decides which rule text applies. Well reads benefit and reimbursement lines for France only, so for any other country the skill names the rule and the document rather than reading data for it.

## FAQ

**Q: Does Well file anything with the tax office?**
A: No. Well never files a return and never submits anything to a tax or social security authority. It reads, checks, reconciles, reminds and prepares the hand off. You or your accountant clicks submit.

**Q: Which forms does this cover?**
A: France: notes de frais with their justificatifs, and avantages en nature including titres restaurant. United States: the accountable plan expense report. Germany: Reisekosten and Sachbezug records. Belgium: the note de frais and the forfait remboursement record. Italy: the nota spese for trasferte, and the fringe benefit and welfare record. Spain: the justificantes for dietas and gastos. Of these, Well reads only what a French payslip printed as a line, plus the receipt and document gaps it already found in your own business data. Every other form on this list is named so you know what is due and what to keep. Well holds no copy of it and files none of it.

**Q: Does it tell me whether an item is taxable?**
A: No. The taxable flag sits on the payroll rubric dictionary and is not readable over Well's tools, so the skill hands you the line, the amount and the rule to judge it against. The decision is yours and your accountant's.

**Q: Can it work out what a line is from its name?**
A: No. A payslip line label is free text the payroll source printed, and guessing a meaning from it is not allowed here. The skill shows the label as printed and asks you which lines fall outside salary, tax and contributions.

**Q: Will it find reimbursements I paid from the bank?**
A: No. A bank transaction in Well carries no person as counterparty, so a payment to an employee or to you cannot be told apart from any other payment. Bank side questions stay with the receipt check.

**Q: Does it run the 60 day substantiation clock?**
A: No. Well holds no expense claim record and no substantiation date, so no deadline can be counted here. The rule is stated, the clock is yours.

**Q: What about a company car or a benefit that never touched the bank?**
A: It is named as a question to put to your accountant, never priced. If a payslip line already carries an amount for it, that amount is shown as printed. If no line carries it, Well has no value to read.

**Q: Are the ceilings and limits in the answer current?**
A: Treat them as a prompt, not an authority. Well stores no statutory threshold, so any figure quoted comes from the rule text written into this skill and is stated with the date it was written. Confirm the current value before you rely on it.

**Q: Which countries does it actually read data for?**
A: France for benefit and reimbursement lines, since that is the only payroll catalog Well carries for them. The United States for the four header amounts only. Germany, Belgium, Italy and Spain have no payroll catalog and no payroll connection here, so for those the skill names the document and the rule and reads nothing.

---

## Installation

The file under `skills/check-expense-taxability/SKILL.md` is a shell: it carries the skill's name and description, and loads the instructions from Well's MCP server with `well_get_skill` when the skill runs. Install it once; it never goes stale.

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

[⬇ Install check-expense-taxability](https://github.com/WellApp-ai/skills/raw/main/dist/check-expense-taxability.skill) and open the downloaded file. Desktop installs the skill straight away, with nothing to unzip.

### Assisted by AI

Paste this into any AI agent (Claude, Codex, Cursor, OpenCode, and others):

```
Install the following official skill from Well. Instructions:

1. Fetch this file:
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/check-expense-taxability/SKILL.md
2. Save it as a file named exactly "SKILL.md" inside a folder named "check-expense-taxability". No prefix, no suffix.
3. Install this skill.
4. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill check-expense-taxability
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
