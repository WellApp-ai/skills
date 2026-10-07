<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Money back

**Find the supplier refunds and VAT credits your company is still owed, with the evidence for each.**

## What it does

Ask whether anyone owes your company money and the useful answer is a short list, each line with its evidence. This skill reads three things. Supplier credit notes that no incoming bank movement matches. The VAT position your posted ledger shows for a quarter. Pairs of debits to one supplier, same amount, a few days apart.

It matches a credit note to a refund on a typed link between the invoice and a bank movement first, and on direction, supplier and amount second. A movement typed as a refund supports the match but is never required, since many banks record a supplier refund as a plain transfer. When the bank is not connected, or gives no direction, the sum is marked to check, never claimed.

For an unpaid credit note, it shows you the exact email to the supplier, with the credit note number, date and amount quoted in the body, and sends it from your Gmail once you confirm. A VAT credit is stated as what the ledger shows for the period, with the steps to raise with your accountant: it never says a refund is due. A double debit always stays marked to check. The skill covers companies only.

## Required data in Well

- **Supplier invoices and credit notes** (required). The credit notes come from your invoicing or accounting tool, with the supplier on each. Without them there is no credit note to look for.
- **A bank feed** (recommended). A refund is seen as money arriving in the bank. Without a bank feed, every credit note is marked to check and double debits cannot be read.
- **Posted ledger entries** (recommended). The VAT credit position is read from entries already posted to the ledger. Without them the VAT part says so and states no figure.
- **Company profile confirmed in Well** (required). Well tells supplier credit notes from your own by resolving your side of each invoice from your own company.

## FAQ

**Q: Does it look at my personal money?**
A: No. It works on a company workspace and looks for money owed back to the company. A deposit or a refund owed to you as a person is outside it.

**Q: How does it know a supplier credit note was not refunded?**
A: It looks for a link between the credit note and an incoming bank movement, then for money from that supplier of the same amount arriving after the credit note date. If it finds neither, the credit note is listed as unsettled with the dates it checked. If the evidence is thin, the sum is marked to check.

**Q: Does it say a VAT refund is due?**
A: No. It says what the posted ledger shows for the period, a VAT credit position of an amount, and gives the steps to raise with your accountant. Whether the credit is carried forward or claimed is your accountant's decision.

**Q: Is a double debit a sure claim?**
A: No. Two debits of the same amount to one supplier a few days apart can be two real purchases. It is always listed as to check, with both dates and amounts, so you can look at the statement before you contest.

**Q: Does it send the claim for me?**
A: It shows you the exact email first. On Well's chat and on WhatsApp it sends from your Gmail only after you confirm on the confirmation Well shows. In an outside AI assistant it prepares the draft and you send it from your own mail app.

**Q: Does it chase customers who owe me money?**
A: No. That is a different question: ask who owes you money, and the receivables aging answers it.

---

## Installation

The file under `skills/money-back/SKILL.md` is a shell: it carries the skill's name and description, and loads the instructions from Well's MCP server with `well_get_skill` when the skill runs. Install it once; it never goes stale.

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

[⬇ Install money-back](https://github.com/WellApp-ai/skills/raw/main/dist/money-back.skill) and open the downloaded file. Desktop installs the skill straight away, with nothing to unzip.

### Assisted by AI

Paste this into any AI agent (Claude, Codex, Cursor, OpenCode, and others):

```
Install the following official skill from Well. Instructions:

1. Fetch this file:
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/money-back/SKILL.md
2. Save it as a file named exactly "SKILL.md" inside a folder named "money-back". No prefix, no suffix.
3. Install this skill.
4. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill money-back
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
