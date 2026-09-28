<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Build your context graph

**Connect your AI apps and your tools, then see your business as one context graph.**

## What it does

Your context graph is what Well knows about your business: the companies you work with, the people behind them, your accounts and the transactions that link them. This skill builds it from nothing in a few clicks. When none of your AI apps talks to Well yet, it first shows the card that connects one. Then it shows Well's connect card for your bank, accounting and invoicing sources, where you connect what you want and skip the rest. It recaps each source in one line, connected or skipped, and says that what you connected now flows into the context graph. It ends by drawing the graph itself, an interactive canvas you can orbit, zoom and hover. It reads connection state and draws; it computes no figure and changes no record.

## Required data in Well

- **A Well workspace** (required). The graph belongs to one workspace, so the workspace is pinned before anything is connected or drawn.

## FAQ

**Q: What is the context graph?**
A: A map of your business data in Well: companies, people, accounts and transactions, and the links between them. Every source you connect adds to it.

**Q: Do I have to connect every tool?**
A: No. Connect what you use and skip the rest. The recap names each source as connected or skipped, and you can connect more later.

**Q: Why is my graph small right after I connect?**
A: A new source runs its first sync before its records land. The graph fills in as that sync finishes, so draw it again later to see more.

---

## Installation

The file under `skills/context-graph/SKILL.md` is a shell: it carries the skill's name and description, and loads the instructions from Well's MCP server with `well_get_skill` when the skill runs. Install it once; it never goes stale.

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

[⬇ Install context-graph](https://github.com/WellApp-ai/skills/raw/main/dist/context-graph.skill) and open the downloaded file. Desktop installs the skill straight away, with nothing to unzip.

### Assisted by AI

Paste this into any AI agent (Claude, Codex, Cursor, OpenCode, and others):

```
Install the following official skill from Well. Instructions:

1. Fetch this file:
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/context-graph/SKILL.md
2. Save it as a file named exactly "SKILL.md" inside a folder named "context-graph". No prefix, no suffix.
3. Install this skill.
4. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill context-graph
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
