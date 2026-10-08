<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Payroll cost by month

**Read the payslips for a month, or for each of several months, and state gross pay, tax withheld, social contributions and net pay per employee, in the currency each payslip was issued in.**

## What it does

Ask what payroll cost last month and you usually get one of two answers: a bank total that mixes salaries with taxes and contributions paid on other dates, or a spreadsheet somebody retyped from PDFs. This skill reads the payslip rows in Well instead, for the calendar month you pin, and states the four amounts a payslip prints for each person: gross pay, tax withheld, social contributions, and net pay. Name no month and it reads the last complete month and says which one. Name several, up to twelve, or a quarter, and you get one total per month, with a month that holds no payslip saying so while the other months keep their totals.

Every figure stays in the currency its own payslip was issued in. When the month holds more than one currency and you ask for a single total, the conversion states the rate and the date it used, and a currency with no rate is named and left out rather than quietly dropped from the total.

It is deliberately narrow. It reports the employee side of a payslip, not the employer charges, because the employer versus employee side of a line is not a readable field on the payslip records. It counts the people who have a payslip in the month rather than headcount, since a contract with no payslip is not reachable from these rows. And it reads one page of records, so when the month holds more rows than one read returns it says the month was not covered instead of presenting a sample as a total. For the shape of total spend across every category, ask for the cost structure instead.

## Required data in Well

- **Payslips in Well** (required). The rows this skill reads. They arrive from a payroll connector sync, or from pay documents dropped into Well and extracted.
- **A calendar month to read** (required). The skill reads complete months only: the month named in the question, the last complete month when none is named, or each month when several are named (twelve at most), with one total per month.
- **Your workspace base currency** (recommended). Read only when the month holds payslips in more than one currency and you ask for a single total. Without it, the answer stays per currency.

## FAQ

**Q: Does this give me the fully loaded cost of employment?**
A: No. It reports the employee side of each payslip. The employer versus employee side of a payslip line is not a readable field on the payslip records, so employer charges are out of scope and the answer says so.

**Q: Is this our headcount?**
A: No. It counts the people who have a payslip in the month. An employment contract with no payslip for that month is not reachable from these rows, so a person on unpaid leave or one whose payslip has not landed does not appear.

**Q: Where does the total come from?**
A: From the rows the read returned, added up in the answer. There is no server-computed payroll total, so when the month holds more rows than one read returns, the skill says the month was not covered and stops rather than adding up a sample.

**Q: What happens with several currencies in one month?**
A: Each payslip keeps the currency it was issued in and the answer reports per currency. A single converted total is given only with the rate and the rate date beside it, and a currency with no rate is named and left out of that total.

**Q: What if an amount is blank on the payslip?**
A: It is reported as unread. Gross pay, tax withheld, social contributions and net pay are each stored as optional, and a blank one means the payslip did not print it, which is not the same as zero.

**Q: Which countries does it cover?**
A: The four header amounts are read from any payslip that carries them. The line level rubric catalog behind payroll covers France and the United States, so a payslip from another country's payroll has no rubric to map its individual lines onto.

**Q: Which columns does the table show?**
A: The payslips table draws employee, period end, pay date, gross, net, status, source and document. Tax withheld and social contributions are read and stated in the written answer rather than drawn as columns.

---

## Installation

The file under `skills/payroll-cost-by-month/SKILL.md` is a shell: it carries the skill's name and description, and loads the instructions from Well's MCP server with `well_get_skill` when the skill runs. Install it once; it never goes stale.

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

[⬇ Install payroll-cost-by-month](https://github.com/WellApp-ai/skills/raw/main/dist/payroll-cost-by-month.skill) and open the downloaded file. Desktop installs the skill straight away, with nothing to unzip.

### Assisted by AI

Paste this into any AI agent (Claude, Codex, Cursor, OpenCode, and others):

```
Install the following official skill from Well. Instructions:

1. Fetch this file:
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/payroll-cost-by-month/SKILL.md
2. Save it as a file named exactly "SKILL.md" inside a folder named "payroll-cost-by-month". No prefix, no suffix.
3. Install this skill.
4. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill payroll-cost-by-month
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
