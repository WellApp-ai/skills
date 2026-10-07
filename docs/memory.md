<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Memory

**Tell Well once, and it remembers what matters about you and your business.**

## What it does

Most assistants forget you between sessions, or keep everything you ever typed. Well keeps what will still matter next month: how you like your reports, your role, your fiscal year, the decisions your business has made.

A fact about you stays yours. A fact about the business is shared with your team. Ask "what do you know about me" and Well lists both, so you can correct a line or remove it.

When Well learns from a session, it is told to skip a password, a bank or card number, an id number or health information, even when you type one. A line you add or approve yourself is saved as you write it. And a memory line never changes what Well may do on its own: sending, paying or changing anything still needs your yes.

## Required data in Well

- **A Well workspace** (required). Memory is kept per workspace: what you tell Well in one workspace stays in that workspace.

## FAQ

**Q: What does Well remember?**
A: Durable facts and preferences: how you like your reports, your role, your fiscal year, a decision such as which bank pays suppliers. It skips small talk, one-off questions and figures it can read live from your data.

**Q: Who sees what Well remembers?**
A: A fact about you is yours alone. A fact about the business is shared with everyone in the workspace, and an owner or admin can remove it.

**Q: Can I tell Well to stop asking before it sends?**
A: Not through memory. Whether Well asks before it sends or changes something is an action level, set one kind of action at a time: ask Well, or open Settings > Profile > Actions Well can take alone. Payments always ask. A memory line never changes it.

---

## Installation

The file under `skills/memory/SKILL.md` is a shell: it carries the skill's name and description, and loads the instructions from Well's MCP server with `well_get_skill` when the skill runs. Install it once; it never goes stale.

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

[⬇ Install memory](https://github.com/WellApp-ai/skills/raw/main/dist/memory.skill) and open the downloaded file. Desktop installs the skill straight away, with nothing to unzip.

### Assisted by AI

Paste this into any AI agent (Claude, Codex, Cursor, OpenCode, and others):

```
Install the following official skill from Well. Instructions:

1. Fetch this file:
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/memory/SKILL.md
2. Save it as a file named exactly "SKILL.md" inside a folder named "memory". No prefix, no suffix.
3. Install this skill.
4. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill memory
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
