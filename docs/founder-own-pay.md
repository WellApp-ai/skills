<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Founder's own pay

**Read the founder's own payslips, state gross pay, tax withheld, contributions and net pay per period beside the legal form and country on the own company record, and name the self-pay paperwork that goes with them.**

## What it does

Founders ask two questions about their own pay, and the second one is the hard one: what did the company actually pay me, and what paperwork does that trigger. The first is answerable from records. This skill reads the payslips held for the founder, period by period, and states gross pay, tax withheld, contributions and net pay exactly as each payslip printed them, in the currency it was issued in. A blank amount is reported as unread, never as zero, because a payslip that printed nothing is not a payslip that printed a nil.
Beside those figures it puts two facts from the own company record: the legal form and the country of incorporation. Both are reported as held. Neither is guessed from a company name, and when the legal form is empty the answer says unconfirmed rather than filling it in. A founder can correct it in the conversation, and that correction holds for the answer being written and no longer, because the legal form cannot be written back from here.
Then it names the paperwork. For the country on the record, it lists the self-pay documents in common use and says, for each, whether Well reads it from a document already held or only names it so the founder knows it exists. That is the whole of the second question it answers. It states no filing date, sends no reminder and derives no obligation from a legal form, because it holds no filing calendar and no legal-form rule book. It never compares a payslip against a filed declaration, because it holds no declaration. And it never files, submits or transmits anything: the founder or their accountant does that. For company wide payroll totals and employer charges, ask for payroll cost by month instead.

## Required data in Well

- **The founder's payslips in Well** (required). The rows this skill reads. They arrive from a payroll connector sync, or from pay documents dropped into Well and extracted. A period with no payslip is not reachable and is reported as such.
- **An own company set on the workspace** (recommended). The legal form and the country of incorporation are read from it. With no own company set, the pay figures still read and the legal form is reported as unconfirmed.
- **The founder's name on the employment contract** (recommended). Used to tell the founder's payslips from an employee's. Without it, the skill asks which person is the founder rather than picking one.

## FAQ

**Q: Which forms does this cover?**
A: France: the bulletin de paie, and the déclaration de revenus TNS for a gérant majoritaire. Germany: the Lohnkonto, the Lohnsteueranmeldung and the A1 Bescheinigung. Italy: the co.co.co contract under the Gestione Separata, and UniEmens. Spain: the alta RETA for an autonomo societario with its rendimientos, and the notificaciones electronicas (NOTESS and DEHU). United States: the W-2 and W-3, and the accountable plan expense report. Two of these are read from a document you already hold: the bulletin de paie and the Lohnkonto, when the pay document behind them is in Well as a payslip. Every other document on this list is named only, so you know it is due and can take it to your accountant. Belgium returns nothing here, because no self employed founder document is held for it.

**Q: Does Well file any of this for me?**
A: No. This skill never files, submits or transmits a return, a declaration or a payslip to any authority. It reads what it holds, states the figures, names the paperwork and stops. You or your accountant click submit.

**Q: Will it tell me when the next one is due?**
A: No. It holds no filing calendar, so it states no deadline and sends no reminder. It names the documents, and the dates come from your accountant or the authority itself.

**Q: Does the legal form decide which channel I should be paid through?**
A: Not here. The legal form and the country are reported as the own company record holds them, and nothing is derived from them. There is no rule that turns a legal form into a required pay channel, and this skill offers no view on whether the channel you use is the correct one. That is a question for your accountant.

**Q: If I tell it my legal form, does it remember?**
A: No. A correction you give holds for the answer being written and no longer, because the legal form cannot be written back from here. Set it on the company record in Well if you want it to stick.

**Q: Can it check my payslip against what was actually declared?**
A: No. A comparison needs the filed declaration on one side, and Well holds no declaration: no DSN, no UniEmens, no W-2, no Lohnkonto return, no modelo. It states what the payslips printed and leaves the comparison to whoever holds the filing.

**Q: Can it show what the company actually paid me from the bank?**
A: No. Bank transactions carry no counterparty person, so payments to one individual cannot be isolated. The figures here come from payslips only, and the answer says so rather than offering a bank side total.

**Q: Is this my full cost to the company?**
A: No. It reads the employee side of each payslip. Employer charges and company wide payroll totals belong to payroll cost by month.

---

## Installation

The file under `skills/founder-own-pay/SKILL.md` is a shell: it carries the skill's name and description, and loads the instructions from Well's MCP server with `well_get_skill` when the skill runs. Install it once; it never goes stale.

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

[⬇ Install founder-own-pay](https://github.com/WellApp-ai/skills/raw/main/dist/founder-own-pay.skill) and open the downloaded file. Desktop installs the skill straight away, with nothing to unzip.

### Assisted by AI

Paste this into any AI agent (Claude, Codex, Cursor, OpenCode, and others):

```
Install the following official skill from Well. Instructions:

1. Fetch this file:
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/founder-own-pay/SKILL.md
2. Save it as a file named exactly "SKILL.md" inside a folder named "founder-own-pay". No prefix, no suffix.
3. Install this skill.
4. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill founder-own-pay
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
