<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Approve the accounts

**Your meeting notice and minutes to approve the accounts, drafted for you to check.**

## What it does

Approving the accounts is a yearly duty of a French company: a general meeting, or a decision of the sole shareholder, then a filing at the registry. Well asks the few facts the documents depend on, reads last year's minutes in your Drive when it is connected, and drafts the documents from templates by legal form, for a SAS, an SASU, a SARL or an EURL.
Each draft is marked as a draft. You check it, or have your accountant or a lawyer review it, then you sign and file it yourself. When the date of the meeting is set, the notice carries it and Well states the filing step. A date past the legal delay goes to your accountant.

## Required data in Well

- **Your own company** (required). Its legal form says which documents it needs.

## FAQ

**Q: Does Well send, sign or file the documents?**
A: No. Well prints drafts. You check them, sign them and file the accounts yourself on the registry site.

**Q: Why does Well ask questions before it drafts?**
A: The notice and the minutes change with a few facts, such as a statutory auditor or an agreement to report. Well asks them once, in one message, and uses what last year's minutes already say.

---

## Installation

The file under `skills/approve-accounts-meeting/SKILL.md` is a shell: it carries the skill's name and description, and loads the instructions from Well's MCP server with `well_get_skill` when the skill runs. Install it once; it never goes stale.

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

[⬇ Install approve-accounts-meeting](https://github.com/WellApp-ai/skills/raw/main/dist/approve-accounts-meeting.skill) and open the downloaded file. Desktop installs the skill straight away, with nothing to unzip.

### Assisted by AI

Paste this into any AI agent (Claude, Codex, Cursor, OpenCode, and others):

```
Install the following official skill from Well. Instructions:

1. Fetch this file:
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/approve-accounts-meeting/SKILL.md
2. Save it as a file named exactly "SKILL.md" inside a folder named "approve-accounts-meeting". No prefix, no suffix.
3. Install this skill.
4. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill approve-accounts-meeting
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
