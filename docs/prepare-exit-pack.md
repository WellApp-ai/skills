<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Prepare exit pack

**Read the final payslip for a leaver, state what it printed and what the contract says, and name the exit documents due and who sends each one.**

## What it does

An exit is the one payroll event a founder with one or two people has never rehearsed. The last payslip looks different from every other one, a stack of documents is due within days, and the list is different in every country.
This skill reads what Well already holds. It finds the payslip marked as the final settlement for the person leaving, and states the four header amounts it printed: gross pay, tax withheld, social contributions and net pay, in the currency the payslip was issued in. A blank amount is reported as unread, because a payslip that printed nothing is not a payslip that printed zero. Each payslip line is listed with the label it carries and its amount, and where the line catalog maps it, whether it is an earning, an employee deduction or an employer charge.
The contract terms come from the same read. The end date, the last working day, the termination reason and the contract status are reachable as the contract attached to that payslip, so they are stated as the record carries them. This is also the skill's hardest limit: a person who has no payslip in Well cannot be reached at all, and is reported as unreadable rather than guessed at.
What the skill will not do matters as much. It does not compute an unused leave balance, because Well records no absence, no leave and no time of any kind. It does not compute severance, TFR, pécule de sortie or a finiquito amount, because none of those is a typed line on a payslip: where one appears, it is quoted as the payslip labelled it and left uncomputed. It does not check that a settlement figure is legally correct. And it files nothing, signs nothing and transmits nothing. The document register it reads from is a written list carried inside the skill, naming each document, who issues it and who sends it, for the United States, Germany, Belgium, Italy, Spain and France. Confirm every clock with your payroll bureau or your payroll engine before acting on it.

## Required data in Well

- **A payslip in Well for the person leaving** (required). The only way in. The employment contract is reachable as the contract attached to a payslip row, so a leaver with no payslip in the workspace cannot be read and is reported as unreadable.
- **A final settlement payslip** (recommended). The payslip flagged as the final settlement carries the closing amounts. Without one the skill reads the latest payslip it can find and says plainly that no final settlement has landed yet.
- **A country on your accounting settings** (required). Picks which exit document register the answer reads from. The register covers the United States, Germany, Belgium, Italy, Spain and France. Another country is named as uncovered rather than guessed at.
- **A month or a window to search in** (recommended). Narrows the payslip read to the period around the departure. Pin it from the period picker or from the month named in the question.
- **Exit documents you already hold** (optional). A termination letter, a work certificate or a signed settlement you hand over can be kept in the workspace with the departure. Nothing is fetched from a portal or a mailbox.

## FAQ

**Q: Which forms does this cover?**
A: United States (New York): the written termination notice, the record of employment IA 12.3 for the unemployment office, and the COBRA or New York continuation coverage notice. Germany: the Kuendigung in written form, the DEUEV Abmeldung, the Arbeitsbescheinigung sent through BEA, the Arbeitszeugnis, and the Urlaubskonto closing note. Belgium: the C4, the certificat de travail, the attestation de vacances carrying the pécule de sortie, and the Dimona out. Italy: the lettera di licenziamento, the dimissioni telematiche the worker files, the TFR settled on the last busta paga with the UniLav cessazione behind it, and the ticket licenziamento for NASpI. Spain: the carta de despido, the liquidacion or finiquito, the certificado de empresa filed through Certific@2, and the baja in Sistema RED. France: the rupture conventionnelle, the licenciement procedure letters, and the documents de fin de contrat, the certificat de travail, the attestation for France Travail and the solde de tout compte. Three of these Well can read, and only from a document already in the workspace: the TFR where the last busta paga printed it as a line, the finiquito where the final payslip printed it as a line, and the German leave closing figure where a payslip line carries it. In each case Well quotes the line as it was labelled and computes nothing. Every other document on the list Well only names, so you know it is due and who has to send it.

**Q: Does Well file any of this?**
A: No. Well never files, signs or transmits an exit declaration or a statutory return. It does not send the DSN signalement, the DEUEV Abmeldung, the Dimona out, the UniLav cessazione, the baja in Sistema RED or the C4, and it never reports that a filing was submitted. It reads, checks, reminds and prepares the hand-off. You or your bureau click submit.

**Q: Does it tell me the unused leave owed?**
A: No. Well records no absence, no leave and no time of any kind. There is no timesheet, shift, attendance or leave record anywhere in the product, so there is no balance to compute. A leave figure appears only where a payslip line printed one, and it is quoted exactly as the payslip labelled it.

**Q: Does it compute severance, TFR, pécule de sortie or a finiquito?**
A: No. None of those is a typed kind of payslip line. The catalog types a line as salary, overtime, bonus, contribution, tax, benefit, reimbursement or other, so picking a severance line out would mean guessing from its wording, which this skill never does. Where such a line exists it is listed with its own label and its own amount, and nothing is derived from it.

**Q: Is the settlement figure correct?**
A: The skill does not say. It states what the payslip printed, not what the law owes. Checking the amount against notice, seniority and the applicable agreement is your payroll bureau's or your payroll engine's job, and this answer is a reading, not a verification.

**Q: What if the person has no payslip in Well?**
A: Then they cannot be read. The employment contract is reachable only as the contract attached to a payslip row, so a leaver with no payslip in the workspace has no end date, no last working day and no termination reason to state. The answer says so and stops, rather than guessing at a departure.

**Q: Does it write the termination letter or the work certificate?**
A: No. It names the document and who issues it. Drafting and signing a termination letter, a certificate of employment, an Arbeitszeugnis or a settlement agreement stays with you and your adviser.

**Q: Where do the exit deadlines come from?**
A: They are a written register carried inside the skill, not a live feed. Nothing in the product subscribes to an authority calendar, so a clock that moves moves without the skill noticing. Treat every date as something to confirm with your payroll bureau or your payroll engine before acting on it.

**Q: Is there a timeline of the employment?**
A: No. Well keeps no employment lifecycle or termination events, so there is no history of hire, change and exit to replay. The answer is built from the contract fields on the record and the payslips the workspace holds.

---

## Installation

The file under `skills/prepare-exit-pack/SKILL.md` is a shell: it carries the skill's name and description, and loads the instructions from Well's MCP server with `well_get_skill` when the skill runs. Install it once; it never goes stale.

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

[⬇ Install prepare-exit-pack](https://github.com/WellApp-ai/skills/raw/main/dist/prepare-exit-pack.skill) and open the downloaded file. Desktop installs the skill straight away, with nothing to unzip.

### Assisted by AI

Paste this into any AI agent (Claude, Codex, Cursor, OpenCode, and others):

```
Install the following official skill from Well. Instructions:

1. Fetch this file:
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/prepare-exit-pack/SKILL.md
2. Save it as a file named exactly "SKILL.md" inside a folder named "prepare-exit-pack". No prefix, no suffix.
3. Install this skill.
4. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill prepare-exit-pack
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
