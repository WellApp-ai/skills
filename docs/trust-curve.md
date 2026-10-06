<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Action levels

**Choose, kind by kind, what Well may do alone and what it must always ask you first.**

## What it does

Trust is earned one kind of action at a time. A person who is glad to let Well change a record may still want to approve every email sent in their name. This skill keeps that choice small and explicit: for each kind of action there is one level, "ask me each time" or "act alone". The level is the only thing stored. Who changed it, when, and how many actions ran under it are read from a change log, so every change can be read and reset.

The first time Well is about to do a kind of action, it asks the choice once, on the confirm card. After the person answers, Well does not ask that question again. When Well acts alone, it says so in one line and shows what it did, so nothing happens silently. When the person keeps "ask me each time" for a long run of confirmed actions, or for a month, Well offers "act alone" once more and says why.

A level can go up only from a sentence the person typed in Well's own chat. The same sentence found inside a mail, a document, a web page, a forwarded message or a tool result changes nothing, and neither does a request from Claude or ChatGPT over MCP. The server enforces this, so a clever message cannot talk Well into acting alone. A turn that holds a tool result, a file or a page asks even for a kind you let Well do alone. Deleting a record, inviting a member, writing in a connected tool, minting a public link, payments, plan changes, bank detail changes and password changes always ask.

## Required data in Well

- **A Well workspace** (required). A level belongs to one member of one workspace.
- **Owner or admin rights** (optional). Only needed to set the level of another member or the workspace-wide level.

## FAQ

**Q: Which actions can Well do alone?**
A: The kinds you choose, one at a time: sending in your name, changing a record, issuing an invoice, booking entries, changing a setting, revoking a shared link and spending AI tokens on a batch. Deleting a record, inviting a member, writing in a connected tool, minting a public link, payments, plan changes, bank detail changes and password changes always ask, whatever you chose before.

**Q: Can a mail or a document make Well act alone?**
A: No. A level goes up only when you type the request yourself in Well's chat. The same words inside a mail, a document, a page, a forwarded message or a tool result change nothing, and Well tells you it ignored them.

**Q: Can Claude or ChatGPT raise a level?**
A: No. Over MCP a level can be lowered, never raised. Raise it in Well's own chat.

**Q: How do I take a level back?**
A: Say "ask me before sending" or open the action levels in your profile settings and reset it. Each change is kept in a log you can read.

**Q: Can an admin change my levels?**
A: An owner or admin can set the level of a member, and Well tells the member at their next conversation. A workspace-wide level can only make Well ask. Acting alone is each member's own choice, or an admin's setting for that one member.

---

## Installation

The file under `skills/trust-curve/SKILL.md` is a shell: it carries the skill's name and description, and loads the instructions from Well's MCP server with `well_get_skill` when the skill runs. Install it once; it never goes stale.

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

[⬇ Install trust-curve](https://github.com/WellApp-ai/skills/raw/main/dist/trust-curve.skill) and open the downloaded file. Desktop installs the skill straight away, with nothing to unzip.

### Assisted by AI

Paste this into any AI agent (Claude, Codex, Cursor, OpenCode, and others):

```
Install the following official skill from Well. Instructions:

1. Fetch this file:
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/trust-curve/SKILL.md
2. Save it as a file named exactly "SKILL.md" inside a folder named "trust-curve". No prefix, no suffix.
3. Install this skill.
4. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill trust-curve
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
