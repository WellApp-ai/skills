<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Payroll due dates

**See what payroll and social obligations are coming, with the amount wherever a payslip carries one and whether the money already left the bank.**

## What it does

Ask what payroll owes next and you normally check the payroll engine for its own dates, the social office portal for its own, and a folder of insurer letters for the rest. This skill puts them on one dated list for the company you pinned, in the country your accounting settings carry.
The amounts come from the payslips Well holds. Tax withheld and social contributions are read off the payslip header, so a deposit or a declaration that settles what a payslip withheld can be shown with a real figure beside it. Whether that money already left is read from the payslip transactions: each one links a payslip to a bank transaction and says which leg it paid, net pay, an employee deduction, an employer charge or a fee. A leg with a linked transaction is already out. A leg with none is still outstanding, and the list says which.
The dates themselves are a written reference this skill carries, not a live feed. Nothing in the product subscribes to an authority calendar, so a threshold that moves moves without the skill noticing. Every date is presented as something to confirm with the authority or the bureau before acting on it, and a date the source itself flags as unsettled keeps that flag.
It is deliberately narrow about what it will not do. It never files, signs, transmits or prefills anything, and it moves no money. It does not decide which deposit or filing frequency an authority assigned you: the threshold is quoted, and your own withheld amounts are summed beside it so you can see where you sit, which is not the same as a determination. Lump sums such as double pécule, the TFR provision and a thirteenth month have no accrual record in Well, so any figure for them is arithmetic over past payslips and is labelled an estimate. And payslip line vocabulary is mapped for France and the United States only, so a German, Belgian, Italian or Spanish run relies on what the payslip header and the bank show rather than on mapped lines.

## Required data in Well

- **Payslips in Well** (required). The rows every amount comes from. They arrive from a payroll connector sync, or from pay documents dropped into Well and extracted. With no payslips the skill can still name what is due, but no line carries an amount.
- **A country on your accounting settings** (required). Picks which jurisdiction's deadline reference the answer reads from. The skill covers the United States, Germany, Belgium, Italy, Spain and France; another country is named as uncovered rather than guessed at.
- **A month to anchor the calendar on** (required). The skill looks forward from one pinned month. Pin it from the period picker or from the month named in the question.
- **Bank transactions linked to your payslips** (recommended). What turns "due" into "already paid". Without the link every leg reads as outstanding, which overstates what is still to come.
- **Prior authority and insurer documents** (optional). A German BG Beitragsbescheid or a French taux AT/MP notice already in the workspace gives a real rate or a real amount. Nothing reaches into an authority mailbox to fetch one.

## FAQ

**Q: Which forms does this cover?**
A: United States: the EFTPS federal tax deposit, 941, 940, NYS-1, NYS-45, the New York workers' compensation policy, and DBL and PFL contributions. Germany: Lohnsteueranmeldung, Beitragsnachweis, BG Beitragsbescheid, UV-Lohnnachweis, DEUEV Jahresmeldung, Kuenstlersozialabgabe. Belgium: the 274 précompte professionnel declaration, the quarterly DmfA, double pécule de vacances, and the réduction premiers engagements. Italy: F24 for ritenute and contributi, UniEmens, autoliquidazione INAIL, CCNL and fondi contributions, and the conguaglio fiscale and contributivo. Spain: the RLC and RNT cuotas liquidation, Modelo 111, the fichero CRA, RETA for an autonomo societario, NOTESS and DEHU electronic notifications, and convenio colectivo salary tables and atrasos. France: the monthly DSN, prélèvement à la source, the taux AT/MP notification, the CUFPA and taxe d'apprentissage balance, the TNS revenue declaration for a gérant majoritaire, and SPSTI membership and prevention visits. Two of these Well actually reads from a document you already hold: the BG Beitragsbescheid and the taux AT/MP notice, and only when that document or its bank debit is in the workspace. Every other one Well names so you know it is due, on the date the reference carries, with an amount only where a payslip supplies it.

**Q: Does Well file any of this?**
A: No. This skill never files, signs or transmits a statutory return, a deposit or a declaration. Not to the IRS, ELSTER, ONSS, INPS, INAIL, the Seguridad Social, URSSAF, net-entreprises or any other authority. It reads, checks, reconciles, reminds and prepares the hand-off. You or your bureau click submit. This skill has no prefill path and opens no portal form for you.

**Q: Does it pay anything?**
A: No. Well moves no money to an authority, an insurer or a bureau. It says what is due and whether a matching debit is already in the bank.

**Q: Where do the dates come from?**
A: They are a written reference carried inside the skill. They are not a live feed from any authority, and nothing in the product re-verifies them when a threshold or a filing date moves. Treat every date as something to confirm with the authority or your bureau before acting. Where the source itself flags a date as unsettled, the answer keeps that flag.

**Q: Does it tell me my deposit or filing frequency?**
A: No. Thresholds such as the EFTPS lookback, the NYS-1 700 dollar trigger, the Lohnsteueranmeldung 1,080 and 5,000 euro bands and the Belgian 274 quarterly threshold are quoted, and your own withheld amounts are summed beside them. That comparison is information, not a determination. Only the authority assigns your frequency, and Well cannot read what it assigned.

**Q: How does it know something was already paid?**
A: From the payslip transactions. Each links a payslip to a bank transaction and says which leg it settled: net pay, an employee deduction, an employer charge or a fee. A leg with a link is reported as out, a leg without one as outstanding. An obligation no payslip covers has no link to read, so it is reported as unknown rather than as unpaid.

**Q: What about double pécule, TFR and a thirteenth month?**
A: They are named on the calendar, and any amount beside them is an estimate. Well holds no accrual or provision record, so a figure for a lump sum is arithmetic over past payslips and is labelled as such. It is never presented as a ledger amount and never posted anywhere.

**Q: Does it watch my authority mailbox?**
A: No. A BG Beitragsbescheid, a workers' compensation audit, a taux AT/MP notice, a NOTESS or a DEHU message is visible only if that document, or the transaction that paid it, is already in the workspace. Nothing logs into a portal on your behalf.

**Q: Is the depth the same in every country?**
A: No. Payslip line vocabulary is mapped for France and the United States only, so a German, Belgian, Italian or Spanish payslip has no mapped line catalog behind it. Those countries rely on the payslip header amounts and on what the bank shows. The deadline list is the same shape everywhere; the amounts behind it are thinner.

**Q: Does it count hours or absences?**
A: No. Well records no time. There is no timesheet, shift, attendance or absence record, so an hours figure appears only where a payslip printed it, and an overtime or leave obligation is named from the calendar rather than computed from anything Well tracked.

**Q: Is this tax or legal advice?**
A: No. It is a reading of your own payslips and bank movement set against a written calendar. It does not replace your bureau, your accountant or your social secretariat, and it does not advise on what to file or how.

---

## Installation

The file under `skills/payroll-due-dates/SKILL.md` is a shell: it carries the skill's name and description, and loads the instructions from Well's MCP server with `well_get_skill` when the skill runs. Install it once; it never goes stale.

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

[⬇ Install payroll-due-dates](https://github.com/WellApp-ai/skills/raw/main/dist/payroll-due-dates.skill) and open the downloaded file. Desktop installs the skill straight away, with nothing to unzip.

### Assisted by AI

Paste this into any AI agent (Claude, Codex, Cursor, OpenCode, and others):

```
Install the following official skill from Well. Instructions:

1. Fetch this file:
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/payroll-due-dates/SKILL.md
2. Save it as a file named exactly "SKILL.md" inside a folder named "payroll-due-dates". No prefix, no suffix.
3. Install this skill.
4. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill payroll-due-dates
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
