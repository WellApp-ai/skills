<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Payroll year end pack

**Read every payslip for one calendar year, total gross pay, tax withheld, social contributions and net pay per contract and per month, name each month that has no payslip or no posted journal entry, and hand the year to your accountant through the close package.**

## What it does

The annual payroll paperwork comes from your payroll engine or your bureau. What nobody has is a clean statement of what the year actually held, taken from the payslips themselves rather than retyped from twelve PDFs. That is what this skill reads.
It totals the four amounts a payslip prints, per contract and per month, for the calendar year you name: gross pay, tax withheld, social contributions and net pay. Every figure keeps the currency its own payslip was issued in, and a year holding two currencies is reported per currency rather than blended into one number. Off cycle payslips and final settlements are counted and named on their own line, because a correction run and a normal month are not the same event.
It is as explicit about the holes as about the totals. A month with no payslip row is named as uncovered, never reported as a zero month, because payroll history reaches back only as far as the connector delivered it. A payslip with no posted journal entry is named as a posting gap. A month that is still open is named as open, with the close handed on rather than forced.
The limits are the point of the skill. This skill never files a statutory return to any authority and never signs or transmits on your behalf. It does not produce the annual statement, so the tie against W-2, Lohnsteuerbescheinigung, fiche 281.10, certificazione unica, modelo 190 or the December DSN is a comparison against a figure you read off the document, not a field Well extracted. A statement you upload is kept as a payroll document, not parsed. A December correction against a month that is already closed halts with a posting conflict and is reported, never reversed. Employer charges stay out of scope, the same as in the monthly read.

## Required data in Well

- **Payslips in Well for the year** (required). The rows this skill reads. They arrive from a payroll connector sync, or from pay documents dropped into Well and extracted. History reaches back only as far as the connector delivered it, and a month it never delivered is named as uncovered.
- **A calendar year to read** (required). The skill reads one complete calendar year at a time. It defaults to the last complete one and states the window it used.
- **Close state for the months of that year** (recommended). Read to say which months are closed, which are open, and which payslips have no posted journal entry behind them. Without it the totals still stand, but the year is handed over with no posting picture.
- **The annual statement your engine or bureau produced** (optional). Kept as a payroll document beside the year so the pack travels together. Well stores it, it does not read figures out of it, so the tie is against a number you read off the document yourself.

## FAQ

**Q: Which forms does this cover?**
A: United States: W-2 and W-3, 941, 940, NYS-45 and the payroll register. Germany: Lohnsteuerbescheinigung, DEUEV Jahresmeldung, the UV Lohnnachweis and the Lohnkonto. Belgium: fiche 281.10 and its Belcotax filing, the compte individuel and the bilan social. Italy: certificazione unica, modello 770, the conguaglio fiscale e contributivo and the payroll record retention. Spain: modelo 190, the certificado de retenciones and the registro retributivo. France: the December DSN, the CUFPA and taxe d'apprentissage solde, the effectif and seuils notification, the record retention rule and the TNS income declaration for a gérant majoritaire. Well reads none of them field by field. It reads your payslips and states its own totals. Every form above is named so you know what is due and what to compare against, and a statement you upload is kept as a payroll document rather than parsed into fields.

**Q: Does Well file any of this for me?**
A: No, not from this skill. It does not submit a W-2, W-3, 941, 940, NYS-45, Lohnsteuerbescheinigung, DEUEV Jahresmeldung, fiche 281.10, Belcotax, certificazione unica, modello 770, modelo 190, DSN or any other declaration to any authority. It does not sign or transmit on your behalf and it does not fill a portal form for you. You or your bureau click submit.

**Q: Can it tell me whether my payslips tie to the annual statement?**
A: It gives you one side of the tie. It states the year's totals from the payslips, per contract and per month. The statement side is a number you read off the document, because Well does not generate the statement and does not extract figures from one you upload.

**Q: What happens to a month with no payslips?**
A: It is named as uncovered. Payroll history goes back only as far as the connector delivered it, so an empty month means no rows landed, which is not the same as a month where nobody was paid. The skill says which one it cannot tell apart.

**Q: Can it fix a December correction on a month I already closed?**
A: No. A correction against an already posted payslip halts with a posting conflict. The skill reports the conflict and the month it belongs to, and stops. Nothing is reversed and nothing is force posted.

**Q: Does it export or archive the year for me?**
A: No. There is no file export here. The payslip rows stay readable in Well after your payroll subscription ends, and the year is handed to your accountant through the close package rather than as a downloaded bundle.

**Q: Is this the fully loaded cost of employment?**
A: No. It reports the employee side of each payslip, the same as the monthly read. Employer charges are out of scope, and a blank amount is reported as unread rather than as zero.

---

## Installation

The file under `skills/payroll-year-end-pack/SKILL.md` is a shell: it carries the skill's name and description, and loads the instructions from Well's MCP server with `well_get_skill` when the skill runs. Install it once; it never goes stale.

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

[⬇ Install payroll-year-end-pack](https://github.com/WellApp-ai/skills/raw/main/dist/payroll-year-end-pack.skill) and open the downloaded file. Desktop installs the skill straight away, with nothing to unzip.

### Assisted by AI

Paste this into any AI agent (Claude, Codex, Cursor, OpenCode, and others):

```
Install the following official skill from Well. Instructions:

1. Fetch this file:
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/payroll-year-end-pack/SKILL.md
2. Save it as a file named exactly "SKILL.md" inside a folder named "payroll-year-end-pack". No prefix, no suffix.
3. Install this skill.
4. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill payroll-year-end-pack
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
