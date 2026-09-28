<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Check a payslip

**Read one person's payslip for a month, list the lines it printed beside the same contract's earlier payslips, and name every line whose amount changed, appeared or disappeared.**

## What it does

A payslip is the document a founder signs off on and cannot read. The labels are the payroll provider's, the amounts move for reasons nobody wrote down, and the only real question, did anything change that should not have, takes an hour of squinting at two PDFs side by side.
This skill answers that one question. It reads the payslip Well holds for the person and the month you name, reads the earlier payslips of the same employment contract, and lines them up by the label each line printed. Then it names three things: the lines whose amount changed and by how much, the lines that appeared this month and were not there before, and the lines that printed before and are absent now. Beside that it states the four header amounts the payslip itself printed, gross pay, tax withheld, social contributions and net pay, and the contract terms Well holds, such as the weekly hours, the pay frequency and the pay currency.
It is narrow on purpose, and the limits are the honest part. Well never files anything with a tax or social authority, in any country: it reads, compares and hands the result back to you or your payroll bureau. It never recomputes an amount, so it will not derive net from gross or tell you a contribution rate is wrong. It cannot separate employer charges from employee deductions, because the side of a payslip line is not readable. It cannot check a deduction against the withholding form on file, because no such form is a readable field. It cannot compare pay to a collective agreement minimum, because no sector rule table exists. And it reads the hours a payslip printed, never hours recorded anywhere else, because there is no time record in Well at all. Where a line looks wrong, it names the line and hands it to the person who can fix it.

## Required data in Well

- **The payslip for the month you are checking** (required). It arrives from a payroll connector sync, or from a pay document dropped into Well and extracted. With no payslip for that month there is nothing to check.
- **At least one earlier payslip on the same employment contract** (required). The comparison is month against month on one contract. A first payslip has nothing behind it, so the skill reads it out and says so rather than naming changes.
- **A month to read** (required). One calendar month at a time, pinned from the period picker or taken from the month named in the question.
- **The employment contract behind the payslip** (recommended). When Well holds it, the answer states the terms it can read, such as weekly hours, pay frequency, pay currency and job title, beside the comparison.

## FAQ

**Q: Which forms does this cover?**
A: United States: the pay statement and, in New York, the LS 54 pay notice, plus the offer letter, the W-4 and the IT-2104. Germany: the Entgeltabrechnung, the Arbeitsvertrag, the Nachweisgesetz Niederschrift and the ELStAM notice. Belgium: the fiche de paie and the contrat de travail. Italy: the cedolino paga, the lettera di assunzione, the modulo detrazioni and the conguaglio. Spain: the nómina, the contrato de trabajo, the modelo 145 and the convenio colectivo salary tables. France: the bulletin de paie, the contrat de travail CDI, the taux PAS notice and the titres-restaurant and benefits in kind statement. Of those, Well reads only the payslip itself, the bulletin de paie, Entgeltabrechnung, fiche de paie, cedolino paga, nómina or pay statement, and only once it has become a payslip record from a connector sync or an extracted document. Every other form on that list is named so you know which one to pull and check by hand. Well does not read its contents.

**Q: Does Well file any of this for me?**
A: No, and it never will from this skill. Well files nothing with the IRS, ELSTER, the ONSS, the Agenzia delle Entrate, the TGSS or net-entreprises. It reads the payslip, compares it to the earlier ones, names what moved and hands the result to you or your payroll bureau. The person who clicks submit is you.

**Q: Does it check my deductions against the W-4 or the taux PAS?**
A: No. A withholding form on file is not a readable field in Well, so no deduction is ever validated against one. The skill names the amount the payslip printed and names the form you should check it against yourself.

**Q: Can it tell me employer charges from employee deductions?**
A: No. The side of a payslip line, employer or employee, is not readable, so lines are never split or totalled by side. The comparison is by the label the line printed and by its amount.

**Q: Does it compare the pay to the contract salary or to a sector minimum?**
A: No to both. The contract's salary history is not readable row by row, so the salary in force on a pay date cannot be pulled, and Well holds no collective agreement, convenio colectivo or CCN rule table to compare against. The answer states the contract terms it can read, such as weekly hours and pay frequency, and stops there.

**Q: Does it check the hours on the payslip against hours worked?**
A: No. Well records no time at all: no timesheets, no shifts, no attendance and no absences. Any hours in the answer are hours a payslip printed.

**Q: Does it recompute gross, tax, contributions or net?**
A: No. It states what the payslip printed and never derives one amount from the others. A blank amount is reported as unread, which is not the same as zero.

**Q: Does it work the same in every country?**
A: The header amounts and the line comparison work from any payslip Well holds. The catalog of known line labels covers France and the United States today, so for a German, Belgian, Italian or Spanish payslip the labels read exactly as the payroll provider printed them until those labels have been reviewed and activated.

---

## Installation

The file under `skills/check-payslip/SKILL.md` is a shell: it carries the skill's name and description, and loads the instructions from Well's MCP server with `well_get_skill` when the skill runs. Install it once; it never goes stale.

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

[⬇ Install check-payslip](https://github.com/WellApp-ai/skills/raw/main/dist/check-payslip.skill) and open the downloaded file. Desktop installs the skill straight away, with nothing to unzip.

### Assisted by AI

Paste this into any AI agent (Claude, Codex, Cursor, OpenCode, and others):

```
Install the following official skill from Well. Instructions:

1. Fetch this file:
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/check-payslip/SKILL.md
2. Save it as a file named exactly "SKILL.md" inside a folder named "check-payslip". No prefix, no suffix.
3. Install this skill.
4. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill check-payslip
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
