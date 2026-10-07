<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Check contractor status

**For each supplier that looks like a freelancer, read the purchase invoices, the payment rail and any contract Well holds, and state the facts a requalification question turns on, next to the papers your country expects you to keep.**

## What it does

Requalification is decided on facts, not on a label. An inspector asks how often the supplier invoiced, whether the amount was the same every month, whether you were nearly their only client, whether a contract exists, and what paper you kept. Most of those facts are already in your business data and nobody reads them together: the invoicing tool sees invoices, the bank sees payments, the contractor platform sees only its own contractors.

This skill reads them in one pass, per supplier, for the twelve months you pin. It reports the number of purchase invoices, the months they landed in, whether the amounts repeat, the total, that supplier's share of your total purchase spend, the rail each payment used, and the contract type when Well holds an employment contract record for that person. Each of those is a fact from a row, with the row behind it, so you can disagree with it by looking.

Then it names the papers. Which ones depend on the country you tell it the supplier works from: in the United States a W-9 and, in New York, a written contract under the Freelance Isn't Free Act, plus your own written classification file. In Germany a signed Vertrag, the supplier's Rechnung, a Statusfeststellung where the relationship looks close, and the Künstlersozialabgabe where the supplier is a creative. In Belgium a prestation contract, and the 30bis retention check for construction, cleaning, security and meat work only. In Italy the fattura elettronica with its ritenuta d'acconto, the comunicazione preventiva before occasional self-employed work begins, a co.co.co. contract under the Gestione Separata where the work is coordinated, and the DURC. In Spain a factura de autónomo with the IRPF retención, and a contrato TRADE where one client carries most of the supplier's income. In France a contrat de prestation, the attestation de vigilance every six months above the threshold, and the supplier e-invoices themselves.

Two limits define the answer. Well reads the invoices, so where a supplier invoice is in your workspace it is read; it cannot tell you whether a W-9, an attestation, a DURC or a Statusfeststellung is on file, because documents in Well carry no supplier link and no such type. The paper list is a reminder you confirm, never a coverage report. And this skill files nothing: not with the Deutsche Rentenversicherung, not with the ONSS, not with INPS or the Agenzia delle Entrate, not with the TGSS, not with URSSAF. It prepares the facts and names the portal. You or your bureau click submit.

## Required data in Well

- **Purchase invoices from your suppliers** (required). The cadence, the amounts and the share of spend all come from the purchase side of the invoices in your workspace. Without them there is nothing to read.
- **The country each supplier works from** (required). You name it. Well does not derive a supplier's country, and the paper list is entirely different per country.
- **Bank transactions** (recommended). They give the rail each payment used and the dates it actually left, which is what makes a regular monthly pattern visible.
- **Counterparty categories** (recommended). An industry category on a supplier is what separates a freelance designer from a software subscription. Uncategorized suppliers are reported as unsorted rather than guessed at.
- **Employment contract records** (optional). Where Well holds a contract record for the person, its contract type is read and stated. Most freelance suppliers have no such record, and that absence is reported as no contract record, not as no contract.

## FAQ

**Q: Which forms does this cover?**
A: United States: the W-9 you collect from the supplier, a written contract under New York's Freelance Isn't Free Act, and your own written classification file. Germany: the freelancer Vertrag and the supplier's Rechnung, the Statusfeststellung at the Deutsche Rentenversicherung, and the Künstlersozialabgabe where the supplier is a creative. Belgium: the freelance prestation contract, and the 30bis retention check for construction, cleaning, security and meat work only. Italy: the fattura elettronica carrying the ritenuta d'acconto, the comunicazione preventiva for occasional self-employed work, a co.co.co. contract under the Gestione Separata, and the DURC. Spain: the factura de autónomo with the IRPF retención, and the contrato TRADE. France: the contrat de prestation, the attestation de vigilance from a sous-traitant, and your suppliers' e-invoices. Of those, only the invoices are read from a document Well holds: the German Rechnung, the Italian fattura elettronica, the Spanish factura and the French supplier e-invoice, and only where they synced into your workspace as purchase invoices. Every other name on that list is named so you know what is due. Well cannot see whether you hold it.

**Q: Does Well file any of this for me?**
A: No. This skill never files with an authority. Not the Statusfeststellung, not the 30bis check, not the DURC, not the comunicazione preventiva, not a retención or a ritenuta return. The skill prepares the facts and names the portal. You or your bureau file.

**Q: Does it tell me whether someone is really an employee?**
A: No, and it will refuse to. It states observed facts: how many invoices, over how many months, whether the amounts repeat, what share of your spend, what contract type exists where a record exists. Reading those facts as a classification is a decision for you and your advisor.

**Q: Can it tell me whether I have a W-9 or an attestation on file?**
A: No. Documents in Well carry no supplier link, and there is no document type for a W-9, an attestation de vigilance, a DURC or a Statusfeststellung. The paper list is a checklist you confirm against your own drawer, never a coverage report Well computed.

**Q: Does it compute the withholding?**
A: No. The ritenuta d'acconto, the IRPF retención and the Künstlersozialabgabe levy are named as obligations that apply, never calculated. The invoice lines carry no withheld amount, so any figure here would be invented.

**Q: Does it read my contractor platform?**
A: Only if you ask, and only with your say-so on the turn. A contractor platform's contract and people lists are treated as a consequential call rather than a plain read, so this skill runs on invoices, transactions and contract records by default. A supplier missing from that platform is never reported as unmanaged.

**Q: Does it prepare a 1099 or a year-end contractor statement?**
A: No. There is no 1099, DAS2 or fiche 281.50 preparation here. For what you paid each supplier over a year, ranked, ask for the supplier spend register instead.

---

## Installation

The file under `skills/check-contractor-status/SKILL.md` is a shell: it carries the skill's name and description, and loads the instructions from Well's MCP server with `well_get_skill` when the skill runs. Install it once; it never goes stale.

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

[⬇ Install check-contractor-status](https://github.com/WellApp-ai/skills/raw/main/dist/check-contractor-status.skill) and open the downloaded file. Desktop installs the skill straight away, with nothing to unzip.

### Assisted by AI

Paste this into any AI agent (Claude, Codex, Cursor, OpenCode, and others):

```
Install the following official skill from Well. Instructions:

1. Fetch this file:
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/check-contractor-status/SKILL.md
2. Save it as a file named exactly "SKILL.md" inside a folder named "check-contractor-status". No prefix, no suffix.
3. Install this skill.
4. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill check-contractor-status
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
