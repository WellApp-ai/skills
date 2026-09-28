<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Prefill Form 1120

**Get page 1 of your 1120 back as a PDF with your own book figures already in the boxes, and a list of every box left for your preparer.**

## What it does

Ask your assistant to prefill the 1120 and it downloads the IRS template for the tax year, then fills page 1 from the ledger you already closed.

The figures are book figures. They come from the accounts your transactions are posted to, for a fiscal year you have closed in Well, and they are correct as a statement of what your books say. They are not tax figures: no book-to-tax adjustment is applied, because Well stores none. Your preparer reconciles Schedule M-1; this skill gives them a page 1 that already agrees with the ledger instead of a blank one.

It stops where the data stops. Net operating loss, credits, estimated payments and the tax computation are left empty and named, since nothing in Well determines them. The result is a draft to review and sign elsewhere, not a return this skill files. Nothing in Well transmits anything to the IRS.

## Required data in Well

- **Accounting connector** (required). The amounts come from posted ledger accounts. With no accounting connector there is nothing to read and the skill fills the identity block only.
- **Own company set** (required). The corporation's legal name, address and EIN come off the workspace's own company. Without it the identity block stays blank.
- **A closed fiscal year** (required). An open year's figures move after the file is produced. The skill reads a closed year so the PDF and the ledger cannot disagree the next day.

## FAQ

**Q: Does this file my return?**
A: No. It produces a PDF. Nothing in Well transmits to the IRS, holds an e-file credential or receives a submission acknowledgement. You or your preparer file it.

**Q: Are the amounts tax figures?**
A: No, they are book figures read from your posted ledger. No book-to-tax adjustment is applied, because Well stores none. Schedule M-1 is your preparer's reconciliation, not this skill's output.

**Q: Why are so many boxes still empty?**
A: Because nothing in Well determines them. Net operating loss, special deductions, credits, estimated payments and the tax computation each depend on facts the ledger does not carry. The skill names every field it left blank rather than guessing one.

**Q: Which tax year's form does it use?**
A: Whichever one the IRS currently publishes at the canonical URL. The IRS re-issues Form 1120 every year and the field names shift between editions, so the skill verifies the field names it expects are present before it writes, and stops if they are not.

**Q: Can it do Form 1120-S or 1065 instead?**
A: Not yet. Both are fillable and follow the same pattern, but each has its own field map and its own set of lines Well can defend. This skill is 1120 only and says so rather than writing an S-corporation return onto a C-corporation form.

---

## Installation

The file under `skills/prefill-form-1120/SKILL.md` is a shell: it carries the skill's name and description, and loads the instructions from Well's MCP server with `well_get_skill` when the skill runs. Install it once; it never goes stale.

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

[⬇ Install prefill-form-1120](https://github.com/WellApp-ai/skills/raw/main/dist/prefill-form-1120.skill) and open the downloaded file. Desktop installs the skill straight away, with nothing to unzip.

### Assisted by AI

Paste this into any AI agent (Claude, Codex, Cursor, OpenCode, and others):

```
Install the following official skill from Well. Instructions:

1. Fetch this file:
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/prefill-form-1120/SKILL.md
2. Save it as a file named exactly "SKILL.md" inside a folder named "prefill-form-1120". No prefix, no suffix.
3. Install this skill.
4. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill prefill-form-1120
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
