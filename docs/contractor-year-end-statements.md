<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Contractor year end statements

**Read the purchase invoices for one calendar year, list the contractors and suppliers you paid with the total for each, name the ones with no tax identifier on file, and say which year-end statement each jurisdiction expects and when.**

## What it does

The contractor pack is a list, and the list is the part that takes three weeks. This skill builds it from the purchase side of your synced invoices for one calendar year: every counterparty you paid, the total for each, the currency behind it, and whether Well holds a tax identifier for that company. The purchase side is resolved from the company you confirmed as your own, so a supplier trading under two labels does not split into two smaller rows.
Beside the list it names the statements. For the United States, the 1099-NEC and the W-9 that has to be on file before it. For France, the DAS2 fee declaration. For Belgium, the fiche 281.50. For Italy, the Certificazione Unica and the Modello 770. For Spain, the Modelo 190 and the Modelo 216 for non-resident withholding. For Germany, the KSK levy on artistic and editorial fees. Each one is named so you know what is due and roughly when, never because Well produces it.
What it refuses matters as much. Well never files a statutory return and never generates the statement document. It applies no reporting threshold, because it holds no threshold figure, so the list is everyone you paid rather than the subset one form covers, and the threshold call stays yours. Every figure is gross: an Italian ritenuta d'acconto, a Spanish retención and a non-resident withholding are not visible, because the invoice lines carry no withheld amount. It cannot split an amount by payment rail, so it cannot tell a 1099-NEC base from a 1099-K one. And it carries an identifier only for a company, never for an individual, because Well stores none on a person.

## Required data in Well

- **Purchase invoices for the year** (required). The rows behind every total. They arrive from an invoicing or accounting connector, or from bills dropped into the workspace and read.
- **Your own company confirmed in Well** (required). The purchase side of an invoice is resolved from the company you confirm as your own. Without it, what you paid lands in the bucket Well cannot place instead of in the recipient list.
- **A tax identifier on each counterparty company** (recommended). The identifier gap is read from the company records. A company with nothing on file is reported as missing, which is the row you chase before filing season.
- **Exchange rates** (recommended). A year spanning several currencies is reported per currency unless rates cover it, in which case every converted figure carries the rate and the rate date.

## FAQ

**Q: Which forms does this cover?**
A: United States: the 1099-NEC, and the W-9 that has to be collected before it. France: the DAS2 fee declaration, carried in the DSN of the following April. Belgium: the fiche 281.50. Italy: the Certificazione Unica, the Modello 770, and the electronic supplier invoice that carries a ritenuta d'acconto. Spain: the Modelo 190, the Modelo 216 and 296 for non-resident withholding, and the autónomo invoice that carries a retención. Germany: the Künstlersozialabgabe levy on artistic and editorial fees. Of those, the only ones Well reads are the supplier invoices themselves, the Italian fattura elettronica and the Spanish autónomo invoice, and it reads their gross amount rather than their withheld line. A W-9 is not stored in Well at all. Every other form on this list is named so you know what is due and to whom, not read and not produced.

**Q: Does Well file the 1099-NEC or the DAS2 for me?**
A: No. Well never files a statutory return. It does not submit a 1099-NEC to IRIS, upload a fiche 281.50 to Belcotax-on-web, transmit a Certificazione Unica or a Modello 770 over Entratel, lodge a Modelo 190 or a Modelo 216 with the AEAT, or declare a DAS2 in the DSN. It reads, totals, reports the identifier gap and prepares the hand-off. You, your accountant or your filing engine clicks submit.

**Q: Does it produce the statement document itself?**
A: No. There is no 1099-NEC PDF, no fiche 281.50 XML, no CU file and no Modelo 190 upload. The output is the recipient list and the per-recipient totals that an engine, a portal or an accountant takes as input. Nothing here prefills a portal form either.

**Q: Does it apply the reporting threshold?**
A: No. Well holds no threshold figure for the 1099-NEC, the DAS2, the fiche 281.50 or any other form, so the list covers everyone you paid rather than the subset one form reaches. Name an amount and the list marks who crosses it; the threshold itself is your call or your accountant's.

**Q: Are the amounts net of tax withheld at source?**
A: No, every figure is gross. The invoice lines carry no withheld amount, so an Italian ritenuta d'acconto, a Spanish retención and a non-resident withholding are not visible here. Read the totals as what you were billed, not as what you remitted.

**Q: Can it tell a 1099-NEC base from a 1099-K one?**
A: No. The payment type Well stores is free text rather than a checked payment rail, so splitting a total into what a card network reported and what you paid directly would be a guess. The split stays with you and your processor's own year-end report.

**Q: Does it know which counterparties are contractors rather than employees?**
A: No. Contract type is not readable over Well's business graph, so contractor here means a counterparty on the purchase side of your invoices. The employment call stays with you and your advisor, and the list covers every supplier so you can apply it.

**Q: Does it list an identifier for an individual?**
A: No. Well stores no tax identifier and no address on a person, only on a company. The identifier gap therefore covers company counterparties, and a contractor billing you as an individual is named in the list with the identifier reported as not held rather than guessed.

**Q: Does it check that an identifier on file is valid?**
A: No. It reports the value as held. It does not re-check it against a public register, does not collect a W-9, does not compute backup withholding, and does not confirm that a statement was accepted once filed.

---

## Installation

The file under `skills/contractor-year-end-statements/SKILL.md` is a shell: it carries the skill's name and description, and loads the instructions from Well's MCP server with `well_get_skill` when the skill runs. Install it once; it never goes stale.

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

[⬇ Install contractor-year-end-statements](https://github.com/WellApp-ai/skills/raw/main/dist/contractor-year-end-statements.skill) and open the downloaded file. Desktop installs the skill straight away, with nothing to unzip.

### Assisted by AI

Paste this into any AI agent (Claude, Codex, Cursor, OpenCode, and others):

```
Install the following official skill from Well. Instructions:

1. Fetch this file:
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/contractor-year-end-statements/SKILL.md
2. Save it as a file named exactly "SKILL.md" inside a folder named "contractor-year-end-statements". No prefix, no suffix.
3. Install this skill.
4. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill contractor-year-end-statements
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
