<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# VAT radar

**See the VAT position your data suggests for a quarter, and which invoices to fix first.**

## What it does

Ask for your VAT position and the useful answer is the possibility the data suggests, with its working beside it. A position question reads draft, validated and locked entries plus tax stated on supplier and customer documents for the months you name, or the current quarter when you name none. It reports quarter rows with their month and rate split, keeps purchases to check separate, and never turns a missing side into zero or a supplier-only figure into a net position.

A filing or readiness question reads the VAT posted to the ledger for the months you name and reports the collected VAT, deductible VAT and net payable exactly as the posted read returns them. The posted figure is on the debit basis, so the receipts basis can differ. A running month is marked as still moving.

The figure is only as good as the invoices behind it. An invoice line with no VAT rate, or an invoice with no supplier, leaves VAT that no rate can claim. The skill lists those invoices by their supplier, number and date, says which of the two is wrong on each, and says what to set. Where the ledger holds a figure the return cannot place, it says so before it quotes a total.

It stops where the data stops. It is a working paper for your accountant, not a return. This skill files nothing itself, gives no printed box number, and does not tell you a refund is due. Where Well has a browser skill for the return and the chat can run one, it offers that skill, and nothing runs until you start it from the card. When the possibilities read suggests a credit, it states a VAT credit possibility and leaves the claim to your accountant. Only French filing rules are modelled. Purchases with no invoice in Well are not in the figure, and the skill offers to fetch them.

## Required data in Well

- **Ledger entries and VAT-bearing documents** (required). A position question reads draft, validated and locked ledger entries plus supplier and customer documents. A filing or readiness question reads the posted basis, or the same entries and documents when nothing is posted. When neither source states VAT, the read says so instead of reporting nil.
- **A French accounting country** (recommended). The posted filing basis is modelled for France only. A workspace in another country, or with none, still gets the position the read returns (the possibilities basis reads without a country and places purchases in the to-check class), with one line that VAT filing for that country is not mapped in Well.
- **Invoices behind the spend** (recommended). Deductible VAT comes from invoices. Spend with no invoice in Well adds no deductible VAT, so the net due reads higher than it will once those invoices arrive.

## FAQ

**Q: Does this file my VAT return?**
A: Not by itself. This skill is a working paper, and it transmits nothing to the tax office. Your accountant places each figure on the return, and this gives them the figure and the invoices to check first. Where Well has a browser skill for the return and the chat can run one, this skill prepares the filled CA3 from your posted ledger and offers the skill, and nothing runs until you start it from the card. You submit the return yourself.

**Q: Why does it not give box numbers?**
A: Because Well does not guess a printed box. It states the VAT by rate and by direction, and your accountant places each figure on the form. Where Well prepares the filled CA3, the form carries each figure on its line.

**Q: Does a VAT credit possibility mean I get a refund?**
A: Not from this skill. A possibility means the data suggests deductible VAT could exceed collected VAT in the window. Whether it is carried forward or claimed is a decision for your accountant, so the skill states the possibility and stops.

**Q: Why is my VAT higher than I expected?**
A: Often because deductible VAT is missing. An invoice with no VAT rate, an invoice with no supplier, or spend with no invoice at all adds nothing to the deductible side. The skill lists the first two and offers to fetch the third.

**Q: Is the current month final?**
A: No. A month still running is marked, and its figures can still move. The window total includes it, so read the total as provisional until the month ends.

**Q: Can it read a workspace outside France?**
A: Yes, as far as the data goes. It gives the position the read returns and says in one line that VAT filing for that country is not mapped in Well, rather than applying French rules to another regime.

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
