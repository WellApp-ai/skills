<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Pick the workspace

**Pin the one company account every following answer reads from.**

## What it does

Most founders run more than one legal entity in Well — a French SAS and a US Inc., a holding and an operating company. Before any question about invoices, cash, or a period makes sense, your AI assistant has to know which one you mean. This skill reads the workspaces your Well connection is authorized on, resolves a single one — or several: pick more than one entity and every skill that follows runs once per workspace, in your order, never mixing their data — silently when there is only one, from your hint when it matches ("use my US entity"), or from a one-line pick on the workspace card otherwise — then pins it as your connection's standing default and hands the choice on, so every later call stays inside that workspace. It is the first brick of Well's fetch-missing-invoices and close-books flows, and the step every other Well skill runs before it reads a number.

## Required data in Well

- **A Well account with at least one workspace** (required). The workspace is the company account itself. Nothing else has to be connected to pick one.

## FAQ

**Q: Do I have to run this myself?**
A: Usually not. Every other skill invokes it when it needs a workspace. You would run it directly to switch entities.

**Q: Can it do several companies at once?**
A: Yes. Ask for both entities and it pins one and queues the rest, so the following skill walks them one at a time.

**Q: Is this the same as my own company?**
A: No. The workspace is the account you work in. Which legal entity inside it is yours is a separate confirmation.

---

## Installation

The file under `skills/define-workspace/SKILL.md` is a shell: it carries the skill's name and description, and loads the instructions from Well's MCP server with `well_get_skill` when the skill runs. Install it once; it never goes stale.

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
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/define-workspace/SKILL.md
2. Save it as a file named exactly "SKILL.md" inside a folder named "define-workspace". No prefix, no suffix.
3. Install this skill.
4. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill define-workspace
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
