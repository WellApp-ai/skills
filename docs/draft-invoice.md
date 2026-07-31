<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Draft Invoice

**Turn "invoice this client for that amount" into a real invoice in Well — no spreadsheet, no template hunting.**

## What it does

Tell your AI assistant who to bill and for what, and it builds a real invoice in Well from the details you give it — client, amount, line items, due date — then shows you the whole thing to check before it actually gets created. It never guesses a price, a tax id, or a due date on your behalf; if something's missing, it asks. This is the one skill in this collection that writes data instead of just reporting on it, so nothing gets created until you say yes. One thing it doesn't do: send the invoice to your client — it creates the record in Well, and you take it from there.

## Required data in Well

- **A Well workspace** — the invoice is created inside it, and its own company record is offered as the default issuer.
- **Invoicing enabled in Well** — needed to persist the invoice, its line items, and payment details.
- *Optional:* an existing company record for your client — if Well already knows them, the skill offers to reuse their saved details (with your confirmation), saving you from re-typing them.

---

## Installation

### AI Assisted (Recommended)

Paste this into any AI agent — Claude, Codex, Cursor, OpenCode, and others:

> [!NOTE]
> We suggest using **Claude Chat** rather than Claude Cowork for this step — Cowork's approach is noticeably slower and pricier for a quick install like this. Any Claude model works fine.

```
Install the following official skill from Well.

**Instructions**:

1. Fetch this file: 
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/draft-invoice/SKILL.md
2. Download and display this file to the user. The file name must be "SKILL.md". No prefix, no suffix. Exact name as specified.
3. Install this skill.
4. Before replying to the user, ensure you have named the downloaded file "SKILL.md". This is crucial for the rest of the steps.
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
