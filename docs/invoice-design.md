<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Invoice design

**Pick how an invoice prints, from the designs and records you already have.**

## What it does

An invoice is a document somebody outside the company reads, and how it is set is part of what it says. This skill puts that choice in one place: eight designs, each drawn with the real invoice inside it rather than a stock preview, and the settings that decide what the page prints beneath them. Nothing here is typed in. The terms, the tax rate and the bank account are the records the workspace already keeps, so choosing one cannot invent a figure or point the payment at an account that is not theirs.

## Required data in Well

- **A Well workspace** (required). Every design option is read from it — its notes, its tax rates, its payment means — so the choice can never reach another workspace's records.
- **An invoice to design** (required). The design is a property of one invoice, not of the workspace, so there has to be an invoice to carry it.
- **A payment-link connector** (optional). Only needed for a hosted payment address on the document. Without one the invoice still prints, carrying bank coordinates instead.

## FAQ

**Q: Can I set one design for every invoice?**
A: Not yet. The design is a column on the invoice, and Well holds no workspace-level default, so the skill designs the invoice in hand and says so rather than writing the same value in a loop.

**Q: Can it write my terms as free text?**
A: No. Terms, tax rate and payment means are records the workspace keeps. The card offers the ones that exist; it never types a new one into a field that takes a record.

**Q: Does choosing a design change the invoice's figures?**
A: No. Every design derives totals and VAT from the same line items. The choice changes how the page is set, never what it says.

**Q: Will the document carry a payment link?**
A: Only when a connected connector can mint one for this workspace. The card reports that per connector, read from what the connection can actually reach rather than from the provider's catalogue.

---

## Installation

The file under `skills/invoice-design/SKILL.md` is a shell: it carries the skill's name and description, and loads the instructions from Well's MCP server with `well_get_skill` when the skill runs. Install it once; it never goes stale.

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

[⬇ Install invoice-design](https://github.com/WellApp-ai/skills/raw/main/dist/invoice-design.skill) and open the downloaded file. Desktop installs the skill straight away, with nothing to unzip.

### Assisted by AI

Paste this into any AI agent (Claude, Codex, Cursor, OpenCode, and others):

```
Install the following official skill from Well. Instructions:

1. Fetch this file:
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/invoice-design/SKILL.md
2. Save it as a file named exactly "SKILL.md" inside a folder named "invoice-design". No prefix, no suffix.
3. Install this skill.
4. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill invoice-design
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
