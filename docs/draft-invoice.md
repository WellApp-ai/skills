<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Draft Invoice

**Turn "invoice this client for that amount" into a real invoice in Well — no spreadsheet, no template hunting.**

## What it does

Tell your AI assistant who to bill and for what, and it builds a real invoice in Well from the details you give it — client, amount, line items, due date — then shows you the whole thing to check before it actually gets created. It never guesses a price, a tax id, or a due date on your behalf; if something's missing, it asks. Once you confirm and the invoice is created, it also renders the invoice into a print-ready PDF on your own letterhead and attaches it to the record — no separate step, no extra confirmation needed. This is the one skill in this collection that writes data instead of just reporting on it, so nothing gets created until you say yes. One thing it doesn't do: send the invoice or the PDF to your client — it creates both in Well, and you take it from there.

The PDF's letterhead carries your logo only if Well already has one on file for your company — a brand-new client relationship usually won't yet, so it prints your company name as text instead. It's also not a legally-numbered sequential invoice: Well doesn't maintain an invoice-numbering sequence, so the reference number on it is exactly the one you supplied.

## Required data in Well

- **A Well workspace** — the invoice is created inside it, and its own company record is offered as the default issuer.
- **Invoicing enabled in Well** — needed to persist the invoice, its line items, and payment details.
- *Optional:* an existing company record for your client — if Well already knows them, the skill offers to reuse their saved details (with your confirmation), saving you from re-typing them.

## Composes onto

This skill delegates two setup steps to Well's atomic skills rather than repeating them:

- **[`define-workspace`](define-workspace.md)** — pins which Well workspace the invoice is created in.
- **[`resolve-own-company`](resolve-own-company.md)** — offers your own company as the likely issuer, for you to confirm or override.

Install both alongside this one. The skill still runs without them — each step falls back inline — but with them installed you get one consistent workspace flow across every Well skill. It needs no connector skill: the invoice is written straight into Well, so there is nothing to sync first. The **Claude Code plugin** and **Codex plugin** paths below install all three together; if you download the `.skill` file on its own, grab both as well.

---

## Installation

### AI Assisted (Recommended)

Paste this into any AI agent — Claude, Codex, Cursor, OpenCode, and others:

> [!NOTE]
> We suggest using **Claude Chat** rather than Claude Cowork for this step — Cowork's approach is noticeably slower and pricier for a quick install like this. Any Claude model works fine.

```
Install the following official skills from Well.

**Instructions**:

1. Fetch these files:
    a. https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/draft-invoice/SKILL.md
    b. https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/define-workspace/SKILL.md
    c. https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/resolve-own-company/SKILL.md
2. Download and display these files to the user. The file name must be "SKILL.md". No prefix, no suffix. Exact name as specified.
3. Install these skills.
4. Before replying to the user, ensure you have named the downloaded files "SKILL.md". This is crucial for the rest of the steps.
5. If the MCP https://api.wellapp.ai/v1/mcp is not installed: suggest it to the user and explain how to add a new MCP.
```

### Manual Setup

#### Claude Desktop

Download the `.skill` file and double-click it — Claude Desktop installs it immediately, no drag-and-drop, no unzipping:

[⬇ Download for Claude Desktop](https://github.com/WellApp-ai/skills/raw/main/dist/draft-invoice.skill) · [.zip](https://github.com/WellApp-ai/skills/raw/main/dist/draft-invoice.zip)

#### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill draft-invoice
```

---

[← Back to all skills](../README.md#available-skills)

<p align="center">
  <img src="https://wellapp.ai/images/badges/soc2.avif" alt="SOC 2 Type I" height="40">
  <img src="https://wellapp.ai/images/badges/gdpr.avif" alt="GDPR Compliant" height="40">
</p>

<p align="center">
    <sub><b>Well is SOC-2 Type I and GDPR Compliant</b></sub>
</p>
