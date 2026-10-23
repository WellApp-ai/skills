<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Missing receipts

**Find the bills with no paperwork attached, before an auditor does.**

## What it does

Ask your AI assistant which invoices have no document attached, and it checks your synced invoices for any with no receipt or bill PDF on file. You get the list of invoices that need paperwork, with amounts, dates and currency, straight from your invoicing data. To get a missing receipt, name the expense: Well hands it to the Chrome extension, which opens the vendor's site in your own browser, or to a saved browser skill when one covers that vendor. The run starts only when you start it, and nothing is reported as fetched until the document is in Well. When you send a receipt photo or PDF, it offers the payments that fit and attaches the receipt to the one you pick.

## Required data in Well

- **Invoicing / bills connector** (required). The primary source: every invoice's attached-document status.
- **Banking or accounting connector** (optional). It enables a secondary check for transactions with no linked document.
- **Bank connector** (optional). With a bank connected, a receipt you send is matched to the payment it settles.

## FAQ

**Q: Can it fetch the receipt for me?**
A: Yes, through the Well Chrome extension. Name the expense and Well hands it to the extension, which opens the vendor's site in your own browser and gets the document once you start the run there. Where Well has a saved browser skill for the vendor, it uses that. For a transaction you pick it can also draft the email that asks the vendor, which you send from your own mailbox.

**Q: Can I send a receipt photo?**
A: Yes. Send the photo or the PDF and Well offers the payments that fit. It attaches the receipt only to the payment you pick, and keeps it until the payment shows up when none fits yet.

---

## Installation

The file under `skills/missing-receipts/SKILL.md` is a shell: it carries the skill's name and description, and loads the instructions from Well's MCP server with `well_get_skill` when the skill runs. Install it once; it never goes stale.

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

[⬇ Install missing-receipts](https://github.com/WellApp-ai/skills/raw/main/dist/missing-receipts.skill) and open the downloaded file. Desktop installs the skill straight away, with nothing to unzip.

### Assisted by AI

Paste this into any AI agent (Claude, Codex, Cursor, OpenCode, and others):

```
Install the following official skill from Well. Instructions:

1. Fetch this file:
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/missing-receipts/SKILL.md
2. Save it as a file named exactly "SKILL.md" inside a folder named "missing-receipts". No prefix, no suffix.
3. Install this skill.
4. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill missing-receipts
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
