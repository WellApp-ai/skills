<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Money back

**Find money owed back to you: refunds, credit notes, VAT credits, double debits, then unpaid customer invoices.**

## What it does

Ask whether anyone owes you money and the useful answer is a short list, each line with its evidence and a number. This skill reads every workspace you have in Well. For the broad question it first runs the receivables contribution: the receivables skill reads the customer invoices still owed, per currency with the overdue part, and hands the findings back. Then it reads, in each workspace, supplier credit notes that no incoming bank movement matches, the VAT your invoices and entries suggest you may recover by quarter, and pairs of debits to one supplier, same amount, a few days apart. In your own workspace it also reads the expenses you paid for one of your companies, and the expense notes already recorded, with whether the company paid you back. Every workspace is read in place, and nothing about a company is asked: a credit note Well cannot place on a side is listed to check, with its issuer and its receiver named. The one combined answer opens on the money owed back, then the VAT, and states the customer invoices after them.

It uses the stored payment state and eligible incoming bank allocations to say whether a supplier credit note was refunded. Person-confirmed cash counts on a live, canonical incoming edge with `match_method: "human_approved"` and `edge_status` confirmed or legacy null. Supported automatic cash at 0.90 or more counts only when its party, booked-direction, FX/value and allocation guards pass; from 0.70 to below 0.90 it stays probable. A person-confirmed application counts as credit applied only when the pointer, active review link, human-done task and current fact snapshot agree.

Nothing starts until you answer with the numbers of the leads to act on. For an unpaid credit note or a confirmed remaining balance, it shows you the exact email to the supplier, with the credit note number, date and amount quoted in the body, and sends it from your Gmail only after you confirm it, wherever you ask. A VAT credit is stated as what the data suggests for the period, a possibility and not money in the bank, with the steps to raise with your accountant: it never says a refund is due. A double debit stays marked to check and blocked until the bank shows two separate payments; then it shows you the email that contests the second debit and sends it once you confirm. An expense you paid for a company becomes an expense note in that company's workspace only after you say yes, and the skill looks for the company's payment back in your bank each time you ask.

## Required data in Well

- **Customer invoices the company issued** (recommended). The receivables contribution of a broad question reads the customer invoices still unpaid from the same invoicing or accounting tool, with the payment state on each.
- **Supplier invoices and credit notes** (required). The credit notes come from your invoicing or accounting tool, with the supplier on each; one can also arrive by email or by an upload, and it is read wherever it sits.
- **A bank feed** (recommended). A refund is seen as money arriving in the bank. Without a bank feed, every credit note and every expense note is marked to check and double debits cannot be read.
- **Ledger entries or tax-bearing invoices** (recommended). The VAT part reads ledger entries in any state, and the tax stated on supplier invoices. It says what the figure rests on, and reads either source when only one exists.

## FAQ

**Q: Does it look at my personal money?**
A: Yes, for one thing: an expense you paid with your own money for one of your companies. It reads your own workspace for those expenses and for the company's payment back, and names that workspace in the answer. It never claims anything from a person.

**Q: Which workspaces does it read?**
A: Every workspace you have in Well, your companies and your own, each named in the answer. On WhatsApp, one answer reads every workspace, your own included, with no question about which one. In Well's app chat, one conversation reads the workspace it runs in and names the others it did not read.

**Q: How does it know a supplier credit note was not refunded?**
A: It checks the stored payment state against eligible incoming cash. A live `human_approved` edge must have confirmed or legacy null status. A supported automatic cash edge at confidence 0.90 or more confirms only when the party, booked-direction, FX/value and allocation guards pass. From 0.70 to below 0.90, automatic cash is probably refunded and waits for your confirmation, even when the edge is provisional. Unknown methods and unsupported evidence count zero. A paid note with covering cash is refunded; a partial one leaves `balance_due` as the remaining credit; an overpaid note means the refund exceeds the credit. A person-confirmed application counts with a current snapshot and a human-done review task. Automatic application links stay probable. A connector's paid status alone proves no refund.

**Q: Does it say a VAT refund is due?**
A: No. It says what your invoices and entries suggest for the period, a VAT credit possibility of an amount, and gives the steps to raise with your accountant. Whether the credit is carried forward or claimed is your accountant's decision.

**Q: Is a double debit a sure claim?**
A: Only when the bank already shows two separate payments. Two debits of the same amount to one supplier a few days apart can be two real purchases or one debit imported twice. While Well cannot tell, the pair is listed as to check and blocked, with both dates and amounts, and nothing is contested. A debit imported twice is not a double payment, and a pair already dismissed is not raised again. When the bank shows two separate payments with no second invoice, the pair is a lead: you pick it, see the email that asks the supplier to refund the second debit, and it leaves only once you confirm it.

**Q: Does it send the claim for me?**
A: Only after you confirm it, wherever you ask. It shows you the exact email first. In Well's chat you confirm it on the confirmation Well shows; from an outside AI assistant you get a link that opens the email in Well, and it leaves your Gmail only once you approve it there.

**Q: What is an expense note here?**
A: A payment you made with your own money for one of your companies, which the company owes you back. Once you say yes, Well records it in the company's workspace, with the amount and the day of your payment. No email goes to anyone.

**Q: Does it chase customers who owe me money?**
A: The broad question "does anyone owe me money" is answered here, and it includes the customer invoices still unpaid, read by the receivables skill as a contributor. Sending a chase or drafting a reminder for one customer is `chase-late-invoices`, and the per-customer aging detail with how late each invoice is `accounts-receivable-aging`.

**Q: How is the combined answer built?**
A: For the broad question, the receivables skill reads the customer invoices first and hands its findings back; this skill then reads the supplier credit notes, the VAT evidence, the possible double debits and the expense notes, and writes one answer that opens on the money owed back: the recovery findings first, then the VAT possibilities, then the receivables verdict, then what is uncertain. At most one question closes it.

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
