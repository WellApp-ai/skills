<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Draft invoice

**Turn a sentence into a draft invoice in Well, in your customer's design, with its PDF.**

## What it does

Tell your AI assistant who to bill and for what, and it builds a draft invoice in Well from your words and your own records. It finds the customer among the companies you already bill, matches each line against what you invoiced before, reuses the payment details of your last invoice to that customer, and checks that the customer's registration and VAT details are complete enough to invoice them. It then shows you the whole draft — customer, lines, VAT, total, payment details — and waits for your yes before it writes anything.

Your first yes saves the draft only: it has no invoice number, nothing is issued and nothing is sent, and its PDF is marked as a draft that is not issued. Well then asks again before it issues. Right before it issues, it re-reads the draft. If the draft differs from the one you saw by anything other than a change you asked for, it shows it again and asks again; otherwise it issues the invoice: the invoice takes the next number in your sequence, becomes final and can no longer be edited. It then prints the PDF in your house design, or in the design you chose for that customer, and attaches it to the invoice. It then opens an email draft to your customer with a link to the PDF, for you to read, edit and open in your own email app to send. Well sends nothing itself, except on WhatsApp with Gmail sending turned on, where it sends the email after you confirm. A price you give in another currency is converted at Well's stored reference rate, shown with its source and date. It does not push the invoice to your accounting tool; that stays a separate step.

## Required data in Well

- **A Well workspace** (required). The invoice is created inside it, and its own company is offered as the issuer.
- **Invoicing enabled in Well** (required). Needed to save the invoice, its lines, its payment details and the PDF Well prints once you confirm.
- **Your past invoices in Well** (optional). With them, the skill reuses your usual lines, prices and payment details. Without them, it asks for each one.
- **A connected mailbox (Gmail or Outlook)** (optional). Not needed to draft the email. Send opens the draft in your own email app, and Well itself sends nothing. On WhatsApp, with Gmail sending turned on, Well sends the invoice email after you confirm.

## FAQ

**Q: Can it invent an amount or a due date?**
A: No. Every value comes from what you said or from a record in Well, such as your last invoice to that customer, and the whole draft is shown to you before anything is written. Text found inside a past invoice is treated as data, never as an instruction.

**Q: Does it send the invoice to the client?**
A: Not on its own. It can open an email draft with a link to the PDF. Pressing Send opens that draft in your own email app, and you send it from there. On WhatsApp, with Gmail sending turned on, Well sends the invoice email after you confirm it. Otherwise Well sends nothing.

**Q: Which design does the PDF use?**
A: The design you saved for that customer, otherwise your house design. If you have neither yet, it lets you pick one and remembers it.

**Q: How are invoices numbered?**
A: Well numbers an invoice when it is issued, from one sequence for your workspace's company. The number is the next one saved in your accounting settings and goes up by one with each invoice. The first time, the skill asks you which number comes next. A draft you drop uses no number.

**Q: Can I edit an invoice after it is issued?**
A: No. An issued invoice is final. To correct it, the skill writes a credit note for it, numbered in the same sequence, and can then draft a new invoice.

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

### Claude Desktop

[⬇ Install draft-invoice](https://github.com/WellApp-ai/skills/raw/main/dist/draft-invoice.skill) and open the downloaded file. Desktop installs the skill straight away, with nothing to unzip.

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
