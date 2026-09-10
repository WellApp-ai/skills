<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Draft invoice

**Turn a sentence into a real invoice in Well, PDF attached, no template hunting.**

## What it does

Tell your AI assistant who to bill and for what, and it builds a real invoice in Well from the details you give it — client, amount, line items, due date — then shows you the whole thing to check before it actually gets created. It never guesses a price, a tax id, or a due date on your behalf; if something's missing, it asks. Once you confirm and the invoice is created, it also renders the invoice into a print-ready PDF on your own letterhead and attaches it to the record — no separate step, no extra confirmation needed. This is the one skill in this collection that writes data instead of just reporting on it, so nothing gets created until you say yes. One thing it doesn't do: send the invoice or the PDF to your client — it creates both in Well, and you take it from there.

The PDF's letterhead carries your logo only if Well already has one on file for your company — a brand-new client relationship usually won't yet, so it prints your company name as text instead. It's also not a legally-numbered sequential invoice: Well doesn't maintain an invoice-numbering sequence, so the reference number on it is exactly the one you supplied.

## Required data in Well

- **A Well workspace** (required). The invoice is created inside it, and its own company record is offered as the default issuer.
- **Invoicing enabled in Well** (required). Needed to persist the invoice, its line items, payment details, and the PDF Well generates once you confirm.
- **An existing company record for your client** (optional). If Well already knows them, the skill offers to reuse their saved details (with your confirmation), saving you from re-typing them.

## FAQ

**Q: Can it invent an amount or a due date?**
A: No. Every field comes from what you supplied or from a saved company record. If something is missing it asks rather than filling a plausible value.

**Q: Does it send the invoice to the client?**
A: No. It creates the record and attaches a PDF to it. Sending either one to the client is still a separate, deliberate step you take yourself.

**Q: Does the PDF follow my own invoice numbering?**
A: Well has no invoice-numbering sequence of its own. The PDF uses the reference you supply, so your existing numbering stays yours.

**Q: What if the client is already in Well?**
A: It offers to reuse their saved details, with your confirmation, so you are not retyping a tax id you already have on file.

---

## Installation

The file under `skills/draft-invoice/SKILL.md` is a shell: it carries the skill's name and description, and loads the instructions from Well's MCP server with `well_get_skill` when the skill runs. Install it once; it never goes stale.

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

### Assisted by AI

Paste this into any AI agent (Claude, Codex, Cursor, OpenCode, and others):

```
Install the following official skill from Well. Instructions:

1. Fetch this file:
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/draft-invoice/SKILL.md
2. Save it as a file named exactly "SKILL.md" inside a folder named "draft-invoice". No prefix, no suffix.
3. Install this skill.
4. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill draft-invoice
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
