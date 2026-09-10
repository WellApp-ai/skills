<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Connect your accounting

**Get your accounting tool connected, and confirm the feed is live.**

## What it does

A richer close and a posted-ledger view rest on the accounting feed. This skill reads whether a workspace has an accounting system connected — live and syncing, still running its first pass, or expired and needing a reconnect — and, when it is missing, hands your AI assistant Well's one-click install link (in Claude Desktop, a connect card showing accounting tools only: Pennylane, QuickBooks, Xero, Sage, and the rest). The card is pick-one — a single accounting system, not several. Once it lands it re-checks on its own and moves the flow forward, then reports one plain line: connected, connecting, needs a reconnect, or not connected. It is the dedicated accounting step of Well's close-the-books flow, right after the bank — but the close never blocks on it, so the step is always skippable.

## Required data in Well

- **A Well workspace** (required). The accounting connection belongs to a workspace, so the workspace is pinned first.

## FAQ

**Q: Which accounting tools does it cover?**
A: Well's own accounting catalog, Pennylane, QuickBooks, Xero and Sage among them. Search by name for a tool the default view does not show.

**Q: Can I pick more than one?**
A: No. The accounting card is pick-one, because a workspace keeps one ledger.

**Q: Does the close stop without it?**
A: No. Accounting makes a close richer, never mandatory, so you can skip this step and carry on.

---

## Installation

The file under `skills/connect-accounting/SKILL.md` is a shell: it carries the skill's name and description, and loads the instructions from Well's MCP server with `well_get_skill` when the skill runs. Install it once; it never goes stale.

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
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/connect-accounting/SKILL.md
2. Save it as a file named exactly "SKILL.md" inside a folder named "connect-accounting". No prefix, no suffix.
3. Install this skill.
4. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill connect-accounting
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
