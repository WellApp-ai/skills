<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Reconcile hours to payslip

**Read one pay period's payslip lines for an hourly or part-time employee, state the hours, rate and amount on each line, name the overtime lines, and set the total against the hours the contract carries.**

## What it does

Every month a founder with one hourly hire asks the same question: were the hours right. The payslip holds the answer and buries it, because the hours sit on individual pay lines rather than in the header, and the record view shows a label and an amount.
This skill reads those lines. For the pay period you pin, it states per line the hours, the rate, the compensation multiplier where one is set, and the amount, and it marks the lines whose rubric kind is overtime so premium pay is separated from base pay rather than folded into one number. It then adds the paid hours and sets the total beside the weekly hours on the employment contract, with the contract's pay basis and salary rate stated, so a part-time schedule that quietly ran full time is visible.
It reads one side, and it says so. Well does not subtract a timesheet from a payslip: a timesheet dropped into Well is kept as a document, and its per day entries and its total hours are not stored as readable figures, so there is no second number to compare against. Well has no time tracking, so it never captures hours as they are worked. And Well runs no working time rules, so it reports the hours the payslip printed and never the hours that were owed. What you get is one trustworthy side of the comparison, and a plain list of the working time records you are the one who has to keep.

## Required data in Well

- **A payslip in Well for the period** (required). The rows this skill reads. They arrive from a payroll connector sync, or from a pay document dropped into Well and extracted. Without one, there are no hours to read.
- **A pay period to read** (required). One pay period at a time, pinned from the period picker or taken from the month named in the question.
- **The employment contract behind the payslip** (recommended). Carries the weekly hours, the pay basis and the salary rate the paid hours are set against. Without it the skill states the paid hours on their own and says there was nothing to compare them to.
- **The working time record you keep** (optional). Your own timesheet or hours register. Well stores it as a document you can open, and you read it yourself: its hours are not stored as figures the skill can compare.

## FAQ

**Q: Which forms does this cover?**
A: Payslips, which Well reads as records, and working time records, which Well only names so you know what is due. France: bulletin de paie (read), decompte du temps de travail and the heures supplementaires contingent and repos compensateur (named). Germany: Entgeltabrechnung (read), Arbeitszeitnachweis (named). Belgium: fiche de paie (read), registre des derogations for part time schedules (named). Italy: cedolino paga (read), registro presenze with its straordinario (named). Spain: nomina, the recibo de salarios (read), registro diario de jornada and the registro de horas extraordinarias (named). United States: the NY pay statement (read), FLSA time records (named). A payslip Well holds as a record is read line by line. A working time record is listed so you know it is required and where it is due, and it is never read as figures.

**Q: Does Well file any of these for me?**
A: No. Well never files, submits or transmits a working time record, a payslip or any payroll return to an authority, an inspectorate or a bureau. Every document named here is kept by you and handed over by you. Well reads, checks and prepares the hand off. You click submit.

**Q: Does it tell me if the hours on my timesheet match?**
A: No, and this is the honest limit of the skill. A timesheet dropped into Well is kept as a document, and its per day entries and its total hours are not stored as figures anything can read back, so Well cannot subtract one from the other. It gives you the payslip side, stated line by line, and you compare it against the record you keep.

**Q: Does it tell me how much overtime was owed?**
A: No. Well runs no working time rules, so it has no view of a premium band, a quota, a rest entitlement or a collective agreement. It names the lines the payslip rubric marks as overtime and states what they paid. Whether that was the right amount is a question for you or your payroll adviser.

**Q: Does Well track hours as they are worked?**
A: No. There is no time tracking in Well and no time tracking connector, so hours reach Well only on a payslip or inside a document you upload.

**Q: What if a line has no hours on it?**
A: It is reported as unread. Hours, rate and multiplier are each optional on a pay line, and a blank one means the payslip did not print it, which is not the same as zero. A line with no hours is kept out of the hours total and counted separately.

**Q: Can it correct the payslip?**
A: No. This skill reads. It never edits a payslip, never re issues one and never writes back to a payroll provider. A wrong figure is something you take to whoever runs your payroll.

**Q: How is this different from a payroll cost total?**
A: This one reads the hours inside one period's pay lines for one person. For gross pay, tax withheld, contributions and net pay per employee across a month, ask for payroll cost by month instead.

---

## Installation

The file under `skills/reconcile-hours-to-payslip/SKILL.md` is a shell: it carries the skill's name and description, and loads the instructions from Well's MCP server with `well_get_skill` when the skill runs. Install it once; it never goes stale.

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

[⬇ Install reconcile-hours-to-payslip](https://github.com/WellApp-ai/skills/raw/main/dist/reconcile-hours-to-payslip.skill) and open the downloaded file. Desktop installs the skill straight away, with nothing to unzip.

### Assisted by AI

Paste this into any AI agent (Claude, Codex, Cursor, OpenCode, and others):

```
Install the following official skill from Well. Instructions:

1. Fetch this file:
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/reconcile-hours-to-payslip/SKILL.md
2. Save it as a file named exactly "SKILL.md" inside a folder named "reconcile-hours-to-payslip". No prefix, no suffix.
3. Install this skill.
4. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill reconcile-hours-to-payslip
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
