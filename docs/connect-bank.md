<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Connect your bank

**Get the bank feed in, and confirm it is really live.**

## What it does

Every grounded answer about spend rests on the bank feed. This skill reads which banks a workspace has connected — live and syncing, still running their first pass, or expired and needing a reconnect — and, when the feed is missing, hands your AI assistant Well's one-click bank install link (in Claude Desktop, a connect card showing banks only). Once the bank lands it re-checks on its own and moves the flow forward, then reports one plain line: connected, connecting, needs a reconnect, or not connected. It is the dedicated bank step of Well's fetch-missing-invoices flow, asked before the month when no month on the period picker holds a bank transaction and after the month when one you picked holds none, because settled bank spend is what every missing invoice is measured against.

## Required data in Well

- **A Well workspace** (required). The bank feeds belong to a workspace, so the workspace is pinned first.

## FAQ

**Q: How is this different from checking all tools?**
A: This is the bank-only step, with per-account detail. The broader check covers accounting and invoicing as well.

**Q: Why are my transactions missing?**
A: Usually a feed that is still on its first sync or one whose access expired. The skill names which, rather than leaving you to guess.

**Q: Can it force a re-sync?**
A: No. It reports the state and gets a missing feed connected. Forcing a sync is done in Well.

---

## Installation

The file under `skills/connect-bank/SKILL.md` is a shell: it carries the skill's name and description, and loads the instructions from Well's MCP server with `well_get_skill` when the skill runs. Install it once; it never goes stale.

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
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/connect-bank/SKILL.md
2. Save it as a file named exactly "SKILL.md" inside a folder named "connect-bank". No prefix, no suffix.
3. Install this skill.
4. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill connect-bank
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
