<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Check your connections

**See what is connected, what is syncing, and what is missing.**

## What it does

Every grounded answer rests on what is connected. This skill reads the live connection state of a workspace from Well's connector catalog in one call — which bank accounts, accounting software, and invoicing or payment portals are connected, still running their first sync, or in error — and, for whatever is missing, hands your AI assistant Well's one-click install links (in Claude Desktop, the connect card itself, never a table of records). It reports a plain coverage line — bank connected, accounting needs a reconnect, invoicing missing — and then stops on the card: you connect what is missing and click Continue, and that click is what moves the flow on. It is step two of Well's fetch-missing-invoices flow, ahead of the dedicated `connect-bank` step where that skill is installed. It runs a second time later in that flow, after you pick the vendors to chase, where it scopes the card to the tools behind the vendors you picked instead of the whole catalog. It is also the connector check every Well data skill relies on.

## Required data in Well

- **A Well workspace** (required). The check runs against one workspace, so the workspace is pinned before it reads anything.

## FAQ

**Q: Why does this run before other skills?**
A: So an answer is never built on half your data. If something is missing, you are told what to connect instead of getting a number that quietly excludes it.

**Q: Does it connect things for me?**
A: It hands you the one-click link. The connecting itself happens in Well, where you sign in to the provider.

**Q: What counts as syncing?**
A: A source that is connected but still pulling its first history. It is reported separately from live, because its data is not complete yet.

---

## Installation

The file under `skills/connect-tools/SKILL.md` is a shell: it carries the skill's name and description, and loads the instructions from Well's MCP server with `well_get_skill` when the skill runs. Install it once; it never goes stale.

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

### Assisted by AI

Paste this into any AI agent (Claude, Codex, Cursor, OpenCode, and others):

```
Install the following official skill from Well. Instructions:

1. Fetch this file:
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/connect-tools/SKILL.md
2. Save it as a file named exactly "SKILL.md" inside a folder named "connect-tools". No prefix, no suffix.
3. Install this skill.
4. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill connect-tools
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
