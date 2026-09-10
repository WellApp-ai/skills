<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Payment and invoice lookup

**Find what payment settled an invoice, or catch every payment that never got one.**

## What it does

Ask your AI assistant about one specific payment or invoice — "what happened with this transaction?", "what invoice does this payment belong to?" — and it finds the match straight from your synced reconciliation data, including how confident that match is. Or ask it to sweep for gaps — "show me unreconciled payments" — and it lists every transaction or invoice with no counterpart on file, so nothing slips through unnoticed.

## Required data in Well

- **Invoicing / bills connector** (required). This is where invoices come from.
- **Banking or accounting connector** (required). This is where transactions come from, and where reconciliation matches are formed between the two.

## FAQ

**Q: What does match confidence mean?**
A: How strongly the payment and invoice agree on amount, date, reference, and counterparty. A weak match is surfaced as weak rather than presented as settled.

**Q: Can it reconcile automatically?**
A: It finds and scores the match. Confirming a reconciliation stays an explicit action so nothing is silently posted.

**Q: What shows up as unreconciled?**
A: Any transaction with no linked invoice, and any invoice with no linked payment, both directions of the gap.

---

## Installation

The file under `skills/payment-invoice-lookup/SKILL.md` is a shell: it carries the skill's name and description, and loads the instructions from Well's MCP server with `well_get_skill` when the skill runs. Install it once; it never goes stale.

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
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/payment-invoice-lookup/SKILL.md
2. Save it as a file named exactly "SKILL.md" inside a folder named "payment-invoice-lookup". No prefix, no suffix.
3. Install this skill.
4. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill payment-invoice-lookup
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
