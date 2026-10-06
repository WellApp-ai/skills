<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Reuse my invoice design

**Drop one of your invoices and keep its look for every next invoice.**

## What it does

A company that already sends invoices has a look its customers know. This skill keeps that look. It takes one invoice you drop, rebuilds its layout, fonts, colours, logo and legal mentions as a template, and prints the template back to check it against your invoice before it shows it to you.

The template shows beside your invoice, with the logo and the legal mentions it would reuse. For your own invoice both start kept; for another company's invoice both start removed and the issuer is named, so a supplier's logo is never reused by default. Nothing is saved until you press Keep. You can ask for changes in your own words, and a revised design shows the same way. A kept design is private to your workspace, and an invoice already issued never changes.

## Required data in Well

- **A Well workspace** (required). The rebuilt design belongs to this workspace only, and the keep writes its design and nothing else.
- **One of your invoices as a PDF** (required). The PDF must carry a real text layer. A scanned picture of an invoice cannot be rebuilt, and the skill offers Well's own designs instead.

## FAQ

**Q: Is my design shared with other workspaces?**
A: No. A kept design is private to the workspace that kept it. Nothing here publishes it.

**Q: What if the invoice is a supplier's?**
A: The skill says so, and the logo and the legal mentions start removed. You can still keep the layout. A logo or a text you did not keep is never printed.

**Q: Does keeping a design change invoices I already sent?**
A: No. An issued invoice keeps the document it was issued with. Only new drafts open on the kept design, and a customer with a design of its own keeps it.

**Q: What if the rebuild fails?**
A: Nothing is saved, and the skill says why in one line. Well's own designs stay available, and you can drop another invoice.

---

## Installation

The file under `skills/reuse-invoice-design/SKILL.md` is a shell: it carries the skill's name and description, and loads the instructions from Well's MCP server with `well_get_skill` when the skill runs. Install it once; it never goes stale.

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

[⬇ Install reuse-invoice-design](https://github.com/WellApp-ai/skills/raw/main/dist/reuse-invoice-design.skill) and open the downloaded file. Desktop installs the skill straight away, with nothing to unzip.

### Assisted by AI

Paste this into any AI agent (Claude, Codex, Cursor, OpenCode, and others):

```
Install the following official skill from Well. Instructions:

1. Fetch this file:
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/reuse-invoice-design/SKILL.md
2. Save it as a file named exactly "SKILL.md" inside a folder named "reuse-invoice-design". No prefix, no suffix.
3. Install this skill.
4. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill reuse-invoice-design
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
