<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Prefill Form 1099-NEC

**Get one 1099-NEC per contractor back as a PDF with your own posted figures already in box 1, and the list of payees you cannot file for yet.**

## What it does

Ask your assistant to prefill the 1099s and it downloads the IRS template, reads the closed calendar year out of Well, and produces one filled sheet per contractor.

Box 1 is the sum of payments posted to that counterparty. Unposted payments are excluded and counted, so the total is what your ledger says rather than what it might say once the month is finished. A payee with no tax identifier is listed rather than filled, because a sheet with a blank TIN is not a sheet anyone can file.

Copy A goes to the IRS through IRIS, either the Taxpayer Portal or IRIS A2A. Well transmits nothing. What comes back is the working paper you or your preparer file from, and the recipient copy you hand the contractor.

## Required data in Well

- **A bank or accounting connector** (required). Box 1 is the sum of posted payments to a counterparty. With nothing connected there is nothing to total and no payee to find.
- **Own company set** (required). The payer block is the workspace's own company: registered name, address and EIN. Without it every sheet is missing its payer.
- **Counterparty tax identifiers** (recommended). A payee with no tax identifier cannot be filed for. Those payees are listed separately rather than filled, and tax-id-chase is the way out.
- **A closed calendar year** (required). An open year's totals move after the sheets are produced. The skill reads a closed year so the PDF and the ledger cannot disagree tomorrow.

## FAQ

**Q: Does this file my 1099s?**
A: No. It produces PDFs. Copy A reaches the IRS through IRIS, and Well holds no IRIS credential, transmits nothing and receives no acknowledgement. You or your preparer file them.

**Q: Why is the state block empty?**
A: Because boxes 5, 6 and 7 are a determination about where the work was performed and which state's rules apply to it. That is applying state tax law rather than reading your ledger, so the skill leaves the block empty and says so rather than printing a number you might file.

**Q: How does it decide who gets a sheet?**
A: By the year total of posted payments per counterparty, against the threshold the current IRS instructions state. The threshold is read from the instructions for that year rather than carried in the skill, because the IRS has changed it.

**Q: Will it tell me if someone is an employee rather than a contractor?**
A: No. Nonemployee compensation against wages is a worker classification question, it decides between this form and a W-2, and the skill refuses it rather than answering it wrong.

**Q: What about a payee that is a corporation?**
A: Corporations are generally exempt from 1099-NEC reporting and the ledger does not reliably carry legal form, so the skill asks per payee and drops the ones you confirm are exempt.

---

## Installation

The file under `skills/prefill-form-1099-nec/SKILL.md` is a shell: it carries the skill's name and description, and loads the instructions from Well's MCP server with `well_get_skill` when the skill runs. Install it once; it never goes stale.

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

[⬇ Install prefill-form-1099-nec](https://github.com/WellApp-ai/skills/raw/main/dist/prefill-form-1099-nec.skill) and open the downloaded file. Desktop installs the skill straight away, with nothing to unzip.

### Assisted by AI

Paste this into any AI agent (Claude, Codex, Cursor, OpenCode, and others):

```
Install the following official skill from Well. Instructions:

1. Fetch this file:
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/prefill-form-1099-nec/SKILL.md
2. Save it as a file named exactly "SKILL.md" inside a folder named "prefill-form-1099-nec". No prefix, no suffix.
3. Install this skill.
4. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill prefill-form-1099-nec
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
