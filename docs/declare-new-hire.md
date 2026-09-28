<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Declare a new hire

**Lay out what a new hire needs before day one in the country you hire in, name the forms to collect and the notices to hand over, and, on your explicit yes, record the person in Well and file the signed contract as a document.**

## What it does

The clocks on a first hire are short and they run from the start date. In Belgium the Dimona goes in the same day. In Italy the UniLav is due the day before. In Spain the alta has to be in before the person starts. In France the DPAE has its own window ahead of the start, and a late one is treated harshly. In the United States the I-9 and the state new hire report run from the first day worked. Miss one and the penalty is out of proportion to the paperwork.

This skill reads which country you employ in from your own company and your accounting settings, then lays out three lists for that country: what has to be declared and where, which forms the employee fills in and hands back, and which written notices you owe them in writing. It names each one the way it is spoken about locally, so a W-4, a Personalfragebogen, a modulo detrazioni, a Modelo 145 or a registre unique du personnel is easy to match against what is on your desk.

Then it offers a narrow write. On your explicit yes it records the person in Well with their name and job title, adds a work email or phone as a contact channel, and points you at the drop zone where the signed contract is filed as a document in the workspace.

What it will not do is the reason to trust it. Well never files a statutory return or a hire declaration. It does not submit to net-entreprises, socialsecurity.be, co.lavoro.gov.it, the SV-Meldeportal, Sistema RED or a state new hire portal, and nothing here opens, fills or sends a government form. Well holds no field for a social security number, a NIR, a Sozialversicherungsnummer, a codice fiscale, a birth date, a nationality or a Krankenkasse, so those are named as things to collect outside Well and are never asked for in a session. Uploading the signed contract stores and classifies it, it does not read the start date, the hours or the salary into a record. And there is no countdown: the timing is written guidance, not a clock that will warn you.

## Required data in Well

- **The country you employ in** (required). The checklist is per country. It is read from your own company and your accounting settings where those carry a country, and asked for plainly when they do not.
- **The hire's name, job title and start date** (required). Typed in the session. The name and the job title are what gets recorded on the person. The start date drives the timing guidance and is not stored.
- **The signed contract as a file** (recommended). Dropped into Well, where it is stored and classified as an employment document. Its terms are not read into a record.
- **A work email or phone for the hire** (optional). Added as a contact channel on the person, so the people who chase the forms have somewhere to send them.

## FAQ

**Q: Which forms does this cover?**
A: United States: W-4, IT-2104 in New York, I-9, the state new hire report, the LS 54 pay notice in New York, the offer letter or at-will agreement, and the exempt classification and salary threshold record. Germany: Arbeitsvertrag, the Nachweisgesetz Niederschrift, Personalfragebogen, DEUEV Anmeldung and the ELStAM Abruf. Belgium: Dimona IN and out, and the contrat de travail. Italy: lettera di assunzione, UniLav, modulo detrazioni and dati fiscali, and the TFR choice. Spain: contrato de trabajo, alta in Sistema RED, Modelo 145, and the informacion de condiciones esenciales. France: contrat de travail CDI, DPAE, registre unique du personnel, and the verification of the titre de sejour. Of these, the only one Well reads is the signed contract you drop in, and it reads it as a stored document rather than as terms. Every other name on this list is named so you know what is due, who fills it in and when. Well does not hold it, fill it or send it.

**Q: Does Well file the declaration for me?**
A: No, and it never will from here. Well does not submit a DPAE, a Dimona IN, a UniLav, an alta in Sistema RED, a DEUEV Anmeldung or a state new hire report, and it transmits nothing to net-entreprises, socialsecurity.be, co.lavoro.gov.it, the SV-Meldeportal or a state portal. You or your payroll bureau click submit. The skill prepares the hand-off and stops there.

**Q: Can it fill in the portal form for me?**
A: No. There is no form filling here and no browser step that opens a government site. The skill names the form, says who files it and by when, and hands you the list you carry to the portal yourself.

**Q: Where do the identity numbers go?**
A: Not into Well. There is no field for a social security number, a NIR, a Sozialversicherungsnummer, a codice fiscale, a birth date, a nationality or a Krankenkasse anywhere in the workspace, so the skill names them as things to collect on the employee's own form and never asks you to type one into a session.

**Q: Does uploading the signed contract fill in the contract record?**
A: No. The file is stored and classified as an employment document. The start date, the weekly hours, the contract type and the salary are not read out of it. A contract record with those fields appears once a payslip has been read.

**Q: Will it remind me before the deadline?**
A: No. The timing is stated as written guidance, for example that a Dimona goes in the same day and a UniLav the day before. Nothing here counts down, tracks a due date or alerts you, so put the date in your own calendar.

**Q: Can it tell me whether the role is exempt, or which contract type to use?**
A: No. That is a legal call and this skill does not make it. It names the record you need to keep, such as the exempt classification and salary threshold record in the United States, and leaves the determination to you and your advisor.

---

## Installation

The file under `skills/declare-new-hire/SKILL.md` is a shell: it carries the skill's name and description, and loads the instructions from Well's MCP server with `well_get_skill` when the skill runs. Install it once; it never goes stale.

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

[⬇ Install declare-new-hire](https://github.com/WellApp-ai/skills/raw/main/dist/declare-new-hire.skill) and open the downloaded file. Desktop installs the skill straight away, with nothing to unzip.

### Assisted by AI

Paste this into any AI agent (Claude, Codex, Cursor, OpenCode, and others):

```
Install the following official skill from Well. Instructions:

1. Fetch this file:
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/declare-new-hire/SKILL.md
2. Save it as a file named exactly "SKILL.md" inside a folder named "declare-new-hire". No prefix, no suffix.
3. Install this skill.
4. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill declare-new-hire
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
