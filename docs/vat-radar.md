<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# VAT radar

**See the net VAT your posted ledger shows for a quarter and which invoices to fix first.**

## What it does

Ask for your VAT position and the useful answer is one net figure with its working beside it. This skill reads the VAT posted to your ledger for the months you name, or for the current quarter when you name none, and reports the collected VAT, the deductible VAT and the net payable exactly as the read returns them. The ledger counts VAT when an invoice is posted (the debit basis), so the receipts basis can differ. A running month is marked as still moving.

The figure is only as good as the invoices behind it. An invoice line with no VAT rate, or an invoice with no supplier, leaves VAT that no rate can claim. The skill lists those invoices by their supplier, number and date, says which of the two is wrong on each, and says what to set. Where the ledger holds a figure the return cannot place, it says so before it quotes a total.

It stops where the data stops. It is a working paper for your accountant, not a return. It files nothing, gives no printed box number, and does not tell you a refund is due: when deductible VAT exceeds collected VAT, it states a VAT credit position and leaves the claim to your accountant. Only French workspaces are read. Purchases with no invoice in Well are not in the figure, and the skill offers to fetch them.

## Required data in Well

- **Posted ledger entries** (required). The VAT is read from entries already posted to the ledger. A window with no posted entry has no VAT to state, and the skill says so instead of reporting nil.
- **A French accounting country** (required). Only the French VAT return is modelled. A workspace with another accounting country, or none, gets a plain refusal and no estimate.
- **Invoices behind the spend** (recommended). Deductible VAT comes from invoices. Spend with no invoice in Well adds no deductible VAT, so the net due reads higher than it will once those invoices arrive.

## FAQ

**Q: Does this file my VAT return?**
A: No. It is a working paper. Nothing in Well transmits a return to the tax office. Your accountant files it, and this gives them the figure and the invoices to check first.

**Q: Why does it not give box numbers?**
A: Because Well does not guess a printed box. It states the VAT by rate and by direction, and your accountant places each figure on the form.

**Q: Does a VAT credit mean I get a refund?**
A: Not from this skill. A credit means deductible VAT exceeds collected VAT in the window. Whether it is carried forward or claimed is a decision for your accountant, so the skill states the position and stops.

**Q: Why is my VAT higher than I expected?**
A: Often because deductible VAT is missing. An invoice with no VAT rate, an invoice with no supplier, or spend with no invoice at all adds nothing to the deductible side. The skill lists the first two and offers to fetch the third.

**Q: Is the current month final?**
A: No. A month still running is marked, and its figures can still move. The window total includes it, so read the total as provisional until the month ends.

**Q: Can it read a workspace outside France?**
A: Not yet. It refuses and says which country the workspace is set to, rather than applying French rules to another regime.

---

## Installation

The file under `skills/vat-radar/SKILL.md` is a shell: it carries the skill's name and description, and loads the instructions from Well's MCP server with `well_get_skill` when the skill runs. Install it once; it never goes stale.

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

[⬇ Install vat-radar](https://github.com/WellApp-ai/skills/raw/main/dist/vat-radar.skill) and open the downloaded file. Desktop installs the skill straight away, with nothing to unzip.

### Assisted by AI

Paste this into any AI agent (Claude, Codex, Cursor, OpenCode, and others):

```
Install the following official skill from Well. Instructions:

1. Fetch this file:
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/vat-radar/SKILL.md
2. Save it as a file named exactly "SKILL.md" inside a folder named "vat-radar". No prefix, no suffix.
3. Install this skill.
4. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill vat-radar
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
