<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Supplier spend register

**See what you paid each supplier over a year, ranked, with the invoices that could not be placed counted beside the total.**

## What it does

Ask your AI assistant how much you paid each supplier last year, and it reads the purchase side of your synced invoices, sums them per supplier, and ranks from your largest down. The side is resolved from the company you confirmed as your own, not from a supplier name, so a supplier trading under two labels does not quietly split into two smaller rows.

Every invoice sits in exactly one of four buckets: one you owe, one you are owed, one between two companies you own, and one Well could not place. The register covers the first bucket and reports the count of the fourth beside the total, because an invoice with no resolved side may still be one you paid. A register that hides those rows reads as complete when it is not.

It is a gross register. It reports what the invoices say you were billed, with no tax withheld at source subtracted, because the invoice lines carry no withheld amount. It also draws no line between a contractor and any other supplier, and verifies no supplier's tax identity: a missing identity is reported as missing. Where a reporting threshold matters, you name the amount and the register marks which suppliers cross it.

## Required data in Well

- **Invoicing or accounting connector** (required). This is where the supplier invoices you received, and their payment status, come from. Either one is enough.
- **Company profile confirmed in Well** (required). The purchase side of an invoice is resolved from the company you confirm as your own. Without it, invoices land in the unplaced bucket instead of the register.
- **Exchange rates** (recommended). A year that spans several currencies is reported per currency unless rates cover it, in which case each figure carries the rate and the rate date used.

## FAQ

**Q: Does it show the tax withheld at source?**
A: No. The invoice lines carry no withheld amount, so the register is a gross base with no withheld figure beside it. Read it as what you were billed, not as what you remitted.

**Q: Does it tell contractors apart from other suppliers?**
A: No. No field separates a contractor from any other supplier, so the register ranks every purchase counterparty and you apply the distinction yourself.

**Q: Does it check a supplier's tax identity?**
A: No. A supplier's tax id is optional in Well and unverified, so a missing one is reported as missing rather than guessed or looked up elsewhere.

**Q: Can it flag suppliers over a reporting threshold?**
A: Yes, once you name the amount. The register marks which suppliers cross it; it does not decide the threshold for you, because that is a rule about your jurisdiction rather than about your data.

**Q: What happens to invoices Well cannot place on a side?**
A: They are counted and reported beside the total, never dropped. An invoice with no resolved side may still be one you paid, so hiding it would make the register read as complete when it is not.

**Q: What if we paid suppliers in several currencies?**
A: You get one figure per currency, or a converted total with the rate and the rate date attached. Never a blended number with no rate behind it.

**Q: Can I run it for a different window?**
A: Yes. Name a calendar year, a fiscal year, or any range of months, and the register recomputes over it and states the window it used.

---

## Installation

The file under `skills/supplier-spend-register/SKILL.md` is a shell: it carries the skill's name and description, and loads the instructions from Well's MCP server with `well_get_skill` when the skill runs. Install it once; it never goes stale.

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

[⬇ Install supplier-spend-register](https://github.com/WellApp-ai/skills/raw/main/dist/supplier-spend-register.skill) and open the downloaded file. Desktop installs the skill straight away, with nothing to unzip.

### Assisted by AI

Paste this into any AI agent (Claude, Codex, Cursor, OpenCode, and others):

```
Install the following official skill from Well. Instructions:

1. Fetch this file:
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/supplier-spend-register/SKILL.md
2. Save it as a file named exactly "SKILL.md" inside a folder named "supplier-spend-register". No prefix, no suffix.
3. Install this skill.
4. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill supplier-spend-register
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
