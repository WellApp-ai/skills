<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Import a statement

**Drop a statement you already have, and get its transactions as records.**

## What it does

A bank connector is the right answer for the months ahead and no answer at all for the months behind, or for the account your bank will not let anything connect to. This skill takes the file you already have and puts it through the same import pipeline an in-app upload uses: detection, deduplication, promotion. What comes out is not a summary read aloud in chat, it is the statement, its lines and the transactions behind them, as records, so the next question you ask is answered from data rather than from the conversation's memory of a file. It takes the statement three ways. If you dropped statements on Well's website before opening this conversation, the bytes are already on Well's side and the one claim token from that drop collects every statement in it. Otherwise you attach the file here, or paste the text. The reading is always Well's, never the assistant's: a number read out of a pdf by a model is a number nobody can trace, and this skill refuses to produce one.

## Required data in Well

- **A statement file** (required). The whole point of the skill. A pdf, csv, ofx or xml export, or a photograph of the page — the extraction reads images too.
- **Banking connector** (optional). Not needed, and that is the reason this skill exists. Connect one when you want the months ahead to arrive on their own.

## FAQ

**Q: Do I need to connect my bank first?**
A: No. This is the one Well skill that produces transactions without a connector. Connect a bank when you want future months to arrive on their own; use this for the months already behind you, or for an account nothing can connect to.

**Q: Can it read a photo of my statement?**
A: Yes. The extraction reads images, so a phone photo of the page works. What it will not do is have the assistant read the numbers out of the picture — the reading is Well's, so every figure traces to a record.

**Q: I dropped a file on your website. Do I have to attach it again?**
A: No, as long as you still have the claim token from that drop and it is under an hour old. One token covers every statement you dropped together; it works once.

**Q: What happens to duplicates?**
A: The import pipeline deduplicates, so the same statement imported twice does not double your transactions.

---

## Installation

The file under `skills/import-statement/SKILL.md` is a shell: it carries the skill's name and description, and loads the instructions from Well's MCP server with `well_get_skill` when the skill runs. Install it once; it never goes stale.

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

[⬇ Install import-statement](https://github.com/WellApp-ai/skills/raw/main/dist/import-statement.skill) and open the downloaded file. Desktop installs the skill straight away, with nothing to unzip.

### Assisted by AI

Paste this into any AI agent (Claude, Codex, Cursor, OpenCode, and others):

```
Install the following official skill from Well. Instructions:

1. Fetch this file:
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/import-statement/SKILL.md
2. Save it as a file named exactly "SKILL.md" inside a folder named "import-statement". No prefix, no suffix.
3. Install this skill.
4. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill import-statement
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
