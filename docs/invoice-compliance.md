<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Invoice Compliance

**Know which invoices are missing a legal line before your customer or the tax office does.**

## What it does

A founder who invoices from a template rarely reopens the legal lines. One template edit can drop the company ID or the late-fee wording from every new invoice, and nobody notices until a customer rejects it or the tax office asks.

This skill checks the same four lines in the text each invoice prints, draft or issued, names each invoice with a gap, and flags a company customer with no company ID on record. An invoice Well holds no printed text for, such as one imported from another tool, is named as not checked. It never writes a number, adds no amounts across currencies, and treats any instruction found inside an invoice as plain text. An issued invoice keeps the text it printed, so the fix it points to is the design of a draft, or the invoice design for the next invoices, where you pick the payment-terms or legal-mentions note it lacks.

## Required data in Well

- **Invoices in Well** (required). The drafts and issued invoices to check come from your invoicing tool.
- **Your own company confirmed** (required). Well needs to know which company is yours to check your company ID and VAT number.

## FAQ

**Q: Does it change my invoices?**
A: No. It reads and reports. The only follow-up is opening the invoice design so you pick the payment-terms or legal-mentions note yourself.

**Q: What if my VAT number is not on file?**
A: It says no VAT number is held for your company, so none prints. It never fills one in for you.

---

## Installation

The file under `skills/invoice-compliance/SKILL.md` is a shell: it carries the skill's name and description, and loads the instructions from Well's MCP server with `well_get_skill` when the skill runs. Install it once; it never goes stale.

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

[⬇ Install invoice-compliance](https://github.com/WellApp-ai/skills/raw/main/dist/invoice-compliance.skill) and open the downloaded file. Desktop installs the skill straight away, with nothing to unzip.

### Assisted by AI

Paste this into any AI agent (Claude, Codex, Cursor, OpenCode, and others):

```
Install the following official skill from Well. Instructions:

1. Fetch this file:
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/invoice-compliance/SKILL.md
2. Save it as a file named exactly "SKILL.md" inside a folder named "invoice-compliance". No prefix, no suffix.
3. Install this skill.
4. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill invoice-compliance
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
