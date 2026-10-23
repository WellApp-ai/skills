<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Accounting review

**Work through your open accounting items by category.**

## What it does

Say "work through my accounting items" and the assistant takes the open items Well cannot settle alone, in category order: bank statements without an account, documents Well could not place, matches to confirm, bank lines missing from the books, possible duplicates, bank accounts to confirm, invoices to check and conflicting records.

For each item it states the amount or reference and what Well proposes. Each resolution goes through a confirmation card that you approve before it writes. Items that need the web app come back with a link, because Well does not decide them in chat.

A tail-match or folded-edge review is never closed by a status change. Its decision is a choice you make, so it goes to you with its link.

Each confirmed resolution writes one item with the tool that item names, then the list is read again so the count drops as you go.

## Required data in Well

- **Bank connector** (required). The accounting items come from your bank feed and your books, so the bank connection comes first.

## FAQ

**Q: Does it resolve everything without asking?**
A: No. Each resolution asks you to confirm it first, in a card you approve in the conversation. An item Well cannot settle alone stays open for you.

**Q: What is a folded-edge or tail-match review?**
A: Two kinds of item where Well needs your decision on the account, not a status change. The skill hands them to you with a link so you can decide in the app.

**Q: Can I work through one category only?**
A: Yes. Name the category in your message, for example matches, and the skill works through that category only.

---

## Installation

The file under `skills/accounting-review/SKILL.md` is a shell: it carries the skill's name and description, and loads the instructions from Well's MCP server with `well_get_skill` when the skill runs. Install it once; it never goes stale.

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

[⬇ Install accounting-review](https://github.com/WellApp-ai/skills/raw/main/dist/accounting-review.skill) and open the downloaded file. Desktop installs the skill straight away, with nothing to unzip.

### Assisted by AI

Paste this into any AI agent (Claude, Codex, Cursor, OpenCode, and others):

```
Install the following official skill from Well. Instructions:

1. Fetch this file:
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/accounting-review/SKILL.md
2. Save it as a file named exactly "SKILL.md" inside a folder named "accounting-review". No prefix, no suffix.
3. Install this skill.
4. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill accounting-review
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
